/**
 * Temporisations des lumières (lumieres-temporisees-2026-11-003).
 *
 * Six lumières ont un délai d'extinction réglable (octet de la table d'échange, 1 à 255 minutes,
 * 0 = jamais). Le serveur renvoie le catalogue complet ; seuls les libellés sont dupliqués ici.
 * Contrat : GET /api/admin/lights/timers, PUT /api/admin/lights/timers/{id} body {"minutes": n}.
 * Verrouillé par NR-server-frontend-7.
 */
export type LightTimerId = 'dressing' | 'wc1' | 'wc2' | 'pieceserv' | 'ann1' | 'ann2';

export interface LightTimerEntry {
  id: LightTimerId;
  label: string;
  /** Indice de la table d'échange (information : le serveur fait foi). */
  key: number;
}

/** Ordre fixe du catalogue. */
export const LIGHT_TIMERS: readonly LightTimerEntry[] = [
  { id: 'dressing', label: 'Dressing', key: 521 },
  { id: 'wc1', label: 'WC 1', key: 555 },
  { id: 'wc2', label: 'WC 2', key: 556 },
  { id: 'pieceserv', label: 'Service', key: 557 },
  { id: 'ann1', label: 'Annexe 1', key: 561 },
  { id: 'ann2', label: 'Annexe 2', key: 562 },
];

export const isLightTimerId = (id: string): id is LightTimerId => LIGHT_TIMERS.some((t) => t.id === id);

export const lightTimerLabel = (id: string): string => LIGHT_TIMERS.find((t) => t.id === id)?.label ?? id;

export const MIN_CUSTOM_MINUTES = 1;
export const MAX_CUSTOM_MINUTES = 255;

/** Raccourcis proposés ; 0 = « Jamais » (la lumière reste allumée). */
export const TIMER_SHORTCUTS: ReadonlyArray<{ minutes: number; label: string }> = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 60, label: '1 h' },
  { minutes: 0, label: 'Jamais' },
];

/** Valeur côté serveur : entier de 0 à 255. */
export const isValidMinutes = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= MAX_CUSTOM_MINUTES;

export type CustomMinutesResult = { ok: true; minutes: number } | { ok: false; error: string };

/** Valide la saisie libre : entier de 1 à 255 (0 se choisit par « Jamais »). */
export const parseCustomMinutes = (input: string): CustomMinutesResult => {
  const text = input.trim();
  if (!/^\d+$/.test(text)) {
    return { ok: false, error: `Saisissez un nombre entier de minutes, de ${MIN_CUSTOM_MINUTES} à ${MAX_CUSTOM_MINUTES}.` };
  }
  const minutes = Number(text);
  if (minutes < MIN_CUSTOM_MINUTES || minutes > MAX_CUSTOM_MINUTES) {
    return {
      ok: false,
      error: `Valeur refusée : de ${MIN_CUSTOM_MINUTES} à ${MAX_CUSTOM_MINUTES} minutes (utilisez « Jamais » pour ne pas éteindre).`,
    };
  }
  return { ok: true, minutes };
};

/** « 7 min », « 1 h », « Jamais », « inconnue » (valeur jamais lue, jamais 0 par défaut). */
export const formatMinutes = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined || !isValidMinutes(minutes)) return 'inconnue';
  if (minutes === 0) return 'Jamais';
  if (minutes % 60 === 0) return `${minutes / 60} h`;
  return `${minutes} min`;
};

export interface LightTimerValue {
  id: LightTimerId;
  label: string;
  key: number;
  minutes: number | null;
}

export type LightTimerWriteStatus = 'queued' | 'dry_run';

/** Relectures après une écriture (l'armoire applique sous ~5 s). */
export const RECHECK_DELAYS_MS = [5000, 10000, 20000] as const;
