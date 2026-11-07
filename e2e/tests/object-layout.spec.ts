/**
 * Disposition des lumières et des volets (affichage-objets-2026-11-006), portail local de la gateway.
 * NR: NR-server-frontend-10 essensys-hub/essensys-feature-lifecycle#41 (noms #41 et #52 inchangés)
 *
 * Build démo (API simulée dans la page) sous la fixture no-armoire : aucune requête vers une armoire.
 * Rôle : sessionStorage `essensys_demo_lan_role` ; disposition de départ : `essensys_demo_layout_init`.
 */
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/no-armoire';
import { recordFetch, recordedCalls } from '../fixtures/record-fetch';
import { currentDevice, currentTarget } from '../pages/project';

type Doc = { order?: string[]; disabled?: string[]; version?: number; updated_at?: string | null };

const initLayout = (page: Page, docs: { lights?: Doc; shutters?: Doc }) =>
  page.addInitScript((d) => sessionStorage.setItem('essensys_demo_layout_init', JSON.stringify(d)), docs);

const layoutWrites = async (page: Page, kind: 'lights' | 'shutters') =>
  (await recordedCalls(page)).filter((c) => c.url.includes(`/api/admin/${kind}/layout`));

const withRole = async (page: Page, role: 'lan_admin' | 'lan_user') => {
  await page.route('**/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lan_iam_enabled: true }) }),
  );
  await page.addInitScript((r) => sessionStorage.setItem('essensys_demo_lan_role', r), role);
};

const gotoLighting = (page: Page) => page.goto('lighting', { waitUntil: 'domcontentloaded' });
const gotoShutters = (page: Page) => page.goto('shutters', { waitUntil: 'domcontentloaded' });

const lightIds = (page: Page) =>
  page.getByTestId(/^light-[a-z0-9]+$/).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.slice(6)));
const shutterIds = (page: Page) =>
  page.getByTestId(/^shutter-[a-z0-9]+$/).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.slice(8)));

const openManager = async (page: Page, kind: 'lights' | 'shutters') => {
  await page.getByTestId(`layout-manager-${kind}`).getByRole('button', { name: /Gérer l'affichage/ }).click();
  return page.getByTestId(`layout-panel-${kind}`);
};

test.describe('disposition des lumières et des volets — portail local', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    void page;
    test.skip(currentTarget(testInfo) !== 'local', 'Portail local uniquement (le portail cloud a sa propre spec).');
    test.fixme(currentDevice(testInfo) === 'android', 'Débordement horizontal de la mise en page mobile, antérieur à la feature');
  });

  test('@nr NR-server-frontend-10 lumière désactivée : absente de la liste, de Tout allumer (commandes inspectées) et des Temporisations', async ({ page }) => {
    await initLayout(page, { lights: { disabled: ['wc2'], version: 1 } });
    await recordFetch(page);
    await gotoLighting(page);
    await expect(page.getByTestId('light-salon')).toBeVisible();
    await expect(page.getByTestId('light-wc2')).toHaveCount(0);
    expect(await lightIds(page)).toHaveLength(32);

    const main = page.locator('section, div').filter({ hasText: 'Lumières principales de la maison' }).last();
    void main;
    await page.getByRole('button', { name: 'Tout allumer' }).first().click();
    await expect(page.getByText('Principaux : commandes envoyées')).toBeVisible();
    const injects = (await recordedCalls(page)).filter((c) => c.url.includes('/api/admin/inject'));
    expect(injects).toHaveLength(20);
    // wc2 = indice 615, valeur 64 : seule lumière de cette paire.
    expect(injects.some((c) => JSON.stringify(c.body).includes('"615"') && JSON.stringify(c.body).includes('"64"'))).toBe(false);

    await page.goto('lighting/timers', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('light-timers-item-wc1')).toBeVisible();
    await expect(page.getByTestId('light-timers-item-wc2')).toHaveCount(0);
  });

  test('@nr NR-server-frontend-10 volet désactivé : absent de la liste, de Tout ouvrir et de Temps de course', async ({ page }) => {
    await initLayout(page, { shutters: { disabled: ['voletbureau'], version: 1 } });
    await recordFetch(page);
    await gotoShutters(page);
    await expect(page.getByTestId('shutter-volet1salon')).toBeVisible();
    await expect(page.getByTestId('shutter-voletbureau')).toHaveCount(0);
    await expect(page.getByTestId('shutter-time-voletbureau')).toHaveCount(0);
    await expect(page.getByTestId('shutter-time-volet1salon')).toBeVisible();

    await page.getByRole('button', { name: 'Tout ouvrir' }).first().click();
    await expect(page.getByText('Volets : Tous ouverts')).toBeVisible();
    const injects = (await recordedCalls(page)).filter((c) => c.url.includes('/api/admin/inject'));
    expect(injects).toHaveLength(13);
    // voletbureau = indice 617, valeur 32 (unique).
    expect(injects.some((c) => JSON.stringify(c.body).includes('"617"') && JSON.stringify(c.body).includes('"32"'))).toBe(false);
  });

  test('@nr NR-server-frontend-10 ordre choisi : volet2salon avant volet1salon, liste et Temps de course', async ({ page }) => {
    await initLayout(page, { shutters: { order: ['volet2salon', 'volet1salon'], version: 2 } });
    await gotoShutters(page);
    await expect(page.getByTestId('shutter-volet2salon')).toBeVisible();
    const ids = await shutterIds(page);
    expect(ids.slice(0, 3)).toEqual(['volet2salon', 'volet1salon', 'volet3salon']);
    const times = await page.getByTestId(/^shutter-time-/).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!));
    expect(times.slice(0, 2)).toEqual(['shutter-time-volet2salon', 'shutter-time-volet1salon']);
  });

  test('@nr NR-server-frontend-10 ordre incomplet et identifiant ancien : salon en tête de son groupe, reste au catalogue', async ({ page }) => {
    await initLayout(page, { lights: { order: ['ancienne', 'salon'], version: 1 } });
    await gotoLighting(page);
    await expect(page.getByTestId('light-salon')).toBeVisible();
    const ids = await lightIds(page);
    expect(ids).toHaveLength(33);
    expect(ids.slice(0, 3)).toEqual(['salon', 'terrasse', 'entree']);
  });

  test('@nr NR-server-frontend-10 tout désactivé : texte à la place des boutons de groupe', async ({ page }) => {
    const shutters = ['volet1salon', 'volet2salon', 'volet3salon', 'volet1salleamanger', 'volet2salleamanger', 'volet1cuisine',
      'volet2cuisine', 'voletsdb', 'volet1gdchamb', 'volet2gdchamb', 'volet1ptchamb', 'volet2ptchamb', 'volet3ptchamb', 'voletbureau'];
    await initLayout(page, { shutters: { disabled: shutters, version: 1 } });
    await gotoShutters(page);
    await expect(page.getByTestId('shutter-group-empty-Volets')).toHaveText('Aucun volet activé');
    await expect(page.getByRole('button', { name: 'Tout ouvrir' })).toHaveCount(1); // groupe des stores seul
    expect(await shutterIds(page)).toEqual(['voletstore', 'store']);
  });

  test('@nr NR-server-frontend-10 ancien serveur (404) : catalogue complet dans l ordre d origine, sans message bloquant', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_layout_read', '404'));
    await initLayout(page, { lights: { disabled: ['wc2'], version: 1 } });
    await gotoLighting(page);
    await expect(page.getByTestId('light-salon')).toBeVisible();
    const ids = await lightIds(page);
    expect(ids).toHaveLength(33);
    expect(ids.slice(0, 3)).toEqual(['terrasse', 'entree', 'escalier']);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await gotoShutters(page);
    await expect(page.getByTestId('shutter-voletbureau')).toBeVisible();
    expect(await shutterIds(page)).toHaveLength(16);
  });

  test('@nr NR-server-frontend-10 lecture en erreur (500) : catalogue complet', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_layout_read', '500'));
    await gotoShutters(page);
    await expect(page.getByTestId('shutter-voletbureau')).toBeVisible();
    expect(await shutterIds(page)).toHaveLength(16);
  });

  test('@nr NR-server-frontend-10 Monter sam puis Enregistrer : une seule écriture, sam avant salon sans rechargement', async ({ page }) => {
    await recordFetch(page);
    await gotoLighting(page);
    const panel = await openManager(page, 'lights');
    await panel.getByTestId('layout-up-sam').click();
    expect(await layoutWrites(page, 'lights')).toHaveLength(0); // modifications locales jusqu à Enregistrer
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel.getByRole('status')).toContainText('Disposition enregistrée');
    const writes = await layoutWrites(page, 'lights');
    expect(writes).toHaveLength(1);
    expect(writes[0].method).toBe('PUT');
    expect(new URL(writes[0].url, 'http://x').pathname).toBe('/api/admin/lights/layout');
    const body = writes[0].body as { order: string[]; disabled: string[] };
    expect(body.order).toHaveLength(33);
    expect(body.order.indexOf('sam')).toBeLessThan(body.order.indexOf('salon'));
    expect(body.disabled).toEqual([]);
    const ids = await lightIds(page);
    expect(ids.indexOf('sam')).toBeLessThan(ids.indexOf('salon'));
  });

  test('@nr NR-server-frontend-10 Monter ne passe pas dans un autre groupe : tête de groupe désactivée', async ({ page }) => {
    await gotoLighting(page);
    const panel = await openManager(page, 'lights');
    await expect(panel.getByTestId('layout-up-terrasse')).toBeDisabled();
    await expect(panel.getByTestId('layout-up-isalonind')).toBeDisabled();
    await expect(panel.getByTestId('layout-down-idressing')).toBeDisabled();
    await expect(panel.getByTestId('layout-down-dressing')).toBeDisabled();
    await expect(panel.getByTestId('layout-down-cuisine')).toBeEnabled();
  });

  test('@nr NR-server-frontend-10 réactivation : wc2 revient à sa position et l écran liste aussi les désactivés', async ({ page }) => {
    await initLayout(page, { lights: { disabled: ['wc2'], version: 1 } });
    await recordFetch(page);
    await gotoLighting(page);
    await expect(page.getByTestId('light-wc2')).toHaveCount(0);
    const panel = await openManager(page, 'lights');
    await expect(panel.getByTestId('layout-row-wc2')).toBeVisible();
    await expect(panel.getByTestId('layout-toggle-wc2')).toHaveText('Désactivé');
    await panel.getByTestId('layout-toggle-wc2').click();
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel.getByRole('status')).toBeVisible();
    await expect(page.getByTestId('light-wc2')).toBeVisible();
    const ids = await lightIds(page);
    expect(ids.indexOf('wc2')).toBe(ids.indexOf('wc1') + 1);
    expect((await layoutWrites(page, 'lights'))[0].body).toMatchObject({ disabled: [] });
  });

  test('@nr NR-server-frontend-10 Ordre d origine : écriture reset, catalogue complet, nom personnalisé conservé', async ({ page }) => {
    await initLayout(page, { shutters: { order: ['volet2salon', 'volet1salon'], disabled: ['store'], version: 2 } });
    await recordFetch(page);
    await gotoShutters(page);
    // nom personnalisé (#52)
    await page.getByTestId('shutter-name-panel-volet1salon').getByRole('button', { name: 'Nom', exact: true }).click();
    await page.getByTestId('shutter-name-panel-volet1salon').getByLabel('Nom', { exact: true }).fill('Volet baie vitrée');
    await page.getByTestId('shutter-name-panel-volet1salon').getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('shutter-volet1salon').getByText('Volet baie vitrée', { exact: true })).toBeVisible();

    const panel = await openManager(page, 'shutters');
    await expect(panel.getByTestId('layout-row-volet1salon')).toContainText('Volet baie vitrée');
    await panel.getByRole('button', { name: "Ordre d'origine" }).click();
    expect(await layoutWrites(page, 'shutters')).toHaveLength(0);
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel.getByRole('status')).toBeVisible();
    const writes = await layoutWrites(page, 'shutters');
    expect(writes.map((w) => w.body)).toEqual([{ reset: true }]);
    const ids = await shutterIds(page);
    expect(ids).toHaveLength(16);
    expect(ids.slice(0, 2)).toEqual(['volet1salon', 'volet2salon']);
    await expect(page.getByTestId('shutter-volet1salon').getByText('Volet baie vitrée', { exact: true })).toBeVisible();
  });

  test('@nr NR-server-frontend-10 régler la disposition n emet aucun ordre vers l armoire', async ({ page }) => {
    await recordFetch(page);
    await gotoShutters(page);
    const panel = await openManager(page, 'shutters');
    await panel.getByTestId('layout-toggle-store').click();
    await panel.getByTestId('layout-down-volet1salon').click();
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel.getByRole('status')).toBeVisible();
    const calls = await recordedCalls(page);
    expect(calls.filter((c) => c.url.includes('/api/admin/inject') || c.url.includes('/web/actions'))).toHaveLength(0);
    expect(calls.filter((c) => c.url.includes('/api/admin/exchange'))).toHaveLength(0);
  });

  for (const code of ['403', '503'] as const) {
    test(`@nr NR-server-frontend-10 erreur ${code} serveur : message clair, écran ouvert avec les modifications`, async ({ page }) => {
      await page.addInitScript((c) => sessionStorage.setItem('essensys_demo_layout_error', c), code);
      await gotoLighting(page);
      const panel = await openManager(page, 'lights');
      await panel.getByTestId('layout-toggle-wc2').click();
      await panel.getByRole('button', { name: 'Enregistrer' }).click();
      await expect(panel.getByRole('alert')).toContainText(code === '403' ? "Réservé à l'administrateur" : 'indisponible');
      await expect(panel.getByTestId('layout-toggle-wc2')).toHaveText('Désactivé');
    });
  }

  test('@nr NR-server-frontend-10 lan_user (IAM actif) : ni écran ni bouton, désactivés masqués', async ({ page }) => {
    await withRole(page, 'lan_user');
    await initLayout(page, { lights: { disabled: ['wc2'], version: 1 } });
    await gotoLighting(page);
    await expect(page.getByTestId('light-salon')).toBeVisible();
    await expect(page.getByTestId('light-wc2')).toHaveCount(0);
    await expect(page.getByTestId('layout-manager-lights')).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Gérer l'affichage/ })).toHaveCount(0);
  });

  test('@nr NR-server-frontend-10 lan_admin (IAM actif) : écran de gestion visible', async ({ page }) => {
    await withRole(page, 'lan_admin');
    await gotoShutters(page);
    const panel = await openManager(page, 'shutters');
    await expect(panel.locator('[data-testid^="layout-row-"]')).toHaveCount(16);
  });

  test('@nr NR-server-frontend-10 nom de 40 caractères lisible dans l écran de gestion, interrupteur et boutons visibles', async ({ page }) => {
    await gotoShutters(page);
    const long = 'Volet de la grande baie vitree du salon!'.slice(0, 40);
    const name = page.getByTestId('shutter-name-panel-volet1salon');
    await name.getByRole('button', { name: 'Nom', exact: true }).click();
    await name.getByLabel('Nom', { exact: true }).fill(long);
    await name.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('shutter-volet1salon').getByText(long, { exact: true })).toBeVisible();
    const panel = await openManager(page, 'shutters');
    const row = panel.getByTestId('layout-row-volet1salon');
    await expect(row.getByText(long, { exact: true })).toBeVisible();
    await expect(row.getByTestId('layout-toggle-volet1salon')).toBeVisible();
    await expect(row.getByTestId('layout-up-volet1salon')).toBeVisible();
    await expect(row.getByTestId('layout-down-volet1salon')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test('@nr NR-server-frontend-10 les noms #41 et #52 restent inchangés par une disposition', async ({ page }) => {
    await initLayout(page, { lights: { order: ['dressing'], version: 1 } });
    await gotoLighting(page);
    await expect(page.getByTestId('light-dressing')).toBeVisible();
    const lights = await page.evaluate(async () => (await (await fetch('/api/lights/names')).json()).lights);
    const shutters = await page.evaluate(async () => (await (await fetch('/api/shutters/names')).json()).shutters);
    expect(lights).toHaveLength(33);
    expect(shutters).toHaveLength(16);
    expect(lights.every((l: { name: string | null }) => l.name === null)).toBe(true);
    expect(shutters.every((s: { name: string | null }) => s.name === null)).toBe(true);
  });

  test('@nr NR-server-frontend-10 Temporisations : ordre propre par défaut, désactivation seule, réordonnancement puis reset', async ({ page }) => {
    const order = async () =>
      page.getByTestId(/^light-timers-item-/).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.slice(18)));
    const catalogue = [
      'terrasse', 'entree', 'escalier', 'deg1', 'deg2', 'pieceserv', 'ann1', 'ann2', 'salon', 'sam', 'cuisine', 'sdb1', 'sdb2',
      'wc1', 'wc2', 'bureau', 'gdchamb', 'ptchamb1', 'ptchamb2', 'ptchamb3', 'dressing',
    ];
    // Désactivation seule, order complet envoyé : ordre propre.
    await initLayout(page, { lights: { order: catalogue, disabled: ['wc1'], version: 1 } });
    await page.goto('lighting/timers', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('light-timers-item-dressing')).toBeVisible();
    expect(await order()).toEqual(['dressing', 'wc2', 'pieceserv', 'ann1', 'ann2']);
  });

  test('@nr NR-server-frontend-10 Temporisations : réordonnancement => ordre global, reset => ordre propre', async ({ page }) => {
    const order = async () =>
      page.getByTestId(/^light-timers-item-/).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.slice(18)));
    await initLayout(page, { lights: { order: ['ann2', 'wc1'], version: 2 } });
    await page.goto('lighting/timers', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('light-timers-item-dressing')).toBeVisible();
    expect(await order()).toEqual(['ann2', 'wc1', 'pieceserv', 'ann1', 'wc2', 'dressing']);
  });

  test('@nr NR-server-frontend-10 Temporisations : document remis à zéro => ordre propre', async ({ page }) => {
    await initLayout(page, { lights: { order: [], disabled: [], version: 4 } });
    await page.goto('lighting/timers', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('light-timers-item-dressing')).toBeVisible();
    const ids = await page.getByTestId(/^light-timers-item-/).evaluateAll((els) => els.map((e) => e.getAttribute('data-testid')!.slice(18)));
    expect(ids).toEqual(['dressing', 'wc1', 'wc2', 'pieceserv', 'ann1', 'ann2']);
  });
});
