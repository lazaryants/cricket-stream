import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

import AddIcon
  from "@mui/icons-material/Add";
import ArrowBackIcon
  from "@mui/icons-material/ArrowBack";
import DeleteIcon
  from "@mui/icons-material/Delete";
import EditIcon
  from "@mui/icons-material/Edit";
import RefreshIcon
  from "@mui/icons-material/Refresh";
import SearchIcon
  from "@mui/icons-material/Search";

import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
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
  createSavedDestination,
  deleteSavedDestination,
  getSavedDestinations,
  updateSavedDestination,
} from "../api/savedDestinations";

import {
  createSavedSource,
  deleteSavedSource,
  getSavedSources,
  updateSavedSource,
} from "../api/savedSources";

import {
  useAuth,
} from "../auth/useAuth";

import type {
  SavedDestination,
  SavedDestinationCreateRequest,
} from "../types/savedDestination";

import type {
  SavedSource,
  SavedSourceCreateRequest,
} from "../types/savedSource";

import type {
  ProviderType,
} from "../types/stream";


type LibraryTab =
  | "sources"
  | "destinations";


const providerLabels: Record<
  ProviderType,
  string
> = {
  youtube: "YouTube",
  twitch: "Twitch",
  kick: "Kick",
  vimeo: "Vimeo",
  custom: "Прямая ссылка",
  unknown: "Неизвестная",
};


function getErrorMessage(
  error: unknown,
): string {
  if (
    axios.isAxiosError(error)
  ) {
    const detail =
      error.response?.data?.detail;

    if (
      typeof detail === "string"
    ) {
      return detail;
    }

    if (
      Array.isArray(detail)
    ) {
      return detail
        .map((item) => {
          if (
            typeof item?.msg
            === "string"
          ) {
            return item.msg;
          }

          return JSON.stringify(item);
        })
        .join("; ");
    }

    if (
      error.response?.status
    ) {
      return (
        "Сервер вернул HTTP "
        + String(
          error.response.status,
        )
      );
    }

    return (
      "Сервер недоступен: "
      + error.message
    );
  }

  if (
    error instanceof Error
  ) {
    return error.message;
  }

  return "Произошла неизвестная ошибка.";
}


interface SourceDialogProps {
  open: boolean;
  source: SavedSource | null;
  isSubmitting: boolean;

  onClose(): void;

  onSubmit(
    data: SavedSourceCreateRequest,
  ): void;
}


function SourceDialog({
  open,
  source,
  isSubmitting,
  onClose,
  onSubmit,
}: SourceDialogProps) {
  const [
    name,
    setName,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    provider,
    setProvider,
  ] = useState<ProviderType>(
    "youtube",
  );

  const [
    sourceUrl,
    setSourceUrl,
  ] = useState("");

  const [
    enabled,
    setEnabled,
  ] = useState(true);

  const [
    validationError,
    setValidationError,
  ] = useState<string | null>(
    null,
  );

  function resetForm(): void {
    setName(
      source?.name ?? "",
    );

    setDescription(
      source?.description ?? "",
    );

    setProvider(
      source?.provider
      ?? "youtube",
    );

    setSourceUrl(
      source?.source_url ?? "",
    );

    setEnabled(
      source?.enabled ?? true,
    );

    setValidationError(null);
  }

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [
    open,
    source,
  ]);

  function handleSubmit(
    event: FormEvent,
  ): void {
    event.preventDefault();

    const cleanName =
      name.trim();

    const cleanUrl =
      sourceUrl.trim();

    if (!cleanName) {
      setValidationError(
        "Укажите название источника.",
      );

      return;
    }

    if (!cleanUrl) {
      setValidationError(
        "Укажите URL источника.",
      );

      return;
    }

    onSubmit({
      name: cleanName,
      description:
        description.trim()
        || null,
      provider,
      source_url: cleanUrl,
      enabled,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={
        isSubmitting
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="sm"
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
      >
        <DialogTitle>
          {source
            ? "Редактировать источник"
            : "Добавить источник"}
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              pt: 1,
            }}
          >
            {validationError && (
              <Alert severity="error">
                {validationError}
              </Alert>
            )}

            <TextField
              label="Название"
              value={name}
              onChange={(event) => {
                setName(
                  event.target.value,
                );
              }}
              required
              autoFocus
              fullWidth
              disabled={isSubmitting}
              placeholder={
                "Основная трансляция YouTube"
              }
            />

            <FormControl
              fullWidth
              disabled={isSubmitting}
            >
              <InputLabel
                id="source-provider-label"
              >
                Платформа
              </InputLabel>

              <Select
                labelId={
                  "source-provider-label"
                }
                label="Платформа"
                value={provider}
                onChange={(event) => {
                  setProvider(
                    event.target
                      .value as ProviderType,
                  );
                }}
              >
                {Object.entries(
                  providerLabels,
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <MenuItem
                      key={value}
                      value={value}
                    >
                      {label}
                    </MenuItem>
                  ),
                )}
              </Select>
            </FormControl>

            <TextField
              label="URL источника"
              value={sourceUrl}
              onChange={(event) => {
                setSourceUrl(
                  event.target.value,
                );
              }}
              required
              fullWidth
              disabled={isSubmitting}
              placeholder={
                "https://youtube.com/watch?v=..."
              }
            />

            <TextField
              label="Описание"
              value={description}
              onChange={(event) => {
                setDescription(
                  event.target.value,
                );
              }}
              fullWidth
              multiline
              minRows={3}
              disabled={isSubmitting}
              placeholder={
                "Необязательное описание"
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(event) => {
                    setEnabled(
                      event.target.checked,
                    );
                  }}
                  disabled={isSubmitting}
                />
              }
              label="Источник активен"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Сохранение…"
              : "Сохранить"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}


interface DestinationDialogProps {
  open: boolean;
  destination:
    SavedDestination | null;
  isSubmitting: boolean;

  onClose(): void;

  onSubmit(
    data:
      SavedDestinationCreateRequest,
  ): void;
}


function DestinationDialog({
  open,
  destination,
  isSubmitting,
  onClose,
  onSubmit,
}: DestinationDialogProps) {
  const [
    name,
    setName,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    destinationUrl,
    setDestinationUrl,
  ] = useState("");

  const [
    enabled,
    setEnabled,
  ] = useState(true);

  const [
    validationError,
    setValidationError,
  ] = useState<string | null>(
    null,
  );

  function resetForm(): void {
    setName(
      destination?.name ?? "",
    );

    setDescription(
      destination?.description
      ?? "",
    );

    setDestinationUrl(
      destination
        ?.destination_rtmp_url
      ?? "",
    );

    setEnabled(
      destination?.enabled
      ?? true,
    );

    setValidationError(null);
  }

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [
    open,
    destination,
  ]);

  function handleSubmit(
    event: FormEvent,
  ): void {
    event.preventDefault();

    const cleanName =
      name.trim();

    const cleanUrl =
      destinationUrl.trim();

    if (!cleanName) {
      setValidationError(
        "Укажите название назначения.",
      );

      return;
    }

    if (!cleanUrl) {
      setValidationError(
        "Укажите RTMP-адрес.",
      );

      return;
    }

    if (
      !cleanUrl.startsWith(
        "rtmp://",
      )
      && !cleanUrl.startsWith(
        "rtmps://",
      )
    ) {
      setValidationError(
        "RTMP-адрес должен начинаться "
        + "с rtmp:// или rtmps://.",
      );

      return;
    }

    onSubmit({
      name: cleanName,
      description:
        description.trim()
        || null,
      destination_rtmp_url:
        cleanUrl,
      enabled,
    });
  }

  return (
    <Dialog
      open={open}
      onClose={
        isSubmitting
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="sm"
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
      >
        <DialogTitle>
          {destination
            ? "Редактировать назначение"
            : "Добавить назначение"}
        </DialogTitle>

        <DialogContent>
          <Stack
            spacing={2}
            sx={{
              pt: 1,
            }}
          >
            {validationError && (
              <Alert severity="error">
                {validationError}
              </Alert>
            )}

            <TextField
              label="Название"
              value={name}
              onChange={(event) => {
                setName(
                  event.target.value,
                );
              }}
              required
              autoFocus
              fullWidth
              disabled={isSubmitting}
              placeholder="Площадка 1"
            />

            <TextField
              label="RTMP-адрес"
              value={destinationUrl}
              onChange={(event) => {
                setDestinationUrl(
                  event.target.value,
                );
              }}
              required
              fullWidth
              disabled={isSubmitting}
              placeholder={
                "rtmp://server/app/key"
              }
            />

            <TextField
              label="Описание"
              value={description}
              onChange={(event) => {
                setDescription(
                  event.target.value,
                );
              }}
              fullWidth
              multiline
              minRows={3}
              disabled={isSubmitting}
              placeholder={
                "Необязательное описание"
              }
            />

            <FormControlLabel
              control={
                <Switch
                  checked={enabled}
                  onChange={(event) => {
                    setEnabled(
                      event.target.checked,
                    );
                  }}
                  disabled={isSubmitting}
                />
              }
              label="Назначение активно"
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={onClose}
            disabled={isSubmitting}
          >
            Отмена
          </Button>

          <Button
            type="submit"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Сохранение…"
              : "Сохранить"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}


interface DeleteDialogProps {
  open: boolean;
  title: string;
  itemName: string;
  isDeleting: boolean;

  onClose(): void;
  onConfirm(): void;
}


function DeleteDialog({
  open,
  title,
  itemName,
  isDeleting,
  onClose,
  onConfirm,
}: DeleteDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={
        isDeleting
          ? undefined
          : onClose
      }
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle>
        {title}
      </DialogTitle>

      <DialogContent>
        <Typography>
          Удалить запись
          {" "}
          <strong>
            {itemName}
          </strong>
          ?
        </Typography>

        <Alert
          severity="warning"
          sx={{
            mt: 2,
          }}
        >
          Уже созданные карточки трансляций
          не изменятся.
        </Alert>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={onClose}
          disabled={isDeleting}
        >
          Отмена
        </Button>

        <Button
          color="error"
          variant="contained"
          onClick={onConfirm}
          disabled={isDeleting}
        >
          {isDeleting
            ? "Удаление…"
            : "Удалить"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


export default function LibrariesPage() {
  const auth = useAuth();
  const queryClient =
    useQueryClient();

  const [
    activeTab,
    setActiveTab,
  ] = useState<LibraryTab>(
    "sources",
  );

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    includeDisabled,
    setIncludeDisabled,
  ] = useState(false);

  const [
    sourceDialogOpen,
    setSourceDialogOpen,
  ] = useState(false);

  const [
    editingSource,
    setEditingSource,
  ] = useState<SavedSource | null>(
    null,
  );

  const [
    deletingSource,
    setDeletingSource,
  ] = useState<SavedSource | null>(
    null,
  );

  const [
    destinationDialogOpen,
    setDestinationDialogOpen,
  ] = useState(false);

  const [
    editingDestination,
    setEditingDestination,
  ] = useState<
    SavedDestination | null
  >(null);

  const [
    deletingDestination,
    setDeletingDestination,
  ] = useState<
    SavedDestination | null
  >(null);

  const [
    actionError,
    setActionError,
  ] = useState<string | null>(
    null,
  );

  const role =
    auth.user?.role;

  const canManageSources =
    role === "operator"
    || role === "admin";

  const canManageDestinations =
    role === "admin";

  const sourcesQuery = useQuery({
    queryKey: [
      "saved-sources",
      {
        includeDisabled,
      },
    ],
    queryFn: () =>
      getSavedSources({
        includeDisabled,
      }),
  });

  const destinationsQuery =
    useQuery({
      queryKey: [
        "saved-destinations",
        {
          includeDisabled,
        },
      ],
      queryFn: () =>
        getSavedDestinations({
          includeDisabled,
        }),
    });

  const filteredSources =
    useMemo(() => {
      const cleanSearch =
        search.trim().toLowerCase();

      const sources =
        sourcesQuery.data ?? [];

      if (!cleanSearch) {
        return sources;
      }

      return sources.filter(
        (source) =>
          source.name
            .toLowerCase()
            .includes(cleanSearch)
          || source.source_url
            .toLowerCase()
            .includes(cleanSearch)
          || (
            source.description
            ?.toLowerCase()
            .includes(cleanSearch)
            ?? false
          ),
      );
    }, [
      search,
      sourcesQuery.data,
    ]);

  const filteredDestinations =
    useMemo(() => {
      const cleanSearch =
        search.trim().toLowerCase();

      const destinations =
        destinationsQuery.data
        ?? [];

      if (!cleanSearch) {
        return destinations;
      }

      return destinations.filter(
        (destination) =>
          destination.name
            .toLowerCase()
            .includes(cleanSearch)
          || destination
            .destination_rtmp_url
            .toLowerCase()
            .includes(cleanSearch)
          || (
            destination.description
            ?.toLowerCase()
            .includes(cleanSearch)
            ?? false
          ),
      );
    }, [
      destinationsQuery.data,
      search,
    ]);

  async function invalidateSources():
  Promise<void> {
    await queryClient.invalidateQueries({
      queryKey: [
        "saved-sources",
      ],
    });
  }

  async function invalidateDestinations():
  Promise<void> {
    await queryClient.invalidateQueries({
      queryKey: [
        "saved-destinations",
      ],
    });
  }

  const saveSourceMutation =
    useMutation({
      mutationFn: (
        data:
          SavedSourceCreateRequest,
      ) => {
        if (editingSource) {
          return updateSavedSource(
            editingSource.id,
            data,
          );
        }

        return createSavedSource(
          data,
        );
      },
      onMutate: () => {
        setActionError(null);
      },
      onSuccess: async () => {
        setSourceDialogOpen(false);
        setEditingSource(null);

        await invalidateSources();
      },
      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

  const deleteSourceMutation =
    useMutation({
      mutationFn: (
        sourceId: number,
      ) =>
        deleteSavedSource(
          sourceId,
        ),
      onMutate: () => {
        setActionError(null);
      },
      onSuccess: async () => {
        setDeletingSource(null);

        await invalidateSources();
      },
      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

  const saveDestinationMutation =
    useMutation({
      mutationFn: (
        data:
          SavedDestinationCreateRequest,
      ) => {
        if (editingDestination) {
          return updateSavedDestination(
            editingDestination.id,
            data,
          );
        }

        return createSavedDestination(
          data,
        );
      },
      onMutate: () => {
        setActionError(null);
      },
      onSuccess: async () => {
        setDestinationDialogOpen(
          false,
        );
        setEditingDestination(null);

        await invalidateDestinations();
      },
      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

  const deleteDestinationMutation =
    useMutation({
      mutationFn: (
        destinationId: number,
      ) =>
        deleteSavedDestination(
          destinationId,
        ),
      onMutate: () => {
        setActionError(null);
      },
      onSuccess: async () => {
        setDeletingDestination(
          null,
        );

        await invalidateDestinations();
      },
      onError: (error) => {
        setActionError(
          getErrorMessage(error),
        );
      },
    });

  function openNewSource(): void {
    setEditingSource(null);
    setSourceDialogOpen(true);
  }

  function openEditSource(
    source: SavedSource,
  ): void {
    setEditingSource(source);
    setSourceDialogOpen(true);
  }

  function openNewDestination(): void {
    setEditingDestination(null);
    setDestinationDialogOpen(true);
  }

  function openEditDestination(
    destination: SavedDestination,
  ): void {
    setEditingDestination(
      destination,
    );
    setDestinationDialogOpen(true);
  }

  const activeQuery =
    activeTab === "sources"
      ? sourcesQuery
      : destinationsQuery;

  const canManageActiveTab =
    activeTab === "sources"
      ? canManageSources
      : canManageDestinations;

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: {
            xs: 2,
            md: 4,
          },
        }}
      >
        <Stack spacing={3}>
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
            sx={{
              alignItems: {
                xs: "stretch",
                sm: "center",
              },
              justifyContent:
                "space-between",
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
              }}
            >
              <Tooltip title="Назад">
                <IconButton
                  component={Link}
                  to="/streams"
                >
                  <ArrowBackIcon />
                </IconButton>
              </Tooltip>

              <Box>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: 800,
                  }}
                >
                  Библиотеки
                </Typography>

                <Typography
                  color="text.secondary"
                >
                  Сохранённые источники
                  и RTMP-назначения
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
            >
              <Tooltip title="Обновить">
                <IconButton
                  onClick={() => {
                    void activeQuery.refetch();
                  }}
                  disabled={
                    activeQuery.isFetching
                  }
                >
                  <RefreshIcon />
                </IconButton>
              </Tooltip>

              {canManageActiveTab && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={
                    activeTab
                    === "sources"
                      ? openNewSource
                      : openNewDestination
                  }
                >
                  Добавить
                </Button>
              )}
            </Stack>
          </Stack>

          {actionError && (
            <Alert
              severity="error"
              onClose={() => {
                setActionError(null);
              }}
            >
              {actionError}
            </Alert>
          )}

          <Paper variant="outlined">
            <Tabs
              value={activeTab}
              onChange={(
                _event,
                value: LibraryTab,
              ) => {
                setActiveTab(value);
                setSearch("");
                setActionError(null);
              }}
              variant="fullWidth"
            >
              <Tab
                value="sources"
                label="Источники"
              />

              <Tab
                value="destinations"
                label="Назначения"
              />
            </Tabs>

            <Divider />

            <Stack
              spacing={2}
              sx={{
                p: {
                  xs: 2,
                  md: 3,
                },
              }}
            >
              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={2}
                sx={{
                  alignItems: {
                    xs: "stretch",
                    sm: "center",
                  },
                }}
              >
                <TextField
                  value={search}
                  onChange={(event) => {
                    setSearch(
                      event.target.value,
                    );
                  }}
                  fullWidth
                  placeholder={
                    activeTab === "sources"
                      ? (
                        "Поиск по названию "
                        + "или URL источника"
                      )
                      : (
                        "Поиск по названию "
                        + "или RTMP-адресу"
                      )
                  }
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment
                          position="start"
                        >
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <FormControlLabel
                  sx={{
                    flexShrink: 0,
                  }}
                  control={
                    <Switch
                      checked={
                        includeDisabled
                      }
                      onChange={(event) => {
                        setIncludeDisabled(
                          event.target.checked,
                        );
                      }}
                    />
                  }
                  label={
                    "Показывать отключённые"
                  }
                />
              </Stack>

              {activeQuery.isLoading && (
                <Stack
                  direction="row"
                  spacing={1.5}
                  sx={{
                    alignItems: "center",
                    py: 4,
                    justifyContent:
                      "center",
                  }}
                >
                  <CircularProgress
                    size={24}
                  />

                  <Typography
                    color="text.secondary"
                  >
                    Загрузка библиотеки…
                  </Typography>
                </Stack>
              )}

              {activeQuery.isError && (
                <Alert severity="error">
                  {getErrorMessage(
                    activeQuery.error,
                  )}
                </Alert>
              )}

              {activeTab === "sources"
                && !sourcesQuery.isLoading
                && !sourcesQuery.isError
                && (
                  <Stack spacing={2}>
                    {filteredSources
                      .length === 0
                      && (
                        <Alert severity="info">
                          Источники не найдены.
                        </Alert>
                      )}

                    {filteredSources.map(
                      (source) => (
                        <Paper
                          key={source.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            opacity:
                              source.enabled
                                ? 1
                                : 0.65,
                          }}
                        >
                          <Stack
                            direction={{
                              xs: "column",
                              md: "row",
                            }}
                            spacing={2}
                            sx={{
                              alignItems: {
                                xs: "stretch",
                                md: "center",
                              },
                              justifyContent:
                                "space-between",
                            }}
                          >
                            <Stack
                              spacing={1}
                              sx={{
                                minWidth: 0,
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                  alignItems:
                                    "center",
                                  flexWrap:
                                    "wrap",
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {source.name}
                                </Typography>

                                <Chip
                                  size="small"
                                  label={
                                    providerLabels[
                                      source.provider
                                    ]
                                  }
                                />

                                <Chip
                                  size="small"
                                  color={
                                    source.enabled
                                      ? "success"
                                      : "default"
                                  }
                                  variant="outlined"
                                  label={
                                    source.enabled
                                      ? "Активен"
                                      : "Отключён"
                                  }
                                />
                              </Stack>

                              <Typography
                                variant="body2"
                                sx={{
                                  wordBreak:
                                    "break-all",
                                }}
                              >
                                {source.source_url}
                              </Typography>

                              {source.description && (
                                <Typography
                                  variant="body2"
                                  color={
                                    "text.secondary"
                                  }
                                >
                                  {
                                    source.description
                                  }
                                </Typography>
                              )}
                            </Stack>

                            {canManageSources && (
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                  flexShrink: 0,
                                }}
                              >
                                <Tooltip
                                  title={
                                    "Редактировать"
                                  }
                                >
                                  <IconButton
                                    onClick={() => {
                                      openEditSource(
                                        source,
                                      );
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip
                                  title="Удалить"
                                >
                                  <IconButton
                                    color="error"
                                    onClick={() => {
                                      setDeletingSource(
                                        source,
                                      );
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              </Stack>
                            )}
                          </Stack>
                        </Paper>
                      ),
                    )}
                  </Stack>
                )}

              {activeTab
                === "destinations"
                && !destinationsQuery
                  .isLoading
                && !destinationsQuery
                  .isError
                && (
                  <Stack spacing={2}>
                    {filteredDestinations
                      .length === 0
                      && (
                        <Alert severity="info">
                          Назначения не найдены.
                        </Alert>
                      )}

                    {filteredDestinations.map(
                      (destination) => (
                        <Paper
                          key={destination.id}
                          variant="outlined"
                          sx={{
                            p: 2,
                            opacity:
                              destination.enabled
                                ? 1
                                : 0.65,
                          }}
                        >
                          <Stack
                            direction={{
                              xs: "column",
                              md: "row",
                            }}
                            spacing={2}
                            sx={{
                              alignItems: {
                                xs: "stretch",
                                md: "center",
                              },
                              justifyContent:
                                "space-between",
                            }}
                          >
                            <Stack
                              spacing={1}
                              sx={{
                                minWidth: 0,
                              }}
                            >
                              <Stack
                                direction="row"
                                spacing={1}
                                sx={{
                                  alignItems:
                                    "center",
                                  flexWrap:
                                    "wrap",
                                }}
                              >
                                <Typography
                                  variant="h6"
                                  sx={{
                                    fontWeight:
                                      700,
                                  }}
                                >
                                  {
                                    destination.name
                                  }
                                </Typography>

                                <Chip
                                  size="small"
                                  color={
                                    destination
                                      .enabled
                                      ? "success"
                                      : "default"
                                  }
                                  variant="outlined"
                                  label={
                                    destination
                                      .enabled
                                      ? "Активно"
                                      : "Отключено"
                                  }
                                />
                              </Stack>

                              <Typography
                                variant="body2"
                                sx={{
                                  wordBreak:
                                    "break-all",
                                }}
                              >
                                {
                                  destination
                                    .destination_rtmp_url
                                }
                              </Typography>

                              {destination
                                .description
                                && (
                                  <Typography
                                    variant="body2"
                                    color={
                                      "text.secondary"
                                    }
                                  >
                                    {
                                      destination
                                        .description
                                    }
                                  </Typography>
                                )}
                            </Stack>

                            {canManageDestinations
                              && (
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  sx={{
                                    flexShrink: 0,
                                  }}
                                >
                                  <Tooltip
                                    title={
                                      "Редактировать"
                                    }
                                  >
                                    <IconButton
                                      onClick={() => {
                                        openEditDestination(
                                          destination,
                                        );
                                      }}
                                    >
                                      <EditIcon />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip
                                    title="Удалить"
                                  >
                                    <IconButton
                                      color="error"
                                      onClick={() => {
                                        setDeletingDestination(
                                          destination,
                                        );
                                      }}
                                    >
                                      <DeleteIcon />
                                    </IconButton>
                                  </Tooltip>
                                </Stack>
                              )}
                          </Stack>
                        </Paper>
                      ),
                    )}
                  </Stack>
                )}

              {!canManageActiveTab && (
                <Alert severity="info">
                  {activeTab === "sources"
                    ? (
                      "Для изменения источников "
                      + "нужны права оператора "
                      + "или администратора."
                    )
                    : (
                      "Для изменения "
                      + "RTMP-назначений нужны "
                      + "права администратора."
                    )}
                </Alert>
              )}
            </Stack>
          </Paper>
        </Stack>
      </Container>

      <SourceDialog
        open={sourceDialogOpen}
        source={editingSource}
        isSubmitting={
          saveSourceMutation.isPending
        }
        onClose={() => {
          setSourceDialogOpen(false);
          setEditingSource(null);
        }}
        onSubmit={(data) => {
          saveSourceMutation.mutate(
            data,
          );
        }}
      />

      <DestinationDialog
        open={destinationDialogOpen}
        destination={
          editingDestination
        }
        isSubmitting={
          saveDestinationMutation
            .isPending
        }
        onClose={() => {
          setDestinationDialogOpen(
            false,
          );
          setEditingDestination(null);
        }}
        onSubmit={(data) => {
          saveDestinationMutation.mutate(
            data,
          );
        }}
      />

      <DeleteDialog
        open={deletingSource !== null}
        title="Удалить источник?"
        itemName={
          deletingSource?.name ?? ""
        }
        isDeleting={
          deleteSourceMutation.isPending
        }
        onClose={() => {
          setDeletingSource(null);
        }}
        onConfirm={() => {
          if (deletingSource) {
            deleteSourceMutation.mutate(
              deletingSource.id,
            );
          }
        }}
      />

      <DeleteDialog
        open={
          deletingDestination !== null
        }
        title="Удалить назначение?"
        itemName={
          deletingDestination?.name
          ?? ""
        }
        isDeleting={
          deleteDestinationMutation
            .isPending
        }
        onClose={() => {
          setDeletingDestination(null);
        }}
        onConfirm={() => {
          if (deletingDestination) {
            deleteDestinationMutation
              .mutate(
                deletingDestination.id,
              );
          }
        }}
      />
    </Box>
  );
}
