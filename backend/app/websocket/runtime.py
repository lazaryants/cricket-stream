import asyncio
import json
import logging
from contextlib import suppress
from typing import Any

from fastapi import (
    APIRouter,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.encoders import (
    jsonable_encoder,
)

from app.core.database import (
    AsyncSessionLocal,
)
from app.services.stream_runtime_service import (
    list_serialized_runtimes,
)
from app.websocket.auth import (
    WebSocketAuthenticationError,
    authenticate_websocket,
)
from app.websocket.manager import (
    runtime_connection_manager,
)


logger = logging.getLogger(
    "runtime-websocket"
)

router = APIRouter(
    prefix="/ws",
    tags=["websocket"],
)

PUBLISH_INTERVAL_SECONDS = 1.0
HEARTBEAT_INTERVAL_SECONDS = 20.0


def runtime_fingerprint(
    runtime: dict[str, Any],
) -> str:
    encoded = jsonable_encoder(
        runtime
    )

    return json.dumps(
        encoded,
        sort_keys=True,
        separators=(",", ":"),
    )


async def get_runtime_snapshot(
) -> list[dict[str, Any]]:
    async with AsyncSessionLocal() as db:
        return await list_serialized_runtimes(
            db
        )


class RuntimePublisher:
    def __init__(self) -> None:
        self._previous: dict[
            int,
            str,
        ] = {}

    async def publish_once(
        self,
    ) -> None:
        if (
            runtime_connection_manager
            .connection_count
            == 0
        ):
            self._previous.clear()
            return

        runtimes = (
            await get_runtime_snapshot()
        )

        current: dict[int, str] = {}

        for runtime in runtimes:
            stream_id = int(
                runtime["stream_id"]
            )

            fingerprint = (
                runtime_fingerprint(
                    runtime
                )
            )

            current[
                stream_id
            ] = fingerprint

            if (
                self._previous.get(
                    stream_id
                )
                == fingerprint
            ):
                continue

            await (
                runtime_connection_manager
                .broadcast(
                    {
                        "type": (
                            "runtime_update"
                        ),
                        "stream_id": (
                            stream_id
                        ),
                        "runtime": runtime,
                    }
                )
            )

        removed_stream_ids = (
            set(self._previous)
            - set(current)
        )

        for stream_id in (
            removed_stream_ids
        ):
            await (
                runtime_connection_manager
                .broadcast(
                    {
                        "type": (
                            "runtime_removed"
                        ),
                        "stream_id": (
                            stream_id
                        ),
                    }
                )
            )

        self._previous = current

    async def run(
        self,
    ) -> None:
        logger.info(
            "Runtime WebSocket publisher started"
        )

        try:
            while True:
                try:
                    await self.publish_once()
                except asyncio.CancelledError:
                    raise
                except Exception:
                    logger.exception(
                        "Runtime publish failed"
                    )

                await asyncio.sleep(
                    PUBLISH_INTERVAL_SECONDS
                )
        finally:
            self._previous.clear()

            logger.info(
                "Runtime WebSocket publisher stopped"
            )


runtime_publisher = RuntimePublisher()


@router.websocket(
    "/runtime",
)
async def runtime_websocket(
    websocket: WebSocket,
) -> None:
    try:
        user = (
            await authenticate_websocket(
                websocket
            )
        )
    except WebSocketAuthenticationError:
        await websocket.close(
            code=4401,
            reason="Unauthorized",
        )
        return

    await (
        runtime_connection_manager
        .connect(
            websocket
        )
    )

    logger.info(
        "Runtime WebSocket connected "
        "user=%s connections=%s",
        user.username,
        runtime_connection_manager
        .connection_count,
    )

    try:
        snapshot = (
            await get_runtime_snapshot()
        )

        await (
            runtime_connection_manager
            .send(
                websocket,
                {
                    "type": (
                        "runtime_snapshot"
                    ),
                    "streams": snapshot,
                },
            )
        )

        while True:
            try:
                message = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=(
                        HEARTBEAT_INTERVAL_SECONDS
                    ),
                )

                if message == "ping":
                    await (
                        runtime_connection_manager
                        .send(
                            websocket,
                            {
                                "type": "pong",
                            },
                        )
                    )

            except asyncio.TimeoutError:
                await (
                    runtime_connection_manager
                    .send(
                        websocket,
                        {
                            "type": "heartbeat",
                        },
                    )
                )

    except WebSocketDisconnect:
        pass
    except Exception:
        logger.exception(
            "Runtime WebSocket connection failed"
        )
    finally:
        await (
            runtime_connection_manager
            .disconnect(
                websocket
            )
        )

        with suppress(Exception):
            await websocket.close()

        logger.info(
            "Runtime WebSocket disconnected "
            "connections=%s",
            runtime_connection_manager
            .connection_count,
        )
