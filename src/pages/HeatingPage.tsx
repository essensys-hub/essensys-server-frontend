import React, { useCallback, useEffect, useState } from 'react';
import { FireIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard, ActionButton } from '../components/UI';
import { HeatingScheduleGrid } from '../components/Heating/HeatingScheduleGrid';
import { InjectionSaveConsole } from '../components/Heating/InjectionSaveConsole';
import { HEATING_ZONES, MAX_FIRMWARE_PARAMS_PER_ACTION, scheduleKeyRange } from '../heating/constants';
import type { HeatingZoneConfig } from '../heating/constants';
import type { InjectionLogEntry, InjectionSaveProgress } from '../heating/injectionProgress';
import { logsFromProgressEvent, progressFromEvent } from '../heating/injectionProgress';
import type { ScheduleSyncEvent } from '../heating/scheduleSync';
import { formatSyncProgressLabel, logsFromSyncEvent } from '../heating/scheduleSync';
import type { ScheduleGrid } from '../heating/scheduleCodec';
import { diffScheduleInjections, emptyScheduleGrid, gridFromExchange } from '../heating/scheduleCodec';
import { getExchangeValues, sendInjection, sendInjectionBatch, syncScheduleFromArmoire } from '../services/legacyApi';

export const HeatingPage: React.FC = () => {
  const [activeZoneId, setActiveZoneId] = useState(HEATING_ZONES[0].id);
  const [grid, setGrid] = useState<ScheduleGrid>(emptyScheduleGrid());
  const [baseline, setBaseline] = useState<ScheduleGrid>(emptyScheduleGrid());
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [scheduleSyncing, setScheduleSyncing] = useState(false);
  const [showImmediate, setShowImmediate] = useState(false);
  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saveLogs, setSaveLogs] = useState<InjectionLogEntry[]>([]);
  const [saveProgress, setSaveProgress] = useState<InjectionSaveProgress | null>(null);
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleMode, setConsoleMode] = useState<'save' | 'sync'>('save');
  const [syncProgressLabel, setSyncProgressLabel] = useState<string | null>(null);

  const zone = HEATING_ZONES.find((z) => z.id === activeZoneId) ?? HEATING_ZONES[0];

  const loadSchedule = useCallback(async (z: HeatingZoneConfig) => {
    setScheduleLoading(true);
    setError(null);
    try {
      const keys = scheduleKeyRange(z);
      const values = await getExchangeValues(keys);
      const loaded = gridFromExchange(values, z.scheduleStartIndex, z.scheduleByteCount);
      setGrid(loaded);
      setBaseline(loaded.map((row) => [...row]));
    } catch (e) {
      console.error(e);
      setError('Impossible de charger le planning depuis l\'armoire.');
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedule(zone);
  }, [zone.id, loadSchedule]);

  const appendConsoleLogs = useCallback((entries: InjectionLogEntry[]) => {
    setSaveLogs((prev) => [...prev, ...entries]);
  }, []);

  const appendSaveEvent = useCallback((event: Parameters<typeof logsFromProgressEvent>[0]) => {
    appendConsoleLogs(logsFromProgressEvent(event));
    setSaveProgress((prev) => progressFromEvent(event, prev));
  }, [appendConsoleLogs]);

  const appendSyncEvent = useCallback((event: ScheduleSyncEvent) => {
    appendConsoleLogs(logsFromSyncEvent(event));
    if (event.type === 'waiting') {
      setSaveProgress({
        currentChunk: event.chunksCompleted,
        totalChunks: event.chunksTotal,
        totalParams: event.total,
        status: 'running',
      });
      setSyncProgressLabel(formatSyncProgressLabel(event.received, event.total, true));
    }
    if (event.type === 'loaded' || event.type === 'done') {
      setSaveProgress({
        currentChunk: event.received,
        totalChunks: event.total,
        totalParams: event.total,
        status: event.type === 'done' && !event.complete ? 'error' : 'success',
      });
      setSyncProgressLabel(formatSyncProgressLabel(event.received, event.total, false));
    }
  }, [appendConsoleLogs]);

  const handleSyncSchedule = async () => {
    setScheduleSyncing(true);
    setConsoleMode('sync');
    setConsoleOpen(true);
    setSuccess(null);
    setError(null);
    setSaveLogs([]);
    setSaveProgress(null);
    setSyncProgressLabel(null);
    try {
      const { values, received, total } = await syncScheduleFromArmoire(
        zone.scheduleStartIndex,
        zone.scheduleByteCount,
        zone.name,
        appendSyncEvent,
      );
      const loaded = gridFromExchange(values, zone.scheduleStartIndex, zone.scheduleByteCount);
      setGrid(loaded);
      setBaseline(loaded.map((row) => [...row]));
      if (received >= total) {
        setSuccess(`Planning synchronisé depuis l'armoire — ${zone.name} (${total} octets)`);
      } else {
        setError(
          `Sync partielle — ${received}/${total} octets pour ${zone.name}. Relancer Sync armoire ou vérifier que l'armoire est en ligne.`,
        );
      }
    } catch (e) {
      console.error(e);
      appendSyncEvent({ type: 'error', message: e instanceof Error ? e.message : 'Erreur réseau' });
      setError('Impossible de synchroniser le planning depuis l\'armoire.');
    } finally {
      setScheduleSyncing(false);
    }
  };

  const handleSaveSchedule = async () => {
    setScheduleSaving(true);
    setConsoleMode('save');
    setSuccess(null);
    setError(null);
    setSaveLogs([]);
    setSaveProgress(null);
    setSyncProgressLabel(null);
    setConsoleOpen(true);
    try {
      const items = diffScheduleInjections(grid, baseline, zone.scheduleStartIndex, zone.scheduleByteCount);
      if (items.length === 0) return;
      const { totalParams, chunkCount } = await sendInjectionBatch(items, appendSaveEvent);
      setBaseline(grid.map((row) => [...row]));
      const chunkLabel =
        chunkCount > 1 ? ` — ${chunkCount} envois armoire (max 30/octet)` : '';
      setSuccess(
        `Planning enregistré — ${zone.name} (${totalParams} octet${totalParams > 1 ? 's' : ''} modifié${totalParams > 1 ? 's' : ''}${chunkLabel})`,
      );
    } catch (e) {
      console.error(e);
      setError('Échec envoi du planning vers l\'armoire.');
    } finally {
      setScheduleSaving(false);
    }
  };

  const handleCancelSchedule = () => {
    setGrid(baseline.map((row) => [...row]));
  };

  const handleImmediateMode = async (modeValue: string, modeLabel: string) => {
    setLoadingMode(modeValue);
    setSuccess(null);
    setError(null);
    try {
      await sendInjection(zone.modeIndex, modeValue);
      setSuccess(`${zone.name} : ${modeLabel}`);
    } catch (e) {
      console.error(e);
      setError('Échec envoi du mode immédiat.');
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Chauffage"
        description="Planning hebdomadaire et modes immédiats — comme sur l'écran mural"
        icon={FireIcon}
        backLink="/dashboard"
        backLabel="Tableau de bord"
      />

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700"><strong>OK :</strong> {success}</p>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <p className="mb-4 text-xs text-gray-500 leading-relaxed">
        Synchronisation armoire : après enregistrement, laisser ~20&nbsp;s par envoi (cycle firmware).
        Les changements depuis le portail distant mettent à jour l&apos;armoire locale automatiquement.
      </p>

      {/* Sélecteur de zone */}
      <div className="mb-4 flex flex-wrap gap-2">
        {HEATING_ZONES.map((z) => (
          <button
            key={z.id}
            type="button"
            onClick={() => setActiveZoneId(z.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              z.id === activeZoneId
                ? 'bg-essensys-primary text-white'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {z.name}
          </button>
        ))}
      </div>

      <HeatingScheduleGrid
        zone={zone}
        grid={grid}
        baseline={baseline}
        onChange={setGrid}
        onSave={handleSaveSchedule}
        onCancel={handleCancelSchedule}
        onSync={handleSyncSchedule}
        saving={scheduleSaving}
        syncing={scheduleSyncing}
        loading={scheduleLoading}
        saveProgress={saveProgress}
      />

      <InjectionSaveConsole
        progress={saveProgress}
        logs={saveLogs}
        visible={consoleOpen}
        onToggle={() => setConsoleOpen((v) => !v)}
        title={consoleMode === 'sync' ? 'Console sync armoire' : 'Console sauvegarde'}
        subtitle={consoleMode === 'sync' ? 'lecture planning firmware' : `limite ${MAX_FIRMWARE_PARAMS_PER_ACTION}/envoi`}
        progressLabel={consoleMode === 'sync' && syncProgressLabel ? syncProgressLabel : undefined}
      />

      {/* Modes immédiats (repliable) */}
      <div className="mt-6">
        <button
          type="button"
          onClick={() => setShowImmediate((v) => !v)}
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-essensys-primary"
        >
          {showImmediate ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          Mode immédiat — {zone.name}
        </button>
        {showImmediate && (
          <ControlCard title={`Commande instantanée — ${zone.name}`} className="mt-3">
            <p className="text-xs text-gray-500 mb-3">
              Indices firmware {zone.modeIndex} (auto, anticipé, forçage). Distinct du planning horaire ci-dessus.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {zone.immediateModes.map((mode) => (
                <ActionButton
                  key={mode.value}
                  label={mode.label}
                  variant={mode.value === '16' ? 'secondary' : 'primary'}
                  onClick={() => handleImmediateMode(mode.value, mode.label)}
                  loading={loadingMode === mode.value}
                  disabled={loadingMode !== null || scheduleSaving || scheduleSyncing}
                  size="sm"
                  className="w-full"
                />
              ))}
            </div>
          </ControlCard>
        )}
      </div>
    </div>
  );
};

export default HeatingPage;
