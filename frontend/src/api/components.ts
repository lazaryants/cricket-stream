import { http } from "./http";


export interface ComponentVersion {
  installed: string | null;
  available: string | null;
  update_available: boolean | null;
  error: string | null;
}

export interface ComponentsStatus {
  checked_at: string;
  components: Record<
    "streamlink" | "yt-dlp" | "ffmpeg",
    ComponentVersion
  >;
}


export async function getComponents(
  refresh = false,
): Promise<ComponentsStatus> {
  const response =
    await http.get<ComponentsStatus>(
      "/components",
      {
        params: { refresh },
      },
    );

  return response.data;
}
