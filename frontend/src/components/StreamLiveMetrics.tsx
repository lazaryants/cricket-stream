import {
  Box,
  Stack,
  Typography,
} from "@mui/material";
import type {
  StreamMetrics,
} from "../types/stream";
import {
  formatBitrate,
  formatDuration,
  formatFps,
  formatResolution,
  formatSpeed,
  hasLiveMetrics,
} from "../utils/streamMetrics";

interface StreamLiveMetricsProps {
  metrics:
    StreamMetrics | null | undefined;
  processAlive?: boolean;
  compact?: boolean;
  dense?: boolean;
}

interface MetricValueProps {
  label: string;
  value: string;
  compact: boolean;
  dense: boolean;
}

function MetricValue({
  label,
  value,
  compact,
  dense,
}: MetricValueProps) {
  return (
    <Box
      sx={{
        minWidth: 0,
      }}
    >
      {!compact && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: "block",
            lineHeight: 1.2,
          }}
        >
          {label}
        </Typography>
      )}

      <Typography
        variant={
          compact
            ? "caption"
            : "body2"
        }
        sx={{
          fontWeight: 600,
          whiteSpace: "nowrap",
          fontSize: dense
            ? "0.68rem"
            : undefined,
          lineHeight: dense
            ? 1.15
            : 1.35,
        }}
      >
        {compact
          ? `${label}: ${value}`
          : value}
      </Typography>
    </Box>
  );
}

export function StreamLiveMetrics({
  metrics,
  processAlive = false,
  compact = false,
  dense = false,
}: StreamLiveMetricsProps) {
  if (
    !processAlive
    && !hasLiveMetrics(metrics)
  ) {
    return (
      <Typography
        variant="caption"
        color="text.secondary"
      >
        Нет live-метрик
      </Typography>
    );
  }

  if (!metrics) {
    return (
      <Typography
        variant="caption"
        color="text.secondary"
      >
        Ожидание метрик…
      </Typography>
    );
  }

  const values = [
    {
      label: "Видео",
      value:
        formatResolution(metrics),
    },
    {
      label: "FPS",
      value:
        formatFps(metrics),
    },
    {
      label: "Битрейт",
      value:
        formatBitrate(
          metrics.bitrate_kbps,
        ),
    },
    {
      label: "Скорость",
      value:
        formatSpeed(metrics),
    },
    {
      label: "Uptime",
      value:
        formatDuration(
          metrics.uptime_seconds,
        ),
    },
  ];

  if (compact) {
    return (
      <Stack
        spacing={dense ? 0 : 0.25}
        sx={{
          minWidth: 125,
        }}
      >
        {values
          .filter(
            (item) =>
              item.value !== "—",
          )
          .map((item) => (
            <MetricValue
              key={item.label}
              label={item.label}
              value={item.value}
              compact
              dense={dense}
            />
          ))}
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
        },
        gap: 1.5,
      }}
    >
      {values.map((item) => (
        <MetricValue
          key={item.label}
          label={item.label}
          value={item.value}
          compact={false}
          dense={false}
        />
      ))}
    </Box>
  );
}
