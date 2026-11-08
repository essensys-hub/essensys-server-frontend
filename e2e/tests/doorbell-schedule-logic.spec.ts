/**
 * Logique pure des plages horaires de la sonnette (sonnette-plages-push-2026-11-008).
 * NR: NR-server-frontend-12 essensys-hub/essensys-feature-lifecycle#61
 */
import { test, expect } from '@playwright/test';
import {
  DEFAULT_SCHEDULE, INVALID_SCHEDULE_MESSAGE, activePreset, applyPreset, cellLabel, currentCell, emptyGrid, fullGrid, isCellOn,
  isInWindow, neverActive, paintRect, parseSchedule, sameSchedule, setCell, timezoneChoices, validateSchedule,
} from '../../src/doorbell/doorbellSchedule';
import { DEFAULT_SETTINGS, buildSettingsWrite, doorbellErrorMessage, parseSettings, sameDoorbellSettings } from '../../src/doorbell/doorbell';

test.describe('logique des plages horaires de la sonnette', () => {
  test('@nr NR-server-frontend-12 défaut : toujours actif, Europe/Paris, grille pleine ; champ absent (ancienne gateway) = défaut', () => {
    expect(DEFAULT_SCHEDULE).toEqual({ mode: 'always', timezone: 'Europe/Paris', grid: Array(7).fill('1'.repeat(24)) });
    expect(parseSchedule(undefined)).toEqual(DEFAULT_SCHEDULE);
    expect(parseSchedule('x')).toEqual(DEFAULT_SCHEDULE);
    expect(parseSchedule({ mode: 'custom', timezone: '', grid: ['0'] })).toEqual({ ...DEFAULT_SCHEDULE, mode: 'custom' });
    expect(parseSettings({ enabled: true }).schedule).toEqual(DEFAULT_SCHEDULE);
  });

  test('@nr NR-server-frontend-12 lecture d une plage personnalisée, copie indépendante', () => {
    const grid = emptyGrid();
    grid[1] = '000000011111111111111100';
    const s = parseSchedule({ mode: 'custom', timezone: 'Europe/Brussels', grid });
    expect(s).toEqual({ mode: 'custom', timezone: 'Europe/Brussels', grid });
    grid[0] = '1'.repeat(24);
    expect(s.grid[0]).toBe('0'.repeat(24));
  });

  test('@nr NR-server-frontend-12 lundi en premier, caractère h = heure h à h+1', () => {
    const s = parseSchedule({ mode: 'custom', timezone: 'Europe/Paris', grid: ['100000000000000000000001', ...emptyGrid().slice(1)] });
    expect(isCellOn(s, 0, 0)).toBe(true);
    expect(isCellOn(s, 0, 23)).toBe(true);
    expect(isCellOn(s, 0, 1)).toBe(false);
    expect(isCellOn(s, 6, 0)).toBe(false);
    expect(cellLabel(s, 1, 14)).toBe('mardi de 14 h à 15 h : inactive');
    expect(cellLabel(s, 0, 23)).toBe('lundi de 23 h à 0 h : active');
  });

  test('@nr NR-server-frontend-12 modifier une case depuis « Toujours » passe en personnalisé', () => {
    const s = setCell(DEFAULT_SCHEDULE, 2, 5, false);
    expect(s.mode).toBe('custom');
    expect(isCellOn(s, 2, 5)).toBe(false);
    expect(isCellOn(s, 2, 6)).toBe(true);
    expect(DEFAULT_SCHEDULE.grid[2][5]).toBe('1'); // l objet d origine n est pas modifié
    expect(setCell(s, 2, 5, false)).toBe(s);
    expect(setCell(s, 9, 0, true)).toBe(s);
    expect(setCell(s, 0, 24, true)).toBe(s);
  });

  test('@nr NR-server-frontend-12 glisser : rectangle entre deux cases, dans les deux sens', () => {
    const base = applyPreset(DEFAULT_SCHEDULE, 'never');
    const s = paintRect(base, { day: 1, hour: 14 }, { day: 2, hour: 16 }, true);
    for (const d of [1, 2]) for (const h of [14, 15, 16]) expect(isCellOn(s, d, h)).toBe(true);
    expect(isCellOn(s, 0, 14)).toBe(false);
    expect(isCellOn(s, 1, 13)).toBe(false);
    expect(isCellOn(s, 3, 14)).toBe(false);
    expect(paintRect(base, { day: 2, hour: 16 }, { day: 1, hour: 14 }, true).grid).toEqual(s.grid);
    // le glisser repart de la grille d origine : revenir en arrière retire les cases
    expect(paintRect(base, { day: 1, hour: 14 }, { day: 1, hour: 14 }, true).grid.join('').split('1').length - 1).toBe(1);
  });

  test('@nr NR-server-frontend-12 présélections Toujours, Jour seulement 7 h-22 h, Jamais', () => {
    const custom = setCell(DEFAULT_SCHEDULE, 0, 0, false);
    expect(applyPreset(custom, 'always')).toEqual({ ...DEFAULT_SCHEDULE, timezone: custom.timezone });
    const day = applyPreset(DEFAULT_SCHEDULE, 'day');
    expect(day.mode).toBe('custom');
    expect(day.grid[3]).toBe('0000000' + '1'.repeat(15) + '00');
    expect(isCellOn(day, 3, 6)).toBe(false);
    expect(isCellOn(day, 3, 7)).toBe(true);
    expect(isCellOn(day, 3, 21)).toBe(true);
    expect(isCellOn(day, 3, 22)).toBe(false);
    const never = applyPreset(DEFAULT_SCHEDULE, 'never');
    expect(never).toEqual({ mode: 'custom', timezone: 'Europe/Paris', grid: emptyGrid() });
    expect(neverActive(never)).toBe(true);
    expect(neverActive(day)).toBe(false);
    expect(neverActive(DEFAULT_SCHEDULE)).toBe(false);
    expect([activePreset(DEFAULT_SCHEDULE), activePreset(day), activePreset(never), activePreset(setCell(day, 0, 3, true))])
      .toEqual(['always', 'day', 'never', null]);
    expect(applyPreset({ ...DEFAULT_SCHEDULE, timezone: 'Europe/Brussels' }, 'day').timezone).toBe('Europe/Brussels');
  });

  test('@nr NR-server-frontend-12 validation locale : mode, fuseau, grille de 7 x 24', () => {
    expect(validateSchedule(DEFAULT_SCHEDULE)).toBeNull();
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, timezone: ' ' })).toMatch(/Fuseau/);
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, grid: fullGrid().slice(1) })).toMatch(/Grille/);
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, grid: [...fullGrid().slice(1), '1'.repeat(23)] })).toMatch(/Grille/);
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, grid: [...fullGrid().slice(1), '2'.repeat(24)] })).toMatch(/Grille/);
    expect(validateSchedule({ ...DEFAULT_SCHEDULE, mode: 'parfois' as never })).toMatch(/Mode/);
  });

  test('@nr NR-server-frontend-12 case actuelle selon le fuseau, heure d été comprise', () => {
    // mardi 2026-11-10 13:05 UTC = 14:05 à Paris (heure d hiver), 08:05 à New York
    const at = Date.parse('2026-11-10T13:05:00Z');
    expect(currentCell(at, 'Europe/Paris')).toEqual({ day: 1, hour: 14, clock: '14:05' });
    expect(currentCell(at, 'America/New_York')).toEqual({ day: 1, hour: 8, clock: '08:05' });
    // dimanche 29 mars 2026, 01:30 UTC = 03:30 à Paris (passage à l heure d été) : pas de décalage d une heure
    expect(currentCell(Date.parse('2026-03-29T01:30:00Z'), 'Europe/Paris')).toEqual({ day: 6, hour: 3, clock: '03:30' });
    // minuit : l heure vaut 0, pas 24
    expect(currentCell(Date.parse('2026-11-09T23:30:00Z'), 'Europe/Paris')?.hour).toBe(0);
    expect(currentCell(at, 'Mars/Olympus')).toBeNull();
  });

  test('@nr NR-server-frontend-12 dans la plage : évaluation comme la gateway', () => {
    const at = Date.parse('2026-11-10T13:05:00Z'); // mardi 14 h 05 à Paris
    const tue14 = setCell(applyPreset(DEFAULT_SCHEDULE, 'never'), 1, 14, true);
    expect(isInWindow(tue14, at)).toBe(true);
    expect(isInWindow(tue14, Date.parse('2026-11-10T02:10:00Z'))).toBe(false);
    expect(isInWindow(applyPreset(DEFAULT_SCHEDULE, 'never'), at)).toBe(false);
    expect(isInWindow(DEFAULT_SCHEDULE, at)).toBe(true);
    expect(isInWindow({ ...tue14, timezone: 'Mars/Olympus' }, at)).toBe(true);
  });

  test('@nr NR-server-frontend-12 le PUT porte la plage, la comparaison la voit, invalid_schedule en français', () => {
    const custom = { ...DEFAULT_SETTINGS, schedule: applyPreset(DEFAULT_SCHEDULE, 'day') };
    expect(buildSettingsWrite(custom).schedule).toEqual(custom.schedule);
    expect(buildSettingsWrite(custom).schedule).not.toBe(custom.schedule);
    expect(sameDoorbellSettings(DEFAULT_SETTINGS, custom)).toBe(false);
    expect(sameDoorbellSettings(custom, { ...custom, schedule: { ...custom.schedule, timezone: 'Europe/Brussels' } })).toBe(false);
    expect(sameDoorbellSettings(custom, { ...custom, version: 9, updated_at: 'x' })).toBe(true);
    expect(sameSchedule(custom.schedule, applyPreset(DEFAULT_SCHEDULE, 'day'))).toBe(true);
    expect(doorbellErrorMessage(400, 'invalid_schedule')).toBe(INVALID_SCHEDULE_MESSAGE);
    expect(INVALID_SCHEDULE_MESSAGE).toMatch(/Plage horaire refusée/);
  });

  test('@nr NR-server-frontend-12 fuseaux proposés : le fuseau courant y figure toujours', () => {
    expect(timezoneChoices('Europe/Paris')).toContain('Europe/Paris');
    expect(timezoneChoices('Pacific/Mars')[0]).toBe('Pacific/Mars');
  });
});
