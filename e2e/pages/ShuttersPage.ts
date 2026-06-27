import type { Page, TestInfo } from '@playwright/test';
import { expect } from '../fixtures/no-armoire';
import { isCompactViewport } from './project';

export class ShuttersPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto('/shutters', { waitUntil: 'domcontentloaded' });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page.locator('body')).toBeVisible();
    await expect(this.page.getByText(/volet|volets|shutter|ouvrant/i).first()).toBeVisible({ timeout: 15000 });
    await expect(this.page.getByText(/Unexpected token|TypeError|ReferenceError/i)).toHaveCount(0);
  }

  async expectResponsiveShell(testInfo: TestInfo): Promise<void> {
    const viewport = this.page.viewportSize();
    await expect(this.page.locator('body')).toBeVisible();
    const horizontalOverflow = await this.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(horizontalOverflow, `Pas de débordement horizontal sur ${testInfo.project.name}`).toBeFalsy();

    if (viewport && viewport.width >= 1024 && !isCompactViewport(testInfo)) {
      await expect(this.page.locator('nav, aside, [role="navigation"]').first()).toBeVisible({ timeout: 10000 });
    }
  }

  async dryRunFirstControl(): Promise<void> {
    const dryRun = await this.page.evaluate(async () => {
      const response = await fetch('/api/admin/inject?test_mode=dry_run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Essensys-Test-Mode': 'dry-run',
        },
        body: JSON.stringify({ k: 0, v: 'dry-run-ui-test' }),
      });
      return response.json();
    });

    expect(dryRun).toMatchObject({ dry_run: true, guard: 'no-armoire' });
  }
}
