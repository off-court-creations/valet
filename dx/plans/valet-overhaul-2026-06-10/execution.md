# Valet Overhaul — Execution Log

> Living tracker for executing [`plan.md`](./plan.md). Started **2026-06-10**.
> Driven by an AI agent (Claude Fable 5, ultracode mode). This file records what
> was done, in what order, what was verified, and every issue/flag raised along
> the way. **Plan §5's Phase-0 waves are the master checklist below.** Phase 0 is
> decision-free by construction (plan §2.4); the §9 decision batches are ruled by
> Ben at phase boundaries (Q4 first — it shapes the release plan).

## How to read this

- **Master checklist** mirrors plan §5's wave order for the current phase.
- Each wave gets a section: status, what the plan says, research/discrepancies,
  design choices made, files, verification results, flags.
- **Flags & Issues** at the bottom is the running log of anything surprising,
  any plan/code discrepancy, and any decision/assumption made in-flight.
- Status legend: ⬜ not started · 🔬 researching · 🛠️ implementing ·
  ✅ done+verified · ⏸️ blocked/paused · ⚠️ done with caveats.

## Branch strategy

- **`feat/valet-overhaul`** = the single cumulative epic branch, off
  `development` (clean tree at `0a31fee`). Plan docs + audit + execution log +
  every overhaul wave land here, each building on the last.
- **No PRs / no merges** to `development` or `main` without Ben.
- `development` is **6 commits ahead of `main`** (post-0.34.1 fixes, never
  published) — that is the Q4 hotfix payload; nothing here rewrites it.
- Per Q4's ruling a `fix/0.34.2-hotfix` branch may later cherry-pick
  OVERLAY S1/S2 + those 6 commits; until ruled, everything lands on the epic
  line only.

---

## Master checklist — Phase 1 (plan §5)

| #   | Wave | Contents                                                                                                                                                                                              | Status |
| --- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| 6   | 1.0  | **Pure cores:** FIELDS S5 hooks · A11Y S7 locale + S9 dateLocale · THEMING S3 waitForFonts + S8 modePreference · MCP-TRUTH S7→S8→S9 (gates, freshness, schema 1.7) · OVERLAY S3 registry v2 + TEST-CI S6 suite | ✅     |
| 7   | 1.1  | **Engine/packaging serial lane:** ENGINE S6 → S7 → S8 → PACKAGING S4 (ESM-only, Q1) → S5 probes → ENGINE S10 (Q2) → S9 → S11 · PACKAGING S6 highlight (Q22) parallel                                      | ✅     |
| 8   | 1.2  | **Component lanes (parallel trains):** fields S6–S11 · overlay S4/S5/S6/S8 (+A11Y S4) · Table A11Y S3 → PERF S8 · Snackbar A11Y S1 · Pagination ENGINE-S9 → click-drop · THEMING S4/S5/S7 · SECURITY S5–S8 · A11Y S2/S5/S6 · API-TYPES S4–S8+S13 · OVERLAY S7 z-scale (Q3) last | ⬜     |
| 9   | 1.3  | **Docs/config:** TEST-CI S9 + S11 · GOVERNANCE S7 RELEASING.md · PERF S10 harness · PACKAGING S8 deps (Q21) · wave-end mcp regen · Phase-1 gate                                                          | ⬜     |

### Wave 1.0 — pure cores — ✅

**What shipped:** `useControlledState` + `useFieldState` (internal; ONE
precedence rule prop > form > internal, latched, no mount writes; the 10
existing guards' behaviors verified expressible; conflict-mode write-through
test-pinned) · locale core (`ValetLocaleProvider` React context, ValetStrings
seeded verbatim from all 11 components' literals with line citations,
mergeStrings, isRtlLocale w/ 3-tier script detection; KeyModal excluded per
Q8) · dateLocale Intl helpers (all three weekInfo shapes; display digits
locale-aware, value contract stays ISO Latin per veto) · waitForFonts
(rejected-inflight eviction, never-reject wrappers, 5000ms resolve-on-timeout)
· modePreference (stored > requested > system > fallback; `mode:'system'` +
`persistMode` opts on useInitialTheme; 'valet-mode' key; boot default stays
dark) · MCP hard gates (Q16: placeholders=0, glossary ≥10, floors below
measured actuals — docsUrl 80.7%, examples 38.6%, bestPractices 73.7%) +
`mcp:check` freshness guard (buildCorpus refactor; drift = exit 1) + real
selfcheck in valet-mcp src + **schema 1.7, dead `actions` field dropped** ·
overlay registry v2 (live getOptions, `useOverlay` ref-callback, stack-aware
outside-click as pure `resolveOutsideClick`; legacy API kept working for the
Wave-1.2 migrations) + the full jsdom overlay suite (R28, ships passing).

**Verification:** contract reviewer **pass** (ran the whole gate; coverage
floors verified below actuals; migration sketches for TextField/RadioGroup/
Checkbox confirmed expressible); scope reviewer **pass** (zero strays across
147 dirty files; registrar discipline held — package.json/index.ts zero
diff from lanes); fixer NO-OP (false-positive trigger; all triaged, none
real). **Registrar batch (orchestrator):** `export * from './system/locale'`
+ `"mcp:check"` script. **Gate:** lint ✅ tsc ✅ **625/625 tests** ✅ build ✅
check:engine ✅ mcp:check ✅.

### Wave 1.1 — engine internals + ESM-only dist (strict serial) — ✅

**What shipped (8 serial steps + parallel highlight):** ENGINE S6 render
purity (rule insertion via `useInsertionEffect` queue/flush — classnames stay
synchronous so SSR is unaffected; `Math.random` id → `useId`; insertRule
proven absent from the render phase by spy-in-component-body tests) · S7 the
real normalize (single-pass token-aware scanner: quoted strings + url() byte-
preserved escape-aware, `;`-runs before `}` dropped, idempotent — 53-test
contract suite REPLACED the old pinned-bug tripwires in the same step;
class-hash churn release-noted, no stale hash pinned anywhere) · S8 bounded
LRU memo (cap 4096, generic lru.ts) + per-instance last-raw short-circuit +
`check:bench` reporter; the never-evict bookkeeping invariant test-pinned ·
PACKAGING S4 **ESM-only per-module dist** (Q1: tsup.config.ts two passes,
splitting, es2020; `main` removed, single bundled index.d.mts; engine-smoke/
ssr-import/ci.yml atomically rewritten; docs app builds against the linked
new dist) · S5 probes: publint ✅, attw esm-only profile ✅, `check:bundle`
(Button fixture ≤12KB gzip, zero highlight.js/marked/react-dropzone bytes) ·
ENGINE S10 singleton privatization (Q2: styleCache/globalSheet unexported,
state in `globalThis[Symbol.for('@archway/valet/style-registry/v1')]`, dev
hash-collision guard) · S9 rule-lifecycle policy (Pagination measured pixels
→ `--valet-pag-*` CSS vars on inline style; >256-rules-per-label dev
cardinality warning; policy documented in AGENTS.md) · S11 preset specificity
(presets beat equal-specificity component styles; Panel presetHas workaround
retired) · PACKAGING S6 curated highlight registry (Q22: lib/core + 13
languages, ~306KB→~40KB gzip for Markdown users, zero for others;
`registerHighlightLanguage` public).

**Verification:** engine-dist reviewer **pass** (gate + StrictMode/insertion
timing + LRU invariant + two-copies registry sim + Pagination rule-count
stability all hands-on); scope/fallout reviewer **fail** → three issues, all
dispositioned by the orchestrator: a stray reviewer scratch test breaking
typecheck (already self-cleaned), the missing `registerHighlightLanguage`
barrel export (applied as the sanctioned R6 registrar line; verified
`function` from the built dist), and this log entry. Consumer-fallout sweep:
zero stale CJS/require mentions repo-wide. **Gate:** lint ✅ tsc ✅
**711/711 tests** ✅ build ✅ check:engine ✅ verify:pack (163 files) ✅
check:package ✅ check:bundle ✅ mcp:check ✅.

**Quota note:** the fable-tier weekly subagent quota exhausted mid-wave;
reviews re-ran on opus via workflow resume (implementation steps served from
the journal cache). Subsequent waves pin workflow agents to opus until reset.

---

## Master checklist (plan §5 — Phase 0)

| #   | Wave | Contents (plan §3 slice ids)                                                                                                                                                                   | Status |
| --- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| 1   | 0.0  | **Keystone (solo):** ENGINE S1 lazy guarded sheet init (`createStyled.ts`, new `sheet.ts`, `stylePresets.ts`)                                                                                    | ✅ `e3e3280` |
| 2   | 0.1  | **Pure cores (parallel, disjoint new files):** TEST-CI S1 harness (fast-tracked) · FIELDS S1 dateUtils + S2 sliderMath · THEMING S1 themeUtils + S2 createInitialTheme recovery · SECURITY S2/S3 aiKeyStore + S4 svgSafe · GOVERNANCE S6 gate scripts + S9 devErrors (module only) · MCP-TRUTH S1/S2/S5 extractor fixes · OVERLAY S1 focus trap · TEST-CI S2/S4/S5 suites | ✅     |
| 3   | 0.2  | **Serialized shared-file lanes:** (a) root package.json: TEST-CI S1 scripts → PACKAGING S2 prepack/verify-pack → PACKAGING S1 metadata → ENGINE S5 check:engine · (b) css lane: ENGINE S2 compile → TEST-CI S3 normalize extraction → ENGINE S4 presets · (c) index.ts: MCP-TRUTH S3 KeyModal move → API-TYPES S1 exports · (d) valet-mcp package.json: MCP-TRUTH S6 · TEST-CI S5 TZ suite (after FIELDS S1) | ✅     |
| 4   | 0.3  | **Component edits (parallel disjoint; serialized within contended files):** ENGINE S3 prefixes → PERF S3 Table · OVERLAY S2 Select · FIELDS S3 Tabs + S4 Accordion + S1 DateSelector flip (Q5) · PERF S1 Surface, S2 surfaceStore, S4 List, S5 effect hygiene + Markdown/RichChat fixes (PERF S11 part) · API-TYPES S2 Box/Typography, S3 Button/IconButton · THEMING S6 docs snippet · wave end: GOVERNANCE S9 throw-site sweep | ✅     |
| 5   | 0.4  | **Docs/config (one writer), then the phase gate:** GOVERNANCE S1 changelog → S2 README/AGENTS → S3 WAG sweep → S5 VALIGNMENT archive · SECURITY S1 SECURITY.md + S9 amplify pin · MCP-TRUTH S11 glossary truth · TEST-CI S8 CI workflow + S10 SSR regression | ✅     |
| —   | gate | **Phase-0 gate:** CI green on Node 20/22 (lint, typecheck, test, build, mcp:schema:check, verify:pack, check:engine) + manual docs-app sweep                                                     | ✅ (local equivalent + docs build; Actions runs on first push) |

### Wave 0.4 — docs/config + CI (Phase-0 close-out) — ✅

**What shipped:** CHANGELOG backfilled for all 10 published releases
0.33.0–0.34.1 (stale 140-line Unreleased blob redistributed via `git log -S`
archaeology, summary-level, "(backfilled)"-marked) + a `0.34.2 (planned
hotfix)` section per Q4(a) (the 6 stranded no-merge commits + the two
cherry-pick candidates) + fresh `## Unreleased` targeting 0.35.0 with every
behavior/breaking change Q-cited · README local-docs flow → `dx`/`dx:link`,
React claim → `^18 || ^19` · AGENTS.md: phantom script gone, MCP.tsx path
fixed, "typed JSON schemas" → truthful zustand wording, quality gates rewritten
to the new CI reality, Testing section landed · WAG truth sweep: MainPage card
now sells the REAL MCP server (14 tools), Quickstart/AGENTS/README/docs
AGENTS.md roadmap-framed, enforced by a repo-wide grep gate test
(`scripts/mcp/wagTruth.test.mjs`) · VALIGNMENT*.md archived to
`dx/archive/valignment/` with a closure README adjudicating all 3 open
regressions (all RESOLVED, claims spot-checked by the reviewer against current
code) · SECURITY.md: latest-0.x supported, PVR reporting flow (enable-PVR
note for Ben), public issue template → redirect stub + config.yml ·
amplify.yml mise pinned · `.github/workflows/ci.yml`: core matrix Node
20/22 (lint, typecheck, mcp:schema:check, test, build, verify:pack,
check:engine, check-pins --warn) + mcp-server job (build + selfcheck against
pkgRoot data) · `src/ssr-import.test.ts` (skips pre-build, asserts both
import formats + deterministic SSR classes post-build).

**Verification:** truth reviewer **pass** (every factual claim in the new docs
verified against the repo — tag archaeology spot-checked, scripts
grepped, 14-tools claim counted); scope reviewer **pass** (one justified
addition: docs/AGENTS.md WAG heading, required for the repo-wide gate).
**Phase-0 gate:** lint ✅ tsc ✅ **394/394 tests** ✅ build ✅ check:engine ✅
verify:pack ✅ mcp:schema:check ✅ ssr-import post-build ✅ · docs app
**builds green against the linked overhauled library** (`npm run dx:link` →
`docs && npm run build`, 7.5s vite build) · GitHub Actions itself runs on
first push (local command-list equivalent green); real-browser visual checks
(focus rings, zebra striping on Chrome ≤119) remain flagged for Ben.

## Decisions — provisional rulings (agent-adopted, pending Ben's review)

> **2026-06-10:** Ben set a session goal — "complete the entire overhaul. all
> waves. be exhaustive and excellent" — without pausing for the batch rulings.
> Per the house "adopted-by-recommendation, vetoable" precedent, **every §9
> recommendation is adopted as the provisional ruling** below. All are
> reversible; Ben's section-by-section review supersedes this table and lands
> in plan.md §0. The §9 veto-candidate register likewise ships as specified.

| Q | Adopted (the §9 "Rec:") |
|---|---|
| Q1 | (a) ESM-only per-module dist |
| Q2 | (a) privatize styleCache/globalSheet; `Symbol.for` registry |
| Q3 | (a) full z-order scale (AppBar 1100, Snackbar 1500, Tooltip 1600) |
| Q4 | (a) 0.34.2 hotfix (OVERLAY S1/S2 + the 6 stranded commits) **prepared as a branch + CHANGELOG section; publish itself stays Ben's** — then the overhaul as 0.35.0 |
| Q5 | (a) fix DateSelector TZ now (TZ-parameterized tests landed Wave 0.1) |
| Q6 | (a) allowlist svg parser + `dangerouslySetSvg` escape hatch |
| Q7 | (a) `gravatar` opt-in, default false |
| Q8 | (a) AI runtime stays as loudly-documented dev tool; LLMChat `models` prop |
| Q9 | (a) `$trackSize` opt-in size tracking |
| Q10 | (a) shared FieldShell rendering the full advertised cluster |
| Q11 | (a) keyed selection unification across List/Table/Tree |
| Q12 | (a) renames ship as aliases + dev warnings; old names removed at 1.0 |
| Q13 | (a) `injectRemote` stays true through 0.x + opt-out + dev notice |
| Q14 | (a) explicit-fonts-only: `useInitialTheme({})` triggers zero network |
| Q15 | (a) CVA templates gain @fontsource deps |
| Q16 | (a) hard publish gates with coverage floors |
| Q17 | (a) adopted; **execution deferred to Ben** (repo-settings mutation) — exact `gh api` commands delivered in dx/RELEASING.md once CI lands |
| Q18 | (a) enriched hard throws + opt-in `ValetErrorBoundary` |
| Q19 | (c) staged co-maintainer + CI provenance publishing; **naming the person is Ben's** — documented in RELEASING.md |
| Q20 | (a) publish the browser-support floor |
| Q21 | (a) zustand widens to `^4 \|\| ^5` as a peerDependency (+ devDep for local dev) |
| Q22 | (a) curated highlight.js set (13 languages + `registerHighlightLanguage`) |

Human-only actions (never executed by the agent, prepared + documented
instead): npm publishes, merges/pushes to `development`/`main`, GitHub repo
settings (branch protection Q17, **Private Vulnerability Reporting** — SECURITY
S1's content lands on the epic branch with the PVR step called out in
RELEASING.md).

---

## Wave log

### Wave 0.0 — ENGINE S1 (keystone) — ✅ commit `e3e3280`

**What shipped:** new `src/css/sheet.ts` (lazy guarded sheet; pending-rule
recording in non-DOM envs, in-order flush if a sheet is later created;
insertRule try/catch with dev-only diagnostics); `createStyled.ts` module-scope
document access deleted; `stylePresets.ts` routed through the guarded sheet;
`globalSheet` stays exported (Q2 gate) widened to `CSSStyleSheet | undefined`
as a live binding in both formats.

**Verification (adversarial reviewer, independent):** built pristine HEAD in a
worktree and ran an instrumented stub-DOM harness (every createElement/
appendChild/insertRule/cssText write) over both dists across first-injection,
cache-hit, keyframes, definePreset, presetHas, theme-driven preset
re-registration — **log diff empty (108 lines each)**; identical class names,
rule text, insertion indices, dedupe. DoD: build ✅ · CJS require ✅ (HEAD
fails) · ESM import ✅ (HEAD fails) · styled-in-Node ✅ · lint+tsc ✅.
`renderToString` in Node renders deterministic `z-div-*` classes.

**Scope deviation (justified, reviewer-verified):** RadioGroup.tsx + Slider.tsx
had `KeyboardEvent` in react *value*-imports — a pre-existing ESM-in-Node
instantiation failure (`Named export 'KeyboardEvent' not found`) reproduced on
pristine HEAD, unreachable-before-the-document-crash. Minimal fix applied;
incidentally repairs a latent `instanceof undefined` TypeError in those two
components' ChangeInfo.source keyboard detection (relevant to FIELDS S7–S9).

**Flags raised:** (a) error-path behavior change: malformed rules now dev-log
instead of crashing (styled) / throwing from definePreset — prod is silent;
(b) Node→DOM same-process edge: if only cached rules re-render after a DOM
appears, pending rules never flush (no public flush API; cross-process SSR
unaffected) — note for ENGINE S10; (c) Tabs.tsx has a type-only react
`KeyboardEvent` import (harmless) — a `consistent-type-imports` lint rule would
prevent the class (note for TEST-CI S11); (d) style element is now created on
first injection rather than module eval — observable only when valet is
imported in a non-DOM context first (note for ENGINE S11 `@layer` work).

### Wave 0.1 — pure cores (15 slices, 13 lanes) — ✅

**What shipped:** vitest two-project harness (`vitest.config.ts`: node +
jsdom-by-suffix, pool forks, oxc JSX automatic — vitest 4 superseded the
plan's esbuild option, noted in-config) · suites: resolveSpace (10),
createStyled jsdom StrictMode one-rule-per-class (4), hash (30, incl. seeded
re-import vectors), createFormStore, dateUtils + TZ-parameterized suite
(`src/test-utils/withTZ.ts`, Pacific/Kiritimati ⋯ America/Anchorage), svgSafe
(50+ adversarial vectors), release-gate scripts, devErrors, resolveTabAction
matrix, extractors (added by the fixer) — **251 tests, 15 files, all green** ·
fixes: OVERLAY S1 focus trap (mid-dialog Tab reaches the browser; wrap branches
own preventDefault; escaped-focus refocuses first), THEMING S1 setMode
brand-wipe (overlay-composition model + `resetTheme`, audit Node repro ported),
THEMING S2 try/finally font recovery, FIELDS S2 slider keyStep floor wired,
SECURITY S2/S3 aiKeyStore (stale-cipher eviction, secure-context error,
passphrase field deleted), GOVERNANCE S6 check-changelog/check-pins (+tests),
MCP-TRUTH S1/S2/S5 (real summaries via first-statement comment ranges +
required-prop checker-verdict fix + polymorphic `as`; glossary path fixed,
silent-empty now impossible; route-table docsUrls).

**Verification:** 3-lens adversarial review — correctness **pass** (all eight
behavioral areas re-proven: focus-trap 6/6 end-to-end jsdom keydowns, theme
repro survives double toggle, 50-vector svgSafe sweep, old-vs-new extractor
diff surgical: exactly TextField.name flips required, 4 `as` props added, 56
real summaries, zero collateral); scope **pass** (every file maps to a
sanctioned slice; forbidden files untouched); test-quality **fail** → fixer
added `scripts/mcp/extractors.test.mjs` + flagged registrar scripts.
Orchestrator gate after registrar: lint ✅ tsc ✅ **251/251** ✅ build ✅
CJS+ESM smokes ✅ mcp:build + mcp:schema:check ✅ (corpus regenerated: 0
placeholder summaries, 13 glossary entries, kebab-route docsUrls, buildHash
fresh).

**Registrar actions (R1):** devDeps vitest/jsdom/react/react-dom; scripts
`test`/`test:watch`/`typecheck`. AGENTS.md Testing section text captured from
S1's report — lands with the Wave 0.4 GOVERNANCE batch (R24).

**Flags:** (a) workflow-harness lesson: `args` reaches scripts as a string —
inline constants in future wave scripts (the Wave-0.1 fixer agent died
returning its summary after finishing; work recovered intact from its
transcript and the journal); (b) eslint globs don't cover repo-root config
files (vitest.config.ts unlinted → TEST-CI S11); (c) tsconfig `include:[src]`
leaves vitest.config.ts untypechecked (S11); (d) vitest 4 oxc-vs-esbuild
transform note for AGENTS.md.

### Wave 0.2 — serialized shared-file lanes — ✅

**What shipped:** *(lane a)* `scripts/verify-pack.mjs` (layout-agnostic per R2;
pure functions + CLI, 15 tests incl. the automated dist-absent negative) +
`prepack: npm run build` — **the audited 4-file empty tarball is structurally
impossible**; package.json truth pass (`sideEffects:["*.css"]`, per-format
`types` conditions, `./package.json` subpath, `marked-highlight` removed
(grep-verified zero imports), root `engines` removed — CLIs keep theirs).
*(lane b)* `src/css/compile.ts` pure `compileTemplate` (false/null/undefined
dropped at concat — the `falsedisplay:flex` class of bug is dead; `0`/`''`
preserved; `false` stays in the union per veto register) wired into both styled
+ keyframes paths; `src/css/normalize.ts` mechanical extraction with
characterization tests pinning the known deficiencies as ENGINE S7 tripwires
(hashes unchanged); stylePresets cleanup (dead cache write deleted,
redefine-replaces + warnOnce per R5, theme updates re-insert full rule text so
nested rules survive). *(lane c)* KeyModal `git mv` → widgets/ (public path
unchanged) + extractor default-export handling — **KeyModal is now visible to
MCP** (`components_widgets_keymodal.json`, real summary); API-TYPES S1
vocabulary exports from src/index.ts (9×TS2305 → clean, probe committed at
`dx/type-tests/`). *(lane d)* valet-mcp: `bundle:data` deleted, `prepublishOnly
= build && selfcheck`, fresh `_ts-extract.json` from in-memory maps, extract
artifacts gitignored. *(post-barrier)* `scripts/checks/engine-smoke.mjs` as
`npm run check:engine` (import-no-throw both formats, cross-process
deterministic classes, keyframes/presets in Node, no-'false'-leak).

**The wave's headline catch (adversarial review working as designed):** the
correctness reviewer **failed** the wave by reproducing that ruling R23's
premise was factually wrong — shared.ts resolves relative to `dist/tools`, so
the shipped `<pkg>/mcp-data` was NEVER a bundled-resolution candidate and
deleting `bundle:data` broke selfcheck + every consumer import. The fixer
repaired `packages/valet-mcp/src/tools/shared.ts` (true package root prepended
to candidates; out-of-slice by necessity, logged in Flags #4); plan.md §3.9 S6
amended. Selfcheck now green from the bundled path (`dataSource: "bundled"`,
56 components, versionParity true).

**Integration (orchestrator):** `npm install --package-lock-only` (lockfile
sync after dep removal); mcp-data regenerated + `mcp:schema:check` green.
**Gate:** lint ✅ tsc ✅ **314/314 tests** ✅ build ✅ check:engine ✅
verify:pack ✅ valet-mcp selfcheck ✅.

**Flags:** stylePresets `replaceRuleText` error path can hold a stale rule
when insertRule throws on invalid CSS (dev-observable, invalid-CSS edge only —
noted for ENGINE S11's preset work).

### Wave 0.3 — component edits + throw-site sweep — ✅

**What shipped (11 lanes + sweep, every fix with a failing-first or
bite-tested regression test):** ENGINE S3 `& ` prefixes (RadioGroup, Checkbox,
Table ×10 incl. interpolation-returned selectors) **+ a repo-wide source-level
gate** (`src/css/nestedSelectors.test.ts` lexes all 120 styled templates; found
3 MORE bare selectors beyond the audit — Video.tsx, Pagination.tsx ×2 — fixed
as the orchestrator follow-up, gate now asserts zero) · PERF S3 Table purity
(callbacks out of updaters — pre-fix the prune test HUNG the fork in a
synchronous update loop; stable descending sort via negated comparator) ·
FIELDS S3 Tabs first-render value (values built before activeIndex; bite test
3/4 fail on stash) + S4 Accordion `open={0}` + **S1 DateSelector flip (Q5)** —
exactly one import + three `toISOString` call-site swaps, TZ test fails
pre-flip · PERF S1/S2 Surface+surfaceStore (shallow selector, measure bail,
scroll listener REMOVED — reviewer verified no consumer depended on it;
registerChild drops sync gBCR + microtask-batched: n mounts → 1 notification)
· PERF S4 List (onReorder exactly-once, latest-items ref) · PERF S5 Dropzone/
Snackbar (cross-instance rAF crosstalk fixed)/WebGLCanvas · PERF S11 Markdown
token recursion (bold/links/nested lists/fenced code in list items render
formatted — "the AI-first library mangles AI output" is dead) + RichChat
filtered-index fix · API-TYPES S2 Box/Typography style merge (caller style <
sx) + S3 sound polymorphic Button/IconButton (7 @ts-expect-error negative
probes; runtime-identical) · OVERLAY S2 Select pointer-events interim fix ·
THEMING S6 docs toggle snippet · GOVERNANCE S9 sweep: 7 throw sites enriched
via valetError (component name + fix hint; surfaceStore includes the caller).

**Verification:** both adversarial reviewers **pass** (one re-ran every gate +
bite-tested Tabs by stashing; scope reviewer mapped all 44 files to lanes and
verified DateSelector/Select diffs are exactly minimal). Session-limit
interruption killed the first review run; workflow resumed from the journal
with all 12 lanes + sweep served from cache. Orchestrator gate: lint ✅ tsc ✅
**382/382** ✅ build ✅ check:engine ✅ verify:pack ✅ type-probes ✅;
mcp-data regenerated + schema check ✅.

**Flags:** (a) audit undercount on bare selectors (3 found by the new gate) —
gate is now the source of truth; (b) Table selection still object-identity
keyed by design until PERF S8 rowKey (Phase 1); (c) class hashes changed for
the prefixed components (no test/doc pinned them — verified); (d) real-browser
checks (focus rings, zebra striping on Chrome ≤119) remain on the phase-gate
manual checklist.

---

## Flags & Issues

1. **2026-06-10 — audit collateral repaired before branching.** A packaging
   verification agent from the 246-agent audit overwrote root `tsconfig.json`
   with a `nodenext`/`test.mts` probe config and left it dirty. Restored
   byte-for-byte (CRLF endings included) and verified `git diff --quiet` clean
   before creating the epic branch. No other working-tree damage found.
2. **2026-06-10 — plan synthesis recovered from transcript.** The plan workflow's
   synthesis agent emitted the 75KB document as two text blocks; the harness
   returned only the second. Both blocks were recovered from the agent
   transcript and joined at a verified clean mid-sentence seam
   (`…visibleWindow vs` + `paginationWindow)…`). `plan.md` is complete (all 10
   sections present).
3. **Q5 scope note (assumption).** Plan §3.5 S1 says "behavior flip gated Q5;
   extraction + pinned tests land regardless." Phase 0 therefore creates
   `dateUtils.ts` (correct local-date implementations) + TZ-parameterized tests
   proving them, but leaves DateSelector.tsx's three buggy call sites untouched
   until Q5 is ruled (rec: fix now → the swap is then a Phase-1 one-liner with
   tests already green).
4. **2026-06-11 — R23 premise corrected (Wave 0.2 fixer).** R23/plan §3.9 S6
   claimed "resolver order verified, shared.ts:87–93: pkgRoot/mcp-data wins" —
   false. shared.ts compiles to `dist/tools/shared.js`, so its `pkgRoot`
   resolved to `<pkg>/dist`; the bundled candidates were `dist/mcp-data` (only
   ever populated by the now-deleted `bundle:data`) and `dist/tools/mcp-data`.
   The shipped `<pkg>/mcp-data` copy was never a candidate, so with
   `bundle:data` gone, `MCP_SELFCHECK=1 node dist/index.js` (and every consumer
   import) threw `Unable to locate bundled valet MCP data`. Fixed in
   `packages/valet-mcp/src/tools/shared.ts` (out-of-slice by necessity, no
   other lane owns valet-mcp src): true package root
   (`path.resolve(distRoot, '..')`) prepended to the candidate list, legacy
   `dist/mcp-data` kept for back-compat. Selfcheck now green from the bundled
   path (`dataSource: "bundled"`, 56 components, versionParity true); env-dir
   override still wins.
