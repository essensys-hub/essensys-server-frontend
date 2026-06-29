import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { UserCircleIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard } from '../components/UI';
import {
  changeLanPassword,
  createTrustedDevice,
  listTrustedDeviceCandidates,
  listTrustedDevices,
  revokeTrustedDevice,
  type TrustedDevice,
  type TrustedDeviceCandidate,
} from '../api/lanIamApi';
import { useLanIamMode } from '../context/LanIamContext';
import { useLanAuth } from '../hooks/useLanAuth';
import { Navigate } from 'react-router-dom';

function formatDate(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('fr-FR');
}

export function AccountSettingsPage() {
  const { enabled: lanIam } = useLanIamMode();
  const { user } = useLanAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [candidates, setCandidates] = useState<TrustedDeviceCandidate[]>([]);
  const [trustedLoading, setTrustedLoading] = useState(false);
  const [trustedError, setTrustedError] = useState<string | null>(null);
  const [selectedMac, setSelectedMac] = useState('');

  const trustedDevicesEnabled = Boolean(user?.can_use_trusted_devices);

  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.mac_address === selectedMac) ?? null,
    [candidates, selectedMac],
  );

  const loadTrusted = useCallback(async () => {
    if (!trustedDevicesEnabled) return;
    setTrustedLoading(true);
    setTrustedError(null);
    try {
      const [devicesRes, candidatesRes] = await Promise.allSettled([
        listTrustedDevices(),
        listTrustedDeviceCandidates(),
      ]);
      if (devicesRes.status === 'fulfilled') {
        setTrustedDevices(devicesRes.value);
      } else {
        setTrustedError(devicesRes.reason instanceof Error ? devicesRes.reason.message : 'Erreur appareils');
      }
      if (candidatesRes.status === 'fulfilled') {
        setCandidates(candidatesRes.value);
        setSelectedMac((current) => current || candidatesRes.value[0]?.mac_address || '');
      } else {
        setTrustedError((current) =>
          current ?? (candidatesRes.reason instanceof Error ? candidatesRes.reason.message : 'Erreur détection'),
        );
      }
    } finally {
      setTrustedLoading(false);
    }
  }, [trustedDevicesEnabled]);

  useEffect(() => {
    void loadTrusted();
  }, [loadTrusted]);

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

  const onTrustDevice = async () => {
    if (!selectedCandidate) return;
    setTrustedError(null);
    try {
      const device = await createTrustedDevice(selectedCandidate);
      setTrustedDevices((current) => [device, ...current.filter((item) => item.id !== device.id)]);
    } catch (err) {
      setTrustedError(err instanceof Error ? err.message : 'Erreur trusted devices');
    }
  };

  const onRevokeDevice = async (id: number) => {
    if (!window.confirm('Révoquer cet appareil de confiance ?')) return;
    try {
      await revokeTrustedDevice(id);
      setTrustedDevices((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setTrustedError(err instanceof Error ? err.message : 'Erreur trusted devices');
    }
  };

  return (
    <div>
      <PageHeader
        title="Mon compte"
        description="Changer votre mot de passe LAN et gérer les appareils de confiance"
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
          <div className="flex justify-between py-2 border-b border-gray-100">
            <dt className="text-gray-500">Rôle</dt>
            <dd className="font-medium text-gray-900">{user?.role ?? '—'}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-gray-500">Auto-login par appareil</dt>
            <dd className="font-medium text-gray-900">
              {trustedDevicesEnabled
                ? 'Autorisé — renouvellement tous les 2 mois (ou permanent si appairé par un admin)'
                : 'Non disponible pour ce compte'}
            </dd>
          </div>
        </dl>
      </ControlCard>

      {trustedDevicesEnabled && (
        <div className="mt-6 space-y-6">
          <ControlCard
            title="Appareils de confiance"
            description="Activez l’auto-login sur cet appareil : valable 60 jours, puis mot de passe obligatoire."
          >
            <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
              Après 2 mois, reconnectez-vous avec votre mot de passe puis réactivez la confiance si besoin.
              Un administrateur peut aussi vous accorder un appairage <strong>permanent</strong> (sans expiration).
            </div>
            {trustedError && <p className="mb-4 text-sm text-red-600">{trustedError}</p>}
            {candidates.length === 0 && !trustedLoading && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                Aucun appareil enregistré. Connectez-vous depuis cet appareil avec votre email et mot de passe, puis cliquez Rafraîchir.
              </div>
            )}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">
              <div>
                <label className="block text-sm font-medium text-gray-700">Client détecté</label>
                <select
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  value={selectedMac}
                  onChange={(e) => setSelectedMac(e.target.value)}
                  disabled={trustedLoading || candidates.length === 0}
                >
                  {candidates.length === 0 && <option value="">Aucun client LAN détecté</option>}
                  {candidates.map((candidate) => (
                    <option key={candidate.mac_address} value={candidate.mac_address}>
                      {candidate.source_ip ? `${candidate.source_ip} — ` : ''}{candidate.mac_address}
                      {candidate.last_seen_at ? ` (${formatDate(candidate.last_seen_at)})` : ''}
                    </option>
                  ))}
                </select>
                {selectedCandidate && (
                  <div className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
                    <p><span className="font-medium text-gray-800">MAC :</span> {selectedCandidate.mac_address}</p>
                    <p><span className="font-medium text-gray-800">IP :</span> {selectedCandidate.source_ip ?? '—'}</p>
                    <p><span className="font-medium text-gray-800">Vu le :</span> {formatDate(selectedCandidate.last_seen_at)}</p>
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    onClick={() => void loadTrusted()}
                    disabled={trustedLoading}
                  >
                    Rafraîchir
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-essensys-primary px-4 py-2 text-sm font-medium text-white hover:bg-essensys-primary-dark disabled:opacity-50"
                    onClick={() => void onTrustDevice()}
                    disabled={!selectedCandidate}
                  >
                    Faire confiance — 60 jours
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-gray-500">
                      <th className="py-2 pr-4">Appareil</th>
                      <th className="py-2 pr-4">MAC</th>
                      <th className="py-2 pr-4">Expire le</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trustedDevices.map((device) => (
                      <tr key={device.id} className="border-b border-gray-100">
                        <td className="py-2 pr-4">{device.device_label}</td>
                        <td className="py-2 pr-4 font-mono text-xs">{device.mac_address}</td>
                        <td className="py-2 pr-4">{formatDate(device.expires_at)}</td>
                        <td className="py-2">
                          <button
                            type="button"
                            className="text-red-600 hover:underline"
                            onClick={() => void onRevokeDevice(device.id)}
                          >
                            Révoquer
                          </button>
                        </td>
                      </tr>
                    ))}
                    {!trustedLoading && trustedDevices.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-gray-500">Aucun appareil de confiance enregistré.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ControlCard>
        </div>
      )}

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
