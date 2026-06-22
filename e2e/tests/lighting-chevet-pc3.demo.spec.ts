import { test, expect } from '@playwright/test';

test.describe('demo — chevet PC3 dry-run (mocks navigateur)', () => {
  test('page régression valide chevet PC3 sans guid', async ({ page }) => {
    await page.goto('/admin/regression');
    await expect(page.getByRole('heading', { name: 'Tests de non-régression' })).toBeVisible();
    await page.getByRole('button', { name: /Lancer tous les tests/i }).click();
    await expect(page.getByText('Chevet PC3 — allumer (dry-run)')).toBeVisible();
    await expect(page.getByText(/4\/4 réussis/)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(/guid présent/i)).toHaveCount(0);
  });
});
