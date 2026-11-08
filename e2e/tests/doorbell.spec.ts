/**
 * Sonnette UniFi (sonnette-unifi-2026-11-007), portail local de la gateway : fenêtre « Quelqu'un sonne » et écran « Sonnette ».
 * NR: NR-server-frontend-11 essensys-hub/essensys-feature-lifecycle#58 (noms #41 et lumières masquées #55 réutilisés)
 *
 * Build démo (API simulée dans la page) sous la fixture no-armoire : aucune requête vers une armoire ni vers une console UniFi.
 * Le flux vidéo (balise image) est simulé par Playwright. Sessions : `essensys_demo_doorbell_status` (état renvoyé),
 * `essensys_demo_doorbell_init` (réglages de départ), `essensys_demo_doorbell_error`, `essensys_demo_doorbell_cameras`,
 * `essensys_demo_doorbell_absent`, `essensys_demo_lan_role`, `essensys_demo_layout_init`.
 */
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/no-armoire';
import { recordFetch, recordedCalls } from '../fixtures/record-fetch';
import { currentTarget } from '../pages/project';

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
const ringingStatus = (lastRing: string, over: Record<string, unknown> = {}) => ({
  enabled: true, available: true, ringing: true, ringing_until: inMinutes(10), last_ring_at: lastRing, ...over,
});

/** Simule le flux de la gateway et compte les requêtes vidéo. */
const mockStream = async (page: Page, status = 200) => {
  const requests: string[] = [];
  await page.route('**/api/doorbell/stream*', async (route) => {
    requests.push(route.request().url());
    if (status !== 200) {
      await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify({ error: 'doorbell_unavailable' }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'image/png', body: PNG });
  });
  return requests;
};

const setStatus = (page: Page, status: unknown) =>
  page.addInitScript((s) => sessionStorage.setItem('essensys_demo_doorbell_status', JSON.stringify(s)), status);

const initSettings = (page: Page, settings: Record<string, unknown>) =>
  page.addInitScript((s) => sessionStorage.setItem('essensys_demo_doorbell_init', JSON.stringify({ settings: s })), settings);

const withRole = async (page: Page, role: 'lan_admin' | 'lan_user') => {
  await page.route('**/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lan_iam_enabled: true }) }),
  );
  await page.addInitScript((r) => sessionStorage.setItem('essensys_demo_lan_role', r), role);
};

const wake = (page: Page) => page.evaluate(() => window.dispatchEvent(new Event('focus')));
const goto = (page: Page, path: string) => page.goto(path, { waitUntil: 'domcontentloaded' });
/** Navigation interne (l'état de la démonstration vit en mémoire dans la page). */
const spa = (page: Page, path: string) =>
  page.evaluate((p) => {
    history.pushState(null, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
const doorbellWrites = async (page: Page) =>
  (await recordedCalls(page)).filter((c) => c.url.includes('/api/admin/doorbell/settings'));

test.describe('sonnette — portail local', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    void page;
    test.skip(currentTarget(testInfo) !== 'local', 'Portail local uniquement.');
  });

  test('@nr NR-server-frontend-11 sonnerie : fenêtre « Quelqu un sonne » avec la vidéo, quelle que soit la page', async ({ page }) => {
    const stream = await mockStream(page);
    await setStatus(page, ringingStatus('2026-11-08T10:00:00Z'));
    for (const path of ['dashboard', 'lighting', 'shutters']) {
      await goto(page, path);
      const win = page.getByRole('dialog', { name: "Quelqu'un sonne" });
      await expect(win).toBeVisible();
      await expect(win.getByTestId('doorbell-video')).toBeVisible();
      await expect.poll(() => stream.length).toBeGreaterThan(0);
      await expect.poll(() => win.getByTestId('doorbell-video').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
      await page.evaluate(() => sessionStorage.removeItem('essensys_doorbell_dismissed'));
    }
    expect(stream.every((u) => new URL(u).pathname === '/api/doorbell/stream')).toBe(true);
  });

  test('@nr NR-server-frontend-11 fermeture : pas de réouverture pour la même sonnerie, réouverture pour la suivante', async ({ page }) => {
    await mockStream(page);
    await setStatus(page, ringingStatus('2026-11-08T10:00:00Z'));
    await goto(page, 'dashboard');
    const win = page.getByTestId('doorbell-window');
    await expect(win).toBeVisible();
    await win.getByRole('button', { name: 'Fermer' }).click();
    await expect(win).toHaveCount(0);
    await wake(page);
    await page.waitForTimeout(400);
    await expect(win).toHaveCount(0); // même sonnerie
    await page.evaluate((s) => sessionStorage.setItem('essensys_demo_doorbell_status', JSON.stringify(s)), ringingStatus('2026-11-08T10:05:00Z'));
    await wake(page);
    await expect(win).toBeVisible(); // sonnerie suivante
  });

  test('@nr NR-server-frontend-11 fonction désactivée : aucune fenêtre et aucune requête vidéo', async ({ page }) => {
    const stream = await mockStream(page);
    await setStatus(page, ringingStatus('2026-11-08T10:00:00Z', { enabled: false }));
    await goto(page, 'dashboard');
    await expect(page.getByRole('heading', { name: 'Tableau de bord' }).first()).toBeVisible();
    await page.waitForTimeout(600);
    await expect(page.getByTestId('doorbell-window')).toHaveCount(0);
    expect(stream).toHaveLength(0);
  });

  test('@nr NR-server-frontend-11 console indisponible (available=false) : aucune fenêtre et aucune requête vidéo', async ({ page }) => {
    const stream = await mockStream(page);
    await setStatus(page, ringingStatus('2026-11-08T10:00:00Z', { available: false }));
    await goto(page, 'lighting');
    await page.waitForTimeout(600);
    await expect(page.getByTestId('doorbell-window')).toHaveCount(0);
    expect(stream).toHaveLength(0);
  });

  test('@nr NR-server-frontend-11 pas de sonnerie en cours : aucune fenêtre', async ({ page }) => {
    const stream = await mockStream(page);
    await setStatus(page, ringingStatus('2026-11-08T10:00:00Z', { ringing: false }));
    await goto(page, 'lighting');
    await page.waitForTimeout(600);
    await expect(page.getByTestId('doorbell-window')).toHaveCount(0);
    expect(stream).toHaveLength(0);
  });

  test('@nr NR-server-frontend-11 ancienne gateway (404) : aucune fenêtre, aucun message bloquant', async ({ page }) => {
    const stream = await mockStream(page);
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_doorbell_absent', '404'));
    await goto(page, 'lighting');
    await expect(page.getByTestId('light-salon')).toBeVisible();
    await expect(page.getByTestId('doorbell-window')).toHaveCount(0);
    await expect(page.getByRole('alert')).toHaveCount(0);
    expect(stream).toHaveLength(0);
  });

  test('@nr NR-server-frontend-11 flux en erreur (503) : message sous la fenêtre, fermeture possible', async ({ page }) => {
    await mockStream(page, 503);
    await setStatus(page, ringingStatus('2026-11-08T10:00:00Z'));
    await goto(page, 'dashboard');
    await expect(page.getByTestId('doorbell-video-error')).toHaveText('Vidéo indisponible pour le moment.');
    await page.getByRole('button', { name: 'Fermer' }).click();
    await expect(page.getByTestId('doorbell-window')).toHaveCount(0);
  });

  test('@nr NR-server-frontend-11 réglage : deux lumières, 3 clignotements, un seul PUT, valeurs relues à la réouverture', async ({ page }) => {
    await recordFetch(page);
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('doorbell-settings')).toBeVisible();
    await expect(page.getByTestId('doorbell-enabled')).not.toBeChecked();
    await expect(page.getByTestId('doorbell-blinks')).toHaveValue('5');
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    await page.getByTestId('doorbell-enabled').check();
    await page.getByTestId('doorbell-camera').selectOption('cam-mock-1');
    await page.getByTestId('doorbell-light-salon').check();
    await page.getByTestId('doorbell-light-sam').check();
    await page.getByTestId('doorbell-blinks').fill('3');
    expect(await doorbellWrites(page)).toHaveLength(0); // modifications locales jusqu'à Enregistrer
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('status')).toHaveText('Réglages enregistrés');
    const writes = await doorbellWrites(page);
    expect(writes).toHaveLength(1);
    expect(writes[0].method).toBe('PUT');
    expect(writes[0].body).toEqual({
      enabled: true, camera_id: 'cam-mock-1', lights: ['salon', 'sam'], blinks: 3,
      schedule: { mode: 'always', timezone: 'Europe/Paris', grid: Array(7).fill('1'.repeat(24)) },
    });
    // Réouverture (navigation interne : la démonstration garde ses réglages en mémoire).
    await spa(page, '/settings');
    await expect(page.getByTestId('doorbell-settings')).toHaveCount(0);
    await spa(page, '/settings/doorbell');
    await expect(page.getByTestId('doorbell-enabled')).toBeChecked();
    await expect(page.getByTestId('doorbell-camera')).toHaveValue('cam-mock-1');
    await expect(page.getByTestId('doorbell-light-salon')).toBeChecked();
    await expect(page.getByTestId('doorbell-light-sam')).toBeChecked();
    await expect(page.getByTestId('doorbell-light-cuisine')).not.toBeChecked();
    await expect(page.getByTestId('doorbell-blinks')).toHaveValue('3');
  });

  test('@nr NR-server-frontend-11 lumières : noms personnalisés (#41) affichés, masquées (#55) non proposées', async ({ page }) => {
    await page.addInitScript((d) => sessionStorage.setItem('essensys_demo_layout_init', JSON.stringify(d)), {
      lights: { disabled: ['wc2'], version: 1 },
    });
    await goto(page, 'lighting');
    const panel = page.getByTestId('light-name-panel-salon');
    await panel.getByRole('button', { name: 'Nom', exact: true }).click();
    await panel.getByLabel('Nom', { exact: true }).fill('Séjour');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel.getByRole('status')).toBeVisible();
    await spa(page, '/settings/doorbell');
    const list = page.getByTestId('doorbell-lights');
    await expect(list).toBeVisible();
    await expect(list.getByText('Séjour', { exact: true })).toBeVisible();
    await expect(page.getByTestId('doorbell-light-wc2')).toHaveCount(0);
    await expect(page.locator('[data-testid^="doorbell-light-"]')).toHaveCount(32);
  });

  test('@nr NR-server-frontend-11 lumière masquée mais déjà choisie : proposée avec la mention (masquée) pour pouvoir la retirer', async ({ page }) => {
    await page.addInitScript((d) => sessionStorage.setItem('essensys_demo_layout_init', JSON.stringify(d)), {
      lights: { disabled: ['wc2'], version: 1 },
    });
    await initSettings(page, { enabled: true, camera_id: 'cam-mock-1', lights: ['wc2'], blinks: 2 });
    await recordFetch(page);
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('doorbell-light-wc2')).toBeChecked();
    await expect(page.getByTestId('doorbell-lights').getByText('WC 2 (masquée)')).toBeVisible();
    await page.getByTestId('doorbell-light-wc2').click();
    await expect(page.getByTestId('doorbell-light-wc2')).toHaveCount(0); // retirée, donc plus proposée
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('status')).toBeVisible();
    expect((await doorbellWrites(page))[0].body).toMatchObject({ lights: [] });
  });

  test('@nr NR-server-frontend-11 nombre de clignotements hors plage : message, enregistrement impossible', async ({ page }) => {
    await goto(page, 'settings/doorbell');
    await page.getByTestId('doorbell-blinks').fill('0');
    await expect(page.getByTestId('doorbell-blinks-error')).toContainText('1 à 10');
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    await page.getByTestId('doorbell-blinks').fill('11');
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    await page.getByTestId('doorbell-blinks').fill('10');
    await expect(page.getByTestId('doorbell-blinks-error')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });

  for (const [forced, text] of [
    ['403', "Réservé à l'administrateur"],
    ['503', 'Stockage des réglages indisponible'],
    ['unknown_camera', 'Caméra inconnue de la console UniFi'],
    ['invalid_blinks', 'Nombre de clignotements refusé'],
  ] as const) {
    test(`@nr NR-server-frontend-11 erreur ${forced} de la gateway : message en français, écran ouvert avec les modifications`, async ({ page }) => {
      await page.addInitScript((c) => sessionStorage.setItem('essensys_demo_doorbell_error', c), forced);
      await goto(page, 'settings/doorbell');
      await page.getByTestId('doorbell-enabled').check();
      await page.getByRole('button', { name: 'Enregistrer' }).click();
      await expect(page.getByRole('alert')).toContainText(text);
      await expect(page.getByTestId('doorbell-enabled')).toBeChecked();
    });
  }

  test('@nr NR-server-frontend-11 caméras indisponibles : message, le reste de l écran reste utilisable', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_doorbell_cameras', '503'));
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('doorbell-cameras-error')).toContainText('Caméras indisponibles');
    await expect(page.getByTestId('doorbell-light-salon')).toBeVisible();
  });

  test('@nr NR-server-frontend-11 Essayer : la fenêtre de sonnerie s affiche, aucun ordre vers l armoire', async ({ page }) => {
    const stream = await mockStream(page);
    await initSettings(page, { enabled: true, camera_id: 'cam-mock-1', lights: ['salon'], blinks: 3 });
    await recordFetch(page);
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('doorbell-enabled')).toBeChecked();
    await expect(page.getByTestId('doorbell-window')).toHaveCount(0);
    await page.getByRole('button', { name: 'Essayer' }).click();
    await expect(page.getByRole('status')).toContainText('Essai lancé');
    await expect(page.getByRole('dialog', { name: "Quelqu'un sonne" })).toBeVisible();
    await expect.poll(() => stream.length).toBeGreaterThan(0);
    const calls = await recordedCalls(page);
    expect(calls.filter((c) => c.url.includes('/api/admin/doorbell/test'))).toHaveLength(1);
    expect(calls.filter((c) => c.url.includes('/api/admin/inject') || c.url.includes('/web/actions'))).toHaveLength(0);
    expect(calls.filter((c) => c.url.includes('/api/admin/exchange'))).toHaveLength(0);
  });

  test('@nr NR-server-frontend-11 Essayer sans modification enregistrée : désactivé tant que des réglages sont à enregistrer', async ({ page }) => {
    await goto(page, 'settings/doorbell');
    await expect(page.getByRole('button', { name: 'Essayer' })).toBeEnabled();
    await page.getByTestId('doorbell-light-salon').check();
    await expect(page.getByRole('button', { name: 'Essayer' })).toBeDisabled();
  });

  test('@nr NR-server-frontend-11 fonction désactivée : l essai répond que la sonnette est indisponible', async ({ page }) => {
    await goto(page, 'settings/doorbell');
    await page.getByRole('button', { name: 'Essayer' }).click();
    await expect(page.getByRole('alert')).toContainText('Sonnette indisponible');
    await expect(page.getByTestId('doorbell-window')).toHaveCount(0);
  });

  test('@nr NR-server-frontend-11 lan_user (IAM actif) : ni écran ni entrée de menu', async ({ page }) => {
    await withRole(page, 'lan_user');
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('doorbell-forbidden')).toHaveText("Réservé à l'administrateur de l'armoire.");
    await expect(page.getByTestId('doorbell-settings')).toHaveCount(0);
    await expect(page.getByRole('link', { name: 'Sonnette' })).toHaveCount(0);
  });

  test('@nr NR-server-frontend-11 lan_admin (IAM actif) : écran de réglage visible', async ({ page }) => {
    await withRole(page, 'lan_admin');
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('doorbell-settings')).toBeVisible();
    await expect(page.getByTestId('doorbell-forbidden')).toHaveCount(0);
  });

  test('@nr NR-server-frontend-11 lan_user voit la fenêtre de sonnerie (état ouvert à tout utilisateur authentifié)', async ({ page }) => {
    await mockStream(page);
    await withRole(page, 'lan_user');
    await setStatus(page, ringingStatus('2026-11-08T10:00:00Z'));
    await goto(page, 'dashboard');
    await expect(page.getByRole('dialog', { name: "Quelqu'un sonne" })).toBeVisible();
  });
});
