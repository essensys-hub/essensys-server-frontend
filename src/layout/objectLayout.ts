/**
 * Disposition des lumières et des volets (affichage-objets-2026-11-006) : objets désactivés et ordre d'affichage.
 *
 * Contrat (portail local) : GET /api/{lights|shutters}/layout -> {"order":[…],"disabled":[…],"version":n,"updated_at":…} ;
 * PUT /api/admin/{lights|shutters}/layout body {"order":[…],"disabled":[…]} ou {"reset":true}.
 * Règle commune aux quatre clients : `order` d'abord, puis les identifiants connus absents dans l'ordre du catalogue ;
 * les identifiants inconnus sont ignorés. Verrouillé par NR-server-frontend-10.
 */
import { LIGHT_NAME_CATALOG } from '../lights/lightNames';
import { SHUTTER_NAME_CATALOG } from '../shutters/shutterNames';

export type LayoutKind = 'lights' | 'shutters';
export type LayoutGroup = 'MAIN' | 'INDIRECT' | 'SPECIAL';
export type LayoutWriteStatus = 'saved' | 'dry_run';

export interface ObjectLayout {
  order: string[];
  disabled: string[];
  version: number;
  updated_at: string | null;
}

/** Disposition par défaut : ordre du catalogue, rien de désactivé. */
export const DEFAULT_LAYOUT: ObjectLayout = { order: [], disabled: [], version: 0, updated_at: null };

export interface CatalogueEntry {
  id: string;
  group: LayoutGroup;
}

/** Lumières : 21 principales (MAIN) puis 12 indirectes. Volets : 14 volets (MAIN) puis 2 éléments spéciaux. */
const MAIN_LIGHTS = 21;
const MAIN_SHUTTERS = 14;

export const CATALOGUES: Record<LayoutKind, ReadonlyArray<CatalogueEntry>> = {
  lights: LIGHT_NAME_CATALOG.map(([id], i) => ({ id, group: i < MAIN_LIGHTS ? 'MAIN' : 'INDIRECT' })),
  shutters: SHUTTER_NAME_CATALOG.map(([id], i) => ({ id, group: i < MAIN_SHUTTERS ? 'MAIN' : 'SPECIAL' })),
};

export const groupOf = (kind: LayoutKind, id: string): LayoutGroup | undefined =>
  CATALOGUES[kind].find((c) => c.id === id)?.group;

const strings = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);

/** Lecture tolérante d'un document du serveur (updated_by n'est jamais conservé). */
export const parseLayout = (raw: unknown): ObjectLayout => {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_LAYOUT;
  const r = raw as Record<string, unknown>;
  return {
    order: strings(r.order),
    disabled: strings(r.disabled),
    version: typeof r.version === 'number' ? r.version : 0,
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : null,
  };
};

export interface EffectiveLayout {
  /** Tous les identifiants du catalogue, dans l'ordre effectif. */
  ordered: string[];
  /** Identifiants désactivés (inconnus ignorés). */
  disabled: string[];
}

export const effectiveLayout = (kind: LayoutKind, layout: ObjectLayout): EffectiveLayout => {
  const known = new Set(CATALOGUES[kind].map((c) => c.id));
  const ordered: string[] = [];
  for (const id of layout.order) if (known.has(id) && !ordered.includes(id)) ordered.push(id);
  for (const c of CATALOGUES[kind]) if (!ordered.includes(c.id)) ordered.push(c.id);
  const disabled = [...new Set(layout.disabled)].filter((id) => known.has(id));
  return { ordered, disabled };
};

/** Éléments d'un groupe (ou d'un écran sans groupe) : activés seulement, dans l'ordre effectif. */
export const layoutItems = <T extends { id: string }>(kind: LayoutKind, items: ReadonlyArray<T>, layout: ObjectLayout): T[] => {
  const eff = effectiveLayout(kind, layout);
  const rank = new Map(eff.ordered.map((id, i) => [id, i]));
  return items
    .filter((it) => rank.has(it.id) && !eff.disabled.includes(it.id))
    .sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
};

/** Monte ou descend un élément : échange avec son voisin du même groupe dans l'ordre global. */
export const moveInGroup = (kind: LayoutKind, ordered: ReadonlyArray<string>, id: string, dir: 'up' | 'down'): string[] => {
  const next = [...ordered];
  const from = next.indexOf(id);
  const group = groupOf(kind, id);
  if (from < 0 || !group) return next;
  const step = dir === 'up' ? -1 : 1;
  for (let i = from + step; i >= 0 && i < next.length; i += step) {
    if (groupOf(kind, next[i]) === group) {
      [next[from], next[i]] = [next[i], next[from]];
      break;
    }
  }
  return next;
};

/** Corps d'écriture : order complet et disabled, ou {"reset":true}. */
export const buildWrite = (
  ordered: ReadonlyArray<string>,
  disabled: ReadonlyArray<string>,
  reset: boolean,
): { order: string[]; disabled: string[] } | { reset: true } =>
  reset ? { reset: true } : { order: [...ordered], disabled: [...disabled] };
