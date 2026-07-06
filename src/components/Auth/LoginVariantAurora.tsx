import { usePostLoginNavigate } from '../../hooks/usePostLoginNavigate';
import { LanLoginForm } from './LanLoginForm';

export function LoginVariantAurora() {
  const onSuccessNavigate = usePostLoginNavigate();

  return (
    <div className="lan-login-root lan-login-aurora">
      <div className="lan-login-aurora__mesh" aria-hidden />
      <div className="lan-login-aurora__content">
        <div className="lan-login-aurora__panel">
          <LanLoginForm
            subtitle="Accès administration de votre gateway Essensys"
            onSuccessNavigate={onSuccessNavigate}
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
