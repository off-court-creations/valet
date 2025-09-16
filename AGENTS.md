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
- **Context Bridge for State** built on Zustand and typed JSON schemas.
- **Web Action Graph** capturing interactions for introspection and adaptation.
- **Integrated AI-centric architecture** that unifies semantics, state, and actions.

## MCP Era Quickstart (valet-mcp)

You have access to the valet MCP. Use it whenever you are building UI with valet to search components, inspect typed props/defaults, and grab examples.

See also the detailed MCP guide in docs at `docs/src/pages/concepts/MCP.tsx`.

## NPM Scripts and Agent Testing Behavior

Before finishing your task, if you made changes to the code, ensure the following in order:

- You are in an environment where the valet docs have been `npm link @archway/valet` linked to the local
valet 
- no linting issues after running `npm run lint:fix`
  - if there are linting issues rinse and repeat until it's fixed
- valet will successfully build `npm run build`
  - if it wont rinse and repeat until it's fixed
- valet docs will successfully build `npm run build`
  - if it wont rinse and repeat until it's fixed

^ IMPORTANT ^

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
5. Link globally (if your Codex host discovers global bins): `npm run mcp:server:link` (provides `valet-mcp`)

Notes:

- The Codex harness may expose the introspection tools directly without the server; still keep `mcp-data/` up to date via `npm run mcp:build`.
- Node ≥ 18 is required. This repo targets Node 20+ in practice; CI/dev here runs Node 22.
- If `components` in selfcheck is 0, re-run `npm run mcp:build` and ensure docs and src are present.

## End‑to‑End Flow (DX overview)

- Scaffold component in `valet/src/components`, export from `valet/src/index.ts`.
- Add examples + docs page; wire into docs navigation.
- Link `@archway/valet` into docs and iterate locally with HMR.
- Build MCP data (`mcp-data/`), self‑check, and (optionally) run local MCP server.
- Point codex to local MCP (config.toml) and verify introspection.
- Run lint/build gates (lib + docs), update CHANGELOG, version bump.
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

1. Install dependencies with: 

```shell
cd valet
npm install
cd docs
npm install
```

2. You can build the library and docs with `npm run build`.

3. To test WIP changes in the components or system code using a page from the docs, use an NPM link:

```shell
cd valet
npm link
npm run dev
# Second terminal emulator, or use TMUX
cd valet
cd docs
npm link @archway/valet
npm run dev
```

## CHANGELOG

- Follow [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) for `CHANGELOG.md`.
- Use the `Unreleased` section at the top.
- If your changes are changelog worthy in a given dev commit add them to the `Unreleased section`
- If there are already comments related to the same concept or component, you can preferably
re-edit the last `Unreleased` change of that nature to be more descriptive to all changes

## Surface state and child registry

Each `<Surface>` instance owns a small Zustand store that tracks screen size
and every registered child element. Components created with `createStyled`
register themselves automatically and expose `--valet-el-width` and
`--valet-el-height` CSS variables. The surface exposes
`--valet-screen-width` and `--valet-screen-height` on its root element.
Nested `<Surface>` components are disallowed.

Tables respect available height by default. Their content scrolls inside the
component rather than the page. Pass `constrainHeight={false}` to opt out.

## Internal Files

- **src/css/createStyled.ts** – minimal CSS-in-JS engine exporting `styled` and `keyframes`.
- **src/css/stylePresets.ts** – registry of reusable style presets via `definePreset` and `preset` helpers.
- **src/hooks/useGoogleFonts.ts** – hook for dynamically loading Google Fonts once.
- **src/system/themeStore.ts** – Zustand store holding the current theme and mode.
- **src/system/createFormStore.ts** – factory creating typed Zustand stores for form state.

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
