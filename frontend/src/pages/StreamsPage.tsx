import {
  useMemo,
  useState,
} from "react";
import ArrowBackIcon
  from "@mui/icons-material/ArrowBack";
import EditIcon
  from "@mui/icons-material/Edit";
import LogoutIcon
  from "@mui/icons-material/Logout";
import OpenInNewIcon
  from "@mui/icons-material/OpenInNew";
import PlayArrowIcon
  from "@mui/icons-material/PlayArrow";
import RefreshIcon
  from "@mui/icons-material/Refresh";
import SearchIcon
  from "@mui/icons-material/Search";
import StopIcon
  from "@mui/icons-material/Stop";
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import { Link }
  from "react-router";
import {
  getStreams,
  getStreamStatus,
  startStream,
  stopStream,
  updateStream,
} from "../api/streams";
import { useAuth }
  from "../auth/useAuth";
import { StreamStatusChip }
  from "../components/StreamStatusChip";
import type {
  StreamItem,
  StreamRuntimeStatus,
} from "../types/stream";

type StreamFilter =
  | "all"
  | "running"
  | "stopped"
  | "dashboard"
  | "hidden"
  | "disabled";

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

const roleLabels = {
  viewer: "Наблюдатель",
  operator: "Оператор",
  admin: "Администратор",
} as const;

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

interface StreamRowProps {
  stream: StreamItem;
  runtime:
    StreamRuntimeStatus | undefined;
  canManage: boolean;
}

function StreamRow({
  stream,
  runtime,
  canManage,
}: StreamRowProps) {
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

  return (
    <>
      <TableRow
        hover
        sx={{
          "&:last-child td": {
            borderBottom: 0,
          },
        }}
      >
        <TableCell
          padding="checkbox"
          align="center"
        >
          <Tooltip
            title={
              stream.show_on_dashboard
                ? "Показывается на Dashboard"
                : "Скрыта с Dashboard"
            }
          >
            <span>
              <Switch
                size="small"
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
            </span>
          </Tooltip>
        </TableCell>

        <TableCell>
          <Stack
            spacing={0.35}
            sx={{
              minWidth: 180,
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
              }}
            >
              {stream.name}
            </Typography>

            {stream.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  maxWidth: 360,
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={
                  stream.description
                }
              >
                {stream.description}
              </Typography>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <StreamStatusChip
            status={
              effectiveStatus
            }
          />
        </TableCell>

        <TableCell>
          <Chip
            size="small"
            variant="outlined"
            label={
              providerLabels[
                stream.provider
              ] ?? stream.provider
            }
          />
        </TableCell>

        <TableCell>
          <Typography
            variant="body2"
          >
            Node #{stream.node_id}
          </Typography>
        </TableCell>

        <TableCell>
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
        </TableCell>

        <TableCell align="right">
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              justifyContent:
                "flex-end",
              minWidth: 275,
            }}
          >
            <Tooltip title="Подробнее">
              <IconButton
                component={Link}
                to={`/streams/${stream.id}`}
                size="small"
              >
                <OpenInNewIcon
                  fontSize="small"
                />
              </IconButton>
            </Tooltip>

            {canManage && (
              <Tooltip title="Редактировать">
                <IconButton
                  component={Link}
                  to={
                    `/streams/${stream.id}/edit`
                  }
                  size="small"
                >
                  <EditIcon
                    fontSize="small"
                  />
                </IconButton>
              </Tooltip>
            )}

            {canManage && (
              <>
                <Button
                  size="small"
                  color="success"
                  variant="contained"
                  startIcon={
                    startMutation
                      .isPending
                      ? (
                        <CircularProgress
                          size={15}
                          color="inherit"
                        />
                      )
                      : (
                        <PlayArrowIcon />
                      )
                  }
                  disabled={
                    actionPending
                    || running
                    || !stream.enabled
                  }
                  onClick={() => {
                    startMutation.mutate();
                  }}
                >
                  Старт
                </Button>

                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={
                    stopMutation
                      .isPending
                      ? (
                        <CircularProgress
                          size={15}
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
                  Стоп
                </Button>
              </>
            )}
          </Stack>
        </TableCell>
      </TableRow>

      {actionError && (
        <TableRow>
          <TableCell
            colSpan={7}
            sx={{
              pt: 0,
            }}
          >
            <Alert
              severity="error"
              onClose={() => {
                setActionError(null);
              }}
            >
              {actionError}
            </Alert>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

export default function StreamsPage() {
  const auth = useAuth();
  const user = auth.user;

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    filter,
    setFilter,
  ] = useState<StreamFilter>(
    "all",
  );

  const streamsQuery = useQuery({
    queryKey: [
      "streams",
    ],
    queryFn: getStreams,
    refetchInterval: 15_000,
    refetchIntervalInBackground:
      true,
  });

  const streams = useMemo(
    () =>
      streamsQuery.data ?? [],
    [
      streamsQuery.data,
    ],
  );

  const statusQueries = useQueries({
    queries: streams.map(
      (stream) => ({
        queryKey: [
          "stream-status",
          stream.id,
        ],
        queryFn: () =>
          getStreamStatus(
            stream.id,
          ),
        refetchInterval: 5_000,
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

      streams.forEach(
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
      streams,
      statusQueries,
    ]);

  const filteredStreams =
    useMemo(() => {
      const normalizedSearch =
        search
          .trim()
          .toLowerCase();

      return streams.filter(
        (stream) => {
          const runtime =
            runtimeByStreamId.get(
              stream.id,
            );

          const running =
            isStreamRunning(
              stream,
              runtime,
            );

          const matchesSearch =
            normalizedSearch.length
              === 0
            || stream.name
              .toLowerCase()
              .includes(
                normalizedSearch,
              )
            || (
              stream.description
              ?.toLowerCase()
              .includes(
                normalizedSearch,
              )
              ?? false
            )
            || stream.provider
              .toLowerCase()
              .includes(
                normalizedSearch,
              )
            || String(stream.id)
              === normalizedSearch;

          if (!matchesSearch) {
            return false;
          }

          switch (filter) {
            case "running":
              return running;

            case "stopped":
              return !running;

            case "dashboard":
              return (
                stream
                  .show_on_dashboard
              );

            case "hidden":
              return (
                !stream
                  .show_on_dashboard
              );

            case "disabled":
              return !stream.enabled;

            default:
              return true;
          }
        },
      );
    }, [
      streams,
      runtimeByStreamId,
      search,
      filter,
    ]);

  if (!user) {
    return null;
  }

  const canManage =
    user.role === "operator"
    || user.role === "admin"
    || user.is_superuser;

  const canCreate =
    user.role === "admin"
    || user.is_superuser;

  const runningCount =
    streams.filter(
      (stream) =>
        isStreamRunning(
          stream,
          runtimeByStreamId.get(
            stream.id,
          ),
        ),
    ).length;

  const dashboardCount =
    streams.filter(
      (stream) =>
        stream.show_on_dashboard,
    ).length;

  async function refreshAll() {
    await streamsQuery.refetch();

    await Promise.all(
      statusQueries.map(
        (query) =>
          query.refetch(),
      ),
    );
  }

  const refreshPending =
    streamsQuery.isFetching
    || statusQueries.some(
      (query) =>
        query.isFetching,
    );

  return (
    <Box
      sx={{
        minHeight: "100vh",
      }}
    >
      <AppBar
        position="sticky"
        color="transparent"
        elevation={0}
        sx={{
          backdropFilter:
            "blur(14px)",
          backgroundColor:
            "rgba(11,17,32,0.82)",
          borderBottom:
            "1px solid "
            + "rgba(255,255,255,0.08)",
        }}
      >
        <Toolbar>
          <Button
            component={Link}
            to="/"
            color="inherit"
            startIcon={
              <ArrowBackIcon />
            }
            sx={{
              mr: 2,
            }}
          >
            Dashboard
          </Button>

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: 700,
            }}
          >
            Все трансляции
          </Typography>

          <Tooltip
            title={
              `${user.username} — `
              + roleLabels[user.role]
            }
          >
            <Avatar
              sx={{
                width: 34,
                height: 34,
                mr: 1,
                fontSize: 15,
              }}
            >
              {user.username
                .slice(0, 1)
                .toUpperCase()}
            </Avatar>
          </Tooltip>

          <Button
            color="inherit"
            startIcon={<LogoutIcon />}
            onClick={auth.logout}
            sx={{
              display: {
                xs: "none",
                sm: "inline-flex",
              },
            }}
          >
            Выйти
          </Button>

          <Tooltip title="Выйти">
            <IconButton
              color="inherit"
              onClick={auth.logout}
              sx={{
                display: {
                  xs: "inline-flex",
                  sm: "none",
                },
              }}
            >
              <LogoutIcon />
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>

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
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={2}
            sx={{
              justifyContent:
                "space-between",
              alignItems: {
                xs: "stretch",
                md: "center",
              },
            }}
          >
            <Box>
              <Typography
                variant="h4"
                component="h1"
              >
                Все трансляции
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.5,
                }}
              >
                Управление активными,
                скрытыми и отключёнными
                потоками
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                flexWrap: "wrap",
                rowGap: 1,
              }}
            >
              <Chip
                label={
                  `Всего: ${streams.length}`
                }
              />

              <Chip
                color="success"
                variant="outlined"
                label={
                  `Работает: ${runningCount}`
                }
              />

              <Chip
                color="primary"
                variant="outlined"
                label={
                  `На Dashboard: ${
                    dashboardCount
                  }`
                }
              />

              {canCreate && (
                <Button
                  component={Link}
                  to="/streams/new"
                  variant="contained"
                >
                  Новая трансляция
                </Button>
              )}

              <Tooltip title="Обновить всё">
                <span>
                  <IconButton
                    disabled={
                      refreshPending
                    }
                    onClick={() => {
                      void refreshAll();
                    }}
                  >
                    {refreshPending
                      ? (
                        <CircularProgress
                          size={20}
                        />
                      )
                      : <RefreshIcon />}
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          <Paper
            sx={{
              p: 2,
            }}
          >
            <Stack
              direction={{
                xs: "column",
                md: "row",
              }}
              spacing={2}
            >
              <TextField
                fullWidth
                size="small"
                value={search}
                placeholder={
                  "Поиск по названию, "
                  + "описанию, провайдеру "
                  + "или ID"
                }
                onChange={(event) => {
                  setSearch(
                    event.target.value,
                  );
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment
                        position="start"
                      >
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <FormControl
                size="small"
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 220,
                  },
                }}
              >
                <Select
                  value={filter}
                  onChange={(event) => {
                    setFilter(event.target.value as StreamFilter);
                  }}
                >
                  <MenuItem value="all">
                    Все
                  </MenuItem>

                  <MenuItem value="running">
                    Работающие
                  </MenuItem>

                  <MenuItem value="stopped">
                    Остановленные
                  </MenuItem>

                  <MenuItem value="dashboard">
                    На Dashboard
                  </MenuItem>

                  <MenuItem value="hidden">
                    Скрытые
                  </MenuItem>

                  <MenuItem value="disabled">
                    Отключённые
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {streamsQuery.isError && (
            <Alert severity="error">
              Не удалось получить список
              трансляций.
            </Alert>
          )}

          {streamsQuery.isLoading && (
            <Stack
              direction="row"
              spacing={2}
              sx={{
                justifyContent:
                  "center",
                py: 8,
              }}
            >
              <CircularProgress />
              <Typography>
                Загрузка трансляций…
              </Typography>
            </Stack>
          )}

          {!streamsQuery.isLoading
            && filteredStreams.length
              === 0
            && (
              <Alert severity="info">
                Трансляции по выбранным
                условиям не найдены.
              </Alert>
            )}

          {!streamsQuery.isLoading
            && filteredStreams.length
              > 0
            && (
              <TableContainer
                component={Paper}
              >
                <Table
                  sx={{
                    minWidth: 1100,
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell
                        align="center"
                      >
                        Dashboard
                      </TableCell>

                      <TableCell>
                        Название
                      </TableCell>

                      <TableCell>
                        Статус
                      </TableCell>

                      <TableCell>
                        Провайдер
                      </TableCell>

                      <TableCell>
                        Узел
                      </TableCell>

                      <TableCell>
                        Доступность
                      </TableCell>

                      <TableCell
                        align="right"
                      >
                        Действия
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {filteredStreams.map(
                      (stream) => (
                        <StreamRow
                          key={stream.id}
                          stream={stream}
                          runtime={
                            runtimeByStreamId
                              .get(
                                stream.id,
                              )
                          }
                          canManage={
                            canManage
                          }
                        />
                      ),
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
        </Stack>
      </Container>
    </Box>
  );
}
