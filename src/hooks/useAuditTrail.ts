import { useCallback, useEffect, useState } from 'react';
import type { AuditEventRow } from '../api/auditApi';
import { fetchAuditEvents } from '../api/auditApi';

export function useAuditTrail(query = '', eventType = '', userId?: number) {
  const [events, setEvents] = useState<AuditEventRow[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);
  const [charterRequired, setCharterRequired] = useState(false);

  const reload = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    setCharterRequired(false);
    try {
      const params: Record<string, string> = { limit: '200' };
      if (query.trim()) params.q = query.trim();
      if (eventType) params.event_type = eventType;
      const data = await fetchAuditEvents(params);
      setEvents(data.events || []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur';
      if (msg.includes('charter_required') || msg === 'charter_required') {
        setCharterRequired(true);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [query, eventType, userId]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setEvents([]);
      return;
    }
    void reload();
  }, [reload, userId]);

  return { events, loading, error, charterRequired, reload };
}
