# Valet Overhaul — Master Plan

> **Status:** design / proposal. Ben reviews section by section; rulings land in a §0 amendments block above this line.
> **Branch:** `feat/valet-overhaul` (off `development`). The library must eventually ship from this lineage — no permanent fork of the public API without a recorded decision.
> **Provenance:** 12 workstream designs → 3 adversarial critiques (completeness, sequencing, conflict-rulings) → this synthesis. Grounded against the 246-agent audit at `dx/plans/valet-overhaul-2026-06-10/audit.md` (143 adversarially-verified findings, health scorecard, tiered recommendations).
> **Decisions:** §9 lists every genuine ruling (Q1–Q22) and every opinionated call that ships unless vetoed. Breaking changes are flagged there, never snuck in.

## 1. North Star

When this overhaul is done, @archway/valet is a library that is **importable anywhere** (the engine is `typeof document`-guarded and SSR renders deterministic hash-derived classes), **tested and CI-gated** (vitest node+jsdom harness, GitHub Actions on `development` and `main`, prepack/prepublish guards — an empty tarball, a stale MCP corpus, or an untested bug fix is structurally unshippable), **tree-shakeable** (ESM per-module dist; a Button-only consumer pays 6.4KB gzip instead of 40KB plus all of highlight.js), **a11y-promise-kept** (working focus trap, real dialog semantics, live regions, keyboard sort, reduced motion, an i18n string table), **MCP-truthful** (real summaries, a populated glossary, route-verified docsUrls, content gates, zero present-tense vaporware), and **governance-current** (backfilled CHANGELOG, honest README/AGENTS/SECURITY, a release runbook whose gates are mandatory). Behavior changes ship in one flagged 0.35.0 minor, after a small 0.34.2 hotfix resets the baseline.

## 2. Core insights

1. **The document guard is the keystone.** `src/css/createStyled.ts:27–29` runs `document.createElement` at module scope, so the library crashes on any Node import — which is why zero tests exist. ENGINE S1 unblocks every other workstream's node-environment tests and lands first, solo. Clarification that de-risks the whole schedule: jsdom tests need only the harness, not the guard.
2. **One controlled-state definition ends the drift class.** The 10-way copy-pasted controlled/uncontrolled guard diverged into six form-wins components and two prop-wins ones — drift, not design. One `useControlledState`/`useFieldState` pair plus a table-driven contract suite makes re-divergence a review failure, not a latent bug.
3. **Truth-in-advertising is cheap and high-trust.** The MCP corpus's worst lies (56 placeholder summaries, empty glossary, misattached sidecars, broken docsUrls) are each one-fix repairs; content gates then make dishonesty unshippable. The Web Action Graph costs four files to roadmap-mark.
4. **Phase 0 is decision-free by construction.** Every audit critical has a fix requiring no API ruling. That property is the phase's integrity check: if a Phase-0 slice turns out to need a ruling, it moves to Phase 1 rather than holding the gate. Rulings batch at the two phase boundaries.
5. **Files, not features, are the contention unit.** ~30 files have 2–6 writers across the designs (root `package.json` ×6, `src/index.ts` ×8, `createStyled.ts` ×4, Select/Table/Tabs/DateSelector ×4–5). §5/§6 serialize per-file lanes with single owners, registrar commits for shared config files, and one mcp-data regeneration per wave — the difference between a clean branch and rebase hell.

## 3. Workstreams

### 3.1 ENGINE — CSS-in-JS correctness + performance

**End state:** `createStyled.ts` splits into `sheet.ts` (lazy, guarded, dual-package-safe registry), `compile.ts` (pure template→CSS), `normalize.ts` (quote/url-aware, single shared copy), and the React wrapper. Node imports survive; injection moves to `useInsertionEffect`; rules are immortal by policy, so continuous values route through CSS custom properties.

- **S1 Lazy guarded sheet init** (P0) — `src/css/sheet.ts`, `createStyled.ts`, `stylePresets.ts`: delete module-scope lines 27–29; non-DOM envs record pending rules; browser behavior byte-identical; `globalSheet` widens to `CSSStyleSheet | undefined`. Audit Tier-1 #1; insertRule gains try/catch diagnostics (audit createStyled.ts:33).
- **S2 Interpolation hygiene** (P0, pure) — `src/css/compile.ts`: one `compileTemplate` drops `false`/null/undefined in both styled (createStyled.ts:94–106) and keyframes (:169–174), killing the `falsedisplay:flex` class of bug.
- **S3 `& ` prefixes on bare nested selectors** (P0) — RadioGroup.tsx:95, Checkbox.tsx:85, Table.tsx:134–135/143–144 plus ~8 interpolation-returned selectors in Table; lowers the floor to Chrome 112/Safari 16.5.
- **S4 stylePresets cleanup** (P0) — delete the dead inverted cache write (stylePresets.ts:56); redefine **replaces** with a dev-warn (HMR fix; overrules the warn+no-op variant, ruling R5); theme updates re-insert full rule text so nested rules survive.
- **S5 Node SSR smoke harness** (P0 gate) — `scripts/checks/engine-smoke.mjs` as `npm run check:engine`: import-no-throw (both formats), deterministic `z-div-*` classes, keyframes/presets in Node, no `'false'` in cached CSS.
- **S6 Render purity** — `ensureRule`/`flushRule` via `useInsertionEffect`; `Math.random()` id (createStyled.ts:91) → `React.useId()`. Absorbs PERF-REACT S6 (ruling R3).
- **S7 Quote/url-safe normalize** — `src/css/normalize.ts` scanner replaces both regex copies (createStyled.ts:37–39, stylePresets.ts:21–23); class hashes change in one release (release-noted); updates TEST-CI's characterization tests in the same PR.
- **S8 Memoization + bench** — bounded raw→className LRU (`src/css/lru.ts`, cap 4096) + per-instance last-raw short-circuit; `scripts/checks/engine-bench.mjs`; invariant: `injected`/pending maps are never evicted.
- **S9 Rule-lifecycle policy** — Pagination.tsx:132/163–164 measured pixels → `--valet-pag-x/-w` CSS vars on inline style (kills the rule-per-pixel leak); dev cardinality warning (>256 rules per label); policy documented in AGENTS.md.
- **S10 Privatize singletons + dual-package registry** (gated Q2) — remove `styleCache`/`globalSheet` (operative edit createStyled.ts:188; exposed today via `export *` at src/index.ts:72); singleton state moves to `globalThis[Symbol.for('@archway/valet/style-registry/v1')]`; dev hash-collision guard. Lands **after** PACKAGING S4.
- **S11 Preset specificity** (orphan, audit medium stylePresets.ts:54) — `@layer` (or doubled specificity) so presets can override equal-specificity component base styles; retire `presetHas` workarounds (Panel.tsx:150).

**Verification:** Phase-0 gate `npm run build && npm run check:engine`; pure unit tests (compileTemplate, normalize idempotence/quotes/url(), LRU); jsdom StrictMode one-rule-per-class test with insertRule spy; real-browser docs check for S3 (jsdom's nesting support is unreliable); bench before/after in the S8 PR; Pagination rule count stable across 50 pages.

### 3.2 TEST-CI — testing, CI, release safety

**End state:** vitest two-project harness (node + jsdom selected by `*.dom.test.ts(x)` suffix, colocated in `src/`, `pool:'forks'`); regression suites over verified-pure modules; pack/publish guards; one GitHub Actions workflow gating `development` and `main`; orphaned validators chained into publish flows.

- **S1 Harness** — `vitest.config.ts`, `test`/`typecheck` (`tsc -p tsconfig.json`) scripts, devDeps vitest+jsdom; proofs `src/utils/resolveSpace.test.ts` + `src/css/createStyled.dom.test.ts`; AGENTS.md testing section. Hard first-lander: no other workstream bootstraps a harness (ruling R28).
- **S2 hash.ts suite** — `src/css/hash.test.ts`: determinism, known vectors, format, seed overrides via `vi.stubEnv` + `vi.resetModules`.
- **S3 normalize characterization** — mechanical extraction to the canonical `src/css/normalize.ts` (ruling R4) + tests pinning current behavior (quoted-content collapse, `;  }` miss) as ENGINE S7's tripwire.
- **S4 createFormStore suite** — `src/system/createFormStore.test.ts` (pure: values/setField/reset/identity/independent stores).
- **S5 DateSelector TZ suite** — `src/test-utils/withTZ.ts` + TZ-parameterized tests (UTC, Asia/Tokyo, Pacific/Kiritimati, …) written **against FIELDS' canonical `src/components/fields/dateUtils.ts`** — no second extraction, no DateSelector.tsx edits (ruling R7).
- **S6 Overlay focus-trap suite** — `src/system/overlay.dom.test.ts`: stack, Escape/outside/inert/restore-focus, written post-OVERLAY-S1 with **passing** assertions; `it.fails` tripwires are reserved for bugs whose fix is deferred (ruling, sequencing).
- **S7 Pack guard wiring** — wires PACKAGING's `verify:pack` into CI/prepublish; contributes negative tests (`rm -rf dist` → exit 1). Script ownership: PACKAGING (ruling R2).
- **S8 GitHub Actions CI** — `.github/workflows/ci.yml`: `core` matrix Node 20.x/22.x (lint, typecheck, mcp:schema:check, test, build, verify:pack) + `mcp-server` job (build + selfcheck **against the pkgRoot `mcp-data` copy** — the bundle:data premise was factually inverted; ruling R23). `check-pins` runs `--warn` on non-release branches.
- **S9 Validator chaining** — `mcp:server:publish*` gain `mcp:schema:check`; valet-mcp prepublish conforms to MCP-TRUTH ownership; CVA prepublishOnly validate (gated Q16) + `.github/workflows/validate-cva.yml` weekly cron; **delete the committed dangling symlink `packages/create-valet-app/bin/create-valet-app`** + a pack assertion (orphan, audit §9).
- **S10 SSR import regression** — `src/ssr-import.test.ts` + post-build smoke steps in CI (require + import; rewritten ESM-only atomically inside PACKAGING S4's PR).
- **S11 Lint/typecheck for release scripts** (orphan, audit eslint.config.mjs:22) — extend ESLint globs + a checkJs/tsc pass over `scripts/`, `packages/valet-mcp/src`, CVA `bin/` (~4,900 currently ungated lines).

**Verification:** harness self-verifies (both projects in `npm test` output, no test artifacts in dist); CI red/green rehearsal with a deliberate type error; pre/post-guard smoke proving S10 detects the engine guard.

### 3.3 PACKAGING

**End state:** ESM-only per-module dist via tsup multi-entry + splitting (sandbox-validated: Button-only consumer 136KB→16.6KB raw / 40KB→6.4KB gzip, 0 cycles across 129 modules); `sideEffects:["*.css"]`; one bundled `index.d.mts`; curated highlight.js; package-shape regression probes.

- **S1 package.json truth pass** (P0) — `sideEffects:["*.css"]` (current `false` is provably false: createStyled.ts:27–29, Markdown.tsx:21, module-scope keyframes in Progress/LLMChat/RichChat — and it prunes consumers' `styles.css` import); explicit `types` conditions (d.ts + d.mts); `./package.json` subpath; remove unused `marked-highlight`; remove `engines` (the library cannot run in Node today; CLIs keep theirs).
- **S2 verify-pack** (P0) — `scripts/verify-pack.mjs`, layout-agnostic (asserts every exports/main/module/types path exists + dist artifacts in `npm pack --dry-run --json`); `prepack:"npm run build"` makes the verified 4-file empty tarball structurally impossible.
- **S3 valet-mcp double-ship** — descoped to review; MCP-TRUTH S6 implements (ruling R23).
- **S4 Per-module ESM dist** (gated Q1) — `tsup.config.ts`, two passes (JS: `src/**/*.ts(x)` entries, esm, splitting, explicit target es2020; dts: bundled `dist/index.d.mts`); ESM-only exports map; **atomically rewrites engine-smoke.mjs and ci.yml require-assertions in the same PR** (ruling, sequencing).
- **S5 Regression probes** — publint + attw (`check:package`), `scripts/check-bundle.mjs` (`check:bundle`: Button fixture ≤12KB gzip, no highlight.js/marked/react-dropzone specifiers, full-barrel evaluates).
- **S6 highlight.js curated registry** (gated Q22) — `src/system/highlight.ts`: `highlight.js/lib/core` + ts/js/xml/css/json/bash/shell/python/yaml/markdown/diff/sql/**plaintext** (mandatory per Markdown.tsx:196 fallback); public `registerHighlightLanguage` re-export; Markdown.tsx:7 swaps import. 306KB→~40KB gzip for Markdown users, zero for others.
- **S7 Support-statement facts** — folded into GOVERNANCE S8 (ruling R25); packaging supplies tsup target, attw matrix, selector-fix status.
- **S8 Dependency currency** (orphan, audit deps-oss) — `npm audit fix` for the 9 dev-chain CVEs (rollup path traversal, CVSS-8.2 babel plugin); review marked 16→18 and react-dropzone majors; zustand posture per Q21.

**Verification:** publint/attw green on the real tarball; check-bundle thresholds (negative-tested by re-adding `import hljs from 'highlight.js'`); `npm pack --dry-run` lists; docs app via `npm run dx:link` builds and renders.

### 3.4 OVERLAY — overlay system unification

**End state:** one overlay stack with live options and stack-aware outside-click; Drawer is a real dialog; Select and SpeedDial register on the stack; one TS-defined z-index scale.

- **S1 Focus-trap fix** (P0) — delete the unconditional `preventDefault` (overlay.ts:169–172; wrap branches at :121/:130/:135 already preventDefault); harden the focus-escaped case; extract pure `resolveTabAction`. Audit Tier-1 #2; 0.34.2 hotfix candidate (Q4).
- **S2 Select pointer-events** (P0) — `pointer-events:none` on PortalWrap (Select.tsx:123–128), `auto` on Menu; insurance until S6 deletes PortalWrap.
- **S3 Registry v2** — live `getOptions()` (kills frozen-options stale closures), `useOverlay(active, config)` ref-callback hook, stack-aware outside-click (closes every dismissible layer above the deepest layer containing the click). Module stays internal.
- **S4 Migrate Modal/Drawer/Tooltip** — ref-callback attachment (Modal.tsx:223–237, Drawer.tsx:303–316, Tooltip.tsx:275–288); registration on first open commit; absorbs the Modal.tsx:220 rest-spread effect-deps concern (PERF must not touch Modal, ruling R18); **+ orphan fix:** Modal.tsx:266 light-mode contrast (`$text` over backgroundAlt ≈1.3:1).
- **S5 Drawer dialog semantics** — role='dialog'/aria-modal/tabIndex=-1, trapFocus:true (fixes stranded focus), `aria-label`/`aria-labelledby` props + dev warning, Drawer.meta.json; folds the appbar-relative zVar tokens.
- **S6 Select real portal** — createPortal into `#valet-overlay-root`, stack registration, delete the hand-rolled document listeners (Select.tsx:287–304), scroll/resize repositioning, `inheritSurfaceFontVars`; fixes Escape-closes-the-Modal and the transform/overflow clipping; folds the dropdown zVar token.
- **S7 `--valet-zindex-*` scale** (gated Q3) — `src/system/zIndex.ts`: fab 1050 < appbar 1100 < modalBackdrop 1390 < modal 1400 < dropdown 1450 < snackbar 1500 < tooltip 1600; AppBar.tsx:95 (10000), Snackbar.tsx:88 (1000), Tooltip.tsx:71 (1200), Drawer 9999, LoadingBackdrop; `VALET_ZINDEX` exported; repo-scan test rejects literal z-index ≥1000 outside zIndex.ts. (Select/SpeedDial/Drawer tokens fold into S6/S8/S5 visits, ruling R15–R17.)
- **S8 SpeedDial dismissal** — stack registration, Escape + FAB refocus, outside-click, close-on-action, zVar('fab'), SpeedDial.meta.json. The static-ARIA/focus-ring half belongs to A11Y S4 (ruling R15).

**Verification:** resolveTabAction unit matrix; jsdom: live-options swap, two-overlay outside-click, Drawer role/focus-in/restore, Select-in-Modal Escape closes menu only, no leaked document listeners; zVar ordering invariants; manual docs sweep (Modal/Drawer/Select/Tooltip/SpeedDial/Snackbar) + NVDA/VoiceOver pass at the phase gate.

### 3.5 FIELDS-FORMS

**End state:** four P0 correctness fixes as pure, Node-testable extractions; then one `useControlledState`/`useFieldState` pair replaces the 10-way guard with the rule **prop > form > internal**, latched at mount, no mount-time store writes; a table-driven contract suite prevents re-divergence.

- **S1 DateSelector local-date math** (P0, pure) — canonical `src/components/fields/dateUtils.ts` (`formatLocalISO`/`parseLocalISO`, label-free, no css/React imports); replaces the three `toISOString().slice(0,10)` sites (DateSelector.tsx:229/255/292–295). Behavior flip gated Q5; extraction + pinned tests land regardless.
- **S2 Slider keyStep floor** (P0, pure) — `src/components/fields/sliderMath.ts`: `computeKeyStep = snap==='step' ? step : max((max-min)/100, 10**-precision)`; fixes dead arrow keys (Slider.tsx:404).
- **S3 Tabs first-render value** (P0) — build values before computing activeIndex; never read `tabValuesRef` in the render path (Tabs.tsx:359 vs :409); prod-only bug masked by StrictMode.
- **S4 Accordion `open={0}`** (P0) — `openProp !== undefined` (Accordion.tsx:280). Sole owner of this fix (ruling R14); API-TYPES S9 rebases on it.
- **S5 Shared hooks** — `src/hooks/useControlledState.ts`: `useControlledState` (controlled iff `value !== undefined`, latched, dev-warn on flip) + `useFieldState` (prop > form > internal; unseeded form keys render `defaultValue ?? fallback` as controlled with a one-time dev warn; no mount writes); createFormStore JSDoc contract. Internal — not exported.
- **S6–S10 Migrations** — TextField (S6; fixes the ignored `value` prop, TextField.tsx:284, and the controlled flip); Switch/Checkbox (S7; Switch.tsx:138 dead checked props; Checkbox keeps `bindForm`); Select/MetroSelect/RadioGroup (S8; RadioGroup's write-only form binding starts reading, :189–191); Slider/Iterator/DateSelector (S9; **+ orphan:** Slider.tsx:368 pointercancel/setPointerCapture leak); Tabs/Accordion (S10, `useControlledState` only). ChangeInfo.source honesty implemented inside each migration (ruling R10): real pointer/keyboard/clipboard instead of hardcoded 'programmatic'.
- **S11 Cross-field contract suite** — `src/components/fields/controlledContract.test.tsx`: four scenarios × every component, zero stray console.errors, source-level assertion that the copy-pasted guard string is gone.

**Verification:** `TZ=Asia/Tokyo` suites fail pre-fix/pass post-fix; S3 asserts aria-selected in the first committed render without StrictMode; each migration re-runs all prior field tests; the contract suite is the workstream acceptance gate.

### 3.6 A11Y-I18N

**End state:** Phase-0-style a11y completion (live regions, keyboard sort, disclosure ARIA, reduced motion, ARIA structure), then a dependency-free locale foundation (React-context `ValetLocaleProvider` + typed English string table, Intl-driven DateSelector) and RTL Phase A (logical properties + dir plumbing + grep gate).

- **S1 Snackbar live region + pausable auto-hide** — role='status' before the rest spread (Snackbar.tsx:223), remaining-time pause on hover/focus (lines 165–169); **+ orphans:** clean the close `setTimeout` on unmount and restore the controlled-mode exit fade (audit Snackbar.tsx:176). Queueing explicitly deferred (logged).
- **S2 Chat widgets role='log'** — LLMChat.tsx ~323, RichChat.tsx ~418: role='log', aria-relevant, aria-busy while typing; fallback to bubble-only scoping if SR checks flag the embedded forms.
- **S3 Table keyboard sort** — real `<button>` (full reset + :focus-visible ring) inside the sortable `<th>` (Table.tsx:648–686); aria-sort stays on the th.
- **S4 SpeedDial static ARIA + focus rings** — remove `outline:none` (SpeedDial.tsx:63/105), IconButton.tsx:103 focus-visible pattern + visible outline, aria-expanded/aria-controls/role='group', per-action aria-labels. Drops its own Escape/onBlur handlers — dismissal is OVERLAY S8's (ruling R15).
- **S5 prefers-reduced-motion guards** — Progress (four infinite keyframes, :63–64/316/341, degrade to static-visible), LLMChat dots, SpeedDial, Snackbar, Parallax; grep gate: every infinite animation guarded.
- **S6 ARIA structure** — Tabs role='tablist' + aria-orientation; useId-prefixed ids in Tabs/Accordion (Accordion.tsx:580–581); Tooltip aria-describedby cloned onto the focusable child (Tooltip.tsx:347).
- **S7 Locale core** — `src/system/locale.tsx`: typed `ValetStrings` seeded verbatim from today's literals (Chip.tsx:241, Drawer.tsx:338/393, Pagination.tsx:993–1206, Iterator.tsx:277/303, SpeedDial.tsx:211, Dropzone.tsx:305, LoadingBackdrop.tsx:64, LLMChat.tsx:314/424, RichChat.tsx:552, DateSelector.tsx:373–449), `enStrings`, `mergeStrings`, `isRtlLocale`, `ValetLocaleProvider` (React context, **not** zustand). Exported.
- **S8 Labels wiring** — `labels` prop > provider > built-in English across the 11 components; KeyModal excluded pending Q8. Scheduled after every Phase-1 lane touching those files merges.
- **S9 dateLocale helpers** — `src/helpers/dateLocale.ts`, Intl-only (`getMonthNames`, `getWeekdayNames`, `getFirstDayOfWeek` with weekInfo accessor/method/fallback handling, `orderWeekdays`, `formatDayNumber`); **imports** `formatLocalISO` from dateUtils, never redefines it (ruling R7).
- **S10 DateSelector Intl wiring** — `locale`/`firstDayOfWeek` props (defaults preserve en-US/Sunday); replaces monthNames/days constants (:150–165), startDay math (:251); display-only digits; value contract stays ISO Latin. Last writer of DateSelector.tsx.
- **S11 Logical-properties migration + gate** — mechanical subset of the 82 physical usages across 21 files; `/* rtl: physical-by-design */` annotations for JS-pixel-math; `scripts/checks/rtl-physical.mjs` fails on unannotated physical properties. LTR-pixel-identical (docs visual diff).
- **S12 Direction plumbing** — Surface `dir` from provider; Snackbar/SpeedDial `inset-inline-end`; Drawer additive 'start'|'end' anchors via pure `resolveAnchor`; honest RTL-status docs page.

**Verification:** jsdom attribute/timer tests per slice; pure Node tests for locale/dateLocale (en-US/de-DE/ar-EG/ja-JP, weekInfo fallback); rtl-physical gate exit 0; RTL screenshot vs pixel-identical LTR baseline; manual NVDA+VoiceOver checklist at the phase gate.

### 3.7 PERF-REACT

**End state:** Surface stops re-rendering the app on every scroll/mount; registerChild is O(1) and batched; updater purity restored with one pattern (compute from rendered state → setState → callbacks after); Table gets keyed selection; plus the orphaned widget-correctness batch.

- **S1 Surface** (P0) — `shallow` equality (Surface.tsx:70, mirroring Grid.tsx:98), measure() bail when unchanged, **remove the scroll listener entirely** (:103/106/111), rAF-coalesce RO/MutationObserver.
- **S2 surfaceStore** (P0) — registerChild drops the sync `getBoundingClientRect` + per-element Map clone (surfaceStore.ts:72–97); ResizeObserver initial delivery supplies metrics; microtask-batched commits/deletes: n mounts = one notification.
- **S3 Table purity** (P0) — toggleSelect/toggleSort callbacks out of updaters (Table.tsx:445–483); the prune effect's infinite-loop fix (:410–416); stable descending sort (negate comparator, :518).
- **S4 List purity** (P0) — onReorder out of updaters (List.tsx:460–482); latest-items ref fixes the stale pre-drag array in endPointer (:416–424) and touch moves (:351–360).
- **S5 Effect hygiene** (P0) — Dropzone removeAt purity (Dropzone.tsx:287–302) **+ orphans:** stale rejection errors persisting through later drops and `<img>` previews for non-image files (audit Dropzone.tsx:106); Snackbar `window.__valet_snackbar_enter_id2` global → effect-local (:176–198); WebGLCanvas clearColor deps (:139). useGoogleFonts dropped — THEMING owns (ruling R22).
- **S6** — deleted; ENGINE S6 implements the useId swap (ruling R3).
- **S7 Typography component cache** — per-tag module-scope styled cache (Typography.tsx:223–289); stable identity, no subtree remounts.
- **S8 Table rowKey** — `rowKey?: keyof T | ((row,i)=>key)`; selection keyed, pruning derived, callback only on user interaction; React row keys; implements API-TYPES' SelectionProps contract (ruling R12).
- **S9 Size tracking opt-in** (gated Q9) — `$trackSize` transient prop; remove the dead-on-arrival universal registration (createStyled.ts:125–141 never fires for initial mounts); update Surface.meta.json + the three docs pages advertising `--valet-el-*`. Executed through ENGINE's createStyled queue.
- **S10 Render-count regression harness** — Surface render counter, surfaceStore notification counts, Table StrictMode/inline-callback tests, List reorder tests.
- **S11 Orphaned widget correctness** (assigned per completeness critic) — **Markdown token rendering** (Markdown.tsx:123: recurse into `t.tokens`, route block tokens in list items through the block renderer — "the AI-first library mangles AI output", audit HIGH); **RichChat form index** (RichChat.tsx:509 emits the filtered-list index); **Pagination animation click-drop** (Pagination.tsx:282–284; lands in the Pagination lane after ENGINE S9).

**Verification:** scroll-storm and notification-count tests; StrictMode exactly-once callbacks; the prune infinite-loop test written failing first; Markdown fixture suite (bold/links/nested lists/fenced code in list items render formatted); docs-app Profiler before/after.

### 3.8 THEMING-FONTS

**End state:** overlay-composition theme model (`composeTheme(mode, overlay)`) ends the setMode brand-wipe; fail-safe font pipeline (try/finally, 5s resolve-on-timeout, balanced start/finish, never-block grace); `injectRemote:false` privacy opt-out; opt-in system mode + persistence; first-party surfaces self-host fonts.

- **S1 Theme overlay model** (P0, pure) — `src/system/themeUtils.ts` (`baseTheme`/`mergeThemePatch` incl. deep-merged `motion`/`composeTheme`); setMode recomposes instead of resetting (themeStore.ts:312–325); `resetTheme()`; fix darkColorNames data errors (:284–300) and by-reference palette sharing (:307/317).
- **S2 createInitialTheme recovery** (P0) — try/finally around waitForFonts (createInitialTheme.ts:83–86); catch the floating promise (:98–101).
- **S3 waitForFonts** — rejected-inflight eviction, per-load never-rejects wrappers, 5000ms resolve-on-timeout with dev warn (fontLoader.ts:277–314).
- **S4 useGoogleFonts hygiene** — start() out of useInsertionEffect, guaranteed start/finish balance (unmount leak fix), stable string deps. Sole owner (ruling R22).
- **S5 fontStore `started` flag + Surface grace** — 500ms never-started grace so `blockUntilFonts` (Surface.tsx:230) can never wedge.
- **S6 Docs theme-toggle snippet** (P0-adjacent) — ThemeEngine.tsx:170–179 branches on nonexistent `theme.mode`; replace with `toggleMode`.
- **S7 injectRemote option** — `injectRemote?: boolean` on GoogleFontOptions; false skips preconnect/googleapis links (fontLoader.ts:169–223) and treats Google-shaped entries as local families; dev-only once-per-session notice (gated Q13).
- **S8 Mode preference** — `src/system/modePreference.ts`: `resolveInitialMode` (stored > requested > system > fallback), guarded matchMedia/localStorage wrappers, `mode:'system'`/`persistMode` options on useInitialTheme; boot default stays 'dark'.
- **S9 Explicit-fonts-only** (gated Q14) — `useInitialTheme({})` triggers zero network; only caller-named fonts inject (createInitialTheme.ts:63–79).
- **S10 CVA templates + docs self-host** (gated Q15) — @fontsource Inter/Kumbh Sans/JetBrains Mono, `injectRemote:false`, `mode:'system'`, `persistMode:true` in all three templates + docs/src/App.tsx + DemoFontLoader.tsx.
- **S11 Fonts & Privacy docs** — new docs page (GDPR posture, three loading strategies, timeout semantics) + ThemeEngine overlay/mode docs + README paragraph.

**Verification:** port the audit's Node repro as the setMode regression test; rejecting-FontFace and fake-timer timeout tests; renderHook leak tests; template scaffolds build with zero requests to fonts.googleapis.com/gstatic.com.

### 3.9 MCP-TRUTH

**End state:** the corpus is honest (real summaries, populated glossary, attached sidecars, route-verified docsUrls), then dishonesty becomes unshippable (content gates, freshness guard, orphan-sidecar hard failure); dead pipeline parts deleted.

- **S1 Header-comment summary extraction** — `sf.getStatements()[0]?.getLeadingCommentRanges()` (extract-ts.mjs:767–774); converts all 56 placeholder summaries; **+ extractor lows folded in:** required-prop detection (TextField `name` reported optional) and the missing polymorphic `as` prop (extract-ts.mjs:700).
- **S2 Glossary path** — candidate-list + recursive fallback (extract-glossary.mjs:15 hardcodes the moved `concepts/` path); yields 13 entries.
- **S3 Default exports + KeyModal relocation** — resolve `default` export names (extract-ts.mjs:184–194), category guard; `git mv src/components/KeyModal.tsx → widgets/` + the two import updates (src/index.ts:66, LLMChat.tsx:18).
- **S4 Sidecar re-attachment** — Radio.meta.json → RadioGroup.meta.json + minimal Radio sidecar; ParallaxScroll/ParallaxLayer sidecars; delete NAME_ALIASES (extract-docs.mjs:53–57); rename CheckBoxDemo.tsx → CheckboxDemo.tsx (+ docs/src/App.tsx:36); orphan sidecars become a hard merge failure (merge.mjs:250–255).
- **S5 Real docsUrls** — route-table extraction from docs/src/App.tsx (the two shipped docsUrls are broken links: file paths vs kebab routes); `mcp-data/_routes.json`; expected coverage ~45+/56.
- **S6 Artifact hygiene** — fresh `_ts-extract.json` from in-memory maps (merge.mjs:324 mirrors a stale copy); rm `_tmp-meta`; **sole owner of packages/valet-mcp/package.json:** delete bundle:data, keep `files:['mcp-data']`, prepublishOnly = `build && selfcheck` (ruling R23). *(Corrected in execution, 2026-06-11: the original "resolver order verified, shared.ts:87–93" premise was false — `pkgRoot` resolved relative to `dist/tools`, so the shipped `<pkg>/mcp-data` was never a candidate; shared.ts gained the true package root as the first candidate. See execution.md Flags #4.)*
- **S7 Content gates in validate.mjs** — no placeholders, glossary ≥10, coverage floors (docsUrl ≥80%, examples ≥35%, bestPractices ≥70%), docsUrl-vs-routes cross-check; exported `validateCorpus`. Lands after S1/S2/S4/S5 by design.
- **S8 Freshness guard** — `buildCorpus` refactor + `scripts/mcp/check-fresh.mjs` (`mcp:check`); hardened selfcheck (index ≥50, glossary >0, no placeholder samples); gate docs delivered as dx/RELEASING.md content (ruling R27).
- **S9 Drop `actions`, schema 1.7** — always-empty field removed (extract-ts.mjs:626–652, merge.mjs:200, schema.d.ts:48, shared.ts:47).
- **S10 Curated summaries** — sidecars authoritative (`metaMap[name]?.summary || ts.summary`); dotted-name sidecars allowed; editorial pass over all 45 + 12 new minimal sidecars. **Last content slice of Phase 2** (ruling R29).
- **S11 Glossary truth** — narrowed to docs/src/pages/getting-started/Glossary.tsx ('Planned — not implemented' WAG prefix) + the repo-wide grep acceptance gate; GOVERNANCE owns the other four files (ruling R24).
- **S12 Delete dead .meta.ts pipeline** — `src/mcp/metaTypes.ts` (zero importers) + load-meta.mjs babel branch; sidecars are JSON-only.

**Verification:** each slice has a before/after repro (placeholder count → 0; glossary 0 → 13; KeyModal in index; 'radiogroup' synonym → RadioGroup; docsUrl '/box-demo'; mcp:check red on a mutated prop); `npm pack --dry-run` file counts.

### 3.10 SECURITY-PRIVACY

**End state:** Icon's XSS sink replaced by an allowlist parser with an explicitly-named escape hatch; honest SECURITY.md + private reporting; aiKeyStore hardened and loudly posture-documented; Gravatar opt-in; CVA consent; pinned deploy installer.

- **S1 SECURITY.md + reporting path** — latest-0.x-minor supported; GitHub Private Vulnerability Reporting; security_report.md becomes a redirect stub + config.yml. Sole owner (ruling R26); merges only after Ben enables PVR.
- **S2 aiKeyStore storage hardening** (P0) — stale-cipher eviction (localStorage.removeItem before the sessionStorage fallback write); descriptive crypto.subtle secure-context error (aiKeyStore.ts:16).
- **S3 Passphrase removal** (P0) — delete the never-read in-memory `passphrase` field (aiKeyStore.ts:119/136).
- **S4 svgSafe parser** (P0, pure) — `src/helpers/svgSafe.ts`: bare d-data form + `<path>`-only markup with attribute allowlist, never re-serialized to innerHTML; adversarial vector suite (`<image onerror>`, `<set onbegin>`, foreignObject, nested svg, …).
- **S5 Icon hardening** (gated Q6) — Icon.tsx:100–109 string branch via parseSvgString; rejected → null + dev warn; new `dangerouslySetSvg` prop reproduces today's behavior for trusted markup; IconDemoPage.tsx:112 migrated; Icon.meta.json bestPractices.
- **S6 Avatar Gravatar opt-in** (gated Q7) — `gravatar?: boolean` default false; `src/helpers/gravatar.ts`; no fetch without explicit consent + non-empty email (today it hashes `''`); meta examples + docs privacy note.
- **S7 aiKeyStore posture docs** (gated Q8) — loud dev-tool threat model on aiKeyStore.ts/sendChat/useAIKey/KeyModal (post-move path), README, AGENTS.md, LLMChat demo callout. **+ Q8 scope (orphan):** LLMChat.tsx:23 stale hardcoded model catalog — add a `models` override prop and refresh defaults, or descope per ruling.
- **S8 CVA consent** — interactive prompt before `npm i -g @archway/valet-mcp` (create-valet-app.js:379–385); non-interactive skips by default (`--global-mcp`/`CVA_GLOBAL_MCP=1` opt back in); README/CHANGELOG.
- **S9 Pin the mise installer** (P0) — `MISE_VERSION` pin in amplify.yml:9 (currently unpinned curl|sh in the pipeline that builds the library).

**Verification:** XSS vector suite in jsdom and node; gravatar URL/known-md5 tests; cipher-eviction round-trips; scripted CLI run with sandboxed HOME and PATH-shimmed fake npm; Amplify deploy log shows the pin.

### 3.11 API-TYPES

**End state:** every type a consumer needs is importable, every prop that compiles does something, the same name means the same thing across components; deprecation shim carries the renames.

- **S1 Export vocabulary types** (P0) — `Sx`, `Presettable`, `Space`, `SpacingProps`, `FieldBaseProps`, `ChangeInfo`/`OnValueChange`/`OnValueCommit`/`InputPhase`/`InputSource`, `PolymorphicProps`/`PolymorphicRef`/`PolymorphicComponent`/`PropsOf` from src/index.ts (all 9 currently TS2305, tsc-verified); committed type-probe in `dx/type-tests/`.
- **S2 Box/Typography style merge** (P0) — `{...style, ...sx}` (Box.tsx:114–141 clobbers under a comment claiming otherwise; Typography.tsx:311/329).
- **S3 Sound polymorphic Button/IconButton** (P0) — behavior-only OwnProps (Button.tsx:32, IconButton.tsx:32); `<Button as='a' disabled type='submit'>` stops compiling; `style` merged at runtime; dual-direction probe files.
- **S4 Tabs ChangeInfo payloads** — replace inline types (Tabs.tsx:277–285) with the canonical trio; lands after FF S10 (ruling R10/R13).
- **S5 ChangeInfo contract** — narrowed to the events.ts vocabulary, the pointer/keyboard/clipboard/programmatic classification table, and the cross-field test matrix; FIELDS implements in its migrations (ruling R10).
- **S6 FieldBaseProps** — Stage A: destructure name/label/helperText/error/fullWidth before rest-spreads (DOM leaks in Checkbox:309, Switch:190, Slider:465, Iterator:279, MetroSelect:505, RadioGroup:289, Select:401); Stage B (gated Q10): shared FieldShell rendering the full cluster.
- **S7 Select.Option applies its props** — forward className/style/id/data-* onto the rendered `<li>` (OptionProps declared at Select.tsx:56, ignored at :179); add sx/preset.
- **S8 One style/sx precedence** — caller style < sx everywhere both are accepted; flips Tooltip.tsx:350, SpeedDial.tsx:168, Drawer.tsx:366–377.
- **S9 Deprecation shim + Accordion rename** (gated Q12) — `src/system/deprecate.ts` (built on devErrors' warnOnce, ruling R30); `expanded`/`defaultExpanded`/`onExpandedChange` with deprecated `open*` aliases; builds on FF S4/S10, never re-fixes the falsiness bug.
- **S10 onChange normalization** — Pagination `onPageChange` (Pagination.tsx:23), Switch onChange deprecated in favor of onValueChange (Switch.tsx:93).
- **S11 Selection unification** (gated Q11) — `SelectionProps<K>` in src/types.ts (`selectionMode`/`selected`/`defaultSelected`/`onSelectionChange` keyed); contract owner; PERF implements Table internals; List `getItemKey`; Tree adoption.
- **S12 Token paper cuts** — `Space` retypes (Modal.tsx:133, MetroSelect.tsx:56), shared `Intent` type union (5-way dup), RadioGroup `gap` alias, Panel `normalizeRowHeights` alias, Video width/height widening.
- **S13 computeIntentVars extraction** (orphan, audit §5/Tier 3.3) — one shared intent-var/`makeMix` helper for Button/IconButton/AppBar/Chip (152-line verbatim dup at IconButton.tsx:206); **fixes AppBar's invalid hex-concat hover colors** (`base + 'F0'` breaks for rgb()/hsl()/named theme colors, AppBar.tsx:95-adjacent).

**Verification:** baseline `npx tsc -p tsconfig.build.json` stays green; probe files flip from 9×TS2305 to clean; @ts-expect-error probes for the unsound combinations; jsdom merge/precedence/alias tests; docs-app typecheck as consumer canary.

### 3.12 GOVERNANCE-DOCS

**End state:** every governance surface restored to verifiable truth, then policy codified so it cannot rot silently (gates, runbook, contributing guide, error-message policy).

- **S1 CHANGELOG backfill** — reconstruct 0.33.0–0.34.1 sections from tag history (10 tags, 82 commits, marked "(backfilled)"); fresh Unreleased for the post-0.34.1 commits.
- **S2 README/AGENTS rot** — broken local-docs flow → `npm run dx`/`dx:link`; React claim ^18||^19; AGENTS.md phantom script (`mcp:server:link`), wrong MCP.tsx path, false CI claim, "typed JSON schemas" wording.
- **S3 Truth-in-advertising sweep** — owns MainPage.tsx:249–253 (WAG card → real MCP-tools card, adopting MCP-TRUTH's copy), Quickstart.tsx:201–222 (WAG sentence + phantom `*:agent` scripts), AGENTS.md roadmap subsection, README:40 claim (ruling R24).
- **S4** — deleted; SECURITY S1 owns SECURITY.md (ruling R26); the release-checklist supported-row step moves into RELEASING.md.
- **S5 VALIGNMENT archive** — `git mv` all three to `dx/archive/valignment/` with a closure README adjudicating the 3 open regressions against current code (live ones become GitHub issues).
- **S6 Release-gate scripts** — `scripts/release/check-changelog.mjs` + `check-pins.mjs` (docs ^0.33.0 / templates ^0.31.1 skew), `release:check`, `--warn` mode for non-release CI.
- **S7 dx/RELEASING.md** — replaces PUBLISH_ORDER.md (tombstone), every gate mandatory and uncommented (lint, typecheck, test, build, release:check, mcp:build+mcp:schema:check, selfcheck, cva:validate), publish order valet → valet-mcp → cva → docs.
- **S8 Browser-support statement** — canonical README section (Chrome/Edge 112+, Safari 16.5+, Firefox 117+ once ENGINE S3 + explicit target land; every floor cites its feature: nesting, :has(), color-mix, dvh, secure-context) + Quickstart mirror; facts supplied by PACKAGING/ENGINE (ruling R25); gated Q20.
- **S9 devErrors** — `src/system/devErrors.ts` (`valetError` + the single `warnOnce` core, ruling R30); enrich the 8 throw sites (surfaceStore.ts:130 with caller name — ~22-component blast radius via Typography, Surface.tsx:54, MetroSelect.tsx:44, Accordion.tsx:80, RadioGroup.tsx:43, FormControl.tsx:20, Tabs.tsx:43). stylePresets.ts excluded — ENGINE S4 owns its semantics (ruling R5). Module created early; the throw-site sweep is a wave-end mechanical pass, always last writer in each file's lane.
- **S10 ValetErrorBoundary** (gated Q18) — opt-in export, no styled()/theme internals, role='alert' fallback, reset(); .meta.json sidecar.
- **S11 CONTRIBUTING.md** — dev setup, repo map, branch model, quality gates (one shared definition of done with AGENTS.md), changelog discipline, resilience policy, ≤~120 lines.

**Verification:** check scripts unit-tested on fixtures; every RELEASING.md command dry-run end to end; greps (no 'Action Graph' without roadmap framing, no phantom scripts); jsdom boundary/throw-message tests once the harness + guard exist.

**Logged deferrals (advisory, explicit non-goals this overhaul):** SelectProps generics/`multiple` discriminant narrowing; Slider per-move gBCR + Tooltip capture-scroll layout reads; CodeBlock clipboard guard / copied-on-reject; List/Tree virtualization; docs-app CI build (installs valet from npm — manual smoke at phase gates instead); tsconfig strictness skew (`noUncheckedIndexedAccess` etc.); Snackbar queueing; per-mode theme overlays; full interactive RTL (drag math, underline animation); `getServerStyles` SSR collection API; CSS-variable-driven palettes (mode-toggle sheet doubling stays bounded ×2 — ENGINE owns the post-overhaul follow-up; recorded here so the mutual disclaimer cannot bury it).

## 4. Phase plan

| Phase | Title | Delivers | Why here |
|---|---|---|---|
| **0** | Decision-free correctness + test harness | ENGINE S1–S5; OVERLAY S1/S2; FIELDS S1–S4; PERF S1–S5 + Markdown/RichChat fixes; THEMING S1/S2/S6; SECURITY S1–S4/S9; MCP-TRUTH S1–S6/S11; GOVERNANCE S1/S2/S3/S5/S6/S9; API-TYPES S1–S3; TEST-CI S1–S5/S7/S8/S10; PACKAGING S1/S2 | Requires **zero rulings** — ships even if every decision stalls. The guard + harness unblock everything; every audit critical is fixed here. |
| **1** | Structural cores (decision batch 1) | ENGINE S6–S11; PACKAGING S4–S6/S8; OVERLAY S3–S8; FIELDS S5–S11; A11Y S1–S7/S9; PERF S7/S8/S10 + Pagination fix; THEMING S3–S5/S7/S8; SECURITY S5–S8; MCP-TRUTH S7–S9; API-TYPES S4–S8/S13; TEST-CI S6/S9/S11; GOVERNANCE S7 | Needs Q1–Q9, Q13, Q16, Q17, Q20–Q22 ruled. ESM flip + engine internals + registry v2 + field unification are the load-bearing rewrites; everything downstream rebases on them. |
| **2** | Flagged breaking + i18n/RTL + editorial (batch 2) | API-TYPES S9–S12; A11Y S8/S10/S11/S12; THEMING S9–S11; PERF S9; GOVERNANCE S8/S10/S11; MCP-TRUTH S10/S12 | Renames/deprecations and the labels/Intl/RTL sweeps need a frozen prop surface; curated summaries must come after all renames or every one trips the orphan gate. |
| **3** | Integration & release | One mcp:build regen + validate; CHANGELOG finalize; docs/template pin bumps (check-pins flips hard); version bump; RELEASING.md rehearsal; publish valet → valet-mcp → cva → docs | Single-writer integration; the runbook's first real execution is the release itself. |

## 5. Execution waves per phase

### Phase 0

- **Wave 0.0 — keystone (solo PR):** ENGINE S1, with exclusive ownership of `src/css/createStyled.ts` and `stylePresets.ts` — no other PR touching those files may be open. *Validation:* `node -e "require('./dist/index.js')"` and ESM import both exit 0 post-build; browser behavior byte-identical (docs smoke).
- **Wave 0.1 — pure cores (parallel, disjoint new files):** TEST-CI S1 (harness, fast-tracked first); FIELDS S1 dateUtils + S2 sliderMath; THEMING S1 themeUtils + S2; SECURITY S2/S3 aiKeyStore + S4 svgSafe; GOVERNANCE S6 gate scripts + S9 devErrors module (creation only); MCP-TRUTH S1/S2/S5 extractor fixes; OVERLAY S1 (overlay.ts has one writer). *Validation:* `npm test` green on both projects; each pure module's suite passes in plain Node.
- **Wave 0.2 — serialized shared-file lanes:** (a) root package.json lane: TEST-CI S1 scripts → PACKAGING S2 prepack/verify-pack → PACKAGING S1 metadata → ENGINE S5 check:engine (registrar commits only); (b) css lane: ENGINE S2 → TEST-CI S3 normalize extraction → ENGINE S4; (c) index.ts lane: MCP-TRUTH S3 KeyModal move → API-TYPES S1 exports (registrar batch); (d) valet-mcp package.json: MCP-TRUTH S6 alone. *Validation:* verify-pack negative test (rm dist → exit 1); check:engine green; type probe compiles.
- **Wave 0.3 — component/UI edits (parallel disjoint; serialize within contended files):** ENGINE S3 prefixes **before** PERF S3 (Table); OVERLAY S2; FIELDS S3 Tabs + S4 Accordion; PERF S1 Surface, S2 surfaceStore, S4 List, S5 (Dropzone/Snackbar/WebGLCanvas) + Markdown/RichChat fixes; API-TYPES S2 Typography/Box, S3 Button/IconButton; THEMING S6 docs snippet. Wave end: GOVERNANCE S9 throw-site sweep (after FIELDS S3/S4 in Tabs/Accordion). *Validation:* every fix lands with its named regression test; previously-failing tests (prune loop, Tabs first render, Tab trap) flip green; docs-app manual smoke.
- **Wave 0.4 — docs/config (one writer at a time), then the phase gate:** GOVERNANCE S1 changelog → S2 README/AGENTS → S3 WAG sweep → S5 VALIGNMENT archive; SECURITY S1 (after Ben enables PVR) + S9 amplify pin; MCP-TRUTH S11 Glossary + grep gate; then TEST-CI S8 CI workflow + S10 SSR regression land as the gate. *Phase-0 gate:* CI green on Node 20/22 (lint, typecheck, test, build, mcp:schema:check, verify:pack, check:engine) + manual docs-app sweep.

### Phase 1 (after decision batch 1)

- **Wave 1.0 — pure cores (parallel):** FIELDS S5 hooks; A11Y S7 locale + S9 dateLocale; THEMING S3 waitForFonts + S8 modePreference; MCP-TRUTH S7 → S8 → S9 (serial); OVERLAY S3 registry v2 (+ TEST-CI S6 specs against the v2 contract). *Validation:* hook/locale/font suites green; mcp:check red-on-stale rehearsal.
- **Wave 1.1 — engine/packaging serial lane (strict order):** ENGINE S6 → S7 (updates characterization tests in-PR) → S8 → PACKAGING S4 (ESM-only, atomically rewriting engine-smoke + CI require steps) → PACKAGING S5 probes → ENGINE S10 → ENGINE S9 → ENGINE S11. PACKAGING S6 highlight.ts runs parallel (one index.ts registrar append). *Validation:* attw/publint green; check-bundle thresholds; bench numbers recorded; hash-churn release note drafted.
- **Wave 1.2 — component lanes (parallel trains, serial within each):** fields train S6→S7→S8→S9→S10→S11; overlay train S4→S5→S6→S8 (S8 merged with A11Y S4's ARIA half — A11Y S4 lands first); Table lane A11Y S3 → PERF S8; Snackbar lane PERF-S5-done → A11Y S1; Pagination lane ENGINE S9 → PERF click-drop fix; THEMING S4 → S5 (after PERF S1) → S7; SECURITY S5 → S6 → S7 → S8; A11Y S2/S5/S6; API-TYPES S4–S8 + S13 slotted per the §6 lane orders. OVERLAY S7 zIndex sweep ships as one mechanical multi-file PR when all lanes are quiet. *Validation:* per-lane suites + all previously-landed field tests re-run; fields contract suite green at train end.
- **Wave 1.3 — docs/config:** TEST-CI S9 (amended valet-mcp job) + S11 lint coverage; GOVERNANCE S7 RELEASING.md (after MCP-TRUTH S8 scripts exist); PERF S10 harness; PACKAGING S8 deps currency. Wave end: MCP-TRUTH regenerates mcp-data once. *Phase-1 gate:* full CI + check:package/check:bundle + manual real-browser (Safari 16.5/Chrome 112 spot checks) and NVDA/VoiceOver sweep.

### Phase 2 (after decision batch 2)

- **Wave 2.0 — pure/shim cores:** API-TYPES S9 deprecate.ts + Accordion rename (rebases on FF S4/S10) → S10 → S12; GOVERNANCE S10 boundary; PERF S9 $trackSize (via ENGINE queue). 
- **Wave 2.1 — serialized component sweeps:** API-TYPES S11 selection (Table lane finale); A11Y S8 labels (only after every Phase-1 lane touching its 11 files has merged); A11Y S10 DateSelector Intl (strictly after FF S9); THEMING S9; A11Y S11 logical-properties (last writer on each component file) → A11Y S12 dir plumbing. Wave end: devErrors sweep rebase where files moved.
- **Wave 2.2 — docs/templates (one writer):** THEMING S10 templates (before pin bumps) → S11 privacy page; GOVERNANCE S8 support statement → S11 CONTRIBUTING; MCP-TRUTH S10 curated summaries (absolute last content slice) → S12. *Phase-2 gate:* rtl-physical gate exit 0; full validate floors green; RTL screenshot diff; LTR pixel-identical baseline.

### Phase 3

Integrator-only: final mcp:build + validate + freshness; CHANGELOG sections finalized; docs/template pins bumped (check-pins goes hard); SECURITY.md supported row; version bump to 0.35.0; full RELEASING.md dry-run, then publish in order. *Gate:* every runbook command exits 0; `npm pack` contents verified per checklist.

## 6. Conflict-resolution rulings

All rulings below are **binding** (from the conflict critic, with the sequencing critic's lane orders folded in).

| # | Contested file / primitive | Binding ruling |
|---|---|---|
| R1 | Root `package.json` | PACKAGING owns shape fields (exports/sideEffects/main/types/engines/files/prepack). Scripts+devDeps are registrar-batched (TEST-CI registrar, one commit per wave). `prepack:"npm run build"`; final `prepublishOnly` = lint && typecheck && test && mcp:check && release:check && check:package && check:bundle && verify:pack. |
| R2 | `scripts/verify-pack.mjs` | One module, PACKAGING owns (layout-agnostic version); TEST-CI wires CI + negative tests. |
| R3 | `src/css/createStyled.ts` | ENGINE sole writer. Lane: S1 → normalize extraction → S2 → S6 → S7 → PERF S9 (via ENGINE queue) → S8 → S10. PERF S6 deleted; ENGINE S6 owns the useId swap. |
| R4 | normalize module | One file at `src/css/normalize.ts`; TEST-CI lands the mechanical extraction + characterization first; ENGINE S7 rewrites in place updating those tests in the same commit. `normalizeCSS.ts` name is dead. |
| R5 | `stylePresets.ts` redefine semantics | ENGINE S4's replace-on-redefine + dev-warn wins (warn+no-op would serve stale CSS post-HMR). GOVERNANCE S9 excludes the file. |
| R6 | `src/index.ts` | API-TYPES is registrar; one batched edit per wave. Exception: MCP-TRUTH's KeyModal one-liner ships with the file move. styleCache/globalSheet removal is effected at createStyled.ts:188 (`export *` at index.ts:72). Decision-gated removals enter the final batch only after Ben rules. |
| R7 | TZ-safe date formatter | FIELDS owns `src/components/fields/dateUtils.ts` (`formatLocalISO`/`parseLocalISO`). TEST-CI: `withTZ` + suite only. A11Y's `dateLocale.ts` is Intl-only and imports the formatter. withTZ + `pool:'forks'` is the house TZ convention. |
| R8 | `DateSelector.tsx` | FF S1 → FF S9 → A11Y S10 (last writer; must not re-touch the three call sites). |
| R9 | Controlled-state primitive | Single hook at `src/hooks/useControlledState.ts` (FIELDS). Accordion's private hook deleted only by FF S10; API-TYPES builds on it; stays internal. |
| R10 | ChangeInfo.source honesty | FIELDS implements inside its migration slices; API-TYPES owns the events.ts contract, classification table, and cross-field test matrix (edits no field files). Tabs payloads = API-TYPES S4, after FF S10. |
| R11 | `Select.tsx` | OVERLAY S2 → OVERLAY S6 (folds dropdown zVar; deletes PortalWrap incl. S2's fix) → FIELDS S8 → API-TYPES S7+S6 in one visit → A11Y S11. |
| R12 | `Table.tsx` / selection API | API-TYPES owns the `SelectionProps<K>`/rowKey contract in `src/types.ts`; PERF owns all Table internals. Lane: ENGINE S3 → PERF S3 → A11Y S3 → PERF S8 → API-TYPES S11 (alias wiring only) → A11Y S11. List: PERF S4 → API-TYPES S11 → A11Y S11. |
| R13 | `Tabs.tsx` | FF S3 → FF S10 → API-TYPES S4+S8 (one visit) → A11Y S6 → A11Y S11 → devErrors sweep. |
| R14 | `Accordion.tsx` | FF S4 owns the `open={0}` fix; lane FF S4 → FF S10 → API-TYPES S9 → A11Y S6 → sweep. |
| R15 | `SpeedDial.tsx` | A11Y S4 = static ARIA + focus rings (drops its Escape/onBlur); OVERLAY S8 = all dismissal + zVar('fab') + meta.json. Order: A11Y S4 → OVERLAY S8 → A11Y S5 → A11Y S8 → A11Y S12. |
| R16 | `Snackbar.tsx` | PERF S5 first; A11Y S1 owns the final timer shape (+ close-timeout cleanup, controlled exit fade) → OVERLAY S7 token → A11Y S5 → A11Y S12. Meta: A11Y. |
| R17 | `Drawer.tsx` | OVERLAY S4 → S5 (dialog + naming props + zVar) → A11Y S8 (strings via OVERLAY's props, no second naming mechanism) → A11Y S12 anchors. |
| R18 | `Modal.tsx` | OVERLAY S4 owns the overlay block (absorbs PERF's :220 rest-spread concern + the :266 contrast fix; PERF does not touch Modal) → API-TYPES S12 → A11Y S11. Tooltip: OVERLAY S4 → A11Y S6 → API-TYPES S8 → OVERLAY S7. |
| R19 | `Surface.tsx` / `surfaceStore.ts` / `Typography.tsx` | PERF S1/S2 first; Surface then THEMING S5 → A11Y S12 → devErrors sweep last. Typography: API-TYPES S2 → PERF S7. |
| R20 | `useGoogleFonts.ts` | THEMING S4/S7 own; PERF drops the file (THEMING's fix is the superset). |
| R21 | Pagination / LLMChat / docs App.tsx | Pagination: ENGINE S9 → PERF click-drop → API-TYPES S10 → A11Y S8. LLMChat: MCP-TRUTH S3 import → PERF S11 → A11Y S2 → S5 → S8 → S11. docs/src/App.tsx: MCP-TRUTH S4 → THEMING S10 → S11. |
| R22 | KeyModal | MCP-TRUTH S3 owns the git mv + both import updates; SECURITY S7 lands after, at the new path. |
| R23 | `packages/valet-mcp/package.json` | MCP-TRUTH sole owner. bundle:data **deleted** (resolver verified: pkgRoot/mcp-data wins, shared.ts:87–93); prepublishOnly = build && selfcheck (hardened). TEST-CI's CI job conforms (its bundled-path rationale was factually inverted); PACKAGING S3 review-only. |
| R24 | WAG sweep / AGENTS.md / README.md | GOVERNANCE owns the four files and is registrar for AGENTS.md (6 claimants) and README.md (7); others submit sections, batched per wave. MCP-TRUTH keeps only Glossary.tsx + the grep gate. Glossary.tsx: MCP-TRUTH → PERF S9, both keeping the GLOSSARY array babel-parseable. |
| R25 | Browser-support statement | GOVERNANCE S8 writes it once (Phase 2); facts from PACKAGING (target, attw) and ENGINE S3; ENGINE D3 wording defers. Never publish a floor the CSS doesn't yet meet. |
| R26 | SECURITY.md + issue template | SECURITY S1 owns (+ config.yml); GOVERNANCE S4 deleted; supported-row update step lives in RELEASING.md; merge only after PVR is enabled. |
| R27 | dx/PUBLISH_ORDER.md → RELEASING.md | GOVERNANCE owns the runbook; MCP-TRUTH's gate documentation is delivered as RELEASING.md content; MCP-TRUTH S8 scripts land before GOVERNANCE S7 names them. |
| R28 | Test harness + naming | TEST-CI sole owner of vitest.config.ts/devDeps/conventions. No second harness — OVERLAY's and FIELDS' bootstrap fallbacks are **vetoed**; TEST-CI S1 fast-tracks instead. Naming: `*.test.ts` (node) / `*.dom.test.ts(x)` (jsdom); `.spec.*` banned (would never match the globs). `it.fails` tripwires only for deferred bugs; OVERLAY S1 precedes TEST-CI S6, whose suite ships passing. |
| R29 | `mcp-data/` | Slices edit `.meta.json` sidecars only, never commit regenerated mcp-data. MCP-TRUTH regenerates once per wave end; freshness guard active from the first regeneration; curated summaries (S10) are the last content slice of Phase 2. |
| R30 | Dev-warning primitives | `src/system/devErrors.ts` (GOVERNANCE) hosts the single warnOnce core + valetError; `deprecate.ts` (API-TYPES) builds on it; FIELDS' flip warnings and THEMING's injectRemote notice consume it. Module early; throw-site sweep last-writer per lane. |
| R31 | CVA template package.jsons | THEMING S10 (fontsource) first; release pin bumps second (Phase 2 Wave 2.2 / Phase 3). |

## 7. Early wins

Ship-first items — maximum value × minimum risk, all Phase 0:

1. **The document guard** (ENGINE S1) — three-line class of fix that unblocks SSR, Node imports, and the entire testing program at once.
2. **Focus-trap one-liner + Select pointer-events** (OVERLAY S1/S2) — every shipped Modal has broken keyboard nav today; both are no-API-change single-file fixes and the 0.34.2 hotfix payload (Q4).
3. **prepack/prepublishOnly + verify-pack** (PACKAGING S2 / TEST-CI S7) — `npm pack` can never again produce the verified 4-file zero-code tarball.
4. **package.json truth pass** (PACKAGING S1) — `sideEffects:["*.css"]` stops webpack pruning consumers' styles.css; types conditions become explicit; dead dep removed.
5. **MCP one-line repairs** (MCP-TRUTH S1/S2/S4) — 56 placeholder summaries → real ones, empty glossary → 13 entries, RadioGroup gets its curated guidance back. The cheapest trust repair in the plan.
6. **Surface shallow selector + measure bail** (PERF S1) — the screen root stops re-rendering the whole app on every scroll tick and child mount.

## 8. Verification & Definition of Done

**Per-slice DoD (no exceptions):**
- Every bug fix lands with a named regression test on the TEST-CI harness (jsdom tests don't wait for the engine guard; node tests do). Pre-harness Phase-0 slices in Wave 0.0–0.1 backfill tests in the same wave.
- `npm run lint && npm run typecheck && npm test && npm run build` green; `npm run check:engine` green from Wave 0.0 onward.
- Docs synced in-slice: `.meta.json` sidecars and docs pages edited by the slice that changes the behavior; **mcp-data regenerated only by MCP-TRUTH at wave end** (R29) — the freshness gate makes a stale corpus unshippable.
- Behavior/breaking changes carry a CHANGELOG Unreleased entry citing the §9 decision or veto-candidate that authorizes them.
- Shared-file edits go through the lane orders in §6; registrar files (package.json scripts, src/index.ts, AGENTS.md, README.md) accept only batched registrar commits.

**Phase gates:** Phase 0 = CI green on Node 20/22 + check:engine + verify:pack + manual docs-app sweep. Phase 1 = + check:package/check:bundle/attw + engine bench recorded + one manual real-browser pass (Safari 16.5 / Chrome 112 nested-selector and overlay checks) + NVDA/VoiceOver sweep. Phase 2 = + rtl-physical gate + full validate floors + mcp:check + RTL/LTR screenshot diff. Phase 3 = complete RELEASING.md dry-run.

**Known verification limits:** jsdom cannot prove focus-visible painting, AT announcements, or ResizeObserver initial delivery — the scheduled manual browser/AT sweeps at the Phase 1 and 2 gates are part of the DoD, not optional. The docs app installs valet from npm, so CI never exercises local changes against it; the manual docs smoke stays on every phase-gate checklist until a link strategy exists.

## 9. Decisions for Ben

Numbered rulings only — deduped across all twelve designs and the critiques. *Batch 1* must be ruled before Phase 1 kickoff; *batch 2* before Phase 2. Q4 should be ruled first (it changes Phase-0 content).

**Q1. ESM-only package?** Drop the CJS build (breaking for `require()` consumers). (a) ESM-only per-module dist; (b) keep a single-file CJS alongside, dual-package hazard documented; (c) rollup preserveModules dual emit. **Rec: (a)** — pre-1.0, all known consumers are Vite/ESM, Node ≥22 requires ESM natively, and esbuild can't split CJS. Shapes the entire Wave 1.1 lane. *Batch 1.*

**Q2. Privatize `styleCache`/`globalSheet` + globalThis registry?** (a) Remove the exports now and move singleton state to a versioned `Symbol.for` global; (b) keep exported as documented-unstable; (c) keep public. **Rec: (a)** — internal mutable singletons carrying semver weight; the registry is the dual-package mitigation (its priority rises if Q1 is vetoed). *Batch 1.*

**Q3. Z-order normalization?** AppBar 10000→1100 (dims under modal backdrop), Snackbar 1000→1500 and Tooltip 1200→1600 (above modals). (a) Full scale; (b) tokens but AppBar above modal; (c) tokens with current values. **Rec: (a)** — matches Modal's own code comment; CHANGELOG table of old→new. *Batch 1.*

**Q4. Release plan.** (a) Cherry-pick OVERLAY S1/S2 + the 6 stranded development commits into a 0.34.2 patch now (rehearses the new runbook), then ship the overhaul as one flagged 0.35.0 minor; (b) everything rides 0.35.0; (c) park. **Rec: (a)** — production Modals are keyboard-broken today; a small honest 0.34.2 resets the baseline. Determines what GOVERNANCE S1 puts in Unreleased — rule first. 

**Q5. DateSelector TZ flip?** The component emits the previous day for every UTC+ user; fixing it shifts any app that hand-compensated. (a) Fix now with TZ-parameterized regression tests; (b) pin current behavior, fix in a flagged minor. **Rec: (a)** — unambiguous correctness. Extraction + tests land in Phase 0 either way. *Batch 1, early.*

**Q6. Icon XSS approach?** (a) Allowlist parser (d-data + `<path>`-only) + explicit `dangerouslySetSvg` escape hatch — zero deps, breaking for full-SVG strings (one docs demo migrated in-slice); (b) DOMPurify (+~8KB gzip, browser-only); (c) document-only. **Rec: (a).** *Batch 1.*

**Q7. Avatar Gravatar opt-in?** Today any src-less Avatar sends md5(email) — or md5('') — plus viewer IP to Automattic. (a) `gravatar?: boolean` default false; (b) fix empty-email only; (c) console.warn nudge. **Rec: (a)** — visible default change (gravatars become initials). *Batch 1.*

**Q8. AI-runtime scope** (merges security D3, MCP-TRUTH's KeyModal question, and the orphaned LLMChat catalog). (a) Keep aiKeyStore/KeyModal/sendChat exported as a loudly-documented dev tool, KeyModal MCP-visible as `experimental`, add a `models` override prop + refreshed defaults to LLMChat (LLMChat.tsx:23 is hardcoded gpt-3.5-era and the component never calls sendChat); (b) descope: remove the exports, move to docs/ as demo code. **Rec: (a)** — hardening is needed under either outcome; removal belongs with a future AI-runtime redesign. *Batch 2.*

**Q9. Per-styled-element size tracking default?** The documented universal `--valet-el-*` contract has never actually held (initial mounts never register) and nothing consumes it. (a) Opt-in `$trackSize` prop, docs corrected; (b) fix universal registration (every element observed); (c) delete the feature. **Rec: (a).** *Batch 1.*

**Q10. FieldShell?** Seven fields advertise label/helperText/error/fullWidth but render subsets. (a) Implement the full cluster via a shared FieldShell (DOM changes where props were silently ignored); (b) narrow each field's types; (c) leak-fix only. **Rec: (a)** — render the promise the types already make. *Batch 2.*

**Q11. Selection unification?** (a) Keyed `selected`/`defaultSelected` arrays + `selectionMode` + `getItemKey`/`rowKey` across List/Table/Tree with one-minor aliases; (b) Table only; (c) document three vocabularies. **Rec: (a)** — Table's rework is forced by the identity-selection bug anyway. *Batch 2.*

**Q12. Rename removal point?** Accordion `open`→`expanded`, Pagination `onChange`→`onPageChange`, Switch `onChange`→`onValueChange`, RadioGroup `spacing`→`gap`, Panel `normalizeRowHeight`→`normalizeRowHeights` — all additive with dev warnings now. Remove old names at (a) 1.0; (b) after one minor; (c) never; (d) reject specific renames. **Rec: (a).** *Batch 2.*

**Q13. Google Fonts `injectRemote` default?** (a) Keep true through 0.x + opt-out + dev notice + clean first-party templates/docs, flip at 1.0; (b) flip false now; (c) require explicit value. **Rec: (a).** *Batch 1.*

**Q14. Explicit-fonts-only?** Should `useInitialTheme({})` stop auto-loading the three built-in Google families (the truly unconditional GDPR path)? (a) Yes — zero network unless the caller names fonts; (b) no. **Rec: (a)** — zero-config third-party apps will visibly change fonts (CHANGELOG-flagged). *Batch 2.*

**Q15. CVA templates gain @fontsource deps?** (a) Yes — ~3 packages per template, brand look preserved, zero third-party requests; (b) system-font stack; (c) status quo. **Rec: (a).** *Batch 2.*

**Q16. Publish gates become blocking?** Root prepublishOnly full chain; mcp:check hard gates with coverage floors (docsUrl ≥80%, examples ≥35%, bestPractices ≥70%, 100% non-placeholder summaries); valet-mcp selfcheck; CVA validate matrix on publish + weekly cron. (a) Hard gates; (b) warnings-only floors; (c) status quo. **Rec: (a)** — zero-CI history proves advisory checks get ignored; floors sit below current actuals. *Batch 1.*

**Q17. Branch protection?** Require core(20.x), core(22.x), mcp-server checks on (a) both development and main; (b) main only; (c) advisory. **Rec: (a).** Repo-settings action (gh api commands supplied); also: enable Private Vulnerability Reporting before SECURITY.md merges. *Batch 1, after CI lands.*

**Q18. Resilience default?** Components outside a `<Surface>` currently white-screen the host. (a) Keep hard throws, enriched (component name + fix + docs link) + opt-in `ValetErrorBoundary`; (b) dev-error + render-nothing in prod; (c) auto-wrap by default. **Rec: (a)** — agents need crisp failure signals. *Batch 2.*

**Q19. Bus factor / provenance?** (a) Status quo solo + local publish; (b) add one co-maintainer with npm/GitHub rights now; (c) (b) + CI-driven publish with `--provenance` once the workflow is trusted. **Rec: (c), staged** — name the co-maintainer now. *Batch 2.*

**Q20. Publish the browser-support floor?** (a) Explicit contract: Chrome/Edge 112+, Safari 16.5+, Firefox 117+ (post `& ` fixes + pinned es2020 target), secure-context notes, "no SSR yet" roadmap line; (b) vague "evergreen"; (c) silence. **Rec: (a)** — the floor already exists in the code; documenting it costs nothing. *Batch 1 (published Phase 2).*

**Q21. zustand posture?** ^4-only regular dependency means v5 consumers silently carry two copies. (a) Widen to ^4||^5 and/or move to peerDependency in the overhaul release; (b) status quo, documented. **Rec: (a)** — needs your call because it changes install semantics for every consumer. *Batch 1.*

**Q22. highlight.js curated default?** Coverage shrinks ~190 → ~13 languages (unregistered fences render plaintext; `registerHighlightLanguage` escape hatch). (a) Curated set (confirm the list: ts, js, xml/html, css, json, bash, shell, python, yaml, markdown, diff, sql, plaintext); (b) lazy full import; (c) status quo (306KB gzip). **Rec: (a).** *Batch 1.*

### Adopted by recommendation (consensus — explicit VETO CANDIDATES)

These ship as specified unless vetoed. Deduped; each is the binding form where designs overlapped.

**Engine:** rules are immortal + rule space must be discrete — no deleteRule/LRU/refcounting on the CSSOM; continuous values via CSS vars + dev cardinality warning · injection moves to `useInsertionEffect` (classnames still computed in render) · `definePreset` redefine **replaces** with dev-warn (never throws, never no-ops) · normalize rewrite changes every generated class hash in one release (class names were never a contract) · keep native CSS nesting, no flattening transform — `& ` prefixes + published floor instead · `false` stays in the Interpolation union, dropped at concat · Phase 0 keeps `globalSheet` exported but typed `CSSStyleSheet | undefined` until Q2's removal · SSR scope is no-crash + deterministic classes only; `getServerStyles` deferred · CSS-variable palettes deferred post-overhaul (ENGINE-owned follow-up; mode toggles stay bounded ×2) · preset specificity fixed via `@layer`/doubled specificity (S11).

**Testing/CI:** vitest+jsdom only this phase — no Playwright/Storybook; @testing-library enters with the first slice that renders components · colocated `src/**` tests, `*.test.ts` node / `*.dom.test.ts(x)` jsdom, `.spec.*` banned · `prepack`=build, prepublishOnly = full quality gate · CI ubuntu-only, Node 20/22; cva:validate excluded from the PR gate (cron + dispatch) · `check-pins --warn` on non-release branches · valet-mcp CI job validates the pkgRoot mcp-data path (what actually ships) · CI matrix replaces the engines claim (packaging removes the field; CLIs keep theirs).

**Packaging:** no per-component subpath exports — the barrel stays the only JS entry · stay on tsup (no rollup/tsdown migration) · single bundled `index.d.mts` · remove `marked-highlight` now · `./styles.css` stays at package root · pin es2020 explicitly · publint + attw as prepublish devDeps · valet-mcp keeps the files-array mcp-data copy, deletes the dist copy.

**Overlay:** `useOverlay(active, config)` ref-callback API, module stays internal · stack-aware outside-click (clicking a lower layer closes everything dismissible above it) · non-persistent Drawer gets dialog role + trapFocus as a bug fix, not opt-in · Select's menu becomes a real portal and its document listeners are deleted · `VALET_ZINDEX` exported · SpeedDial closes on action/Escape/outside and regains focus rings.

**Fields:** ONE precedence rule — explicit value prop > form binding > internal state, latched at mount, dev-warn when both present (flips six form-wins components; RadioGroup starts reading form values/reset) · unseeded form keys render `defaultValue ?? fallback` as controlled; fields never write to the store on mount · the hooks stay internal · Checkbox keeps `bindForm`, not propagated · ChangeInfo.source reclassification ships unflagged (current values are documented-wrong).

**A11y/i18n:** no i18n runtime dependency — typed string table + native Intl · `ValetLocaleProvider` is React context, not zustand · label resolution: instance `labels` prop > provider > built-in English · locale default 'en-US' with `locale:'auto'` opt-in (deterministic, agent-predictable; revisit at 1.0) · RTL scope is Phase A only (logical properties + dir plumbing + start/end anchors + honest gap docs) · Snackbar role='status' + pause-on-hover ships unflagged · Table sort header becomes a real `<button>` · SpeedDial uses disclosure semantics, not menu/menuitem · DateSelector's value contract stays ISO Latin digits, localization display-only · `/* rtl: physical-by-design */` annotations + grep gate · KeyModal excluded from the string table pending Q8.

**Perf:** Surface's scroll listener removed entirely (fallback: rAF-throttle) · registerChild drops the sync getBoundingClientRect; ResizeObserver initial delivery supplies metrics · Table fires onSelectionChange only on user interaction; pruning is derived · `rowKey` optional with object-identity fallback · Typography's styled component cached per tag at module scope · descending sort negates the comparator · `SurfaceState.children` marked @deprecated in this release, removed one minor later.

**Theming/fonts:** setMode becomes overlay-preserving as a Phase-0 bug fix; `resetTheme()` added · setTheme stays mode-agnostic (no per-mode overlays yet) · waitForFonts: 5000ms default timeout, resolves (never rejects), dev warns · `injectRemote:false` reinterprets Google-shaped entries as local families · dev-only once-per-session notice on remote injection · mode boot default stays 'dark'; system-follow + persistence are opt-in (templates opt in); localStorage key 'valet-mode', applyingSystem flag · fontStore `started` flag + 500ms never-block grace · built-in family names stay.

**MCP:** sidecars are the summary source of truth; placeholders/empties are build errors · drop `actions`, schema 1.7 · delete NAME_ALIASES; rename CheckBoxDemo.tsx · docsUrl derived from the route table, not hand-curated · KeyModal moves to widgets/ (public path unchanged) · 'parallax' synonym re-points to ParallaxScroll · `.meta.ts` pipeline and `defineComponentMeta` deleted; sidecars are JSON-only · orphan sidecars fail the build · WAG is roadmap-marked everywhere, not deleted (both owning designs recommend it).

**Security:** the in-memory `passphrase` field is removed entirely · escape hatch named `dangerouslySetSvg`; rejected svg strings render null + dev warn · bare path d-data accepted as the safest Icon string form · SECURITY.md supports only the latest 0.x minor; public template becomes a redirect · CVA non-interactive runs skip the global MCP install by default; interactive runs get a yes-default consent prompt · descriptive crypto.subtle error · mise installer pinned.

**API/types:** export the minimal polymorphic vocabulary only (factory + MergeProps stay internal) · Box/Typography fix style by merging, not omitting · uniform precedence caller style < sx (flips Tooltip/SpeedDial/Drawer) · keep `Omit<'style'>` on the ~35 non-polymorphic components · IconButtonProps re-issued as the resolved alias · the polymorphic repair and Tabs ChangeInfo widening ship as type-only corrections without a decision gate · accepted homonyms (variant/title/icon/data/size/direction/columns; visibleWindow vs paginationWindow) are explicitly descoped from renaming — documented instead · one shared `computeIntentVars`/`makeMix` helper replaces the Button/IconButton duplication and AppBar's hex-concat math.

**Governance:** VALIGNMENT*.md archived to `dx/archive/valignment/` with per-issue verified closure notes — not deleted, not completed in place · dx/PUBLISH_ORDER.md replaced by dx/RELEASING.md with every validator mandatory (cva:validate un-commented, mcp:check + selfcheck added) · CHANGELOG backfill is per-version summaries marked "(backfilled)", not forensic archaeology of all 82 commits · README's local-docs flow standardizes on `npm run dx`/`dx:link` · the boundary export is named `ValetErrorBoundary` and uses no styled()/theme machinery internally · `devErrors.ts` hosts the single warnOnce core; `deprecate.ts` builds on it.

## 10. Where this is grounded

Every workstream claim above traces to code the audit or a critic verified against the working tree:

- **Audit ground truth:** `dx/plans/valet-overhaul-2026-06-10/audit.md` — 143 adversarially-verified findings (7 killed in verification, 5 marked contested), execution-backed where it matters: the Node import crash (esbuild bundle imported in Node), DateSelector TZ (TZ=Europe/Berlin and Asia/Tokyo repros), Markdown token handling (against installed marked 16.1.2), the setMode theme wipe (Node repro against the real zustand store), the empty `npm pack` tarball (dry-run reproduced), type-surface claims (tsc probes), bundle weights (esbuild + gzip measurements), the MCP summary bug (reproduced with the repo's own ts-morph).
- **Engine:** `src/css/createStyled.ts:27–29` module-scope `document` access (audit critical, Tier-1 #1); `:94–106` per-render concat + `?? ''` false-stringification; `:188` singleton exports reaching consumers via `export *` at `src/index.ts:72` (conflict critic's path-verified correction to ENGINE's framing); `src/css/hash.ts` already Node/browser-deterministic.
- **Overlay/a11y:** `src/system/overlay.ts:169–172` unconditional preventDefault with wrap branches at :121/:130/:135 (audit critical ×2 convergent); `Drawer.tsx:310–316` inert-with-stranded-focus; `Select.tsx:123/287–304` fake portal + hand-rolled listeners; `AppBar.tsx:95` z-index 10000 vs Modal's tokenized 1400.
- **Fields:** `DateSelector.tsx:229/255/292–295` toISOString off-by-one; `Slider.tsx:404` keyStep rounds to zero; `Tabs.tsx:359` vs `:409` ref-read-before-write; `Accordion.tsx:280` falsy-zero; `TextField.tsx:284`, `Switch.tsx:138`, `RadioGroup.tsx:189–191` divergent form predicates — the "drift, not design" evidence base.
- **Packaging:** sandbox-validated per-module build (Button-only 16.6KB raw / 6.4KB gzip vs 136KB/40KB today; 0 cycles across 129 emitted modules); `npm pack --dry-run` 4-file tarball reproduced; `marked-highlight` zero imports (grep-verified across src/docs/scripts/packages); highlight.js 306KB gzip measured.
- **MCP:** `extract-ts.mjs:767–774` (`getLeadingCommentRanges()` returns `[]` on SourceFile — reproduced with the repo's ts-morph); `extract-glossary.mjs:15` hardcoded moved path (patch-in-place yielded 13 entries); `Radio.meta.json` beside no `Radio.tsx` (path-verified by the conflict critic); `packages/valet-mcp/src/tools/shared.ts:87–93` resolver order — pkgRoot/mcp-data before dist — the repo-verified fact that settled the three-way valet-mcp prepublish conflict (R23).
- **Critic path-verification:** all contested file paths confirmed present; intentionally-new files (`tsup.config.ts`, `vitest.config.ts`, `CONTRIBUTING.md`, `.github/workflows/`, `src/test-utils/`, `scripts/checks|release/`) confirmed absent; `CheckBoxDemo.tsx` wrong-casing confirmed; the dangling committed symlink in `packages/create-valet-app/bin/` confirmed.
- **Orphan assignments** (completeness critic, all repo-verified before assignment): `Markdown.tsx:123`, `Pagination.tsx:282`, `Modal.tsx:266`, `Slider.tsx:368`, `RichChat.tsx:509`, `Dropzone.tsx:106`, `Snackbar.tsx:176`, `LLMChat.tsx:23`, `IconButton.tsx:206`/AppBar hex-concat, `stylePresets.ts:54`, `eslint.config.mjs:22`, the 9 dev-chain CVEs, and the CVA symlink — every one now has a named owning slice in §3 or an explicit logged deferral.
- **Repo state:** branch `development`, clean tree, 6 commits ahead of `main` (AppBar icon buttons, prop-pattern work) — the Q4 hotfix payload; `PROP_PATTERNS_AUDIT.md` stays at repo root (HEAD commits actively work from it; API-TYPES consumes it).
