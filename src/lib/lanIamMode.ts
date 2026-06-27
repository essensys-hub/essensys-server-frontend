let cached: boolean | null = null;

export function isLanIamBuildFlag() {
  return import.meta.env.VITE_LAN_IAM === 'true';
}

export async function resolveLanIamEnabled(): Promise<boolean> {
  if (isLanIamBuildFlag()) return true;
  if (cached !== null) return cached;
  try {
    const res = await fetch('/health', { credentials: 'include' });
    if (!res.ok) {
      cached = false;
      return false;
    }
    const data = (await res.json()) as { lan_iam_enabled?: boolean };
    cached = Boolean(data.lan_iam_enabled);
  } catch {
    cached = false;
  }
  return cached;
}

export function resetLanIamCache() {
  cached = null;
}
