import asyncio
import logging

from sqlalchemy import select

from app.core.database import AsyncSessionLocal

from app.models.stream_session import StreamSession
from app.models.stream import Stream

from app.models.enums import (
    StreamStatus,
    StreamSessionStatus,
)

from app.engine.manager import stream_manager


logger = logging.getLogger("lifecycle")


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
                    stream
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


async def monitor_streams():
    print(
        "[SUPERVISOR] Monitor started",
        flush=True
    )

    while True:
        try:
            async with AsyncSessionLocal() as db:

                result = await db.execute(
                    select(StreamSession)
                    .where(
                        StreamSession.status ==
                        StreamSessionStatus.running
                    )
                )

                sessions = result.scalars().all()

                for session in sessions:

                    pid = session.process_id

                    if not pid:
                        continue

                    alive = stream_manager.pid_alive(pid)

                    if alive:
                        continue


                    print(
                        f"[SUPERVISOR] "
                        f"dead ffmpeg pid={pid} "
                        f"stream={session.stream_id}",
                        flush=True
                    )


                    stream_result = await db.execute(
                        select(Stream)
                        .where(
                            Stream.id ==
                            session.stream_id
                        )
                    )

                    stream = (
                        stream_result
                        .scalar_one_or_none()
                    )

                    if not stream:
                        continue


                    stream.status = (
                        StreamStatus.RESTARTING
                    )


                    session.status = (
                        StreamSessionStatus.error
                    )

                    session.error_message = (
                        "FFmpeg process stopped unexpectedly"
                    )


                    await db.commit()


                    #
                    # restart
                    #
                    await asyncio.sleep(5)


                    try:

                        new_pid = await stream_manager.start(
                            stream
                        )


                        new_session = StreamSession(
                            stream_id=stream.id,
                            status=StreamSessionStatus.running,
                            process_id=str(new_pid),
                        )

                        db.add(
                            new_session
                        )


                        stream.status = (
                            StreamStatus.RUNNING
                        )


                        await db.commit()


                        print(
                            f"[SUPERVISOR] "
                            f"restart OK "
                            f"stream={stream.id} "
                            f"pid={new_pid}",
                            flush=True
                        )


                    except Exception as e:

                        stream.status = (
                            StreamStatus.ERROR
                        )

                        await db.commit()

                        print(
                            f"[SUPERVISOR] "
                            f"restart failed "
                            f"{e}",
                            flush=True
                        )


        except Exception as e:

            print(
                "[SUPERVISOR ERROR]",
                e,
                flush=True
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
