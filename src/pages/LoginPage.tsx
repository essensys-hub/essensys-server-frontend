import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import '../styles/auth-lan.css';
import { LoginVariantMaison } from '../components/Auth/LoginVariantMaison';
import { LoginVariantAurora } from '../components/Auth/LoginVariantAurora';

export type LoginVariant = 'maison' | 'aurora';

const STORAGE_KEY = 'essensys-lan-login-variant';

function parseVariant(raw: string | null): LoginVariant {
  if (raw === 'aurora' || raw === 'b' || raw === '2') return 'aurora';
  return 'maison';
}

export function LoginPage() {
  const [params, setParams] = useSearchParams();
  const variant = useMemo(() => {
    const q = params.get('variant');
    if (q) return parseVariant(q);
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'aurora' ? 'aurora' : 'maison';
  }, [params]);

  const setVariant = (v: LoginVariant) => {
    localStorage.setItem(STORAGE_KEY, v);
    setParams({ variant: v }, { replace: true });
  };

  if (variant === 'aurora') {
    return (
      <LoginVariantAurora
        activeVariant="aurora"
        onSwitchVariant={setVariant}
      />
    );
  }

  return (
    <LoginVariantMaison
      activeVariant="maison"
      onSwitchVariant={setVariant}
    />
  );
}
