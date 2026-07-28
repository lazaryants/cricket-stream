import type {
  StreamActionResponse,
  StreamCreateRequest,
  StreamItem,
  StreamRuntimeStatus,
  StreamUpdateRequest,
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


export async function getStream(
  streamId: number,
): Promise<StreamItem> {
  const response =
    await http.get<StreamItem>(
      `/streams/${streamId}`,
    );

  return response.data;
}


export async function createStream(
  data: StreamCreateRequest,
): Promise<StreamItem> {
  const response =
    await http.post<StreamItem>(
      "/streams",
      data,
    );

  return response.data;
}


export async function updateStream(
  streamId: number,
  data: StreamUpdateRequest,
): Promise<StreamItem> {
  const response =
    await http.patch<StreamItem>(
      `/streams/${streamId}`,
      data,
    );

  return response.data;
}


export async function deleteStream(
  streamId: number,
): Promise<void> {
  await http.delete(
    `/streams/${streamId}`,
  );
}


export async function getStreamPreview(
  streamId: number,
  width = 960,
): Promise<Blob> {
  const response =
    await http.get<Blob>(
      `/streams/${streamId}/preview`,
      {
        params: {
          width,
          cache_bust: Date.now(),
        },

        responseType: "blob",
      },
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
