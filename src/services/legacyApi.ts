import type { DashboardState } from '../context/DashboardContext';
import { getBackendUrl } from '../components/Dashboard/BackendConfig';

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

export const sendInjection = async (k: number, v: string): Promise<void> => {
    const backendUrl = getBackendUrl();
    const apiUrl = `${backendUrl}/api/admin/inject`;
    
    console.log('----------------------------------------');
    console.log(`[INJECTION] DNS appelé: ${backendUrl}`);
    console.log(`[INJECTION] URL complète: ${apiUrl}`);
    console.log(`[INJECTION] Valeurs: k=${k}, v=${v}`);
    
    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ k, v: String(v) }),
        });

        // Afficher le code retour du backend
        console.log(`[INJECTION] Code retour du backend: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
            console.error(`[INJECTION] Échec de l'injection k=${k}, v=${v}: ${response.status} ${response.statusText}`);
            const errorText = await response.text().catch(() => '');
            console.error(`[INJECTION] Détails de l'erreur:`, errorText);
        } else {
            const responseData = await response.json().catch(() => null);
            console.log(`[INJECTION] Injection réussie k=${k}, v=${v}`);
            if (responseData) {
                console.log(`[INJECTION] Réponse du backend:`, responseData);
            }
        }
        console.log('----------------------------------------');
    } catch (error) {
        console.error('----------------------------------------');
        console.error(`[INJECTION] Erreur réseau lors de l'injection k=${k}, v=${v}:`, error);
        console.error(`[INJECTION] DNS appelé: ${backendUrl}`);
        console.error('----------------------------------------');
        throw error; // Re-throw pour que sendBatchInjections puisse gérer l'erreur
    }
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
