import type { ArmoireSnapshot } from '../types/armoire';

function apiBase(): string {
  return import.meta.env.VITE_BACKEND_URL ?? '';
}

export async function getArmoireSnapshot(): Promise<ArmoireSnapshot> {
  const base = apiBase();
  const url = base ? `${base}/api/admin/armoire/snapshot` : '/api/admin/armoire/snapshot';
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error(`Snapshot armoire: HTTP ${res.status}`);
  }
  return res.json() as Promise<ArmoireSnapshot>;
}
