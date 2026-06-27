import { test, expect } from '../fixtures/no-armoire';

const CHEVET = { k: 613, v: '64' };

test.describe('local — chevet PC3 dry-run', () => {
  test.skip(!process.env.ESSENSYS_BASIC_USER, 'ESSENSYS_BASIC_USER requis');

  test('inject dry-run k=613 v=64 sans guid', async ({ request }) => {
    const res = await request.post('/api/admin/inject?test_mode=dry_run', {
      data: { k: CHEVET.k, v: CHEVET.v },
      headers: { 'X-Essensys-Test-Mode': 'dry-run' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.dry_run).toBe(true);
    expect(body.status).toBe('test_ok');
    expect(body.guid).toBeUndefined();
    expect(body.guids).toBeUndefined();
  });
});
