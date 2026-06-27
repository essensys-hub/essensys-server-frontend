import { useState, type FormEvent } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard } from '../components/UI';
import { changeLanPassword } from '../api/lanIamApi';
import { useLanIamMode } from '../context/LanIamContext';
import { useLanAuth } from '../hooks/useLanAuth';
import { Navigate } from 'react-router-dom';

export function AccountSettingsPage() {
  const { enabled: lanIam } = useLanIamMode();
  const { user } = useLanAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!lanIam) {
    return <Navigate to="/settings" replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword.length < 12) {
      setError('Le mot de passe doit contenir au moins 12 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setSubmitting(true);
    try {
      await changeLanPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Mon compte"
        description="Changer votre mot de passe LAN"
        icon={UserCircleIcon}
        backLink="/settings"
        backLabel="Paramètres"
      />

      <ControlCard title="Profil" description="Compte connecté">
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium text-gray-900">{user?.email ?? '—'}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-gray-500">Rôle</dt>
            <dd className="font-medium text-gray-900">{user?.role ?? '—'}</dd>
          </div>
        </dl>
      </ControlCard>

      <form onSubmit={onSubmit} className="mt-6">
        <ControlCard title="Mot de passe" description="Session valide 7 jours après changement">
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {success && (
            <p className="mb-4 text-sm text-green-700">Mot de passe mis à jour. Les autres sessions sont invalidées.</p>
          )}
          <div className="space-y-4 max-w-md">
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Mot de passe actuel</span>
              <input
                type="password"
                required
                autoComplete="current-password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Nouveau mot de passe</span>
              <input
                type="password"
                required
                minLength={12}
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-gray-700">Confirmer</span>
              <input
                type="password"
                required
                autoComplete="new-password"
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-essensys-primary px-4 py-2 text-sm font-medium text-white hover:bg-essensys-primary-dark disabled:opacity-50"
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </ControlCard>
      </form>
    </div>
  );
}
