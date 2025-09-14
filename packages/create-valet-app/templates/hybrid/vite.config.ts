import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const allowedHostsStr = env.VITE_ALLOWED_HOSTS || '';
  const allowedHosts = allowedHostsStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const hmrHost = env.VITE_HMR_HOST || undefined;
  const hmrProtocol = env.VITE_HMR_PROTOCOL || undefined;
  const hmrClientPort = env.VITE_HMR_CLIENT_PORT
    ? Number(env.VITE_HMR_CLIENT_PORT)
    : undefined;

  const hmr = hmrHost || hmrProtocol || hmrClientPort
    ? { host: hmrHost, protocol: hmrProtocol as 'ws' | 'wss' | undefined, clientPort: hmrClientPort }
    : undefined;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
      },
    },
    server: {
      host: true,
      ...(allowedHosts.length ? { allowedHosts } : {}),
      ...(hmr ? { hmr } : {}),
    },
  };
});

