import { test } from '../fixtures/no-armoire';
import { ShuttersPage } from '../pages/ShuttersPage';
import { currentTarget } from '../pages/project';

test.describe('volets — spec partagée multi-device', () => {
  test('layout et action dry-run restent neutralisés', async ({ page }, testInfo) => {
    test.skip(currentTarget(testInfo) === 'support', 'Le support-site n’expose pas la page volets domotique.');

    const shutters = new ShuttersPage(page);
    await shutters.goto();
    await shutters.expectLoaded();
    await shutters.expectResponsiveShell(testInfo);
    await shutters.dryRunFirstControl();
  });
});
