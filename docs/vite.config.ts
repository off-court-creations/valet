// valet/docs/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // or '0.0.0.0' to listen on all interfaces
    
    // put a new ngrok link here if your free plan changes yours
    // allowedHosts: ['6c910f0d2e31.ngrok-free.app'],

    // If you're viewing the site via HTTPS on ngrok and HMR can't connect,
    // uncomment this block so the client uses WSS through the tunnel:
    // hmr: {
    //   host: '2a9971f3ac6b.ngrok-free.app',
    //   protocol: 'wss',
    //   clientPort: 443,
    // },
  },
});
