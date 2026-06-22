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
            return jsonResponse({ success: true, message: 'Mock injected' });
        }

        if (url.includes('/api/admin/exchange') && method === 'GET') {
            // Temps de course des volets : valeurs de démonstration (secondes)
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
                message: "Success",
                lastAction: {
                    id: 1,
                    guid: "mock-guid",
                    machineId: 99,
                    actionType: "mock_type",
                    actionInfo: "Mock action executed",
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
            // Return a mock 1x1 transparent PNG blob
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

        // Évite le parse JSON sur index.html quand un endpoint n'est pas mocké
        if (url.includes('/api/')) {
            console.warn(`[MOCK] Fallback générique pour ${method} ${url}`);
            return jsonResponse({ success: true, message: 'Mock fallback' });
        }

        // Fallback to original fetch
        return originalFetch(input, init);
    };
}
