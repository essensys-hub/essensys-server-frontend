import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanAuth } from '../hooks/useLanAuth';

export function LoginPage() {
  const { login } = useLanAuth();
  const navigate = useNavigate();
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
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-4">
      <form onSubmit={onSubmit} className="w-full max-w-md space-y-4 bg-slate-800 p-8 rounded-xl shadow-lg">
        <h1 className="text-2xl font-semibold">Essensys — connexion LAN</h1>
        <p className="text-sm text-slate-300">mon.essensys.local</p>
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <label className="block text-sm">
          Email
          <input
            type="email"
            required
            className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm">
          Mot de passe
          <input
            type="password"
            required
            className="mt-1 w-full rounded border border-slate-600 bg-slate-900 px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-emerald-600 py-2 font-medium hover:bg-emerald-500 disabled:opacity-50"
        >
          {submitting ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
    </div>
  );
}
