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
import type { AdminUser }
  from "../types/auth";


const roleLabels = {
  viewer: "Наблюдатель",
  operator: "Оператор",
  admin: "Администратор",
} as const;


function errorText(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
  }
  return "Не удалось сменить пароль.";
}


export default function UsersPage() {
  const auth = useAuth();
  const isAdmin =
    auth.user?.role === "admin"
    || auth.user?.is_superuser;
  const [selected, setSelected] =
    useState<AdminUser | null>(null);
  const [password, setPassword] =
    useState("");
  const [confirmation, setConfirmation] =
    useState("");
  const [formError, setFormError] =
    useState<string | null>(null);
  const [success, setSuccess] =
    useState<string | null>(null);

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
      const username = selected!.username;
      setSelected(null);
      setPassword("");
      setConfirmation("");
      setSuccess(
        `Пароль пользователя ${username} изменён. Его активные сеансы завершены.`,
      );
    },
    onError: (error) => {
      setFormError(errorText(error));
    },
  });

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  function openDialog(user: AdminUser) {
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
        "Пароль должен содержать не менее 8 символов.",
      );
      return;
    }
    if (password !== confirmation) {
      setFormError("Пароли не совпадают.");
      return;
    }
    resetMutation.mutate();
  }

  return (
    <Container
      maxWidth="lg"
      sx={{ py: { xs: 3, md: 5 } }}
    >
      <Stack spacing={3}>
        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBackIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          На Dashboard
        </Button>

        <Stack spacing={0.5}>
          <Typography variant="h4" component="h1">
            Пользователи
          </Typography>
          <Typography color="text.secondary">
            Смена паролей и завершение пользовательских сеансов
          </Typography>
        </Stack>

        {success && (
          <Alert
            severity="success"
            onClose={() => setSuccess(null)}
          >
            {success}
          </Alert>
        )}

        {usersQuery.isLoading && (
          <CircularProgress />
        )}
        {usersQuery.isError && (
          <Alert severity="error">
            Не удалось загрузить пользователей.
          </Alert>
        )}

        {usersQuery.data && (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Пользователь</TableCell>
                  <TableCell>Роль</TableCell>
                  <TableCell>Состояние</TableCell>
                  <TableCell>Последний вход</TableCell>
                  <TableCell align="right">Действия</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {usersQuery.data.map((user) => (
                  <TableRow key={user.id} hover>
                    <TableCell>
                      <Typography
                        sx={{ fontWeight: 600 }}
                      >
                        {user.username}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {user.email ?? "Email не указан"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={roleLabels[user.role]}
                        color={
                          user.role === "admin"
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
                            ? "Активен"
                            : "Отключён"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {user.last_login_at
                        ? new Intl.DateTimeFormat(
                            "ru-RU",
                            {
                              dateStyle: "short",
                              timeStyle: "short",
                            },
                          ).format(
                            new Date(user.last_login_at),
                          )
                        : "—"}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip
                        title={
                          user.id === auth.user?.id
                            ? "Свой пароль меняется в разделе Аккаунт"
                            : "Сменить пароль"
                        }
                      >
                        <span>
                        <IconButton
                          onClick={() => openDialog(user)}
                          disabled={
                            user.id === auth.user?.id
                          }
                          aria-label={
                            `Сменить пароль ${user.username}`
                          }
                        >
                          <LockResetIcon />
                        </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>

      <Dialog
        open={selected !== null}
        onClose={() => {
          if (!resetMutation.isPending) {
            setSelected(null);
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>
          Сменить пароль: {selected?.username}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="warning">
              Все активные сеансы пользователя будут завершены.
            </Alert>
            {formError && (
              <Alert severity="error">
                {formError}
              </Alert>
            )}
            <TextField
              label="Новый пароль"
              type="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
              autoComplete="new-password"
              helperText="Не менее 8 символов"
              disabled={resetMutation.isPending}
              autoFocus
            />
            <TextField
              label="Повторите новый пароль"
              type="password"
              value={confirmation}
              onChange={(event) => {
                setConfirmation(event.target.value);
              }}
              autoComplete="new-password"
              disabled={resetMutation.isPending}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setSelected(null)}
            disabled={resetMutation.isPending}
          >
            Отмена
          </Button>
          <Button
            variant="contained"
            onClick={submitReset}
            disabled={
              resetMutation.isPending
              || !password
              || !confirmation
            }
          >
            {resetMutation.isPending
              ? "Сохранение…"
              : "Сменить пароль"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
