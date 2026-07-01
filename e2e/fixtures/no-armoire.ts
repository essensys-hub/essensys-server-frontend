import { test as base, expect, type Page, type Route, type Request, type TestInfo } from '@playwright/test';
import { getTargetFromProject } from '../pages/project';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const DANGEROUS_PATHS = [
  /\/api\/admin\/inject(?:\?|$|\/)/i,
  /\/api\/portal\/inject(?:\?|$|\/)/i,
  /\/api\/web\/actions(?:\?|$|\/)/i,
  /\/api\/scenarios\/[^/]+\/launch(?:\?|$|\/)/i,
  /\/api\/scenarios\/launch(?:\?|$|\/)/i,
];

function hasDryRun(request: Request): boolean {
  const url = new URL(request.url());
  const headers = request.headers();
  return (
    url.searchParams.get('test_mode') === 'dry_run' ||
    url.searchParams.get('dry_run') === 'true' ||
    headers['x-essensys-test-mode'] === 'dry-run' ||
    headers['x-essensys-dry-run'] === 'true'
  );
}

function isDangerousMutation(request: Request): boolean {
  if (!MUTATING_METHODS.has(request.method().toUpperCase())) return false;
  const url = new URL(request.url());
  return DANGEROUS_PATHS.some((pattern) => pattern.test(url.pathname));
}

const MOCK_ARMOIRE_SNAPSHOT = {
  connected: true,
  last_poll_at: new Date().toISOString(),
  client_id: 'mock-armoire-e2e',
  identity: { firmware_embedded: '99', mac: 'd8:80:39:e1:35:ba' },
  system: { heures_creuses: true, delestage: false, secouru: false },
  alarm: { mode: 'croisière', step: 'croisière', armed: true, triggered: false, water_leak: false },
  comfort: {
    heating: { zone_jour: { consigne: 'CONFORT', mode: 'automatique' } },
    cumulus: 'gestion HC',
    scenario: 'Je sors',
  },
  energy: { tariff: 'HC/HP', apparent_power_va: 1200 },
  raw_missing: [],
};

async function fulfillArmoireSnapshot(route: Route): Promise<void> {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ...MOCK_ARMOIRE_SNAPSHOT, last_poll_at: new Date().toISOString() }),
  });
}

async function safeFulfill(route: Route, request: Request, testInfo: TestInfo): Promise<void> {
  const target = getTargetFromProject(testInfo.project.name);
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      status: 'test_ok',
      dry_run: true,
      mocked: true,
      target,
      guard: 'no-armoire',
      method: request.method(),
      path: new URL(request.url()).pathname,
    }),
  });
}

export async function installNoArmoireGuard(page: Page, testInfo: TestInfo): Promise<void> {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const target = getTargetFromProject(testInfo.project.name);
    const pathname = new URL(request.url()).pathname;
    const isRuntimeApi = pathname.startsWith('/api/') || pathname.startsWith('/scenarios/');

    if (!isRuntimeApi) {
      await route.continue();
      return;
    }

    if (pathname === '/api/admin/armoire/snapshot' && request.method() === 'GET') {
      await fulfillArmoireSnapshot(route);
      return;
    }

    if (isDangerousMutation(request)) {
      if (!hasDryRun(request)) {
        await route.fulfill({
          status: 451,
          contentType: 'application/json',
          body: JSON.stringify({
            blocked: true,
            guard: 'no-armoire',
            reason: `BLOQUÉ no-armoire: ${request.method()} ${request.url()} tente une action domotique sans test_mode=dry_run ni X-Essensys-Test-Mode: dry-run`,
          }),
        });
        return;
      }

      await safeFulfill(route, request, testInfo);
      return;
    }

    if (target === 'support' && request.url().includes('/api/')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mocked: true, items: [] }) });
      return;
    }

    if (MUTATING_METHODS.has(request.method().toUpperCase()) && !hasDryRun(request)) {
      await route.fulfill({
        status: 451,
        contentType: 'application/json',
        body: JSON.stringify({
          blocked: true,
          guard: 'no-armoire',
          reason: `BLOQUÉ no-armoire: ${request.method()} ${request.url()} mutation API sans dry-run`,
        }),
      });
      return;
    }

    await route.continue();
  });
}

export const test = base.extend({
  page: async ({ page }, usePage, testInfo) => {
    await installNoArmoireGuard(page, testInfo);
    await usePage(page);
  },
});

export { expect };
