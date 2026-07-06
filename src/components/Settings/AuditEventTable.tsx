import { Fragment, useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import type { AuditEventRow } from '../../api/auditApi';
import {
  auditEventPayload,
  auditLifecycleLabel,
  auditReceivedStatus,
  auditSyncBadge,
} from '../../lib/auditEventDisplay';

function SyncBadge({ ev }: { ev: AuditEventRow }) {
  const { label, tone } = auditSyncBadge(ev);
  const cls =
    tone === 'warn'
      ? 'bg-amber-50 text-amber-800 border-amber-200'
      : tone === 'ok'
        ? 'bg-green-50 text-green-800 border-green-200'
        : 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs border ${cls}`}>{label}</span>
  );
}

function LifecycleBadge({ label }: { label: string }) {
  if (label === '—') return <span className="text-gray-400">—</span>;
  const cls =
    label === 'acknowledged' || label === 'received'
      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
      : label === 'queued' || label === 'pending'
        ? 'bg-sky-50 text-sky-800 border-sky-200'
        : 'bg-gray-50 text-gray-700 border-gray-200';
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs border ${cls}`}>{label}</span>
  );
}

export function AuditEventTable({ events }: { events: AuditEventRow[] }) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2 pr-2 w-8" aria-label="Détail" />
            <th className="py-2 pr-4">Date</th>
            <th className="py-2 pr-4">Type</th>
            <th className="py-2 pr-4">Acteur</th>
            <th className="py-2 pr-4">Sujet</th>
            <th className="py-2 pr-4">Statut reçu</th>
            <th className="py-2 pr-4">Cycle</th>
            <th className="py-2">Sync</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => {
            const open = openIds.has(ev.event_id);
            const payload = auditEventPayload(ev);
            return (
              <Fragment key={ev.event_id}>
                <tr className="border-b border-gray-100 hover:bg-gray-50/80">
                  <td className="py-2 pr-2 align-top">
                    <button
                      type="button"
                      className="p-1 rounded hover:bg-gray-200 text-gray-500"
                      aria-expanded={open}
                      aria-label={open ? 'Masquer le JSON' : 'Afficher le JSON'}
                      onClick={() => toggle(ev.event_id)}
                    >
                      {open ? (
                        <ChevronUpIcon className="w-4 h-4" />
                      ) : (
                        <ChevronDownIcon className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap align-top">
                    {new Date(ev.occurred_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 align-top font-mono text-xs">{ev.event_type}</td>
                  <td className="py-2 pr-4 align-top">{ev.actor_id || ev.actor_type}</td>
                  <td className="py-2 pr-4 align-top font-mono text-xs">{ev.subject_key}</td>
                  <td className="py-2 pr-4 align-top font-mono text-xs">{auditReceivedStatus(ev)}</td>
                  <td className="py-2 pr-4 align-top">
                    <LifecycleBadge label={auditLifecycleLabel(ev)} />
                  </td>
                  <td className="py-2 align-top">
                    <SyncBadge ev={ev} />
                  </td>
                </tr>
                {open && (
                  <tr className="border-b border-gray-100 bg-slate-50/60">
                    <td colSpan={8} className="px-3 py-3">
                      <p className="text-xs font-medium text-gray-600 mb-2">
                        Payload JSON (debug / analyse — CPU, mémoire, etc. à venir dans{' '}
                        <code className="text-[11px]">details.gateway_runtime</code>)
                      </p>
                      <pre className="text-xs leading-relaxed overflow-x-auto rounded-lg border border-slate-200 bg-white p-3 font-mono text-slate-800 max-h-96">
                        {JSON.stringify(payload, null, 2)}
                      </pre>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
