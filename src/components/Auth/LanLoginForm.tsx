import { useState, type FormEvent, type ReactNode } from 'react';
import { useLanAuth } from '../../hooks/useLanAuth';

/** OAuth LAN — désactivé jusqu'à implémentation backend (OpenSpec futur). */
const OAUTH_PROVIDERS_ENABLED = false;

export type LanLoginFormProps = {
  subtitle: string;
  footer?: ReactNode;
  onSuccessNavigate: () => void;
  showLogoInCard?: boolean;
};

export function LanLoginForm({ subtitle, footer, onSuccessNavigate, showLogoInCard = true }: LanLoginFormProps) {
  const { login } = useLanAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(email, password);
      onSuccessNavigate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lan-auth-card">
      <div className="lan-auth-header">
        {showLogoInCard && (
          <img src="/images/logosml.png" alt="mon Essensys" className="lan-login-maison__logo mx-auto mb-4" />
        )}
        <h1>Bienvenue</h1>
        <p>{subtitle}</p>
      </div>

      {error && <div className="lan-auth-error mb-4">{error}</div>}

      <form className="lan-auth-form" onSubmit={onSubmit}>
        <div className="lan-auth-field">
          <label htmlFor="lan-email">Email</label>
          <input
            id="lan-email"
            type="email"
            required
            autoComplete="username"
            className="lan-auth-input"
            placeholder="exemple@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="lan-auth-field">
          <label htmlFor="lan-password">Mot de passe</label>
          <input
            id="lan-password"
            type="password"
            required
            autoComplete="current-password"
            className="lan-auth-input"
            placeholder="Votre mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <label className="lan-auth-remember" htmlFor="lan-remember">
          <input
            id="lan-remember"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <span>Se souvenir de moi</span>
        </label>

        <button type="submit" className="lan-auth-btn" disabled={submitting}>
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="lan-auth-divider" aria-hidden>
        <span>OU</span>
      </div>

      <div className="lan-auth-oauth">
        <button
          type="button"
          className="lan-auth-oauth-btn lan-auth-oauth-btn--google"
          disabled={!OAUTH_PROVIDERS_ENABLED}
          title={OAUTH_PROVIDERS_ENABLED ? undefined : 'Bientôt disponible sur le LAN'}
          aria-disabled={!OAUTH_PROVIDERS_ENABLED}
        >
          <span className="lan-auth-oauth-icon" aria-hidden>
            G
          </span>
          Continuer avec Google
        </button>
        <button
          type="button"
          className="lan-auth-oauth-btn lan-auth-oauth-btn--apple"
          disabled={!OAUTH_PROVIDERS_ENABLED}
          title={OAUTH_PROVIDERS_ENABLED ? undefined : 'Bientôt disponible sur le LAN'}
          aria-disabled={!OAUTH_PROVIDERS_ENABLED}
        >
          <span className="lan-auth-oauth-icon" aria-hidden>
            
          </span>
          Continuer avec Apple
        </button>
      </div>

      <p className="lan-auth-signup">
        Pas encore de compte ?{' '}
        <button
          type="button"
          className="lan-auth-signup-link"
          disabled
          title="Les comptes LAN sont créés par un administrateur"
        >
          S&apos;inscrire
        </button>
      </p>

      {footer && <div className="lan-auth-footer">{footer}</div>}
    </div>
  );
}
