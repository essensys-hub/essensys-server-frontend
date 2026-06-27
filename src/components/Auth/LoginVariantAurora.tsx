import { useNavigate } from 'react-router-dom';
import { LanLoginForm } from './LanLoginForm';
import { VariantSwitch } from './LoginVariantMaison';

type Props = {
  onSwitchVariant?: (v: 'maison' | 'aurora') => void;
  activeVariant?: 'maison' | 'aurora';
};

export function LoginVariantAurora({ onSwitchVariant, activeVariant = 'aurora' }: Props) {
  const navigate = useNavigate();

  return (
    <div className="lan-login-root lan-login-aurora">
      <div className="lan-login-aurora__mesh" aria-hidden />
      <div className="lan-login-aurora__content">
        <div className="lan-login-aurora__panel">
          <LanLoginForm
            subtitle="Accès administration de votre gateway Essensys"
            onSuccessNavigate={() => navigate('/dashboard', { replace: true })}
            footer={
              onSwitchVariant ? (
                <VariantSwitch active={activeVariant} onSwitch={onSwitchVariant} />
              ) : (
                <span>mon.essensys.local · LAN sécurisé</span>
              )
            }
          />
        </div>
        <aside className="lan-login-aurora__hero">
          <h2>Pilotage local, design Essensys</h2>
          <p>
            Même ambiance que le portail cloud — optimisé pour iPhone, iPad, écran mural et
            poste de contrôle.
          </p>
        </aside>
      </div>
    </div>
  );
}
