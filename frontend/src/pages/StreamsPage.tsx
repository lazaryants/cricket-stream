import {
  useMemo,
  useState,
} from "react";
import ArrowBackIcon
  from "@mui/icons-material/ArrowBack";
import LibraryBooksIcon
  from "@mui/icons-material/LibraryBooks";
import LogoutIcon
  from "@mui/icons-material/Logout";
import RefreshIcon
  from "@mui/icons-material/Refresh";
import SearchIcon
  from "@mui/icons-material/Search";
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
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  useQueries,
  useQuery,
} from "@tanstack/react-query";
import { Link }
  from "react-router";
import {
  getStreams,
  getStreamStatus,
} from "../api/streams";
import { useAuth }
  from "../auth/useAuth";
import { LanguageSwitcher }
  from "../components/LanguageSwitcher";
import { useI18n }
  from "../i18n/useI18n";
import { StreamRow }
  from "../features/streams/StreamRow";
import { StreamMobileCard }
  from "../features/streams/StreamMobileCard";
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

export default function StreamsPage() {
  const {
    t,
  } = useI18n();

  const roleLabels = {
    viewer: t("role.viewer"),
    operator: t("role.operator"),
    admin: t("role.admin"),
  } as const;

  const theme = useTheme();

  const isMobile =
    useMediaQuery(
      theme.breakpoints.down("md"),
    );

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
    staleTime: 60_000,
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
        // Runtime обновляется через WebSocket.
        // REST используется только при ручном обновлении.
        enabled: false,
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
        width: "100%",
        maxWidth: "100vw",
        overflowX: "hidden",
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
            {t("streams.title")}
          </Typography>

          <Button
            component={Link}
            to="/libraries"
            color="inherit"
            startIcon={
              <LibraryBooksIcon />
            }
            sx={{
              display: {
                xs: "none",
                md: "inline-flex",
              },
              mr: 1,
            }}
          >
            {t("streams.libraries")}
          </Button>
          <Tooltip title={t("streams.libraries")}>
            <IconButton
              component={Link}
              to="/libraries"
              color="inherit"
              sx={{
                display: {
                  xs: "inline-flex",
                  md: "none",
                },
                mr: 0.5,
              }}
            >
              <LibraryBooksIcon />
            </IconButton>
          </Tooltip>
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
            {t("streams.logout")}
          </Button>

          <Tooltip title={t("streams.logout")}>
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

          <Box
            sx={{
              ml: {
                xs: 0.5,
                sm: 1,
              },
              display: "inline-flex",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <LanguageSwitcher
              compact
            />
          </Box>
        </Toolbar>
      </AppBar>

      <Container
        maxWidth={false}
        sx={{
          minWidth: 0,
          overflowX: "hidden",
          px: {
            xs: 1.5,
            sm: 2,
            lg: 2.5,
          },
          py: {
            xs: 2,
            md: 3,
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
                {t("streams.title")}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.5,
                }}
              >
                {t("streams.subtitle")}
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
                  t("streams.total", { count: streams.length })
                }
              />

              <Chip
                color="success"
                variant="outlined"
                label={
                  t("streams.running", { count: runningCount })
                }
              />

              <Chip
                color="primary"
                variant="outlined"
                label={
                  t("streams.onDashboard", { count: dashboardCount })
                }
              />

              {canCreate && (
                <Button
                  component={Link}
                  to="/streams/new"
                  variant="contained"
                >
                  {t("streams.new")}
                </Button>
              )}

              <Tooltip title={t("streams.refreshAll")}>
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
                  t("streams.search")
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
                    {t("streams.filter.all")}
                  </MenuItem>

                  <MenuItem value="running">
                    {t("streams.filter.running")}
                  </MenuItem>

                  <MenuItem value="stopped">
                    {t("streams.filter.stopped")}
                  </MenuItem>

                  <MenuItem value="dashboard">
                    {t("streams.filter.dashboard")}
                  </MenuItem>

                  <MenuItem value="hidden">
                    {t("streams.filter.hidden")}
                  </MenuItem>

                  <MenuItem value="disabled">
                    {t("streams.filter.disabled")}
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Paper>

          {streamsQuery.isError && (
            <Alert severity="error">
              {t("streams.loadError")}
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
                {t("streams.loading")}
              </Typography>
            </Stack>
          )}

          {!streamsQuery.isLoading
            && filteredStreams.length
              === 0
            && (
              <Alert severity="info">
                {t("streams.empty")}
              </Alert>
            )}

          {!streamsQuery.isLoading
            && filteredStreams.length
              > 0
            && (
              isMobile
                ? (
                  <Stack spacing={2}>
                    {filteredStreams.map(
                      (stream) => (
                        <StreamMobileCard
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
                  </Stack>
                )
                : (
                  <TableContainer
                    component={Paper}
                  >
                    <Table
                      size="small"
                      sx={{
                        minWidth: 1320,
                        tableLayout: "fixed",
                        "& .MuiTableCell-root": {
                          px: 1,
                          py: 1.25,
                          verticalAlign: "top",
                        },
                      }}
                    >
                      <colgroup>
                        <col
                          style={{
                            width: 82,
                          }}
                        />
                        <col
                          style={{
                            width: 245,
                          }}
                        />
                        <col
                          style={{
                            width: 105,
                          }}
                        />
                        <col
                          style={{
                            width: 145,
                          }}
                        />
                        <col
                          style={{
                            width: 190,
                          }}
                        />
                        <col
                          style={{
                            width: 95,
                          }}
                        />
                        <col
                          style={{
                            width: 75,
                          }}
                        />
                        <col
                          style={{
                            width: 105,
                          }}
                        />
                        <col
                          style={{
                            width: 225,
                          }}
                        />
                      </colgroup>

                      <TableHead>
                        <TableRow>
                          <TableCell
                            align="center"
                          >
                            Dashboard
                          </TableCell>

                          <TableCell>
                            {t("streams.column.name")}
                          </TableCell>

                          <TableCell>
                            {t("streams.column.status")}
                          </TableCell>

                          <TableCell>
                            {t("streams.column.diagnostic")}
                          </TableCell>

                            <TableCell>
                              Live
                            </TableCell>

                          <TableCell>
                            {t("streams.column.provider")}
                          </TableCell>

                          <TableCell>
                            {t("streams.column.node")}
                          </TableCell>

                          <TableCell>
                            {t("streams.column.availability")}
                          </TableCell>

                          <TableCell
                            align="right"
                          >
                            {t("streams.column.actions")}
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
                )
            )}
        </Stack>
      </Container>
    </Box>
  );
}
