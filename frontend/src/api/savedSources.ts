import type {
  SavedSource,
  SavedSourceCreateRequest,
  SavedSourceListParams,
  SavedSourceUpdateRequest,
} from "../types/savedSource";
import { http } from "./http";

export async function getSavedSources(
  params: SavedSourceListParams = {},
): Promise<SavedSource[]> {
  const response =
    await http.get<SavedSource[]>(
      "/saved-sources",
      {
        params: {
          include_disabled:
            params.includeDisabled
            ?? false,
          search:
            params.search
            || undefined,
        },
      },
    );

  return response.data;
}

export async function getSavedSource(
  sourceId: number,
): Promise<SavedSource> {
  const response =
    await http.get<SavedSource>(
      `/saved-sources/${sourceId}`,
    );

  return response.data;
}

export async function createSavedSource(
  data: SavedSourceCreateRequest,
): Promise<SavedSource> {
  const response =
    await http.post<SavedSource>(
      "/saved-sources",
      data,
    );

  return response.data;
}

export async function updateSavedSource(
  sourceId: number,
  data: SavedSourceUpdateRequest,
): Promise<SavedSource> {
  const response =
    await http.patch<SavedSource>(
      `/saved-sources/${sourceId}`,
      data,
    );

  return response.data;
}

export async function deleteSavedSource(
  sourceId: number,
): Promise<void> {
  await http.delete(
    `/saved-sources/${sourceId}`,
  );
}
