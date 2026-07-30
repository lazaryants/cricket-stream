import type {
  ProviderType,
} from "./stream";

export interface SavedSource {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  provider: ProviderType;
  source_url: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface SavedSourceCreateRequest {
  name: string;
  description: string | null;
  provider: ProviderType;
  source_url: string;
  enabled: boolean;
}

export interface SavedSourceUpdateRequest {
  name?: string;
  description?: string | null;
  provider?: ProviderType;
  source_url?: string;
  enabled?: boolean;
}

export interface SavedSourceListParams {
  includeDisabled?: boolean;
  search?: string;
}
