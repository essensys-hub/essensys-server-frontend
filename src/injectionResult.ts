/**
 * Résultat d'une injection API — live (guid) ou dry-run (test_ok).
 */
export type InjectionResult =
  | { kind: 'live'; guid?: string }
  | { kind: 'dry_run'; message?: string };

export function parseInjectionResult(data: unknown): InjectionResult {
  if (!data || typeof data !== 'object') {
    return { kind: 'live' };
  }
  const body = data as Record<string, unknown>;
  if (body.dry_run === true || body.status === 'test_ok' && body.dry_run) {
    return { kind: 'dry_run', message: typeof body.message === 'string' ? body.message : undefined };
  }
  if (body.status === 'test_failed') {
    throw new Error(typeof body.message === 'string' ? body.message : 'Test échoué');
  }
  return { kind: 'live', guid: typeof body.guid === 'string' ? body.guid : undefined };
}
