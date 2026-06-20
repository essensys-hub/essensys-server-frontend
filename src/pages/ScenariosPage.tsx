import React, { useCallback, useEffect, useState } from 'react';
import { BoltIcon } from '@heroicons/react/24/outline';
import { PageHeader } from '../components/UI';
import { ScenarioButtonGrid, ScenarioEditorDrawer } from '../components/Scenarios';
import { useScenarios } from '../hooks/useScenarios';
import {
  fetchScenario,
  fetchScenarioBitmasks,
  restoreScenario,
  updateScenario,
  launchScenario,
  type BitmaskField,
  type ScenarioSlotDetail,
} from '../services/scenarioApi';

export const ScenariosPage: React.FC = () => {
  const { slots, loading, error, message, launchingSlot, lastLaunched, launch } = useScenarios();
  const [editorSlot, setEditorSlot] = useState<number | null>(null);
  const [detail, setDetail] = useState<ScenarioSlotDetail | null>(null);
  const [bitmasks, setBitmasks] = useState<BitmaskField[]>([]);
  const [editorLoading, setEditorLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editorMessage, setEditorMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchScenarioBitmasks().then(setBitmasks).catch(console.error);
  }, []);

  const openEditor = useCallback(async (slot: number) => {
    setEditorSlot(slot);
    setEditorLoading(true);
    setEditorMessage(null);
    try {
      const d = await fetchScenario(slot);
      setDetail(d);
    } catch (e) {
      console.error(e);
      setEditorMessage('Impossible de charger le scénario');
    } finally {
      setEditorLoading(false);
    }
  }, []);

  const closeEditor = () => {
    setEditorSlot(null);
    setDetail(null);
    setEditorMessage(null);
  };

  const handleSave = async (params: Record<number, string>) => {
    if (editorSlot === null) return;
    setSaving(true);
    setEditorMessage(null);
    try {
      await updateScenario(editorSlot, params);
      setEditorMessage('Scénario enregistré');
      const d = await fetchScenario(editorSlot);
      setDetail(d);
    } catch (e) {
      setEditorMessage(e instanceof Error ? e.message : 'Échec enregistrement');
    } finally {
      setSaving(false);
    }
  };

  const handleLaunchFromEditor = async () => {
    if (editorSlot === null) return;
    try {
      await launchScenario(editorSlot);
      setEditorMessage('Scénario lancé');
    } catch (e) {
      setEditorMessage(e instanceof Error ? e.message : 'Échec lancement');
    }
  };

  const handleRestore = async () => {
    if (editorSlot === null) return;
    if (!window.confirm('Restaurer les valeurs par défaut firmware ?')) return;
    try {
      await restoreScenario(editorSlot);
      setEditorMessage('Preset firmware demandé');
      const d = await fetchScenario(editorSlot);
      setDetail(d);
    } catch (e) {
      setEditorMessage(e instanceof Error ? e.message : 'Échec restauration');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scénarios"
        description="Je sors, vacances, personnalisés — un clic pour tout orchestrer"
        icon={BoltIcon}
      />

      {lastLaunched && (
        <p className="text-sm text-gray-600">
          Dernier scénario lancé : <strong>{lastLaunched.label}</strong>
        </p>
      )}

      {(error || message) && (
        <div
          className={`rounded-lg px-4 py-3 text-sm ${
            error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
          }`}
        >
          {error ?? message}
        </div>
      )}

      {loading ? (
        <p className="text-gray-500">Chargement des scénarios…</p>
      ) : (
        <ScenarioButtonGrid
          slots={slots}
          launchingSlot={launchingSlot}
          onLaunch={launch}
          onEdit={openEditor}
        />
      )}

      <ScenarioEditorDrawer
        open={editorSlot !== null}
        slot={editorSlot}
        detail={detail}
        bitmasks={bitmasks}
        loading={editorLoading}
        saving={saving}
        onClose={closeEditor}
        onSave={handleSave}
        onLaunch={handleLaunchFromEditor}
        onRestore={handleRestore}
      />

      {editorMessage && editorSlot !== null && (
        <p className="text-sm text-gray-600">{editorMessage}</p>
      )}
    </div>
  );
};
