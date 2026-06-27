import { useCallback, useEffect, useState } from 'react';
import { useLanIamMode } from '../context/LanIamContext';

export type LanUser = {
  id: number;
  email: string;
  role: string;
  display_name?: string;
  disabled_at?: string | null;
};

export function useLanAuth() {
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
      const res = await fetch('/api/user/me', { credentials: 'include' });
      if (res.status === 401) {
        setUser(null);
        return;
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
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

  const login = async (email: string, password: string) => {
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
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  return {
    user,
    loading: modeLoading || loading,
    error,
    login,
    logout,
    refresh,
    enabled,
  };
}
