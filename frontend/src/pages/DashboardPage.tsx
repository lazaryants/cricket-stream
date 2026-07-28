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
  useQuery,
} from "@tanstack/react-query";

import { getStreams }
  from "../api/streams";

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

  if (!user) {
    return null;
  }

  const streams =
    streamsQuery.data ?? [];

  const runningCount =
    streams.filter(
      (stream) =>
        stream.status
        === "running",
    ).length;

  const errorCount =
    streams.filter(
      (stream) =>
        stream.status
        === "error",
    ).length;

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
                Текущее состояние
                потоков и серверов
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                flexWrap: "wrap",
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
                  `Работает: ${
                    runningCount
                  }`
                }
              />

              {errorCount > 0 && (
                <Chip
                  color="error"
                  variant="outlined"
                  label={
                    `Ошибки: ${
                      errorCount
                    }`
                  }
                />
              )}

              <Tooltip title="Обновить список">
                <span>
                  <IconButton
                    disabled={
                      streamsQuery
                        .isFetching
                    }
                    onClick={() => {
                      void streamsQuery
                        .refetch();
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

                  md:
                    "repeat(2, "
                    + "minmax(0, 1fr))",

                  xl:
                    "repeat(3, "
                    + "minmax(0, 1fr))",
                },

                gap: 2.5,
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
