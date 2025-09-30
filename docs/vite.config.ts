// valet/docs/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Allow building docs under a subpath (e.g., /valet/) by setting DOCS_BASE
  // This pairs with BrowserRouter basename={import.meta.env.BASE_URL}
  base: process.env.DOCS_BASE || '/',
  plugins: [react()],
  server: {
    host: true, // or '0.0.0.0' to listen on all interfaces

    // put a new ngrok link here if your free plan changes yours
    allowedHosts: ['4a44bfaa9522.ngrok-free.app'],

    // Allow importing sidecar JSON files from the monorepo root
    fs: {
      allow: ['..', '../..'],
    },

    // If you're viewing the site via HTTPS on ngrok and HMR can't connect,
    // uncomment this block so the client uses WSS through the tunnel:
    // hmr: {
    //   host: '2a9971f3ac6b.ngrok-free.app',
    //   protocol: 'wss',
    //   clientPort: 443,
    // },
  },
});
