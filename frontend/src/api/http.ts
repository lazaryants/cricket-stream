import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";

import type {
  AccessTokenResponse,
} from "../types/auth";

import { tokenStorage } from "./tokenStorage";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL
  ?? "/api/v1";

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

const refreshHttp = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  headers: {
    "Content-Type": "application/json",
  },
});

interface RetryRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let refreshPromise:
  Promise<string> | null = null;

async function refreshAccessToken():
Promise<string> {
  const refreshToken =
    tokenStorage.getRefreshToken();

  if (!refreshToken) {
    throw new Error(
      "Refresh token is missing",
    );
  }

  const response =
    await refreshHttp.post<
      AccessTokenResponse
    >(
      "/auth/refresh",
      {
        refresh_token: refreshToken,
      },
    );

  const accessToken =
    response.data.access_token;

  tokenStorage.setAccessToken(
    accessToken,
  );

  return accessToken;
}

function forceLogout(): void {
  tokenStorage.clear();

  window.dispatchEvent(
    new Event("auth:logout"),
  );
}

http.interceptors.request.use(
  (
    config:
      InternalAxiosRequestConfig,
  ) => {
    const accessToken =
      tokenStorage.getAccessToken();

    if (accessToken) {
      config.headers.Authorization =
        `Bearer ${accessToken}`;
    }

    return config;
  },
);

http.interceptors.response.use(
  (response) => response,

  async (
    error: AxiosError,
  ) => {
    const originalRequest =
      error.config as
        RetryRequestConfig
        | undefined;

    if (
      error.response?.status !== 401
      || !originalRequest
      || originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const requestUrl =
      originalRequest.url ?? "";

    if (
      requestUrl.includes(
        "/auth/login",
      )
      || requestUrl.includes(
        "/auth/refresh",
      )
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise =
          refreshAccessToken()
            .finally(() => {
              refreshPromise = null;
            });
      }

      const newAccessToken =
        await refreshPromise;

      originalRequest.headers.Authorization =
        `Bearer ${newAccessToken}`;

      return http(
        originalRequest,
      );
    } catch (refreshError) {
      forceLogout();

      return Promise.reject(
        refreshError,
      );
    }
  },
);
