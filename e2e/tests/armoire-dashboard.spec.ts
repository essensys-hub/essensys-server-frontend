import { test, expect } from '../fixtures/no-armoire';
import { currentTarget } from '../pages/project';

test.describe('Dashboard armoire — panneau état', () => {
  test('affiche le bandeau état armoire sur /dashboard', async ({ page }, testInfo) => {
    const target = currentTarget(testInfo);
    test.skip(target === 'remote', 'Panneau armoire gateway-only (hors portail cloud)');

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: 'État armoire' })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Connectée')).toBeVisible();
    await expect(page.getByText('d8:80:39:e1:35:ba')).toBeVisible();
    await expect(page.getByText(/table d'échange/i)).toBeVisible();
  });
});
