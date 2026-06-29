import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import { Navigate } from 'react-router-dom';
import { PageHeader, ControlCard } from '../components/UI';
import {
  createAdminTrustedDevice,
  createLanUser,
  disableLanUser,
  enableLanUser,
  listAdminTrustedDeviceCandidates,
  listAdminTrustedDevices,
  listLanUsers,
  promoteTrustedDevice,
  resetLanUserPassword,
  revokeTrustedDeviceAdmin,
  type TrustedDevice,
  type TrustedDeviceCandidate,
} from '../api/lanIamApi';
import type { LanUser } from '../hooks/useLanAuth';
import { useLanIamMode } from '../context/LanIamContext';
import { useLanAuth } from '../hooks/useLanAuth';

const ROLES = [
  { value: 'lan_user', label: 'Utilisateur' },
  { value: 'lan_guest', label: 'Invité' },
  { value: 'lan_admin', label: 'Administrateur' },
];

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR');
}

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
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [candidates, setCandidates] = useState<TrustedDeviceCandidate[]>([]);
  const [trustedError, setTrustedError] = useState<string | null>(null);
  const [pairingId, setPairingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setTrustedError(null);
    try {
      const [usersRes, devicesRes, candidatesRes] = await Promise.allSettled([
        listLanUsers(),
        listAdminTrustedDevices(),
        listAdminTrustedDeviceCandidates(),
      ]);

      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value);
      } else {
        setError(usersRes.reason instanceof Error ? usersRes.reason.message : 'Erreur chargement comptes');
      }

      if (devicesRes.status === 'fulfilled') {
        setTrustedDevices(devicesRes.value);
      } else {
        const message = devicesRes.reason instanceof Error ? devicesRes.reason.message : 'Erreur appareils de confiance';
        setTrustedError(message);
      }

      if (candidatesRes.status === 'fulfilled') {
        setCandidates(candidatesRes.value);
      } else {
        const message = candidatesRes.reason instanceof Error ? candidatesRes.reason.message : 'Erreur détection clients';
        setTrustedError((current) => current ?? message);
      }
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

  const onCreateTrustedDevice = async (row: TrustedDeviceCandidate) => {
    if (!row.lan_user_id) return;
    const rowKey = `${row.lan_user_id}-${row.mac_address}`;
    setTrustedError(null);
    setPairingId(rowKey);
    try {
      const device = await createAdminTrustedDevice({
        lan_user_id: row.lan_user_id,
        mac_address: row.mac_address,
        device_label: row.device_label,
        source_ip: row.source_ip,
      });
      setTrustedDevices((current) => [device, ...current.filter((item) => item.id !== device.id)]);
    } catch (err) {
      setTrustedError(err instanceof Error ? err.message : 'Erreur trusted devices');
    } finally {
      setPairingId(null);
    }
  };

  const onPromote = async (id: number) => {
    try {
      await promoteTrustedDevice(id);
      await load();
    } catch (err) {
      setTrustedError(err instanceof Error ? err.message : 'Erreur trusted devices');
    }
  };

  const onRevokeTrusted = async (id: number) => {
    if (!window.confirm('Révoquer cet appareil de confiance ?')) return;
    try {
      await revokeTrustedDeviceAdmin(id);
      setTrustedDevices((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setTrustedError(err instanceof Error ? err.message : 'Erreur trusted devices');
    }
  };

  return (
    <div>
      <PageHeader
        title="Comptes .local"
        description="Création, bannissement, réactivation et appairages MAC permanents"
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

      <div className="mt-6">
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
                      {u.disabled_at ? <span className="text-red-600">Désactivé</span> : <span className="text-green-600">Actif</span>}
                    </td>
                    <td className="py-2 space-x-2">
                      {u.disabled_at ? (
                        <button type="button" className="text-green-700 hover:underline" onClick={() => void onEnable(u.id)}>
                          Réactiver
                        </button>
                      ) : (
                        <>
                          <button type="button" className="text-essensys-primary hover:underline" onClick={() => void onReset(u.id)}>
                            Réinit. MDP
                          </button>
                          {u.id !== user?.id && (
                            <button type="button" className="text-red-600 hover:underline" onClick={() => void onDisable(u.id)}>
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

      <div className="mt-6 space-y-6">
        <ControlCard
          title="Appairage auto-login (admin)"
          description="Rendez permanent l’auto-login d’un compte (Utilisateur, Invité ou Administrateur local) — sauf le compte usine."
        >
          <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 space-y-2">
            <p><strong>Utilisateur / Invité / Admin local</strong> — auto-login possible (60 jours via <em>Mon compte</em>, ou permanent ici).</p>
            <p><strong>Administrateur local</strong> (ex. <code className="text-xs">nicolas@rineau.eu</code>) — peut s’appairer ou être appairé en permanent.</p>
            <p><strong>Compte usine <code className="text-xs">admin@essensys.local</code></strong> — seul compte exclu : mot de passe obligatoire à chaque connexion.</p>
          </div>
          {trustedError && <p className="mb-4 text-sm text-red-600">{trustedError}</p>}
          {candidates.length === 0 && !loading && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-medium">Aucune connexion enregistrée (hors compte usine)</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>Connectez-vous sur l’appareil cible via <code className="text-xs">https://mon.essensys.local/login</code></li>
                <li>Revenez ici et cliquez <strong>Rafraîchir la liste</strong> → <strong>Appairer (permanent)</strong></li>
              </ol>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Utilisateur</th>
                  <th className="py-2 pr-4">Rôle</th>
                  <th className="py-2 pr-4">MAC</th>
                  <th className="py-2 pr-4">IP</th>
                  <th className="py-2 pr-4">Dernière connexion</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((row) => {
                  const rowKey = `${row.lan_user_id ?? 'x'}-${row.mac_address}`;
                  return (
                    <tr key={rowKey} className="border-b border-gray-100">
                      <td className="py-2 pr-4">
                        <div className="font-medium text-gray-900">{row.lan_user_email ?? '—'}</div>
                        {row.lan_user_display_name && (
                          <div className="text-xs text-gray-500">{row.lan_user_display_name}</div>
                        )}
                      </td>
                      <td className="py-2 pr-4">{row.lan_user_role ?? '—'}</td>
                      <td className="py-2 pr-4 font-mono text-xs">{row.mac_address}</td>
                      <td className="py-2 pr-4">{row.source_ip ?? '—'}</td>
                      <td className="py-2 pr-4">{formatDate(row.last_seen_at)}</td>
                      <td className="py-2">
                        <button
                          type="button"
                          className="text-essensys-primary hover:underline disabled:opacity-50"
                          onClick={() => void onCreateTrustedDevice(row)}
                          disabled={!row.lan_user_id || pairingId === rowKey}
                        >
                          {pairingId === rowKey ? 'Création…' : 'Appairer (permanent)'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && candidates.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-gray-500">Aucune connexion à afficher.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4">
            <button
              type="button"
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => void load()}
              disabled={loading}
            >
              Rafraîchir la liste
            </button>
          </div>
        </ControlCard>

        <ControlCard title="Appareils de confiance actifs" description={`${trustedDevices.length} appairage(s) actif(s)`}>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Utilisateur</th>
                  <th className="py-2 pr-4">Appareil</th>
                  <th className="py-2 pr-4">MAC</th>
                  <th className="py-2 pr-4">Mode</th>
                  <th className="py-2 pr-4">Expire le</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {trustedDevices.map((device) => (
                  <tr key={device.id} className="border-b border-gray-100">
                    <td className="py-2 pr-4">{device.lan_user_email ?? device.lan_user_id}</td>
                    <td className="py-2 pr-4">{device.device_label}</td>
                    <td className="py-2 pr-4 font-mono text-xs">{device.mac_address}</td>
                    <td className="py-2 pr-4">{device.trust_mode === 'permanent' ? 'Permanent' : 'Temporaire'}</td>
                    <td className="py-2 pr-4">{formatDate(device.expires_at)}</td>
                    <td className="py-2 space-x-2">
                      {device.trust_mode !== 'permanent' && (
                        <button type="button" className="text-essensys-primary hover:underline" onClick={() => void onPromote(device.id)}>
                          Promouvoir permanent
                        </button>
                      )}
                      <button type="button" className="text-red-600 hover:underline" onClick={() => void onRevokeTrusted(device.id)}>
                        Révoquer
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && trustedDevices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-4 text-gray-500">Aucun appareil de confiance actif.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </ControlCard>
      </div>
    </div>
  );
}
