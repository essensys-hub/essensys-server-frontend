const STORAGE_KEY = 'essensys_test_mode';

export function isTestModeEnabled(): boolean {
  if (import.meta.env.VITE_DEMO_MODE === 'true') {
    return false;
  }
  if (typeof window === 'undefined') {
    return false;
  }
  if (new URLSearchParams(window.location.search).get('test') === '1') {
    return true;
  }
  return sessionStorage.getItem(STORAGE_KEY) === '1';
}

export function setTestModeEnabled(enabled: boolean): void {
  if (enabled) {
    sessionStorage.setItem(STORAGE_KEY, '1');
  } else {
    sessionStorage.removeItem(STORAGE_KEY);
  }
}

export function withTestModeQuery(url: string): string {
  if (!isTestModeEnabled()) {
    return url;
  }
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}test_mode=dry_run`;
}

export function testModeHeaders(headers?: HeadersInit): HeadersInit {
  if (!isTestModeEnabled()) {
    return headers ?? {};
  }
  const h = new Headers(headers);
  h.set('X-Essensys-Test-Mode', 'dry-run');
  return h;
}

export interface DryRunResponse {
  status: 'test_ok' | 'test_failed';
  dry_run?: boolean;
  message?: string;
  validated_params?: Array<{ k: number; v: string }>;
  exchange_snapshot?: Array<{ k: number; v: string }>;
}

export function formatTestVerdict(data: DryRunResponse): string {
  if (data.status === 'test_ok') {
    return data.message ?? 'Test OK — non envoyé à l\'armoire';
  }
  return data.message ?? 'Test échoué';
}
