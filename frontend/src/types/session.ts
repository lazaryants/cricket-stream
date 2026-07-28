import type {
  StreamStatus,
} from "./stream";

export interface StreamSession {
  id: number;
  uuid: string;
  stream_id: number;

  status: StreamStatus;
  process_id: string | null;

  started_at: string | null;
  stopped_at: string | null;
  error_message: string | null;

  created_at: string;
  updated_at: string;
}

export interface SessionLogsResponse {
  uuid: string;
  stream_id: number;
  logs: string[];
}
