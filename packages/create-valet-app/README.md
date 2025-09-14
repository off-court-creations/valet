# @archway/create-valet-app

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub](https://img.shields.io/badge/GitHub-create--valet--app-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/create-valet-app)
[![npm](https://img.shields.io/badge/npm-%40archway%2Fcreate--valet--app-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/create-valet-app)
[![npm version](https://img.shields.io/npm/v/@archway/create-valet-app.svg?color=CB3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/create-valet-app)

Scaffold a modern React app powered by Vite, React Router, Zustand, and @archway/valet (UI + CSS‑in‑JS), with TypeScript by default.

Node 18+ is required.

## Quickstart

- Using npm create (recommended):

  ```bash
  npm create @archway/valet-app@latest my-valet-app
  # pass extra flags after --
  npm create @archway/valet-app@latest my-valet-app -- --template ts
  ```

- Using npx directly:

  ```bash
  npx @archway/create-valet-app@latest my-valet-app --template ts
  ```

Then:

```bash
cd my-valet-app
npm install
npm run dev
```

## Interactive Defaults

- Running without any `--flags` in an interactive terminal prompts: “Would you like to change any of the default settings?” (defaults to No).
- Choose No to proceed with the defaults (you’ll only be asked for a directory if missing).
- Choose Yes to open a guided wizard to review and tweak all options (template, router, zustand, minimal mode, path alias, MCP, git, install, package manager).

## Templates

- ts (default): TypeScript‑only app, strict TS settings, React 19 + Vite 6.
- js: JavaScript‑only, no TypeScript; jsconfig with `@` alias.
- hybrid: TS‑first but allows JS files; split app/node tsconfigs.

Choose with `--template ts|js|hybrid`.

## Flags

- `--template ts|js|hybrid` set the template (default `ts`).
- `--install` run dependency installation automatically.
- `--pm npm|pnpm|yarn|bun` choose the package manager (default: auto/npm).
- `--git` / `--no-git` initialize a git repo (default: `--git`). The CLI writes a sensible `.gitignore`, checks for your git identity (`user.name`/`user.email`) and, if missing, prompts to set it locally for the new repo (non‑interactive runs will skip the initial commit if identity is missing).
- `--mcp` / `--no-mcp` include or skip AGENTS.md and CLAUDE.md (Valet MCP guidance). Default: include.
- `--router` / `--no-router` include or remove React Router (default: include).
- `--zustand` / `--no-zustand` include or remove Zustand sample store (default: include).
- `--three` or `--r3f` enables an opt-in 3D experience (React Three Fiber) that installs `three`, `@react-three/fiber`, and `@react-three/drei`, and swaps the Quickstart page to a fullscreen `<Canvas>` with a spinning cube and a Valet HUD overlay. Use `--no-three` to force disable.
- `--minimal` produce a leaner starter (single page/route where applicable).
- `--path-alias <token>` change `@` alias token for `src` (e.g., `app`).

Tip (npm create): place flags after `--`, e.g. `npm create @archway/valet-app my-app -- --template js --minimal`.

## What You Get

- Vite 6 + React 19, with `@vitejs/plugin-react`.
- @archway/valet UI primitives and theme tokens, with global presets preloaded.
- React Router (optional), code‑split routes via `React.lazy` + `Suspense`.
- Zustand store sample (optional).
- Path alias to `src` (default `@`), wired in Vite + TS/JS config.
- Lint/format scripts (ESLint + Prettier), plus “agent” variants with parseable status tokens.
- Strict TypeScript in `ts` and `hybrid` templates; split `tsconfig.app.json` and `tsconfig.node.json`.

## Dev Server / HMR Env Vars

The generated `vite.config` supports tuning dev server + HMR for tunnels and proxies via env:

- `VITE_ALLOWED_HOSTS`: comma‑separated hostname allowlist (e.g. `abc.ngrok.app,foo.local`).
- `VITE_HMR_HOST`: override HMR host.
- `VITE_HMR_PROTOCOL`: `wss` or `ws`.
- `VITE_HMR_CLIENT_PORT`: numeric client port for HMR.

## Scripts (generated apps)

- `dev`: start Vite dev server.
- `build`: clean then typecheck (TS/hybrid) and Vite build.
- `typecheck`: run TS checks for app + node configs (TS/hybrid).
- `lint`, `lint:fix`: ESLint (with Prettier rules applied).
- `format`, `format:fix`: Prettier check/write.
- Agent variants (`*:agent`) emit `*_STATUS:ok` on success.

## Examples

Create a TS app without router:

```bash
npm create @archway/valet-app my-ts-app -- --template ts --no-router
```

Create a JS app (minimal):

```bash
npm create @archway/valet-app my-js-app -- --template js --minimal
```

Create a Hybrid app without Zustand using a custom alias:

```bash
npm create @archway/valet-app my-hybrid -- --template hybrid --no-zustand --path-alias app
```

## Validation (maintainers)

This repo includes a validation harness that generates apps and runs lint/typecheck/build (+ optional preview) in a temp workspace:

```bash
npm run validate
# or
node scripts/validate.mjs --no-preview
node scripts/validate.mjs --only ts:no-router
```

Scenarios covered: `ts:default`, `js:default`, `hybrid:default`, `ts:no-router`, `js:minimal`, `hybrid:no-zustand`, `ts:alias-app`.

Additional scenarios exercise the 3D option: `ts:three`, `js:three`, and `hybrid:three-mcp` (which also checks AGENTS.md guidance for R3F pages).

Hybrid template note: when `--three` is enabled, the 3D Quickstart is generated as `.jsx` per the “R3F Pages Policy” (keep R3F-heavy pages in JSX to reduce TS friction; keep UI/logic typed TS).

## Why CVA

- Simple, modern stack that respects tweaking: Vite, React 19, Router 7.
- Valet‑first UI, small CSS‑in‑JS core, strong theme tokens, great DX.
- TS‑first defaults with JS/hybrid options.
- Agent‑friendly scripts and optional MCP guidance.

## Contributors

- **Ben Chapman** ([0xbenc](https://github.com/0xbenc)) - Maintainer
- **Ben Cully** ([BenCully](https://github.com/BenCully)) - Contributor

## License

MIT
