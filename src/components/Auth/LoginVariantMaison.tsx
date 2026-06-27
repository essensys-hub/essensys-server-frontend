import { useNavigate } from 'react-router-dom';
import { LanLoginForm } from './LanLoginForm';

type Props = {
  onSwitchVariant?: (v: 'maison' | 'aurora') => void;
  activeVariant?: 'maison' | 'aurora';
};

export function LoginVariantMaison({ onSwitchVariant, activeVariant = 'maison' }: Props) {
  const navigate = useNavigate();

  return (
    <div className="lan-login-root lan-login-maison">
      <header className="lan-login-maison__header">
        <img src="/images/logosml.png" alt="mon Essensys" className="lan-login-maison__logo" />
        <span className="lan-login-maison__badge">mon.essensys.local</span>
      </header>
      <main className="lan-login-maison__main">
        <LanLoginForm
          showLogoInCard={false}
          subtitle="Connectez-vous pour piloter votre domotique locale"
          onSuccessNavigate={() => navigate('/dashboard', { replace: true })}
          footer={
            onSwitchVariant ? (
              <VariantSwitch active={activeVariant} onSwitch={onSwitchVariant} />
            ) : (
              <span>Session sécurisée — 7 jours</span>
            )
          }
        />
      </main>
    </div>
  );
}

function VariantSwitch({
  active,
  onSwitch,
}: {
  active: 'maison' | 'aurora';
  onSwitch: (v: 'maison' | 'aurora') => void;
}) {
  return (
    <div className="lan-auth-variant-switch">
      <button
        type="button"
        aria-pressed={active === 'maison'}
        onClick={() => onSwitch('maison')}
      >
        Proposition A — Maison
      </button>
      <button
        type="button"
        aria-pressed={active === 'aurora'}
        onClick={() => onSwitch('aurora')}
      >
        Proposition B — Aurora
      </button>
    </div>
  );
}

export { VariantSwitch };
