import {
  useMemo,
  useState,
} from "react";

import PlayArrowIcon
  from "@mui/icons-material/PlayArrow";

import StopIcon
  from "@mui/icons-material/Stop";

import RefreshIcon
  from "@mui/icons-material/Refresh";

import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CircularProgress,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import axios from "axios";

import {
  getStreamStatus,
  startStream,
  stopStream,
} from "../../api/streams";

import { useAuth }
  from "../../auth/useAuth";

import { MetricItem }
  from "../../components/MetricItem";

import { StreamStatusChip }
  from "../../components/StreamStatusChip";

import type {
  StreamItem,
} from "../../types/stream";

interface StreamCardProps {
  stream: StreamItem;
}

const providerLabels: Record<
  string,
  string
> = {
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  vimeo: "Vimeo",
  custom: "Прямая ссылка",
  unknown: "Неизвестно",
};

function formatBitrate(
  bitrateKbps:
    number | null | undefined,
): string {
  if (
    bitrateKbps === null
    || bitrateKbps === undefined
  ) {
    return "—";
  }

  if (bitrateKbps >= 1000) {
    return (
      `${(
        bitrateKbps / 1000
      ).toFixed(2)} Mbps`
    );
  }

  return `${bitrateKbps.toFixed(0)} Kbps`;
}

function formatUptime(
  seconds:
    number | null | undefined,
): string {
  if (
    seconds === null
    || seconds === undefined
  ) {
    return "—";
  }

  const totalSeconds =
    Math.max(
      0,
      Math.floor(seconds),
    );

  const hours =
    Math.floor(
      totalSeconds / 3600,
    );

  const minutes =
    Math.floor(
      (
        totalSeconds % 3600
      ) / 60,
    );

  const remainingSeconds =
    totalSeconds % 60;

  return [
    hours,
    minutes,
    remainingSeconds,
  ]
    .map((value) =>
      String(value).padStart(
        2,
        "0",
      ),
    )
    .join(":");
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
      && typeof detail.message
        === "string"
    ) {
      return detail.message;
    }
  }

  return (
    "Операция не выполнена. "
    + "Проверьте состояние потока."
  );
}

export function StreamCard({
  stream,
}: StreamCardProps) {
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

  const statusQuery = useQuery({
    queryKey: [
      "stream-status",
      stream.id,
    ],

    queryFn: () =>
      getStreamStatus(
        stream.id,
      ),

    refetchInterval: 5_000,

    /*
     * В скрытой вкладке браузера
     * тоже продолжаем обновлять статус.
     */
    refetchIntervalInBackground:
      true,

    retry: 1,
  });

  const invalidateStreamData =
    async () => {
      await Promise.all([
        queryClient
          .invalidateQueries({
            queryKey: [
              "streams",
            ],
          }),

        queryClient
          .invalidateQueries({
            queryKey: [
              "stream-status",
              stream.id,
            ],
          }),
      ]);
    };

  const startMutation =
    useMutation({
      mutationFn: () =>
        startStream(
          stream.id,
        ),

      onMutate: () => {
        setActionError(null);
      },

      onSuccess: async () => {
        await invalidateStreamData();
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
        stopStream(
          stream.id,
        ),

      onMutate: () => {
        setActionError(null);
      },

      onSuccess: async () => {
        await invalidateStreamData();
      },

      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

  const runtime =
    statusQuery.data;

  const metrics =
    runtime?.metrics;

  const effectiveStatus =
    runtime?.database_status
    ?? stream.status;

  const isRunning =
    runtime?.process_alive
    ?? (
      effectiveStatus
      === "running"
    );

  const actionPending =
    startMutation.isPending
    || stopMutation.isPending;

  const sourceFps = useMemo(
    () => {
      const fps =
        metrics?.fps
        ?? metrics?.source_fps;

      if (
        fps === null
        || fps === undefined
        || fps <= 0
      ) {
        return "—";
      }

      return fps.toFixed(1);
    },
    [
      metrics?.fps,
      metrics?.source_fps,
    ],
  );

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border:
          "1px solid "
          + "rgba(255,255,255,0.08)",
      }}
    >
      <CardContent
        sx={{
          flexGrow: 1,
        }}
      >
        <Stack spacing={2.25}>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "flex-start",
              justifyContent:
                "space-between",
            }}
          >
            <Box
              sx={{
                minWidth: 0,
              }}
            >
              <Typography
                variant="h6"
                component="h2"
                noWrap
                title={stream.name}
              >
                {stream.name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {providerLabels[
                  stream.provider
                ] ?? stream.provider}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={0.5}
              sx={{
                alignItems: "center",
              }}
            >
              <StreamStatusChip
                status={
                  effectiveStatus
                }
              />

              <Tooltip title="Обновить">
                <span>
                  <IconButton
                    size="small"
                    disabled={
                      statusQuery
                        .isFetching
                    }
                    onClick={() => {
                      void statusQuery
                        .refetch();
                    }}
                  >
                    {statusQuery
                      .isFetching
                      ? (
                        <CircularProgress
                          size={18}
                        />
                      )
                      : (
                        <RefreshIcon
                          fontSize="small"
                        />
                      )}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          {stream.description && (
            <Typography
              variant="body2"
              color="text.secondary"
            >
              {stream.description}
            </Typography>
          )}

          {statusQuery.isError && (
            <Alert severity="error">
              Не удалось получить
              текущий статус потока.
            </Alert>
          )}

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

          <Divider />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "repeat(2, minmax(0, 1fr))",
                sm: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <MetricItem
              label="Разрешение"
              value={
                metrics?.resolution
                ?? "—"
              }
            />

            <MetricItem
              label="FPS"
              value={sourceFps}
            />

            <MetricItem
              label="Битрейт"
              value={formatBitrate(
                metrics
                  ?.bitrate_kbps,
              )}
            />

            <MetricItem
              label="Скорость"
              value={
                metrics?.speed
                ?.trim()
                ?? "—"
              }
            />

            <MetricItem
              label="Время работы"
              value={formatUptime(
                metrics
                  ?.uptime_seconds,
              )}
            />

            <MetricItem
              label="Пропущено кадров"
              value={String(
                metrics
                  ?.drop_frames
                ?? 0,
              )}
            />
          </Box>

          {(stream.source_url
            || stream
              .destination_rtmp_url
          ) && (
            <>
              <Divider />

              <Stack spacing={1.5}>
                {stream.source_url && (
                  <MetricItem
                    label="Источник"
                    value={
                      stream.source_url
                    }
                  />
                )}

                {stream
                  .destination_rtmp_url
                  && (
                    <MetricItem
                      label="Назначение"
                      value={
                        stream
                          .destination_rtmp_url
                      }
                    />
                  )}
              </Stack>
            </>
          )}

          {runtime?.latest_session
            ?.error_message
            && (
              <Alert severity="warning">
                {
                  runtime.latest_session
                    .error_message
                }
              </Alert>
            )}
        </Stack>
      </CardContent>

      {canControl && (
        <CardActions
          sx={{
            px: 2,
            pb: 2,
            pt: 0,
          }}
        >
          <Button
            variant="contained"
            color="success"
            startIcon={
              startMutation
                .isPending
                ? (
                  <CircularProgress
                    size={17}
                    color="inherit"
                  />
                )
                : (
                  <PlayArrowIcon />
                )
            }
            disabled={
              actionPending
              || isRunning
              || !stream.enabled
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
            startIcon={
              stopMutation
                .isPending
                ? (
                  <CircularProgress
                    size={17}
                    color="inherit"
                  />
                )
                : <StopIcon />
            }
            disabled={
              actionPending
              || !isRunning
            }
            onClick={() => {
              stopMutation.mutate();
            }}
          >
            Остановить
          </Button>
        </CardActions>
      )}
    </Card>
  );
}
