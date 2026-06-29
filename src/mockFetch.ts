import { handleMockScenarioRequest } from './mockScenarios';

const originalFetch = window.fetch;

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

        if (url.includes('/api/admin/exchange') && method === 'GET') {
            const keysParam = new URL(url, window.location.origin).searchParams.get('keys') || '';
            const values = keysParam
                .split(',')
                .filter((k) => k !== '')
                .map((k) => ({ k: parseInt(k, 10), v: '25' }));
            return jsonResponse({ values });
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
            const wantsAdmin = window.location.pathname.includes('/settings/users');
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
