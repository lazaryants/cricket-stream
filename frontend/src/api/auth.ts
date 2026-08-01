import type {
  CurrentUser,
  ChangePasswordRequest,
  LoginRequest,
  TokenPairResponse,
} from "../types/auth";

import { http } from "./http";

export async function loginRequest(
  credentials: LoginRequest,
): Promise<TokenPairResponse> {
  const response =
    await http.post<
      TokenPairResponse
    >(
      "/auth/login",
      credentials,
    );

  return response.data;
}

export async function changePassword(
  data: ChangePasswordRequest,
): Promise<void> {
  await http.put(
    "/auth/password",
    data,
  );
}

export async function getCurrentUser():
Promise<CurrentUser> {
  const response =
    await http.get<CurrentUser>(
      "/auth/me",
    );

  return response.data;
}
