import { test, expect } from '@playwright/test';

const CHEVET = { k: 613, v: '64' };

test.describe('remote — chevet PC3 dry-run portail', () => {
  test.skip(!process.env.ESSENSYS_PORTAL_TOKEN, 'ESSENSYS_PORTAL_TOKEN requis');

  test('portal inject dry-run sans guid ni forward', async ({ request }) => {
    const res = await request.post('/api/portal/inject?test_mode=dry_run', {
      data: { k: CHEVET.k, v: CHEVET.v },
      headers: {
        'X-Essensys-Test-Mode': 'dry-run',
        Authorization: `Bearer ${process.env.ESSENSYS_PORTAL_TOKEN}`,
      },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.dry_run).toBe(true);
    expect(body.status).toBe('test_ok');
    expect(body.guid).toBeUndefined();
  });
});
