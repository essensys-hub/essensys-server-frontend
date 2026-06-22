const DRY_RUN_QUERY = 'test_mode=dry_run';

export function withDryRunQuery(url: string): string {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}${DRY_RUN_QUERY}`;
}

export function dryRunHeaders(base?: HeadersInit): Headers {
  const headers = new Headers(base);
  headers.set('X-Essensys-Test-Mode', 'dry-run');
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}
