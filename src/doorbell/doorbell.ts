/**
 * Sonnette UniFi (sonnette-unifi-2026-11-007) : état, fenêtre « Quelqu'un sonne » et réglages de l'administrateur.
 *
 * Contrat (portail local) : GET /api/doorbell/status -> {"enabled","available","ringing","ringing_until","last_ring_at"} ;
 * GET /api/doorbell/stream (instantanés, environ une image par seconde) ;
 * GET/PUT /api/admin/doorbell/settings {"enabled","camera_id","lights":[ids],"blinks":1..10} ;
 * POST /api/admin/doorbell/test (essai, en-tête X-Essensys-Test-Mode: dry-run : aucune écriture dans l'armoire).
 * Verrouillé par NR-server-frontend-11.
 */
import { effectiveLayout, type ObjectLayout } from '../layout/objectLayout';

export interface DoorbellStatus {
  enabled: boolean;
  available: boolean;
  ringing: boolean;
  ringing_until: string | null;
  last_ring_at: string | null;
}

export const DEFAULT_STATUS: DoorbellStatus = {
  enabled: false, available: false, ringing: false, ringing_until: null, last_ring_at: null,
};

/** Interrogation de l'état : 2 s tant que la fenêtre est ouverte, 5 s sinon. */
export const POLL_OPEN_MS = 2000;
export const POLL_IDLE_MS = 5000;
export const pollInterval = (windowOpen: boolean): number => (windowOpen ? POLL_OPEN_MS : POLL_IDLE_MS);

export const parseStatus = (raw: unknown): DoorbellStatus => {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_STATUS;
  const r = raw as Record<string, unknown>;
  const text = (v: unknown) => (typeof v === 'string' && v !== '' ? v : null);
  return {
    enabled: r.enabled === true,
    available: r.available === true,
    ringing: r.ringing === true,
    ringing_until: text(r.ringing_until),
    last_ring_at: text(r.last_ring_at),
  };
};

/** Identifie une sonnerie : la fermeture de la fenêtre vaut pour cette sonnerie seulement. */
export const ringKey = (s: DoorbellStatus): string | null => (s.ringing ? (s.last_ring_at ?? s.ringing_until ?? 'ring') : null);

/** Sonnerie en cours, en tenant compte de l'échéance (dernier état conservé après une coupure de lecture). */
export const isRinging = (s: DoorbellStatus, now: number): boolean => {
  if (!s.ringing) return false;
  const until = s.ringing_until ? Date.parse(s.ringing_until) : Number.NaN;
  return Number.isNaN(until) || now <= until;
};

/** Fenêtre visible : fonction activée et disponible, sonnerie en cours, pas déjà fermée pour cette sonnerie. */
export const shouldShowWindow = (s: DoorbellStatus, dismissedKey: string | null, now: number): boolean =>
  s.enabled && s.available && isRinging(s, now) && ringKey(s) !== dismissedKey;

export interface DoorbellSettings {
  enabled: boolean;
  camera_id: string;
  lights: string[];
  blinks: number;
  version: number;
  updated_at: string | null;
}

export const MIN_BLINKS = 1;
export const MAX_BLINKS = 10;

export const DEFAULT_SETTINGS: DoorbellSettings = {
  enabled: false, camera_id: '', lights: [], blinks: 5, version: 0, updated_at: null,
};

/** Lecture tolérante (updated_by n'est jamais conservé). */
export const parseSettings = (raw: unknown): DoorbellSettings => {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_SETTINGS;
  const r = raw as Record<string, unknown>;
  return {
    enabled: r.enabled === true,
    camera_id: typeof r.camera_id === 'string' ? r.camera_id : '',
    lights: Array.isArray(r.lights) ? r.lights.filter((x): x is string => typeof x === 'string') : [],
    blinks: typeof r.blinks === 'number' ? r.blinks : DEFAULT_SETTINGS.blinks,
    version: typeof r.version === 'number' ? r.version : 0,
    updated_at: typeof r.updated_at === 'string' ? r.updated_at : null,
  };
};

export const validateBlinks = (n: number): string | null =>
  Number.isInteger(n) && n >= MIN_BLINKS && n <= MAX_BLINKS ? null : `Nombre de clignotements de ${MIN_BLINKS} à ${MAX_BLINKS}`;

export const buildSettingsWrite = (s: DoorbellSettings) => ({
  enabled: s.enabled, camera_id: s.camera_id, lights: [...s.lights], blinks: s.blinks,
});

export interface SelectableLight {
  id: string;
  label: string;
  /** Lumière masquée par la disposition (#55) mais encore choisie : proposée seulement pour pouvoir la retirer. */
  hidden: boolean;
}

/** Lumières proposées : catalogue dans l'ordre effectif de la disposition, noms personnalisés (#41), masquées (#55) écartées. */
export const selectableLights = (
  layout: ObjectLayout,
  selected: ReadonlyArray<string>,
  nameOf: (id: string) => string,
): SelectableLight[] => {
  const eff = effectiveLayout('lights', layout);
  return eff.ordered
    .filter((id) => !eff.disabled.includes(id) || selected.includes(id))
    .map((id) => ({ id, label: nameOf(id), hidden: eff.disabled.includes(id) }));
};

export const toggleLight = (lights: ReadonlyArray<string>, id: string): string[] =>
  lights.includes(id) ? lights.filter((x) => x !== id) : [...lights, id];

/** Message en français d'une erreur de la gateway sur les réglages ou l'essai. */
export const doorbellErrorMessage = (status: number, code: string | null): string => {
  if (status === 403) return "Réservé à l'administrateur de l'armoire";
  if (code === 'unknown_light') return 'Lumière inconnue de la passerelle';
  if (code === 'unknown_camera') return 'Caméra inconnue de la console UniFi';
  if (code === 'invalid_settings') return 'Réglages refusés par la passerelle (activation, caméra ou lumières manquantes)';
  if (code === 'invalid_blinks') return `Nombre de clignotements refusé (${MIN_BLINKS} à ${MAX_BLINKS})`;
  if (code === 'names_unavailable') return 'Stockage des réglages indisponible sur la passerelle, réessayez plus tard';
  if (code === 'doorbell_unavailable') return 'Sonnette indisponible : console UniFi désactivée ou injoignable';
  return `Opération impossible (${status})`;
};
