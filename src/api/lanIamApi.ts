import type { LanUser } from '../hooks/useLanAuth';

async function parseError(res: Response, fallback: string) {
  const text = await res.text();
  return text || fallback;
}

export async function changeLanPassword(currentPassword: string, newPassword: string) {
  const res = await fetch('/api/user/me/password', {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  });
  if (res.status === 401) {
    throw new Error('Mot de passe actuel incorrect');
  }
  if (!res.ok) {
    throw new Error(await parseError(res, 'Impossible de changer le mot de passe'));
  }
}

export async function listLanUsers(): Promise<LanUser[]> {
  const res = await fetch('/api/admin/lan-users', { credentials: 'include' });
  if (res.status === 403) {
    throw new Error('Accès réservé aux administrateurs LAN');
  }
  if (!res.ok) {
    throw new Error(await parseError(res, 'Impossible de charger les utilisateurs'));
  }
  const data = await res.json();
  return data.users as LanUser[];
}

export async function createLanUser(payload: {
  email: string;
  password: string;
  role: string;
  display_name?: string;
}) {
  const res = await fetch('/api/admin/lan-users', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Création impossible'));
  }
  const data = await res.json();
  return data.user as LanUser;
}

export async function resetLanUserPassword(id: number, password: string) {
  const res = await fetch(`/api/admin/lan-users/${id}/reset-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Réinitialisation impossible'));
  }
}

export async function disableLanUser(id: number) {
  const res = await fetch(`/api/admin/lan-users/${id}/disable`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Désactivation impossible'));
  }
}

export async function enableLanUser(id: number) {
  const res = await fetch(`/api/admin/lan-users/${id}/enable`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Réactivation impossible'));
  }
}
