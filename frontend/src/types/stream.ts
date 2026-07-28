export type ProviderType =
  | "youtube"
  | "twitch"
  | "kick"
  | "vimeo"
  | "custom"
  | "unknown";

export type StreamStatus =
  | "draft"
  | "ready"
  | "starting"
  | "running"
  | "restarting"
  | "stopping"
  | "stopped"
  | "error";

export interface StreamItem {
  id: number;
  uuid: string;

  name: string;
  description: string | null;

  provider: ProviderType;
  node_id: number;

  enabled: boolean;
  auto_start: boolean;
  show_on_dashboard: boolean;
  status: StreamStatus;

  source_configured: boolean;
  destination_configured: boolean;

  created_at: string;
  updated_at: string;

  source_url?: string;
  destination_rtmp_url?: string;
}

export interface StreamCreateRequest {
  name: string;
  description: string | null;
  provider: ProviderType;
  source_url: string;
  destination_rtmp_url: string;
  node_id: number;
  enabled: boolean;
  auto_start: boolean;
  show_on_dashboard: boolean;
}

export interface StreamAdminUpdateRequest {
  name?: string;
  description?: string | null;
  provider?: ProviderType;
  source_url?: string;
  destination_rtmp_url?: string;
  node_id?: number;
  enabled?: boolean;
  auto_start?: boolean;
  show_on_dashboard?: boolean;
}

export interface StreamOperatorUpdateRequest {
  name?: string;
  description?: string | null;
  provider?: ProviderType;
  source_url?: string;
  show_on_dashboard?: boolean;
}

export type StreamUpdateRequest =
  | StreamAdminUpdateRequest
  | StreamOperatorUpdateRequest;

export interface StreamMetrics {
  stream_id: number;
  pid: number | null;
  running: boolean;

  frame: number;
  fps: number;

  bitrate: string | null;
  bitrate_kbps: number | null;

  speed: string | null;
  speed_value: number | null;

  out_time: string | null;
  out_time_seconds: number;

  total_size: number;
  total_size_mb: number;

  dup_frames: number;
  drop_frames: number;

  progress: string | null;

  video_codec: string | null;
  video_profile: string | null;
  pixel_format: string | null;

  width: number | null;
  height: number | null;
  resolution: string | null;
  source_fps: number | null;

  audio_codec: string | null;
  sample_rate: number | null;
  audio_channels: number | null;
  channel_layout: string | null;

  started_at: string | null;
  updated_at: string | null;
  stopped_at: string | null;

  exit_code: number | null;
  uptime_seconds?: number;

  source_kind?: string | null;
  provider?: string | null;

  ffmpeg_pid?: number | null;
  resolver_pid?: number | null;
  resolver_running?: boolean | null;
}

export interface LatestSession {
  id: number;
  uuid: string;

  status: StreamStatus;
  process_id: string | null;

  started_at: string | null;
  stopped_at: string | null;

  error_message: string | null;

  created_at: string;
  updated_at: string;
}

export interface StreamRuntimeStatus {
  stream_id: number;
  uuid: string;

  name: string;
  provider: ProviderType;

  database_status: StreamStatus;
  manager_status: string;

  process_alive: boolean;
  process_id: number | string | null;

  enabled: boolean;
  auto_start: boolean;
  show_on_dashboard: boolean;

  metrics: StreamMetrics | null;
  latest_session: LatestSession | null;
}

export interface StreamActionResponse {
  status: "started" | "stopped";
  session_id: string;
  pid?: string | number | null;
}
