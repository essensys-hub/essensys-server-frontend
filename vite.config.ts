import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import http from 'node:http'
import bodyParser from 'body-parser'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'body-parser',
      configureServer(server) {
        server.middlewares.use(bodyParser.json());
        server.middlewares.use(bodyParser.urlencoded({ extended: true }));
      },
    },
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:80',
        changeOrigin: true,
        secure: false,
        agent: new http.Agent({ keepAlive: true, keepAliveMsecs: 20000 }),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            proxyReq.removeHeader('origin');
            proxyReq.setHeader('Connection', 'keep-alive');
            proxyReq.removeHeader('x-forwarded-for');
            proxyReq.removeHeader('x-forwarded-proto');
            proxyReq.removeHeader('x-forwarded-host');

            // FIX: Buffer the body and set Content-Length to avoid chunked encoding
            // Vite/http-proxy streams by default. If we consume the body here, we must write it to proxyReq.
            const reqBody = (req as any).body;
            if (reqBody) {
              const bodyData = JSON.stringify(reqBody);
              proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
              proxyReq.write(bodyData);
            }
          });
        },
      },
    },
  },
})
