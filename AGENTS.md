# AGENT Guidelines for @archway/valet

Welcome to **@archway/valet**, a performant, AI-forward UI library designed as a bridge between next-generation AI proxies and web frontends. The project emphasizes predictable UI primitives, mandatory accessibility, and tight TypeScript integration.

## Project Ethos

- **Superb performance** with minimal bundle size.
- **Opinionated UI approach** so developers can focus on UX and functionality.
- **AI integration** exceeding previous solutions. Systems we intend to draw from and surpass:
  - NLWeb / MCP
  - RAG
  - Semantic Web
  - IOT / Internet of Shit
- **Accessibility** and inclusive design baked into every component.

## Core Features & AI Goals

- **Next-gen design language** with advanced runtime theming.
- **Semantic Interface Layer** for component-level metadata and AI-driven behavior.
- **Context Bridge for State** built on Zustand with typed TypeScript stores (see `createFormStore`).
- **Integrated AI-centric architecture** that unifies semantics, state, and actions.

### Roadmap (planned — not implemented)

- **Web Action Graph** — a runtime graph of user and system interactions for
  introspection and adaptation. There is no implementation today; never describe
  it to users or agents as a shipped feature.

## MCP Era Quickstart (valet-mcp)

You have access to the valet MCP. Use it whenever you are building UI with valet to search components, inspect typed props/defaults, and grab examples.

See also the detailed MCP guide in docs at `docs/src/pages/getting-started/MCP.tsx`.

## Quality Gates (definition of done)

CI (`.github/workflows/ci.yml`) runs lint, typecheck, test, build,
`mcp:schema:check`, and `verify:pack` (plus an SSR dist-import test and an
engine smoke check) on Node 20 and 22 for every push/PR to `development` and
`main`. Before finishing your task, if you made changes to the code, run the
same gates locally, in order:

- `npm run lint:fix` — zero lint issues
  - if there are linting issues rinse and repeat until it's fixed
- `npm run typecheck` — zero type errors
- `npm test` — all suites green; behavior changes and bug fixes land with a
  named regression test (see Testing below)
- `npm run build` — valet builds successfully
- `npm run mcp:schema:check` — after `npm run mcp:build` if you changed
  components or docs
- `npm run verify:pack` — the packed tarball is complete
- if you changed docs pages: the docs app builds with the local valet linked
  (`npm run dx:link`, then `npm --prefix docs run build`) — CI does not build
  the docs app; this gate is local

^ IMPORTANT ^

## Testing

The test harness is a two-project vitest setup in `vitest.config.ts`
(TEST-CI owns that file and the test devDeps — do not add a second harness or
test runner):

- **node project** — `environment: 'node'`; plain unit tests over pure
  modules. Globs: `src/**/*.test.ts` and `scripts/**/*.test.{js,mjs,ts}`.
- **dom project** — `environment: 'jsdom'`; selected by filename suffix.
  Glob: `src/**/*.dom.test.{ts,tsx}`.

Conventions:

- Tests are colocated with the code they cover (in `src/`, or next to the
  script under `scripts/`).
- Naming: `*.test.ts` for node suites, `*.dom.test.ts(x)` for jsdom suites.
  `.spec.*` is banned — it would never match the globs and silently not run.
- `pool: 'forks'` is load-bearing: each test file runs in its own process.
  The house timezone convention (`withTZ` in `src/test-utils/withTZ.ts`)
  relies on per-file processes to vary `TZ` safely.
- JSX in `.tsx` tests uses the automatic runtime, configured via
  `oxc: { jsx: { runtime: 'automatic' } }` — vitest 4 bundles rolldown-vite,
  where oxc supersedes esbuild; an `esbuild:` config block would be ignored
  with a warning.
- `it.fails` tripwires are reserved for known, deferred bugs — never for new
  work.
- Run with `npm test` (single pass) or `npm run test:watch`.

## MCP: Valet Introspection (for @openai/codex)

This repo ships a Model Context Protocol (MCP) data pipeline and server exposing structured metadata for valet components. When running inside an agentic setup that has the valet MCP wired in, agents can call dedicated valet introspection tools to discover components, props, examples, and best practices.

What you get:

- Tools: `valet__list_components`, `valet__search_components`, `valet__get_component`, `valet__get_examples`.
- Data: generated into `mcp-data/` from TypeScript source and docs.
- Server: optional MCP server at `packages/valet-mcp` for external LLM tools.

Typical flows:

- Discover: use `valet__list_components` to enumerate all components with `{ name, category, summary, slug }`.
- Search: use `valet__search_components { query }` for fuzzy search over names/summaries.
- Inspect: use `valet__get_component { name? | slug? }` to retrieve full metadata:
  - `props[]`: name, type, required, default, description
  - `domPassthrough`: supported intrinsic element props (if any)
  - `cssVars[]`: exposed CSS variables
  - `bestPractices[]`, `examples[]`, `docsUrl`, `sourceFiles[]`, `version`
- Examples only: use `valet__get_examples { name | slug }` to fetch example snippets.

Codex usage examples:

- “List all valet components” → calls `valet__list_components`.
- “Search components for ‘table zebra’” → calls `valet__search_components` with `{ query: "table zebra" }`.
- “Show props for Panel” → calls `valet__get_component` with `{ name: "Panel" }`.
- “Give example usage of Tooltip” → calls `valet__get_examples` with `{ name: "Tooltip" }`.

Keeping the MCP data fresh:

- Build data after changing components or docs:
  - `npm run mcp:build` (writes JSON into `mcp-data/`)
- Validate data/server quickly:
  - `npm run mcp:server:selfcheck` (prints `{ ok, components, hasBox }`)

Running the local MCP server (optional):

1. Install server deps: `npm run mcp:server:install`
2. Build: `npm run mcp:server:build`
3. Start (dev use): `npm run mcp:server:start`
4. Self-check: `npm run mcp:server:selfcheck`
5. Link globally (if your Codex host discovers global bins): `npm run dx:link` links `packages/valet-mcp` (provides the `valet-mcp` bin), or install the published server with `npm i -g @archway/valet-mcp@latest`

Notes:

- The Codex harness may expose the introspection tools directly without the server; still keep `mcp-data/` up to date via `npm run mcp:build`.
- Develop on Node 20+. CI (`.github/workflows/ci.yml`) runs the gates on Node 20 and 22.
- If `components` in selfcheck is 0, re-run `npm run mcp:build` and ensure docs and src are present.

## End‑to‑End Flow (DX overview)

- Scaffold component in `valet/src/components`, export from `valet/src/index.ts`.
- Add examples + docs page; wire into docs navigation.
- Link `@archway/valet` into docs and iterate locally with HMR.
- Build MCP data (`mcp-data/`), self‑check, and (optionally) run local MCP server.
- Point codex to local MCP (config.toml) and verify introspection.
- Run the quality gates (lint, typecheck, test, build, `mcp:schema:check`, `verify:pack`; docs build locally), update CHANGELOG, version bump.
- Publish valet; publish MCP server (if changed); tag and release.

## Coding Standards

- Code is written in **TypeScript**. Keep types strict and explicit.
- Follow modern React (v18+) patterns.
- Keep dependencies minimal and prefer native APIs when possible.
- The library name `valet` is always lowercase, even when starting a sentence.
- Begin each file with a comment header formatted like:

  ```tsx
  // ─────────────────────────────────────────────────────────────
  // src/components/Box.tsx  | valet
  // patched for strict optional props
  // ─────────────────────────────────────────────────────────────
  ```

  - For docs pages, use the docs marker:

  ```tsx
  // ─────────────────────────────────────────────────────────────
  // src/pages/Overview.tsx  | valet-docs
  // docs page description
  // ─────────────────────────────────────────────────────────────
  ```

  The part after `|` is a short product marker: use `valet` for the library source and `valet-docs` for files under `docs/src`.

- Code is primarily authored by 0xbenc (and his agent proxies)
  - Tech debt is to be avoided
  - Radical thinking is encouraged when it doesn't produce hacky code
    and does produce simple, logical inputs and/or results.
  - Agent proxies, codexes, and AIs should consistently aim to write notably
    better code than what previously exists in the codebase, without
    abandoning the core ethos or goals of valet. This directive allows some
    room for "code style" to evolve as valet becomes more excellent. 

### Commit Messages

- Use short, imperative sentences ("Add feature" not "Added feature").
- Reference issues when relevant.
- Commit messages you write should start with an identification of the most brief nature like:

```txt
git commit -m "codex - commit message here"
```

or 

```txt
git commit -m "devstral - commit message here"
```

- Prefer referring to concepts you interacted with over files.
("Adjusted lighting" over "fixed lights.tsx")

## Building the Project

1. Install dependencies (repo root, docs, and packages) with:

```shell
npm run dx
```

2. Build the library with `npm run build`; build the docs app with
   `npm --prefix docs run build` (after linking — see below).

3. To test WIP changes in the components or system code using a page from the
   docs, use the standardized link flow:

```shell
npm run dx:link   # builds valet and links it into docs + packages
npm run dev       # terminal 1: rebuilds valet on change
# Second terminal emulator, or use TMUX
npm --prefix docs run dev   # terminal 2: docs dev server with HMR
```

## CHANGELOG

- Follow [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) for `CHANGELOG.md`.
- Use the `Unreleased` section at the top.
- If your changes are changelog worthy in a given dev commit add them to the `Unreleased section`
- If there are already comments related to the same concept or component, you can preferably
re-edit the last `Unreleased` change of that nature to be more descriptive to all changes

## Surface state and child registry

Each `<Surface>` instance owns a small Zustand store that tracks screen size
and every registered child element. Size tracking is **opt-in** (PERF S9,
ruling Q9(a)): a `createStyled` element registers with the surface store — and
exposes `--valet-el-width` and `--valet-el-height` CSS variables (updated via
ResizeObserver) — only when it is passed the `$trackSize` transient prop. By
default a styled element does not register, so the common path does no
ResizeObserver/store work. (The previous universal registration was dead on
arrival: it ran for every styled element but the `--valet-el-*` contract never
held on the initial mount and nothing consumed the vars.) The surface itself
exposes `--valet-screen-width` and `--valet-screen-height` on its root element.
Nested `<Surface>` components are disallowed.

Tables respect available height by default. Their content scrolls inside the
component rather than the page. Pass `constrainHeight={false}` to opt out.

## Internal Files

- **src/css/createStyled.ts** – minimal CSS-in-JS engine exporting `styled` and `keyframes`.
- **src/css/stylePresets.ts** – registry of reusable style presets via `definePreset` and `preset` helpers. Preset rules carry doubled-specificity selectors (`.zp-x.zp-x`), so a preset overrides a component's equal-specificity base styles no matter which rule was inserted first — components must never probe the registry to suppress their own defaults (the old `presetHas` workaround is gone).
- **src/hooks/useGoogleFonts.ts** – hook for dynamically loading Google Fonts once.
- **src/system/themeStore.ts** – Zustand store holding the current theme and mode.
- **src/system/createFormStore.ts** – factory creating typed Zustand stores for form state.

## Rule lifecycle policy (styling engine)

Styled rules are **immortal**: once `styled`/`keyframes`/`definePreset` inserts
a rule into the global sheet it is never removed — there is no `deleteRule`,
refcounting, or LRU over the CSSOM (only the raw-css memo is bounded; the
injected-rule bookkeeping is not). That is a deliberate invariant, and it puts
a hard requirement on every styled template: **the rule space must be
discrete**. Interpolations may only produce a bounded set of variants (theme
tokens, enum props, booleans). A continuously-varying value — measured pixels,
width ratios, distance-derived durations, anything from
`getBoundingClientRect` — baked into rule text mints a permanent CSSOM rule
per unique value: a memory leak that survives for the lifetime of the page.
Continuous values must instead flow through **CSS custom properties set on
inline `style`**, with the template reading `var(--…, fallback)` (see
`Pagination.tsx` — `--valet-pag-x`/`--valet-pag-w` et al. — for the canonical
pattern; updating an inline custom property still drives CSS transitions on
the dependent property). The tripwire: dev builds count distinct rules per
styled component and `warnOnce` past 256 — if that warning fires, fix the
interpolation, never raise the limit.

## valet Best Practices

1. Mount `<BrowserRouter>` in `main.tsx` and render `<App>` inside it.
2. Import global presets before the app renders so all routes share them.
3. Call `useInitialTheme({ fonts }, [fontList])` once in `<App>` to apply the theme and preload fonts.
4. Wrap each route in `<Surface>` and never nest surfaces.
5. Split routes with `React.lazy` and `<Suspense>` to keep bundles small.
6. Use `<Stack>` and `<Panel>` to keep layouts consistent and responsive.
7. Define shared styles with `definePreset()` and reference them via the `preset` prop.
8. Read and update theme values through `useTheme`; avoid hard-coding colours.
9. Prefer the provided components over raw HTML to maintain accessibility and theme cohesion.
