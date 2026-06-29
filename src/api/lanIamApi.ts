import type { LanUser } from '../hooks/useLanAuth';

export type TrustedDevice = {
  id: number;
  lan_user_id: number;
  lan_user_email?: string;
  lan_user_role?: string;
  lan_user_display_name?: string;
  mac_address: string;
  device_label: string;
  trust_mode: 'temporary' | 'permanent';
  expires_at?: string | null;
  last_seen_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
  updated_at: string;
};

export type TrustedDeviceCandidate = {
  mac_address: string;
  device_label: string;
  source_ip?: string;
  last_seen_at?: string | null;
  lan_user_id?: number;
  lan_user_email?: string;
  lan_user_role?: string;
  lan_user_display_name?: string;
};

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

export async function listTrustedDevices(): Promise<TrustedDevice[]> {
  const res = await fetch('/api/user/me/trusted-devices', { credentials: 'include' });
  if (res.status === 403) {
    throw new Error('Appareils de confiance indisponibles pour ce rôle');
  }
  if (!res.ok) {
    throw new Error(await parseError(res, 'Impossible de charger les appareils de confiance'));
  }
  const data = await res.json();
  return data.devices as TrustedDevice[];
}

export async function listTrustedDeviceCandidates(): Promise<TrustedDeviceCandidate[]> {
  const res = await fetch('/api/user/me/trusted-devices/candidates', { credentials: 'include' });
  if (res.status === 403) {
    throw new Error('Appareils de confiance indisponibles pour ce rôle');
  }
  if (!res.ok) {
    throw new Error(await parseError(res, 'Impossible de détecter les clients LAN'));
  }
  const data = await res.json();
  return data.candidates as TrustedDeviceCandidate[];
}

export async function createTrustedDevice(candidate: TrustedDeviceCandidate): Promise<TrustedDevice> {
  const res = await fetch('/api/user/me/trusted-devices', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(candidate),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Impossible d’ajouter l’appareil de confiance'));
  }
  const data = await res.json();
  return data.device as TrustedDevice;
}

export async function revokeTrustedDevice(id: number) {
  const res = await fetch(`/api/user/me/trusted-devices/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Impossible de révoquer cet appareil'));
  }
}

export async function listAdminTrustedDevices(): Promise<TrustedDevice[]> {
  const res = await fetch('/api/admin/trusted-devices', { credentials: 'include' });
  if (res.status === 403) {
    throw new Error('Accès réservé aux administrateurs LAN');
  }
  if (!res.ok) {
    throw new Error(await parseError(res, 'Impossible de charger les appareils de confiance'));
  }
  const data = await res.json();
  return data.devices as TrustedDevice[];
}

export async function listAdminTrustedDeviceCandidates(): Promise<TrustedDeviceCandidate[]> {
  const res = await fetch('/api/admin/trusted-devices/candidates', { credentials: 'include' });
  if (res.status === 403) {
    throw new Error('Accès réservé aux administrateurs LAN');
  }
  if (!res.ok) {
    throw new Error(await parseError(res, 'Impossible de détecter les clients LAN'));
  }
  const data = await res.json();
  return data.candidates as TrustedDeviceCandidate[];
}

export async function createAdminTrustedDevice(payload: {
  lan_user_id: number;
  mac_address: string;
  device_label: string;
  source_ip?: string;
}): Promise<TrustedDevice> {
  const res = await fetch('/api/admin/trusted-devices', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Impossible de créer l’appairage permanent'));
  }
  const data = await res.json();
  return data.device as TrustedDevice;
}

export async function promoteTrustedDevice(id: number) {
  const res = await fetch(`/api/admin/trusted-devices/${id}/promote-permanent`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Impossible de promouvoir cet appareil'));
  }
}

export async function revokeTrustedDeviceAdmin(id: number) {
  const res = await fetch(`/api/admin/trusted-devices/${id}/revoke`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(await parseError(res, 'Impossible de révoquer cet appareil'));
  }
}
