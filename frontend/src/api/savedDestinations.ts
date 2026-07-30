import type {
  SavedDestination,
  SavedDestinationCreateRequest,
  SavedDestinationListParams,
  SavedDestinationUpdateRequest,
} from "../types/savedDestination";
import { http } from "./http";

export async function getSavedDestinations(
  params: SavedDestinationListParams = {},
): Promise<SavedDestination[]> {
  const response =
    await http.get<SavedDestination[]>(
      "/saved-destinations",
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

export async function getSavedDestination(
  destinationId: number,
): Promise<SavedDestination> {
  const response =
    await http.get<SavedDestination>(
      `/saved-destinations/${destinationId}`,
    );

  return response.data;
}

export async function createSavedDestination(
  data: SavedDestinationCreateRequest,
): Promise<SavedDestination> {
  const response =
    await http.post<SavedDestination>(
      "/saved-destinations",
      data,
    );

  return response.data;
}

export async function updateSavedDestination(
  destinationId: number,
  data: SavedDestinationUpdateRequest,
): Promise<SavedDestination> {
  const response =
    await http.patch<SavedDestination>(
      `/saved-destinations/${destinationId}`,
      data,
    );

  return response.data;
}

export async function deleteSavedDestination(
  destinationId: number,
): Promise<void> {
  await http.delete(
    `/saved-destinations/${destinationId}`,
  );
}
