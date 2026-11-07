/**
 * Logique pure des temporisations (lumieres-temporisees-2026-11-003) : catalogue, raccourcis,
 * validation de la valeur libre, formatage. Aucun navigateur, aucune requête.
 * NR: NR-server-frontend-7 essensys-hub/essensys-server-frontend#10
 */
import { test, expect } from '@playwright/test';
import {
  LIGHT_TIMERS,
  TIMER_SHORTCUTS,
  formatMinutes,
  isLightTimerId,
  isValidMinutes,
  parseCustomMinutes,
} from '../../src/lights/lightTimers';

test.describe('logique des temporisations', () => {
  test('@nr NR-server-frontend-7 catalogue : six lumieres, cles 521 555 556 557 561 562 dans l ordre', () => {
    expect(LIGHT_TIMERS.map((t) => [t.id, t.label, t.key])).toEqual([
      ['dressing', 'Dressing', 521],
      ['wc1', 'WC 1', 555],
      ['wc2', 'WC 2', 556],
      ['pieceserv', 'Service', 557],
      ['ann1', 'Annexe 1', 561],
      ['ann2', 'Annexe 2', 562],
    ]);
    expect(isLightTimerId('dressing')).toBe(true);
    expect(isLightTimerId('salon')).toBe(false);
  });

  test('@nr NR-server-frontend-7 raccourcis 15 30 60 et 0 Jamais', () => {
    expect(TIMER_SHORTCUTS.map((s) => [s.minutes, s.label])).toEqual([
      [15, '15 min'],
      [30, '30 min'],
      [60, '1 h'],
      [0, 'Jamais'],
    ]);
  });

  test('@nr NR-server-frontend-7 valeur libre : entier de 1 a 255 seulement', () => {
    for (const ok of ['1', '7', ' 42 ', '255']) {
      expect(parseCustomMinutes(ok)).toEqual({ ok: true, minutes: Number(ok.trim()) });
    }
    for (const bad of ['0', '256', '300', '-1', '7.5', '', 'abc', '1e2', '0x10']) {
      expect(parseCustomMinutes(bad).ok, bad).toBe(false);
    }
  });

  test('@nr NR-server-frontend-7 valeur serveur : 0 a 255 entier', () => {
    expect([0, 1, 255].every(isValidMinutes)).toBe(true);
    expect([-1, 256, 7.5, NaN, null, '7'].some(isValidMinutes)).toBe(false);
  });

  test('@nr NR-server-frontend-7 formatage : 7 min, 1 h, Jamais, inconnue', () => {
    expect(formatMinutes(7)).toBe('7 min');
    expect(formatMinutes(15)).toBe('15 min');
    expect(formatMinutes(60)).toBe('1 h');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(90)).toBe('90 min');
    expect(formatMinutes(0)).toBe('Jamais');
    expect(formatMinutes(null)).toBe('inconnue');
    expect(formatMinutes(undefined)).toBe('inconnue');
  });
});
