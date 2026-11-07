/**
 * Logique pure de la disposition des lumières et des volets (affichage-objets-2026-11-006) :
 * ordre effectif, objets désactivés, déplacement dans le groupe, validation.
 * NR: NR-server-frontend-10 essensys-hub/essensys-feature-lifecycle#41 (noms #41 et #52 inchangés)
 */
import { test, expect } from '@playwright/test';
import {
  CATALOGUES, DEFAULT_LAYOUT, buildWrite, effectiveLayout, groupOf, layoutItems, moveInGroup, parseLayout,
} from '../../src/layout/objectLayout';
import { LIGHT_NAME_CATALOG } from '../../src/lights/lightNames';
import { SHUTTER_NAME_CATALOG } from '../../src/shutters/shutterNames';

const lights = CATALOGUES.lights.map((c) => c.id);
const shutters = CATALOGUES.shutters.map((c) => c.id);
const layout = (order: string[], disabled: string[]) => ({ ...DEFAULT_LAYOUT, order, disabled, version: 3 });

test.describe('logique de la disposition des objets', () => {
  test('@nr NR-server-frontend-10 catalogues : 33 lumières (21 + 12) et 16 volets (14 + 2), ordre des noms #41 et #52 inchangé', () => {
    expect(lights).toEqual(LIGHT_NAME_CATALOG.map(([id]) => id));
    expect(shutters).toEqual(SHUTTER_NAME_CATALOG.map(([id]) => id));
    expect(CATALOGUES.lights.filter((c) => c.group === 'MAIN')).toHaveLength(21);
    expect(CATALOGUES.lights.filter((c) => c.group === 'INDIRECT')).toHaveLength(12);
    expect(CATALOGUES.shutters.filter((c) => c.group === 'MAIN')).toHaveLength(14);
    expect(CATALOGUES.shutters.filter((c) => c.group === 'SPECIAL').map((c) => c.id)).toEqual(['voletstore', 'store']);
    expect(groupOf('lights', 'dressing')).toBe('MAIN');
    expect(groupOf('lights', 'idressing')).toBe('INDIRECT');
  });

  test('@nr NR-server-frontend-10 disposition par défaut : ordre du catalogue, rien de désactivé', () => {
    expect(DEFAULT_LAYOUT).toEqual({ order: [], disabled: [], version: 0, updated_at: null });
    const eff = effectiveLayout('lights', DEFAULT_LAYOUT);
    expect(eff.ordered).toEqual(lights);
    expect(eff.disabled).toEqual([]);
  });

  test('@nr NR-server-frontend-10 ordre incomplet et identifiant ancien : connus d abord, reste au catalogue, inconnus ignorés', () => {
    const eff = effectiveLayout('lights', layout(['salon', 'ancien', 'salon'], ['inconnu', 'wc2']));
    expect(eff.ordered[0]).toBe('salon');
    expect(eff.ordered).toHaveLength(33);
    expect(eff.ordered).not.toContain('ancien');
    expect(eff.ordered.slice(1)).toEqual(lights.filter((id) => id !== 'salon'));
    expect(eff.disabled).toEqual(['wc2']);
  });

  test('@nr NR-server-frontend-10 un identifiant de l autre genre est ignoré', () => {
    const eff = effectiveLayout('shutters', layout(['salon', 'volet2salon'], ['dressing', 'store']));
    expect(eff.ordered[0]).toBe('volet2salon');
    expect(eff.disabled).toEqual(['store']);
  });

  test('@nr NR-server-frontend-10 liste d un groupe : filtrée et ordonnée, un objet ne change pas de groupe', () => {
    const items = CATALOGUES.lights.filter((c) => c.group === 'MAIN').map((c) => ({ id: c.id }));
    const shown = layoutItems('lights', items, layout(['idressing', 'sam', 'salon'], ['wc2']));
    expect(shown.map((i) => i.id).slice(0, 2)).toEqual(['sam', 'salon']);
    expect(shown).toHaveLength(20);
    expect(shown.map((i) => i.id)).not.toContain('wc2');
    expect(shown.map((i) => i.id)).not.toContain('idressing');
  });

  test('@nr NR-server-frontend-10 tout désactivé : liste vide', () => {
    const items = CATALOGUES.lights.filter((c) => c.group === 'MAIN').map((c) => ({ id: c.id }));
    expect(layoutItems('lights', items, layout([], lights))).toEqual([]);
  });

  test('@nr NR-server-frontend-10 Monter et Descendre échangent avec le voisin du même groupe', () => {
    const base = effectiveLayout('lights', DEFAULT_LAYOUT).ordered;
    const up = moveInGroup('lights', base, 'sam', 'up');
    expect(up.indexOf('sam')).toBe(base.indexOf('salon'));
    expect(up.indexOf('salon')).toBe(base.indexOf('sam'));
    // Tête de groupe : inchangé ; le premier indirect ne passe pas dans le groupe principal.
    expect(moveInGroup('lights', base, 'terrasse', 'up')).toEqual(base);
    expect(moveInGroup('lights', base, 'isalonind', 'up')).toEqual(base);
    expect(moveInGroup('lights', base, 'idressing', 'down')).toEqual(base);
    // Voisin du même groupe malgré des éléments d un autre groupe entre les deux.
    const mixed = ['salon', 'isalonind', 'sam', ...base.filter((i) => !['salon', 'isalonind', 'sam'].includes(i))];
    const moved = moveInGroup('lights', mixed, 'sam', 'up');
    expect(moved.slice(0, 3)).toEqual(['sam', 'isalonind', 'salon']);
  });

  test('@nr NR-server-frontend-10 écriture : order complet et disabled, ou reset', () => {
    const ordered = effectiveLayout('shutters', DEFAULT_LAYOUT).ordered;
    expect(buildWrite(ordered, ['voletbureau'], false)).toEqual({ order: shutters, disabled: ['voletbureau'] });
    expect(buildWrite(ordered, [], true)).toEqual({ reset: true });
  });

  test('@nr NR-server-frontend-10 lecture du document : tolérante, updated_by ignoré', () => {
    expect(parseLayout({ order: ['a'], disabled: ['b'], version: 2, updated_at: '2026-11-07T10:15:30.123Z', updated_by: 'x@example.org' }))
      .toEqual({ order: ['a'], disabled: ['b'], version: 2, updated_at: '2026-11-07T10:15:30.123Z' });
    expect(parseLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout({ order: 'x', disabled: [1, 'a'] })).toEqual({ ...DEFAULT_LAYOUT, disabled: ['a'] });
  });
});
