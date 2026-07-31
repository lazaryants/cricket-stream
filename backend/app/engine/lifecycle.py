import asyncio
import logging
from time import monotonic

from sqlalchemy import select

from app.core.database import AsyncSessionLocal

from app.models.stream_session import StreamSession
from app.models.stream import Stream

from app.models.enums import (
    StreamStatus,
    StreamSessionStatus,
)

from app.engine.manager import stream_manager
from app.engine.logs import log_buffer



logger = logging.getLogger("lifecycle")

RESTART_DELAYS = (
    5,
    10,
    20,
    40,
    60,
)

STABLE_RESET_SECONDS = 120

# Состояние хранится только в памяти backend.
# После перезапуска backend счётчики начинаются заново.
_restart_attempts: dict[int, int] = {}
_healthy_since: dict[int, float] = {}

# Одна отложенная задача автоперезапуска на один stream_id.
_restart_tasks: dict[int, asyncio.Task] = {}


def _restart_delay(
    stream_id: int,
) -> tuple[int, int]:
    """
    Возвращает номер попытки и задержку перед рестартом.
    После достижения максимума задержка остаётся 60 секунд.
    """
    attempt = _restart_attempts.get(
        stream_id,
        0,
    )

    delay_index = min(
        attempt,
        len(RESTART_DELAYS) - 1,
    )

    delay = RESTART_DELAYS[
        delay_index
    ]

    _restart_attempts[stream_id] = (
        attempt + 1
    )

    return attempt + 1, delay


def _mark_healthy(
    stream_id: int,
) -> None:
    """
    После длительной стабильной работы сбрасывает backoff.
    """
    now = monotonic()

    started = _healthy_since.setdefault(
        stream_id,
        now,
    )

    if (
        now - started
        >= STABLE_RESET_SECONDS
    ):
        if _restart_attempts.get(
            stream_id,
            0,
        ):
            print(
                f"[SUPERVISOR] "
                f"stable stream={stream_id}; "
                f"restart backoff reset",
                flush=True,
            )

        _restart_attempts.pop(
            stream_id,
            None,
        )

        # Начинаем новый стабильный интервал.
        _healthy_since[
            stream_id
        ] = now


def _mark_unhealthy(
    stream_id: int,
) -> None:
    _healthy_since.pop(
        stream_id,
        None,
    )


async def restore_streams():

    logger.info("[LIFECYCLE] Restoring streams")

    async with AsyncSessionLocal() as db:

        result = await db.execute(
            select(StreamSession)
            .where(
                StreamSession.status ==
                StreamSessionStatus.running
            )
        )

        sessions = result.scalars().all()


        if not sessions:

            logger.info(
                "[LIFECYCLE] No streams to restore"
            )

            return


        for session in sessions:

            stream_result = await db.execute(
                select(Stream)
                .where(
                    Stream.id ==
                    session.stream_id
                )
            )

            stream = (
                stream_result.scalar_one_or_none()
            )


            if not stream:
                continue


            try:

                pid = await stream_manager.start(
                    stream,
                    session_uuid=session.uuid,
                )


                session.process_id = str(pid)

                session.status = (
                    StreamSessionStatus.running
                )

                stream.status = (
                    StreamStatus.RUNNING
                )


                logger.info(
                    f"[LIFECYCLE] restored "
                    f"stream={stream.id} pid={pid}"
                )


            except Exception as e:

                session.status = (
                    StreamSessionStatus.error
                )

                stream.status = (
                    StreamStatus.ERROR
                )

                session.error_message = str(e)


                logger.error(
                    f"[LIFECYCLE] restore failed "
                    f"stream={stream.id}: {e}"
                )


        await db.commit()


def cancel_restart(
    stream_id: int,
    *,
    reset_backoff: bool = True,
) -> bool:
    """
    Отменяет запланированный автоматический рестарт.

    Функцию можно безопасно вызывать из ручного start/stop.
    """
    task = _restart_tasks.pop(
        stream_id,
        None,
    )

    cancelled = False

    if task is not None and not task.done():
        task.cancel()
        cancelled = True

        print(
            f"[SUPERVISOR] "
            f"pending restart cancelled "
            f"stream={stream_id}",
            flush=True,
        )

    if reset_backoff:
        _restart_attempts.pop(
            stream_id,
            None,
        )
        _healthy_since.pop(
            stream_id,
            None,
        )

    return cancelled


def _restart_task_finished(
    stream_id: int,
    task: asyncio.Task,
) -> None:
    """
    Удаляет завершённую задачу из реестра.

    Проверка identity не позволяет старой задаче удалить
    новую задачу того же потока.
    """
    current = _restart_tasks.get(
        stream_id
    )

    if current is task:
        _restart_tasks.pop(
            stream_id,
            None,
        )

    if task.cancelled():
        return

    try:
        exception = task.exception()
    except asyncio.CancelledError:
        return

    if exception is not None:
        print(
            f"[SUPERVISOR] "
            f"restart task exception "
            f"stream={stream_id}: "
            f"{exception}",
            flush=True,
        )


def _schedule_restart(
    *,
    session_id: int,
    stream_id: int,
    expected_pid: str | None,
) -> None:
    """
    Создаёт не более одной restart-задачи для stream_id.
    """
    existing = _restart_tasks.get(
        stream_id
    )

    if existing is not None and not existing.done():
        return

    task = asyncio.create_task(
        _restart_stream(
            session_id=session_id,
            stream_id=stream_id,
            expected_pid=expected_pid,
        ),
        name=(
            f"stream-restart-{stream_id}"
        ),
    )

    _restart_tasks[stream_id] = task

    task.add_done_callback(
        lambda completed_task: (
            _restart_task_finished(
                stream_id,
                completed_task,
            )
        )
    )


async def _restart_stream(
    *,
    session_id: int,
    stream_id: int,
    expected_pid: str | None,
) -> None:
    """
    Ожидает backoff и перезапускает конкретный поток.

    Каждый поток ждёт в собственной asyncio.Task, поэтому
    Kick с задержкой 60 секунд не блокирует Twitch/YouTube.
    """
    attempt, delay = _restart_delay(
        stream_id
    )

    print(
        f"[SUPERVISOR] "
        f"restart scheduled "
        f"stream={stream_id} "
        f"attempt={attempt} "
        f"delay={delay}s",
        flush=True,
    )

    log_buffer.add(
        stream_id,
        (
            "Automatic restart scheduled "
            f"attempt={attempt} "
            f"delay={delay}s"
        ),
    )

    try:
        await asyncio.sleep(
            delay
        )

        async with AsyncSessionLocal() as db:
            session_result = await db.execute(
                select(StreamSession)
                .where(
                    StreamSession.id
                    == session_id
                )
            )

            session = (
                session_result
                .scalar_one_or_none()
            )

            if session is None:
                print(
                    f"[SUPERVISOR] "
                    f"restart cancelled "
                    f"stream={stream_id}; "
                    f"session not found",
                    flush=True,
                )
                return

            # В текущей модели поле StreamSession.status
            # отображается через StreamStatus.
            #
            # Поэтому после чтения из БД ожидаем
            # StreamStatus.RUNNING.
            if (
                session.status
                != StreamStatus.RUNNING
            ):
                print(
                    f"[SUPERVISOR] "
                    f"restart cancelled "
                    f"stream={stream_id}; "
                    f"session status="
                    f"{session.status}",
                    flush=True,
                )
                return

            current_pid = (
                str(session.process_id)
                if session.process_id
                else None
            )

            normalized_expected_pid = (
                str(expected_pid)
                if expected_pid
                else None
            )

            # Если PID изменился, значит поток уже был
            # вручную или другим механизмом перезапущен.
            if (
                current_pid
                != normalized_expected_pid
            ):
                print(
                    f"[SUPERVISOR] "
                    f"restart cancelled "
                    f"stream={stream_id}; "
                    f"PID changed "
                    f"old={normalized_expected_pid} "
                    f"current={current_pid}",
                    flush=True,
                )
                return

            stream_result = await db.execute(
                select(Stream)
                .where(
                    Stream.id
                    == stream_id
                )
            )

            stream = (
                stream_result
                .scalar_one_or_none()
            )

            if stream is None:
                print(
                    f"[SUPERVISOR] "
                    f"restart cancelled "
                    f"stream={stream_id}; "
                    f"stream not found",
                    flush=True,
                )
                return

            stream.status = (
                StreamStatus.RESTARTING
            )

            session.error_message = (
                "Automatic restart "
                f"attempt={attempt}"
            )

            await db.commit()

            try:
                new_pid = (
                    await stream_manager.start(
                        stream,
                        session_uuid=session.uuid,
                    )
                )

            except Exception as exc:
                # Оставляем session running, поскольку
                # пользователь всё ещё хочет держать
                # этот поток включённым.
                session.status = (
                    StreamStatus.RUNNING
                )
                session.process_id = None
                session.error_message = (
                    "Automatic restart "
                    f"attempt={attempt} "
                    f"failed: {exc}"
                )

                stream.status = (
                    StreamStatus.RESTARTING
                )

                await db.commit()

                log_buffer.add(
                    stream_id,
                    (
                        "Automatic restart failed "
                        f"attempt={attempt}: {exc}"
                    ),
                )

                print(
                    f"[SUPERVISOR] "
                    f"restart failed "
                    f"stream={stream_id} "
                    f"attempt={attempt}: "
                    f"{exc}",
                    flush=True,
                )

                return

            # Повторно блокируем и читаем сессию:
            # за время stream_manager.start() пользователь
            # мог нажать Stop.
            await db.refresh(
                session
            )

            if (
                session.status
                != StreamStatus.RUNNING
            ):
                await stream_manager.stop(
                    stream_id,
                    new_pid,
                )

                print(
                    f"[SUPERVISOR] "
                    f"new process stopped because "
                    f"session changed "
                    f"stream={stream_id} "
                    f"status={session.status}",
                    flush=True,
                )
                return

            session.process_id = str(
                new_pid
            )
            session.error_message = None

            stream.status = (
                StreamStatus.RUNNING
            )

            await db.commit()

            _healthy_since[
                stream_id
            ] = monotonic()

            log_buffer.add(
                stream_id,
                (
                    "Automatic restart succeeded "
                    f"attempt={attempt} "
                    f"PID={new_pid}"
                ),
            )

            print(
                f"[SUPERVISOR] "
                f"restart OK "
                f"stream={stream_id} "
                f"attempt={attempt} "
                f"pid={new_pid}",
                flush=True,
            )

    except asyncio.CancelledError:
        print(
            f"[SUPERVISOR] "
            f"restart task cancelled "
            f"stream={stream_id}",
            flush=True,
        )
        raise


async def monitor_streams():
    print(
        "[SUPERVISOR] Monitor started",
        flush=True,
    )

    while True:
        try:
            async with AsyncSessionLocal() as db:
                result = await db.execute(
                    select(StreamSession)
                    .where(
                        StreamSession.status
                        == StreamStatus.RUNNING
                    )
                    .order_by(
                        StreamSession.created_at.desc(),
                        StreamSession.id.desc(),
                    )
                )

                sessions = list(
                    result.scalars().all()
                )

                # Защита от старых дублирующихся running
                # сессий: для каждого stream_id проверяем
                # только самую новую.
                seen_stream_ids: set[int] = set()

                for session in sessions:
                    stream_id = (
                        session.stream_id
                    )

                    if stream_id in seen_stream_ids:
                        continue

                    seen_stream_ids.add(
                        stream_id
                    )

                    pid = (
                        str(session.process_id)
                        if session.process_id
                        else None
                    )

                    alive = bool(
                        pid
                    ) and stream_manager.pid_alive(
                        pid
                    )

                    if alive:
                        _mark_healthy(
                            stream_id
                        )
                        continue

                    _mark_unhealthy(
                        stream_id
                    )

                    existing_task = (
                        _restart_tasks.get(
                            stream_id
                        )
                    )

                    if (
                        existing_task is not None
                        and not existing_task.done()
                    ):
                        continue

                    print(
                        f"[SUPERVISOR] "
                        f"dead or missing ffmpeg "
                        f"pid={pid} "
                        f"stream={stream_id}",
                        flush=True,
                    )

                    stream_result = await db.execute(
                        select(Stream)
                        .where(
                            Stream.id
                            == stream_id
                        )
                    )

                    stream = (
                        stream_result
                        .scalar_one_or_none()
                    )

                    if stream is None:
                        continue

                    stream.status = (
                        StreamStatus.RESTARTING
                    )

                    session.error_message = (
                        "FFmpeg process stopped "
                        "unexpectedly; automatic "
                        "restart scheduled"
                    )

                    await db.commit()

                    _schedule_restart(
                        session_id=session.id,
                        stream_id=stream_id,
                        expected_pid=pid,
                    )

        except asyncio.CancelledError:
            print(
                "[SUPERVISOR] Monitor stopping",
                flush=True,
            )

            tasks = list(
                _restart_tasks.values()
            )

            for task in tasks:
                if not task.done():
                    task.cancel()

            if tasks:
                await asyncio.gather(
                    *tasks,
                    return_exceptions=True,
                )

            _restart_tasks.clear()

            print(
                "[SUPERVISOR] Monitor stopped",
                flush=True,
            )
            raise

        except Exception as exc:
            print(
                "[SUPERVISOR ERROR]",
                exc,
                flush=True,
            )

        await asyncio.sleep(10)


async def shutdown_streams():

    logger.info(
        "[LIFECYCLE] Stopping streams..."
    )


    await stream_manager.stop_all()


    logger.info(
        "[LIFECYCLE] Streams stopped"
    )
