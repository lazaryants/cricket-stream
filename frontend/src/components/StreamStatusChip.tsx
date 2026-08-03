import {
  Chip,
  type ChipProps,
} from "@mui/material";

import {
  useI18n,
} from "../i18n/useI18n";

import type {
  StreamStatus,
} from "../types/stream";

interface StreamStatusChipProps {
  status: StreamStatus | string;
}

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
  const {
    t,
  } = useI18n();

  const statusLabels:
    Record<string, string> = {
      draft: t("status.draft"),
      ready: t("status.ready"),
      starting: t(
        "status.starting",
      ),
      running: t(
        "status.running",
      ),
      restarting: t(
        "status.restarting",
      ),
      stopping: t(
        "status.stopping",
      ),
      stopped: t(
        "status.stopped",
      ),
      error: t("status.error"),
    };

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
