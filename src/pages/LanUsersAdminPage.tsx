import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Navigate } from 'react-router-dom';
import { PageHeader, ControlCard } from '../components/UI';
import {
  createLanUser,
  disableLanUser,
  enableLanUser,
  listLanUsers,
  resetLanUserPassword,
} from '../api/lanIamApi';
import type { LanUser } from '../hooks/useLanAuth';
import { useLanIamMode } from '../context/LanIamContext';
import { useLanAuth } from '../hooks/useLanAuth';

const ROLES = [
  { value: 'lan_user', label: 'Utilisateur' },
  { value: 'lan_guest', label: 'Invité' },
  { value: 'lan_admin', label: 'Administrateur' },
];

export function LanUsersAdminPage() {
  const { enabled: lanIam } = useLanIamMode();
  const { user } = useLanAuth();
  const [users, setUsers] = useState<LanUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('lan_user');
  const [displayName, setDisplayName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await listLanUsers());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'lan_admin') {
      void load();
    }
  }, [user, load]);

  if (!lanIam) {
    return <Navigate to="/settings" replace />;
  }
  if (user && user.role !== 'lan_admin') {
    return <Navigate to="/settings" replace />;
  }

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await createLanUser({
        email,
        password,
        role,
        display_name: displayName || undefined,
      });
      setEmail('');
      setPassword('');
      setDisplayName('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const onReset = async (id: number) => {
    const pwd = window.prompt('Nouveau mot de passe (min. 12 caractères) :');
    if (!pwd || pwd.length < 12) return;
    try {
      await resetLanUserPassword(id, pwd);
      alert('Mot de passe réinitialisé');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const onDisable = async (id: number) => {
    if (!window.confirm('Désactiver cet utilisateur ?')) return;
    try {
      await disableLanUser(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  };

  const onEnable = async (id: number) => {
    if (!window.confirm('Réactiver cet utilisateur ?')) return;
    try {
      await enableLanUser(id);
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur');
    }
  };

  return (
    <div>
      <PageHeader
        title="Comptes .local"
        description="Création, bannissement et réactivation des utilisateurs mon.essensys.local"
        icon={UsersIcon}
        backLink="/settings"
        backLabel="Paramètres"
      />

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      <ControlCard title="Nouveau compte">
        <form onSubmit={onCreate} className="grid gap-4 md:grid-cols-2 max-w-3xl">
          <label className="block text-sm">
            Email
            <input
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Nom affiché
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Mot de passe
            <input
              type="password"
              required
              minLength={12}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Rôle
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-essensys-primary px-4 py-2 text-sm font-medium text-white hover:bg-essensys-primary-dark"
            >
              Créer
            </button>
          </div>
        </form>
      </ControlCard>

      <ControlCard title="Comptes existants" description={loading ? 'Chargement…' : `${users.length} compte(s)`}>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Rôle</th>
                <th className="py-2 pr-4">Statut</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100">
                  <td className="py-2 pr-4">{u.email}</td>
                  <td className="py-2 pr-4">{u.role}</td>
                  <td className="py-2 pr-4">
                    {u.disabled_at ? (
                      <span className="text-red-600">Désactivé</span>
                    ) : (
                      <span className="text-green-600">Actif</span>
                    )}
                  </td>
                  <td className="py-2 space-x-2">
                    {u.disabled_at ? (
                      <button
                        type="button"
                        className="text-green-700 hover:underline"
                        onClick={() => void onEnable(u.id)}
                      >
                        Réactiver
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="text-essensys-primary hover:underline"
                          onClick={() => void onReset(u.id)}
                        >
                          Réinit. MDP
                        </button>
                        {u.id !== user?.id && (
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={() => void onDisable(u.id)}
                          >
                            Bannir
                          </button>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ControlCard>
    </div>
  );
}
