import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getLightNames } from '../services/legacyApi';
import { displayLightName, type LightNameValue } from './lightNames';

/**
 * Réplique partagée des noms : une seule lecture alimente tous les écrans (liste, tableau de bord,
 * Temporisations), et un renommage les met à jour sans rechargement. Lecture impossible : [] (noms d'origine).
 */
let names: LightNameValue[] = [];
let loaded = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const setSharedLightNames = (next: LightNameValue[]) => {
  names = next;
  loaded = true;
  emit();
};

export const refreshLightNames = (): Promise<void> => {
  inflight ??= getLightNames()
    .then(setSharedLightNames)
    .catch(() => {
      loaded = true; // noms d'origine, sans message bloquant
      emit();
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

export function useLightNames() {
  const current = useSyncExternalStore(subscribe, () => names);
  useEffect(() => {
    if (!loaded) void refreshLightNames();
  }, []);
  const nameOf = useCallback((id: string, fallback?: string) => displayLightName(id, current, fallback), [current]);
  return { names: current, nameOf };
}
