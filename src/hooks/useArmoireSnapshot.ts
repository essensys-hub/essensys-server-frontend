import { useCallback, useEffect, useState } from 'react';
import { getArmoireSnapshot } from '../api/armoireApi';
import type { ArmoireSnapshot } from '../types/armoire';

const POLL_MS = 5000;

export function useArmoireSnapshot() {
  const [snapshot, setSnapshot] = useState<ArmoireSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await getArmoireSnapshot();
      setSnapshot(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur snapshot armoire');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [refresh]);

  const partial = (snapshot?.raw_missing?.length ?? 0) > 0;

  return { snapshot, loading, error, partial, refresh };
}
