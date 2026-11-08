import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BellAlertIcon } from '@heroicons/react/24/outline';
import { PageHeader, ControlCard } from '../components/UI';
import { useCanAdminLightTimers } from '../lights/useLightTimers';
import { useLightNames } from '../lights/useLightNames';
import { useObjectLayout } from '../layout/useObjectLayout';
import type { Camera } from '../services/unifiApi';
import {
  DEFAULT_SETTINGS, MAX_BLINKS, MIN_BLINKS, selectableLights, toggleLight, validateBlinks, type DoorbellSettings,
} from '../doorbell/doorbell';
import {
  getDoorbellCameras, getDoorbellSettings, setDoorbellSettings, testDoorbell,
} from '../doorbell/doorbellApi';
import { DOORBELL_REFRESH_EVENT } from '../doorbell/useDoorbellStatus';

const sameSettings = (a: DoorbellSettings, b: DoorbellSettings) =>
  a.enabled === b.enabled && a.camera_id === b.camera_id && a.blinks === b.blinks
  && a.lights.length === b.lights.length && a.lights.every((l, i) => l === b.lights[i]);

export const DoorbellPage: React.FC = () => {
  const canAdmin = useCanAdminLightTimers();
  const { nameOf } = useLightNames();
  const { layout } = useObjectLayout('lights');
  const [saved, setSaved] = useState<DoorbellSettings>(DEFAULT_SETTINGS);
  const [draft, setDraft] = useState<DoorbellSettings>(DEFAULT_SETTINGS);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [camerasError, setCamerasError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const s = await getDoorbellSettings();
      setSaved(s);
      setDraft(s);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lecture des réglages impossible');
    } finally {
      setLoading(false);
    }
    try {
      setCameras(await getDoorbellCameras());
      setCamerasError(null);
    } catch (e) {
      setCameras([]);
      setCamerasError(e instanceof Error ? e.message : 'Lecture des caméras impossible');
    }
  }, []);

  useEffect(() => {
    if (canAdmin) void load();
  }, [canAdmin, load]);

  const lights = useMemo(() => selectableLights(layout, draft.lights, (id) => nameOf(id)), [layout, draft.lights, nameOf]);
  const blinksError = validateBlinks(draft.blinks);
  const dirty = !sameSettings(saved, draft);

  const patch = (p: Partial<DoorbellSettings>) => {
    setDraft((d) => ({ ...d, ...p }));
    setMessage(null);
    setError(null);
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const next = await setDoorbellSettings(draft);
      setSaved(next);
      setDraft(next);
      setMessage('Réglages enregistrés');
      window.dispatchEvent(new Event(DOORBELL_REFRESH_EVENT));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Enregistrement impossible');
    } finally {
      setBusy(false);
    }
  };

  const tryRing = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const status = await testDoorbell();
      setMessage(status === 'dry_run' ? 'Essai à sec : aucune lumière commandée' : 'Essai lancé');
      window.dispatchEvent(new Event(DOORBELL_REFRESH_EVENT));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Essai impossible');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Sonnette"
        description="Vidéo et clignotement des lumières quand la sonnette UniFi est pressée"
        icon={BellAlertIcon}
        backLink="/settings"
        backLabel="Paramètres"
      />
      {!canAdmin ? (
        <p className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900" data-testid="doorbell-forbidden">
          Réservé à l&apos;administrateur de l&apos;armoire.
        </p>
      ) : loading ? (
        <p className="text-sm text-gray-500">Lecture des réglages…</p>
      ) : (
        <div className="space-y-4" data-testid="doorbell-settings">
          <ControlCard title="Fonction" description="Désactivée par défaut. Nécessite UniFi activé sur la passerelle.">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                role="switch"
                checked={draft.enabled}
                onChange={(e) => patch({ enabled: e.target.checked })}
                disabled={busy}
                data-testid="doorbell-enabled"
              />
              Activer la sonnette
            </label>
          </ControlCard>

          <ControlCard title="Caméra de la sonnette" description="Caméra dont la pression de la sonnette déclenche la fonction">
            <select
              aria-label="Caméra de la sonnette"
              value={draft.camera_id}
              onChange={(e) => patch({ camera_id: e.target.value })}
              disabled={busy}
              data-testid="doorbell-camera"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded bg-white"
            >
              <option value="">Aucune</option>
              {draft.camera_id && !cameras.some((c) => c.id === draft.camera_id) && (
                <option value={draft.camera_id}>Caméra enregistrée (absente de la console)</option>
              )}
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {camerasError && (
              <p className="mt-2 text-sm text-amber-800" data-testid="doorbell-cameras-error">
                Caméras indisponibles : {camerasError}
              </p>
            )}
          </ControlCard>

          <ControlCard title="Lumières à faire clignoter" description="Remises dans leur état d'origine après la séquence. Les lumières masquées ne sont pas proposées.">
            <ul className="grid gap-2 sm:grid-cols-2" data-testid="doorbell-lights">
              {lights.map((l) => (
                <li key={l.id}>
                  <label className="flex items-center gap-2 text-sm break-words">
                    <input
                      type="checkbox"
                      checked={draft.lights.includes(l.id)}
                      onChange={() => patch({ lights: toggleLight(draft.lights, l.id) })}
                      disabled={busy}
                      data-testid={`doorbell-light-${l.id}`}
                    />
                    <span className="min-w-0">{l.label}{l.hidden ? ' (masquée)' : ''}</span>
                  </label>
                </li>
              ))}
            </ul>
          </ControlCard>

          <ControlCard title="Clignotements" description={`De ${MIN_BLINKS} à ${MAX_BLINKS}. Le clignotement est lent : l'armoire lit les ordres à son rythme.`}>
            <input
              type="number"
              aria-label="Nombre de clignotements"
              min={MIN_BLINKS}
              max={MAX_BLINKS}
              step={1}
              value={Number.isNaN(draft.blinks) ? '' : draft.blinks}
              onChange={(e) => patch({ blinks: e.target.value === '' ? Number.NaN : Number(e.target.value) })}
              disabled={busy}
              data-testid="doorbell-blinks"
              className="w-24 px-3 py-2 text-sm border border-gray-300 rounded"
            />
            {blinksError && <p className="mt-2 text-sm text-red-700" data-testid="doorbell-blinks-error">{blinksError}</p>}
          </ControlCard>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void save()}
              disabled={busy || !dirty || blinksError !== null}
              className="px-3 py-1.5 text-sm rounded bg-essensys-primary text-white disabled:opacity-50"
            >
              Enregistrer
            </button>
            <button
              type="button"
              onClick={() => void tryRing()}
              disabled={busy || dirty}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 disabled:opacity-50"
            >
              Essayer
            </button>
            {dirty && <span className="text-xs text-gray-500">L&apos;essai utilise les réglages enregistrés.</span>}
          </div>
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="text-sm text-green-700">{message}</p>}
        </div>
      )}
    </div>
  );
};

export default DoorbellPage;
