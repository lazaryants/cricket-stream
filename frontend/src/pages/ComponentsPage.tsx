import ArrowBackIcon
  from "@mui/icons-material/ArrowBack";
import RefreshIcon
  from "@mui/icons-material/Refresh";
import SystemUpdateAltIcon
  from "@mui/icons-material/SystemUpdateAlt";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import { useQuery }
  from "@tanstack/react-query";

import { Link, Navigate }
  from "react-router";

import {
  getComponents,
} from "../api/components";
import { useAuth }
  from "../auth/useAuth";


const labels = {
  streamlink: "Streamlink",
  "yt-dlp": "yt-dlp",
  ffmpeg: "FFmpeg",
} as const;


export default function ComponentsPage() {
  const auth = useAuth();
  const isAdmin = Boolean(
    auth.user?.role === "admin"
    || auth.user?.is_superuser,
  );

  const query = useQuery({
    queryKey: ["components"],
    queryFn: () => getComponents(false),
    enabled: isAdmin,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <Container
      maxWidth="md"
      sx={{ py: { xs: 2, md: 4 } }}
    >
      <Stack spacing={3}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "center" }}
        >
          <Tooltip title="Назад">
            <IconButton component={Link} to="/">
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <SystemUpdateAltIcon
            color="primary"
            fontSize="large"
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              Компоненты видеотракта
            </Typography>
            <Typography color="text.secondary">
              Установленные и доступные версии
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={
              query.isFetching
                ? <CircularProgress size={17} />
                : <RefreshIcon />
            }
            disabled={query.isFetching}
            onClick={() => {
              void queryClientRefresh(query.refetch);
            }}
          >
            Проверить
          </Button>
        </Stack>

        <Alert severity="info">
          Страница только проверяет версии. Обновление
          выполняется администратором в плановое окно,
          чтобы не прерывать активные трансляции.
        </Alert>

        {query.isError && (
          <Alert severity="error">
            Не удалось проверить версии компонентов.
          </Alert>
        )}

        {query.isLoading && (
          <Box sx={{ display: "grid", placeItems: "center", minHeight: 180 }}>
            <CircularProgress />
          </Box>
        )}

        {query.data && (
          <Stack spacing={2}>
            {Object.entries(
              query.data.components,
            ).map(([name, component]) => (
              <Card key={name} variant="outlined">
                <CardContent>
                  <Stack spacing={1.5}>
                    <Stack
                      direction="row"
                      sx={{
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <Typography variant="h6">
                        {labels[name as keyof typeof labels]}
                      </Typography>
                      <Chip
                        color={
                          component.update_available
                            ? "warning"
                            : (
                              component.error
                                ? "error"
                                : (
                                  component.update_available
                                    === null
                                    ? "info"
                                    : "success"
                                )
                            )
                        }
                        label={
                          component.update_available
                            ? "Доступно обновление"
                            : (
                              component.error
                                ? "Ошибка проверки"
                                : (
                                  component.update_available
                                    === null
                                    ? "Проверено"
                                    : "Актуально"
                                )
                            )
                        }
                      />
                    </Stack>
                    <Typography>
                      Установлено: {component.installed ?? "—"}
                    </Typography>
                    <Typography>
                      Доступно: {component.available ?? "—"}
                    </Typography>
                    {component.error && (
                      <Alert severity="warning">
                        {component.error}
                      </Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
            <Typography variant="caption" color="text.secondary">
              Проверено: {new Date(query.data.checked_at).toLocaleString("ru-RU")}
            </Typography>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}


async function queryClientRefresh(
  refetch: () => Promise<unknown>,
): Promise<void> {
  await getComponents(true);
  await refetch();
}
