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
import {
  useI18n,
} from "../i18n/useI18n";

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

export default function AccountPage() {
  const {
    t,
  } = useI18n();

  const auth = useAuth();
  const navigate = useNavigate();

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");
  const [
    newPassword,
    setNewPassword,
  ] = useState("");
  const [
    confirmation,
    setConfirmation,
  ] = useState("");
  const [
    pending,
    setPending,
  ] = useState(false);
  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(
        t(
          "password.newMinimumLength",
        ),
      );
      return;
    }

    if (
      newPassword
      !== confirmation
    ) {
      setError(
        t(
          "password.newMismatch",
        ),
      );
      return;
    }

    setPending(true);

    try {
      await changePassword({
        current_password:
          currentPassword,
        new_password:
          newPassword,
      });

      auth.logout();

      navigate(
        "/login",
        {
          replace: true,
          state: {
            passwordChanged:
              true,
          },
        },
      );
    } catch (requestError) {
      setError(
        errorText(
          requestError,
          t(
            "account.changeError",
          ),
        ),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Container
      maxWidth="sm"
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
          {t("account.backDashboard")}
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
                  {t(
                    "account.title",
                  )}
                </Typography>
                <Typography
                  color={
                    "text.secondary"
                  }
                >
                  {auth.user?.username}
                </Typography>
              </Stack>

              <Alert severity="info">
                {t(
                  "account.sessionsNotice",
                )}
              </Alert>

              {error && (
                <Alert severity="error">
                  {error}
                </Alert>
              )}

              <TextField
                label={t(
                  "password.current",
                )}
                type="password"
                value={currentPassword}
                onChange={(event) => {
                  setCurrentPassword(
                    event.target.value,
                  );
                }}
                autoComplete={
                  "current-password"
                }
                required
                disabled={pending}
              />

              <TextField
                label={t(
                  "password.new",
                )}
                type="password"
                value={newPassword}
                onChange={(event) => {
                  setNewPassword(
                    event.target.value,
                  );
                }}
                autoComplete={
                  "new-password"
                }
                helperText={t(
                  "password.minimumLengthHint",
                )}
                required
                disabled={pending}
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
                autoComplete={
                  "new-password"
                }
                required
                disabled={pending}
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={
                  pending
                    ? (
                      <CircularProgress
                        size={18}
                        color="inherit"
                      />
                    )
                    : <LockResetIcon />
                }
                disabled={
                  pending
                  || !currentPassword
                  || !newPassword
                  || !confirmation
                }
              >
                {t(
                  "account.changePassword",
                )}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
