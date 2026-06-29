import { test, expect } from '../fixtures/no-armoire';
import { currentTarget } from '../pages/project';

async function dismissCookiesIfPresent(page: import('@playwright/test').Page) {
  const accept = page.getByRole('button', { name: 'Accepter' });
  const refuse = page.getByRole('button', { name: 'Refuser' });

  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
    return;
  }
  if (await refuse.isVisible().catch(() => false)) {
    await refuse.click();
  }
}

test.describe('trusted devices UI', () => {
  test('Mon compte expose la gestion des appareils de confiance', async ({ page }, testInfo) => {
    test.skip(currentTarget(testInfo) !== 'support', 'Ce scénario cible le front mocké en mode démo.');

    await page.goto('/settings/account', { waitUntil: 'domcontentloaded' });
    await dismissCookiesIfPresent(page);
    await expect(page.getByRole('heading', { name: 'Mon compte' })).toBeVisible();
    await expect(page.getByText('Appareils de confiance')).toBeVisible();
    await expect(page.getByText('Faire confiance 60 jours')).toBeVisible();
    await expect(page.getByText('iPhone Nicolas')).toBeVisible();
  });

  test('Administration expose l’appairage MAC permanent', async ({ page }, testInfo) => {
    test.skip(currentTarget(testInfo) !== 'support', 'Ce scénario cible le front mocké en mode démo.');

    await page.goto('/settings/users', { waitUntil: 'domcontentloaded' });
    await dismissCookiesIfPresent(page);
    await expect(page.getByRole('heading', { name: 'Comptes .local' })).toBeVisible();
    await expect(page.getByText('Appairage MAC permanent')).toBeVisible();
    await expect(page.getByText('Client détecté')).toBeVisible();
    await expect(page.getByText('Tablette entrée')).toBeVisible();
  });
});
