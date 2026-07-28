import {
  Chip,
  type ChipProps,
} from "@mui/material";

import type {
  StreamStatus,
} from "../types/stream";

interface StreamStatusChipProps {
  status: StreamStatus | string;
}

const statusLabels: Record<
  string,
  string
> = {
  draft: "Черновик",
  ready: "Готов",
  starting: "Запускается",
  running: "Работает",
  restarting: "Перезапускается",
  stopping: "Останавливается",
  stopped: "Остановлен",
  error: "Ошибка",
};

function getStatusColor(
  status: string,
): ChipProps["color"] {
  switch (status) {
    case "running":
      return "success";

    case "starting":
    case "restarting":
    case "stopping":
      return "warning";

    case "error":
      return "error";

    case "ready":
      return "info";

    default:
      return "default";
  }
}

export function StreamStatusChip({
  status,
}: StreamStatusChipProps) {
  return (
    <Chip
      size="small"
      color={getStatusColor(status)}
      label={
        statusLabels[status]
        ?? status
      }
      variant={
        status === "running"
          ? "filled"
          : "outlined"
      }
    />
  );
}
