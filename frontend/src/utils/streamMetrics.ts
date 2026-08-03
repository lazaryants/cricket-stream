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
  dayShort: string = "d",
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
    ? `${days}${dayShort} ${time}`
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

export function formatVideoCodec(
  metrics:
    StreamMetrics | null | undefined,
): string {
  if (!metrics?.video_codec) {
    return "—";
  }

  const codec =
    metrics.video_codec.toLowerCase()
      === "h264"
      ? "H.264"
      : metrics.video_codec;

  return [codec, metrics.video_profile]
    .filter(Boolean)
    .join(" · ");
}

export function formatAudioCodec(
  metrics:
    StreamMetrics | null | undefined,
): string {
  if (!metrics?.audio_codec) {
    return "—";
  }

  const sampleRate =
    metrics.sample_rate
      ? `${(
          metrics.sample_rate / 1000
        ).toFixed(
          metrics.sample_rate % 1000
            ? 1
            : 0,
        )} kHz`
      : null;

  const channels =
    metrics.channel_layout
    ?? (
      metrics.audio_channels
        ? `${metrics.audio_channels} ch`
        : null
    );

  return [
    metrics.audio_codec,
    sampleRate,
    channels,
  ]
    .filter(Boolean)
    .join(" · ");
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
