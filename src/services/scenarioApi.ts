import { getBackendUrl } from '../components/Dashboard/BackendConfig';
import { AuthenticationError } from './legacyApi';
import { testModeHeaders, withTestModeQuery } from '../testMode';

export interface ScenarioSlotSummary {
  slot_number: number;
  label: string;
  base_index: number;
  end_index: number;
  editable: boolean;
  last_launched?: number;
}

export interface ExchangeKV {
  k: number;
  v: string;
}

export interface ScenarioSlotDetail extends ScenarioSlotSummary {
  params: ExchangeKV[];
}

export interface BitmaskBit {
  bit: number;
  value: number;
  label: string;
}

export interface BitmaskField {
  index: number;
  name: string;
  description?: string;
  bits: BitmaskBit[];
}

const apiBase = (): string => {
  const backendUrl = getBackendUrl();
  return backendUrl === '' ? '/api/scenarios' : `${backendUrl}/api/scenarios`;
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

export const fetchScenarios = async (): Promise<ScenarioSlotSummary[]> => {
  const res = await handleResponse(await fetch(apiBase()));
  const data = await res.json();
  return data.slots ?? [];
};

export const fetchScenario = async (slot: number): Promise<ScenarioSlotDetail> => {
  const res = await handleResponse(await fetch(`${apiBase()}/${slot}`));
  return res.json();
};

export const launchScenario = async (slot: number): Promise<string> => {
  const res = await handleResponse(
    await fetch(withTestModeQuery(`${apiBase()}/${slot}/launch`), {
      method: 'POST',
      headers: testModeHeaders(),
    }),
  );
  const data = await res.json();
  if (data.dry_run && data.status === 'test_ok') {
    return `test-ok-${slot}`;
  }
  return data.guid as string;
};

export const updateScenario = async (
  slot: number,
  params: Record<number, string>,
): Promise<string[]> => {
  const res = await handleResponse(
    await fetch(`${apiBase()}/${slot}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ params }),
    }),
  );
  const data = await res.json();
  return (data.guids as string[]) ?? [];
};

export const restoreScenario = async (slot: number): Promise<string> => {
  const res = await handleResponse(
    await fetch(`${apiBase()}/${slot}/restore`, { method: 'POST' }),
  );
  const data = await res.json();
  return data.guid as string;
};

export const fetchScenarioBitmasks = async (): Promise<BitmaskField[]> => {
  const res = await handleResponse(await fetch(`${apiBase()}/meta/bitmasks`));
  const data = await res.json();
  return data.fields ?? [];
};
