/**
 * Logique pure des noms de volets et stores (noms-volets-2026-11-005) : catalogue, nom affiché, validation.
 * NR: NR-server-frontend-9 essensys-hub/essensys-feature-lifecycle#41
 */
import { test, expect } from '@playwright/test';
import { SHUTTER_NAME_CATALOG, displayShutterName, isShutterId, parseShutterName, type ShutterNameValue } from '../../src/shutters/shutterNames';
import { LIGHT_NAME_CATALOG } from '../../src/lights/lightNames';

const entry = (id: string, def: string, name: string | null): ShutterNameValue => ({
  id, default: def, name, version: name ? 1 : 0, updated_at: name ? '2026-11-07T10:15:30.123Z' : null,
});

test.describe('logique des noms de volets', () => {
  test('@nr NR-server-frontend-9 catalogue : 16 identifiants exacts, voletstore garde ses guillemets', () => {
    expect(SHUTTER_NAME_CATALOG.map(([id]) => id)).toEqual([
      'volet1salon', 'volet2salon', 'volet3salon', 'volet1salleamanger', 'volet2salleamanger', 'volet1cuisine',
      'volet2cuisine', 'voletsdb', 'volet1gdchamb', 'volet2gdchamb', 'volet1ptchamb', 'volet2ptchamb',
      'volet3ptchamb', 'voletbureau', 'voletstore', 'store',
    ]);
    expect(SHUTTER_NAME_CATALOG[0]).toEqual(['volet1salon', 'Volet 1 Salon']);
    expect(SHUTTER_NAME_CATALOG[14]).toEqual(['voletstore', 'Volet "Store"']);
    expect(SHUTTER_NAME_CATALOG[15]).toEqual(['store', 'Store (banne)']);
  });

  test('@nr NR-server-frontend-9 un identifiant de lumiere n est pas un volet', () => {
    expect(isShutterId('store')).toBe(true);
    for (const [id] of LIGHT_NAME_CATALOG) expect(isShutterId(id), id).toBe(false);
  });

  test('@nr NR-server-frontend-9 nom affiche : personnalise sinon origine, origine si lecture impossible', () => {
    const names = [entry('volet1salon', 'Volet 1 Salon', 'Volet baie vitrée'), entry('store', 'Store (banne)', null)];
    expect(displayShutterName('volet1salon', names)).toBe('Volet baie vitrée');
    expect(displayShutterName('store', names)).toBe('Store (banne)');
    expect(displayShutterName('voletbureau', [])).toBe('Volet Bureau');
    expect(displayShutterName('inconnu', [], 'Repli')).toBe('Repli');
  });

  test('@nr NR-server-frontend-9 nom avec HTML, & ou guillemets : conserve tel quel (texte brut)', () => {
    expect(displayShutterName('store', [entry('store', 'Store (banne)', 'Store "nord"')])).toBe('Store "nord"');
    expect(displayShutterName('store', [entry('store', 'Store (banne)', 'a&b')])).toBe('a&b');
  });

  test('@nr NR-server-frontend-9 validation : 1 a 40 caracteres, sans controle ni < >', () => {
    expect(parseShutterName('  Volet baie vitrée  ')).toEqual({ ok: true, name: 'Volet baie vitrée' });
    expect(parseShutterName('Store "nord"').ok).toBe(true);
    expect(parseShutterName('é'.repeat(40)).ok).toBe(true);
    for (const bad of ['', '   ', 'x'.repeat(41), 'a<b', 'a>b', 'a\u0007b', 'a\nb']) {
      expect(parseShutterName(bad).ok, JSON.stringify(bad)).toBe(false);
    }
  });
});
