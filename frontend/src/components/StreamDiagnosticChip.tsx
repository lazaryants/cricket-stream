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
  StreamDiagnostic,
} from "../types/stream";

interface StreamDiagnosticChipProps {
  diagnostic:
    StreamDiagnostic | undefined;
  loading?: boolean;
  error?: boolean;
}

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

  /*
   * diagnostic.title и diagnostic.message
   * приходят от backend. Их пока не меняем.
   */
  return (
    <Tooltip
      arrow
      title={diagnostic.message}
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
        label={diagnostic.title}
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
