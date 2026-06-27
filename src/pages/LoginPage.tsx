import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/auth-lan.css';
import { LoginVariantMaison } from '../components/Auth/LoginVariantMaison';
import { LoginVariantAurora } from '../components/Auth/LoginVariantAurora';

export type LoginVariant = 'maison' | 'aurora';

function parseVariant(raw: string | null): LoginVariant | null {
  if (raw === 'aurora' || raw === 'b' || raw === '2') return 'aurora';
  if (raw === 'maison' || raw === 'a' || raw === '1') return 'maison';
  return null;
}

/** Login LAN — variante Aurora (B) par défaut ; `?variant=maison` pour l’ancienne proposition A. */
export function LoginPage() {
  const [params] = useSearchParams();
  const variant = useMemo(
    () => parseVariant(params.get('variant')) ?? 'aurora',
    [params],
  );

  if (variant === 'maison') {
    return <LoginVariantMaison />;
  }

  return <LoginVariantAurora />;
}
