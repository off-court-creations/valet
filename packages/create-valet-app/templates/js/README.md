# Valet App (JS)

A starter app using React 19, Vite, React Router, Zustand, and @archway/valet (JavaScript-only).

## Quickstart

- Install: `npm install`
- Dev: `npm run dev`
- Build: `npm run build`

## Env (Dev Server / HMR)

- `VITE_ALLOWED_HOSTS` — comma-separated hostnames for dev server allowlist.
- `VITE_HMR_HOST`, `VITE_HMR_PROTOCOL`, `VITE_HMR_CLIENT_PORT` — tune HMR behind tunnels.

## Structure

- `src/main.jsx` — boots React and router, loads global presets
- `src/App.jsx` — lazy routes + fallback
- `src/presets/globalPresets.js` — app-wide style presets via Valet
- `src/pages/*` — sample pages
- `src/store/*` — sample Zustand store

