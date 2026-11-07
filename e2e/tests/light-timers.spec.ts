/**
 * Temporisations des lumières (lumieres-temporisees-2026-11-003), portail local de la gateway.
 * NR: NR-server-frontend-7 essensys-hub/essensys-server-frontend#10
 *
 * Build démo (API simulée dans la page) sous la fixture no-armoire : aucune requête vers une armoire.
 * Rôle : sessionStorage `essensys_demo_lan_role` (mockFetch) ; IAM LAN actif : /health répond lan_iam_enabled.
 */
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/no-armoire';
import { recordFetch, recordedCalls } from '../fixtures/record-fetch';
import { currentDevice, currentTarget } from '../pages/project';

const timerWrites = async (page: Page) =>
  (await recordedCalls(page)).filter((c) => c.url.includes('/api/admin/lights/timers'));

const withRole = async (page: Page, role: 'lan_admin' | 'lan_user') => {
  await page.route('**/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lan_iam_enabled: true }) }),
  );
  await page.addInitScript((r) => sessionStorage.setItem('essensys_demo_lan_role', r), role);
};

/** Lien « Temporisations » du menu (tiroir sur mobile). */
const menuLink = async (page: Page, iam = false) => {
  const burger = page.getByRole('button', { name: 'Ouvrir le menu' });
  if (iam) {
    // IAM actif : le gabarit est remonté quand le mode et la session sont résolus (le tiroir se referme).
    // « Mon compte » n'apparaît qu'ensuite : on rouvre le tiroir tant qu'il n'est pas là.
    const account = page.getByRole('link', { name: 'Mon compte' });
    await expect(async () => {
      if (!(await account.isVisible()) && (await burger.isVisible())) await burger.click();
      await expect(account).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 10000 });
  } else if (await burger.isVisible()) {
    await burger.click();
  }
  return page.getByRole('link', { name: 'Temporisations', exact: true });
};

const gotoTimers = (page: Page) => page.goto('lighting/timers', { waitUntil: 'domcontentloaded' });
const gotoLighting = (page: Page) => page.goto('lighting', { waitUntil: 'domcontentloaded' });

test.describe('temporisations des lumières — portail local', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    void page; // fixture no-armoire installée avant chaque test
    test.skip(currentTarget(testInfo) !== 'local', 'Portail local uniquement (le portail cloud a sa propre spec).');
    test.fixme(currentDevice(testInfo) === 'android', 'Débordement horizontal de la mise en page mobile, antérieur à la feature');
  });

  test('@nr NR-server-frontend-7 liste des six lumieres avec inconnue, Jamais, 1 h, 7 min', async ({ page }) => {
    await gotoTimers(page);
    await expect(page.getByRole('heading', { name: 'Temporisations', level: 1 })).toBeVisible();
    const items = page.getByTestId('light-timers-list').getByRole('listitem');
    await expect(items).toHaveCount(6);
    await expect(page.getByTestId('light-timers-item-dressing')).toContainText('15 min');
    await expect(page.getByTestId('light-timers-item-wc1')).toContainText('inconnue');
    await expect(page.getByTestId('light-timers-item-wc2')).toContainText('Jamais');
    await expect(page.getByTestId('light-timers-item-pieceserv')).toContainText('1 h');
    await expect(page.getByTestId('light-timers-item-ann1')).toContainText('inconnue');
    await expect(page.getByTestId('light-timers-item-ann2')).toContainText('7 min');
  });

  test('@nr NR-server-frontend-7 menu Temporisations visible quand l IAM est desactive', async ({ page }) => {
    await gotoLighting(page);
    await expect(await menuLink(page)).toBeVisible();
  });

  test('@nr NR-server-frontend-7 Dressing : meme valeur dans le menu et dans la fiche', async ({ page }) => {
    await gotoTimers(page);
    const fromMenu = await page.getByTestId('light-timer-dressing-value').innerText();
    expect(fromMenu).toBe('15 min');

    await gotoLighting(page);
    const panel = page.getByTestId('light-timer-panel-dressing');
    await panel.getByRole('button', { name: 'Temporisation' }).click();
    await expect(panel.getByTestId('light-timer-dressing-value')).toHaveText(fromMenu);
    // Les lumières hors catalogue n'ont pas le réglage.
    await expect(page.getByTestId('light-timer-panel-salon')).toHaveCount(0);
    await expect(page.locator('[data-testid^="light-timer-panel-"]')).toHaveCount(6);
  });

  test('@nr NR-server-frontend-7 valeur libre 7 envoie PUT {minutes:7} et relit la valeur', async ({ page }) => {
    await recordFetch(page);
    await gotoLighting(page);
    const panel = page.getByTestId('light-timer-panel-wc2');
    await panel.getByRole('button', { name: 'Temporisation' }).click();
    await panel.getByLabel('Autre (1 à 255 min)').fill('7');
    await panel.getByRole('button', { name: 'Régler' }).click();

    await expect(panel.getByRole('status')).toContainText('WC 2 : 7 min envoyé');
    const writes = await timerWrites(page);
    expect(writes).toHaveLength(1);
    expect(writes[0].method).toBe('PUT');
    expect(new URL(writes[0].url, 'http://x').pathname).toBe('/api/admin/lights/timers/wc2');
    expect(writes[0].body).toEqual({ minutes: 7 });
    // Relecture à 5 s : la valeur de l'armoire est affichée.
    await expect(panel.getByTestId('light-timer-wc2-value')).toHaveText("en attente de l'armoire");
    await expect(panel.getByTestId('light-timer-wc2-value')).toHaveText('7 min', { timeout: 9000 });
  });

  test('@nr NR-server-frontend-7 raccourci Jamais envoie minutes 0', async ({ page }) => {
    await recordFetch(page);
    await gotoTimers(page);
    await page.getByTestId('light-timer-dressing').getByRole('button', { name: 'Jamais' }).click();
    await expect.poll(async () => (await timerWrites(page)).map((c) => c.body)).toEqual([{ minutes: 0 }]);
  });

  test('@nr NR-server-frontend-7 valeurs 300 et 0 refusees sans requete', async ({ page }) => {
    await recordFetch(page);
    await gotoTimers(page);
    const card = page.getByTestId('light-timer-dressing');
    for (const bad of ['300', '0', '7.5', '']) {
      await card.getByLabel('Autre (1 à 255 min)').fill(bad);
      await card.getByRole('button', { name: 'Régler' }).click();
      await expect(card.getByRole('alert')).toBeVisible();
    }
    expect(await timerWrites(page)).toHaveLength(0);
  });

  test('@nr NR-server-frontend-7 masque pour lan_user quand l IAM est actif', async ({ page }) => {
    await withRole(page, 'lan_user');
    await gotoLighting(page);
    await expect(page.getByRole('heading', { name: 'Éclairage', level: 1 })).toBeVisible();
    await expect(await menuLink(page, true)).toHaveCount(0);
    await expect(page.locator('[data-testid^="light-timer-panel-"]')).toHaveCount(0);

    await gotoTimers(page);
    await expect(page.getByTestId('light-timers-forbidden')).toBeVisible();
    await expect(page.getByTestId('light-timers-list')).toHaveCount(0);
  });

  test('@nr NR-server-frontend-7 visible pour lan_admin quand l IAM est actif', async ({ page }) => {
    await withRole(page, 'lan_admin');
    await gotoLighting(page);
    await expect(await menuLink(page, true)).toBeVisible();
    await expect(page.locator('[data-testid^="light-timer-panel-"]')).toHaveCount(6);
  });

  test('@nr NR-server-frontend-7 controles desactives hors ligne', async ({ page }) => {
    await recordFetch(page, { armoireOffline: true });
    await gotoTimers(page);
    const card = page.getByTestId('light-timer-dressing');
    await expect(card.getByText('Armoire hors ligne')).toBeVisible();
    for (const name of ['15 min', '30 min', '1 h', 'Jamais', 'Régler']) {
      await expect(card.getByRole('button', { name, exact: true })).toBeDisabled();
    }
    await expect(card.getByLabel('Autre (1 à 255 min)')).toBeDisabled();
  });
});
