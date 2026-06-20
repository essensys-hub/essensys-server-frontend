import React, { useCallback, useEffect, useState } from 'react';
import { FireIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard, ActionButton } from '../components/UI';
import { HeatingScheduleGrid } from '../components/Heating/HeatingScheduleGrid';
import { HEATING_ZONES, scheduleKeyRange } from '../heating/constants';
import type { HeatingZoneConfig } from '../heating/constants';
import type { ScheduleGrid } from '../heating/scheduleCodec';
import { diffScheduleInjections, emptyScheduleGrid, gridFromExchange } from '../heating/scheduleCodec';
import { getExchangeValues, sendInjection, sendInjectionBatch } from '../services/legacyApi';

export const HeatingPage: React.FC = () => {
  const [activeZoneId, setActiveZoneId] = useState(HEATING_ZONES[0].id);
  const [grid, setGrid] = useState<ScheduleGrid>(emptyScheduleGrid());
  const [baseline, setBaseline] = useState<ScheduleGrid>(emptyScheduleGrid());
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);
  const [showImmediate, setShowImmediate] = useState(false);
  const [loadingMode, setLoadingMode] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  const handleSaveSchedule = async () => {
    setScheduleSaving(true);
    setSuccess(null);
    setError(null);
    try {
      const items = diffScheduleInjections(grid, baseline, zone.scheduleStartIndex, zone.scheduleByteCount);
      if (items.length === 0) return;
      await sendInjectionBatch(items);
      setBaseline(grid.map((row) => [...row]));
      setSuccess(`Planning enregistré — ${zone.name} (${items.length} octet${items.length > 1 ? 's' : ''} modifié${items.length > 1 ? 's' : ''})`);
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
        saving={scheduleSaving}
        loading={scheduleLoading}
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
                  disabled={loadingMode !== null || scheduleSaving}
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
