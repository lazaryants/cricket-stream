import {
  useEffect,
  useRef,
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

import { useAuth }
  from "../auth/useAuth";
import { LanguageSwitcher }
  from "../components/LanguageSwitcher";
import { useI18n }
  from "../i18n/useI18n";

interface LocationState {
  from?: string;
  passwordChanged?: boolean;
}

function getErrorMessage(
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

export default function LoginPage() {
  const {
    t,
  } = useI18n();

  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const usernameInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  const passwordInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

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

  useEffect(() => {
    let attempt = 0;
    let timeoutId:
      ReturnType<typeof setTimeout>
      | undefined;

    const syncAutofill = () => {
      const autofilledUsername =
        usernameInputRef
          .current
          ?.value
          ?? "";

      const autofilledPassword =
        passwordInputRef
          .current
          ?.value
          ?? "";

      if (autofilledUsername) {
        setUsername(
          autofilledUsername,
        );
      }

      if (autofilledPassword) {
        setPassword(
          autofilledPassword,
        );
      }

      attempt += 1;

      /*
       * Firefox and Chromium may apply
       * saved credentials shortly after
       * the initial React render.
       */
      if (
        attempt < 10
        && (
          !autofilledUsername
          || !autofilledPassword
        )
      ) {
        timeoutId = setTimeout(
          syncAutofill,
          100,
        );
      }
    };

    timeoutId = setTimeout(
      syncAutofill,
      0,
    );

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

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
        getErrorMessage(
          error,
          t("login.error"),
        ),
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
        position: "relative",
        background:
          "radial-gradient("
          + "circle at top, "
          + "rgba(59,130,246,0.18), "
          + "transparent 40%"
          + ")",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: {
            xs: 16,
            sm: 24,
          },
          right: {
            xs: 16,
            sm: 24,
          },
          zIndex: 1,
        }}
      >
        <LanguageSwitcher
          compact
        />
      </Box>

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
                  {t(
                    "login.subtitle",
                  )}
                </Typography>
              </Stack>

              {errorMessage && (
                <Alert
                  severity="error"
                >
                  {errorMessage}
                </Alert>
              )}

              {locationState
                ?.passwordChanged
                && (
                  <Alert
                    severity="success"
                  >
                    {t(
                      "login.passwordChanged",
                    )}
                  </Alert>
                )}

              <TextField
                inputRef={
                  usernameInputRef
                }
                label={t(
                  "login.username",
                )}
                value={username}
                onChange={(event) => {
                  setUsername(
                    event.target.value,
                  );
                }}
                autoComplete="username"
                sx={{
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow:
                      "0 0 0 1000px "
                      + "rgba(15,23,42,1) "
                      + "inset",
                    WebkitTextFillColor:
                      "#ffffff",
                    caretColor:
                      "#ffffff",
                    transition:
                      "background-color "
                      + "9999s ease-out 0s",
                  },
                  "& input:-moz-autofill": {
                    boxShadow:
                      "0 0 0 1000px "
                      + "rgba(15,23,42,1) "
                      + "inset",
                    color:
                      "#ffffff",
                    caretColor:
                      "#ffffff",
                  },
                }}
                autoFocus
                required
                fullWidth
                disabled={
                  isSubmitting
                }
              />

              <TextField
                inputRef={
                  passwordInputRef
                }
                label={t(
                  "login.password",
                )}
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
                sx={{
                  "& input:-webkit-autofill": {
                    WebkitBoxShadow:
                      "0 0 0 1000px "
                      + "rgba(15,23,42,1) "
                      + "inset",
                    WebkitTextFillColor:
                      "#ffffff",
                    caretColor:
                      "#ffffff",
                    transition:
                      "background-color "
                      + "9999s ease-out 0s",
                  },
                  "& input:-moz-autofill": {
                    boxShadow:
                      "0 0 0 1000px "
                      + "rgba(15,23,42,1) "
                      + "inset",
                    color:
                      "#ffffff",
                    caretColor:
                      "#ffffff",
                  },
                }}
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
                  ? t(
                    "login.submitting",
                  )
                  : t(
                    "login.submit",
                  )}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
