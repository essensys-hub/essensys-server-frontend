/**
 * Logique pure des noms de lumières (noms-lumieres-2026-11-004) : catalogue, nom affiché, validation.
 * NR: NR-server-frontend-8 essensys-hub/essensys-feature-lifecycle#41
 */
import { test, expect } from '@playwright/test';
import { LIGHT_NAME_CATALOG, displayLightName, parseLightName, type LightNameValue } from '../../src/lights/lightNames';

const entry = (id: string, def: string, name: string | null): LightNameValue => ({
  id, default: def, name, version: name ? 1 : 0, updated_at: name ? '2026-11-07T10:15:30.123Z' : null,
});

test.describe('logique des noms de lumières', () => {
  test('@nr NR-server-frontend-8 catalogue : 33 lumieres, ids uniques, dressing et idressing', () => {
    expect(LIGHT_NAME_CATALOG).toHaveLength(33);
    expect(new Set(LIGHT_NAME_CATALOG.map(([id]) => id)).size).toBe(33);
    expect(LIGHT_NAME_CATALOG[0]).toEqual(['terrasse', 'Terrasse']);
    expect(LIGHT_NAME_CATALOG[20]).toEqual(['dressing', 'Dressing']);
    expect(LIGHT_NAME_CATALOG[32]).toEqual(['idressing', 'Dressing (placards)']);
  });

  test('@nr NR-server-frontend-8 nom affiche : personnalise sinon origine, origine si lecture impossible', () => {
    const names = [entry('dressing', 'Dressing', 'WC 3'), entry('wc1', 'WC 1', null)];
    expect(displayLightName('dressing', names)).toBe('WC 3');
    expect(displayLightName('wc1', names)).toBe('WC 1');
    expect(displayLightName('salon', [])).toBe('Salon');
    expect(displayLightName('inconnue', [], 'Repli')).toBe('Repli');
  });

  test('@nr NR-server-frontend-8 nom contenant du HTML ou &: conserve tel quel (texte brut)', () => {
    expect(displayLightName('salon', [entry('salon', 'Salon', 'a&b "x"')])).toBe('a&b "x"');
  });

  test('@nr NR-server-frontend-8 validation : 1 a 40 caracteres, sans controle ni < >', () => {
    expect(parseLightName('  WC 3  ')).toEqual({ ok: true, name: 'WC 3' });
    expect(parseLightName('é'.repeat(40)).ok).toBe(true);
    for (const bad of ['', '   ', 'x'.repeat(41), 'a<b', 'a>b', 'a\u0007b', 'a\nb']) {
      expect(parseLightName(bad).ok, JSON.stringify(bad)).toBe(false);
    }
  });
});
