import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormHelperText,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import {
  Link,
} from "react-router";

import {
  getSavedDestinations,
} from "../../api/savedDestinations";
import type {
  SavedDestination,
} from "../../types/savedDestination";

type DestinationMode =
  | "saved"
  | "manual";

interface DestinationSelectorProps {
  destinationUrl: string;
  disabled?: boolean;

  onDestinationUrlChange(
    destinationUrl: string,
  ): void;
}

export function DestinationSelector({
  destinationUrl,
  disabled = false,
  onDestinationUrlChange,
}: DestinationSelectorProps) {
  const [
    destinationMode,
    setDestinationMode,
  ] = useState<DestinationMode>(
    "saved",
  );

  const [
    selectedDestinationId,
    setSelectedDestinationId,
  ] = useState("");

  const destinationsQuery = useQuery({
    queryKey: [
      "saved-destinations",
      {
        includeDisabled: false,
      },
    ],
    queryFn: () =>
      getSavedDestinations({
        includeDisabled: false,
      }),
    staleTime: 30_000,
  });

  const errorMessage =
    useMemo(() => {
      const error =
        destinationsQuery.error;

      if (!error) {
        return null;
      }

      if (
        axios.isAxiosError(error)
      ) {
        const status =
          error.response?.status;

        const detail =
          error.response?.data?.detail;

        if (
          typeof detail === "string"
        ) {
          return status
            ? `HTTP ${status}: ${detail}`
            : detail;
        }

        if (status) {
          return (
            "Сервер вернул HTTP "
            + String(status)
          );
        }

        return (
          "Сервер недоступен: "
          + error.message
        );
      }

      return (
        "Не удалось загрузить "
        + "библиотеку назначений."
      );
    }, [
      destinationsQuery.error,
    ]);

  const savedDestinations =
    useMemo(
      () =>
        destinationsQuery.data ?? [],
      [
        destinationsQuery.data,
      ],
    );

  const selectedDestination =
    useMemo<SavedDestination | null>(
      () => {
        if (!selectedDestinationId) {
          return null;
        }

        const parsedId =
          Number(selectedDestinationId);

        return (
          savedDestinations.find(
            (destination) =>
              destination.id === parsedId,
          )
          ?? null
        );
      },
      [
        savedDestinations,
        selectedDestinationId,
      ],
    );

  useEffect(() => {
    if (
      destinationMode !== "saved"
      || selectedDestinationId
      || savedDestinations.length === 0
    ) {
      return;
    }

    const matchingDestination =
      savedDestinations.find(
        (destination) =>
          destination
            .destination_rtmp_url
          === destinationUrl,
      );

    if (matchingDestination) {
      setSelectedDestinationId(
        String(matchingDestination.id),
      );

      return;
    }

    if (
      !destinationUrl.trim()
      && !disabled
    ) {
      const firstDestination =
        savedDestinations[0];

      setSelectedDestinationId(
        String(firstDestination.id),
      );

      onDestinationUrlChange(
        firstDestination
          .destination_rtmp_url,
      );
    }
  }, [
    destinationMode,
    destinationUrl,
    disabled,
    onDestinationUrlChange,
    savedDestinations,
    selectedDestinationId,
  ]);

  function applySavedDestination(
    destination: SavedDestination,
  ): void {
    onDestinationUrlChange(
      destination.destination_rtmp_url,
    );
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: {
          xs: 2,
          sm: 2.5,
        },
      }}
    >
      <Stack spacing={2.5}>
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
            }}
          >
            Назначение трансляции
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            Выберите RTMP-назначение
            из библиотеки или введите
            адрес вручную.
          </Typography>

          <Button
            component={Link}
            to="/libraries"
            size="small"
            sx={{
              mt: 1,
              px: 0,
            }}
          >
            Управление библиотекой
          </Button>
        </Box>

        <FormControl
          disabled={disabled}
        >
          <RadioGroup
            row
            value={destinationMode}
            onChange={(event) => {
              const nextMode =
                event.target
                  .value as DestinationMode;

              setDestinationMode(
                nextMode,
              );

              if (
                nextMode === "saved"
                && selectedDestination
              ) {
                applySavedDestination(
                  selectedDestination,
                );
              }
            }}
          >
            <FormControlLabel
              value="saved"
              control={<Radio />}
              label="Из библиотеки"
            />

            <FormControlLabel
              value="manual"
              control={<Radio />}
              label="Ввести вручную"
            />
          </RadioGroup>
        </FormControl>

        {destinationMode === "saved"
          ? (
            <Stack spacing={2}>
              {destinationsQuery
                .isLoading
                && (
                  <Stack
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: "center",
                    }}
                  >
                    <CircularProgress
                      size={20}
                    />

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Загрузка библиотеки…
                    </Typography>
                  </Stack>
                )}

              {destinationsQuery
                .isError
                && (
                  <Alert severity="error">
                    {errorMessage}
                  </Alert>
                )}

              {!destinationsQuery
                .isLoading
                && !destinationsQuery
                  .isError
                && savedDestinations
                  .length === 0
                && (
                  <Alert severity="info">
                    В библиотеке пока нет
                    активных назначений.
                    Используйте ручной режим.
                  </Alert>
                )}

              {savedDestinations
                .length > 0
                && (
                  <FormControl
                    fullWidth
                    disabled={disabled}
                  >
                    <InputLabel
                      id={
                        "saved-destination-label"
                      }
                    >
                      Сохранённое назначение
                    </InputLabel>

                    <Select
                      labelId={
                        "saved-destination-label"
                      }
                      label={
                        "Сохранённое назначение"
                      }
                      value={
                        selectedDestinationId
                      }
                      onChange={(event) => {
                        const nextId =
                          String(
                            event.target.value,
                          );

                        setSelectedDestinationId(
                          nextId,
                        );

                        const destination =
                          savedDestinations.find(
                            (item) =>
                              item.id
                              === Number(nextId),
                          );

                        if (destination) {
                          applySavedDestination(
                            destination,
                          );
                        }
                      }}
                    >
                      {savedDestinations.map(
                        (destination) => (
                          <MenuItem
                            key={
                              destination.id
                            }
                            value={
                              String(
                                destination.id,
                              )
                            }
                          >
                            {destination.name}
                          </MenuItem>
                        ),
                      )}
                    </Select>

                    <FormHelperText>
                      Показываются только
                      активные назначения.
                    </FormHelperText>
                  </FormControl>
                )}

              {selectedDestination && (
                <Stack spacing={1}>
                  {selectedDestination
                    .description
                    && (
                      <Typography
                        variant="body2"
                        color={
                          "text.secondary"
                        }
                      >
                        {
                          selectedDestination
                            .description
                        }
                      </Typography>
                    )}

                  <>
                  <TextField
                    label="RTMP-адрес"
                    value={
                      selectedDestination
                        .destination_rtmp_url
                    }
                    fullWidth
                    disabled
                    multiline
                    minRows={2}
                  />

                  <Alert severity="info">
                    RTMP-адрес копируется
                    в карточку. Последующие
                    изменения библиотеки
                    уже созданную трансляцию
                    не изменяют.
                  </Alert>
                  </>
                </Stack>
              )}
            </Stack>
          )
          : (
            <>
            <TextField
              label="RTMP-адрес"
              value={destinationUrl}
              onChange={(event) => {
                onDestinationUrlChange(
                  event.target.value,
                );
              }}
              required
              fullWidth
              disabled={disabled}
              placeholder={
                "rtmp://server/app/key"
              }
            />
            <Alert severity="info">
              Введённый вручную адрес
              используется только в этой
              карточке и не сохраняется
              в библиотеку.
            </Alert>
            </>

          )}
      </Stack>
    </Paper>
  );
}
