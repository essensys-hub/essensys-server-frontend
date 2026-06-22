import { test, expect } from '@playwright/test';

test.describe('local — dry-run API', () => {
  test.skip(!process.env.ESSENSYS_BASIC_USER, 'ESSENSYS_BASIC_USER requis');

  test('inject dry-run retourne test_ok', async ({ request }) => {
    const res = await request.post('/api/admin/inject?test_mode=dry_run', {
      data: { k: 590, v: '2' },
      headers: { 'X-Essensys-Test-Mode': 'dry-run' },
    });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.status).toBe('test_ok');
    expect(body.dry_run).toBe(true);
  });
});
