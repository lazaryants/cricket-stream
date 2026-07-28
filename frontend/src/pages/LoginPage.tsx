import {
  useState,
  type FormEvent,
} from "react";

import LockOutlinedIcon
  from "@mui/icons-material/LockOutlined";

import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import axios from "axios";

import {
  Navigate,
  useLocation,
  useNavigate,
} from "react-router";

import { useAuth } from "../auth/useAuth";

interface LocationState {
  from?: string;
}

function getErrorMessage(
  error: unknown,
): string {
  if (axios.isAxiosError(error)) {
    const detail =
      error.response?.data?.detail;

    if (typeof detail === "string") {
      return detail;
    }
  }

  return (
    "Не удалось выполнить вход. "
    + "Проверьте имя пользователя "
    + "и пароль."
  );
}

export default function LoginPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [
    username,
    setUsername,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null,
  );

  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);

  const locationState =
    location.state as
      LocationState
      | null;

  const destination =
    locationState?.from
    ?? "/";

  if (auth.isAuthenticated) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await auth.login({
        username: username.trim(),
        password,
      });

      navigate(
        destination,
        {
          replace: true,
        },
      );
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        py: 4,
        background:
          "radial-gradient("
          + "circle at top, "
          + "rgba(59,130,246,0.18), "
          + "transparent 40%"
          + ")",
      }}
    >
      <Container maxWidth="xs">
        <Card
          elevation={12}
          sx={{
            border:
              "1px solid "
              + "rgba(255,255,255,0.08)",
          }}
        >
          <CardContent
            sx={{
              p: {
                xs: 3,
                sm: 4,
              },
            }}
          >
            <Stack
              component="form"
              spacing={3}
              onSubmit={
                handleSubmit
              }
            >
              <Stack
                spacing={1.5}
                sx={{
                  alignItems:
                    "center",
                  textAlign:
                    "center",
                }}
              >
                <Avatar
                  sx={{
                    bgcolor:
                      "primary.main",
                    width: 52,
                    height: 52,
                  }}
                >
                  <LockOutlinedIcon />
                </Avatar>

                <Typography
                  variant="h5"
                  component="h1"
                >
                  Cricket Stream
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  Вход в панель управления
                </Typography>
              </Stack>

              {errorMessage && (
                <Alert
                  severity="error"
                >
                  {errorMessage}
                </Alert>
              )}

              <TextField
                label="Имя пользователя"
                value={username}
                onChange={(event) => {
                  setUsername(
                    event.target.value,
                  );
                }}
                autoComplete="username"
                autoFocus
                required
                fullWidth
                disabled={
                  isSubmitting
                }
              />

              <TextField
                label="Пароль"
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(
                    event.target.value,
                  );
                }}
                autoComplete={
                  "current-password"
                }
                required
                fullWidth
                disabled={
                  isSubmitting
                }
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={
                  isSubmitting
                  || !username.trim()
                  || !password
                }
                startIcon={
                  isSubmitting
                    ? (
                      <CircularProgress
                        size={18}
                        color="inherit"
                      />
                    )
                    : undefined
                }
              >
                {isSubmitting
                  ? "Выполняется вход…"
                  : "Войти"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
