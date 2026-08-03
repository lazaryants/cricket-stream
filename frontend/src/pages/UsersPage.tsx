import ArrowBackIcon
  from "@mui/icons-material/ArrowBack";
import LockResetIcon
  from "@mui/icons-material/LockReset";

import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import { useState }
  from "react";
import axios from "axios";
import {
  useMutation,
  useQuery,
} from "@tanstack/react-query";
import {
  Link,
  Navigate,
} from "react-router";

import {
  getUsers,
  resetUserPassword,
} from "../api/users";
import { useAuth }
  from "../auth/useAuth";
import {
  useI18n,
} from "../i18n/useI18n";
import type { AdminUser }
  from "../types/auth";

function errorText(
  error: unknown,
  fallbackMessage: string,
): string {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
  }
  return fallbackMessage;
}

export default function UsersPage() {
  const {
    language,
    t,
  } = useI18n();

  const auth = useAuth();
  const isAdmin =
    auth.user?.role === "admin"
    || auth.user?.is_superuser;

  const roleLabels = {
    viewer: t("role.viewer"),
    operator: t("role.operator"),
    admin: t("role.admin"),
  } as const;

  const [
    selected,
    setSelected,
  ] = useState<AdminUser | null>(
    null,
  );
  const [
    password,
    setPassword,
  ] = useState("");
  const [
    confirmation,
    setConfirmation,
  ] = useState("");
  const [
    formError,
    setFormError,
  ] = useState<string | null>(
    null,
  );
  const [
    success,
    setSuccess,
  ] = useState<string | null>(
    null,
  );

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
    enabled: Boolean(isAdmin),
  });

  const resetMutation = useMutation({
    mutationFn: () =>
      resetUserPassword(
        selected!.id,
        password,
      ),
    onSuccess: () => {
      const username =
        selected!.username;
      setSelected(null);
      setPassword("");
      setConfirmation("");
      setSuccess(
        t(
          "users.passwordChanged",
          {
            username,
          },
        ),
      );
    },
    onError: (error) => {
      setFormError(
        errorText(
          error,
          t("users.passwordChangeError"),
        ),
      );
    },
  });

  if (!isAdmin) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  function openDialog(
    user: AdminUser,
  ) {
    setSelected(user);
    setPassword("");
    setConfirmation("");
    setFormError(null);
    setSuccess(null);
  }

  function submitReset() {
    setFormError(null);

    if (password.length < 8) {
      setFormError(
        t("password.minimumLength"),
      );
      return;
    }

    if (password !== confirmation) {
      setFormError(
        t("password.mismatch"),
      );
      return;
    }

    resetMutation.mutate();
  }

  return (
    <Container
      maxWidth="lg"
      sx={{
        py: {
          xs: 3,
          md: 5,
        },
      }}
    >
      <Stack spacing={3}>
        <Button
          component={Link}
          to="/"
          startIcon={
            <ArrowBackIcon />
          }
          sx={{
            alignSelf:
              "flex-start",
          }}
        >
          {t("users.backDashboard")}
        </Button>

        <Stack spacing={0.5}>
          <Typography
            variant="h4"
            component="h1"
          >
            {t("users.title")}
          </Typography>
          <Typography
            color="text.secondary"
          >
            {t("users.subtitle")}
          </Typography>
        </Stack>

        {success && (
          <Alert
            severity="success"
            onClose={() =>
              setSuccess(null)
            }
          >
            {success}
          </Alert>
        )}

        {usersQuery.isLoading && (
          <CircularProgress />
        )}

        {usersQuery.isError && (
          <Alert severity="error">
            {t("users.loadError")}
          </Alert>
        )}

        {usersQuery.data && (
          <TableContainer
            component={Paper}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    {t(
                      "users.column.user",
                    )}
                  </TableCell>
                  <TableCell>
                    {t(
                      "users.column.role",
                    )}
                  </TableCell>
                  <TableCell>
                    {t(
                      "users.column.status",
                    )}
                  </TableCell>
                  <TableCell>
                    {t(
                      "users.column.lastLogin",
                    )}
                  </TableCell>
                  <TableCell
                    align="right"
                  >
                    {t(
                      "users.column.actions",
                    )}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersQuery.data.map(
                  (user) => (
                    <TableRow
                      key={user.id}
                      hover
                    >
                      <TableCell>
                        <Typography
                          sx={{
                            fontWeight:
                              600,
                          }}
                        >
                          {user.username}
                        </Typography>
                        <Typography
                          variant="body2"
                          color={
                            "text.secondary"
                          }
                        >
                          {user.email
                            ?? t(
                              "dashboard.emailMissing",
                            )}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
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
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          variant="outlined"
                          color={
                            user.is_active
                              ? "success"
                              : "default"
                          }
                          label={
                            user.is_active
                              ? t(
                                "users.active",
                              )
                              : t(
                                "users.disabled",
                              )
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {user.last_login_at
                          ? new Intl
                            .DateTimeFormat(
                              language
                                === "ru"
                                ? "ru-RU"
                                : "en-GB",
                              {
                                dateStyle:
                                  "short",
                                timeStyle:
                                  "short",
                              },
                            )
                            .format(
                              new Date(
                                user
                                  .last_login_at,
                              ),
                            )
                          : "—"}
                      </TableCell>
                      <TableCell
                        align="right"
                      >
                        <Tooltip
                          title={
                            user.id
                            === auth.user
                              ?.id
                              ? t(
                                "users.selfPasswordHint",
                              )
                              : t(
                                "users.changePassword",
                              )
                          }
                        >
                          <span>
                            <IconButton
                              onClick={() =>
                                openDialog(
                                  user,
                                )
                              }
                              disabled={
                                user.id
                                === auth.user
                                  ?.id
                              }
                              aria-label={t(
                                "users.changePasswordFor",
                                {
                                  username:
                                    user.username,
                                },
                              )}
                            >
                              <LockResetIcon />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ),
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Dialog
        open={selected !== null}
        onClose={() => {
          if (
            !resetMutation
              .isPending
          ) {
            setSelected(null);
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          {t(
            "users.changePasswordTitle",
            {
              username:
                selected?.username
                ?? "",
            },
          )}
        </DialogTitle>
        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              pt: 1,
            }}
          >
            <Alert severity="warning">
              {t(
                "users.sessionsWarning",
              )}
            </Alert>

            {formError && (
              <Alert severity="error">
                {formError}
              </Alert>
            )}

            <TextField
              label={t(
                "password.new",
              )}
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(
                  event.target.value,
                );
              }}
              autoComplete="new-password"
              helperText={t(
                "password.minimumLengthHint",
              )}
              disabled={
                resetMutation
                  .isPending
              }
              autoFocus
            />

            <TextField
              label={t(
                "password.confirmNew",
              )}
              type="password"
              value={confirmation}
              onChange={(event) => {
                setConfirmation(
                  event.target.value,
                );
              }}
              autoComplete="new-password"
              disabled={
                resetMutation
                  .isPending
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setSelected(null)
            }
            disabled={
              resetMutation
                .isPending
            }
          >
            {t("users.cancel")}
          </Button>

          <Button
            variant="contained"
            onClick={submitReset}
            disabled={
              resetMutation
                .isPending
              || !password
              || !confirmation
            }
          >
            {resetMutation.isPending
              ? t("users.saving")
              : t(
                "users.changePassword",
              )}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
