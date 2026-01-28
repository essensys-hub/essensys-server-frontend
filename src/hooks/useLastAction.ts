import { useState, useEffect, useCallback } from 'react';
import { getHistoryLatest } from '../services/legacyApi';
import type { LastActionResponse } from '../services/legacyApi';

interface UseLastActionResult {
  lastAction: LastActionResponse['lastAction'] | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useLastAction = (): UseLastActionResult => {
  const [lastAction, setLastAction] = useState<LastActionResponse['lastAction'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLastAction = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getHistoryLatest();
      setLastAction(response.lastAction);
    } catch (e) {
      console.error('Failed to fetch last action:', e);
      setError('Impossible de récupérer l\'historique');
      setLastAction(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLastAction();
  }, [fetchLastAction]);

  return {
    lastAction,
    loading,
    error,
    refetch: fetchLastAction,
  };
};

export default useLastAction;
