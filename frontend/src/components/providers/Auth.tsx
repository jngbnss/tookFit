"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "@/lib/api/auth";
import { isApiError, refreshSession } from "@/lib/api/client";
import type { Me } from "@/lib/api/types";

type AuthState = {
  me: Me | null;
  /** 첫 /me 확인이 끝났는지 */
  ready: boolean;
  setMe: (me: Me | null) => void;
  reload: () => Promise<Me | null>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  me: null,
  ready: false,
  setMe: () => {},
  reload: async () => null,
  logout: async () => {},
});

async function loadMe(): Promise<Me | null> {
  try {
    return await authApi.me();
  } catch (e) {
    if (!isApiError(e) || e.status !== 401) return null;
    // access 쿠키가 만료되어 사라졌어도 refresh 쿠키가 살아 있을 수 있어서, 처음 한 번은 재발급을 시도한다
    if (!(await refreshSession())) return null;
    try {
      return await authApi.me();
    } catch {
      return null;
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null);
  const [ready, setReady] = useState(false);

  const reload = useCallback(async () => {
    const next = await loadMe();
    setMe(next);
    setReady(true);
    return next;
  }, []);

  useEffect(() => {
    let alive = true;
    loadMe().then((next) => {
      if (!alive) return;
      setMe(next);
      setReady(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 이미 만료되었어도 화면은 로그아웃 상태로 바꾼다
    }
    setMe(null);
  }, []);

  const value = useMemo(() => ({ me, ready, setMe, reload, logout }), [me, ready, reload, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
