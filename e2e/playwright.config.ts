import { defineConfig, devices } from '@playwright/test';

const demoURL = process.env.ESSENSYS_DEMO_URL ?? 'https://demo.essensys.fr';
const localURL = process.env.ESSENSYS_LOCAL_URL ?? 'https://mon.essensys.local';
const portalURL = process.env.ESSENSYS_PORTAL_URL ?? 'https://mon.essensys.fr/portal';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'demo',
      testMatch: /demo\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: demoURL,
      },
    },
    {
      name: 'local',
      testMatch: /local\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: localURL,
        httpCredentials: process.env.ESSENSYS_BASIC_USER
          ? { username: process.env.ESSENSYS_BASIC_USER, password: process.env.ESSENSYS_BASIC_PASS ?? '' }
          : undefined,
        extraHTTPHeaders: { 'X-Essensys-Test-Mode': 'dry-run' },
      },
    },
    {
      name: 'remote',
      testMatch: /remote\.spec\.ts$/,
      use: {
        ...devices['Desktop Chrome'],
        baseURL: portalURL,
        extraHTTPHeaders: { 'X-Essensys-Test-Mode': 'dry-run' },
      },
    },
  ],
});
