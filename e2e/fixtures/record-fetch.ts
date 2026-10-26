import type { Page } from '@playwright/test';

export interface RecordedCall {
  method: string;
  url: string;
  body: unknown;
}

export interface RecordFetchOptions {
  /** Le snapshot annonce une armoire hors ligne. */
  armoireOffline?: boolean;
  /** La table d'échange ne renvoie pas l'indice 440. */
  withoutOutletsState?: boolean;
}

declare global {
  interface Window {
    __e2eCalls: RecordedCall[];
  }
}

/**
 * Enregistre les écritures POST/PUT vers /api côté page, que l'API soit simulée dans la page
 * (build démo, mockFetch) ou interceptée sur le réseau par la fixture no-armoire. Peut aussi
 * réécrire le snapshot (armoire hors ligne) et la table d'échange (440 absent).
 */
export async function recordFetch(page: Page, opts: RecordFetchOptions = {}): Promise<void> {
  await page.addInitScript(({ offline, withoutState }: { offline: boolean; withoutState: boolean }) => {
    const native = window.fetch.bind(window);
    const passthrough = new WeakSet<object>();
    let inner: typeof window.fetch = native;
    window.__e2eCalls = [];
    const json = (data: unknown) =>
      new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } });
    const wrapper = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      // Repli de mockFetch (URL non simulée) : il rappelle le fetch d'origine avec le même init.
      if (init && passthrough.has(init)) return native(input, init);
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const method = (init?.method ?? 'GET').toUpperCase();
      if (url.includes('/api/') && (method === 'POST' || method === 'PUT')) {
        window.__e2eCalls.push({ method, url, body: init?.body ? JSON.parse(String(init.body)) : null });
      }
      const marked: RequestInit = { ...(init ?? {}) };
      passthrough.add(marked);
      const res = await inner(input, marked);
      if (offline && url.includes('/api/admin/armoire/snapshot')) {
        return json({ ...(await res.json()), connected: false });
      }
      if (withoutState && url.includes('/api/admin/exchange')) {
        const data = await res.json();
        return json({ ...data, values: (data.values ?? []).filter((row: { k: number }) => row.k !== 440) });
      }
      return res;
    };
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      get: () => wrapper,
      set: (v: typeof window.fetch) => {
        inner = v;
      },
    });
  }, { offline: opts.armoireOffline ?? false, withoutState: opts.withoutOutletsState ?? false });
}

export const recordedCalls = (page: Page): Promise<RecordedCall[]> => page.evaluate(() => window.__e2eCalls);
