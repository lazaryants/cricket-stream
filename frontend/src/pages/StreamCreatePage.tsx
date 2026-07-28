import ArrowBackIcon
  from "@mui/icons-material/ArrowBack";

import {
  Alert,
  Button,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import {
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Link,
  Navigate,
  useNavigate,
} from "react-router";

import { createStream }
  from "../api/streams";

import { useAuth }
  from "../auth/useAuth";

import { StreamForm }
  from "../features/streams/StreamForm";

import type {
  StreamCreateRequest,
  StreamUpdateRequest,
} from "../types/stream";


export default function StreamCreatePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient =
    useQueryClient();

  const isAdmin =
    auth.user?.role === "admin"
    || auth.user?.is_superuser;

  const mutation = useMutation({
    mutationFn: (
      data: StreamCreateRequest,
    ) => createStream(data),

    onSuccess: async (stream) => {
      await queryClient
        .invalidateQueries({
          queryKey: ["streams"],
        });

      navigate(
        `/streams/${stream.id}`,
        {
          replace: true,
        },
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

  async function handleSubmit(
    data:
      | StreamCreateRequest
      | StreamUpdateRequest,
  ) {
    await mutation.mutateAsync(
      data as StreamCreateRequest,
    );
  }

  return (
    <Container
      maxWidth="md"
      sx={{
        py: {
          xs: 3,
          md: 4,
        },
      }}
    >
      <Stack spacing={3}>
        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBackIcon />}
          sx={{
            alignSelf: "flex-start",
          }}
        >
          Назад
        </Button>

        <Typography
          variant="h4"
          component="h1"
        >
          Создать трансляцию
        </Typography>

        {mutation.isError && (
          <Alert severity="error">
            Создать карточку
            не удалось.
          </Alert>
        )}

        <StreamForm
          mode="create"
          isAdmin
          isSubmitting={
            mutation.isPending
          }
          onSubmit={handleSubmit}
        />
      </Stack>
    </Container>
  );
}
