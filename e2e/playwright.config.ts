import { defineConfig, devices, type Project } from '@playwright/test';
import { ecranDomotiqueCompact, ecranDomotiqueLandscape, ecranDomotiquePortrait } from './devices/ecran-domotique';

const supportURL = process.env.ESSENSYS_SUPPORT_URL ?? process.env.ESSENSYS_DEMO_URL ?? 'https://demo.essensys.fr';
const localURL = process.env.ESSENSYS_LOCAL_URL ?? 'https://mon.essensys.fr/demo/dashboard';
const portalURL = process.env.ESSENSYS_PORTAL_URL ?? 'https://demo.portal.essensys.fr';
const allowLiveReadonly = process.env.ESSENSYS_ALLOW_LIVE_READONLY === '1';

type TargetId = 'support' | 'local' | 'remote';
type DeviceId = 'desktop' | 'iphone' | 'android' | 'ipad' | 'ecran-domo' | 'ecran-domo-compact' | 'ecran-domo-portrait';

type Target = {
  id: TargetId;
  baseURL: string;
  testIgnore?: RegExp[];
  extraHTTPHeaders?: Record<string, string>;
  httpCredentials?: Project['use']['httpCredentials'];
};

type Device = {
  id: DeviceId;
  use: Project['use'];
};

function assertDemoOrExplicitReadonly(target: Target): void {
  const parsed = new URL(target.baseURL);
  const hostname = parsed.hostname;
  const path = parsed.pathname;
  const isDemo =
    hostname.startsWith('demo.') ||
    hostname.endsWith('.local') ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    path.startsWith('/demo');
  if (!isDemo && !allowLiveReadonly) {
    throw new Error(
      `BLOQUÉ no-armoire: ${target.id} pointe vers ${target.baseURL}. ` +
        'Utilise demo.essensys.fr / demo.portal.essensys.fr / mon.essensys.fr/demo/dashboard ou définis ESSENSYS_ALLOW_LIVE_READONLY=1 pour lecture seule.',
    );
  }
}

const targets: Target[] = [
  {
    id: 'support',
    baseURL: supportURL,
    testIgnore: [/\.local\.spec\.ts$/, /\.remote\.spec\.ts$/],
  },
  {
    id: 'local',
    baseURL: localURL,
    testIgnore: [/\.remote\.spec\.ts$/],
    httpCredentials: process.env.ESSENSYS_BASIC_USER
      ? { username: process.env.ESSENSYS_BASIC_USER, password: process.env.ESSENSYS_BASIC_PASS ?? '' }
      : undefined,
    extraHTTPHeaders: { 'X-Essensys-Test-Mode': 'dry-run' },
  },
  {
    id: 'remote',
    baseURL: portalURL,
    testIgnore: [/\.local\.spec\.ts$/],
    extraHTTPHeaders: { 'X-Essensys-Test-Mode': 'dry-run' },
  },
];

for (const target of targets) assertDemoOrExplicitReadonly(target);

const matrixDevices: Device[] = [
  { id: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
  { id: 'iphone', use: { ...devices['iPhone 14'] } },
  { id: 'android', use: { ...devices['Pixel 7'] } },
  { id: 'ipad', use: { ...devices['iPad (gen 7) landscape'] } },
  { id: 'ecran-domo', use: ecranDomotiqueLandscape },
  { id: 'ecran-domo-compact', use: ecranDomotiqueCompact },
  { id: 'ecran-domo-portrait', use: ecranDomotiquePortrait },
];

function projectFor(target: Target, device: Device): Project {
  return {
    name: `${target.id}-${device.id}`,
    testIgnore: target.testIgnore,
    use: {
      ...device.use,
      baseURL: target.baseURL,
      httpCredentials: target.httpCredentials,
      extraHTTPHeaders: target.extraHTTPHeaders,
      colorScheme: 'dark',
      reducedMotion: 'reduce',
    },
  };
}

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  snapshotDir: './snapshots',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: 'disabled',
    },
  },
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: targets.flatMap((target) => matrixDevices.map((device) => projectFor(target, device))),
});
