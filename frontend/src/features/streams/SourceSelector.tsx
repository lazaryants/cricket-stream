import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
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
  getSavedSources,
} from "../../api/savedSources";
import { useI18n } from "../../i18n/useI18n";

import type {
  SavedSource,
} from "../../types/savedSource";
import type {
  ProviderType,
} from "../../types/stream";

type SourceMode =
  | "saved"
  | "manual";

interface SourceSelectorProps {
  provider: ProviderType;
  sourceUrl: string;
  disabled?: boolean;
  onProviderChange(
    provider: ProviderType,
  ): void;
  onSourceUrlChange(
    sourceUrl: string,
  ): void;
}

export function SourceSelector({
  provider,
  sourceUrl,
  disabled = false,
  onProviderChange,
  onSourceUrlChange,
}: SourceSelectorProps) {
  const { t } = useI18n();

  const providers: Array<{
    value: ProviderType;
    label: string;
  }> = [
    {
      value: "youtube",
      label: "YouTube",
    },
    {
      value: "twitch",
      label: "Twitch",
    },
    {
      value: "kick",
      label: "Kick",
    },
    {
      value: "vimeo",
      label: "Vimeo",
    },
    {
      value: "custom",
      label: t("stream.provider.custom"),
    },
    {
      value: "unknown",
      label: t("stream.provider.unknown"),
    },
  ];

  const providerLabels:
  Record<ProviderType, string> = {
    youtube: "YouTube",
    twitch: "Twitch",
    kick: "Kick",
    vimeo: "Vimeo",
    custom: t("stream.provider.custom"),
    unknown: t("stream.provider.unknown"),
  };

  const [
    sourceMode,
    setSourceMode,
  ] = useState<SourceMode>(
    "manual",
  );

  const [
    selectedSourceId,
    setSelectedSourceId,
  ] = useState("");

  const sourcesQuery = useQuery({
    queryKey: [
      "saved-sources",
      {
        includeDisabled: false,
      },
    ],
    queryFn: () =>
      getSavedSources({
        includeDisabled: false,
      }),
    staleTime: 30_000,
  });

  const sourceErrorMessage =
    useMemo(() => {
      const error =
        sourcesQuery.error;

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
          typeof detail
            === "string"
        ) {
          return status
            ? `HTTP ${status}: ${detail}`
            : detail;
        }

        if (status) {
          return (
            `Backend вернул HTTP `
            + String(status)
          );
        }

        return (
          "Backend недоступен: "
          + error.message
        );
      }

      return (
        "Не удалось загрузить "
        + "библиотеку источников."
      );
    }, [
      sourcesQuery.error,
    ]);

  const savedSources =
    useMemo(
      () =>
        sourcesQuery.data ?? [],
      [
        sourcesQuery.data,
      ],
    );

  const selectedSource =
    useMemo<SavedSource | null>(
      () => {
        if (!selectedSourceId) {
          return null;
        }

        const parsedId =
          Number(selectedSourceId);

        return (
          savedSources.find(
            (source) =>
              source.id === parsedId,
          )
          ?? null
        );
      },
      [
        savedSources,
        selectedSourceId,
      ],
    );

  useEffect(() => {
    if (
      sourceMode !== "saved"
      || selectedSourceId
      || savedSources.length === 0
    ) {
      return;
    }

    const matchingSource =
      savedSources.find(
        (source) =>
          source.source_url
            === sourceUrl
          && source.provider
            === provider,
      );

    if (matchingSource) {
      setSelectedSourceId(
        String(matchingSource.id),
      );
    }
  }, [
    provider,
    savedSources,
    selectedSourceId,
    sourceMode,
    sourceUrl,
  ]);

  function applySavedSource(
    source: SavedSource,
  ): void {
    onProviderChange(
      source.provider,
    );

    onSourceUrlChange(
      source.source_url,
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
            {t("sourceSelector.title")}
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
            {t("selector.manageLibrary")}
          </Button>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mt: 0.5,
            }}
          >
            {t("sourceSelector.subtitle")}
          </Typography>
        </Box>

        <FormControl
          disabled={disabled}
        >
          <RadioGroup
            row
            value={sourceMode}
            onChange={(event) => {
              const nextMode =
                event.target
                  .value as SourceMode;

              setSourceMode(
                nextMode,
              );

              if (
                nextMode === "saved"
                && selectedSource
              ) {
                applySavedSource(
                  selectedSource,
                );
              }
            }}
          >
            <FormControlLabel
              value="saved"
              control={<Radio />}
              label={t("selector.fromLibrary")}
            />

            <FormControlLabel
              value="manual"
              control={<Radio />}
              label={t("selector.manual")}
            />
          </RadioGroup>
        </FormControl>

        {sourceMode === "saved"
          ? (
            <Stack spacing={2}>
              {sourcesQuery.isLoading && (
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
                    {t("libraries.loading")}
                  </Typography>
                </Stack>
              )}

              {sourcesQuery.isError && (
                <Alert severity="error">
                  {sourceErrorMessage}
                </Alert>
              )}

              {!sourcesQuery.isLoading
                && !sourcesQuery.isError
                && savedSources.length
                  === 0
                && (
                  <Alert severity="info">
                    {t("sourceSelector.empty")}
                  </Alert>
                )}

              {savedSources.length > 0
                && (
                  <FormControl
                    fullWidth
                    disabled={disabled}
                  >
                    <InputLabel
                      id={
                        "saved-source-label"
                      }
                    >
                      {t("sourceSelector.saved")}
                    </InputLabel>

                    <Select
                      labelId={
                        "saved-source-label"
                      }
                      label={
                        t("sourceSelector.saved")
                      }
                      value={
                        selectedSourceId
                      }
                      onChange={(event) => {
                        const nextId =
                          String(
                            event.target
                              .value,
                          );

                        setSelectedSourceId(
                          nextId,
                        );

                        const source =
                          savedSources.find(
                            (item) =>
                              item.id
                                === Number(
                                  nextId,
                                ),
                          );

                        if (source) {
                          applySavedSource(
                            source,
                          );
                        }
                      }}
                    >
                      {savedSources.map(
                        (source) => (
                          <MenuItem
                            key={source.id}
                            value={
                              String(
                                source.id,
                              )
                            }
                          >
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{
                                alignItems:
                                  "center",
                                minWidth: 0,
                              }}
                            >
                              <Typography
                                noWrap
                              >
                                {source.name}
                              </Typography>

                              <Chip
                                size="small"
                                variant="outlined"
                                label={
                                  providerLabels[
                                    source
                                      .provider
                                  ]
                                }
                              />
                            </Stack>
                          </MenuItem>
                        ),
                      )}
                    </Select>

                    <FormHelperText>
                      {t("sourceSelector.activeOnly")}
                    </FormHelperText>
                  </FormControl>
                )}

              {selectedSource && (
                <Stack spacing={1}>
                  {selectedSource
                    .description
                    && (
                      <Typography
                        variant="body2"
                        color={
                          "text.secondary"
                        }
                      >
                        {
                          selectedSource
                            .description
                        }
                      </Typography>
                    )}

                  <TextField
                    label={t("libraries.source.platform")}
                    value={
                      providerLabels[
                        selectedSource
                          .provider
                      ]
                    }
                    fullWidth
                    disabled
                  />

                  <TextField
                    label={
                      t("libraries.source.url")
                    }
                    value={
                      selectedSource
                        .source_url
                    }
                    fullWidth
                    disabled
                    multiline
                    minRows={2}
                  />

                  <Alert severity="info">
                    {t("sourceSelector.copyNotice")}
                  </Alert>
                </Stack>
              )}
            </Stack>
          )
          : (
            <Stack spacing={2}>
              <FormControl
                fullWidth
                disabled={disabled}
              >
                <InputLabel
                  id={
                    "manual-platform-label"
                  }
                >
                  {t("libraries.source.platform")}
                </InputLabel>

                <Select
                  labelId={
                    "manual-platform-label"
                  }
                  label={t("libraries.source.platform")}
                  value={provider}
                  onChange={(event) => {
                    const nextProvider:
                      ProviderType =
                        event.target.value;

                    onProviderChange(
                      nextProvider,
                    );
                  }}
                >
                  {providers.map(
                    (item) => (
                      <MenuItem
                        key={item.value}
                        value={item.value}
                      >
                        {item.label}
                      </MenuItem>
                    ),
                  )}
                </Select>
              </FormControl>

              <>
              <TextField
                label={t("libraries.source.url")}
                value={sourceUrl}
                onChange={(event) => {
                  onSourceUrlChange(
                    event.target.value,
                  );
                }}
                required
                fullWidth
                disabled={disabled}
                placeholder={
                  "https://twitch.tv/channel"
                }
              />

              <Alert severity="info">
                {t("sourceSelector.manualNotice")}
              </Alert>
              </>


            </Stack>
          )}
      </Stack>
    </Paper>
  );
}
