import { test, expect } from '../fixtures/no-armoire';
import { currentTarget } from '../pages/project';

test.describe('no-armoire — garde réseau globale', () => {
  test('bloque explicitement un inject live sans dry-run', async ({ page }, testInfo) => {
    test.skip(currentTarget(testInfo) !== 'support', 'Les projects local/remote injectent le header dry-run globalement.');
    const injectUrl = new URL('/api/admin/inject', String(testInfo.project.use.baseURL)).toString();

    const blocked = await page.evaluate(async (url) => {
      const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ k: 590, v: '2' }),
        });
      return { status: response.status, body: await response.json() };
    }, injectUrl);

    expect(blocked.status).toBe(451);
    expect(blocked.body.reason).toMatch(/BLOQUÉ no-armoire/);
  });

  test('autorise et mocke un inject dry-run sans joindre une armoire', async ({ page }, testInfo) => {
    const injectUrl = new URL('/api/admin/inject?test_mode=dry_run', String(testInfo.project.use.baseURL)).toString();

    const body = await page.evaluate(async (url) => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Essensys-Test-Mode': 'dry-run',
        },
        body: JSON.stringify({ k: 590, v: 'dry-run' }),
      });
      return response.json();
    }, injectUrl);

    expect(body).toMatchObject({ status: 'test_ok', dry_run: true, mocked: true, guard: 'no-armoire' });
  });
});
