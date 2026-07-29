import {
  CircularProgress,
  Chip,
  Tooltip,
} from "@mui/material";
import type {
  ChipProps,
} from "@mui/material";
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
        label="Проверка…"
      />
    );
  }

  if (error && !diagnostic) {
    return (
      <Tooltip
        title={
          "Не удалось получить "
          + "диагностику потока"
        }
      >
        <Chip
          size="small"
          variant="outlined"
          label="Нет данных"
        />
      </Tooltip>
    );
  }

  if (!diagnostic) {
    return (
      <Chip
        size="small"
        variant="outlined"
        label="Нет данных"
      />
    );
  }

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
