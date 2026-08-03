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
  Link,
  useNavigate,
}
  from "react-router";

import {
  getStreamStatus,
  startStream,
  stopStream,
} from "../../api/streams";

import { useAuth }
  from "../../auth/useAuth";
import { useI18n }
  from "../../i18n/useI18n";

import { MetricItem }
  from "../../components/MetricItem";

import { StreamCardPreview }
  from "./StreamCardPreview";

import { StreamStatusChip }
  from "../../components/StreamStatusChip";

import {
  formatAudioCodec,
  formatDuration,
  formatVideoCodec,
} from "../../utils/streamMetrics";

import type {
  StreamItem,
  StreamRuntimeStatus,
} from "../../types/stream";

interface StreamCardProps {
  stream: StreamItem;
  runtime?: StreamRuntimeStatus;
  runtimeLoading?: boolean;
  runtimeError?: boolean;
  onRuntimeRefresh?: () => void | Promise<void>;
  showDetails?: boolean;
}


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

function getErrorMessage(
  error: unknown,
  fallbackMessage: string,
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

  return fallbackMessage;
}

export function StreamCard({
  stream,
  runtime: externalRuntime,
  runtimeLoading = false,
  runtimeError = false,
  onRuntimeRefresh,
  showDetails = true,
}: StreamCardProps) {
  const {
    t,
  } = useI18n();

  const providerLabels:
    Record<string, string> = {
      youtube: "YouTube",
      twitch: "Twitch",
      kick: "Kick",
      vimeo: "Vimeo",
      custom: t(
        "stream.provider.custom",
      ),
      unknown: t(
        "stream.provider.unknown",
      ),
    };

  const auth = useAuth();
  const navigate = useNavigate();
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

  const usesExternalRuntime =
    onRuntimeRefresh !== undefined;

  const statusQuery = useQuery({
    queryKey: [
      "stream-status",
      stream.id,
    ],

    queryFn: () =>
      getStreamStatus(
        stream.id,
      ),

    enabled:
      !usesExternalRuntime,
    refetchInterval:
      usesExternalRuntime
        ? false
        : 5_000,

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
          getErrorMessage(
            error,
            t(
              "stream.operationError",
            ),
          ),
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
          getErrorMessage(
            error,
            t(
              "stream.operationError",
            ),
          ),
        );
      },
    });

  const runtime =
    usesExternalRuntime
      ? externalRuntime
      : statusQuery.data;

  const statusIsFetching =
    usesExternalRuntime
      ? runtimeLoading
      : statusQuery.isFetching;

  const statusIsError =
    usesExternalRuntime
      ? runtimeError
      : statusQuery.isError;

  async function refreshRuntime() {
    if (onRuntimeRefresh) {
      await onRuntimeRefresh();
      return;
    }

    await statusQuery.refetch();
  }

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

  const hasRuntimeProblem =
    (
      effectiveStatus
      === "running"
      || effectiveStatus
      === "starting"
      || effectiveStatus
      === "restarting"
    )
    && !isRunning;

  const canStop =
    isRunning
    || effectiveStatus
      === "starting"
    || effectiveStatus
      === "running"
    || effectiveStatus
      === "restarting"
    || effectiveStatus
      === "stopping";

  const actionPending =
    startMutation.isPending
    || stopMutation.isPending;

  const sourceFps = useMemo(
    () => {
      const fps =
        metrics?.source_fps
        ?? metrics?.fps;

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
      metrics?.source_fps,
      metrics?.fps,
    ],
  );

  function openDetailsFromCard(
    target: EventTarget | null,
  ): void {
    if (
      target instanceof Element
      && target.closest(
        "button, a, input, select, textarea",
      )
    ) {
      return;
    }

    navigate(`/streams/${stream.id}`);
  }

  return (
    <Card
      role="link"
      tabIndex={0}
      aria-label={t(
        "stream.openDetails",
        {
          name: stream.name,
        },
      )}
      onClick={(event) => {
        openDetailsFromCard(
          event.target,
        );
      }}
      onKeyDown={(event) => {
        if (
          event.key !== "Enter"
          && event.key !== " "
        ) {
          return;
        }

        if (event.target !== event.currentTarget) {
          return;
        }

        event.preventDefault();
        navigate(`/streams/${stream.id}`);
      }}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border:
          "1px solid "
          + "rgba(255,255,255,0.08)",
        cursor: "pointer",
        transition:
          "border-color 150ms ease, "
          + "transform 150ms ease",
        "&:hover": {
          borderColor: "primary.main",
          transform: "translateY(-1px)",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      <StreamCardPreview
        streamId={stream.id}
        processAlive={isRunning}
      />

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

              <Tooltip
                title={t(
                  "common.refresh",
                )}
              >
                <span>
                  <IconButton
                    size="small"
                    disabled={
                      statusIsFetching
                    }
                    onClick={() => {
                      void refreshRuntime();
                    }}
                  >
                    {statusIsFetching
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

          {statusIsError && (
            <Alert severity="error">
              {t(
                "stream.statusError",
              )}
            </Alert>
          )}

          {hasRuntimeProblem && (
            <Alert
              severity="warning"
            >
              {t(
                "stream.sourceUnavailable",
              )}
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
              label={t(
                "metrics.resolution",
              )}
              value={
                metrics?.resolution
                ?? "—"
              }
            />

            <MetricItem
              label={t(
                "metrics.sourceFps",
              )}
              value={sourceFps}
            />

            <MetricItem
              label={t(
                "metrics.outputBitrate",
              )}
              value={formatBitrate(
                metrics
                  ?.bitrate_kbps,
              )}
            />

            <MetricItem
              label={t(
                "metrics.ffmpegSpeed",
              )}
              value={
                metrics?.speed
                ?.trim()
                ?? "—"
              }
            />

            <MetricItem
              label={t(
                "metrics.videoCodec",
              )}
              value={formatVideoCodec(
                metrics,
              )}
            />

            <MetricItem
              label={t(
                "metrics.audioCodec",
              )}
              value={formatAudioCodec(
                metrics,
              )}
            />

            <MetricItem
              label={t(
                "metrics.uptime",
              )}
              value={formatDuration(
                metrics
                  ?.uptime_seconds,
                t("time.dayShort"),
              )}
            />

            <MetricItem
              label={t(
                "metrics.dropped",
              )}
              value={String(
                metrics
                  ?.drop_frames
                ?? 0,
              )}
            />
          </Box>

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

      <CardActions
        sx={{
          px: 2,
          pb: 2,
          pt: 0,
          flexWrap: "wrap",
          gap: 1,
        }}
      >
        {showDetails && (
          <Button
            component={Link}
            to={`/streams/${stream.id}`}
            variant="text"
          >
            {t(
              "common.details",
            )}
          </Button>
        )}

        {canControl && (
          <>
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
              {t(
                "stream.start",
              )}
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
                || !canStop
              }
              onClick={() => {
                stopMutation.mutate();
              }}
            >
              {hasRuntimeProblem
                ? t(
                  "stream.stopAttempts",
                )
                : t(
                  "stream.stop",
                )}
            </Button>
          </>
        )}
      </CardActions>

    </Card>
  );
}
