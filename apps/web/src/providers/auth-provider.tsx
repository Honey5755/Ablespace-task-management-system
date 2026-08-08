'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, api, tokenStore } from '@/lib/api';
import type { User } from '@/lib/types';

interface AuthContextValue {
  user: User | null;
  /** True until the stored token has been checked, so guards don't flash. */
  isLoading: boolean;
  isAuthenticated: boolean;
  loginAsGuest: (name?: string) => Promise<void>;
  /** Re-reads the profile after a settings change. */
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session on mount; a stale or revoked token is discarded.
  useEffect(() => {
    if (!tokenStore.get()) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    api
      .me()
      .then((restored) => {
        if (!cancelled) setUser(restored);
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 401) tokenStore.clear();
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loginAsGuest = useCallback(async (name?: string) => {
    const { accessToken, user: guest } = await api.loginAsGuest(name);
    tokenStore.set(accessToken);
    setUser(guest);
  }, []);

  const refresh = useCallback(async () => {
    setUser(await api.me());
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: user !== null,
      loginAsGuest,
      refresh,
      logout,
    }),
    [user, isLoading, loginAsGuest, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
