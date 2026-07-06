import { useCallback, useEffect, useState } from 'react';
import { acceptAuditCharter, fetchAuditCharter } from '../api/auditApi';

export function useAuditCharter(userId?: number) {
  const [accepted, setAccepted] = useState<boolean | null>(null);
  const [text, setText] = useState('');
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(Boolean(userId));

  const reload = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const status = await fetchAuditCharter();
      setAccepted(status.accepted);
      setText(status.text);
      setVersion(status.charter_version);
    } catch {
      setAccepted(false);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const accept = useCallback(async () => {
    await acceptAuditCharter();
    setAccepted(true);
  }, []);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    void reload();
  }, [reload, userId]);

  return { accepted, text, version, loading, accept, reload };
}
