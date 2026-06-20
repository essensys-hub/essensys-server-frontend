import type { ScheduleConsigne } from './constants';
import { DAY_LABELS, HOURS } from './constants';

export type ScheduleGrid = ScheduleConsigne[][];

export const emptyScheduleGrid = (): ScheduleGrid =>
  DAY_LABELS.map(() => HOURS.map(() => 1 as ScheduleConsigne));

const clampConsigne = (n: number): ScheduleConsigne => {
  if (n < 0) return 0;
  if (n > 5) return 5;
  return n as ScheduleConsigne;
};

/** Lit la consigne d'une heure depuis l'indice linéaire (jour×24+heure). */
export const consigneAt = (grid: ScheduleGrid, day: number, hour: number): ScheduleConsigne =>
  grid[day]?.[hour] ?? 1;

/** Décode un octet planning : heure paire = bits 0-3, impaire = bits 4-7. */
export const decodePlanningByte = (byteVal: number): [ScheduleConsigne, ScheduleConsigne] => {
  const even = clampConsigne(byteVal & 0x07);
  const odd = clampConsigne((byteVal >> 4) & 0x07);
  return [even, odd];
};

/** Encode deux créneaux horaires dans un octet table d'échange. */
export const encodePlanningByte = (even: ScheduleConsigne, odd: ScheduleConsigne): number =>
  (even & 0x07) | ((odd & 0x07) << 4);

/** Grille 7×24 depuis les 84 octets de la table d'échange. */
export const gridFromExchange = (
  values: Record<number, string>,
  startIndex: number,
  byteCount: number,
): ScheduleGrid => {
  const grid = emptyScheduleGrid();
  for (let byteIndex = 0; byteIndex < byteCount; byteIndex++) {
    const linear = byteIndex * 2;
    const day = Math.floor(linear / 24);
    const hour = linear % 24;
    if (day >= 7) break;
    const key = startIndex + byteIndex;
    const raw = parseInt(values[key] ?? '17', 10);
    const byteVal = Number.isNaN(raw) ? 0x11 : raw;
    grid[day][hour] = clampConsigne(byteVal & 0x07);
    if (hour + 1 < 24) {
      grid[day][hour + 1] = clampConsigne((byteVal >> 4) & 0x07);
    }
  }
  return grid;
};

/** Liste des injections k/v pour les octets modifiés uniquement. */
export const diffScheduleInjections = (
  grid: ScheduleGrid,
  baseline: ScheduleGrid,
  startIndex: number,
  byteCount: number,
): Array<{ k: number; v: string }> => {
  const items: Array<{ k: number; v: string }> = [];
  for (let byteIndex = 0; byteIndex < byteCount; byteIndex++) {
    const linear = byteIndex * 2;
    const day = Math.floor(linear / 24);
    const hour = linear % 24;
    const even = consigneAt(grid, day, hour);
    const odd = consigneAt(grid, day, hour + 1);
    const baseEven = consigneAt(baseline, day, hour);
    const baseOdd = consigneAt(baseline, day, hour + 1);
    if (even !== baseEven || odd !== baseOdd) {
      items.push({ k: startIndex + byteIndex, v: String(encodePlanningByte(even, odd)) });
    }
  }
  return items;
};

export const copyDayToAll = (grid: ScheduleGrid, sourceDay: number): ScheduleGrid =>
  grid.map((row, day) => (day === sourceDay ? row : [...grid[sourceDay]]));

export const gridsEqual = (a: ScheduleGrid, b: ScheduleGrid): boolean =>
  a.every((row, d) => row.every((v, h) => v === b[d][h]));
