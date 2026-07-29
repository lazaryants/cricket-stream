import EditIcon
  from "@mui/icons-material/Edit";
import OpenInNewIcon
  from "@mui/icons-material/OpenInNew";
import PlayArrowIcon
  from "@mui/icons-material/PlayArrow";
import StopIcon
  from "@mui/icons-material/Stop";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  Switch,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import axios from "axios";
import {
  Link,
} from "react-router";
import {
  getStreamDiagnostics,
  startStream,
  stopStream,
  updateStream,
} from "../../api/streams";
import { StreamDiagnosticChip }
  from "../../components/StreamDiagnosticChip";
import { StreamLiveMetrics }
  from "../../components/StreamLiveMetrics";
import { StreamStatusChip }
  from "../../components/StreamStatusChip";
import type {
  StreamItem,
  StreamRuntimeStatus,
} from "../../types/stream";
import {
  useState,
} from "react";

const providerLabels: Record<
  string,
  string
> = {
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  vimeo: "Vimeo",
  custom: "Прямая ссылка",
  unknown: "Неизвестно",
};

interface StreamRowProps {
  stream: StreamItem;
  runtime:
    StreamRuntimeStatus | undefined;
  canManage: boolean;
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

    if (
      typeof detail === "object"
      && detail !== null
      && "message" in detail
      && typeof detail.message
        === "string"
    ) {
      return detail.message;
    }
  }

  return (
    "Операция не выполнена. "
    + "Проверьте состояние трансляции."
  );
}

function getEffectiveStatus(
  stream: StreamItem,
  runtime:
    StreamRuntimeStatus | undefined,
): string {
  return (
    runtime?.database_status
    ?? stream.status
  );
}

function isStreamRunning(
  stream: StreamItem,
  runtime:
    StreamRuntimeStatus | undefined,
): boolean {
  if (
    runtime?.process_alive
    !== undefined
  ) {
    return runtime.process_alive;
  }

  const status =
    getEffectiveStatus(
      stream,
      runtime,
    );

  return (
    status === "running"
    || status === "starting"
    || status === "restarting"
  );
}

export function StreamRow({
  stream,
  runtime,
  canManage,
}: StreamRowProps) {
  const queryClient =
    useQueryClient();

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  const effectiveStatus =
    getEffectiveStatus(
      stream,
      runtime,
    );

  const running =
    isStreamRunning(
      stream,
      runtime,
    );

  const canStop =
    running
    || effectiveStatus === "starting"
    || effectiveStatus === "running"
    || effectiveStatus === "restarting"
    || effectiveStatus === "stopping";

  const diagnosticQuery =
    useQuery({
      queryKey: [
        "stream-diagnostics",
        stream.id,
      ],
      queryFn: () =>
        getStreamDiagnostics(
          stream.id,
        ),
      refetchInterval: 5_000,
      refetchIntervalInBackground:
        true,
      retry: 1,
    });

  async function invalidateData() {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: [
          "streams",
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "stream-status",
          stream.id,
        ],
      }),
      queryClient.invalidateQueries({
        queryKey: [
          "stream-diagnostics",
          stream.id,
        ],
      }),
    ]);
  }

  const dashboardMutation =
    useMutation({
      mutationFn: (
        showOnDashboard: boolean,
      ) =>
        updateStream(
          stream.id,
          {
            show_on_dashboard:
              showOnDashboard,
          },
        ),
      onMutate: () => {
        setActionError(null);
      },
      onSuccess: async () => {
        await invalidateData();
      },
      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

  const startMutation =
    useMutation({
      mutationFn: () =>
        startStream(
          stream.id,
        ),
      onMutate: () => {
        setActionError(null);
      },
      onSuccess: async () => {
        await invalidateData();
      },
      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

  const stopMutation =
    useMutation({
      mutationFn: () =>
        stopStream(
          stream.id,
        ),
      onMutate: () => {
        setActionError(null);
      },
      onSuccess: async () => {
        await invalidateData();
      },
      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

  const actionPending =
    dashboardMutation.isPending
    || startMutation.isPending
    || stopMutation.isPending;

  return (
    <>
      <TableRow
        hover
        sx={{
          "&:last-child td": {
            borderBottom: 0,
          },
        }}
      >
        <TableCell
          padding="checkbox"
          align="center"
        >
          <Tooltip
            title={
              stream.show_on_dashboard
                ? "Показывается на Dashboard"
                : "Скрыта с Dashboard"
            }
          >
            <span>
              <Switch
                size="small"
                checked={
                  stream
                    .show_on_dashboard
                }
                disabled={
                  !canManage
                  || dashboardMutation
                    .isPending
                }
                onChange={(
                  _event,
                  checked,
                ) => {
                  dashboardMutation
                    .mutate(checked);
                }}
                slotProps={{
                  input: {
                    "aria-label":
                      "Показывать на Dashboard",
                  },
                }}
              />
            </span>
          </Tooltip>
        </TableCell>

        <TableCell>
          <Stack
            spacing={0.35}
            sx={{
              minWidth: 180,
            }}
          >
            <Typography
              sx={{
                fontWeight: 600,
              }}
            >
              {stream.name}
            </Typography>

            {stream.description && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  maxWidth: 360,
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={
                  stream.description
                }
              >
                {stream.description}
              </Typography>
            )}
          </Stack>
        </TableCell>

        <TableCell>
          <StreamStatusChip
            status={
              effectiveStatus
            }
          />
        </TableCell>

        <TableCell>
          <StreamDiagnosticChip
            diagnostic={
              diagnosticQuery
                .data
                ?.diagnostic
            }
            loading={
              diagnosticQuery
                .isLoading
            }
            error={
              diagnosticQuery
                .isError
            }
          />
        </TableCell>

          <TableCell>
            <StreamLiveMetrics
              metrics={
                runtime?.metrics
              }
              processAlive={running}
              compact
            />
          </TableCell>

        <TableCell>
          <Chip
            size="small"
            variant="outlined"
            label={
              providerLabels[
                stream.provider
              ] ?? stream.provider
            }
          />
        </TableCell>

        <TableCell>
          <Typography
            variant="body2"
          >
            Node #{stream.node_id}
          </Typography>
        </TableCell>

        <TableCell>
          <Chip
            size="small"
            color={
              stream.enabled
                ? "success"
                : "default"
            }
            variant="outlined"
            label={
              stream.enabled
                ? "Включена"
                : "Отключена"
            }
          />
        </TableCell>

        <TableCell align="right">
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              justifyContent:
                "flex-end",
              minWidth: 275,
            }}
          >
            <Tooltip title="Подробнее">
              <IconButton
                component={Link}
                to={
                  `/streams/${stream.id}`
                }
                size="small"
              >
                <OpenInNewIcon
                  fontSize="small"
                />
              </IconButton>
            </Tooltip>

            {canManage && (
              <Tooltip
                title="Редактировать"
              >
                <IconButton
                  component={Link}
                  to={
                    `/streams/${stream.id}/edit`
                  }
                  size="small"
                >
                  <EditIcon
                    fontSize="small"
                  />
                </IconButton>
              </Tooltip>
            )}

            {canManage && (
              <>
                <Button
                  size="small"
                  color="success"
                  variant="contained"
                  startIcon={
                    startMutation
                      .isPending
                      ? (
                        <CircularProgress
                          size={15}
                          color="inherit"
                        />
                      )
                      : (
                        <PlayArrowIcon />
                      )
                  }
                  disabled={
                    actionPending
                    || running
                    || !stream.enabled
                  }
                  onClick={() => {
                    startMutation
                      .mutate();
                  }}
                >
                  Старт
                </Button>

                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  startIcon={
                    stopMutation
                      .isPending
                      ? (
                        <CircularProgress
                          size={15}
                          color="inherit"
                        />
                      )
                      : <StopIcon />
                  }
                  disabled={
                    actionPending
                    || !canStop
                  }
                  onClick={() => {
                    stopMutation
                      .mutate();
                  }}
                >
                  Стоп
                </Button>
              </>
            )}
          </Stack>
        </TableCell>
      </TableRow>

      {actionError && (
        <TableRow>
          <TableCell
            colSpan={8}
            sx={{
              pt: 0,
            }}
          >
            <Alert
              severity="error"
              onClose={() => {
                setActionError(null);
              }}
            >
              {actionError}
            </Alert>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
