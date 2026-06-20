import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowPathIcon, BoltIcon, CloudArrowUpIcon, FireIcon } from '@heroicons/react/24/outline';
import { ActionButton, ControlCard } from '../UI';
import { HEATING_ZONES } from '../../heating/constants';
import type { InjectionLogEntry } from '../../heating/injectionProgress';
import { InjectionSaveConsole } from '../Heating/InjectionSaveConsole';
import { logsFromSyncEvent } from '../../heating/scheduleSync';
import type { ScheduleSyncEvent } from '../../heating/scheduleSync';
import { syncScheduleFromArmoire } from '../../services/legacyApi';
import { getScenariosSyncStatus, setScenariosSyncEnabled } from '../../services/scenarioSyncApi';

export const SyncSettingsPanel: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const [logs, setLogs] = useState<InjectionLogEntry[]>([]);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scenariosSyncEnabled, setScenariosSyncEnabledState] = useState(false);
  const [scenariosSyncFound, setScenariosSyncFound] = useState(false);
  const [scenariosSyncLoading, setScenariosSyncLoading] = useState(true);
  const [scenariosSyncSaving, setScenariosSyncSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const st = await getScenariosSyncStatus();
        if (!cancelled) {
          setScenariosSyncEnabledState(st.enabled);
          setScenariosSyncFound(st.found);
        }
      } catch {
        if (!cancelled) {
          setScenariosSyncFound(false);
        }
      } finally {
        if (!cancelled) {
          setScenariosSyncLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleScenariosSyncToggle = async () => {
    const next = !scenariosSyncEnabled;
    setScenariosSyncSaving(true);
    setError(null);
    try {
      const st = await setScenariosSyncEnabled(next);
      setScenariosSyncEnabledState(st.enabled);
      setScenariosSyncFound(st.found);
      setStatus(next ? 'Synchronisation scénarios activée' : 'Synchronisation scénarios désactivée');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Impossible de mettre à jour la sync scénarios');
    } finally {
      setScenariosSyncSaving(false);
    }
  };

  const appendLogs = useCallback((event: ScheduleSyncEvent) => {
    setLogs((prev) => [...prev, ...logsFromSyncEvent(event)]);
  }, []);

  const handleSyncAllHeating = async () => {
    setSyncing(true);
    setConsoleOpen(true);
    setLogs([]);
    setStatus(null);
    setError(null);
    let ok = 0;
    for (const zone of HEATING_ZONES) {
      try {
        appendLogs({ type: 'start', zoneName: zone.name, startIndex: zone.scheduleStartIndex, endIndex: zone.scheduleStartIndex + zone.scheduleByteCount - 1, chunksTotal: 0 });
        const { received, total } = await syncScheduleFromArmoire(
          zone.scheduleStartIndex,
          zone.scheduleByteCount,
          zone.name,
          appendLogs,
        );
        if (received >= total) ok += 1;
      } catch (e) {
        appendLogs({ type: 'error', message: `${zone.name}: ${e instanceof Error ? e.message : 'erreur'}` });
      }
    }
    if (ok === HEATING_ZONES.length) {
      setStatus(`Planning chauffage synchronisé — ${ok}/${HEATING_ZONES.length} zones`);
    } else {
      setError(`Sync partielle — ${ok}/${HEATING_ZONES.length} zones complètes. Relancer ou vérifier l'armoire.`);
    }
    setSyncing(false);
  };

  return (
    <>
      <ControlCard
        title="Synchronisation"
        description="Lecture planning depuis l'armoire et envoi automatique vers le cloud (toutes les 3 h)"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-sky-50 border border-sky-200 rounded-lg">
            <CloudArrowUpIcon className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-sky-900">
              <p className="font-medium">Sync cloud planifiée</p>
              <p className="text-xs text-sky-800 mt-1">
                La gateway synchronise les plages configurées (chauffage, volets, modes) vers{' '}
                <span className="font-medium">mon.essensys.fr</span> en arrière-plan. Gestion des profils : admin Sync Cloud sur le portail support.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 bg-violet-50 border border-violet-200 rounded-lg">
            <BoltIcon className="w-5 h-5 text-violet-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-violet-900">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">Synchroniser les scénarios</p>
                  <p className="text-xs text-violet-800 mt-1">
                    Pull/push cloud des slots scénario (591–919) toutes les 3 h. Le trigger 590 est exclu du push (reset firmware).
                  </p>
                </div>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                    checked={scenariosSyncEnabled}
                    disabled={scenariosSyncLoading || scenariosSyncSaving || !scenariosSyncFound}
                    onChange={handleScenariosSyncToggle}
                  />
                  <span className="text-xs font-medium">
                    {scenariosSyncLoading
                      ? 'Chargement…'
                      : !scenariosSyncFound
                        ? 'Profil cloud indisponible'
                        : scenariosSyncEnabled
                          ? 'Activé'
                          : 'Désactivé'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <ActionButton
              label={syncing ? 'Synchronisation…' : 'Sync chauffage (toutes zones)'}
              variant="primary"
              icon={ArrowPathIcon}
              onClick={handleSyncAllHeating}
              disabled={syncing}
            />
            <Link
              to="/heating"
              className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 hover:bg-gray-50"
            >
              <FireIcon className="w-4 h-4" />
              Sync par zone (Chauffage)
            </Link>
          </div>

          {status && (
            <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">{status}</p>
          )}
          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
          )}

          <p className="text-xs text-gray-500">
            La sync armoire lit le planning par tranches de 30 octets (limite firmware). Une zone = 84 octets ≈ 3 cycles (~1 min).
          </p>
        </div>
      </ControlCard>

      <InjectionSaveConsole
        visible={consoleOpen}
        onToggle={() => setConsoleOpen((v) => !v)}
        logs={logs}
        progress={null}
        title="Console synchronisation"
        subtitle="lecture planning depuis l'armoire"
      />
    </>
  );
};

export default SyncSettingsPanel;
