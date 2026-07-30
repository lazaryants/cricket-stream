import asyncio
from typing import Any

from fastapi import WebSocket
from fastapi.encoders import (
    jsonable_encoder,
)


class RuntimeConnectionManager:
    def __init__(self) -> None:
        self._connections: set[
            WebSocket
        ] = set()

        self._lock = asyncio.Lock()

    @property
    def connection_count(
        self,
    ) -> int:
        return len(
            self._connections
        )

    async def connect(
        self,
        websocket: WebSocket,
    ) -> None:
        await websocket.accept(
            subprotocol="access_token"
        )

        async with self._lock:
            self._connections.add(
                websocket
            )

    async def disconnect(
        self,
        websocket: WebSocket,
    ) -> None:
        async with self._lock:
            self._connections.discard(
                websocket
            )

    async def send(
        self,
        websocket: WebSocket,
        message: dict[str, Any],
    ) -> None:
        await websocket.send_json(
            jsonable_encoder(
                message
            )
        )

    async def broadcast(
        self,
        message: dict[str, Any],
    ) -> None:
        async with self._lock:
            connections = tuple(
                self._connections
            )

        if not connections:
            return

        encoded = jsonable_encoder(
            message
        )

        disconnected: list[
            WebSocket
        ] = []

        for websocket in connections:
            try:
                await websocket.send_json(
                    encoded
                )
            except Exception:
                disconnected.append(
                    websocket
                )

        if disconnected:
            async with self._lock:
                for websocket in disconnected:
                    self._connections.discard(
                        websocket
                    )


runtime_connection_manager = (
    RuntimeConnectionManager()
)
