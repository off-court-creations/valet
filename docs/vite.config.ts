// valet/docs/vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load .env variables for the current mode (development by default)
  const env = loadEnv(mode, process.cwd(), '');

  // Prefer VITE_TUNNEL_HOST for consistency with Vite env exposure
  // Fallback to NGROK_HOST if provided
  const tunnelHost = env.VITE_TUNNEL_HOST || env.NGROK_HOST || '';

  // Optional secure HMR through a tunnel
  // Set VITE_TUNNEL_HMR_SECURE=true to enable WSS HMR via the tunnel host
  const secureHmr = (env.VITE_TUNNEL_HMR_SECURE || '').toLowerCase() === 'true';

  return {
    // Allow building docs under a subpath (e.g., /valet/) by setting DOCS_BASE
    // This pairs with BrowserRouter basename={import.meta.env.BASE_URL}
    base: process.env.DOCS_BASE || '/',
    plugins: [react()],
    server: {
      host: true, // or '0.0.0.0' to listen on all interfaces

      // Allow requests from your tunnel domain; falls back to Vite default if unset
      ...(tunnelHost ? { allowedHosts: [tunnelHost] } : {}),

      // Allow importing sidecar JSON files from the monorepo root
      fs: {
        allow: ['..', '../..'],
      },

      // If viewing the site via HTTPS on a tunnel and HMR can't connect,
      // enable secure HMR by setting VITE_TUNNEL_HMR_SECURE=true in .env
      ...(secureHmr && tunnelHost
        ? {
            hmr: {
              host: tunnelHost,
              protocol: 'wss',
              clientPort: 443,
            },
          }
        : {}),
    },
  };
});
