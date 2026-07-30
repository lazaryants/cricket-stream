import {
  useEffect,
  useRef,
} from "react";

import {
  useQueryClient,
} from "@tanstack/react-query";

import {
  tokenStorage,
} from "../api/tokenStorage";

import {
  useAuth,
} from "../auth/useAuth";

import type {
  StreamRuntimeStatus,
} from "../types/stream";


interface RuntimeSnapshotMessage {
  type: "runtime_snapshot";
  streams: StreamRuntimeStatus[];
}


interface RuntimeUpdateMessage {
  type: "runtime_update";
  stream_id: number;
  runtime: StreamRuntimeStatus;
}


interface RuntimeRemovedMessage {
  type: "runtime_removed";
  stream_id: number;
}


interface RuntimeHeartbeatMessage {
  type:
    | "heartbeat"
    | "pong";
}


type RuntimeMessage =
  | RuntimeSnapshotMessage
  | RuntimeUpdateMessage
  | RuntimeRemovedMessage
  | RuntimeHeartbeatMessage;


const RECONNECT_MIN_DELAY = 1_000;
const RECONNECT_MAX_DELAY = 30_000;


function getRuntimeWebSocketUrl(): string {
  const protocol =
    window.location.protocol === "https:"
      ? "wss:"
      : "ws:";

  return (
    `${protocol}//${window.location.host}`
    + "/api/v1/ws/runtime"
  );
}


function isRuntimeMessage(
  value: unknown,
): value is RuntimeMessage {
  if (
    typeof value !== "object"
    || value === null
    || !("type" in value)
  ) {
    return false;
  }

  const messageType =
    (value as {
      type?: unknown;
    }).type;

  return (
    messageType === "runtime_snapshot"
    || messageType === "runtime_update"
    || messageType === "runtime_removed"
    || messageType === "heartbeat"
    || messageType === "pong"
  );
}


export function RuntimeWebSocketBridge() {
  const auth = useAuth();

  const queryClient =
    useQueryClient();

  const socketRef =
    useRef<WebSocket | null>(
      null,
    );

  const reconnectTimerRef =
    useRef<number | null>(
      null,
    );

  const reconnectDelayRef =
    useRef(
      RECONNECT_MIN_DELAY,
    );

  const disposedRef =
    useRef(false);

  useEffect(() => {
    disposedRef.current = false;

    function clearReconnectTimer():
    void {
      if (
        reconnectTimerRef.current
        === null
      ) {
        return;
      }

      window.clearTimeout(
        reconnectTimerRef.current,
      );

      reconnectTimerRef.current =
        null;
    }

    function closeSocket(): void {
      const socket =
        socketRef.current;

      socketRef.current = null;

      if (
        socket
        && socket.readyState
          !== WebSocket.CLOSED
      ) {
        socket.close(
          1000,
          "Client disconnect",
        );
      }
    }

    function updateRuntime(
      runtime: StreamRuntimeStatus,
    ): void {
      queryClient.setQueryData(
        [
          "stream-status",
          runtime.stream_id,
        ],
        runtime,
      );
    }

    function handleMessage(
      event: MessageEvent<string>,
    ): void {
      let parsed: unknown;

      try {
        parsed = JSON.parse(
          event.data,
        );
      } catch {
        console.warn(
          "[runtime-ws] Invalid JSON",
        );

        return;
      }

      if (!isRuntimeMessage(parsed)) {
        console.warn(
          "[runtime-ws] Unknown message",
          parsed,
        );

        return;
      }

      if (
        parsed.type
        === "runtime_snapshot"
      ) {
        for (
          const runtime
          of parsed.streams
        ) {
          updateRuntime(runtime);
        }

        return;
      }

      if (
        parsed.type
        === "runtime_update"
      ) {
        updateRuntime(
          parsed.runtime,
        );

        return;
      }

      if (
        parsed.type
        === "runtime_removed"
      ) {
        queryClient.removeQueries({
          queryKey: [
            "stream-status",
            parsed.stream_id,
          ],
          exact: true,
        });
      }
    }

    function scheduleReconnect():
    void {
      if (
        disposedRef.current
        || !auth.user
        || reconnectTimerRef.current
          !== null
      ) {
        return;
      }

      const delay =
        reconnectDelayRef.current;

      reconnectTimerRef.current =
        window.setTimeout(
          () => {
            reconnectTimerRef.current =
              null;

            connect();
          },
          delay,
        );

      reconnectDelayRef.current =
        Math.min(
          delay * 2,
          RECONNECT_MAX_DELAY,
        );
    }

    function connect(): void {
      if (
        disposedRef.current
        || !auth.user
      ) {
        return;
      }

      const currentSocket =
        socketRef.current;

      if (
        currentSocket
        && (
          currentSocket.readyState
            === WebSocket.OPEN
          || currentSocket.readyState
            === WebSocket.CONNECTING
        )
      ) {
        return;
      }

      const accessToken =
        tokenStorage.getAccessToken();

      if (!accessToken) {
        scheduleReconnect();

        return;
      }

      const socket =
        new WebSocket(
          getRuntimeWebSocketUrl(),
          [
            "access_token",
            accessToken,
          ],
        );

      socketRef.current = socket;

      socket.onopen = () => {
        reconnectDelayRef.current =
          RECONNECT_MIN_DELAY;

        console.info(
          "[runtime-ws] Connected",
        );
      };

      socket.onmessage =
        handleMessage;

      socket.onerror = () => {
        console.warn(
          "[runtime-ws] Connection error",
        );
      };

      socket.onclose = (event) => {
        if (
          socketRef.current
          === socket
        ) {
          socketRef.current =
            null;
        }

        console.info(
          "[runtime-ws] Disconnected",
          {
            code: event.code,
            reason: event.reason,
          },
        );

        if (
          !disposedRef.current
          && auth.user
        ) {
          scheduleReconnect();
        }
      };
    }

    if (auth.user) {
      connect();
    } else {
      closeSocket();
    }

    return () => {
      disposedRef.current = true;

      clearReconnectTimer();
      closeSocket();
    };
  }, [
    auth.user,
    queryClient,
  ]);

  return null;
}
