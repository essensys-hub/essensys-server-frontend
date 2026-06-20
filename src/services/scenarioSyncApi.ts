import { getBackendUrl } from '../components/Dashboard/BackendConfig';
import { AuthenticationError } from './legacyApi';

export interface ScenariosSyncStatus {
  enabled: boolean;
  profile_id?: string;
  found: boolean;
  message?: string;
}

const apiBase = (): string => {
  const backendUrl = getBackendUrl();
  return backendUrl === '' ? '' : backendUrl;
};

const handleResponse = async (res: Response): Promise<Response> => {
  if (res.status === 401) {
    alert('Authentification requise.');
    window.location.reload();
    throw new AuthenticationError();
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res;
};

export const getScenariosSyncStatus = async (): Promise<ScenariosSyncStatus> => {
  const response = await fetch(`${apiBase()}/api/admin/scenarios/sync`, {
    headers: { 'Content-Type': 'application/json' },
  });
  await handleResponse(response);
  return response.json();
};

export const setScenariosSyncEnabled = async (enabled: boolean): Promise<ScenariosSyncStatus> => {
  const response = await fetch(`${apiBase()}/api/admin/scenarios/sync`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled }),
  });
  await handleResponse(response);
  return response.json();
};
