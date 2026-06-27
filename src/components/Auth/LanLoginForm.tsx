import { useState, type FormEvent, type ReactNode } from 'react';
import { useLanAuth } from '../../hooks/useLanAuth';

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
        <button type="submit" className="lan-auth-btn" disabled={submitting}>
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      {footer && <div className="lan-auth-footer">{footer}</div>}
    </div>
  );
}
