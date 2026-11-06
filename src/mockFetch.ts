import { handleMockScenarioRequest } from './mockScenarios';

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
