import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { getShutterNames } from '../services/legacyApi';
import { displayShutterName, type ShutterNameValue } from './shutterNames';

/**
 * Réplique partagée des noms de volets : une seule lecture alimente tous les écrans (liste, Temps de course,
 * messages), et un renommage les met à jour sans rechargement. Lecture impossible : [] (noms d'origine).
 */
let names: ShutterNameValue[] = [];
let loaded = false;
let inflight: Promise<void> | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const setSharedShutterNames = (next: ShutterNameValue[]) => {
  names = next;
  loaded = true;
  emit();
};

export const refreshShutterNames = (): Promise<void> => {
  inflight ??= getShutterNames()
    .then(setSharedShutterNames)
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

export function useShutterNames() {
  const current = useSyncExternalStore(subscribe, () => names);
  useEffect(() => {
    if (!loaded) void refreshShutterNames();
  }, []);
  const nameOf = useCallback((id: string, fallback?: string) => displayShutterName(id, current, fallback), [current]);
  return { names: current, nameOf };
}
