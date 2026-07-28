import type {
  SessionLogsResponse,
  StreamSession,
} from "../types/session";

import { http } from "./http";

export async function getStreamSessions(
  streamId: number,
  limit = 10,
): Promise<StreamSession[]> {
  const response =
    await http.get<StreamSession[]>(
      "/sessions",
      {
        params: {
          stream_id: streamId,
          limit,
        },
      },
    );

  return response.data;
}

export async function getSessionLogs(
  sessionUuid: string,
  limit = 200,
): Promise<SessionLogsResponse> {
  const response =
    await http.get<SessionLogsResponse>(
      `/sessions/${sessionUuid}/logs`,
      {
        params: {
          limit,
        },
      },
    );

  return response.data;
}
