import {
  useEffect,
  useMemo,
  useState,
} from "react";

import ArrowBackIcon
  from "@mui/icons-material/ArrowBack";
import ChevronLeftIcon
  from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon
  from "@mui/icons-material/ChevronRight";
import FullscreenIcon
  from "@mui/icons-material/Fullscreen";
import GridViewIcon
  from "@mui/icons-material/GridView";
import OpenInNewIcon
  from "@mui/icons-material/OpenInNew";
import RefreshIcon
  from "@mui/icons-material/Refresh";
import SensorsIcon
  from "@mui/icons-material/Sensors";

import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import {
  useQueries,
  useQuery,
} from "@tanstack/react-query";

import {
  Link,
} from "react-router";

import {
  getStreams,
  getStreamStatus,
} from "../api/streams";

import { StreamLivePlayer }
  from "../features/streams/StreamLivePlayer";

import { StreamStatusChip }
  from "../components/StreamStatusChip";

import { StreamLiveMetrics }
  from "../components/StreamLiveMetrics";

import type {
  StreamItem,
  StreamRuntimeStatus,
} from "../types/stream";


type MonitorLayout =
  | 1
  | 4
  | 9
  | 16;


const layoutOptions:
Array<{
  value: MonitorLayout;
  label: string;
}> = [
  {
    value: 1,
    label: "1",
  },
  {
    value: 4,
    label: "4",
  },
  {
    value: 9,
    label: "9",
  },
  {
    value: 16,
    label: "16",
  },
];


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


function readSavedLayout():
MonitorLayout {
  const value =
    window.localStorage.getItem(
      "cricket-monitor-layout",
    );

  const parsed =
    Number(value);

  if (
    parsed === 1
    || parsed === 4
    || parsed === 9
    || parsed === 16
  ) {
    return parsed;
  }

  return 9;
}


function getColumnCount(
  layout: MonitorLayout,
): number {
  if (layout === 1) {
    return 1;
  }

  if (layout === 4) {
    return 2;
  }

  if (layout === 9) {
    return 3;
  }

  return 4;
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


function isProcessAlive(
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

  return (
    stream.status === "running"
  );
}


function hasRuntimeProblem(
  stream: StreamItem,
  runtime:
    StreamRuntimeStatus | undefined,
): boolean {
  const status =
    getEffectiveStatus(
      stream,
      runtime,
    );

  return (
    status === "error"
    || (
      (
        status === "running"
        || status === "starting"
        || status === "restarting"
      )
      && !isProcessAlive(
        stream,
        runtime,
      )
    )
  );
}


interface MonitorTileProps {
  stream: StreamItem;
  runtime:
    StreamRuntimeStatus | undefined;
  compact: boolean;
  denseMetrics: boolean;
  fillContainer: boolean;
}


function MonitorTile({
  stream,
  runtime,
  compact,
  denseMetrics,
  fillContainer,
}: MonitorTileProps) {
  const effectiveStatus =
    getEffectiveStatus(
      stream,
      runtime,
    );

  const processAlive =
    isProcessAlive(
      stream,
      runtime,
    );

  const runtimeProblem =
    hasRuntimeProblem(
      stream,
      runtime,
    );

  return (
    <Card
      variant="outlined"
      sx={{
        position: "relative",
        width: "100%",
        minWidth: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        height: fillContainer
          ? "100%"
          : "auto",
        minHeight: 0,
        borderColor:
          runtimeProblem
            ? "error.main"
            : (
              processAlive
                ? "success.main"
                : "divider"
            ),
        boxShadow:
          processAlive
            ? (
              "0 0 0 1px "
              + "rgba(46, 125, 50, 0.16)"
            )
            : "none",
      }}
    >
      <Box
        sx={{
          flex: fillContainer
            ? "1 1 auto"
            : "0 0 auto",
          minHeight: 0,
          minWidth: 0,
          display: "flex",
        }}
      >
        <Box
          sx={{
            position: "relative",
            flex: "1 1 auto",
            minWidth: 0,
            minHeight: 0,
            boxSizing: "border-box",
            pt: fillContainer
              ? 1.5
              : 0,
            pl: fillContainer
              ? 1.5
              : 0,
          }}
        >
          <StreamLivePlayer
            streamId={stream.id}
            processAlive={
              processAlive
            }
            compact={compact}
            fillContainer={fillContainer}
          />

          <Box
            component={Link}
            to={`/streams/${stream.id}`}
            aria-label={
              `Открыть ${stream.name}`
            }
            sx={{
              position: "absolute",
              inset: 0,
              zIndex: 1,
            }}
          />

          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 2,
            }}
          >
            <Tooltip
              title="Открыть подробности"
            >
              <IconButton
                component={Link}
                to={`/streams/${stream.id}`}
                size="small"
                sx={{
                  color: "common.white",
                  bgcolor:
                    "rgba(0,0,0,0.65)",
                  "&:hover": {
                    bgcolor:
                      "rgba(0,0,0,0.82)",
                  },
                }}
              >
                <OpenInNewIcon
                  fontSize="small"
                />
              </IconButton>
            </Tooltip>
          </Stack>

          {runtimeProblem && (
            <Chip
              size="small"
              color="error"
              label="ПРОБЛЕМА"
              sx={{
                position: "absolute",
                left: 8,
                bottom: 8,
                zIndex: 2,
                fontWeight: 700,
              }}
            />
          )}
        </Box>

        {fillContainer && (
          <Box
            sx={{
              width: compact
                ? 138
                : 170,
              flex: "0 0 auto",
              minWidth: 0,
              overflow: "hidden",
              borderLeft: 1,
              borderColor: "divider",
              px: compact
                ? 0.75
                : 1.5,
              py: compact
                ? (
                  denseMetrics
                    ? 0.25
                    : 0.75
                )
                : 1.25,
              display: "flex",
              alignItems: "flex-start",
              bgcolor: "background.paper",
            }}
          >
            <StreamLiveMetrics
              metrics={runtime?.metrics}
              processAlive={
                processAlive
              }
              compact
              dense={denseMetrics}
            />
          </Box>
        )}
      </Box>

      <Box
        sx={{
          px: compact
            ? 1.25
            : 1.75,
          py: compact
            ? 1
            : 1.5,
          display: "flex",
          flexDirection: "column",
          gap: compact
            ? 0.75
            : 1.25,
          minWidth: 0,
          flex: "0 0 auto",
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems:
              "flex-start",
            justifyContent:
              "space-between",
            minWidth: 0,
          }}
        >
          <Box
            sx={{
              minWidth: 0,
            }}
          >
            <Typography
              component={Link}
              to={`/streams/${stream.id}`}
              variant={
                compact
                  ? "subtitle2"
                  : "subtitle1"
              }
              title={stream.name}
              sx={{
                display: "block",
                color: "inherit",
                fontWeight: 700,
                lineHeight: 1.25,
                textDecoration: "none",
                overflow: "hidden",
                textOverflow:
                  "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {stream.name}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                overflow: "hidden",
                textOverflow:
                  "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {
                providerLabels[
                  stream.provider
                ]
                ?? stream.provider
              }
            </Typography>
          </Box>

          <StreamStatusChip
            status={effectiveStatus}
          />
        </Stack>

        {!fillContainer && !compact && (
          <StreamLiveMetrics
            metrics={runtime?.metrics}
            processAlive={
              processAlive
            }
          />
        )}

        {!fillContainer && compact && (
          <Stack
            direction="row"
            spacing={1}
            sx={{
              flexWrap: "wrap",
              rowGap: 0.5,
            }}
          >
            {runtime?.metrics
              ?.resolution
              && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {
                    runtime.metrics
                      .resolution
                  }
                </Typography>
              )}

            {runtime?.metrics
              ?.bitrate_kbps
              !== null
              && runtime?.metrics
                ?.bitrate_kbps
                !== undefined
              && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {(
                    runtime.metrics
                      .bitrate_kbps
                    / 1000
                  ).toFixed(1)}
                  {" Mbps"}
                </Typography>
              )}

            {(
              runtime?.metrics
                ?.source_fps
              ?? runtime?.metrics?.fps
            ) !== null
              && (
                runtime?.metrics
                  ?.source_fps
                ?? runtime?.metrics?.fps
              ) !== undefined
              && (
                runtime?.metrics
                  ?.source_fps
                ?? runtime?.metrics?.fps
                ?? 0
              ) > 0
              && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  {"FPS источника "}
                  {(
                    runtime?.metrics
                      ?.source_fps
                    ?? runtime?.metrics?.fps
                    ?? 0
                  ).toFixed(1)}
                </Typography>
              )}
          </Stack>
        )}
      </Box>
    </Card>
  );
}


export default function MonitorPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(
    theme.breakpoints.down("md"),
  );
  const isLandscape = useMediaQuery(
    "(orientation: landscape)",
  );

  const [
    layout,
    setLayout,
  ] = useState<MonitorLayout>(
    readSavedLayout,
  );

  const [
    fullscreen,
    setFullscreen,
  ] = useState(false);

  const [page, setPage] =
    useState(0);

  const streamsQuery = useQuery({
    queryKey: [
      "streams",
    ],
    queryFn: getStreams,
    refetchInterval: 30_000,
    refetchIntervalInBackground:
      true,
  });

  const streams =
    useMemo(
      () =>
        (
          streamsQuery.data
          ?? []
        )
          .filter(
            (stream) =>
              stream.show_on_dashboard,
          )
          .sort(
            (
              left,
              right,
            ) =>
              left.id - right.id,
          ),
      [
        streamsQuery.data,
      ],
    );

  const pageCount = Math.max(
    1,
    Math.ceil(
      streams.length / layout,
    ),
  );

  const activePage = Math.min(
    page,
    pageCount - 1,
  );

  const visibleStreams =
    useMemo(
      () =>
        isMobile
          ? streams
          : streams.slice(
            activePage * layout,
            (activePage + 1)
              * layout,
          ),
      [
        streams,
        layout,
        isMobile,
        activePage,
      ],
    );

  const firstVisibleNumber =
    streams.length === 0
      ? 0
      : activePage * layout + 1;

  const lastVisibleNumber =
    isMobile
      ? streams.length
      : Math.min(
        (activePage + 1) * layout,
        streams.length,
      );

  /*
   * RuntimeWebSocketBridge уже обновляет
   * query cache. REST здесь нужен только
   * как первичное и резервное получение.
   */
  const statusQueries =
    useQueries({
      queries:
        visibleStreams.map(
          (stream) => ({
            queryKey: [
              "stream-status",
              stream.id,
            ],
            queryFn: () =>
              getStreamStatus(
                stream.id,
              ),
            refetchInterval:
              30_000,
            refetchIntervalInBackground:
              true,
            retry: 1,
          }),
        ),
    });

  const runtimeByStreamId =
    useMemo(() => {
      const result =
        new Map<
          number,
          StreamRuntimeStatus
        >();

      visibleStreams.forEach(
        (
          stream,
          index,
        ) => {
          const runtime =
            statusQueries[index]
              ?.data;

          if (runtime) {
            result.set(
              stream.id,
              runtime,
            );
          }
        },
      );

      return result;
    }, [
      visibleStreams,
      statusQueries,
    ]);

  const runningCount =
    visibleStreams.filter(
      (stream) =>
        isProcessAlive(
          stream,
          runtimeByStreamId.get(
            stream.id,
          ),
        ),
    ).length;

  const problemCount =
    visibleStreams.filter(
      (stream) =>
        hasRuntimeProblem(
          stream,
          runtimeByStreamId.get(
            stream.id,
          ),
        ),
    ).length;

  const columnCount =
    isMobile
      ? (
        isLandscape
          ? 2
          : 1
      )
      : getColumnCount(layout);

  /*
   * Размер ячейки определяется выбранной
   * сеткой, а не фактическим числом потоков.
   * Иначе четыре потока в режиме 16
   * ошибочно растягиваются в один ряд.
   */
  const rowCount = columnCount;

  const compact =
    !isMobile && layout > 1;

  useEffect(() => {
    window.localStorage.setItem(
      "cricket-monitor-layout",
      String(layout),
    );
  }, [
    layout,
  ]);

  useEffect(() => {
    if (page >= pageCount) {
      setPage(
        Math.max(0, pageCount - 1),
      );
    }
  }, [
    page,
    pageCount,
  ]);

  useEffect(() => {
    function handleFullscreenChange() {
      setFullscreen(
        document.fullscreenElement
          !== null,
      );
    }

    document.addEventListener(
      "fullscreenchange",
      handleFullscreenChange,
    );

    return () => {
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange,
      );
    };
  }, []);

  async function refreshAll() {
    await streamsQuery.refetch();

    await Promise.all(
      statusQueries.map(
        (query) =>
          query.refetch(),
      ),
    );
  }

  async function enterFullscreen() {
    if (
      document.fullscreenElement
    ) {
      await document
        .exitFullscreen();
      return;
    }

    await document
      .documentElement
      .requestFullscreen();
  }

  return (
    <Box
      sx={{
        height: isMobile
          ? "auto"
          : "100dvh",
        minHeight: "100vh",
        overflow: isMobile
          ? "visible"
          : "hidden",
        display: "flex",
        flexDirection: "column",
        bgcolor:
          fullscreen
            ? "#05070b"
            : "background.default",
      }}
    >
      {!fullscreen && (
        <AppBar
          position="static"
          color="transparent"
          elevation={0}
          sx={{
            backdropFilter:
              "blur(14px)",
            backgroundColor:
              "rgba(11,17,32,0.88)",
            borderBottom:
              "1px solid "
              + "rgba(255,255,255,0.08)",
          }}
        >
          <Toolbar>
            <SensorsIcon
              sx={{
                mr: 1.5,
                color: "primary.main",
              }}
            />

            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
              }}
            >
              Монитор трансляций
            </Typography>

            <Button
              component={Link}
              to="/"
              color="inherit"
              startIcon={
                <ArrowBackIcon />
              }
            >
              Dashboard
            </Button>
          </Toolbar>
        </AppBar>
      )}

      <Container
        maxWidth={false}
        disableGutters={fullscreen}
        sx={{
          py: fullscreen
            ? 1
            : 3,
          px: fullscreen
            ? 1
            : {
              xs: 1.5,
              sm: 2.5,
              lg: 3,
            },
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
          overflow: isMobile
            ? "visible"
            : "hidden",
        }}
      >
        <Stack
          spacing={fullscreen ? 1 : 1.5}
          sx={{
            flex: 1,
            minHeight: 0,
          }}
        >
          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={1.5}
            sx={{
              alignItems: {
                xs: "stretch",
                md: "center",
              },
              justifyContent:
                "space-between",
            }}
          >
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                flexWrap: "wrap",
                rowGap: 1,
              }}
            >
              {!isMobile && (
                <GridViewIcon
                  color="primary"
                />
              )}

              {!isMobile && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Сетка
                </Typography>
              )}

              {!isMobile && (
                <ToggleButtonGroup
                exclusive
                size="small"
                value={layout}
                onChange={(
                  _event,
                  value:
                    MonitorLayout
                    | null,
                ) => {
                  if (value) {
                    setLayout(value);
                    setPage(0);
                  }
                }}
              >
                {layoutOptions.map(
                  (option) => (
                    <ToggleButton
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
                    </ToggleButton>
                  ),
                )}
                </ToggleButtonGroup>
              )}

              <Chip
                size="small"
                color="success"
                variant="outlined"
                label={
                  `Работает: `
                  + runningCount
                }
              />

              {!isMobile
                && streams.length > 0
                && (
                  <Chip
                    size="small"
                    variant="outlined"
                    label={
                      `Камеры ${firstVisibleNumber}`
                      + `–${lastVisibleNumber}`
                      + ` из ${streams.length}`
                    }
                  />
                )}

              {!isMobile
                && pageCount > 1
                && (
                  <Stack
                    direction="row"
                    spacing={0.25}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    <Tooltip title="Предыдущие камеры">
                      <span>
                        <IconButton
                          size="small"
                          disabled={
                            activePage === 0
                          }
                          onClick={() => {
                            setPage(
                              activePage - 1,
                            );
                          }}
                        >
                          <ChevronLeftIcon />
                        </IconButton>
                      </span>
                    </Tooltip>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        minWidth: 44,
                        textAlign: "center",
                      }}
                    >
                      {activePage + 1}
                      {" / "}
                      {pageCount}
                    </Typography>

                    <Tooltip title="Следующие камеры">
                      <span>
                        <IconButton
                          size="small"
                          disabled={
                            activePage
                            >= pageCount - 1
                          }
                          onClick={() => {
                            setPage(
                              activePage + 1,
                            );
                          }}
                        >
                          <ChevronRightIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                )}

              <Chip
                size="small"
                color={
                  problemCount > 0
                    ? "error"
                    : "default"
                }
                variant="outlined"
                label={
                  `Проблемы: `
                  + problemCount
                }
              />
            </Stack>

            <Stack
              direction="row"
              spacing={1}
            >
              <Tooltip
                title="Обновить данные"
              >
                <span>
                  <IconButton
                    disabled={
                      streamsQuery
                        .isFetching
                    }
                    onClick={() => {
                      void refreshAll();
                    }}
                  >
                    {streamsQuery
                      .isFetching
                      ? (
                        <CircularProgress
                          size={20}
                        />
                      )
                      : (
                        <RefreshIcon />
                      )}
                  </IconButton>
                </span>
              </Tooltip>

              <Button
                variant="outlined"
                startIcon={
                  <FullscreenIcon />
                }
                onClick={() => {
                  void enterFullscreen();
                }}
              >
                {fullscreen
                  ? "Выйти"
                  : "Во весь экран"}
              </Button>
            </Stack>
          </Stack>

          {streamsQuery.isError && (
            <Alert severity="error">
              Не удалось получить список
              трансляций.
            </Alert>
          )}

          {!streamsQuery.isLoading
            && streams.length === 0
            && (
              <Alert severity="info">
                На Dashboard пока нет
                выбранных трансляций.
                Включите параметр
                «Показывать на Dashboard»
                в настройках потока.
              </Alert>
            )}

          {streamsQuery.isLoading
            ? (
              <Box
                sx={{
                  minHeight: 360,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <CircularProgress />
              </Box>
            )
            : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns:
                    `repeat(${columnCount}, `
                    + "minmax(0, 1fr))",
                  gridTemplateRows: isMobile
                    ? "none"
                    : (
                      `repeat(${rowCount}, `
                      + "minmax(0, 1fr))"
                    ),
                  gap: fullscreen
                    ? 1
                    : 1.5,
                  alignItems: "stretch",
                  justifyItems: "stretch",
                  width: "100%",
                  flex: 1,
                  minHeight: 0,
                  overflow: isMobile
                    ? "visible"
                    : "hidden",
                }}
              >
                {visibleStreams.map(
                  (stream) => (
                    <MonitorTile
                      key={stream.id}
                      stream={stream}
                      runtime={
                        runtimeByStreamId
                          .get(
                            stream.id,
                          )
                      }
                      compact={compact}
                      denseMetrics={
                        !isMobile
                        && layout === 16
                      }
                      fillContainer={!isMobile}
                    />
                  ),
                )}
              </Box>
            )}
        </Stack>
      </Container>
    </Box>
  );
}
