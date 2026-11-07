import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { getObjectLayout } from '../services/legacyApi';
import { DEFAULT_LAYOUT, effectiveLayout, type LayoutKind, type ObjectLayout } from './objectLayout';

/**
 * Réplique partagée de la disposition d'un genre. Lecture impossible ou 404 : catalogue complet dans l'ordre d'origine,
 * sans message bloquant ; après une lecture réussie, une coupure passagère conserve la dernière disposition lue.
 */
interface Store {
  layout: ObjectLayout;
  inflight: Promise<void> | null;
  listeners: Set<() => void>;
}

const stores: Record<LayoutKind, Store> = {
  lights: { layout: DEFAULT_LAYOUT, inflight: null, listeners: new Set() },
  shutters: { layout: DEFAULT_LAYOUT, inflight: null, listeners: new Set() },
};

const emit = (kind: LayoutKind) => stores[kind].listeners.forEach((l) => l());

export const setSharedLayout = (kind: LayoutKind, layout: ObjectLayout) => {
  stores[kind].layout = layout;
  emit(kind);
};

export const refreshLayout = (kind: LayoutKind): Promise<void> => {
  const s = stores[kind];
  s.inflight ??= getObjectLayout(kind)
    .then((layout) => setSharedLayout(kind, layout))
    .catch(() => {
      /* dernière valeur conservée (catalogue complet si jamais lue) */
    })
    .finally(() => {
      s.inflight = null;
    });
  return s.inflight;
};

export function useObjectLayout(kind: LayoutKind) {
  const s = stores[kind];
  const subscribe = (l: () => void) => {
    s.listeners.add(l);
    return () => {
      s.listeners.delete(l);
    };
  };
  const layout = useSyncExternalStore(subscribe, () => s.layout);
  useEffect(() => {
    void refreshLayout(kind);
  }, [kind]);
  const effective = useMemo(() => effectiveLayout(kind, layout), [kind, layout]);
  return { layout, effective };
}
