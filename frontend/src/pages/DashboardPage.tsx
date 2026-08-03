import LibraryBooksIcon
  from "@mui/icons-material/LibraryBooks";
import MonitorHeartIcon
  from "@mui/icons-material/MonitorHeart";
import LogoutIcon
  from "@mui/icons-material/Logout";
import SystemUpdateAltIcon
  from "@mui/icons-material/SystemUpdateAlt";
import ManageAccountsIcon
  from "@mui/icons-material/ManageAccounts";
import PeopleIcon
  from "@mui/icons-material/People";

import RefreshIcon
  from "@mui/icons-material/Refresh";

import SensorsIcon
  from "@mui/icons-material/Sensors";

import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
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

import { StreamCard }
  from "../features/streams/StreamCard";

export default function DashboardPage() {
  const {
    t,
  } = useI18n();

  const roleLabels = {
    viewer: t("role.viewer"),
    operator: t("role.operator"),
    admin: t("role.admin"),
  } as const;

  const auth = useAuth();
  const user = auth.user;

  const streamsQuery = useQuery({
    queryKey: [
      "streams",
    ],

    queryFn: getStreams,

    staleTime: 60_000,
  });

  const allStreams =
    streamsQuery.data ?? [];

  const streams =
    allStreams.filter(
      (stream) =>
        stream.show_on_dashboard,
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

  if (!user) {
    return null;
  }

  const loadedStatuses =
    statusQueries
      .map((query) => query.data)
      .filter(
        (status) =>
          status !== undefined,
      );

  const runningCount =
    loadedStatuses.filter(
      (status) =>
        status.process_alive,
    ).length;

  const errorCount =
    loadedStatuses.filter(
      (status) =>
        status.database_status
          === "error"
        || (
          status.database_status
            === "running"
          && !status.process_alive
        ),
    ).length;

  const statusLoading =
    streams.length > 0
    && statusQueries.some(
      (query) =>
        query.isLoading,
    );

  async function refreshAll() {
    await streamsQuery.refetch();

    await Promise.all(
      statusQueries.map(
        (query) =>
          query.refetch(),
      ),
    );
  }

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
            Cricket Stream Platform
          </Typography>

          <Button
            component={Link}
            to="/monitor"
            color="inherit"
            startIcon={
              <MonitorHeartIcon />
            }
            sx={{
              display: {
                xs: "none",
                md: "inline-flex",
              },
              mr: 1,
            }}
          >
            {t("common.monitor")}
          </Button>

          <Tooltip
            title={t("common.monitor")}
          >
            <IconButton
              component={Link}
              to="/monitor"
              color="inherit"
              sx={{
                display: {
                  xs: "inline-flex",
                  md: "none",
                },
                mr: 0.5,
              }}
            >
              <MonitorHeartIcon />
            </IconButton>
          </Tooltip>

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
            {t("common.libraries")}
          </Button>
          <Tooltip
            title={t("common.libraries")}
          >
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
          {(user.role === "admin"
            || user.is_superuser
          ) && (
            <Tooltip
              title={t(
                "common.componentVersions",
              )}
            >
              <IconButton
                component={Link}
                to="/components"
                color="inherit"
                sx={{ mr: 0.5 }}
              >
                <SystemUpdateAltIcon />
              </IconButton>
            </Tooltip>
          )}

          {(user.role === "admin"
            || user.is_superuser
          ) && (
            <Tooltip
              title={t("common.users")}
            >
              <IconButton
                component={Link}
                to="/users"
                color="inherit"
                sx={{ mr: 0.5 }}
              >
                <PeopleIcon />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip
            title={t("common.account")}
          >
            <IconButton
              component={Link}
              to="/account"
              color="inherit"
              sx={{ mr: 0.5 }}
            >
              <ManageAccountsIcon />
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
            {t("common.logout")}
          </Button>

          <Tooltip
            title={t("common.logout")}
          >
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
              sm: "row",
            }}
            spacing={2}
            sx={{
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },

              justifyContent:
                "space-between",
            }}
          >
            <Box>
              <Typography
                variant="h4"
                component="h1"
              >
                {t("dashboard.title")}
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.5,
                }}
              >
                {t("dashboard.subtitle")}
              </Typography>
            </Box>

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
                label={t(
                  "dashboard.total",
                  {
                    count: streams.length,
                  },
                )}
              />

              <Chip
                color="success"
                variant="outlined"
                label={
                  statusLoading
                    ? t(
                      "dashboard.runningLoading",
                    )
                    : t(
                      "dashboard.running",
                      {
                        count:
                          runningCount,
                      },
                    )
                }
              />

              {errorCount > 0 && (
                <Chip
                  color="error"
                  variant="outlined"
                  label={t(
                    "dashboard.problems",
                    {
                      count: errorCount,
                    },
                  )}
                />
              )}

              <Button
                component={Link}
                to="/streams"
                variant="outlined"
              >
                {t(
                  "dashboard.allStreams",
                )}
              </Button>

              {(user.role === "admin"
                || user.is_superuser
              ) && (
                <Button
                  component={Link}
                  to="/streams/new"
                  variant="contained"
                >
                  {t(
                    "dashboard.newStream",
                  )}
                </Button>
              )}

              <Tooltip
                title={t(
                  "common.refreshAll",
                )}
              >
                <span>
                  <IconButton
                    disabled={
                      streamsQuery
                        .isFetching
                      || statusQueries.some(
                        (query) =>
                          query.isFetching,
                      )
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
                      : <RefreshIcon />
                    }
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>

          <Card>
            <CardContent>
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
                sx={{
                  alignItems: {
                    xs: "flex-start",
                    sm: "center",
                  },
                }}
              >
                <Avatar>
                  {user.username
                    .slice(0, 1)
                    .toUpperCase()}
                </Avatar>

                <Box>
                  <Typography variant="h6">
                    {user.username}
                  </Typography>

                  <Typography
                    color="text.secondary"
                    variant="body2"
                  >
                    {user.email
                      ?? t(
                        "dashboard.emailMissing",
                      )}
                  </Typography>
                </Box>

                <Chip
                  label={
                    roleLabels[
                      user.role
                    ]
                  }
                  color={
                    user.role
                    === "admin"
                      ? "primary"
                      : "default"
                  }
                  sx={{
                    ml: {
                      sm: "auto",
                    },
                  }}
                />
              </Stack>
            </CardContent>
          </Card>

          {streamsQuery.isLoading && (
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                minHeight: 240,
              }}
            >
              <CircularProgress />
            </Box>
          )}

          {streamsQuery.isError && (
            <Alert severity="error">
              {t(
                "dashboard.loadError",
              )}
            </Alert>
          )}

          {!streamsQuery.isLoading
            && !streamsQuery.isError
            && streams.length === 0
            && (
              <Alert severity="info">
                {t("dashboard.empty")}
              </Alert>
            )}

          {streams.length > 0 && (
            <Box
              sx={{
                display: "grid",

                gridTemplateColumns: {
                  xs:
                    "minmax(0, 1fr)",

                  sm:
                    "repeat(2, "
                    + "minmax(0, 1fr))",

                  lg:
                    "repeat(3, "
                    + "minmax(0, 1fr))",

                  xl:
                    "repeat(4, "
                    + "minmax(0, 1fr))",
                },

                gap: 2,
              }}
            >
              {streams.map(
                  (
                    stream,
                    index,
                  ) => (
                    <StreamCard
                      key={stream.id}
                      stream={stream}
                      runtime={
                        statusQueries[
                          index
                        ]?.data
                      }
                      runtimeLoading={
                        statusQueries[
                          index
                        ]?.isFetching
                        ?? false
                      }
                      runtimeError={
                        statusQueries[
                          index
                        ]?.isError
                        ?? false
                      }
                      onRuntimeRefresh={
                        async () => {
                          await statusQueries[
                            index
                          ]?.refetch();
                        }
                      }
                      showDetails={false}
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
