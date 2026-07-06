import { useState } from 'react';
import { PageHeader, ControlCard } from '../components/UI';
import { AuditEventTable } from '../components/Settings/AuditEventTable';
import { useAuditTrail } from '../hooks/useAuditTrail';
import { useAuditCharter } from '../hooks/useAuditCharter';
import { auditExportUrl } from '../api/auditApi';
import { useLanAuth } from '../hooks/useLanAuth';
import { Navigate } from 'react-router-dom';

export function AuditTrailPage() {
  const { user, loading: authLoading } = useLanAuth();
  const [query, setQuery] = useState('');
  const [eventType, setEventType] = useState('');
  const { events, loading, error, charterRequired, reload } = useAuditTrail(query, eventType, user?.id);
  const charter = useAuditCharter(user?.id);

  if (authLoading) {
    return (
      <div className="py-12 text-center text-sm text-gray-500">Chargement du journal…</div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/settings/audit' }} />;
  }

  if (user.role === 'lan_guest') {
    return <Navigate to="/dashboard" replace />;
  }

  const showCharter = charterRequired || charter.accepted === false;

  return (
    <div className="space-y-6">
      <PageHeader title="Journal d'activité" description="Historique des actions domotiques (lecture seule)" />

      {showCharter && (
        <ControlCard title="Charte d'utilisation">
          <p className="text-sm text-gray-600 whitespace-pre-wrap mb-4">{charter.text || 'Chargement…'}</p>
          <button
            type="button"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
            onClick={async () => {
              await charter.accept();
              await reload();
            }}
          >
            J'accepte la charte (v{charter.version || '1'})
          </button>
        </ControlCard>
      )}

      {!showCharter && (
        <>
          <ControlCard title="Filtres">
            <div className="flex flex-wrap gap-3">
              <input
                className="border rounded-lg px-3 py-2 text-sm flex-1 min-w-[200px]"
                placeholder="Rechercher…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select
                className="border rounded-lg px-3 py-2 text-sm"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
              >
                <option value="">Tous types</option>
                <option value="USER_ACTION">Actions utilisateur</option>
                <option value="STATE_CHANGE">Changements d'état</option>
                <option value="AUTH_EVENT">Authentification</option>
              </select>
              <a className="px-3 py-2 text-sm border rounded-lg" href={auditExportUrl('csv')}>
                Export CSV
              </a>
            </div>
          </ControlCard>

          <ControlCard title="Événements">
            {loading && <p className="text-sm text-gray-500">Chargement…</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && events.length === 0 && (
              <p className="text-sm text-gray-500">Aucune activité enregistrée.</p>
            )}
            {!loading && events.length > 0 && <AuditEventTable events={events} />}
          </ControlCard>
        </>
      )}
    </div>
  );
}
