// @feature: essensys-kitchen-shutter-test-console-2026-06-031
// @spec: openspec/changes/essensys-kitchen-shutter-test-console-2026-06-031/specs/no-armoire-ux-regression/spec.md
// @devices: desktop,iphone,ipad
// @no-armoire
import path from 'node:path';
import { test, expect } from '../fixtures/no-armoire';
import { currentDevice } from '../pages/project';

const dangerousPaths = [
  '/api/admin/inject',
  '/api/portal/inject',
  '/api/web/actions',
  '/scenarios/launch',
  '/api/myactions',
];

function safeName(value: string): string {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'root';
}

test.describe('console scénario cuisine — UX matrix no-armoire', () => {
  test('affiche et simule les payloads legacy cuisine sans action armoire avec trigger scenario 590 vaut 1', async ({ page }, testInfo) => {
    const dangerousRequests: string[] = [];
    page.on('request', (request) => {
      const url = new URL(request.url());
      if (dangerousPaths.some((dangerousPath) => url.pathname.includes(dangerousPath))) {
        dangerousRequests.push(`${request.method()} ${url.pathname}`);
      }
    });

    await page.goto('/admin/kitchen-shutter-test', { waitUntil: 'domcontentloaded' });

    await expect(page.getByRole('heading', { name: 'Console scénario cuisine' })).toBeVisible();
    await expect(page.getByTestId('no-armoire-banner')).toContainText('Mode test no-armoire');
    await expect(page.getByTestId('kitchen-action-open-kitchen-1')).toContainText('Ouvrir volet cuisine 1');
    await expect(page.getByTestId('kitchen-action-open-kitchen-2')).toContainText('Ouvrir volet cuisine 2');
    await expect(page.getByTestId('kitchen-action-open-kitchen-both')).toContainText('Ouvrir les deux volets cuisine');
    await expect(page.getByTestId('kitchen-action-close-kitchen-1')).toContainText('Fermer volet cuisine 1');
    await expect(page.getByTestId('kitchen-action-close-kitchen-2')).toContainText('Fermer volet cuisine 2');
    await expect(page.getByTestId('kitchen-action-close-kitchen-both')).toContainText('Fermer les deux volets cuisine');

    await page.getByTestId('kitchen-action-open-kitchen-both').click();
    await expect(page.getByTestId('last-simulated-action')).toContainText('Ouvrir les deux volets cuisine');
    await expect(page.getByTestId('action-payload')).toContainText('{ "k": 619, "v": "3" }');
    await expect(page.getByTestId('trigger-payload')).toContainText('{ "k": 590, "v": "1" }');

    await page.getByTestId('kitchen-action-close-kitchen-both').click();
    await expect(page.getByTestId('last-simulated-action')).toContainText('Fermer les deux volets cuisine');
    await expect(page.getByTestId('action-payload')).toContainText('{ "k": 622, "v": "3" }');
    await expect(page.getByTestId('trigger-payload')).toContainText('{ "k": 590, "v": "1" }');

    const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(horizontalOverflow, `${testInfo.project.name} ne doit pas déborder horizontalement`).toBeFalsy();
    expect(dangerousRequests).toEqual([]);

    await page.screenshot({
      path: path.join('artifacts', 'screenshots', `${testInfo.project.name}-${safeName(currentDevice(testInfo))}-kitchen-shutter-test-console.png`),
      fullPage: true,
    });
  });
});
