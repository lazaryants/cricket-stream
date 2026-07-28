import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  getCurrentUser,
  loginRequest,
} from "../api/auth";

import { tokenStorage } from "../api/tokenStorage";

import type {
  CurrentUser,
  LoginRequest,
} from "../types/auth";

export interface AuthContextValue {
  user: CurrentUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  login(
    credentials: LoginRequest,
  ): Promise<void>;

  logout(): void;
}

export const AuthContext =
  createContext<
    AuthContextValue | undefined
  >(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    user,
    setUser,
  ] = useState<CurrentUser | null>(
    null,
  );

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const logout = useCallback(() => {
    tokenStorage.clear();
    setUser(null);
  }, []);

  const loadCurrentUser =
    useCallback(async () => {
      const hasAccessToken =
        Boolean(
          tokenStorage
            .getAccessToken(),
        );

      const hasRefreshToken =
        Boolean(
          tokenStorage
            .getRefreshToken(),
        );

      if (
        !hasAccessToken
        && !hasRefreshToken
      ) {
        setIsLoading(false);
        return;
      }

      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);
      } catch {
        logout();
      } finally {
        setIsLoading(false);
      }
    }, [logout]);

  useEffect(() => {
    void loadCurrentUser();
  }, [loadCurrentUser]);

  useEffect(() => {
    const handleForcedLogout =
      () => {
        logout();
      };

    window.addEventListener(
      "auth:logout",
      handleForcedLogout,
    );

    return () => {
      window.removeEventListener(
        "auth:logout",
        handleForcedLogout,
      );
    };
  }, [logout]);

  const login = useCallback(
    async (
      credentials: LoginRequest,
    ) => {
      const tokens =
        await loginRequest(
          credentials,
        );

      tokenStorage.setTokens(
        tokens.access_token,
        tokens.refresh_token,
      );

      try {
        const currentUser =
          await getCurrentUser();

        setUser(currentUser);
      } catch (error) {
        tokenStorage.clear();
        throw error;
      }
    },
    [],
  );

  const value = useMemo<
    AuthContextValue
  >(
    () => ({
      user,
      isLoading,
      isAuthenticated:
        user !== null,
      login,
      logout,
    }),
    [
      user,
      isLoading,
      login,
      logout,
    ],
  );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}
