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
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import axios from "axios";
import { SourceSelector }
  from "./SourceSelector";

import type {
  ProviderType,
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

  return (
    "Не удалось сохранить карточку."
  );
}


export function StreamForm({
  mode,
  stream,
  isAdmin,
  isSubmitting,
  onSubmit,
}: StreamFormProps) {
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
    "custom",
  );

  const [
    sourceUrl,
    setSourceUrl,
  ] = useState("");

  const [
    destinationUrl,
    setDestinationUrl,
  ] = useState("");

  const [
    nodeId,
    setNodeId,
  ] = useState("1");

  const [
    enabled,
    setEnabled,
  ] = useState(true);

  const [
    autoStart,
    setAutoStart,
  ] = useState(false);

  const [
    showOnDashboard,
    setShowOnDashboard,
  ] = useState(true);

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
        "Укажите название потока.",
      );
      return;
    }

    if (!cleanedSource) {
      setErrorMessage(
        "Укажите исходную ссылку.",
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
            "Некорректный ID узла.",
          );
          return;
        }

        if (!destinationUrl.trim()) {
          setErrorMessage(
            "Укажите RTMP назначение.",
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
            "Некорректный ID узла.",
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
        show_on_dashboard:
          showOnDashboard,
      });
    } catch (error) {
      setErrorMessage(
        getErrorMessage(error),
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
              ? "Новая трансляция"
              : "Настройки трансляции"}
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
                Перед изменением настроек
                остановите трансляцию.
              </Alert>
            )}

          {!isAdmin && (
            <Alert severity="info">
              Оператор может изменить
              источник, provider, название
              и описание. RTMP назначение
              доступно только для просмотра.
            </Alert>
          )}

          <TextField
            label="Название"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
            }}
            required
            fullWidth
            disabled={isSubmitting}
          />

          <TextField
            label="Описание"
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
              "Показывать на Dashboard"
            }
          />

          <TextField
            label="RTMP назначение"
            value={destinationUrl}
            onChange={(event) => {
              setDestinationUrl(
                event.target.value,
              );
            }}
            required={isAdmin}
            fullWidth
            disabled={
              isSubmitting
              || !isAdmin
            }
            helperText={
              isAdmin
                ? (
                  "Администратор может "
                  + "изменить назначение."
                )
                : (
                  "Назначение задано "
                  + "администратором."
                )
            }
            placeholder={
              "rtmp://server/app/key"
            }
          />

          {isAdmin && (
            <>
              <TextField
                label="ID узла"
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
                  label="Поток включён"
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
                  label="Автозапуск"
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
              ? "Сохранение…"
              : (
                mode === "create"
                  ? "Создать"
                  : "Сохранить"
              )}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
}
