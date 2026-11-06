import { useCallback, useEffect, useState } from 'react';
import { getLightTimers } from '../services/legacyApi';
import { useLanAuth } from '../hooks/useLanAuth';
import { useLanIamMode } from '../context/LanIamContext';
import type { LightTimerValue } from './lightTimers';

/** Administrateur de l'armoire : `lan_admin`, ou tout le monde quand l'IAM LAN est désactivé. */
export function useCanAdminLightTimers(): boolean {
  const { enabled, loading } = useLanIamMode();
  const { user } = useLanAuth();
  // Mode IAM pas encore résolu : on ne montre rien (évite d'afficher le réglage à un non-administrateur).
  if (loading) return false;
  return !enabled || user?.role === 'lan_admin';
}

export function useLightTimers() {
  const [timers, setTimers] = useState<LightTimerValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<LightTimerValue[]> => {
    try {
      const next = await getLightTimers();
      setTimers(next);
      setError(null);
      return next;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lecture des temporisations impossible');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { timers, loading, error, refresh };
}
