import type { AuditEventRow } from '../api/auditApi';

type AuditDetails = Record<string, unknown>;

function asDetails(raw: AuditEventRow['details']): AuditDetails | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return raw as AuditDetails;
}

export function auditReceivedStatus(ev: AuditEventRow): string {
  const d = asDetails(ev.details);
  if (d?.ack_status === 'received' || d?.lifecycle_status === 'acknowledged') {
    const received = d.received_value ?? ev.new_value;
    return received != null ? String(received) : 'Reçu';
  }
  if (d?.lifecycle_status === 'queued' || d?.ack_status === 'pending') {
    return 'En attente cartouche';
  }
  if (ev.new_value) return ev.new_value;
  if (ev.old_value) return ev.old_value;
  return '—';
}

export function auditLifecycleLabel(ev: AuditEventRow): string {
  const d = asDetails(ev.details);
  if (typeof d?.lifecycle_status === 'string') return d.lifecycle_status;
  if (typeof d?.ack_status === 'string') return d.ack_status;
  if (ev.pending_sync) return 'sync pending';
  return '—';
}

export function auditSyncBadge(ev: AuditEventRow): { label: string; tone: 'ok' | 'warn' | 'muted' } {
  if (ev.pending_sync) return { label: 'sync OVH pending', tone: 'warn' };
  return { label: 'local OK', tone: 'ok' };
}

export function auditEventPayload(ev: AuditEventRow): Record<string, unknown> {
  return {
    event_id: ev.event_id,
    machine_id: ev.machine_id,
    occurred_at: ev.occurred_at,
    ingested_at: ev.ingested_at,
    event_type: ev.event_type,
    actor_type: ev.actor_type,
    actor_id: ev.actor_id,
    subject_type: ev.subject_type,
    subject_key: ev.subject_key,
    old_value: ev.old_value,
    new_value: ev.new_value,
    details: ev.details ?? null,
    source: ev.source,
    pending_sync: ev.pending_sync,
    event_hash: ev.event_hash,
  };
}
