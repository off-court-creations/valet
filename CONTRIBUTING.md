# Contributing to valet

Thanks for working on **@archway/valet**. This guide is the human-facing
companion to [`AGENTS.md`](./AGENTS.md): the two share **one** definition of
done, so a change that satisfies the gates below satisfies CI and the agent
guidelines too. If you are an agent/AI, read `AGENTS.md` first — it is
authoritative on testing conventions and the rule-lifecycle policy.

(The library name `valet` is always lowercase, even when starting a sentence.)

## Dev setup

Requires Node 20+ (CI runs on 20.x and 22.x). From the repo root:

```shell
npm run dx        # installs deps for the repo, docs, and packages/
```

To iterate on a component or system change against a real page in the docs app,
use the standardized link flow — a plain `npm install` inside `docs/` builds
against the *published* `@archway/valet`, not your local source:

```shell
npm run dx:link             # builds valet and links it into docs + packages
npm run dev                 # terminal 1: rebuilds valet on change (tsup --watch)
npm --prefix docs run dev   # terminal 2: docs dev server with HMR
```

## Repo map

- **`src/css/`** — the CSS-in-JS engine: `sheet.ts` (lazy, `document`-guarded
  stylesheet), `compile.ts`, `normalize.ts`, `hash.ts`, `lru.ts`, and the
  `createStyled.ts` React wrapper (`styled`/`keyframes`); `stylePresets.ts`.
- **`src/system/`** — runtime: zustand stores (`themeStore`, `surfaceStore`,
  `fontStore`), the overlay stack (`overlay.ts`), `zIndex.ts`, `locale.tsx`,
  `devErrors.ts` (`valetError`/`warnOnce`), `deprecate.ts`, `events.ts`.
- **`src/components/`** — split by role: `primitives/`, `fields/`, `layout/`,
  `widgets/`. Each component ships beside its `.meta.json` sidecar and tests.
- **`src/hooks/`**, **`src/helpers/`**, **`src/utils/`**, **`src/types.ts`** —
  shared building blocks; the public barrel is `src/index.ts`.
- **`scripts/`** — tooling: the `scripts/mcp/` MCP pipeline
  (`extract-*.mjs` → `merge.mjs` → `validate.mjs`/`check-fresh.mjs`),
  `scripts/checks/` (engine smoke, RTL, bench), `scripts/release/`, and
  `verify-pack.mjs`.
- **`packages/`** — `valet-mcp` (the MCP server) and `create-valet-app` (the
  scaffolder); each publishes independently.
- **`docs/`** — the docs site; **`dx/`** — plans, archives, and
  `dx/RELEASING.md` (the release runbook).

## Branch model

- **`development`** is the integration branch and the base for everyday PRs.
- **`main`** is the release branch — only release-ready, published states.
- **Epic branches** (e.g. `feat/valet-overhaul`) cut off `development` carry
  large multi-wave efforts and merge back when complete.
- Both `development` and `main` are CI-gated; do not push directly. Commits use
  short imperative subjects (see `AGENTS.md` → Commit Messages).

## Quality gates (definition of done)

These mirror `AGENTS.md` → *Quality Gates*. The first block is the set
[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on Node 20.x/22.x
for every push/PR to `development` and `main`; the rest are the in-slice gates
the definition of done adds locally. Run them in order — each is a real
`package.json` script:

- `npm run lint:fix` — zero lint issues (repeat until clean).
- `npm run typecheck` — zero type errors (`src` + `scripts` + `packages/valet-mcp`).
- `npm test` — all vitest suites green. **Every bug fix lands with a named
  regression test** in the same change; behavior changes do too.
- `npm run build` — valet builds (tsup → ESM-only per-module dist).
- `npm run mcp:schema:check` — the corpus validates against the schema.
- `npm run verify:pack` — the packed tarball is complete (no empty-tarball
  regression).
- `npm run check:engine` — Node SSR smoke (import-no-throw, deterministic
  classes, keyframes/presets in Node).

In-slice (run locally when your change touches the relevant surface):

- `npm run check:rtl` — no unannotated physical CSS properties (touched styling).
- `npm run mcp:check` — the `mcp-data/` corpus is fresh (run `npm run mcp:build`
  first if you changed components or docs).
- If you changed docs pages, build the docs app with the local valet linked
  (`npm run dx:link`, then `npm --prefix docs run build`) — CI does not build
  the docs app, so this gate is local.

The publish-time superset (`release:check`, `check:package`, `check:bundle`,
`mcp:server:selfcheck`, `cva:validate`) is documented in
[`dx/RELEASING.md`](./dx/RELEASING.md); releases are human-driven.

## Sidecars in-slice

A component's `.meta.json` sidecar (props, examples, best practices, docsUrl)
is part of its source. When you change a component's API or behavior, update its
sidecar and docs page **in the same change** — never commit a regenerated
`mcp-data/` corpus by hand (it is regenerated once per wave; the freshness gate
makes a stale corpus unshippable).

## CHANGELOG discipline

Follow [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) in
[`CHANGELOG.md`](./CHANGELOG.md). Put changelog-worthy work under the top
`## Unreleased` section; prefer extending an existing related entry over adding
a duplicate. **Every behavior or breaking change cites the ruling that
authorizes it** — the `Q*`/`R*` references resolve in
`dx/plans/valet-overhaul-2026-06-10/`. `release:check` enforces that this file
moves before a version tag.

## Resilience policy

valet's failure mode is **loud and enriched, not silent**. A component used
outside its required `<Surface>` throws a `valetError` (component name + fix
hint + docs link) rather than rendering nothing — agents and developers need a
crisp signal. When you add such an invariant, throw through `valetError` /
`warnOnce` from `src/system/devErrors.ts` (never bare `throw`/`console.warn`).
Pre-1.0 the project hard-renamed props with **no** back-compat aliases; the
post-1.0 deprecation lifecycle (alias + dev-warn for ≥1 minor, then removal in
the next major) is defined in [`VERSIONING.md`](./VERSIONING.md). Consumers who
want to contain a failure opt in to the exported `<ValetErrorBoundary>` (it uses
no `styled()`/theme machinery, so it survives failures originating in the engine
or above the surface tree).

## Testing conventions

See `AGENTS.md` → *Testing* for the full contract. In short: tests are
colocated in `src/` (or beside the script under `scripts/`); `*.test.ts` runs in
the **node** project, `*.dom.test.ts(x)` in the **jsdom** project (`.spec.*` is
banned — it matches no glob and silently never runs). `pool: 'forks'` is
load-bearing for the `withTZ` timezone convention. `it.fails` is reserved for
known, deferred bugs — never for new work.
