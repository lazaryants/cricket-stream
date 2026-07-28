import type {
  StreamActionResponse,
  StreamItem,
  StreamRuntimeStatus,
} from "../types/stream";

import { http } from "./http";

export async function getStreams():
Promise<StreamItem[]> {
  const response =
    await http.get<StreamItem[]>(
      "/streams",
    );

  return response.data;
}

export async function getStreamStatus(
  streamId: number,
): Promise<StreamRuntimeStatus> {
  const response =
    await http.get<StreamRuntimeStatus>(
      `/streams/${streamId}/status`,
    );

  return response.data;
}

export async function startStream(
  streamId: number,
): Promise<StreamActionResponse> {
  const response =
    await http.post<StreamActionResponse>(
      `/streams/${streamId}/start`,
    );

  return response.data;
}

export async function stopStream(
  streamId: number,
): Promise<StreamActionResponse> {
  const response =
    await http.post<StreamActionResponse>(
      `/streams/${streamId}/stop`,
    );

  return response.data;
}
