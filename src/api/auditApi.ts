export interface AuditEventRow {
  event_id: string;
  machine_id: number;
  occurred_at: string;
  ingested_at?: string;
  event_type: string;
  actor_type: string;
  actor_id?: string;
  subject_type: string;
  subject_key: string;
  old_value?: string;
  new_value?: string;
  details?: Record<string, unknown> | unknown;
  source?: string;
  pending_sync?: boolean;
  event_hash?: string;
}

export interface AuditCharterStatus {
  charter_version: string;
  accepted: boolean;
  text: string;
}

async function parseError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.error || res.statusText;
  } catch {
    return res.statusText;
  }
}

export async function fetchAuditEvents(params: Record<string, string> = {}): Promise<{ events: AuditEventRow[]; machine_id: number }> {
  const qs = new URLSearchParams(params);
  const res = await fetch(`/api/audit/events?${qs}`, { credentials: 'include' });
  if (res.status === 403) {
    const body = await res.json().catch(() => ({})) as { error?: string };
    if (body.error === 'charter_required') {
      const err = new Error('charter_required');
      throw err;
    }
  }
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function fetchAuditCharter(): Promise<AuditCharterStatus> {
  const res = await fetch('/api/audit/charter', { credentials: 'include' });
  if (!res.ok) throw new Error(await parseError(res));
  return res.json();
}

export async function acceptAuditCharter(): Promise<void> {
  const res = await fetch('/api/audit/charter', { method: 'POST', credentials: 'include' });
  if (!res.ok) throw new Error(await parseError(res));
}

export function auditExportUrl(format: 'json' | 'csv'): string {
  return `/api/audit/events/export?format=${format}`;
}
