import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import {
  Alert,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import axios from "axios";
import {
  DestinationSelector,
} from "./DestinationSelector";
import { SourceSelector }
  from "./SourceSelector";

import { useI18n } from "../../i18n/useI18n";

import type {
  ProviderType,
  SourceEngine,
  StreamCreateRequest,
  StreamItem,
  StreamUpdateRequest,
} from "../../types/stream";


interface StreamFormProps {
  mode: "create" | "edit";
  stream?: StreamItem;
  isAdmin: boolean;
  isSubmitting: boolean;

  onSubmit(
    data:
      | StreamCreateRequest
      | StreamUpdateRequest,
  ): Promise<void>;
}


function getErrorMessage(
  error: unknown,
  fallback: string,
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
      && typeof detail.message === "string"
    ) {
      return detail.message;
    }
  }

  return fallback;
}


export function StreamForm({
  mode,
  stream,
  isAdmin,
  isSubmitting,
  onSubmit,
}: StreamFormProps) {
  const { t } = useI18n();

  const [
    name,
    setName,
  ] = useState(
    () => stream?.name ?? "",
  );

  const [
    description,
    setDescription,
  ] = useState(
    () => stream?.description ?? "",
  );

  const [
    provider,
    setProvider,
  ] = useState<ProviderType>(
    () => stream?.provider ?? "custom",
  );

  const [
    sourceUrl,
    setSourceUrl,
  ] = useState(
    () => stream?.source_url ?? "",
  );

  const [
    sourceEngine,
    setSourceEngine,
  ] = useState<SourceEngine>(
    () => stream?.source_engine ?? "auto",
  );

  const [
    destinationUrl,
    setDestinationUrl,
  ] = useState(
    () =>
      stream?.destination_rtmp_url
      ?? "",
  );

  const [
    nodeId,
    setNodeId,
  ] = useState(
    () => String(stream?.node_id ?? 1),
  );

  const [
    enabled,
    setEnabled,
  ] = useState(
    () => stream?.enabled ?? true,
  );

  const [
    autoStart,
    setAutoStart,
  ] = useState(
    () => stream?.auto_start ?? false,
  );

  const [
    showOnDashboard,
    setShowOnDashboard,
  ] = useState(
    () => stream?.show_on_dashboard
      ?? true,
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!stream) {
      return;
    }

    setName(stream.name);
    setDescription(
      stream.description ?? "",
    );
    setProvider(stream.provider);
    setSourceUrl(
      stream.source_url ?? "",
    );
    setSourceEngine(
      stream.source_engine ?? "auto",
    );
    setDestinationUrl(
      stream.destination_rtmp_url ?? "",
    );
    setNodeId(
      String(stream.node_id),
    );
    setEnabled(stream.enabled);
    setAutoStart(stream.auto_start);
    setShowOnDashboard(
      stream.show_on_dashboard,
    );
  }, [stream]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setErrorMessage(null);

    const cleanedName =
      name.trim();

    const cleanedSource =
      sourceUrl.trim();

    if (!cleanedName) {
      setErrorMessage(
        t("streamForm.nameRequired"),
      );
      return;
    }

    if (!cleanedSource) {
      setErrorMessage(
        t("streamForm.sourceRequired"),
      );
      return;
    }

    try {
      if (mode === "create") {
        const parsedNodeId =
          Number(nodeId);

        if (
          !Number.isInteger(
            parsedNodeId,
          )
          || parsedNodeId <= 0
        ) {
          setErrorMessage(
            t("streamForm.nodeInvalid"),
          );
          return;
        }

        if (!destinationUrl.trim()) {
          setErrorMessage(
            t("streamForm.destinationRequired"),
          );
          return;
        }

        await onSubmit({
          name: cleanedName,
          description:
            description.trim()
              || null,
          provider,
          source_url:
            cleanedSource,
          source_engine:
            sourceEngine,
          destination_rtmp_url:
            destinationUrl.trim(),
          node_id:
            parsedNodeId,
          enabled,
          auto_start:
            autoStart,
          show_on_dashboard:
            showOnDashboard,
        });

        return;
      }

      if (isAdmin) {
        const parsedNodeId =
          Number(nodeId);

        if (
          !Number.isInteger(
            parsedNodeId,
          )
          || parsedNodeId <= 0
        ) {
          setErrorMessage(
            t("streamForm.nodeInvalid"),
          );
          return;
        }

        await onSubmit({
          name: cleanedName,
          description:
            description.trim()
              || null,
          provider,
          source_url:
            cleanedSource,
          source_engine:
            sourceEngine,
          destination_rtmp_url:
            destinationUrl.trim(),
          node_id:
            parsedNodeId,
          enabled,
          auto_start:
            autoStart,
          show_on_dashboard:
            showOnDashboard,
        });

        return;
      }

      await onSubmit({
        name: cleanedName,
        description:
          description.trim()
            || null,
        provider,
        source_url:
          cleanedSource,
        source_engine:
          sourceEngine,
        show_on_dashboard:
          showOnDashboard,
      });
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error, t("streamForm.saveError")),
      );
    }
  }

  return (
    <Card>
      <CardContent>
        <Stack
          component="form"
          spacing={3}
          onSubmit={handleSubmit}
        >
          <Typography variant="h6">
            {mode === "create"
              ? t("streamForm.newTitle")
              : t("streamForm.editTitle")}
          </Typography>

          {errorMessage && (
            <Alert severity="error">
              {errorMessage}
            </Alert>
          )}

          {mode === "edit"
            && stream?.status
              === "running"
            && (
              <Alert severity="warning">
                {t("streamForm.stopBeforeEdit")}
              </Alert>
            )}

          {!isAdmin && (
            <Alert severity="info">
              {t("streamForm.operatorNotice")}
            </Alert>
          )}

          <TextField
            label={t("libraries.source.name")}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            required
            fullWidth
            disabled={isSubmitting}
          />

          <TextField
            label={t("libraries.source.description")}
            value={description}
            onChange={(event) => {
              setDescription(
                event.target.value,
              );
            }}
            multiline
            minRows={2}
            fullWidth
            disabled={isSubmitting}
          />

          <SourceSelector
            provider={provider}
            sourceUrl={sourceUrl}
            disabled={isSubmitting}
            onProviderChange={
              setProvider
            }
            onSourceUrlChange={
              setSourceUrl
            }
          />

          <FormControl
            fullWidth
            disabled={isSubmitting}
          >
            <InputLabel id="source-engine-label">
              {t("streamForm.engine")}
            </InputLabel>
            <Select
              labelId="source-engine-label"
              label={t("streamForm.engine")}
              value={sourceEngine}
              onChange={(event) => {
                setSourceEngine(
                  event.target.value as SourceEngine,
                );
              }}
            >
              <MenuItem value="auto">
                {t("streamForm.engineAuto")}
              </MenuItem>
              <MenuItem value="streamlink">
                Streamlink
              </MenuItem>
              <MenuItem value="yt-dlp">
                yt-dlp
              </MenuItem>
            </Select>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ mt: 0.75, ml: 1.75 }}
            >
              {t("streamForm.engineHelp")}
            </Typography>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={
                  showOnDashboard
                }
                onChange={(event) => {
                  setShowOnDashboard(
                    event.target.checked,
                  );
                }}
                disabled={isSubmitting}
              />
            }
            label={
              t("streamForm.showDashboard")
            }
          />

            <DestinationSelector
              destinationUrl={
                destinationUrl
              }
              disabled={
                isSubmitting
                || !isAdmin
              }
              onDestinationUrlChange={
                setDestinationUrl
              }
            />

          {isAdmin && (
            <>
              <TextField
                label={t("streamForm.nodeId")}
                value={nodeId}
                onChange={(event) => {
                  setNodeId(
                    event.target.value,
                  );
                }}
                type="number"
                required
                fullWidth
                disabled={isSubmitting}
                slotProps={{
                  htmlInput: {
                    min: 1,
                    step: 1,
                  },
                }}
              />

              <Stack
                direction={{
                  xs: "column",
                  sm: "row",
                }}
                spacing={1}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={enabled}
                      onChange={(event) => {
                        setEnabled(
                          event.target
                            .checked,
                        );
                      }}
                      disabled={isSubmitting}
                    />
                  }
                  label={t("streamForm.enabled")}
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={autoStart}
                      onChange={(event) => {
                        setAutoStart(
                          event.target
                            .checked,
                        );
                      }}
                      disabled={isSubmitting}
                    />
                  }
                  label={t("streamForm.autoStart")}
                />
              </Stack>
            </>
          )}

          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isSubmitting}
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
              ? t("libraries.saving")
              : (
                mode === "create"
                  ? t("streamForm.create")
                  : t("libraries.save")
              )}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
