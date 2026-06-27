import path from 'node:path';
import { test, expect } from '../fixtures/no-armoire';
import { currentDevice, currentTarget, isCompactViewport } from '../pages/project';

const pagesByTarget = {
  support: ['/', '/dashboard'],
  local: ['/dashboard', '/shutters', '/scenarios'],
  remote: ['/dashboard', '/shutters', '/scenarios'],
  demo: ['/dashboard'],
} as const;

function safeName(value: string): string {
  return value.replace(/[^a-z0-9-]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() || 'root';
}

test.describe('UI multi-device — smoke read-only avec captures', () => {
  test('navigation, layout et captures écran sans action armoire', async ({ page }, testInfo) => {
    const target = currentTarget(testInfo);
    const device = currentDevice(testInfo);
    const pages = pagesByTarget[target] ?? ['/'];
    const consoleErrors: string[] = [];

    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });

    for (const route of pages) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      await expect(page.locator('body')).toBeVisible();
      await expect(page.getByText(/Unexpected token|ReferenceError|TypeError/i)).toHaveCount(0);

      const horizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
      expect(horizontalOverflow, `${target}/${device}/${route} ne doit pas déborder horizontalement`).toBeFalsy();

      if (!isCompactViewport(testInfo)) {
        await expect(page.locator('nav, aside, [role="navigation"], header').first()).toBeVisible({ timeout: 10000 });
      }

      if (device === 'iphone' || device === 'android' || device.startsWith('ecran-domo')) {
        const bottomNavOverlap = await page.evaluate(() => {
          const nav = document.querySelector('nav[aria-label="Navigation mobile principale"]');
          if (!nav) return false;
          const navRect = nav.getBoundingClientRect();
          const main = document.querySelector('.essensys-main-scroll') ?? document.body;
          const paddingBottom = Number.parseFloat(window.getComputedStyle(main).paddingBottom || '0');
          return paddingBottom + 2 < navRect.height;
        });
        expect(bottomNavOverlap, `${target}/${device}/${route} doit réserver l'espace de la navigation basse`).toBeFalsy();
      }

      await page.screenshot({
        path: path.join('artifacts', 'screenshots', `${testInfo.project.name}-${safeName(route)}.png`),
        fullPage: !isCompactViewport(testInfo),
      });
    }

    expect(consoleErrors.filter((error) => !/favicon|manifest/i.test(error))).toEqual([]);
  });
});
