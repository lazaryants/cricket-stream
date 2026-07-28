import { useState } from "react";

import PlayArrowIcon
  from "@mui/icons-material/PlayArrow";

import StopIcon
  from "@mui/icons-material/Stop";

import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import axios from "axios";

import {
  startStream,
  stopStream,
} from "../../api/streams";

import { useAuth }
  from "../../auth/useAuth";


interface StreamControlPanelProps {
  streamId: number;
  enabled: boolean;
  processAlive: boolean;
}


function getErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }

    if (
      typeof detail === "object"
      && detail !== null
      && "message" in detail
      && typeof detail.message === "string"
    ) {
      return detail.message;
    }

    if (
      typeof detail === "object"
      && detail !== null
      && "error" in detail
      && typeof detail.error === "string"
    ) {
      return detail.error;
    }
  }

  return (
    "Операция не выполнена. "
    + "Проверьте состояние потока."
  );
}


export function StreamControlPanel({
  streamId,
  enabled,
  processAlive,
}: StreamControlPanelProps) {
  const auth = useAuth();

  const queryClient =
    useQueryClient();

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  const canControl =
    auth.user?.role === "operator"
    || auth.user?.role === "admin"
    || auth.user?.is_superuser;

  async function refreshStreamData() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "streams",
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "stream",
          streamId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "stream-status",
          streamId,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "stream-sessions",
          streamId,
        ],
      }),
    ]);
  }

  const startMutation =
    useMutation({
      mutationFn: () =>
        startStream(streamId),

      onMutate: () => {
        setActionError(null);
      },

      onSuccess: async () => {
        await refreshStreamData();
      },

      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

  const stopMutation =
    useMutation({
      mutationFn: () =>
        stopStream(streamId),

      onMutate: () => {
        setActionError(null);
      },

      onSuccess: async () => {
        await refreshStreamData();
      },

      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

  if (!canControl) {
    return null;
  }

  const actionPending =
    startMutation.isPending
    || stopMutation.isPending;

  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Typography variant="h6">
            Управление трансляцией
          </Typography>

          {actionError && (
            <Alert
              severity="error"
              onClose={() => {
                setActionError(null);
              }}
            >
              {actionError}
            </Alert>
          )}

          {!enabled && (
            <Alert severity="warning">
              Поток отключён в настройках.
              Для запуска его должен включить
              администратор.
            </Alert>
          )}

          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={1.5}
          >
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={
                startMutation.isPending
                  ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  )
                  : <PlayArrowIcon />
              }
              disabled={
                actionPending
                || processAlive
                || !enabled
              }
              onClick={() => {
                startMutation.mutate();
              }}
            >
              Запустить
            </Button>

            <Button
              variant="outlined"
              color="error"
              size="large"
              startIcon={
                stopMutation.isPending
                  ? (
                    <CircularProgress
                      size={18}
                      color="inherit"
                    />
                  )
                  : <StopIcon />
              }
              disabled={
                actionPending
                || !processAlive
              }
              onClick={() => {
                stopMutation.mutate();
              }}
            >
              Остановить
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
