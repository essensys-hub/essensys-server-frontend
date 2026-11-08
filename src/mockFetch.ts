import { handleMockScenarioRequest } from './mockScenarios';
import { LIGHT_NAME_CATALOG, MAX_NAME_LENGTH } from './lights/lightNames';
import { SHUTTER_NAME_CATALOG } from './shutters/shutterNames';
import { CATALOGUES, type LayoutKind } from './layout/objectLayout';
import { MAX_BLINKS, MIN_BLINKS } from './doorbell/doorbell';
import { DEFAULT_SCHEDULE, fullGrid, validateSchedule, type DoorbellSchedule } from './doorbell/doorbellSchedule';

const originalFetch = window.fetch;

const DEMO_LIGHT_TIMERS = [
    { id: 'dressing', label: 'Dressing', key: 521 },
    { id: 'wc1', label: 'WC 1', key: 555 },
    { id: 'wc2', label: 'WC 2', key: 556 },
    { id: 'pieceserv', label: 'Service', key: 557 },
    { id: 'ann1', label: 'Annexe 1', key: 561 },
    { id: 'ann2', label: 'Annexe 2', key: 562 },
];
const demoLightTimers: Record<string, number | null> = {
    dressing: 15, wc1: null, wc2: 0, pieceserv: 60, ann1: null, ann2: 7,
};

/** Noms personnalisés des lumières (noms-lumieres-2026-11-004), en mémoire : renommer ne touche pas l'armoire. */
const demoLightNames: Record<string, { name: string; version: number; updated_at: string } | undefined> = {};
const demoLightNamesList = () =>
    LIGHT_NAME_CATALOG.map(([id, def]) => ({
        id,
        default: def,
        name: demoLightNames[id]?.name ?? null,
        version: demoLightNames[id]?.version ?? 0,
        updated_at: demoLightNames[id]?.updated_at ?? null,
    }));

/** Noms personnalisés des volets (noms-volets-2026-11-005), en mémoire : renommer ne touche pas l'armoire. */
const demoShutterNames: Record<string, { name: string; version: number; updated_at: string } | undefined> = {};
const demoShutterVersions: Record<string, number> = {};
const demoShutterNamesList = () =>
    SHUTTER_NAME_CATALOG.map(([id, def]) => ({
        id,
        default: def,
        name: demoShutterNames[id]?.name ?? null,
        version: demoShutterVersions[id] ?? 0,
        updated_at: demoShutterNames[id]?.updated_at ?? null,
    }));

/** Disposition des lumières et des volets (affichage-objets-2026-11-006), en mémoire : n'écrit rien dans l'armoire. */
const demoLayouts: Record<LayoutKind, { order: string[]; disabled: string[]; version: number; updated_at: string | null }> = {
    lights: { order: [], disabled: [], version: 0, updated_at: null },
    shutters: { order: [], disabled: [], version: 0, updated_at: null },
};
const demoStringList = (v: unknown, known: Set<string>): string[] | null => {
    if (!Array.isArray(v) || v.some((x) => typeof x !== 'string') || new Set(v).size !== v.length) return null;
    return (v as string[]).every((x) => known.has(x)) ? (v as string[]) : [];
};


/** Sonnette (sonnette-unifi-2026-11-007), en mémoire : l'essai ne commande aucune lumière et n'écrit rien dans l'armoire. */
const DEMO_CAMERA_IDS = ['cam-mock-1'];
const demoDoorbell = {
    settings: {
        enabled: false, camera_id: '', lights: [] as string[], blinks: 5, version: 0, updated_at: null as string | null,
        schedule: { ...DEFAULT_SCHEDULE, grid: fullGrid() } as DoorbellSchedule,
    },
    ringing_until: null as string | null,
    last_ring_at: null as string | null,
    initialised: false,
};

/** Rôle LAN de la session de démonstration : lan_admin sur /settings/users, ou si sessionStorage
 *  `essensys_demo_lan_role` le demande (tests) ; lan_user sinon. */
function demoForcedLanRole(): 'lan_admin' | 'lan_user' | null {
    try {
        const forced = sessionStorage.getItem('essensys_demo_lan_role');
        return forced === 'lan_admin' || forced === 'lan_user' ? forced : null;
    } catch {
        return null;
    }
}

function demoLanRole(): 'lan_admin' | 'lan_user' {
    return demoForcedLanRole() ?? (window.location.pathname.includes('/settings/users') ? 'lan_admin' : 'lan_user');
}

export function setupMocks() {
    console.log('[MOCK] 🚀 Mocks enabled for static demo mode');

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        let url = '';
        if (typeof input === 'string') url = input;
        else if (input instanceof URL) url = input.toString();
        else if (input instanceof Request) url = input.url;

        const method = init?.method || (input instanceof Request ? input.method : 'GET');

        const jsonResponse = (data: any, status = 200) => {
            return new Response(JSON.stringify(data), {
                status,
                headers: { 'Content-Type': 'application/json' }
            });
        };

        console.log(`[MOCK] Intercepted ${method} ${url}`);

        const scenarioMock = handleMockScenarioRequest(url, method);
        if (scenarioMock) {
            return scenarioMock;
        }

        if (url.includes('/api/admin/inject') && method === 'POST') {
            const isDryRun = url.includes('test_mode=dry_run');
            const body = init?.body ? JSON.parse(String(init.body)) : {};
            if (isDryRun && body.k === 613 && String(body.v) === '64') {
                return jsonResponse({
                    status: 'test_ok',
                    dry_run: true,
                    message: 'Validation OK — chevet PC3 non envoyé (mock)',
                    validated_params: [{ k: 613, v: '64' }],
                });
            }
            if (isDryRun && body.k === 99999) {
                return jsonResponse({
                    status: 'test_failed',
                    dry_run: true,
                    message: 'Index hors plage',
                }, 422);
            }
            if (isDryRun) {
                return jsonResponse({
                    status: 'test_ok',
                    dry_run: true,
                    message: 'Validation OK — non envoyé à l\'armoire (mock)',
                    validated_params: [{ k: body.k, v: String(body.v) }],
                    exchange_snapshot: [{ k: body.k, v: String(body.v) }],
                });
            }
            return jsonResponse({ success: true, message: 'Mock injected' });
        }

        // Temporisations des lumières (lumieres-temporisees-2026-11-003). Valeurs de démonstration en mémoire ;
        // WC 1 et Annexe 1 jamais lues (null), pour montrer « inconnue ». Réservé à lan_admin (403 sinon).
        if (url.includes('/api/admin/lights/timers')) {
            // IAM LAN désactivé (cas de la démo par défaut) : tout le monde administre ; lan_user forcé : 403.
            if (demoForcedLanRole() === 'lan_user') return jsonResponse({ error: 'forbidden' }, 403);
            if (method === 'GET') {
                return jsonResponse({ timers: DEMO_LIGHT_TIMERS.map((t) => ({ ...t, minutes: demoLightTimers[t.id] })) });
            }
            if (method === 'PUT') {
                const id = decodeURIComponent(new URL(url, window.location.origin).pathname.split('/').pop() ?? '');
                const body = init?.body ? JSON.parse(String(init.body)) : {};
                if (!DEMO_LIGHT_TIMERS.some((t) => t.id === id)) return jsonResponse({ error: 'unknown_light' }, 400);
                if (!Number.isInteger(body.minutes) || body.minutes < 0 || body.minutes > 255) {
                    return jsonResponse({ error: 'invalid_minutes' }, 400);
                }
                if (url.includes('test_mode=dry_run')) return jsonResponse({ id, minutes: body.minutes, status: 'dry_run' });
                demoLightTimers[id] = body.minutes;
                return jsonResponse({ id, minutes: body.minutes, status: 'queued' });
            }
        }

        // Noms des lumières : lecture pour tous, écriture réservée à lan_admin (403 pour lan_user forcé).
        if (url.includes('/api/lights/names') && method === 'GET') {
            return jsonResponse({ lights: demoLightNamesList() });
        }
        if (url.includes('/api/admin/lights/names/') && method === 'PUT') {
            if (demoForcedLanRole() === 'lan_user') return jsonResponse({ error: 'forbidden' }, 403);
            // Tests : sessionStorage `essensys_demo_names_error` = 403 ou 503 force l'erreur du serveur.
            try {
                const forced = sessionStorage.getItem('essensys_demo_names_error');
                if (forced === '403') return jsonResponse({ error: 'forbidden' }, 403);
                if (forced === '503') return jsonResponse({ error: 'names_unavailable' }, 503);
            } catch { /* sessionStorage indisponible */ }
            const id = decodeURIComponent(new URL(url, window.location.origin).pathname.split('/').pop() ?? '');
            const body = init?.body ? JSON.parse(String(init.body)) : {};
            const entry = demoLightNamesList().find((l) => l.id === id);
            if (!entry) return jsonResponse({ error: 'unknown_light' }, 400);
            const raw = body.name;
            const name = typeof raw === 'string' ? raw.trim() : null;
            if (raw !== null && raw !== undefined && typeof raw !== 'string') return jsonResponse({ error: 'invalid_name' }, 400);
            if (name !== null && name !== '' && (Array.from(name).length > MAX_NAME_LENGTH || /[<>]/.test(name) || Array.from(name).some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127))) {
                return jsonResponse({ error: 'invalid_name' }, 400);
            }
            if (url.includes('test_mode=dry_run')) return jsonResponse({ ...entry, name: name || null, status: 'dry_run' });
            const updated_at = new Date().toISOString();
            demoLightNames[id] = name ? { name, version: entry.version + 1, updated_at } : undefined;
            if (!name) {
                demoLightNames[id] = undefined;
                return jsonResponse({ ...entry, name: null, version: entry.version + 1, updated_at, status: 'saved' });
            }
            return jsonResponse({ ...demoLightNamesList().find((l) => l.id === id)!, status: 'saved' });
        }

        // Noms des volets : lecture pour tous, écriture réservée à lan_admin (403 pour lan_user forcé).
        if (url.includes('/api/shutters/names') && method === 'GET') {
            return jsonResponse({ shutters: demoShutterNamesList() });
        }
        if (url.includes('/api/admin/shutters/names/') && method === 'PUT') {
            if (demoForcedLanRole() === 'lan_user') return jsonResponse({ error: 'forbidden' }, 403);
            // Tests : sessionStorage `essensys_demo_names_error` = 403 ou 503 force l'erreur du serveur.
            try {
                const forced = sessionStorage.getItem('essensys_demo_names_error');
                if (forced === '403') return jsonResponse({ error: 'forbidden' }, 403);
                if (forced === '503') return jsonResponse({ error: 'names_unavailable' }, 503);
            } catch { /* sessionStorage indisponible */ }
            const id = decodeURIComponent(new URL(url, window.location.origin).pathname.split('/').pop() ?? '');
            const body = init?.body ? JSON.parse(String(init.body)) : {};
            const entry = demoShutterNamesList().find((s) => s.id === id);
            if (!entry) return jsonResponse({ error: 'unknown_shutter' }, 400);
            const raw = body.name;
            const name = typeof raw === 'string' ? raw.trim() : null;
            if (raw !== null && raw !== undefined && typeof raw !== 'string') return jsonResponse({ error: 'invalid_name' }, 400);
            if (name !== null && name !== '' && (Array.from(name).length > MAX_NAME_LENGTH || /[<>]/.test(name) || Array.from(name).some((c) => c.charCodeAt(0) < 32 || c.charCodeAt(0) === 127))) {
                return jsonResponse({ error: 'invalid_name' }, 400);
            }
            if (url.includes('test_mode=dry_run')) return jsonResponse({ ...entry, name: name || null, status: 'dry_run' });
            const updated_at = new Date().toISOString();
            demoShutterVersions[id] = entry.version + 1;
            demoShutterNames[id] = name ? { name, version: entry.version + 1, updated_at } : undefined;
            if (!name) return jsonResponse({ ...entry, name: null, version: entry.version + 1, updated_at, status: 'saved' });
            return jsonResponse({ ...demoShutterNamesList().find((s) => s.id === id)!, status: 'saved' });
        }

        // Disposition : lecture pour tous, écriture réservée à lan_admin (403 pour lan_user forcé).
        // Tests : sessionStorage `essensys_demo_layout_read` = 404 ou 500 force l'échec de la lecture ;
        // `essensys_demo_layout_error` = 403 ou 503 force l'erreur de l'écriture ; `essensys_demo_layout_init` = JSON {kind: document}.
        const layoutMatch = new URL(url, window.location.origin).pathname.match(/^\/api\/(admin\/)?(lights|shutters)\/layout$/);
        if (layoutMatch) {
            const kind = layoutMatch[2] as LayoutKind;
            const state = demoLayouts[kind];
            try {
                const init0 = sessionStorage.getItem('essensys_demo_layout_init');
                if (init0 && state.version === 0) Object.assign(state, JSON.parse(init0)[kind] ?? {});
            } catch { /* sessionStorage indisponible */ }
            const publicDoc = () => ({ order: state.order, disabled: state.disabled, version: state.version, updated_at: state.updated_at });
            if (method === 'GET' && !layoutMatch[1]) {
                try {
                    const forced = sessionStorage.getItem('essensys_demo_layout_read');
                    if (forced === '404') return jsonResponse({ error: 'not_found' }, 404);
                    if (forced === '500') return jsonResponse({ error: 'internal' }, 500);
                } catch { /* sessionStorage indisponible */ }
                return jsonResponse(publicDoc());
            }
            if (method === 'PUT' && layoutMatch[1]) {
                if (demoForcedLanRole() === 'lan_user') return jsonResponse({ error: 'forbidden' }, 403);
                try {
                    const forced = sessionStorage.getItem('essensys_demo_layout_error');
                    if (forced === '403') return jsonResponse({ error: 'forbidden' }, 403);
                    if (forced === '503') return jsonResponse({ error: 'names_unavailable' }, 503);
                } catch { /* sessionStorage indisponible */ }
                const body = init?.body ? JSON.parse(String(init.body)) : {};
                const known = new Set(CATALOGUES[kind].map((c) => c.id));
                const unknownError = kind === 'lights' ? 'unknown_light' : 'unknown_shutter';
                let next: { order: string[]; disabled: string[] };
                if (body.reset === true) {
                    next = { order: [], disabled: [] };
                } else {
                    const order = demoStringList(body.order, known);
                    const disabled = demoStringList(body.disabled, known);
                    if (order === null || disabled === null) return jsonResponse({ error: 'invalid_layout' }, 400);
                    const given = [...(body.order as string[]), ...(body.disabled as string[])];
                    if (given.some((id) => !known.has(id))) return jsonResponse({ error: unknownError }, 400);
                    next = { order, disabled };
                }
                const updated_at = new Date().toISOString();
                if (url.includes('test_mode=dry_run') || new Headers(init?.headers).get('X-Essensys-Test-Mode') === 'dry-run') {
                    return jsonResponse({ ...next, version: state.version, updated_at: state.updated_at, status: 'dry_run' });
                }
                Object.assign(state, next, { version: state.version + 1, updated_at });
                return jsonResponse({ ...publicDoc(), status: 'saved' });
            }
        }

        // Sonnette : état et flux pour tous, réglages et essai réservés à lan_admin (403 pour lan_user forcé).
        // Tests (sessionStorage) : `essensys_demo_doorbell_init` = JSON {settings, available} ; `essensys_demo_doorbell_status` = JSON
        // qui remplace l'état renvoyé ; `essensys_demo_doorbell_error` = 403 | 503 | unknown_camera | invalid_blinks | invalid_schedule sur l'écriture ;
        // `essensys_demo_doorbell_cameras` = 503 force l'échec de la liste des caméras ; `essensys_demo_doorbell_absent` = 404.
        const doorbellPath = new URL(url, window.location.origin).pathname;
        if (/^\/api\/(admin\/)?doorbell\//.test(doorbellPath)) {
            const ss = (key: string): string | null => {
                try {
                    return sessionStorage.getItem(key);
                } catch {
                    return null;
                }
            };
            if (!demoDoorbell.initialised) {
                demoDoorbell.initialised = true;
                try {
                    Object.assign(demoDoorbell.settings, JSON.parse(ss('essensys_demo_doorbell_init') ?? '{}').settings ?? {});
                } catch { /* JSON invalide : réglages par défaut */ }
            }
            if (ss('essensys_demo_doorbell_absent') === '404') return jsonResponse({ error: 'not_found' }, 404);
            const forcedStatus = ss('essensys_demo_doorbell_status');
            if (doorbellPath === '/api/doorbell/status' && method === 'GET') {
                if (forcedStatus) return jsonResponse(JSON.parse(forcedStatus));
                const ringing = demoDoorbell.ringing_until !== null && Date.parse(demoDoorbell.ringing_until) > Date.now();
                return jsonResponse({
                    enabled: demoDoorbell.settings.enabled,
                    available: demoDoorbell.settings.enabled,
                    ringing,
                    ringing_until: demoDoorbell.ringing_until,
                    last_ring_at: demoDoorbell.last_ring_at,
                });
            }
            if (doorbellPath.startsWith('/api/admin/')) {
                if (demoForcedLanRole() === 'lan_user') return jsonResponse({ error: 'forbidden' }, 403);
                const settingsDoc = () => ({ ...demoDoorbell.settings });
                if (doorbellPath === '/api/admin/doorbell/settings' && method === 'GET') return jsonResponse(settingsDoc());
                if (doorbellPath === '/api/admin/doorbell/settings' && method === 'PUT') {
                    const forced = ss('essensys_demo_doorbell_error');
                    if (forced === '403') return jsonResponse({ error: 'forbidden' }, 403);
                    if (forced === '503') return jsonResponse({ error: 'names_unavailable' }, 503);
                    if (forced === 'unknown_camera' || forced === 'invalid_blinks' || forced === 'invalid_schedule') return jsonResponse({ error: forced }, 400);
                    const body = init?.body ? JSON.parse(String(init.body)) : {};
                    const known = new Set(LIGHT_NAME_CATALOG.map(([id]) => id));
                    if (!Array.isArray(body.lights) || body.lights.some((id: unknown) => typeof id !== 'string' || !known.has(id))) {
                        return jsonResponse({ error: 'unknown_light' }, 400);
                    }
                    if (!Number.isInteger(body.blinks) || body.blinks < MIN_BLINKS || body.blinks > MAX_BLINKS) {
                        return jsonResponse({ error: 'invalid_blinks' }, 400);
                    }
                    if (body.camera_id && !DEMO_CAMERA_IDS.includes(body.camera_id)) return jsonResponse({ error: 'unknown_camera' }, 400);
                    // Plage (#61) : absente = conservée ; sinon mêmes contrôles que la passerelle.
                    if (body.schedule !== undefined && (typeof body.schedule !== 'object' || body.schedule === null || validateSchedule(body.schedule as DoorbellSchedule) !== null)) {
                        return jsonResponse({ error: 'invalid_schedule' }, 400);
                    }
                    if (body.schedule !== undefined) demoDoorbell.settings.schedule = body.schedule as DoorbellSchedule;
                    Object.assign(demoDoorbell.settings, {
                        enabled: body.enabled === true, camera_id: body.camera_id ?? '', lights: body.lights, blinks: body.blinks,
                        version: demoDoorbell.settings.version + 1, updated_at: new Date().toISOString(),
                    });
                    return jsonResponse(settingsDoc());
                }
                if (doorbellPath === '/api/admin/doorbell/test' && method === 'POST') {
                    if (!demoDoorbell.settings.enabled) return jsonResponse({ error: 'doorbell_unavailable' }, 503);
                    const dryRun = url.includes('test_mode=dry_run') || new Headers(init?.headers).get('X-Essensys-Test-Mode') === 'dry-run';
                    const nowMs = Date.now();
                    demoDoorbell.last_ring_at = new Date(nowMs).toISOString();
                    demoDoorbell.ringing_until = new Date(nowMs + 60_000).toISOString();
                    return jsonResponse({ status: dryRun ? 'dry_run' : 'started', ringing: true });
                }
            }
        }

        if (url.includes('/api/unifi/cameras') && method === 'GET' && !url.includes('/snapshot') && (() => {
            try {
                return sessionStorage.getItem('essensys_demo_doorbell_cameras') === '503';
            } catch {
                return false;
            }
        })()) {
            return jsonResponse({ error: 'doorbell_unavailable' }, 503);
        }

        if (url.includes('/api/admin/exchange') && method === 'GET') {
            const keysParam = new URL(url, window.location.origin).searchParams.get('keys') || '';
            const values = keysParam
                .split(',')
                .filter((k) => k !== '')
                // 440 = état des prises de sécurité : pilotées dans la maison de démonstration.
                .map((k) => ({ k: parseInt(k, 10), v: k === '440' ? '0' : '25' }));
            return jsonResponse({ values });
        }

        if (url.includes('/api/admin/armoire/snapshot') && method === 'GET') {
            const { MOCK_ARMOIRE_SNAPSHOT } = await import('./types/armoire');
            return jsonResponse({
                ...MOCK_ARMOIRE_SNAPSHOT,
                last_poll_at: new Date().toISOString(),
            });
        }

        if (url.includes('/api/web/actions') && method === 'POST') {
            return jsonResponse({ success: true, message: 'Mock action sent' });
        }

        if (url.includes('/api/web/history/latest') && method === 'GET') {
            return jsonResponse({
                message: 'Success',
                lastAction: {
                    id: 1,
                    guid: 'mock-guid',
                    machineId: 99,
                    actionType: 'mock_type',
                    actionInfo: 'Mock action executed',
                    isDone: true,
                    timestamp: new Date().toISOString(),
                    indexes: []
                }
            });
        }

        // Démo : aucun plugin installé. Sans cette réponse, la requête part vers le serveur statique
        // et la carte Solaire du tableau de bord reçoit un descripteur invalide (page blanche).
        if (url.includes('/api/plugins/')) {
            return jsonResponse({ error: 'plugin non installé (démo)' }, 404);
        }

        if (url.includes('/api/unifi/cameras') && method === 'GET' && !url.includes('/snapshot')) {
            return jsonResponse({
                cameras: [
                    {
                        id: 'cam-mock-1',
                        name: 'Caméra Mock Sonnet',
                        type: 'G3 Bullet',
                        model: 'UVC G3',
                        status: 'online',
                        last_seen: new Date().toISOString(),
                        is_recording: true,
                        is_connected: true,
                        mac: '00:11:22:33:44:55',
                        firmware: '1.0.0'
                    }
                ]
            });
        }

        if (url.includes('/snapshot') && method === 'GET') {
            const transparentPng = Uint8Array.from([
                137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
                0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137,
                0, 0, 0, 11, 73, 68, 65, 84, 8, 153, 99, 96, 0, 2, 0, 0, 5,
                0, 1, 255, 255, 255, 255, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
            ]);
            return new Response(transparentPng, {
                status: 200,
                headers: { 'Content-Type': 'image/png' }
            });
        }

        if (url.includes('/api/auth/auto-login') && method === 'GET') {
            return new Response(null, { status: 204 });
        }

        if (url.includes('/api/user/me') && method === 'GET') {
            const wantsAdmin = demoLanRole() === 'lan_admin';
            return jsonResponse({
                user: {
                    id: wantsAdmin ? 1 : 2,
                    email: wantsAdmin ? 'admin@essensys.local' : 'demo.user@essensys.local',
                    role: wantsAdmin ? 'lan_admin' : 'lan_user',
                    display_name: wantsAdmin ? 'Admin' : 'Demo User',
                    can_use_trusted_devices: !wantsAdmin,
                },
            });
        }

        if (url.includes('/api/admin/lan-users') && method === 'GET') {
            return jsonResponse({
                users: [
                    { id: 1, email: 'admin@essensys.local', role: 'lan_admin', display_name: 'Admin usine', disabled_at: null, can_use_trusted_devices: false },
                    { id: 2, email: 'nicolas@rineau.eu', role: 'lan_admin', display_name: 'Nicolas', disabled_at: null, can_use_trusted_devices: true },
                    { id: 3, email: 'demo.user@essensys.local', role: 'lan_user', display_name: 'Demo User', disabled_at: null, can_use_trusted_devices: true },
                    { id: 4, email: 'guest@essensys.local', role: 'lan_guest', display_name: 'Invité', disabled_at: null, can_use_trusted_devices: true },
                ]
            });
        }

        if (url.includes('/api/user/me/trusted-devices/candidates') && method === 'GET') {
            return jsonResponse({
                candidates: [
                    { mac_address: 'AA:BB:CC:DD:EE:01', device_label: '192.168.0.21', source_ip: '192.168.0.21', last_seen_at: new Date().toISOString() },
                ]
            });
        }

        if (url.includes('/api/admin/trusted-devices/candidates') && method === 'GET') {
            return jsonResponse({
                candidates: [
                    {
                        mac_address: 'AA:BB:CC:DD:EE:03',
                        device_label: '192.168.0.40',
                        source_ip: '192.168.0.40',
                        last_seen_at: new Date().toISOString(),
                        lan_user_id: 2,
                        lan_user_email: 'demo.user@essensys.local',
                        lan_user_role: 'lan_user',
                        lan_user_display_name: 'Demo User',
                    },
                    {
                        mac_address: 'AA:BB:CC:DD:EE:04',
                        device_label: '192.168.0.33',
                        source_ip: '192.168.0.33',
                        last_seen_at: new Date().toISOString(),
                        lan_user_id: 3,
                        lan_user_email: 'guest@essensys.local',
                        lan_user_role: 'lan_guest',
                        lan_user_display_name: 'Invité',
                    },
                ]
            });
        }

        if (url.includes('/api/user/me/trusted-devices') && method === 'GET') {
            return jsonResponse({
                devices: [
                    {
                        id: 10,
                        lan_user_id: 2,
                        mac_address: 'AA:BB:CC:DD:EE:01',
                        device_label: 'iPhone Nicolas',
                        trust_mode: 'temporary',
                        expires_at: new Date(Date.now() + 45 * 24 * 3600 * 1000).toISOString(),
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ]
            });
        }

        if (url.includes('/api/admin/trusted-devices') && method === 'GET') {
            return jsonResponse({
                devices: [
                    {
                        id: 20,
                        lan_user_id: 3,
                        lan_user_email: 'guest@essensys.local',
                        lan_user_role: 'lan_guest',
                        mac_address: 'AA:BB:CC:DD:EE:03',
                        device_label: 'Tablette entrée',
                        trust_mode: 'permanent',
                        expires_at: null,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString(),
                    },
                ]
            });
        }

        if (url.includes('/api/user/me/trusted-devices') && method === 'POST') {
            const body = init?.body ? JSON.parse(String(init.body)) : {};
            return jsonResponse({
                device: {
                    id: 99,
                    lan_user_id: 2,
                    mac_address: body.mac_address,
                    device_label: body.device_label || body.mac_address,
                    trust_mode: 'temporary',
                    expires_at: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            }, 201);
        }

        if (url.includes('/api/admin/trusted-devices') && method === 'POST') {
            const body = init?.body ? JSON.parse(String(init.body)) : {};
            return jsonResponse({
                device: {
                    id: 100,
                    lan_user_id: body.lan_user_id,
                    lan_user_email: body.lan_user_id === 3 ? 'guest@essensys.local' : 'demo.user@essensys.local',
                    mac_address: body.mac_address,
                    device_label: body.device_label || body.mac_address,
                    trust_mode: 'permanent',
                    expires_at: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                },
            }, 201);
        }

        if (/\/api\/(user\/me|admin)\/trusted-devices\/.+/.test(url) && (method === 'DELETE' || method === 'POST')) {
            return jsonResponse({ status: 'ok' });
        }

        if (url.includes('/api/')) {
            console.warn(`[MOCK] Fallback générique pour ${method} ${url}`);
            return jsonResponse({ success: true, message: 'Mock fallback' });
        }

        return originalFetch(input, init);
    };
}
