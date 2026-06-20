/** Consignes planning chauffage (nibble 0–3, masque 0x07) — firmware SC944D Chauffage.c */
export type ScheduleConsigne = 0 | 1 | 2 | 3 | 4 | 5;

export interface ScheduleModeDef {
  value: ScheduleConsigne;
  label: string;
  shortLabel: string;
  cellClass: string;
  legendClass: string;
}

/** Couleurs alignées sur l'écran physique SC945D / vd_CalculerEtatConsigne */
export const SCHEDULE_MODES: ScheduleModeDef[] = [
  { value: 1, label: 'Confort', shortLabel: 'C', cellClass: 'bg-red-500 hover:bg-red-600', legendClass: 'bg-red-500' },
  { value: 2, label: 'Eco', shortLabel: 'E', cellClass: 'bg-orange-500 hover:bg-orange-600', legendClass: 'bg-orange-500' },
  { value: 3, label: 'Eco+', shortLabel: 'E+', cellClass: 'bg-yellow-400 hover:bg-yellow-500', legendClass: 'bg-yellow-400' },
  { value: 4, label: 'Eco++', shortLabel: 'E++', cellClass: 'bg-cyan-400 hover:bg-cyan-500', legendClass: 'bg-cyan-400' },
  { value: 0, label: 'OFF', shortLabel: '—', cellClass: 'bg-slate-500 hover:bg-slate-600', legendClass: 'bg-slate-500' },
];

export const SCHEDULE_MODE_MAP = Object.fromEntries(
  SCHEDULE_MODES.map((m) => [m.value, m]),
) as Record<ScheduleConsigne, ScheduleModeDef>;

export const DAY_LABELS = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'] as const;
export const HOURS = Array.from({ length: 24 }, (_, i) => i);

export interface HeatingModeOption {
  value: string;
  label: string;
}

export interface HeatingZoneConfig {
  id: string;
  name: string;
  scheduleTitle: string;
  modeIndex: number;
  scheduleStartIndex: number;
  scheduleByteCount: number;
  immediateModes: HeatingModeOption[];
}

const standardImmediate: HeatingModeOption[] = [
  { value: '1', label: 'Automatique (planning)' },
  { value: '32', label: 'Anticipé' },
  { value: '17', label: 'Forçage confort' },
  { value: '18', label: 'Forçage éco' },
  { value: '19', label: 'Forçage éco+' },
  { value: '20', label: 'Forçage éco++' },
  { value: '21', label: 'Forçage hors gel' },
  { value: '16', label: 'OFF' },
];

const sdbImmediate: HeatingModeOption[] = standardImmediate.filter((m) => m.value !== '32');

/** Indices firmware TableEchange.h — 099-37 */
export const HEATING_ZONES: HeatingZoneConfig[] = [
  {
    id: 'zj',
    name: 'Zone Jour',
    scheduleTitle: 'Réglage chauffage auto — Zone Jour',
    modeIndex: 349,
    scheduleStartIndex: 13,
    scheduleByteCount: 84,
    immediateModes: standardImmediate,
  },
  {
    id: 'zn',
    name: 'Zone Nuit',
    scheduleTitle: 'Réglage chauffage auto — Zone Nuit',
    modeIndex: 350,
    scheduleStartIndex: 97,
    scheduleByteCount: 84,
    immediateModes: standardImmediate,
  },
  {
    id: 'sdb1',
    name: 'Salle de bain 1',
    scheduleTitle: 'Réglage chauffage auto — Salle de bain 1',
    modeIndex: 351,
    scheduleStartIndex: 181,
    scheduleByteCount: 84,
    immediateModes: sdbImmediate,
  },
  {
    id: 'sdb2',
    name: 'Salle de bain 2',
    scheduleTitle: 'Réglage chauffage auto — Salle de bain 2',
    modeIndex: 352,
    scheduleStartIndex: 265,
    scheduleByteCount: 84,
    immediateModes: sdbImmediate,
  },
];

export const scheduleKeyRange = (zone: HeatingZoneConfig): number[] =>
  Array.from({ length: zone.scheduleByteCount }, (_, i) => zone.scheduleStartIndex + i);
