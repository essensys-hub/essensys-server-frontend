import { test, expect } from '@playwright/test';

test.describe('demo — navigation', () => {
  test('dashboard et scénarios chargent', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: 'Tableau de bord' })).toBeVisible();

    await page.goto('/scenarios');
    await expect(page.getByRole('heading', { name: 'Scénarios' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Je sors' })).toBeVisible();
    await expect(page.getByText(/Unexpected token/i)).toHaveCount(0);
  });

  test('menu chauffage', async ({ page }) => {
    await page.goto('/heating');
    await expect(page.getByRole('heading', { name: 'Chauffage', exact: true })).toBeVisible();
  });
});
