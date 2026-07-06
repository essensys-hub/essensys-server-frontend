import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useLanIamMode } from '../context/LanIamContext';

export type LanUser = {
  id: number;
  email: string;
  role: string;
  display_name?: string;
  disabled_at?: string | null;
  can_use_trusted_devices?: boolean;
};

type LanAuthContextValue = {
  user: LanUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  enabled: boolean;
};

const LanAuthContext = createContext<LanAuthContextValue | null>(null);

export function LanAuthProvider({ children }: { children: ReactNode }) {
  const { enabled, loading: modeLoading } = useLanIamMode();
  const [user, setUser] = useState<LanUser | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      setUser(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const meRes = await fetch('/api/user/me', { credentials: 'include' });
      if (meRes.status === 401) {
        const autoRes = await fetch('/api/auth/auto-login', { credentials: 'include' });
        if (autoRes.status === 204) {
          setUser(null);
          return;
        }
        if (autoRes.status === 409) {
          setError('Plusieurs comptes correspondent à cet appareil. Connexion manuelle requise.');
          setUser(null);
          return;
        }
        if (autoRes.ok) {
          const data = await autoRes.json();
          setUser(data.user as LanUser);
          return;
        }
        setUser(null);
        return;
      }
      if (!meRes.ok) {
        throw new Error(`HTTP ${meRes.status}`);
      }
      const data = await meRes.json();
      setUser(data.user as LanUser);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur auth');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (modeLoading) return;
    void refresh();
  }, [refresh, modeLoading]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (res.status === 403) {
      throw new Error('Compte désactivé');
    }
    if (!res.ok) {
      throw new Error('Identifiants invalides');
    }
    const data = await res.json();
    setUser(data.user as LanUser);
  }, []);

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading: modeLoading || loading,
      error,
      login,
      logout,
      refresh,
      enabled,
    }),
    [user, modeLoading, loading, error, login, logout, refresh, enabled],
  );

  return <LanAuthContext.Provider value={value}>{children}</LanAuthContext.Provider>;
}

export function useLanAuth(): LanAuthContextValue {
  const ctx = useContext(LanAuthContext);
  if (!ctx) {
    throw new Error('useLanAuth must be used within LanAuthProvider');
  }
  return ctx;
}
