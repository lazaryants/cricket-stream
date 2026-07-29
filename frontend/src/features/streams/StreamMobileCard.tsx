import EditIcon
  from "@mui/icons-material/Edit";
import OpenInNewIcon
  from "@mui/icons-material/OpenInNew";
import PlayArrowIcon
  from "@mui/icons-material/PlayArrow";
import StopIcon
  from "@mui/icons-material/Stop";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  Link,
} from "react-router";
import {
  getStreamDiagnostics,
  startStream,
  stopStream,
  updateStream,
} from "../../api/streams";
import { StreamDiagnosticChip }
  from "../../components/StreamDiagnosticChip";
import { StreamStatusChip }
  from "../../components/StreamStatusChip";
import type {
  StreamItem,
  StreamRuntimeStatus,
} from "../../types/stream";
import {
  useState,
} from "react";

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

interface StreamMobileCardProps {
  stream: StreamItem;
  runtime:
    StreamRuntimeStatus | undefined;
  canManage: boolean;
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
    + "Проверьте состояние трансляции."
  );
}

function getEffectiveStatus(
  stream: StreamItem,
  runtime:
    StreamRuntimeStatus | undefined,
): string {
  return (
    runtime?.database_status
    ?? stream.status
  );
}

function isStreamRunning(
  stream: StreamItem,
  runtime:
    StreamRuntimeStatus | undefined,
): boolean {
  if (
    runtime?.process_alive
    !== undefined
  ) {
    return runtime.process_alive;
  }

  const status =
    getEffectiveStatus(
      stream,
      runtime,
    );

  return (
    status === "running"
    || status === "starting"
    || status === "restarting"
  );
}

function getStatusBorderColor(
  status: string,
): string {
  switch (status) {
    case "running":
      return "success.main";

    case "starting":
    case "restarting":
    case "stopping":
      return "warning.main";

    case "error":
      return "error.main";

    case "ready":
      return "info.main";

    default:
      return "grey.700";
  }
}

function formatUptime(
  seconds: number | undefined,
): string {
  if (
    seconds === undefined
    || seconds < 0
  ) {
    return "—";
  }

  const totalSeconds =
    Math.floor(seconds);

  const hours =
    Math.floor(totalSeconds / 3600);

  const minutes =
    Math.floor(
      (totalSeconds % 3600) / 60,
    );

  const remainingSeconds =
    totalSeconds % 60;

  return [
    String(hours).padStart(2, "0"),
    String(minutes).padStart(2, "0"),
    String(remainingSeconds)
      .padStart(2, "0"),
  ].join(":");
}

function getMetricsText(
  runtime:
    StreamRuntimeStatus | undefined,
): string {
  const metrics =
    runtime?.metrics;

  if (!metrics) {
    return "Метрики пока недоступны";
  }

  const parts: string[] = [];

  if (metrics.resolution) {
    parts.push(metrics.resolution);
  }

  const fps =
    metrics.source_fps
    ?? metrics.fps;

  if (
    fps !== null
    && fps !== undefined
    && fps > 0
  ) {
    parts.push(
      `${Math.round(fps)} fps`,
    );
  }

  if (
    metrics.bitrate_kbps !== null
    && metrics.bitrate_kbps
      !== undefined
    && metrics.bitrate_kbps > 0
  ) {
    const megabits =
      metrics.bitrate_kbps / 1000;

    parts.push(
      `${megabits.toFixed(1)} Mbps`,
    );
  } else if (metrics.bitrate) {
    parts.push(metrics.bitrate);
  }

  if (parts.length === 0) {
    return "Метрики пока недоступны";
  }

  return parts.join(" · ");
}

export function StreamMobileCard({
  stream,
  runtime,
  canManage,
}: StreamMobileCardProps) {
  const queryClient =
    useQueryClient();

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  const effectiveStatus =
    getEffectiveStatus(
      stream,
      runtime,
    );

  const running =
    isStreamRunning(
      stream,
      runtime,
    );

  const canStop =
    running
    || effectiveStatus === "starting"
    || effectiveStatus === "running"
    || effectiveStatus === "restarting"
    || effectiveStatus === "stopping";

  const diagnosticQuery =
    useQuery({
      queryKey: [
        "stream-diagnostics",
        stream.id,
      ],
      queryFn: () =>
        getStreamDiagnostics(
          stream.id,
        ),
      refetchInterval: 5_000,
      refetchIntervalInBackground:
        true,
      retry: 1,
    });

  async function invalidateData() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "streams",
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "stream-status",
          stream.id,
        ],
      }),

      queryClient.invalidateQueries({
        queryKey: [
          "stream-diagnostics",
          stream.id,
        ],
      }),
    ]);
  }

  const dashboardMutation =
    useMutation({
      mutationFn: (
        showOnDashboard: boolean,
      ) =>
        updateStream(
          stream.id,
          {
            show_on_dashboard:
              showOnDashboard,
          },
        ),

      onMutate: () => {
        setActionError(null);
      },

      onSuccess: async () => {
        await invalidateData();
      },

      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

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
        await invalidateData();
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
        await invalidateData();
      },

      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

  const actionPending =
    dashboardMutation.isPending
    || startMutation.isPending
    || stopMutation.isPending;

  const metrics =
    runtime?.metrics;

  return (
    <Card
      variant="outlined"
      sx={{
        overflow: "hidden",
        borderLeftWidth: 4,
        borderLeftStyle: "solid",
        borderLeftColor:
          getStatusBorderColor(
            effectiveStatus,
          ),
      }}
    >
      <CardContent
        sx={{
          p: 2,
          "&:last-child": {
            pb: 2,
          },
        }}
      >
        <Stack spacing={2}>
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
                flex: 1,
              }}
            >
              <Typography
                component={Link}
                to={
                  `/streams/${stream.id}`
                }
                variant="h6"
                sx={{
                  color: "inherit",
                  display: "block",
                  fontWeight: 700,
                  lineHeight: 1.25,
                  textDecoration: "none",
                  overflowWrap:
                    "anywhere",
                }}
              >
                {stream.name}
              </Typography>

              {stream.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    display: "-webkit-box",
                    overflow: "hidden",
                    WebkitBoxOrient:
                      "vertical",
                    WebkitLineClamp: 2,
                  }}
                >
                  {stream.description}
                </Typography>
              )}
            </Box>

            <StreamStatusChip
              status={
                effectiveStatus
              }
            />
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              flexWrap: "wrap",
              rowGap: 1,
            }}
          >
            <Chip
              size="small"
              variant="outlined"
              label={
                providerLabels[
                  stream.provider
                ] ?? stream.provider
              }
            />

            <Chip
              size="small"
              variant="outlined"
              label={
                `Node #${stream.node_id}`
              }
            />

            <Chip
              size="small"
              color={
                stream.enabled
                  ? "success"
                  : "default"
              }
              variant="outlined"
              label={
                stream.enabled
                  ? "Включена"
                  : "Отключена"
              }
            />
          </Stack>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
            >
              Параметры потока
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 0.25,
                fontWeight: 600,
              }}
            >
              {getMetricsText(runtime)}
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={3}
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                Время работы
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                {formatUptime(
                  metrics
                    ?.uptime_seconds,
                )}
              </Typography>
            </Box>

            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
              >
                ID
              </Typography>

              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                #{stream.id}
              </Typography>
            </Box>
          </Stack>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                mb: 0.75,
              }}
            >
              Диагностика
            </Typography>

            <StreamDiagnosticChip
              diagnostic={
                diagnosticQuery
                  .data
                  ?.diagnostic
              }
              loading={
                diagnosticQuery
                  .isLoading
              }
              error={
                diagnosticQuery
                  .isError
              }
            />
          </Box>

          <Divider />

          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent:
                "space-between",
            }}
          >
            <Box>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                }}
              >
                На Dashboard
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
              >
                Показывать карточку
              </Typography>
            </Box>

            <Switch
              checked={
                stream
                  .show_on_dashboard
              }
              disabled={
                !canManage
                || dashboardMutation
                  .isPending
              }
              onChange={(
                _event,
                checked,
              ) => {
                dashboardMutation
                  .mutate(checked);
              }}
              slotProps={{
                input: {
                  "aria-label":
                    "Показывать на Dashboard",
                },
              }}
            />
          </Stack>

          {canManage && (
            <Button
              fullWidth
              color={
                running
                  ? "error"
                  : "success"
              }
              variant={
                running
                  ? "outlined"
                  : "contained"
              }
              startIcon={
                startMutation.isPending
                || stopMutation.isPending
                  ? (
                    <CircularProgress
                      size={17}
                      color="inherit"
                    />
                  )
                  : running
                    ? <StopIcon />
                    : <PlayArrowIcon />
              }
              disabled={
                actionPending
                || (
                  running
                    ? !canStop
                    : !stream.enabled
                )
              }
              onClick={() => {
                if (running) {
                  stopMutation.mutate();
                } else {
                  startMutation.mutate();
                }
              }}
            >
              {running
                ? "Остановить трансляцию"
                : "Запустить трансляцию"}
            </Button>
          )}

          <Stack
            direction="row"
            spacing={1}
          >
            <Button
              fullWidth
              component={Link}
              to={
                `/streams/${stream.id}`
              }
              variant="contained"
              startIcon={
                <OpenInNewIcon />
              }
            >
              Подробнее
            </Button>

            {canManage && (
              <Button
                component={Link}
                to={
                  `/streams/${stream.id}/edit`
                }
                variant="outlined"
                aria-label="Редактировать"
                sx={{
                  minWidth: 48,
                  px: 1.5,
                }}
              >
                <EditIcon />
              </Button>
            )}
          </Stack>

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
        </Stack>
      </CardContent>
    </Card>
  );
}
