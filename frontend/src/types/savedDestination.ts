export interface SavedDestination {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  destination_rtmp_url: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedDestinationCreateRequest {
  name: string;
  description: string | null;
  destination_rtmp_url: string;
  enabled: boolean;
}

export interface SavedDestinationUpdateRequest {
  name?: string;
  description?: string | null;
  destination_rtmp_url?: string;
  enabled?: boolean;
}

export interface SavedDestinationListParams {
  includeDisabled?: boolean;
  search?: string;
}
