import type { DashboardState } from '../context/DashboardContext';
import { getBackendUrl } from '../components/Dashboard/BackendConfig';

// Error class for authentication errors
export class AuthenticationError extends Error {
    constructor(message: string = 'Authentification requise') {
        super(message);
        this.name = 'AuthenticationError';
    }
}

// Helper to handle 401 errors
const handleAuthError = (response: Response): void => {
    if (response.status === 401) {
        console.error('[AUTH] Erreur 401 - Authentification requise');
        if (import.meta.env.VITE_LAN_IAM === 'true') {
            window.location.href = '/login';
            throw new AuthenticationError();
        }
        alert('Session expirée ou authentification requise. Veuillez vous reconnecter.');
        window.location.reload();
        throw new AuthenticationError();
    }
};

// Types for the configuration of components that need to be mapped to dindex/dvalue
export interface LegacyMapping {
    name: string;
    dindex: string;
    dvalue: string;
    // For lights/shutters, sometimes the dindex/dvalue depends on the state
    // But based on analysis:
    // Shutters: have Radio buttons for Open (1) and Close (0).
    // The "Open" radio usually has dindex="617" dvalue="1" (example).
    // The "Close" radio usually has dindex="620" dvalue="1" (example, different dindex).
    openIndex?: string; // dindex when value is '1'
    closeIndex?: string; // dindex when value is '0'

    // For lights:
    // Often On (1) -> dindex=616, dvalue=4
    //       Off (0) -> dindex=610, dvalue=4
    onIndex?: string;
    offIndex?: string;
}

// Helper to determine if a value maps to an injection
interface InjectionAction {
    k: number;
    v: string;
}

import { chunkInjectionParams } from '../heating/injectLimits';
import type { InjectionProgressEvent } from '../heating/injectionProgress';
import type { HeatingSyncStatus, ScheduleSyncEvent } from '../heating/scheduleSync';
import { pollHeatingSync } from '../heating/scheduleSync';
import { formatTestVerdict, isTestModeEnabled, testModeHeaders, withTestModeQuery, type DryRunResponse } from '../testMode';
import { parseInjectionResult } from '../injectionResult';

export interface InjectionBatchResult {
  totalParams: number;
  chunkCount: number;
}

export type InjectionBatchProgressHandler = (event: InjectionProgressEvent) => void;

/** Envoie plusieurs indices (découpés en actions ≤30 params pour le firmware). */
export const sendInjectionBatch = async (
  items: Array<{ k: number; v: string }>,
  onProgress?: InjectionBatchProgressHandler,
): Promise<InjectionBatchResult> => {
  if (items.length === 0) {
    return { totalParams: 0, chunkCount: 0 };
  }

  const backendUrl = getBackendUrl();
  const apiUrl = withTestModeQuery(
    backendUrl === '' ? `/api/admin/inject` : `${backendUrl}/api/admin/inject`,
  );

  const chunks = chunkInjectionParams(items);
  console.log(`[BATCH INJECTION] ${items.length} param(s) → ${chunks.length} envoi(s) via ${apiUrl}`);
  onProgress?.({ type: 'start', totalParams: items.length, chunkCount: chunks.length });

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkIndex = i + 1;
    const keys = chunk.map(({ k }) => k);
    const indexMin = Math.min(...keys);
    const indexMax = Math.max(...keys);

    onProgress?.({
      type: 'sending',
      chunkIndex,
      chunkCount: chunks.length,
      paramsInChunk: chunk.length,
      indexMin,
      indexMax,
    });

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: testModeHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(chunk.map(({ k, v }) => ({ k, v: String(v) }))),
    });

    handleAuthError(response);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[BATCH INJECTION] Échec envoi ${chunkIndex}/${chunks.length}: ${response.status}`, errorText);
      onProgress?.({
        type: 'error',
        chunkIndex,
        chunkCount: chunks.length,
        message: errorText || `HTTP ${response.status}`,
      });
      throw new Error(errorText || `Batch injection failed (${response.status})`);
    }

    onProgress?.({
      type: 'success',
      chunkIndex,
      chunkCount: chunks.length,
      paramsInChunk: chunk.length,
      httpStatus: response.status,
    });
  }

  onProgress?.({ type: 'done', totalParams: items.length, chunkCount: chunks.length });
  return { totalParams: items.length, chunkCount: chunks.length };
};

export const sendInjection = async (k: number, v: string): Promise<'live' | 'dry_run'> => {
    const backendUrl = getBackendUrl();
    const currentProtocol = window.location.protocol;
    const currentHost = window.location.hostname;

    // Déterminer l'URL de l'API
    // Si backendUrl est vide (local), utiliser URL relative
    // Sinon, utiliser l'URL complète avec le bon protocole
    const apiUrl = withTestModeQuery(
        backendUrl === ''
        ? `/api/admin/inject`
        : `${backendUrl}/api/admin/inject`,
    );

    console.log('----------------------------------------');
    console.log(`[INJECTION] Hostname actuel: ${currentHost}:${window.location.port}`);
    console.log(`[INJECTION] Protocole actuel: ${currentProtocol}`);
    console.log(`[INJECTION] Backend URL configurée: ${backendUrl || '(relative - même serveur)'}`);
    console.log(`[INJECTION] URL API utilisée: ${apiUrl}`);
    console.log(`[INJECTION] Valeurs: k=${k}, v=${v}`);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: testModeHeaders({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({ k, v: String(v) }),
        });

        // Afficher le code retour du backend
        console.log(`[INJECTION] Code retour du backend: ${response.status} ${response.statusText}`);

        // Gérer les erreurs 401
        handleAuthError(response);

        if (!response.ok) {
            console.error(`[INJECTION] Échec de l'injection k=${k}, v=${v}: ${response.status} ${response.statusText}`);
            const errorText = await response.text().catch(() => '');
            console.error(`[INJECTION] Détails de l'erreur:`, errorText);
            throw new Error(errorText || `Injection failed (${response.status})`);
        }

        const responseData = await response.json().catch(() => null);
        const result = parseInjectionResult(responseData);
        if (result.kind === 'dry_run') {
            if (!isTestModeEnabled()) {
                throw new Error(
                    'Commande bloquée en dry-run alors que le mode test est désactivé — rechargez la page ou vérifiez Paramètres.',
                );
            }
            console.log(`[INJECTION] ${formatTestVerdict(responseData as DryRunResponse)}`);
            console.log('----------------------------------------');
            return 'dry_run';
        }
        console.log(`[INJECTION] Injection réussie k=${k}, v=${v}`, responseData);
        console.log('----------------------------------------');
        return 'live';
    } catch (error) {
        console.error('----------------------------------------');
        console.error(`[INJECTION] Erreur réseau lors de l'injection k=${k}, v=${v}:`, error);
        console.error(`[INJECTION] DNS appelé: ${backendUrl}`);
        console.error('----------------------------------------');
        throw error; // Re-throw pour que sendBatchInjections puisse gérer l'erreur
    }
};

// Reads back exchange table values reported by the firmware (e.g. shutter travel times 566-589).
// Returns a map index -> value; indices never reported by the firmware are absent.
export const getExchangeValues = async (keys: number[]): Promise<Record<number, string>> => {
    const backendUrl = getBackendUrl();
    const apiUrl = backendUrl === ''
        ? `/api/admin/exchange?keys=${keys.join(',')}`
        : `${backendUrl}/api/admin/exchange?keys=${keys.join(',')}`;

    console.log(`[EXCHANGE] Lecture des indices: ${keys.join(',')} via ${apiUrl}`);

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    handleAuthError(response);

    if (!response.ok) {
        console.error(`[EXCHANGE] Échec de la lecture: ${response.status} ${response.statusText}`);
        throw new Error(`Failed to read exchange values: ${response.statusText}`);
    }

    const data: { values: Array<{ k: number; v: string }> } = await response.json();
    const result: Record<number, string> = {};
    for (const kv of data.values ?? []) {
        result[kv.k] = kv.v;
    }
    console.log(`[EXCHANGE] Valeurs reçues:`, result);
    return result;
};

const adminApiBase = (): string => {
  const backendUrl = getBackendUrl();
  return backendUrl === '' ? '' : backendUrl;
};

export const startHeatingSync = async (
  startIndex: number,
  byteCount: number,
): Promise<{ chunksTotal: number; sync: HeatingSyncStatus }> => {
  const base = adminApiBase();
  const apiUrl = `${base}/api/admin/heating/sync`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ startIndex, byteCount }),
  });
  handleAuthError(response);
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(text || `Heating sync start failed (${response.status})`);
  }
  const data: { sync: HeatingSyncStatus } = await response.json();
  return { chunksTotal: data.sync.chunksTotal, sync: data.sync };
};

export const getHeatingSyncStatus = async (
  startIndex: number,
  byteCount: number,
): Promise<HeatingSyncStatus> => {
  const base = adminApiBase();
  const apiUrl = `${base}/api/admin/heating/sync/status?startIndex=${startIndex}&byteCount=${byteCount}`;
  const response = await fetch(apiUrl, { headers: { 'Content-Type': 'application/json' } });
  handleAuthError(response);
  if (!response.ok) {
    throw new Error(`Heating sync status failed (${response.status})`);
  }
  return response.json();
};

/** Demande à l'armoire de remonter le planning via rotation serverinfos, puis lit exchange. */
export const syncScheduleFromArmoire = async (
  startIndex: number,
  byteCount: number,
  zoneName: string,
  onProgress?: (event: ScheduleSyncEvent) => void,
): Promise<{ values: Record<number, string>; received: number; total: number }> => {
  const endIndex = startIndex + byteCount - 1;
  const { chunksTotal } = await startHeatingSync(startIndex, byteCount);
  onProgress?.({
    type: 'start',
    zoneName,
    startIndex,
    endIndex,
    chunksTotal,
  });

  const finalStatus = await pollHeatingSync(
    () => getHeatingSyncStatus(startIndex, byteCount),
    (event) => onProgress?.(event),
  );

  const keys = Array.from({ length: byteCount }, (_, i) => startIndex + i);
  const values = await getExchangeValues(keys);
  const received = Object.keys(values).length;
  const missing = byteCount - received;
  const sampleKeys = keys.filter((k) => k in values).slice(0, 3);
  const sample = sampleKeys.map((k) => `${k}=${values[k]}`).join(', ');

  onProgress?.({ type: 'loaded', received, total: byteCount, missing, sample });
  onProgress?.({
    type: 'done',
    received: Math.max(received, finalStatus.received),
    total: byteCount,
    complete: received >= byteCount,
  });

  return { values, received, total: byteCount };
};

export const sendBatchInjections = async (state: DashboardState, mappings: LegacyMapping[]): Promise<void> => {
    const backendUrl = getBackendUrl();
    const actions: InjectionAction[] = [];

    console.log('========================================');
    console.log('[BATCH INJECTION] Début du traitement');
    console.log(`[BATCH INJECTION] DNS backend: ${backendUrl}`);
    console.log('========================================');

    // Iterate over state to find modified controls
    for (const [key, value] of Object.entries(state)) {
        // Find matching mapping
        const mapping = mappings.find(m => m.name === key);
        if (!mapping) continue;

        // Check for ON/OFF type mappings (Lighting, Shutters)
        if (mapping.onIndex && mapping.offIndex && mapping.dvalue) {
            // '1' usually means ON/OPEN, '0' means OFF/CLOSE in this app's convention
            if (value === '1') {
                actions.push({ k: parseInt(mapping.onIndex, 10), v: mapping.dvalue });
            } else if (value === '0') {
                actions.push({ k: parseInt(mapping.offIndex, 10), v: mapping.dvalue });
            }
        }
        // Handle Shutters (Open/Close)
        else if (mapping.openIndex && mapping.closeIndex && mapping.dvalue) {
            if (value === '1') {
                actions.push({ k: parseInt(mapping.openIndex, 10), v: mapping.dvalue });
            } else if (value === '0') {
                actions.push({ k: parseInt(mapping.closeIndex, 10), v: mapping.dvalue });
            }
        }
    }

    if (actions.length === 0) {
        console.log("[BATCH INJECTION] Aucune action à injecter.");
        console.log('========================================');
        return;
    }

    console.log(`[BATCH INJECTION] Nombre d'actions à envoyer: ${actions.length}`);
    console.log(`[BATCH INJECTION] Actions:`, actions);

    // Execute sequentially
    for (let i = 0; i < actions.length; i++) {
        const action = actions[i];
        console.log(`[BATCH INJECTION] Envoi de l'action ${i + 1}/${actions.length}`);
        await sendInjection(action.k, action.v);
    }

    console.log('========================================');
    console.log("[BATCH INJECTION] Traitement terminé avec succès");
    console.log('========================================');
};

export const buildLegacyPayload = (state: DashboardState, mappings: LegacyMapping[]) => {
    // 1. Basic Named Fields (Hardcoded based on legacy essensys.js doactions logic)
    /*
    var vals = {
        newar: newar,
        ar: $('input:radio[name=arrosage]:checked').val(),
        newal: newal,
        al: $('input:radio[name=alarme]:checked').val(),
        alresp: $("#question").val(),
        codealarme: $("#codealarme").val(),
        newcf: newcf,
        cfzj: $('input:radio[name=chauffagezj]:checked').val(),
        newcfzn: newcfzn,
        cfzn: $('input:radio[name=chauffagezn]:checked').val(),
        newcfsdb1: newcfsdb1,
        cfsdb1: $('input:radio[name=chauffagesdb1]:checked').val(),
        newcfsdb2: newcfsdb2,
        cfsdb2: $('input:radio[name=chauffagesdb2]:checked').val(),
        newcm: newcm,
        cfcm: $('input:radio[name=cumulus]:checked').val(),
        cfvol: $('input:checkbox[name=volet]:checked').val(),
        cfsto: $('input:checkbox[name=store]:checked').val()
    };
    */

    // Helper to get string value or undefined
    const getVal = (key: string) => state[key] as string;
    // Helper to check if a "zone" was modified/visible. 
    // In React, we might assume if a value is set, it's modified, OR we rely on a dirty bit.
    // Legacy app checked `display: none` on the `<span>` "Changement de paramètre à valider".
    // For now, we will assume true if value exists in state, or strictly default to false/null.
    // However, the server might expect "true" strings for the `new*` fields.
    const isModified = (key: string) => state[key] !== undefined;

    const payload: Record<string, any> = {
        // Arrosage
        newar: isModified('arrosage') || false,
        ar: getVal('arrosage'),

        // Alarme
        newal: isModified('alarme') || false,
        al: getVal('alarme'),
        alresp: getVal('alresp') || '',
        codealarme: getVal('codealarme') || '',

        // Chauffage
        newcf: isModified('chauffagezj') || false,
        cfzj: getVal('chauffagezj'),

        newcfzn: isModified('chauffagezn') || false,
        cfzn: getVal('chauffagezn'),

        newcfsdb1: isModified('chauffagesdb1') || false,
        cfsdb1: getVal('chauffagesdb1'),

        newcfsdb2: isModified('chauffagesdb2') || false,
        cfsdb2: getVal('chauffagesdb2'),

        // Cumulus
        newcm: isModified('cumulus') || false,
        cfcm: getVal('cumulus'),

        // Checkboxes (legacy commented out in view but processed in js?)
        // cfvol: $('input:checkbox[name=volet]:checked').val(), -> map to boolean
        cfvol: state['volet'] ? 'true' : undefined, // Check functionality
        cfsto: state['store_glob'] ? 'true' : undefined,
    };

    // 2. Dynamic Fields (vl_<dindex>_<index>)
    // Logic: Iterate over all mappings. If state matches "active" condition (e.g. value='1'),
    // add to payload.
    // Legacy: `if ($(o).is(":checked")) { vals["vl_" + $(o).attr("dindex") + "_" + i] = $(o).attr("dvalue"); }`
    // Note the `i` (index) parameter. It seems to be a unique iterator index from the loop.
    // We need to generate unique indices. We can just increment a counter.

    let indexCounter = 0;

    mappings.forEach((m) => {
        const val = state[m.name];
        if (!val) return; // Not set or empty

        let targetIndex = '';
        let targetValue = m.dvalue;

        if (m.openIndex && val === '1') {
            targetIndex = m.openIndex;
        } else if (m.closeIndex && val === '0') {
            targetIndex = m.closeIndex;
        } else if (m.onIndex && val === '1') {
            targetIndex = m.onIndex;
        } else if (m.offIndex && val === '0') {
            targetIndex = m.offIndex;
        } else {
            // Basic case if dindex is static (rare for these toggles)
            targetIndex = m.dindex;
        }

        if (targetIndex && targetValue) {
            const key = `vl_${targetIndex}_${indexCounter++}`;
            payload[key] = targetValue;
        }
    });

    return payload;
};

// Response type for history/latest endpoint
export interface LastActionResponse {
    lastAction: {
        id: number;
        guid: string;
        machineId: number;
        actionType: string;
        actionInfo: string;
        isDone: boolean;
        timestamp: string;
        indexes: Array<{
            id: number;
            action_id: number;
            index_id: number;
            value: string;
        }>;
    } | null;
    message: string;
}

export const getHistoryLatest = async (): Promise<LastActionResponse> => {
    const backendUrl = getBackendUrl();
    const apiUrl = backendUrl === ''
        ? `/api/web/history/latest`
        : `${backendUrl}/api/web/history/latest`;

    console.log(`[HISTORY] Fetching latest action history from: ${apiUrl}`);

    try {
        const response = await fetch(apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include', // Include session cookie
        });

        // Gérer les erreurs 401
        handleAuthError(response);

        if (!response.ok) {
            console.error(`[HISTORY] Failed: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to get history: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[HISTORY] Success:`, data);
        return data;
    } catch (error) {
        console.error(`[HISTORY] Error:`, error);
        throw error;
    }
};

export const sendAlarmAction = async (alarmState: string, code: string): Promise<any> => {
    const backendUrl = getBackendUrl();
    const apiUrl = backendUrl === ''
        ? `/api/web/actions`
        : `${backendUrl}/api/web/actions`;

    console.log(`[ALARM] Sending Action: State=${alarmState}, Code=${code}`);

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ alarme: alarmState, codealarme: code }),
        });

        // Gérer les erreurs 401
        handleAuthError(response);

        if (!response.ok) {
            console.error(`[ALARM] Failed: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to send alarm action: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[ALARM] Success:`, data);
        return data;
    } catch (error) {
        console.error(`[ALARM] Error:`, error);
        throw error;
    }
};

