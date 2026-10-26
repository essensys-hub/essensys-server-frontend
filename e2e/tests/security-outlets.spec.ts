/**
 * Prises de sécurité (security-outlets-2026-10-011), portail local de la gateway.
 * NR: NR-server-frontend-6 essensys-hub/essensys-server-frontend#6
 */
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/no-armoire';
import { recordFetch, recordedCalls } from '../fixtures/record-fetch';
import { currentDevice, currentTarget } from '../pages/project';

const injects = async (page: Page) => (await recordedCalls(page)).filter((c) => c.url.includes('/api/admin/inject'));
/** Lots envoyés, ramenés à des tableaux de couples (l'API locale reçoit un tableau). */
const injectedBatches = async (page: Page) =>
  (await injects(page)).map((c) => (Array.isArray(c.body) ? c.body : [c.body]));

// Chemin relatif : reste sous le préfixe de la cible (ex. /demo/ sur mon.essensys.fr).
const gotoSecurity = (page: Page) => page.goto('security', { waitUntil: 'domcontentloaded' });

test.describe('prises de sécurité — portail local', () => {
  test.beforeEach(async ({}, testInfo) => {
    test.skip(currentTarget(testInfo) !== 'local', 'Page Sécurité du portail local uniquement (le portail cloud a sa propre spec).');
    // Débordement horizontal existant (en-tête mobile à 980 px sur Pixel 7, pages Sécurité et Volets,
    // antérieur à cette feature) : les boutons sortent de la zone cliquable sous Chromium mobile.
    test.fixme(currentDevice(testInfo) === 'android', 'Débordement horizontal de la mise en page mobile, antérieur à security-outlets');
  });

  test('@nr NR-server-frontend-6 couper envoie 590 et 623 a 1 apres confirmation', async ({ page }) => {
    await recordFetch(page);
    await gotoSecurity(page);
    const card = page.getByTestId('security-outlets');
    await expect(card.getByTestId('security-outlets-state')).toHaveText('Prises pilotées');

    await card.getByRole('button', { name: 'Couper', exact: true }).click();
    expect(await injects(page)).toHaveLength(0);
    await card.getByRole('button', { name: 'Confirmer la coupure' }).click();

    await expect(card.getByRole('status')).toContainText('Coupure des prises de sécurité');
    expect(await injectedBatches(page)).toEqual([[{ k: 590, v: '1' }, { k: 623, v: '1' }]]);
  });

  test('@nr NR-server-frontend-6 retablir envoie 590 et 623 a 2', async ({ page }) => {
    await recordFetch(page);
    await gotoSecurity(page);
    await page.getByTestId('security-outlets').getByRole('button', { name: 'Rétablir' }).click();
    await expect.poll(() => injectedBatches(page)).toEqual([[{ k: 590, v: '1' }, { k: 623, v: '2' }]]);
  });

  test('@nr NR-server-frontend-6 annuler la confirmation n envoie rien', async ({ page }) => {
    await recordFetch(page);
    await gotoSecurity(page);
    const card = page.getByTestId('security-outlets');
    await card.getByRole('button', { name: 'Couper', exact: true }).click();
    await card.getByRole('button', { name: 'Annuler' }).click();
    await expect(card.getByRole('button', { name: 'Couper', exact: true })).toBeVisible();
    expect(await injects(page)).toHaveLength(0);
  });

  test('@nr NR-server-frontend-6 commandes desactivees hors ligne', async ({ page }) => {
    await recordFetch(page, { armoireOffline: true });
    await gotoSecurity(page);
    const card = page.getByTestId('security-outlets');
    await expect(card.getByText('Armoire hors ligne')).toBeVisible();
    await expect(card.getByRole('button', { name: 'Couper', exact: true })).toBeDisabled();
    await expect(card.getByRole('button', { name: 'Rétablir' })).toBeDisabled();
  });

  test('etat inconnu sans indice 440', async ({ page }) => {
    await recordFetch(page, { withoutOutletsState: true });
    await gotoSecurity(page);
    await expect(page.getByTestId('security-outlets-state')).toHaveText('État inconnu');
  });
});
