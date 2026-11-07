/**
 * Noms personnalisés des lumières (noms-lumieres-2026-11-004), portail local de la gateway.
 * NR: NR-server-frontend-8 essensys-hub/essensys-feature-lifecycle#41
 *
 * Build démo (API simulée dans la page) sous la fixture no-armoire : aucune requête vers une armoire.
 * Rôle : sessionStorage `essensys_demo_lan_role` (mockFetch) ; IAM LAN actif : /health répond lan_iam_enabled.
 */
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/no-armoire';
import { recordFetch, recordedCalls } from '../fixtures/record-fetch';
import { currentDevice, currentTarget } from '../pages/project';

const nameWrites = async (page: Page) =>
  (await recordedCalls(page)).filter((c) => c.url.includes('/api/admin/lights/names'));

const withRole = async (page: Page, role: 'lan_admin' | 'lan_user') => {
  await page.route('**/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lan_iam_enabled: true }) }),
  );
  await page.addInitScript((r) => sessionStorage.setItem('essensys_demo_lan_role', r), role);
};

const gotoLighting = (page: Page) => page.goto('lighting', { waitUntil: 'domcontentloaded' });
const gotoTimers = (page: Page) => page.goto('lighting/timers', { waitUntil: 'domcontentloaded' });

const rename = async (page: Page, id: string, value: string) => {
  const panel = page.getByTestId(`light-name-panel-${id}`);
  if (!(await panel.getByLabel('Nom', { exact: true }).isVisible())) {
    await panel.getByRole('button', { name: 'Nom', exact: true }).click();
  }
  await panel.getByLabel('Nom', { exact: true }).fill(value);
  return panel;
};

test.describe('noms des lumières — portail local', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    void page;
    test.skip(currentTarget(testInfo) !== 'local', 'Portail local uniquement (le portail cloud a sa propre spec).');
    test.fixme(currentDevice(testInfo) === 'android', 'Débordement horizontal de la mise en page mobile, antérieur à la feature');
  });

  test('@nr NR-server-frontend-8 l administrateur renomme Dressing en WC 3 : liste, temporisations, sans rechargement', async ({ page }) => {
    await recordFetch(page);
    await gotoLighting(page);
    const panel = await rename(page, 'dressing', '  WC 3 ');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();

    await expect(panel.getByRole('status')).toContainText('Nom enregistré : WC 3');
    await expect(page.getByTestId('light-dressing').getByText('WC 3', { exact: true })).toBeVisible();
    const writes = await nameWrites(page);
    expect(writes).toHaveLength(1);
    expect(writes[0].method).toBe('PUT');
    expect(new URL(writes[0].url, 'http://x').pathname).toBe('/api/admin/lights/names/dressing');
    expect(writes[0].body).toEqual({ name: 'WC 3' });

    // Renommer n'émet aucun ordre vers l'armoire.
    const calls = await recordedCalls(page);
    expect(calls.filter((c) => c.url.includes('/api/admin/inject') || c.url.includes('/web/actions'))).toHaveLength(0);

    // Même nom dans l'écran Temporisations (navigation interne : la réplique est partagée).
    await page.evaluate(() => { window.history.pushState({}, '', window.location.pathname.replace(/lighting\/?$/, 'lighting/timers')); window.dispatchEvent(new PopStateEvent('popstate')); });
    await expect(page.getByTestId('light-timers-item-dressing')).toContainText('WC 3');
  });

  test('@nr NR-server-frontend-8 Nom d origine envoie name null et rend le nom d origine', async ({ page }) => {
    await recordFetch(page);
    await gotoLighting(page);
    let panel = await rename(page, 'salon', 'Séjour');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('light-salon').getByText('Séjour', { exact: true })).toBeVisible();

    panel = page.getByTestId('light-name-panel-salon');
    await expect(panel.getByText("Nom d'origine : Salon")).toBeVisible();
    await panel.getByRole('button', { name: "Nom d'origine", exact: true }).click();
    await expect(panel.getByRole('status')).toContainText("Nom d'origine rétabli : Salon");
    await expect(page.getByTestId('light-salon').getByText('Salon', { exact: true })).toBeVisible();
    const writes = await nameWrites(page);
    expect(writes.map((w) => w.body)).toEqual([{ name: 'Séjour' }, { name: null }]);
  });

  test('@nr NR-server-frontend-8 nom vide ou de 41 caracteres refuse sans requete', async ({ page }) => {
    await recordFetch(page);
    await gotoLighting(page);
    for (const bad of ['', '   ', 'x'.repeat(41), 'a<b']) {
      const panel = await rename(page, 'bureau', bad);
      await panel.getByRole('button', { name: 'Enregistrer' }).click();
      await expect(panel.getByRole('alert')).toBeVisible();
    }
    expect(await nameWrites(page)).toHaveLength(0);
  });

  test('@nr NR-server-frontend-8 nom contenant du HTML affiche comme texte', async ({ page }) => {
    await recordFetch(page);
    await gotoLighting(page);
    const panel = await rename(page, 'cuisine', 'a&b "c"');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByTestId('light-cuisine').getByText('a&b "c"', { exact: true })).toBeVisible();
  });

  test('@nr NR-server-frontend-8 erreur 503 serveur : message clair', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_names_error', '503'));
    await gotoLighting(page);
    const panel = await rename(page, 'bureau', 'Atelier');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel.getByRole('alert')).toContainText('indisponible');
  });

  test('@nr NR-server-frontend-8 erreur 403 serveur : message clair', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_names_error', '403'));
    await gotoLighting(page);
    const panel = await rename(page, 'bureau', 'Atelier');
    await panel.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(panel.getByRole('alert')).toContainText("Réservé à l'administrateur");
  });

  test('@nr NR-server-frontend-8 lecture impossible : noms d origine, sans erreur bloquante', async ({ page }) => {
    await page.route('**/api/lights/names', (route) => route.fulfill({ status: 500, body: 'x' }));
    await gotoLighting(page);
    await expect(page.getByTestId('light-dressing').getByText('Dressing', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Éclairage', level: 1 })).toBeVisible();
  });

  test('@nr NR-server-frontend-8 masque pour lan_user quand l IAM est actif, nom affiche', async ({ page }) => {
    await withRole(page, 'lan_user');
    await gotoLighting(page);
    await expect(page.getByRole('heading', { name: 'Éclairage', level: 1 })).toBeVisible();
    await expect(page.getByTestId('light-dressing')).toBeVisible();
    await expect(page.locator('[data-testid^="light-name-panel-"]')).toHaveCount(0);
  });

  test('@nr NR-server-frontend-8 visible pour lan_admin quand l IAM est actif', async ({ page }) => {
    await withRole(page, 'lan_admin');
    await gotoLighting(page);
    await expect(page.locator('[data-testid^="light-name-panel-"]')).toHaveCount(33);
  });

  test('@nr NR-server-frontend-8 ecran Temporisations avec les noms d origine', async ({ page }) => {
    await gotoTimers(page);
    await expect(page.getByTestId('light-timers-item-pieceserv')).toContainText('Pièce de service');
  });
});
