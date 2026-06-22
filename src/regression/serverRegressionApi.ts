import { getBackendUrl } from '../components/Dashboard/BackendConfig';
import type { DryRunResponse } from '../testMode';
import { dryRunHeaders, withDryRunQuery } from './dryRunFetch';
import type { RegressionClient } from './types';

function apiRoot(): string {
  const backendUrl = getBackendUrl();
  return backendUrl === '' ? '' : backendUrl;
}

function adminUrl(path: string): string {
  return `${apiRoot()}/api/admin${path}`;
}

function scenariosUrl(path: string): string {
  const backendUrl = getBackendUrl();
  const base = backendUrl === '' ? '/api/scenarios' : `${backendUrl}/api/scenarios`;
  return `${base}${path}`;
}

async function parseDryRun(res: Response): Promise<DryRunResponse> {
  const data = (await res.json()) as DryRunResponse;
  if (!res.ok && data.status !== 'test_failed') {
    throw new Error(data.message ?? `HTTP ${res.status}`);
  }
  return data;
}

export const serverRegressionClient: RegressionClient = {
  async injectDryRun(k, v) {
    const res = await fetch(withDryRunQuery(adminUrl('/inject')), {
      method: 'POST',
      headers: dryRunHeaders(),
      body: JSON.stringify({ k, v }),
    });
    return parseDryRun(res);
  },

  async listScenarios() {
    const res = await fetch(scenariosUrl(''));
    if (!res.ok) {
      throw new Error(`Liste scénarios : HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.slots ?? [];
  },

  async launchScenarioDryRun(slot) {
    const res = await fetch(withDryRunQuery(scenariosUrl(`/${slot}/launch`)), {
      method: 'POST',
      headers: dryRunHeaders(),
    });
    return parseDryRun(res);
  },

  async readExchange(keys) {
    const res = await fetch(withDryRunQuery(adminUrl(`/exchange?keys=${keys.join(',')}`)), {
      headers: dryRunHeaders(),
    });
    if (!res.ok) {
      throw new Error(`Exchange : HTTP ${res.status}`);
    }
    const data = await res.json();
    return data.values ?? [];
  },
};
