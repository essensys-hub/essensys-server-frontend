import path from 'node:path';
import { chromium, webkit } from '@playwright/test';

const root = path.resolve(process.cwd(), 'artifacts', 'screenshots');
const baseURL = process.env.ESSENSYS_LOCAL_SOURCE_URL ?? 'http://127.0.0.1:5173';

const devices = [
  { name: 'local-source-support-desktop', browserType: chromium, context: { viewport: { width: 1366, height: 768 } } },
  { name: 'local-source-support-iphone', browserType: webkit, context: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } },
  { name: 'local-source-support-ipad', browserType: webkit, context: { viewport: { width: 1080, height: 810 }, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' } },
  { name: 'local-source-support-ecran-domo', browserType: chromium, context: { viewport: { width: 1024, height: 600 }, isMobile: true, hasTouch: true } },
];

const mockCameras = [
  { id: 'demo-cam-1', name: 'Caméra démo', status: 'online', is_connected: true, model: 'Demo', is_recording: false },
];

for (const device of devices) {
  const browser = await device.browserType.launch({ headless: true });
  const context = await browser.newContext(device.context);
  const page = await context.newPage();
  await page.route('**/api/unifi/cameras', (route) => route.fulfill({ json: { cameras: mockCameras } }));
  await page.route('**/api/unifi/cameras/*/snapshot**', (route) => route.abort());
  await page.route('**/api/web/history/latest', (route) => route.fulfill({ json: { guid: 'mock-guid', actionType: 'MOCK', actionInfo: 'Mock action executed', timestamp: '2026-06-27T22:22:47Z', isDone: true } }));
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method())) {
      return route.fulfill({ status: 451, json: { error: 'BLOQUÉ no-armoire local-source capture' } });
    }
    return route.fulfill({ json: {} });
  });
  await page.goto(`${baseURL}/dashboard`, { waitUntil: 'networkidle' });
  const isCompact = device.name.includes('iphone') || device.name.includes('ecran-domo');
  await page.screenshot({ path: path.join(root, `${device.name}-dashboard.png`), fullPage: !isCompact });
  await browser.close();
  console.log(`${device.name}-dashboard.png`);
}
