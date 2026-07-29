import LogoutIcon
  from "@mui/icons-material/Logout";

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

import { StreamCard }
  from "../features/streams/StreamCard";

const roleLabels = {
  viewer: "Наблюдатель",
  operator: "Оператор",
  admin: "Администратор",
} as const;

export default function DashboardPage() {
  const auth = useAuth();
  const user = auth.user;

  const streamsQuery = useQuery({
    queryKey: [
      "streams",
    ],

    queryFn: getStreams,

    refetchInterval: 15_000,

    refetchIntervalInBackground:
      true,
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

        refetchInterval: 5_000,

        refetchIntervalInBackground:
          true,

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
                Трансляции
              </Typography>

              <Typography
                color="text.secondary"
                sx={{
                  mt: 0.5,
                }}
              >
                Текущее состояние потоков
                и серверов
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
                label={
                  `Всего: ${
                    streams.length
                  }`
                }
              />

              <Chip
                color="success"
                variant="outlined"
                label={
                  statusLoading
                    ? "Работает: …"
                    : `Работает: ${
                        runningCount
                      }`
                }
              />

              {errorCount > 0 && (
                <Chip
                  color="error"
                  variant="outlined"
                  label={
                    `Проблемы: ${
                      errorCount
                    }`
                  }
                />
              )}

              <Button
                component={Link}
                to="/streams"
                variant="outlined"
              >
                Все трансляции
              </Button>

              {(user.role === "admin"
                || user.is_superuser
              ) && (
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
                      ?? "Email не указан"}
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
              Не удалось загрузить список
              трансляций. Проверьте backend
              и повторите запрос.
            </Alert>
          )}

          {!streamsQuery.isLoading
            && !streamsQuery.isError
            && streams.length === 0
            && (
              <Alert severity="info">
                В системе пока нет
                настроенных потоков.
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
                (stream) => (
                  <StreamCard
                    key={stream.id}
                    stream={stream}
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
