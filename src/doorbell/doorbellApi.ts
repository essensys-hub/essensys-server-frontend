import { getBackendUrl } from '../components/Dashboard/BackendConfig';
import { testModeHeaders, withTestModeQuery } from '../testMode';
import type { Camera } from '../services/unifiApi';
import {
  buildSettingsWrite, doorbellErrorMessage, parseSettings, parseStatus,
  type DoorbellSettings, type DoorbellStatus,
} from './doorbell';

const base = (): string => getBackendUrl();

export type DoorbellWriteStatus = 'saved' | 'dry_run';

/** Erreur de lecture de l'état : `status` vaut 404 quand la gateway ne connaît pas la sonnette (ancienne version). */
export class DoorbellHttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Interrogation de l'état. Pas de redirection de connexion ici : l'interrogation tourne en arrière-plan. */
export const getDoorbellStatus = async (): Promise<DoorbellStatus> => {
  const response = await fetch(`${base()}/api/doorbell/status`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) throw new DoorbellHttpError(response.status, `Lecture de l'état de la sonnette impossible (${response.status})`);
  return parseStatus(await response.json());
};

/** Flux d'instantanés servi par la gateway (jamais l'adresse de la console ni la clé d'API). */
export const doorbellStreamUrl = (ring: string): string => `${base()}/api/doorbell/stream?ring=${encodeURIComponent(ring)}`;

const errorOf = async (response: Response, fallback: string): Promise<Error> => {
  const data = await response.json().catch(() => null) as { error?: string } | null;
  const message = doorbellErrorMessage(response.status, data?.error ?? null);
  return new Error(response.status === 403 || data?.error ? message : `${fallback} (${response.status})`);
};

export const getDoorbellSettings = async (): Promise<DoorbellSettings> => {
  const response = await fetch(`${base()}/api/admin/doorbell/settings`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
  if (!response.ok) throw await errorOf(response, 'Lecture des réglages impossible');
  return parseSettings(await response.json());
};

export const setDoorbellSettings = async (settings: DoorbellSettings): Promise<DoorbellSettings> => {
  const response = await fetch(`${base()}/api/admin/doorbell/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildSettingsWrite(settings)),
  });
  if (!response.ok) throw await errorOf(response, 'Enregistrement impossible');
  return parseSettings(await response.json());
};

/** Caméras de la console UniFi (liste existante de la gateway). */
export const getDoorbellCameras = async (): Promise<Camera[]> => {
  const response = await fetch(`${base()}/api/unifi/cameras`, { method: 'GET', credentials: 'include' });
  if (!response.ok) throw await errorOf(response, 'Lecture des caméras impossible');
  const data = await response.json() as { cameras?: Camera[] };
  return data.cameras ?? [];
};

/** Essai : simule une pression. Mode test du portail : en-tête dry-run, aucune écriture dans l'armoire. */
export const testDoorbell = async (): Promise<DoorbellWriteStatus> => {
  const response = await fetch(withTestModeQuery(`${base()}/api/admin/doorbell/test`), {
    method: 'POST',
    headers: testModeHeaders({ 'Content-Type': 'application/json' }),
  });
  if (!response.ok) throw await errorOf(response, 'Essai impossible');
  const data = await response.json().catch(() => null) as { status?: string } | null;
  return data?.status === 'dry_run' ? 'dry_run' : 'saved';
};
