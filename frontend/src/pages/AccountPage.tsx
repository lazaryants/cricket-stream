import ArrowBackIcon
  from "@mui/icons-material/ArrowBack";
import LockResetIcon
  from "@mui/icons-material/LockReset";

import {
  Alert,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  useState,
  type FormEvent,
} from "react";

import axios from "axios";
import {
  Link,
  useNavigate,
} from "react-router";

import { changePassword }
  from "../api/auth";
import { useAuth }
  from "../auth/useAuth";


function errorText(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail;
    if (typeof detail === "string") {
      return detail;
    }
  }
  return "Не удалось изменить пароль.";
}


export default function AccountPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] =
    useState("");
  const [newPassword, setNewPassword] =
    useState("");
  const [confirmation, setConfirmation] =
    useState("");
  const [pending, setPending] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  async function submit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(
        "Новый пароль должен содержать не менее 8 символов.",
      );
      return;
    }
    if (newPassword !== confirmation) {
      setError("Новые пароли не совпадают.");
      return;
    }

    setPending(true);
    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      auth.logout();
      navigate("/login", {
        replace: true,
        state: {
          passwordChanged: true,
        },
      });
    } catch (requestError) {
      setError(errorText(requestError));
    } finally {
      setPending(false);
    }
  }

  return (
    <Container
      maxWidth="sm"
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

        <Card>
          <CardContent>
            <Stack
              component="form"
              spacing={2.5}
              onSubmit={submit}
            >
              <Stack spacing={0.5}>
                <Typography
                  variant="h5"
                  component="h1"
                >
                  Аккаунт
                </Typography>
                <Typography color="text.secondary">
                  {auth.user?.username}
                </Typography>
              </Stack>

              <Alert severity="info">
                После смены пароля все ранее
                выданные сеансы будут завершены.
                Потребуется войти заново.
              </Alert>

              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}

              <TextField
                label="Текущий пароль"
                type="password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(
                    event.target.value,
                  );
                }}
                autoComplete="current-password"
                required
                disabled={pending}
              />
              <TextField
                label="Новый пароль"
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(event.target.value);
                }}
                autoComplete="new-password"
                helperText="Не менее 8 символов"
                required
                disabled={pending}
              />
              <TextField
                label="Повторите новый пароль"
                type="password"
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                }}
                autoComplete="new-password"
                required
                disabled={pending}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={
                  pending
                    ? <CircularProgress
                        size={18}
                        color="inherit"
                      />
                    : <LockResetIcon />
                }
                disabled={
                  pending
                  || !currentPassword
                  || !newPassword
                  || !confirmation
                }
              >
                Изменить пароль
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
