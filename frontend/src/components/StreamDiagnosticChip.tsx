import {
  CircularProgress,
  Chip,
  Tooltip,
  type ChipProps,
} from "@mui/material";

import {
  useI18n,
} from "../i18n/useI18n";

import type {
  TranslationKey,
} from "../i18n/translations";

import type {
  StreamDiagnostic,
} from "../types/stream";

interface StreamDiagnosticChipProps {
  diagnostic:
    StreamDiagnostic | undefined;
  loading?: boolean;
  error?: boolean;
}

interface DiagnosticTranslation {
  title: TranslationKey;
  message: TranslationKey;
}

const diagnosticTranslations:
  Record<string, DiagnosticTranslation> = {
    running: {
      title:
        "diagnostic.running.title",
      message:
        "diagnostic.running.message",
    },
    source_unavailable: {
      title:
        "diagnostic.sourceUnavailable.title",
      message:
        "diagnostic.sourceUnavailable.message",
    },
    destination_refused: {
      title:
        "diagnostic.destinationRefused.title",
      message:
        "diagnostic.destinationRefused.message",
    },
    authentication_failed: {
      title:
        "diagnostic.authenticationFailed.title",
      message:
        "diagnostic.authenticationFailed.message",
    },
    network_unavailable: {
      title:
        "diagnostic.networkUnavailable.title",
      message:
        "diagnostic.networkUnavailable.message",
    },
    connection_timeout: {
      title:
        "diagnostic.connectionTimeout.title",
      message:
        "diagnostic.connectionTimeout.message",
    },
    connection_lost: {
      title:
        "diagnostic.connectionLost.title",
      message:
        "diagnostic.connectionLost.message",
    },
    source_process_failed: {
      title:
        "diagnostic.sourceProcessFailed.title",
      message:
        "diagnostic.sourceProcessFailed.message",
    },
    ffmpeg_failed: {
      title:
        "diagnostic.ffmpegFailed.title",
      message:
        "diagnostic.ffmpegFailed.message",
    },
    source_offline: {
      title:
        "diagnostic.sourceOffline.title",
      message:
        "diagnostic.sourceOffline.message",
    },
    stopped: {
      title:
        "diagnostic.stopped.title",
      message:
        "diagnostic.stopped.message",
    },
    no_data: {
      title:
        "diagnostic.noData.title",
      message:
        "diagnostic.noData.message",
    },
  };

function getChipColor(
  diagnostic:
    StreamDiagnostic | undefined,
): ChipProps["color"] {
  switch (diagnostic?.severity) {
    case "success":
      return "success";

    case "warning":
      return "warning";

    case "error":
      return "error";

    case "info":
    default:
      return "default";
  }
}

export function StreamDiagnosticChip({
  diagnostic,
  loading = false,
  error = false,
}: StreamDiagnosticChipProps) {
  const {
    t,
  } = useI18n();

  if (loading && !diagnostic) {
    return (
      <Chip
        size="small"
        variant="outlined"
        icon={
          <CircularProgress
            size={14}
          />
        }
        label={t(
          "diagnostic.checking",
        )}
      />
    );
  }

  if (error && !diagnostic) {
    return (
      <Tooltip
        title={t(
          "diagnostic.loadError",
        )}
      >
        <Chip
          size="small"
          variant="outlined"
          label={t(
            "common.noData",
          )}
        />
      </Tooltip>
    );
  }

  if (!diagnostic) {
    return (
      <Chip
        size="small"
        variant="outlined"
        label={t(
          "common.noData",
        )}
      />
    );
  }

  const translation =
    diagnosticTranslations[
      diagnostic.status
    ];

  /*
   * Для известных status используем
   * локальный словарь. Для новых будущих
   * кодов сохраняем текст backend как
   * безопасный fallback.
   */
  const title = translation
    ? t(translation.title)
    : diagnostic.title;

  const message = translation
    ? t(translation.message)
    : diagnostic.message;

  return (
    <Tooltip
      arrow
      title={message}
    >
      <Chip
        size="small"
        color={
          getChipColor(
            diagnostic,
          )
        }
        variant={
          diagnostic.severity
            === "success"
            ? "filled"
            : "outlined"
        }
        label={title}
        sx={{
          maxWidth: 220,
          "& .MuiChip-label": {
            overflow: "hidden",
            textOverflow:
              "ellipsis",
          },
        }}
      />
    </Tooltip>
  );
}
