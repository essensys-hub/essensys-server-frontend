import { useCallback, useEffect, useState } from 'react';
import {
  fetchScenarios,
  launchScenario,
  type ScenarioSlotSummary,
} from '../services/scenarioApi';

export const useScenarios = (options?: { disabled?: boolean }) => {
  const [slots, setSlots] = useState<ScenarioSlotSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchingSlot, setLaunchingSlot] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (options?.disabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await fetchScenarios();
      setSlots(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur chargement scénarios');
    } finally {
      setLoading(false);
    }
  }, [options?.disabled]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const launch = useCallback(async (slot: number) => {
    setLaunchingSlot(slot);
    setMessage(null);
    setError(null);
    try {
      await launchScenario(slot);
      const label = slots.find((s) => s.slot_number === slot)?.label ?? `Scénario ${slot}`;
      setMessage(`${label} lancé`);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Échec lancement');
    } finally {
      setLaunchingSlot(null);
    }
  }, [refresh, slots]);

  const lastLaunched = slots.find((s) => s.last_launched === s.slot_number);

  return {
    slots,
    loading,
    error,
    message,
    launchingSlot,
    lastLaunched,
    refresh,
    launch,
  };
};
