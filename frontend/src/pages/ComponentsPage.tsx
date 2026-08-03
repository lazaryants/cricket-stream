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
import { LanguageSwitcher }
  from "../components/LanguageSwitcher";
import { useI18n }
  from "../i18n/useI18n";

const labels = {
  streamlink: "Streamlink",
  "yt-dlp": "yt-dlp",
  ffmpeg: "FFmpeg",
} as const;

export default function ComponentsPage() {
  const {
    language,
    t,
  } = useI18n();

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
          direction={{
            xs: "column",
            sm: "row",
          }}
          spacing={1.5}
          sx={{
            alignItems: {
              xs: "stretch",
              sm: "center",
            },
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
              flexGrow: 1,
            }}
          >
            <Tooltip
              title={t("components.back")}
            >
              <IconButton
                component={Link}
                to="/"
              >
                <ArrowBackIcon />
              </IconButton>
            </Tooltip>

            <SystemUpdateAltIcon
              color="primary"
              fontSize="large"
            />

            <Box sx={{ flexGrow: 1 }}>
              <Typography
                variant="h4"
                sx={{ fontWeight: 800 }}
              >
                {t("components.title")}
              </Typography>

              <Typography
                color="text.secondary"
              >
                {t("components.subtitle")}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              justifyContent: {
                xs: "space-between",
                sm: "flex-end",
              },
            }}
          >
            <Button
              variant="outlined"
              startIcon={
                query.isFetching
                  ? (
                    <CircularProgress
                      size={17}
                    />
                  )
                  : <RefreshIcon />
              }
              disabled={query.isFetching}
              onClick={() => {
                void queryClientRefresh(
                  query.refetch,
                );
              }}
            >
              {query.isFetching
                ? t("components.checking")
                : t("components.check")}
            </Button>

            <LanguageSwitcher compact />
          </Stack>
        </Stack>

        <Alert severity="info">
          {t("components.updateNotice")}
        </Alert>

        {query.isError && (
          <Alert severity="error">
            {t("components.loadError")}
          </Alert>
        )}

        {query.isLoading && (
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              minHeight: 180,
            }}
          >
            <CircularProgress />
          </Box>
        )}

        {query.data && (
          <Stack spacing={2}>
            {Object.entries(
              query.data.components,
            ).map(([name, component]) => {
              const statusLabel =
                component.update_available
                  ? t(
                    "components.status.updateAvailable",
                  )
                  : component.error
                    ? t(
                      "components.status.checkFailed",
                    )
                    : component.update_available
                        === null
                      ? t(
                        "components.status.checked",
                      )
                      : t(
                        "components.status.upToDate",
                      );

              return (
                <Card
                  key={name}
                  variant="outlined"
                >
                  <CardContent>
                    <Stack spacing={1.5}>
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{
                          alignItems: "center",
                          justifyContent:
                            "space-between",
                        }}
                      >
                        <Typography variant="h6">
                          {labels[
                            name as keyof typeof labels
                          ] ?? name}
                        </Typography>

                        <Chip
                          color={
                            component.update_available
                              ? "warning"
                              : component.error
                                ? "error"
                                : component
                                    .update_available
                                    === null
                                  ? "info"
                                  : "success"
                          }
                          label={statusLabel}
                        />
                      </Stack>

                      <Stack
                        direction={{
                          xs: "column",
                          sm: "row",
                        }}
                        spacing={{
                          xs: 0.5,
                          sm: 4,
                        }}
                      >
                        <Typography>
                          {t(
                            "components.installed",
                          )}
                          {": "}
                          {component.installed ?? "—"}
                        </Typography>

                        <Typography>
                          {t(
                            "components.available",
                          )}
                          {": "}
                          {component.available ?? "—"}
                        </Typography>
                      </Stack>

                      {component.error && (
                        <Alert severity="warning">
                          {component.error}
                        </Alert>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {t("components.lastChecked")}
              {": "}
              {new Date(
                query.data.checked_at,
              ).toLocaleString(
                language === "ru"
                  ? "ru-RU"
                  : "en-US",
              )}
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
