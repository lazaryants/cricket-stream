export type UserRole =
  | "viewer"
  | "operator"
  | "admin";

export interface CurrentUser {
  id: number;
  uuid: string;
  username: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  is_superuser: boolean;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TokenPairResponse {
  access_token: string;
  refresh_token: string;
  token_type: "bearer";
  access_expires_at: string;
  refresh_expires_at: string;
}

export interface AccessTokenResponse {
  access_token: string;
  token_type: "bearer";
  access_expires_at: string;
}
