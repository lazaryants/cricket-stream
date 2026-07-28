import ArrowBackIcon
  from "@mui/icons-material/ArrowBack";

import RefreshIcon
  from "@mui/icons-material/Refresh";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  useQuery,
} from "@tanstack/react-query";

import {
  Link,
  Navigate,
  useParams,
} from "react-router";

import {
  getStream,
  getStreamStatus,
} from "../api/streams";

import {
  getSessionLogs,
  getStreamSessions,
} from "../api/sessions";

import { useAuth }
  from "../auth/useAuth";

import { MetricItem }
  from "../components/MetricItem";

import { StreamStatusChip }
  from "../components/StreamStatusChip";

import { StreamControlPanel }
  from "../features/streams/StreamControlPanel";

import type {
  StreamMetrics,
} from "../types/stream";

function formatBitrate(
  value: number | null | undefined,
): string {
  if (
    value === null
    || value === undefined
  ) {
    return "—";
  }

  if (value >= 1000) {
    return `${(
      value / 1000
    ).toFixed(2)} Mbps`;
  }

  return `${value.toFixed(0)} Kbps`;
}

function formatDuration(
  value: number | null | undefined,
): string {
  if (
    value === null
    || value === undefined
  ) {
    return "—";
  }

  const seconds =
    Math.max(
      0,
      Math.floor(value),
    );

  const hours =
    Math.floor(seconds / 3600);

  const minutes =
    Math.floor(
      (seconds % 3600) / 60,
    );

  const remainingSeconds =
    seconds % 60;

  return [
    hours,
    minutes,
    remainingSeconds,
  ]
    .map((part) =>
      String(part).padStart(
        2,
        "0",
      ),
    )
    .join(":");
}

function formatDate(
  value: string | null | undefined,
): string {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "ru-RU",
    {
      dateStyle: "short",
      timeStyle: "medium",
    },
  ).format(
    new Date(value),
  );
}

function metricValue(
  metrics: StreamMetrics | null,
  key: keyof StreamMetrics,
): string {
  const value = metrics?.[key];

  if (
    value === null
    || value === undefined
    || value === ""
  ) {
    return "—";
  }

  return String(value);
}

export default function StreamDetailsPage() {
  const auth = useAuth();

  const params = useParams<{
    streamId: string;
  }>();

  const streamId =
    Number(params.streamId);

  const canViewLogs =
    auth.user?.role === "operator"
    || auth.user?.role === "admin"
    || auth.user?.is_superuser;

  const streamQuery = useQuery({
    queryKey: [
      "stream",
      streamId,
    ],

    queryFn: () =>
      getStream(streamId),

    enabled:
      Number.isInteger(streamId)
      && streamId > 0,
  });

  const statusQuery = useQuery({
    queryKey: [
      "stream-status",
      streamId,
    ],

    queryFn: () =>
      getStreamStatus(streamId),

    enabled:
      Number.isInteger(streamId)
      && streamId > 0,

    refetchInterval: 3_000,

    refetchIntervalInBackground:
      true,
  });

  const sessionsQuery = useQuery({
    queryKey: [
      "stream-sessions",
      streamId,
    ],

    queryFn: () =>
      getStreamSessions(
        streamId,
        10,
      ),

    enabled:
      Number.isInteger(streamId)
      && streamId > 0,

    refetchInterval: 10_000,
  });

  const latestSession =
    sessionsQuery.data?.[0]
    ?? statusQuery.data
      ?.latest_session
    ?? null;

  const logsQuery = useQuery({
    queryKey: [
      "session-logs",
      latestSession?.uuid,
    ],

    queryFn: () =>
      getSessionLogs(
        latestSession!.uuid,
        200,
      ),

    enabled:
      Boolean(
        canViewLogs
        && latestSession?.uuid,
      ),

    refetchInterval: 5_000,
  });

  if (
    !Number.isInteger(streamId)
    || streamId <= 0
  ) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  const isLoading =
    streamQuery.isLoading
    || statusQuery.isLoading;

  const stream =
    streamQuery.data;

  const runtime =
    statusQuery.data;

  const metrics =
    runtime?.metrics ?? null;

  async function refreshAll() {
    await Promise.all([
      streamQuery.refetch(),
      statusQuery.refetch(),
      sessionsQuery.refetch(),
      canViewLogs
        ? logsQuery.refetch()
        : Promise.resolve(),
    ]);
  }

  return (
    <Container
      maxWidth="xl"
      sx={{
        py: {
          xs: 3,
          md: 4,
        },
      }}
    >
      <Stack spacing={3}>
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
          }}
        >
          <Button
            component={Link}
            to="/"
            startIcon={
              <ArrowBackIcon />
            }
          >
            Назад
          </Button>

          <Box
            sx={{
              flexGrow: 1,
            }}
          />

          <Tooltip title="Обновить">
            <span>
              <IconButton
                disabled={
                  streamQuery.isFetching
                  || statusQuery.isFetching
                  || sessionsQuery.isFetching
                }
                onClick={() => {
                  void refreshAll();
                }}
              >
                {statusQuery.isFetching
                  ? (
                    <CircularProgress
                      size={20}
                    />
                  )
                  : <RefreshIcon />
                }
              </IconButton>
            </span>
          </Tooltip>
        </Stack>

        {isLoading && (
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              minHeight: 300,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {(streamQuery.isError
          || statusQuery.isError
        ) && (
          <Alert severity="error">
            Не удалось загрузить данные
            потока.
          </Alert>
        )}

        {stream && runtime && (
          <>
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={2}
              sx={{
                alignItems: {
                  xs: "flex-start",
                  md: "center",
                },
              }}
            >
              <Box
                sx={{
                  flexGrow: 1,
                }}
              >
                <Typography
                  variant="h4"
                  component="h1"
                >
                  {stream.name}
                </Typography>

                <Typography
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                  }}
                >
                  {stream.description
                    ?? "Описание отсутствует"}
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                sx={{
                  alignItems: "center",
                }}
              >
                <Chip
                  label={
                    stream.provider
                      .toUpperCase()
                  }
                  variant="outlined"
                />

                <StreamStatusChip
                  status={
                    runtime.database_status
                  }
                />
              </Stack>
            </Stack>

            <StreamControlPanel
              streamId={stream.id}
              enabled={stream.enabled}
              processAlive={
                runtime.process_alive
              }
            />

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs:
                    "minmax(0, 1fr)",

                  lg:
                    "repeat(2, "
                    + "minmax(0, 1fr))",
                },
                gap: 2.5,
              }}
            >
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">
                      Состояние потока
                    </Typography>

                    <Divider />

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs:
                            "repeat(2, "
                            + "minmax(0, 1fr))",

                          sm:
                            "repeat(3, "
                            + "minmax(0, 1fr))",
                        },
                        gap: 2,
                      }}
                    >
                      <MetricItem
                        label="Процесс жив"
                        value={
                          runtime.process_alive
                            ? "Да"
                            : "Нет"
                        }
                      />

                      <MetricItem
                        label="PID"
                        value={String(
                          runtime.process_id
                          ?? "—",
                        )}
                      />

                      <MetricItem
                        label="Manager"
                        value={
                          runtime.manager_status
                        }
                      />

                      <MetricItem
                        label="Разрешение"
                        value={
                          metrics?.resolution
                          ?? "—"
                        }
                      />

                      <MetricItem
                        label="FPS"
                        value={
                          metrics?.fps
                            ? metrics.fps
                              .toFixed(2)
                            : "—"
                        }
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
                        value={formatDuration(
                          metrics
                            ?.uptime_seconds,
                        )}
                      />

                      <MetricItem
                        label="Передано"
                        value={
                          metrics
                            ?.total_size_mb
                            !== undefined
                            ? `${metrics
                                .total_size_mb
                                .toFixed(2)} MB`
                            : "—"
                        }
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">
                      Видео и аудио
                    </Typography>

                    <Divider />

                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs:
                            "repeat(2, "
                            + "minmax(0, 1fr))",

                          sm:
                            "repeat(3, "
                            + "minmax(0, 1fr))",
                        },
                        gap: 2,
                      }}
                    >
                      <MetricItem
                        label="Видеокодек"
                        value={metricValue(
                          metrics,
                          "video_codec",
                        )}
                      />

                      <MetricItem
                        label="Профиль"
                        value={metricValue(
                          metrics,
                          "video_profile",
                        )}
                      />

                      <MetricItem
                        label="Pixel format"
                        value={metricValue(
                          metrics,
                          "pixel_format",
                        )}
                      />

                      <MetricItem
                        label="Аудиокодек"
                        value={metricValue(
                          metrics,
                          "audio_codec",
                        )}
                      />

                      <MetricItem
                        label="Sample rate"
                        value={
                          metrics
                            ?.sample_rate
                            ? `${metrics
                                .sample_rate} Hz`
                            : "—"
                        }
                      />

                      <MetricItem
                        label="Каналы"
                        value={
                          metrics
                            ?.channel_layout
                          ?? (
                            metrics
                              ?.audio_channels
                              ? String(
                                  metrics
                                    .audio_channels,
                                )
                              : "—"
                          )
                        }
                      />

                      <MetricItem
                        label="Dropped frames"
                        value={String(
                          metrics
                            ?.drop_frames
                          ?? 0,
                        )}
                      />

                      <MetricItem
                        label="Duplicated frames"
                        value={String(
                          metrics
                            ?.dup_frames
                          ?? 0,
                        )}
                      />

                      <MetricItem
                        label="Exit code"
                        value={String(
                          metrics
                            ?.exit_code
                          ?? "—",
                        )}
                      />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            {(stream.source_url
              || stream
                .destination_rtmp_url
            ) && (
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">
                      Маршрут трансляции
                    </Typography>

                    <Divider />

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
                          label="RTMP назначение"
                          value={
                            stream
                              .destination_rtmp_url
                          }
                        />
                      )}
                  </Stack>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent>
                <Stack spacing={2}>
                  <Typography variant="h6">
                    Последние сессии
                  </Typography>

                  <Divider />

                  {sessionsQuery.isLoading && (
                    <CircularProgress
                      size={24}
                    />
                  )}

                  {sessionsQuery.isError && (
                    <Alert severity="error">
                      Не удалось загрузить
                      историю сессий.
                    </Alert>
                  )}

                  {sessionsQuery.data
                    ?.length === 0
                    && (
                      <Typography
                        color="text.secondary"
                      >
                        Сессий пока нет.
                      </Typography>
                    )}

                  {sessionsQuery.data
                    ?.map((session) => (
                      <Box
                        key={session.uuid}
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs:
                              "minmax(0, 1fr)",

                            md:
                              "80px 150px "
                              + "1fr 1fr",
                          },
                          gap: 1.5,
                          py: 1,
                          borderBottom:
                            "1px solid "
                            + "rgba(255,255,255,0.06)",
                        }}
                      >
                        <Typography
                          variant="body2"
                        >
                          #{session.id}
                        </Typography>

                        <StreamStatusChip
                          status={
                            session.status
                          }
                        />

                        <Typography
                          variant="body2"
                        >
                          Начало:{" "}
                          {formatDate(
                            session.started_at
                            ?? session.created_at,
                          )}
                        </Typography>

                        <Typography
                          variant="body2"
                          color={
                            session.error_message
                              ? "error.main"
                              : "text.secondary"
                          }
                        >
                          {session.error_message
                            ?? `Окончание: ${
                              formatDate(
                                session.stopped_at,
                              )
                            }`
                          }
                        </Typography>
                      </Box>
                    ))}
                </Stack>
              </CardContent>
            </Card>

            {canViewLogs && (
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">
                      Журнал последней сессии
                    </Typography>

                    <Divider />

                    {!latestSession && (
                      <Typography
                        color="text.secondary"
                      >
                        Последняя сессия
                        отсутствует.
                      </Typography>
                    )}

                    {logsQuery.isLoading && (
                      <CircularProgress
                        size={24}
                      />
                    )}

                    {logsQuery.isError && (
                      <Alert severity="error">
                        Не удалось загрузить
                        журнал.
                      </Alert>
                    )}

                    {logsQuery.data && (
                      <Box
                        component="pre"
                        sx={{
                          m: 0,
                          p: 2,
                          maxHeight: 480,
                          overflow: "auto",
                          borderRadius: 1,
                          bgcolor:
                            "rgba(0,0,0,0.35)",
                          fontFamily:
                            "monospace",
                          fontSize: 12,
                          whiteSpace:
                            "pre-wrap",
                          overflowWrap:
                            "anywhere",
                        }}
                      >
                        {logsQuery.data.logs
                          .join("\n")
                          || "Журнал пуст."}
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}
