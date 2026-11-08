/**
 * Plages horaires de la sonnette (sonnette-plages-push-2026-11-008), portail local de la gateway : éditeur de grille 7 x 24
 * dans l'écran « Sonnette » et mention « hors plage » dans la fenêtre de sonnerie.
 * NR: NR-server-frontend-12 essensys-hub/essensys-feature-lifecycle#61
 *
 * Build démo (API simulée dans la page) sous la fixture no-armoire : aucune requête vers une armoire, une console UniFi ni un cloud.
 * Sessions utilisées : `essensys_demo_doorbell_init` (réglages de départ, dont `schedule`), `essensys_demo_doorbell_status`,
 * `essensys_demo_doorbell_error`, `essensys_demo_lan_role`.
 */
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/no-armoire';
import { recordFetch, recordedCalls } from '../fixtures/record-fetch';
import { currentTarget } from '../pages/project';

const goto = (page: Page, path: string) => page.goto(path, { waitUntil: 'domcontentloaded' });
const spa = (page: Page, path: string) =>
  page.evaluate((p) => {
    history.pushState(null, '', p);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
const initSettings = (page: Page, settings: Record<string, unknown>) =>
  page.addInitScript((s) => sessionStorage.setItem('essensys_demo_doorbell_init', JSON.stringify({ settings: s })), settings);
const withRole = async (page: Page, role: 'lan_admin' | 'lan_user') => {
  await page.route('**/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ lan_iam_enabled: true }) }),
  );
  await page.addInitScript((r) => sessionStorage.setItem('essensys_demo_lan_role', r), role);
};
const writes = async (page: Page) =>
  (await recordedCalls(page)).filter((c) => c.url.includes('/api/admin/doorbell/settings') && c.method === 'PUT');
const cell = (page: Page, day: number, hour: number) => page.getByTestId(`sched-cell-${day}-${hour}`);
const FULL = '1'.repeat(24);
const OFF = '0'.repeat(24);
const customSchedule = (rows: Record<number, string>, timezone = 'Europe/Paris') => ({
  mode: 'custom', timezone, grid: Array.from({ length: 7 }, (_, d) => rows[d] ?? OFF),
});
const NO_NIGHT = '0'.repeat(7) + '1'.repeat(15) + '00';

test.describe('sonnette — plages horaires (portail local)', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    void page;
    test.skip(currentTarget(testInfo) !== 'local', 'Portail local uniquement.');
  });

  test('@nr NR-server-frontend-12 par défaut : toujours actif, 7 lignes de 24 cases, une case repérée comme actuelle', async ({ page }) => {
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('doorbell-schedule')).toBeVisible();
    await expect(page.getByRole('grid', { name: 'Plages horaires de la sonnette' })).toBeVisible();
    await expect(page.locator('[data-testid^="sched-cell-"]')).toHaveCount(168);
    await expect(page.locator('[data-testid^="sched-cell-"][data-on="1"]')).toHaveCount(168);
    await expect(page.getByTestId('sched-preset-always')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByTestId('sched-timezone')).toHaveValue('Europe/Paris');
    await expect(page.locator('[data-now="1"]')).toHaveCount(1);
    await expect(page.locator('[data-now="1"]')).toHaveAttribute('aria-current', 'time');
    await expect(page.getByTestId('sched-now')).toContainText('dans la plage');
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
  });

  test('@nr NR-server-frontend-12 case actuelle : mardi 14 h 05 à Paris repérée, hors plage annoncé', async ({ page }) => {
    await page.addInitScript(() => {
      const fixed = new Date('2026-11-10T13:05:00Z').getTime();
      Date.now = () => fixed;
    });
    await initSettings(page, { schedule: customSchedule({ 0: FULL }) });
    await goto(page, 'settings/doorbell');
    await expect(cell(page, 1, 14)).toHaveAttribute('data-now', '1');
    await expect(cell(page, 1, 14)).toHaveAttribute('data-on', '0');
    await expect(page.getByTestId('sched-now')).toHaveText('Maintenant : mardi 14:05 (Europe/Paris), hors plage.');
    await expect(cell(page, 0, 14)).toHaveAttribute('data-on', '1');
    await expect(cell(page, 1, 14)).toHaveAccessibleName('mardi de 14 h à 15 h : inactive');
  });

  test('@nr NR-server-frontend-12 clic : une case, passage en personnalisé, un seul PUT, relu à la réouverture', async ({ page }) => {
    await recordFetch(page);
    await goto(page, 'settings/doorbell');
    await cell(page, 1, 3).click();
    await expect(cell(page, 1, 3)).toHaveAttribute('data-on', '0');
    await expect(page.getByTestId('sched-preset-always')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('[data-testid^="sched-cell-"][data-on="0"]')).toHaveCount(1);
    expect(await writes(page)).toHaveLength(0); // modifications locales jusqu'à Enregistrer
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('status')).toHaveText('Réglages enregistrés');
    const sent = await writes(page);
    expect(sent).toHaveLength(1);
    const schedule = (sent[0].body as { schedule: { mode: string; timezone: string; grid: string[] } }).schedule;
    expect(schedule.mode).toBe('custom');
    expect(schedule.timezone).toBe('Europe/Paris');
    expect(schedule.grid).toHaveLength(7);
    expect(schedule.grid[1]).toBe('1110' + '1'.repeat(20));
    expect(schedule.grid[0]).toBe(FULL);
    await spa(page, '/settings');
    await spa(page, '/settings/doorbell');
    await expect(cell(page, 1, 3)).toHaveAttribute('data-on', '0');
    await expect(cell(page, 1, 4)).toHaveAttribute('data-on', '1');
  });

  test('@nr NR-server-frontend-12 glisser : peint un rectangle de cases, puis les retire en repartant d une case active', async ({ page }) => {
    await goto(page, 'settings/doorbell');
    await page.getByTestId('sched-preset-never').click();
    await expect(page.locator('[data-testid^="sched-cell-"][data-on="1"]')).toHaveCount(0);
    const a = (await cell(page, 1, 14).boundingBox())!;
    const b = (await cell(page, 2, 16).boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 6 });
    await page.mouse.up();
    await expect(page.locator('[data-testid^="sched-cell-"][data-on="1"]')).toHaveCount(6);
    for (const d of [1, 2]) for (const h of [14, 15, 16]) await expect(cell(page, d, h)).toHaveAttribute('data-on', '1');
    // repartir d une case active retire les cases traversées
    const c = (await cell(page, 1, 14).boundingBox())!;
    const d2 = (await cell(page, 1, 16).boundingBox())!;
    await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2);
    await page.mouse.down();
    await page.mouse.move(d2.x + d2.width / 2, d2.y + d2.height / 2, { steps: 4 });
    await page.mouse.up();
    await expect(page.locator('[data-testid^="sched-cell-"][data-on="1"]')).toHaveCount(3);
    await expect(cell(page, 1, 15)).toHaveAttribute('data-on', '0');
    await expect(cell(page, 2, 15)).toHaveAttribute('data-on', '1');
  });

  test('@nr NR-server-frontend-12 clavier : flèches pour se déplacer, Espace et Entrée pour changer une case', async ({ page }) => {
    await goto(page, 'settings/doorbell');
    await cell(page, 0, 0).focus();
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowDown');
    await expect(cell(page, 1, 1)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(cell(page, 1, 1)).toHaveAttribute('data-on', '0');
    await page.keyboard.press('Enter');
    await expect(cell(page, 1, 1)).toHaveAttribute('data-on', '1');
    await page.keyboard.press('End');
    await expect(cell(page, 1, 23)).toBeFocused();
    await page.keyboard.press('Home');
    await expect(cell(page, 1, 0)).toBeFocused();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp'); // butée : reste sur lundi
    await expect(cell(page, 0, 0)).toBeFocused();
    await page.keyboard.press('Space');
    await expect(cell(page, 0, 0)).toHaveAttribute('data-on', '0');
    await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeEnabled();
  });

  test('@nr NR-server-frontend-12 présélections : Jour seulement 7 h-22 h, Jamais (avertissement), Toujours', async ({ page }) => {
    await recordFetch(page);
    await goto(page, 'settings/doorbell');
    await page.getByTestId('sched-preset-day').click();
    await expect(page.getByTestId('sched-preset-day')).toHaveAttribute('aria-pressed', 'true');
    await expect(cell(page, 4, 6)).toHaveAttribute('data-on', '0');
    await expect(cell(page, 4, 7)).toHaveAttribute('data-on', '1');
    await expect(cell(page, 4, 21)).toHaveAttribute('data-on', '1');
    await expect(cell(page, 4, 22)).toHaveAttribute('data-on', '0');
    await expect(page.locator('[data-testid^="sched-cell-"][data-on="1"]')).toHaveCount(7 * 15);
    await page.getByTestId('sched-preset-never').click();
    await expect(page.getByTestId('sched-summary')).toContainText('Jamais active');
    await page.getByRole('button', { name: 'Enregistrer' }).click(); // valide : la sonnette ne réagit jamais
    await expect(page.getByRole('status')).toHaveText('Réglages enregistrés');
    expect((await writes(page))[0].body).toMatchObject({ schedule: { mode: 'custom', grid: Array(7).fill(OFF) } });
    await page.getByTestId('sched-preset-always').click();
    await expect(page.locator('[data-testid^="sched-cell-"][data-on="1"]')).toHaveCount(168);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('status')).toHaveText('Réglages enregistrés');
    expect((await writes(page))[1].body).toMatchObject({ schedule: { mode: 'always', grid: Array(7).fill(FULL) } });
  });

  test('@nr NR-server-frontend-12 fuseau : choix enregistré, case actuelle recalculée', async ({ page }) => {
    await page.addInitScript(() => {
      const fixed = new Date('2026-11-10T13:05:00Z').getTime();
      Date.now = () => fixed;
    });
    await recordFetch(page);
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('sched-now')).toContainText('mardi 14:05 (Europe/Paris)');
    await page.getByTestId('sched-timezone').selectOption('America/New_York');
    await expect(page.getByTestId('sched-now')).toContainText('mardi 08:05 (America/New_York)');
    await expect(cell(page, 1, 8)).toHaveAttribute('data-now', '1');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('status')).toHaveText('Réglages enregistrés');
    expect((await writes(page))[0].body).toMatchObject({ schedule: { timezone: 'America/New_York' } });
  });

  test('@nr NR-server-frontend-12 plage enregistrée relue au chargement (personnalisée, autre fuseau)', async ({ page }) => {
    await initSettings(page, { schedule: customSchedule({ 1: NO_NIGHT }, 'Europe/Brussels') });
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('sched-timezone')).toHaveValue('Europe/Brussels');
    await expect(cell(page, 1, 6)).toHaveAttribute('data-on', '0');
    await expect(cell(page, 1, 7)).toHaveAttribute('data-on', '1');
    await expect(cell(page, 0, 7)).toHaveAttribute('data-on', '0');
    await expect(page.getByTestId('sched-preset-always')).toHaveAttribute('aria-pressed', 'false');
  });

  test('@nr NR-server-frontend-12 invalid_schedule : message en français, écran ouvert avec les modifications', async ({ page }) => {
    await page.addInitScript(() => sessionStorage.setItem('essensys_demo_doorbell_error', 'invalid_schedule'));
    await goto(page, 'settings/doorbell');
    await cell(page, 2, 2).click();
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('alert')).toContainText('Plage horaire refusée par la passerelle');
    await expect(cell(page, 2, 2)).toHaveAttribute('data-on', '0');
  });

  test('@nr NR-server-frontend-12 lan_user (IAM actif) : pas d éditeur, aucun enregistrement possible', async ({ page }) => {
    await recordFetch(page);
    await withRole(page, 'lan_user');
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('doorbell-forbidden')).toBeVisible();
    await expect(page.getByTestId('doorbell-schedule')).toHaveCount(0);
    await expect(page.getByTestId('sched-grid')).toHaveCount(0);
    expect(await writes(page)).toHaveLength(0);
  });

  test('@nr NR-server-frontend-12 lan_admin (IAM actif) : éditeur actif', async ({ page }) => {
    await withRole(page, 'lan_admin');
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('doorbell-schedule')).toBeVisible();
    await expect(page.getByTestId('sched-preset-day')).toBeEnabled();
    await expect(page.getByTestId('sched-timezone')).toBeEnabled();
  });

  test('@nr NR-server-frontend-12 gateway sans plage (ancienne version) : toujours actif, la grille s affiche', async ({ page }) => {
    await goto(page, 'settings/doorbell');
    await expect(page.getByTestId('sched-preset-always')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-testid^="sched-cell-"][data-on="1"]')).toHaveCount(168);
  });
});

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);
const inMinutes = (m: number) => new Date(Date.now() + m * 60_000).toISOString();
const ringingStatus = (over: Record<string, unknown> = {}) => ({
  enabled: true, available: true, ringing: true, ringing_until: inMinutes(10), last_ring_at: '2026-11-08T10:00:00Z', ...over,
});
const setStatus = (page: Page, status: unknown) =>
  page.addInitScript((s) => sessionStorage.setItem('essensys_demo_doorbell_status', JSON.stringify(s)), status);
const mockStream = (page: Page) =>
  page.route('**/api/doorbell/stream*', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PNG }));

test.describe('sonnette — hors plage (portail local)', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    void page;
    test.skip(currentTarget(testInfo) !== 'local', 'Portail local uniquement.');
  });

  test('@nr NR-server-frontend-12 hors plage : la fenêtre vidéo reste active avec la mention', async ({ page }) => {
    await mockStream(page);
    await setStatus(page, ringingStatus({ in_window: false }));
    await goto(page, 'dashboard');
    const win = page.getByRole('dialog', { name: "Quelqu'un sonne" });
    await expect(win).toBeVisible();
    await expect(win.getByTestId('doorbell-video')).toBeVisible();
    await expect(win.getByTestId('doorbell-out-of-window')).toHaveText('hors plage : pas de clignotement ni de notification');
    await win.getByRole('button', { name: 'Fermer' }).click();
    await expect(win).toHaveCount(0);
  });

  test('@nr NR-server-frontend-12 dans la plage, ou champ absent (ancienne gateway) : aucune mention', async ({ page }) => {
    await mockStream(page);
    await setStatus(page, ringingStatus({ in_window: true }));
    await goto(page, 'dashboard');
    await expect(page.getByTestId('doorbell-window')).toBeVisible();
    await expect(page.getByTestId('doorbell-out-of-window')).toHaveCount(0);
    await page.evaluate((s) => sessionStorage.setItem('essensys_demo_doorbell_status', JSON.stringify(s)), ringingStatus());
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByTestId('doorbell-window')).toBeVisible();
    await expect(page.getByTestId('doorbell-out-of-window')).toHaveCount(0);
  });

  test('@nr NR-server-frontend-12 Essayer : l essai ignore la plage, la mention suit l état de la gateway', async ({ page }) => {
    await mockStream(page);
    await recordFetch(page);
    await initSettings(page, { enabled: true, camera_id: 'cam-mock-1', lights: ['salon'], blinks: 3, schedule: customSchedule({}) });
    await goto(page, 'settings/doorbell');
    await page.getByRole('button', { name: 'Essayer' }).click();
    await expect(page.getByRole('status')).toContainText('Essai');
    const win = page.getByRole('dialog', { name: "Quelqu'un sonne" });
    await expect(win).toBeVisible(); // la fenêtre s ouvre malgré une grille entièrement inactive
    await expect(win.getByTestId('doorbell-out-of-window')).toBeVisible(); // la démo évalue la plage comme la gateway
    const calls = await recordedCalls(page);
    expect(calls.filter((c) => c.url.includes('/api/admin/inject') || c.url.includes('/web/actions') || c.url.includes('/api/admin/exchange'))).toHaveLength(0);
  });
});
