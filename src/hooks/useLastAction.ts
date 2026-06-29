import { useState, useEffect, useCallback } from 'react';
import { getHistoryLatest } from '../services/legacyApi';
import type { LastActionResponse } from '../services/legacyApi';

/** Aligné sur le poll firmware SC944D (2 s si isconnected). */
export const LAST_ACTION_POLL_MS = 2000;

interface UseLastActionResult {
  lastAction: LastActionResponse['lastAction'] | null;
  loading: boolean;
  polling: boolean;
  error: string | null;
  refetch: () => void;
}

export const useLastAction = (): UseLastActionResult => {
  const [lastAction, setLastAction] = useState<LastActionResponse['lastAction'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fetchLastAction = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const response = await getHistoryLatest();
      const action = response.lastAction ?? null;
      setLastAction(action);
      setPolling(action !== null && !action.isDone);
    } catch (e) {
      console.error('Failed to fetch last action:', e);
      if (!silent) {
        setError('Impossible de récupérer l\'historique');
        setLastAction(null);
        setPolling(false);
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchLastAction();
  }, [fetchLastAction]);

  useEffect(() => {
    if (!polling) {
      return undefined;
    }
    const id = window.setInterval(() => {
      void fetchLastAction({ silent: true });
    }, LAST_ACTION_POLL_MS);
    return () => window.clearInterval(id);
  }, [polling, fetchLastAction]);

  return {
    lastAction,
    loading,
    polling,
    error,
    refetch: () => {
      void fetchLastAction();
    },
  };
};

export default useLastAction;
