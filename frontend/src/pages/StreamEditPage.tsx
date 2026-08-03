import ArrowBackIcon
  from "@mui/icons-material/ArrowBack";

import DeleteIcon
  from "@mui/icons-material/Delete";

import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import {
  useState,
} from "react";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Link,
  Navigate,
  useNavigate,
  useParams,
} from "react-router";

import {
  deleteStream,
  getStream,
  updateStream,
} from "../api/streams";

import { useAuth }
  from "../auth/useAuth";

import { useI18n } from "../i18n/useI18n";
import { StreamForm }
  from "../features/streams/StreamForm";

import type {
  StreamCreateRequest,
  StreamUpdateRequest,
} from "../types/stream";


export default function StreamEditPage() {
  const { t } = useI18n();
  const auth = useAuth();
  const navigate = useNavigate();
  const queryClient =
    useQueryClient();

  const [
    deleteDialogOpen,
    setDeleteDialogOpen,
  ] = useState(false);

  const params = useParams<{
    streamId: string;
  }>();

  const streamId =
    Number(params.streamId);

  const canEdit =
    auth.user?.role === "operator"
    || auth.user?.role === "admin"
    || auth.user?.is_superuser;

  const isAdmin =
    auth.user?.role === "admin"
    || auth.user?.is_superuser;

  const streamQuery = useQuery({
    queryKey: [
      "stream",
      streamId,
    ],

    queryFn: () =>
      getStream(streamId),

    enabled:
      Number.isInteger(streamId)
      && streamId > 0
      && Boolean(canEdit),
  });

  const updateMutation =
    useMutation({
      mutationFn: (
        data: StreamUpdateRequest,
      ) => updateStream(
        streamId,
        data,
      ),

      onSuccess: async (stream) => {
        await Promise.all([
          queryClient
            .invalidateQueries({
              queryKey: [
                "streams",
              ],
            }),

          queryClient
            .invalidateQueries({
              queryKey: [
                "stream",
                streamId,
              ],
            }),

          queryClient
            .invalidateQueries({
              queryKey: [
                "stream-status",
                streamId,
              ],
            }),
        ]);

        navigate(
          `/streams/${stream.id}`,
          {
            replace: true,
          },
        );
      },
    });

  const deleteMutation =
    useMutation({
      mutationFn: () =>
        deleteStream(streamId),

      onSuccess: async () => {
        await queryClient
          .invalidateQueries({
            queryKey: ["streams"],
          });

        navigate(
          "/",
          {
            replace: true,
          },
        );
      },
    });

  if (
    !canEdit
    || !Number.isInteger(streamId)
    || streamId <= 0
  ) {
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
    await updateMutation
      .mutateAsync(
        data as StreamUpdateRequest,
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
        <Stack
          direction="row"
          spacing={1}
          sx={{
            alignItems: "center",
          }}
        >
          <Button
            component={Link}
            to={`/streams/${streamId}`}
            startIcon={
              <ArrowBackIcon />
            }
          >
            {t("libraries.back")}
          </Button>

          <span
            style={{
              flexGrow: 1,
            }}
          />

          {isAdmin && (
            <Button
              color="error"
              variant="outlined"
              startIcon={
                <DeleteIcon />
              }
              disabled={
                deleteMutation
                  .isPending
              }
              onClick={() => {
                setDeleteDialogOpen(
                  true,
                );
              }}
            >
              {t("libraries.delete")}
            </Button>
          )}
        </Stack>

        <Typography
          variant="h4"
          component="h1"
        >
          {t("streamEdit.title")}
        </Typography>

        {streamQuery.isLoading && (
          <CircularProgress />
        )}

        {streamQuery.isError && (
          <Alert severity="error">
            {t("streamEdit.loadError")}
          </Alert>
        )}

        {updateMutation.isError && (
          <Alert severity="error">
            {t("streamEdit.saveError")}
          </Alert>
        )}

        {deleteMutation.isError && (
          <Alert severity="error">
            {t("streamEdit.deleteError")}
          </Alert>
        )}

        {streamQuery.data && (
          <StreamForm
            mode="edit"
            stream={streamQuery.data}
            isAdmin={Boolean(isAdmin)}
            isSubmitting={
              updateMutation.isPending
            }
            onSubmit={handleSubmit}
          />
        )}
      </Stack>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => {
          if (
            !deleteMutation.isPending
          ) {
            setDeleteDialogOpen(
              false,
            );
          }
        }}
      >
        <DialogTitle>
          {t("streamEdit.deleteTitle")}
        </DialogTitle>

        <DialogContent>
          <DialogContentText>
            {t("streamEdit.deleteWarning")}
          </DialogContentText>
        </DialogContent>

        <DialogActions>
          <Button
            disabled={
              deleteMutation.isPending
            }
            onClick={() => {
              setDeleteDialogOpen(
                false,
              );
            }}
          >
            {t("libraries.cancel")}
          </Button>

          <Button
            color="error"
            variant="contained"
            disabled={
              deleteMutation.isPending
            }
            onClick={() => {
              deleteMutation.mutate();
            }}
          >
            {deleteMutation.isPending
              ? t("libraries.deleting")
              : t("libraries.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
