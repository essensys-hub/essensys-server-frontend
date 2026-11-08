/**
 * Plages horaires de la sonnette (sonnette-plages-push-2026-11-008).
 *
 * Contrat (portail local) : `schedule` dans GET/PUT /api/admin/doorbell/settings
 * {"mode":"always"|"custom","timezone":"Europe/Paris","grid":["<24 caractères 0/1>" x 7]} ; grid[0] = lundi,
 * le caractère h = heure locale h à h+1, 1 = active. Erreur 400 invalid_schedule.
 * `in_window` dans GET /api/doorbell/status. Verrouillé par NR-server-frontend-12.
 */

export type ScheduleMode = 'always' | 'custom';

export interface DoorbellSchedule {
  mode: ScheduleMode;
  timezone: string;
  grid: string[];
}

export const DEFAULT_TIMEZONE = 'Europe/Paris';
export const DAYS = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'] as const;
export const DAY_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;
export const HOURS = 24;

const ALL_ON = '1'.repeat(HOURS);
const ALL_OFF = '0'.repeat(HOURS);

export const fullGrid = (): string[] => DAYS.map(() => ALL_ON);
export const emptyGrid = (): string[] => DAYS.map(() => ALL_OFF);

export const DEFAULT_SCHEDULE: DoorbellSchedule = { mode: 'always', timezone: DEFAULT_TIMEZONE, grid: fullGrid() };

export const isValidGrid = (grid: unknown): grid is string[] =>
  Array.isArray(grid) && grid.length === DAYS.length && grid.every((r) => typeof r === 'string' && /^[01]{24}$/.test(r));

/** Lecture tolérante : champ absent (ancienne gateway) ou illisible = toujours actif. */
export const parseSchedule = (raw: unknown): DoorbellSchedule => {
  if (typeof raw !== 'object' || raw === null) return { ...DEFAULT_SCHEDULE, grid: fullGrid() };
  const r = raw as Record<string, unknown>;
  const mode: ScheduleMode = r.mode === 'custom' ? 'custom' : 'always';
  const timezone = typeof r.timezone === 'string' && r.timezone !== '' ? r.timezone : DEFAULT_TIMEZONE;
  return { mode, timezone, grid: isValidGrid(r.grid) ? [...r.grid] : fullGrid() };
};

export const cloneSchedule = (s: DoorbellSchedule): DoorbellSchedule => ({ ...s, grid: [...s.grid] });

export const sameSchedule = (a: DoorbellSchedule, b: DoorbellSchedule): boolean =>
  a.mode === b.mode && a.timezone === b.timezone && a.grid.every((r, i) => r === b.grid[i]);

export const isCellOn = (s: DoorbellSchedule, day: number, hour: number): boolean => s.grid[day]?.[hour] === '1';

/** Case modifiée. Depuis « Toujours », la première modification passe en mode personnalisé. */
export const setCell = (s: DoorbellSchedule, day: number, hour: number, on: boolean): DoorbellSchedule => {
  if (day < 0 || day >= DAYS.length || hour < 0 || hour >= HOURS) return s;
  if (s.mode === 'custom' && isCellOn(s, day, hour) === on) return s;
  const grid = [...s.grid];
  grid[day] = grid[day].slice(0, hour) + (on ? '1' : '0') + grid[day].slice(hour + 1);
  return { ...s, mode: 'custom', grid };
};

/** Peinture par glisser : toutes les cases du rectangle entre deux cases (bornes comprises). */
export const paintRect = (
  s: DoorbellSchedule, from: { day: number; hour: number }, to: { day: number; hour: number }, on: boolean,
): DoorbellSchedule => {
  let next = s;
  for (let d = Math.min(from.day, to.day); d <= Math.max(from.day, to.day); d++) {
    for (let h = Math.min(from.hour, to.hour); h <= Math.max(from.hour, to.hour); h++) next = setCell(next, d, h, on);
  }
  return next;
};

export type PresetId = 'always' | 'day' | 'never';
export const PRESETS: ReadonlyArray<{ id: PresetId; label: string }> = [
  { id: 'always', label: 'Toujours' },
  { id: 'day', label: 'Jour seulement 7 h-22 h' },
  { id: 'never', label: 'Jamais' },
];
/** Jour seulement : de 7 h à 22 h (caractères 7 à 21). */
export const DAY_FIRST_HOUR = 7;
export const DAY_END_HOUR = 22;

export const applyPreset = (s: DoorbellSchedule, id: PresetId): DoorbellSchedule => {
  if (id === 'always') return { ...s, mode: 'always', grid: fullGrid() };
  if (id === 'never') return { ...s, mode: 'custom', grid: emptyGrid() };
  const row = ALL_OFF.slice(0, DAY_FIRST_HOUR) + '1'.repeat(DAY_END_HOUR - DAY_FIRST_HOUR) + ALL_OFF.slice(DAY_END_HOUR);
  return { ...s, mode: 'custom', grid: DAYS.map(() => row) };
};

/** Présélection correspondant à la plage, ou null pour une plage personnalisée. */
export const activePreset = (s: DoorbellSchedule): PresetId | null => {
  if (s.mode === 'always') return 'always';
  for (const p of ['day', 'never'] as const) {
    if (sameSchedule({ ...s, ...applyPreset(s, p) }, s)) return p;
  }
  return null;
};

/** Mode personnalisé sans aucune case active : la sonnette ne réagit jamais (valide, signalé). */
export const neverActive = (s: DoorbellSchedule): boolean => s.mode === 'custom' && s.grid.every((r) => !r.includes('1'));

export const validateSchedule = (s: DoorbellSchedule): string | null => {
  if (s.mode !== 'always' && s.mode !== 'custom') return 'Mode de plage inconnu';
  if (s.timezone.trim() === '') return 'Fuseau horaire manquant';
  if (!isValidGrid(s.grid)) return 'Grille invalide : 7 jours de 24 heures';
  return null;
};

/** Fuseaux proposés : liste du navigateur si disponible, sinon quelques fuseaux courants ; le fuseau courant est toujours présent. */
export const timezoneChoices = (current: string): string[] => {
  let list: string[] = [];
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (k: string) => string[] }).supportedValuesOf;
    if (typeof supported === 'function') list = supported('timeZone');
  } catch { /* navigateur ancien */ }
  if (list.length === 0) {
    list = ['Europe/Paris', 'Europe/Brussels', 'Europe/Zurich', 'Europe/London', 'America/Montreal', 'America/Martinique',
      'Indian/Reunion', 'Pacific/Noumea', 'Pacific/Tahiti', 'UTC'];
  }
  return list.includes(current) ? list : [current, ...list];
};

export interface LocalCell {
  /** 0 = lundi. */
  day: number;
  hour: number;
  /** Heure locale lisible, ex. « 14:05 ». */
  clock: string;
}

/** Case de l'instant `now` dans le fuseau ; null si le fuseau est inconnu du navigateur. */
export const currentCell = (now: number, timezone: string): LocalCell | null => {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
    }).formatToParts(new Date(now));
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    const day = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(get('weekday'));
    const hour = Number(get('hour'));
    if (day < 0 || !Number.isInteger(hour)) return null;
    return { day, hour: hour % 24, clock: `${get('hour')}:${get('minute')}` };
  } catch {
    return null;
  }
};

/** Évalue la plage à l'instant donné (comme la gateway) ; fuseau illisible : actif. */
export const isInWindow = (s: DoorbellSchedule, now: number): boolean => {
  if (s.mode !== 'custom') return true;
  const c = currentCell(now, s.timezone);
  return c === null ? true : isCellOn(s, c.day, c.hour);
};

/** Libellé d'une case : « mardi de 14 h à 15 h : active ». */
export const cellLabel = (s: DoorbellSchedule, day: number, hour: number): string =>
  `${DAYS[day]} de ${hour} h à ${(hour + 1) % 24} h : ${isCellOn(s, day, hour) ? 'active' : 'inactive'}`;

/** Message en français de l'erreur invalid_schedule. */
export const INVALID_SCHEDULE_MESSAGE =
  'Plage horaire refusée par la passerelle (mode, fuseau ou grille de 7 jours de 24 heures invalide)';
