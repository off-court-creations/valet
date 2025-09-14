# Valet App (Hybrid)

A starter app using React 19, Vite, React Router, Zustand, and @archway/valet.
TypeScript first, with JS allowed (TS + JS).

## Quickstart

- Install: `npm install`
- Dev: `npm run dev`
- Typecheck: `npm run typecheck`
- Build: `npm run build`

## Env (Dev Server / HMR)

- `VITE_ALLOWED_HOSTS` — comma-separated hostnames for dev server allowlist.
- `VITE_HMR_HOST`, `VITE_HMR_PROTOCOL`, `VITE_HMR_CLIENT_PORT` — tune HMR behind tunnels.

## Structure

- `src/main.tsx` — boots React and router, loads global presets
- `src/App.tsx` — lazy routes + fallback
- `src/presets/globalPresets.ts` — app-wide style presets via Valet
- `src/pages/*` — sample pages
- `src/store/*` — example Zustand store

