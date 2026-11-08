/**
 * Logique pure de la sonnette (sonnette-unifi-2026-11-007) : état, fenêtre, réglages, lumières proposées.
 * NR: NR-server-frontend-11 essensys-hub/essensys-feature-lifecycle#58 (noms #41 et disposition #55 réutilisés)
 */
import { test, expect } from '@playwright/test';
import {
  DEFAULT_SETTINGS, DEFAULT_STATUS, MAX_BLINKS, MIN_BLINKS, POLL_IDLE_MS, POLL_OPEN_MS,
  buildSettingsWrite, doorbellErrorMessage, isRinging, parseSettings, parseStatus, pollInterval, ringKey,
  selectableLights, shouldShowWindow, toggleLight, validateBlinks,
} from '../../src/doorbell/doorbell';
import { DEFAULT_LAYOUT } from '../../src/layout/objectLayout';
import { DEFAULT_SCHEDULE } from '../../src/doorbell/doorbellSchedule';

const ringing = (over: Record<string, unknown> = {}) =>
  parseStatus({
    enabled: true, available: true, ringing: true,
    ringing_until: '2026-11-08T10:01:00Z', last_ring_at: '2026-11-08T10:00:00Z', ...over,
  });
const NOW = Date.parse('2026-11-08T10:00:30Z');

test.describe('logique de la sonnette', () => {
  test('@nr NR-server-frontend-11 état par défaut : fonction désactivée, aucune fenêtre', () => {
    expect(DEFAULT_STATUS).toEqual({ enabled: false, available: false, ringing: false, ringing_until: null, last_ring_at: null });
    expect(parseStatus(null)).toEqual(DEFAULT_STATUS);
    expect(parseStatus('x')).toEqual(DEFAULT_STATUS);
    expect(shouldShowWindow(DEFAULT_STATUS, null, NOW)).toBe(false);
  });

  test('@nr NR-server-frontend-11 sonnerie : fenêtre affichée', () => {
    expect(shouldShowWindow(ringing(), null, NOW)).toBe(true);
  });

  test('@nr NR-server-frontend-11 fonction désactivée ou indisponible : aucune fenêtre', () => {
    expect(shouldShowWindow(ringing({ enabled: false }), null, NOW)).toBe(false);
    expect(shouldShowWindow(ringing({ available: false }), null, NOW)).toBe(false);
    expect(shouldShowWindow(ringing({ ringing: false }), null, NOW)).toBe(false);
  });

  test('@nr NR-server-frontend-11 fermeture : pas de réouverture pour la même sonnerie, réouverture pour la suivante', () => {
    const first = ringing();
    const key = ringKey(first);
    expect(key).not.toBeNull();
    expect(shouldShowWindow(first, key, NOW)).toBe(false);
    const next = ringing({ last_ring_at: '2026-11-08T10:02:00Z', ringing_until: '2026-11-08T10:03:00Z' });
    expect(ringKey(next)).not.toBe(key);
    expect(shouldShowWindow(next, key, Date.parse('2026-11-08T10:02:10Z'))).toBe(true);
  });

  test('@nr NR-server-frontend-11 sonnerie périmée côté client (dernier état conservé après une coupure)', () => {
    const s = ringing();
    expect(isRinging(s, NOW)).toBe(true);
    expect(isRinging(s, Date.parse('2026-11-08T10:01:01Z'))).toBe(false);
    expect(isRinging(ringing({ ringing_until: null }), NOW)).toBe(true);
    expect(isRinging(ringing({ ringing_until: 'pas une date' }), NOW)).toBe(true);
  });

  test('@nr NR-server-frontend-11 interrogation : 2 s fenêtre ouverte, 5 s sinon', () => {
    expect(POLL_OPEN_MS).toBe(2000);
    expect(POLL_IDLE_MS).toBe(5000);
    expect(pollInterval(true)).toBe(2000);
    expect(pollInterval(false)).toBe(5000);
  });

  test('@nr NR-server-frontend-11 réglages par défaut : désactivé, aucune lumière, 5 clignotements', () => {
    expect(DEFAULT_SETTINGS).toMatchObject({ enabled: false, camera_id: '', lights: [], blinks: 5, version: 0 });
    expect(parseSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(parseSettings({ enabled: true, camera_id: 'cam1', lights: ['salon', 3], blinks: 3, version: 2, updated_at: 'x', updated_by: 'secret' }))
      .toEqual({ enabled: true, camera_id: 'cam1', lights: ['salon'], blinks: 3, schedule: DEFAULT_SCHEDULE, version: 2, updated_at: 'x' });
  });

  test('@nr NR-server-frontend-11 clignotements : entier de 1 à 10', () => {
    expect(MIN_BLINKS).toBe(1);
    expect(MAX_BLINKS).toBe(10);
    for (const ok of [1, 5, 10]) expect(validateBlinks(ok)).toBeNull();
    for (const bad of [0, 11, 2.5, Number.NaN, -1]) expect(validateBlinks(bad)).toMatch(/1 à 10/);
  });

  test('@nr NR-server-frontend-11 corps du PUT : quatre champs, sans version ni mention de l auteur', () => {
    expect(buildSettingsWrite({ ...DEFAULT_SETTINGS, enabled: true, camera_id: 'cam1', lights: ['salon', 'sam'], blinks: 3, version: 4 }))
      .toEqual({ enabled: true, camera_id: 'cam1', lights: ['salon', 'sam'], blinks: 3, schedule: DEFAULT_SCHEDULE });
  });

  test('@nr NR-server-frontend-11 lumières proposées : catalogue, noms personnalisés, masquées (#55) non proposées', () => {
    const base = selectableLights({ ...DEFAULT_LAYOUT, disabled: ['wc2', 'idressing'] }, [], (id) => id);
    expect(base).toHaveLength(31);
    expect(base.map((l) => l.id)).not.toContain('wc2');
    expect(base.map((l) => l.id)).not.toContain('idressing');
    expect(base[0].id).toBe('terrasse');
    const named = selectableLights(DEFAULT_LAYOUT, [], (id) => (id === 'salon' ? 'Séjour' : id));
    expect(named.find((l) => l.id === 'salon')?.label).toBe('Séjour');
  });

  test('@nr NR-server-frontend-11 ordre effectif de la disposition respecté, lumière masquée mais déjà choisie conservée et signalée', () => {
    const list = selectableLights({ ...DEFAULT_LAYOUT, order: ['sam', 'salon'], disabled: ['wc2'] }, ['wc2', 'inconnue'], (id) => id);
    expect(list.slice(0, 2).map((l) => l.id)).toEqual(['sam', 'salon']);
    const wc2 = list.find((l) => l.id === 'wc2');
    expect(wc2).toMatchObject({ hidden: true });
    expect(list.find((l) => l.id === 'salon')).toMatchObject({ hidden: false });
    expect(list.map((l) => l.id)).not.toContain('inconnue');
  });

  test('@nr NR-server-frontend-11 choisir et retirer une lumière sans doublon', () => {
    expect(toggleLight(['salon'], 'sam')).toEqual(['salon', 'sam']);
    expect(toggleLight(['salon', 'sam'], 'salon')).toEqual(['sam']);
  });

  test('@nr NR-server-frontend-11 erreurs de la gateway affichées en français', () => {
    expect(doorbellErrorMessage(403, null)).toMatch(/Réservé à l'administrateur/);
    expect(doorbellErrorMessage(400, 'unknown_light')).toBe('Lumière inconnue de la passerelle');
    expect(doorbellErrorMessage(400, 'unknown_camera')).toBe('Caméra inconnue de la console UniFi');
    expect(doorbellErrorMessage(400, 'invalid_blinks')).toMatch(/1 à 10/);
    expect(doorbellErrorMessage(503, 'names_unavailable')).toMatch(/Stockage .* indisponible/);
    expect(doorbellErrorMessage(503, 'doorbell_unavailable')).toMatch(/console UniFi .* injoignable/);
    expect(doorbellErrorMessage(400, 'invalid_settings')).toMatch(/Réglages refusés/);
    expect(doorbellErrorMessage(500, null)).toMatch(/\(500\)/);
  });
});
