import type {
  StreamMetrics,
} from "../types/stream";

type NullableNumber =
  number | null | undefined;

export function formatBitrate(
  bitrateKbps: NullableNumber,
): string {
  if (
    bitrateKbps === null
    || bitrateKbps === undefined
    || !Number.isFinite(
      bitrateKbps,
    )
    || bitrateKbps <= 0
  ) {
    return "—";
  }

  if (bitrateKbps >= 1000) {
    const decimals =
      bitrateKbps >= 10_000
        ? 1
        : 2;

    return (
      `${(
        bitrateKbps / 1000
      ).toFixed(decimals)} Mbps`
    );
  }

  return (
    `${bitrateKbps.toFixed(0)} Kbps`
  );
}

export function formatDuration(
  seconds: NullableNumber,
): string {
  if (
    seconds === null
    || seconds === undefined
    || !Number.isFinite(seconds)
    || seconds < 0
  ) {
    return "—";
  }

  const totalSeconds =
    Math.floor(seconds);

  const days =
    Math.floor(
      totalSeconds / 86_400,
    );

  const hours =
    Math.floor(
      (
        totalSeconds % 86_400
      ) / 3600,
    );

  const minutes =
    Math.floor(
      (
        totalSeconds % 3600
      ) / 60,
    );

  const remainingSeconds =
    totalSeconds % 60;

  const time = [
    hours,
    minutes,
    remainingSeconds,
  ]
    .map((value) =>
      String(value).padStart(
        2,
        "0",
      ),
    )
    .join(":");

  return days > 0
    ? `${days}д ${time}`
    : time;
}

export function formatFps(
  metrics:
    StreamMetrics | null | undefined,
): string {
  const value =
    metrics?.source_fps
    ?? metrics?.fps;

  if (
    value === null
    || value === undefined
    || !Number.isFinite(value)
    || value <= 0
  ) {
    return "—";
  }

  const rounded =
    Math.round(value * 10) / 10;

  return (
    Number.isInteger(rounded)
      ? `${rounded.toFixed(0)} fps`
      : `${rounded.toFixed(1)} fps`
  );
}

export function formatResolution(
  metrics:
    StreamMetrics | null | undefined,
): string {
  if (metrics?.resolution) {
    return metrics.resolution;
  }

  if (
    metrics?.width
    && metrics?.height
  ) {
    return (
      `${metrics.width}`
      + `×${metrics.height}`
    );
  }

  return "—";
}

export function formatSpeed(
  metrics:
    StreamMetrics | null | undefined,
): string {
  const value =
    metrics?.speed_value;

  if (
    value !== null
    && value !== undefined
    && Number.isFinite(value)
    && value > 0
  ) {
    return `${value.toFixed(2)}x`;
  }

  if (
    metrics?.speed
    && metrics.speed !== "N/A"
  ) {
    return metrics.speed;
  }

  return "—";
}

export function hasLiveMetrics(
  metrics:
    StreamMetrics | null | undefined,
): boolean {
  if (!metrics) {
    return false;
  }

  return Boolean(
    metrics.resolution
    || (
      metrics.width
      && metrics.height
    )
    || (
      metrics.source_fps
      && metrics.source_fps > 0
    )
    || (
      metrics.fps
      && metrics.fps > 0
    )
    || (
      metrics.bitrate_kbps
      && metrics.bitrate_kbps > 0
    )
    || (
      metrics.uptime_seconds
      !== undefined
      && metrics.uptime_seconds >= 0
    ),
  );
}
