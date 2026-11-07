/**
 * Noms personnalisés des volets et stores (noms-volets-2026-11-005), portail local de la gateway.
 * NR: NR-server-frontend-9 essensys-hub/essensys-feature-lifecycle#41
 *
 * Build démo (API simulée dans la page) sous la fixture no-armoire : aucune requête vers une armoire.
 * Rôle : sessionStorage `essensys_demo_lan_role` (mockFetch) ; IAM LAN actif : /health répond lan_iam_enabled.
 */
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/no-armoire';
import { recordFetch, recordedCalls } from '../fixtures/record-fetch';
import { currentDevice, currentTarget } from '../pages/project';

const nameWrites = async (page: Page) =>
  (await recordedCalls(page)).filter((c) => c.url.includes('/api/admin/shutters/names'));

const withRole = async (page: Page, role: 'lan_admin' | 'lan_user') => {
  await page.route('**/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lan_iam_enabled: true }) }),
  );
  await page.addInitScript((r) => sessionStorage.setItem('essensys_demo_lan_role', r), role);
};

const gotoShutters = (page: Page) => page.goto('shutters', { waitUntil: 'domcontentloaded' });

const rename = async (page: Page, id: string, value: string) => {
  const panel = page.getByTestId(`shutter-name-panel-${id}`);
  if (!(await panel.getByLabel('Nom', { exact: true }).isVisible())) {
    await panel.getByRole('button', { name: 'Nom', exact: true }).click();
  }
  await panel.getByLabel('Nom', { exact: true }).fill(value);
  return panel;
};

test.describe('noms des volets — portail local', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    void page;
    test.skip(currentTarget(testInfo) !== 'local', 'Portail local uniquement (le portail cloud a sa propre spec).');
    test.fixme(currentDevice(testInfo) === 'android', 'Débordement horizontal de la mise en page mobile, antérieur à la feature');
  });

  test('@nr NR-server-frontend-9 l administrateur renomme Volet 1 Salon : liste, Temps de course, message, sans rechargement', async ({ page }) => {
    await recordFetch(page);
    await gotoShutters(page);
    const panel = await rename(page, 'volet1salon', '  Volet baie vitrée ');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();

    await expect(panel.getByRole('status')).toContainText('Nom enregistré : Volet baie vitrée');
    await expect(page.getByTestId('shutter-volet1salon').getByText('Volet baie vitrée', { exact: true })).toBeVisible();
    await expect(page.getByTestId('shutter-time-volet1salon')).toContainText('Volet baie vitrée');
    const writes = await nameWrites(page);
    expect(writes).toHaveLength(1);
    expect(writes[0].method).toBe('PUT');
    expect(new URL(writes[0].url, 'http://x').pathname).toBe('/api/admin/shutters/names/volet1salon');
    expect(writes[0].body).toEqual({ name: 'Volet baie vitrée' });

    // Message après une commande (mode essai : aucun ordre réel, le nom affiché est utilisé).
    await page.getByTestId('shutter-volet1salon').getByRole('button', { name: 'Ouvrir' }).click();
    await expect(page.getByText('Volet baie vitrée : Ouvert')).toBeVisible();

  });

  test('@nr NR-server-frontend-9 renommer n emet aucun ordre vers l armoire', async ({ page }) => {
    await recordFetch(page);
    await gotoShutters(page);
    const panel = await rename(page, 'voletbureau', 'Atelier');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('shutter-voletbureau').getByText('Atelier', { exact: true })).toBeVisible();
    const calls = await recordedCalls(page);
    expect(calls.filter((c) => c.url.includes('/api/admin/inject') || c.url.includes('/web/actions'))).toHaveLength(0);
  });

  test('@nr NR-server-frontend-9 Nom d origine envoie name null et rend le nom d origine', async ({ page }) => {
    await recordFetch(page);
    await gotoShutters(page);
    let panel = await rename(page, 'store', 'Store terrasse');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('shutter-store').getByText('Store terrasse', { exact: true })).toBeVisible();
    await expect(page.getByTestId('shutter-time-store')).toContainText('Store terrasse');

    panel = page.getByTestId('shutter-name-panel-store');
    await expect(panel.getByText("Nom d'origine : Store (banne)")).toBeVisible();
    await panel.getByRole('button', { name: "Nom d'origine", exact: true }).click();
    await expect(panel.getByRole('status')).toContainText("Nom d'origine rétabli : Store (banne)");
    await expect(page.getByTestId('shutter-store').getByText('Store (banne)', { exact: true })).toBeVisible();
    const writes = await nameWrites(page);
    expect(writes.map((w) => w.body)).toEqual([{ name: 'Store terrasse' }, { name: null }]);
  });

  test('@nr NR-server-frontend-9 nom vide ou de 41 caracteres refuse sans requete', async ({ page }) => {
    await recordFetch(page);
    await gotoShutters(page);
    for (const bad of ['', '   ', 'x'.repeat(41), 'a<b']) {
      const panel = await rename(page, 'voletbureau', bad);
      await panel.getByRole('button', { name: 'Enregistrer' }).click();
      await expect(panel.getByRole('alert')).toBeVisible();
    }
    expect(await nameWrites(page)).toHaveLength(0);
  });

  test('@nr NR-server-frontend-9 Store "nord" et a&b affiches comme texte', async ({ page }) => {
    await recordFetch(page);
    await gotoShutters(page);
    let panel = await rename(page, 'store', 'Store "nord"');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('shutter-store').getByText('Store "nord"', { exact: true })).toBeVisible();
    panel = await rename(page, 'voletsdb', 'a&b');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('shutter-voletsdb').getByText('a&b', { exact: true })).toBeVisible();
  });

  test('@nr NR-server-frontend-9 nom de 40 caracteres lisible dans la liste et Temps de course', async ({ page }) => {
    await gotoShutters(page);
    const long = 'Volet de la grande baie vitree du salon!'.slice(0, 40);
    expect(Array.from(long)).toHaveLength(40);
    const panel = await rename(page, 'volet1salon', long);
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    const item = page.getByTestId('shutter-volet1salon');
    await expect(item.getByText(long, { exact: true })).toBeVisible();
    await expect(item.getByRole('button', { name: 'Ouvrir' })).toBeVisible();
    await expect(item.getByRole('button', { name: 'Fermer' })).toBeVisible();
    await expect(page.getByTestId('shutter-time-volet1salon').getByText(long, { exact: true })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  });

  test('@nr NR-server-frontend-9 erreur 503 serveur : message clair', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_names_error', '503'));
    await gotoShutters(page);
    const panel = await rename(page, 'voletbureau', 'Atelier');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel.getByRole('alert')).toContainText('indisponible');
  });

  test('@nr NR-server-frontend-9 erreur 403 serveur : message clair', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_names_error', '403'));
    await gotoShutters(page);
    const panel = await rename(page, 'voletbureau', 'Atelier');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel.getByRole('alert')).toContainText("Réservé à l'administrateur");
  });

  test('@nr NR-server-frontend-9 lecture impossible : noms d origine, sans erreur bloquante', async ({ page }) => {
    await page.route('**/api/shutters/names', (route) => route.fulfill({ status: 500, body: 'x' }));
    await gotoShutters(page);
    await expect(page.getByTestId('shutter-voletbureau').getByText('Volet Bureau', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Volets & Stores', level: 1 })).toBeVisible();
  });

  test('@nr NR-server-frontend-9 masque pour lan_user quand l IAM est actif, nom affiche', async ({ page }) => {
    await withRole(page, 'lan_user');
    await gotoShutters(page);
    await expect(page.getByTestId('shutter-voletbureau')).toBeVisible();
    await expect(page.locator('[data-testid^="shutter-name-panel-"]')).toHaveCount(0);
  });

  test('@nr NR-server-frontend-9 visible pour lan_admin quand l IAM est actif', async ({ page }) => {
    await withRole(page, 'lan_admin');
    await gotoShutters(page);
    await expect(page.locator('[data-testid^="shutter-name-panel-"]')).toHaveCount(16);
  });

  test('@nr NR-server-frontend-9 les noms des lumieres restent inchanges apres un renommage de volet', async ({ page }) => {
    await gotoShutters(page);
    const panel = await rename(page, 'volet1salon', 'Volet baie vitrée');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel.getByRole('status')).toBeVisible();
    const lights = await page.evaluate(async () => (await (await fetch('/api/lights/names')).json()).lights);
    expect(lights).toHaveLength(33);
    expect(lights.every((l: { name: string | null }) => l.name === null)).toBe(true);
  });
});
