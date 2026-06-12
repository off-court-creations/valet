# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

Target: **0.35.0** — the valet overhaul (`feat/valet-overhaul`). Phase 0 (decision-free correctness + test harness) summarized by theme below. Behavior and type-level changes are flagged explicitly with their ruling (Q*/R* in `dx/plans/valet-overhaul-2026-06-10/`).

### Added

- Testing: vitest two-project harness (node + jsdom selected by `*.dom.test` suffix), 380+ colocated tests — hash vectors, normalize characterization, createFormStore, TZ-parameterized date math, focus-trap keydown matrix, 50+ adversarial svgSafe vectors, a repo-wide bare-nested-selector source gate, StrictMode purity suites.
- CI/release safety: GitHub Actions workflow gating `development` and `main` (Node 20.x/22.x: lint, typecheck, test, build, `mcp:schema:check`, `verify:pack`, `check:engine`); `scripts/verify-pack.mjs` + `prepack: npm run build` make the previously-shipped 4-file empty tarball structurally impossible; release gates `scripts/release/check-changelog.mjs` (this file is now enforced at publish time) and `check-pins.mjs`; `check:engine` Node smoke (import-no-throw in both formats, deterministic class names, keyframes/presets in Node).
- Engine: `src/css/sheet.ts` — lazy, `document`-guarded stylesheet init; non-DOM environments record pending rules and flush them in order if a sheet later exists; `insertRule` failures dev-log diagnostics instead of crashing (behavior note: malformed preset CSS no longer throws from `definePreset`; prod is silent).
- Types (API-TYPES S1): the consumer vocabulary is now importable from the barrel — `Sx`, `Presettable`, `Space`, `SpacingProps`, `FieldBaseProps`, `ChangeInfo`/`OnValueChange`/`OnValueCommit`/`InputPhase`/`InputSource`, `PolymorphicProps`/`PolymorphicRef`/`PolymorphicComponent`/`PropsOf` (all nine were TS2305 before); committed type probes under `dx/type-tests/`.
- Security: `src/helpers/svgSafe.ts` allowlist SVG parser (Icon wiring itself is Phase 1, gated Q6); `src/system/devErrors.ts` (`valetError` + `warnOnce`) with enriched messages at 7 throw sites (component name + fix hint).

### Changed

- Engine (SSR guard, audit Tier-1 #1): importing valet in Node/SSR no longer crashes — the module-scope `document.createElement` is gone; `renderToString` emits deterministic hash-derived classes. `globalSheet` widened to `CSSStyleSheet | undefined`.
- Engine: falsy interpolations (`false`/`null`/`undefined`) are dropped at template compile (`src/css/compile.ts`) — the `falsedisplay:flex` bug class is dead; `0`/`''` still render.
- Engine (behavior, ruling R5): `definePreset` redefinition now **replaces** the prior rule with a one-time dev warning (was: silent stale rule across HMR); theme updates re-insert full rule text so nested rules survive.
- Engine: bare nested selectors gained explicit `& ` prefixes (RadioGroup, Checkbox, Table, Video, Pagination) — lowers the floor toward Chrome 112/Safari 16.5; **generated class hashes changed** for the touched components (internal names only).
- Engine (behavior, ENGINE S7 / ruling R4, §9 veto register): `normalizeCSS` is now a quote/`url()`-aware scanner — whitespace inside quoted strings and `url(…)` is byte-preserved (no more corrupted `content` strings, data URIs, or multi-space font names), `;` runs before `}` are fully stripped (`;;}` included), and normalization is idempotent; **every generated class hash changes this release** (class names were never a contract).
- Theme (behavioral fix, THEMING S1): `setMode` recomposes the theme from base + the caller's accumulated overlay instead of resetting to factory palettes — brand overrides now survive mode toggles; new `resetTheme()`; dark palette `colorNames` data errors and by-reference palette sharing fixed.
- Packaging (package.json truth pass): `sideEffects: ["*.css"]` (the previous `false` was provably wrong), explicit per-format `types` conditions, `./package.json` subpath export, unused `marked-highlight` dependency removed, root `engines` removed (CLIs keep theirs).
- Packaging (**BREAKING** for `require()` consumers, ruling Q1(a), PACKAGING S4): the package is now **ESM-only with a per-module dist** — tsup multi-entry + code splitting emits `dist/**/*.mjs` so bundlers tree-shake at module granularity (Button-only consumer ≈136KB→19.7KB raw / 40KB→7.8KB gzip, measured), types are one bundled `dist/index.d.mts`, the CJS build (`dist/index.js`/`index.d.ts`) is gone, and the barrel `dist/index.mjs` stays the only public JS entry (no deep-import subpaths).
- Engine (behavior, ENGINE S11, §9 veto register): preset rules now insert with **doubled-specificity selectors** (`.zp-x.zp-x`, 0-2-0) so a preset can finally override equal-specificity styled() base rules (0-1-0) regardless of insertion order — pre-fix, presets registered at app init always lost the cascade tie to component rules inserted at first render (audit `stylePresets.ts:54`). The DOM class attribute is unchanged (`preset()` still returns one class); only the rule text doubles. Chosen over `@layer`: layering valet's rules would demote them below all unlayered consumer CSS and break the in-place themed rule swap. Consumer note: single-class consumer CSS that previously out-ordered a preset rule now loses to it — use `sx`/inline style (always wins) or a more specific selector for one-off overrides.
- Engine (**BREAKING**, ENGINE S11): `presetHas` is removed from the barrel — it existed solely as a component-side workaround for the preset specificity tie, which is fixed at the cascade level. Panel (its only consumer) now renders its default filled background unconditionally; a background-bearing preset overrides it via specificity. Panel's nested `&::-webkit-scrollbar` rule moved to the end of its template (declarations-before-nested-rules form; Panel's class hash changed — internal name only).
- Engine (**BREAKING**, ruling Q2(a), ENGINE S10): `styleCache` and `globalSheet` are no longer exported — the engine's mutable singletons are private. All singleton state (style cache, injected-rule set, render queue, raw-css memo, pending rules, sheet ref) now lives in a process-wide registry at `globalThis[Symbol.for('@archway/valet/style-registry/v1')]`, so a bundler-duplicated second copy of the engine shares one cache and one `<style>` sheet instead of double-injecting; dev builds now `console.error` on a hash collision (the same class name minted for two different css bodies).
- Packaging (behavior, ruling Q22(a)): syntax highlighting now runs on a curated `highlight.js/lib/core` registry (`src/system/highlight.ts`) instead of the full ~190-language build (≈306KB gzip) — registered grammars: typescript, javascript, xml/html, css, json, bash, shell, python, yaml, markdown, diff, sql, plaintext (+ their aliases). Fences in unregistered languages render as plaintext (no crash); new public `registerHighlightLanguage(name, languageFn)` escape hatch restores any grammar à la carte.
- Performance: Surface no longer re-renders the app on every scroll/mount — shallow store selector, measure bail-when-unchanged, **document scroll listener removed** (verified unconsumed); `surfaceStore.registerChild` drops the sync `getBoundingClientRect` + per-element Map clone and microtask-batches commits (n mounts → 1 notification).
- Performance (ENGINE S8): the styled render path memoizes raw css → class name in a bounded LRU (`src/css/lru.ts`, cap 4096) so repeat strings skip normalize+hash, plus a per-component-instance last-raw short-circuit so re-renders with unchanged css skip even the LRU (warm repeat-string cost 10.3µs → 7.4µs, fresh-instance fn-interpolation overhead 7.1µs → 5.7µs, same-instance re-render 84.6µs → 80.5µs, cold path unchanged — `npm run check:bench`); only the memo is bounded — injected/pending rule bookkeeping is never evicted (rules stay immortal). New `scripts/checks/engine-bench.mjs` reporting tool (`check:bench`, not a gate).
- Types (type-level breaking, decision-free P0, API-TYPES S3): Button/IconButton polymorphism is sound — `<Button as='a' disabled type='submit'>` no longer compiles; runtime behavior identical.
- Types (documented-but-broken behavior now real, API-TYPES S2): Box/Typography merge caller `style` with `sx` (caller `style` loses to `sx`) instead of silently clobbering one with the other.
- MCP corpus honesty: all 56 placeholder summaries replaced with real header-comment summaries; glossary populated (0 → 13 entries); `docsUrls` derived from the real docs route table; KeyModal relocated to `widgets/` (public import path unchanged) and now visible to MCP; required-prop detection fixed (TextField `name`) and the polymorphic `as` prop extracted; `_ts-extract.json` regenerated fresh instead of mirroring a stale copy; valet-mcp resolves its bundled `mcp-data` from the true package root (selfcheck green, `dataSource: "bundled"`).

### Fixed

- A11y/Overlay (audit Tier-1 #2; 0.34.2 cherry-pick candidate): the focus trap no longer swallows Tab mid-dialog — the unconditional `preventDefault` is deleted, wrap branches own their `preventDefault`, and escaped focus is recaptured.
- Overlay (0.34.2 cherry-pick candidate): Select's portal wrapper no longer blocks pointer events on content beneath it (`pointer-events: none` on the wrapper, `auto` on the menu).
- DateSelector (behavior flip, ruling Q5(a)): date math is local-time (`src/components/fields/dateUtils.ts`) instead of `toISOString().slice(0,10)` UTC — users west of UTC no longer see or select the previous day; TZ-parameterized tests (UTC through Pacific/Kiritimati) pin it.
- Tabs: the first committed render honors the controlled `value` (prod-only bug previously masked by StrictMode).
- Accordion: `open={0}` is treated as controlled (`openProp !== undefined` instead of falsiness).
- Slider: arrow keys can no longer compute a 0-pixel step (`computeKeyStep` floor).
- Table: selection/sort callbacks moved out of state updaters (StrictMode double-fire); the selection-prune effect's infinite update loop is fixed; descending sort is stable (negated comparator instead of reversal).
- List: `onReorder` fires exactly once with the latest items — stale pre-drag arrays in pointer-end and touch-move paths fixed.
- Markdown: token rendering recurses into nested tokens — bold/links/nested lists/fenced code inside list items render formatted instead of flattening to plain text.
- RichChat: form submissions emit the correct index when the message list is filtered.
- Dropzone/Snackbar/WebGLCanvas effect hygiene: Dropzone removeAt purity; Snackbar cross-instance rAF crosstalk eliminated (module global → effect-local); WebGLCanvas clearColor dependency fix.
- Fonts: a failed font load can no longer wedge first paint (`try/finally` around `waitForFonts`; the floating promise is caught).
- Security: aiKeyStore evicts stale localStorage ciphertext before falling back to sessionStorage; `crypto.subtle` unavailability raises a descriptive secure-context error; the never-read in-memory `passphrase` field is deleted.
- RadioGroup/Slider: react `KeyboardEvent` value-imports fixed (ESM-in-Node instantiation failure; also a latent `instanceof undefined` TypeError in keyboard source detection).
- Docs: the theme-toggle snippet branched on a nonexistent `theme.mode`; it now uses `toggleMode`.

## 0.34.2 (planned hotfix — unpublished)

Per adopted ruling **Q4(a)** (`dx/plans/valet-overhaul-2026-06-10/execution.md`): a small hotfix resets the publish baseline before the 0.35.0 overhaul minor. Payload = the six `development` commits stranded since 0.34.1 plus two cherry-picks from the overhaul branch. Prepared as a branch; publishing is Ben's call.

Stranded `development` commits (`v0.34.1..0a31fee`):

- AppBar: buttons and icon-button support in the app bar (`31ee72c`, `d5fb059`, merged via PR #479) with follow-up prop/metadata adjustments (`f48172b`).
- Docs: prop-pattern audit notes (`0a31fee`, `PROP_PATTERNS_AUDIT.md`) and audit follow-ups + new lava-lamp shader (`3f350f1`).
- MCP: data regeneration (`fb07a02`).

Cherry-pick candidates (also listed under Unreleased; land here if the hotfix ships first):

- Overlay focus trap: Tab no longer swallowed mid-dialog (OVERLAY S1).
- Select: portal wrapper no longer blocks pointer events beneath the dropdown (OVERLAY S2).

## [0.34.1] — 2025-11-18 (backfilled)

- AppBar: new `fixed` (default `true`) and `portal` props allow inline rendering in docs/demos; the docs AppBar page renders examples inline to avoid overlapping the hero and top bar.
- DateSelector: visual bug fix.
- Panel: background/props bugfix.
- Select and Slider: bugfixes.
- README updates; MCP data regenerated.

## [0.34.0] — 2025-11-15 (backfilled)

- Library/docs stability and alignment pass (~212 files): polish across fields (Button, IconButton, Select, DateSelector, Iterator, MetroSelect, Slider, Switch, Checkbox, RadioGroup) and layout (AppBar, Accordion, Box, Grid, List, Modal, Panel, Tabs); most docs demo pages reworked.
- Added VALIGNMENT tracking docs (alignment audit, issues, progress) — archived to `dx/archive/valignment/` by the 0.35.0 overhaul.
- Publish-order message added; MCP cleanup and data regeneration.

## [0.33.7] — 2025-11-13 (backfilled)

- Table: hover-aware sort indicator — hovering a sortable header fades in a preview triangle on that column using motion tokens while the active column's triangle softly fades out; clicking promotes the preview to the active indicator; moving the cursor away restores the active triangle if unchanged.

## [0.33.6] — 2025-11-12 (backfilled)

- Button: add `centered` prop (mirrors Typography) to center CTAs inside columns/Stacks without wrapper elements; docs and MCP metadata updated.
- MCP data regenerated.

## [0.33.5] — 2025-11-12 (backfilled)

- IconButton and Table: surface-area adjustments.
- Removed a junk file; MCP adjustments and data regeneration.

## [0.33.4] — 2025-11-11 (backfilled)

- List: compatibility improvements.

## [0.33.3] — 2025-11-09 (backfilled)

- DateSelector: calendar day numbers and labels now inherit valet body typography (font family, tracking, leading) instead of rendering in a system default font.
- MCP internals updated; publish-order docs corrected; cross-package version alignment.

## [0.33.2] — 2025-11-02 (backfilled)

- RichChat: substantial layout/behavior adjustments; IconButton tweaks; `styles.css` updates.
- Linting improvements.

## [0.33.1] — 2025-11-02 (backfilled)

- Modal: raise backdrop/dialog z-index above AppBar so modals always cover app bars.
- README update; cleaning/linting-only changes; version alignment; MCP data regenerated.

## [0.33.0] — 2025-10-31 (backfilled)

The largest 0.33.x release (73 commits). Most of the entries that sat in the stale "Unreleased" blob shipped here.

### Added

- Primitives: `WebGLCanvas` — a reusable WebGL2 canvas host handling context creation, DPR-aware resizing, and RAF; the docs lava-lamp hero uses it.
- Grid/Panel: per-row height normalization — Grid `normalizeRowHeights` (default `true`) stretches items so each row matches its tallest Panel in 2+ columns; Panel `normalizeRowHeight` opts out per panel.
- Iterator: `onCommit(value)`, `commitOnChange`, `roundToStep`, and `wheelBehavior` (`'off' | 'focus' | 'hover'`, default `'focus'`); Best Practices and curated examples in the sidecar.
- Table: smart height constraints — `minConstrainedRows` (default `4`) disables internal scrolling when too few rows would show; `maxExpandedRows` (default `30`) paginates large unconstrained datasets via `<Pagination/>`; `paginate` forces pagination; controlled `page`/`onPageChange`/`paginationWindow`.
- Checkbox: `indeterminate` prop with ARIA mixed state; `id` pairing with external labels; contrast improvements (`divider` outline, `primary` fill); marked stable.
- Fields: `FieldBaseProps` shared vocabulary (`name`, `label`, `helperText`, `error`, `fullWidth`, `sx`, `preset`) with JSDoc; Checkbox, TextField, Select, RadioGroup/Radio, Switch, Slider, Iterator, and MetroSelect extend it (types/docs only).
- MCP: `valet__search_best_practices` and `valet__list_synonyms` tools; extractor reads per-prop JSDoc and safely includes inherited userland props; component status enum extended with `production` and `unstable` (schema 1.6); mcp-data regenerated.
- Docs: Glossary page revamp — search with live ARIA-announced result count, category filter/grouping, per-entry deep links with copy-link.

### Changed

- CSS hashing: runtime siphash replaced with dependency-free BigInt FNV-1a (64-bit) plus a `-<len>` suffix; removes the `siphash` dependency; generated class/keyframe names changed (internal only).
- Security: require Vite >= 6.4.1 across docs and templates; CVA templates bumped to match.
- Modal: graduated to stable — DOM passthrough and `sx`, viewport-height constraint via `--valet-modal-viewport-margin`, dev-time accessible-name guard.
- Image: simplified and promoted to stable — `fit`/`objectPosition` replace `objectFit`; native `loading` (default `'lazy'`) replaces custom IntersectionObserver logic; `alt` required; `aspectRatio`; `srcSet`/`sizes`/`fetchPriority` passthrough; rounding via wrapper.
- Progress: complete redesign — new `ProgressBar` and `ProgressRing` primitives; back-compat `Progress` wrapper maps legacy `variant`/`mode`/`showLabel`; tighter ARIA.
- List: ground-up rewrite — unified pointer reordering (mouse/touch/pen) plus Alt+Arrow keyboard reorder, roving tabIndex selection, `getKey`, `emptyPlaceholder`, and `focusMode` (`'auto' | 'row' | 'none'`).
- Iterator: UX/a11y — native `min`/`max`/`step` forwarding, wheel steps only when focused by default, full keyboard map (Arrows/PageUp/PageDown/Home/End/Enter/Escape), bold plus/minus glyphs.
- Docs: lava-lamp shaders extracted to standalone GLSL files under `docs/src/shaders/lava-lamp`; landing-page performance work; MetroSelect playground controls selection mode and tile size; README overhauled; docs usage spacing moved to `gap`/`pad` props.
- CVA: removed `*:agent` scripts; validator emits status tokens.

### Fixed

- Theme: added missing `colors.divider` token (light/dark) — Chip outlined borders were invisible without it.
- Accessibility: Tree keyboard navigation (roving tabindex, Arrow/Home/End/`*`, `aria-level`/`aria-setsize`/`aria-posinset`); Accordion keyboard support consistent across browsers including Safari, chevron orientation flipped, hover divider fades, disabled dimming.
- Avatar: stable default image when neither `src` nor `email` is provided (was a broken URL); default `loading="lazy"`.
- Switch: `type="button"` to avoid unintended form submissions.
- iOS/Android long-press and selection fixes across Tooltip, IconButton, Icon, and SpeedDial (`user-select`, touch-callout, tap-highlight, `touch-action` guards).
- Iterator: disabled field dims to match disabled icon buttons; `readOnly` respected across wheel/buttons/keyboard; typing no longer forces premature commits.
- Image: respect `draggable` when true.
- Docs: LiveCodePreview executes function-component examples.

### Removed

- Skeleton: removed from library, docs, and MCP data.

## [0.32.0]

### Added

- MCP: component-level `status` field in schema and merged output; server types updated to include status badges.
- MCP: aliases support and generated synonyms file. Merge now emits `mcp-data/component_synonyms.json` from sidecar `aliases[]` to power search and MCP tooling.
- Docs: new Component Status page (`/component-status`) listing all components with category, slug, and status (sortable Valet Table).
- Docs: reusable `BestPractices` component that renders sidecar-driven guidance across demo pages.

### Changed

- MCP: migrated all sidecar metadata to JSON (`*.meta.json`) and made sidecars the source of truth for `docs.bestPractices`. Merge prefers sidecar best practices over in-code defaults. Bumped MCP schema version to `1.5`.
- Docs: converted demo pages to consume sidecar best practices and removed legacy inline “Best Practices” panels to de-duplicate guidance. Surface explainer now pulls practices directly from `Surface.meta.json`.
- Theme: use off‑white text (`primaryText`) on `backgroundAlt` surfaces for improved contrast (Panel, Modal, Select, DateSelector).
- Theme: promote Signal Orange (`#D16701`) to `secondary`; introduce new error color Signal Red (`#D32F2F`) with off‑white `errorText`.
- Docs: homepage dividers now use `secondary` instead of `error` for visual consistency.

### Fixed

- Docs build: corrected JSON import paths and Vite CSS import for `@archway/valet` styles to avoid resolution errors.
- Types: cleaned up theme typing in Typography demos to avoid implicit `any`s and ensure stable token usage.
- MCP validation: resolved `mcp:schema:check` warning by always generating `component_synonyms.json` (even when empty).

### Migration notes

- If you have custom sidecars, convert them to `*.meta.json` and add `status` and `aliases` as needed. Move any “Best Practices” content from docs into sidecars under `docs.bestPractices`.

## [0.31.0]

- docs: Add hyperspace starfield (light‑speed) motion layer under hero blobs. GPU-friendly canvas with trails, DPR aware, and respects reduced motion.
- MCP: Add `adjust_theme` tool to safely update `useInitialTheme` in an App file. Supports marker-bound edits, merging theme and font overrides/extras, and always applies with a pre-write backup and diff.

## [0.30.5]
- MCP: Add glossary pipeline and tools. New docs page at `/glossary` powers `glossary.json` via `scripts/mcp/extract-glossary.mjs`; server exposes `get_glossary` and `define_term` (soft-fail suggestions).
- MCP: Add hardcoded `get_primer` tool and resources to guide agents on ethos, patterns, and recommended flows; selfcheck now reports `glossaryEntries` and `hasPrimer`.

## [0.30.4]
- docs: add Best Practices sections for Surface, Styled Engine, and Theme concept pages; plus AppBar, Stack, and Drawer component demos for consistent guidance.
- docs: add Best Practices sections for Pagination, Snackbar, and RadioGroup demos to strengthen accessibility, motion, and state guidance.
- docs: enhance Best Practices for Tabs, Grid, and Select demos with surface-aware overflow, tokenized motion/spacing, and accessibility guidance.
- docs: add Best Practices for List, Tree, and Dropzone demos to cover selection/reorder ergonomics, keyboard navigation patterns, and secure file handling.
- docs: add Best Practices for Stepper, SpeedDial, and Checkbox demos; emphasize presentational vs. navigational roles, safe action clusters, and accessible toggle semantics.
- docs: add Best Practices for Switch, Slider, and Typography demos; clarify instant vs. form toggles, snapping/precision and keyboard support, and semantic heading usage with tokenized type scale.
- docs: add Best Practices for IconButton, Image, and Progress demos; strengthen accessible naming, layout stability, and mode/ARIA guidance.
- docs: add Best Practices for Icon, Skeleton, and Video demos; emphasize semantic sizing and labeling, realistic placeholders, and media accessibility/performance.

## [0.30.3]

- Updated docs to represent the changes and upgrades to `@archway/valet-mcp`!

## [0.30.2]
- Updated AGENTS.md and the docs to represent the changes and upgrades to `@archway/valet-mcp`!

## [0.30.1]
- `Tabs`: switch overflow behavior to single-row horizontal scroll with edge fade indicators; removes multi-row wrapping when tab strip exceeds width. Improves discoverability with a subtle gradient implying more content.
- `Tabs`: drag-to-scroll with mouse when the tab strip overflows horizontally; vertical mouse wheel converts to horizontal scroll for usability.

## [0.30.0]
- Tabs: replace `centered` with Box-like `alignX` prop for tab strip alignment. Removed `centered`.
- Panel: add Box-like `alignX` and rename `centered` (content centering) to `centerContent`.

## [0.29.1]
- `MetroSelect` color theme adjustments

## [0.29.0]
- Theme: add `error`/`errorText` tokens to light and dark palettes.
- Fields: use `theme.colors.error` for `TextField` borders/helpers and `KeyModal` error text.
- `Select`: fix `--valet-text-color` usage and standardize control backgrounds on `backgroundAlt`.
- `Modal`: switch dialog background to `backgroundAlt` for consistency with controls.
- `Pagination`: remove unused `nudgeSlide` helper and clean up dependencies.
- Docs: update Styled Engine badge example to `primary`/`primaryText` tokens.

## [0.28.7]
- Fix: Adaptive `Grid` on older iOS/WebKit no longer forces an inner scrollbar on the first item. Panels now respect CSS vars for overflow/max-height, and `Grid` relaxes them in single‑column portrait so content stacks and the page scrolls naturally.

## [0.28.6]
- RichChat styling

## [0.28.5]
- RichChat: auto-scrolls to bottom on new messages when scrollable, ensuring latest user/system messages are visible.

## [0.28.4]
- Fix: RichChat always keeps input visible and makes messages the scroll container. Resolves portrait screens not showing newest chat or input; messages now scroll under the input instead of hiding it.

## [0.28.3]
- Pagination: normalize WebKit button appearance with transparent background

## [0.28.2]
- DateSelector: auto-compact mode for narrow containers

## [0.28.1]
- Fix: persistent Drawer now respects AppBar offset and no longer renders under the AppBar; height adjusts to avoid overlap. Also offsets the adaptive toggle button.

## [0.28.0]
- `style={{}}` behavior changed to `sx={{}}` for all Valet components

## [0.27.0]
- `Grid` behavior change to improve `adpative` behavior

## [0.26.2]
- Enhance `SpeedDial` with slide-out/in animation for actions with direction-aware offsets and staggered transitions. 

## [0.26.1]
- Adjusted `Pagination` component
- Adjusted theme values for motion

## [0.26.0]
- Added theme tokens for motion!
- `Pagination` now powered by theme token.
- `Pagination` now has fancy animations.

## [0.25.5]
- Enhanced `Pagination` with windowed view via `visibleWindow` and non-destructive window scroll controls
- Performance: optimize `Pagination`

## [0.25.4]
- Improved vertically aligned `Tabs` styling.
- Improved `Accordion` styling. 


## [0.25.3]
- Add `Divider` component with spacing ergonomics and docs page (Usage/Playground/Reference); wired into docs Nav.
- Enhance `Pagination` with animated sliding underline and subtle elastic width pulse for active page
- Improved docs


## [0.25.2]
- Docs improvements
- `Drawer`, `Typography`, `Tree` interplay improvements
- Fix: eliminate resize-induced leak with persistent `Drawer`
- Improved `Codeblock`

## [0.25.1]

- Improved docs

## [0.25.0]

- Revamped spacing systems
- Improved `List` and `Box`
- Improved docs

## [0.24.0]

- Setup ESLint and Prettier
- linted valet and docs

## [0.23.5]

- Auto-hide `Skeleton` when wrapped image finishes loading

## [0.23.4]

- Allow `Skeleton` to display optional icon while loading

## [0.23.3]

- Added `Skeleton` component
- Prevent `Image` dragging to avoid ghost cursor

## [0.23.2]

- Add `fontFamily` prop to `TextField` and `RichChat` for custom input fonts

## [0.23.1]

- Add disabled style for MetroSelect options

## [0.23.0]

- Add `left` and `right` slots to `AppBar` for flexible placement
  - **Migration**: replace `icon`/`iconAlign` with `left`/`right`
    - before: `<AppBar icon={<Icon />} iconAlign="left" />`
    - after: `<AppBar left={<Icon />} right={<Button />} />`

## [0.22.5]

- Add `noSelect` prop to `Typography` to disable text selection
- Use `Typography` `noSelect` for `Accordion` headers, `Tabs` labels, and `MetroSelect` options
- Use `Typography` `noSelect` in `Button` and drop redundant selection overrides

## [0.22.4]

- Add optional `tooltip` prop to `Tabs.Tab` for hover hints

## [0.22.3]

- Add `centered` prop to `Tabs` to center tab headings

## [0.22.2]

- Improved visual bug involving skrinking / resizing for `Table` and `Accordion`

## [0.22.1]

- Fixed a visibility bug with `Tooltip`
- Adjusted `Stepper` styling

## [0.22.0]

- Added support support for local OTF font files

## [0.21.3]

- Adjusted internal Zustand store setup

## [0.21.2]

- Adjusted `Icon` sizing for better iOS / Safari support
- Reworked `AppBar` to ensure background color renders on older Safari
- Portaled `AppBar` to `document.body` to fix background color bug on old Safari
- Added `MetroSelect` component

## [0.21.1]

- Adjusted `Icon` sizing for better iOS / Safari support

## [0.21.0]

- Removed edit pencil functionality from `Rich Chat`

## [0.20.1]

- Fix Button text spacing when wrapping primitives

## [0.20.0]

- Added optional `icon` prop to `AppBar` with left/right placement and improved spacing
- Fixed theme fonts not loading unless `fontFamily` prop set on `Typography`
- Added `family` prop to `Typography` for choosing theme fonts
- `Tree` text now uses the body font

## [0.19.3]

- Updated `Accordion` demo

## [0.19.2]

- Adjusted `Accordion`
- Adjust `RichChat` and `LLMChat` to use "outlined" `Accordion`

## [0.19.1]

- Removed Pixi.js integration demo

## [0.19.0]

- Added React 19 compatibility
- Added Pixi.js integration demo

## [0.18.3]

- `Dropzone` component for simple drag-and-drop uploads

## [0.18.2]

- `RichChat` component for local chats with embeddable content

## [0.18.1]

- Added `Markdown` component
- Used `Markdown` component in `LLMChat` to improve response styling

## [0.18.0]

- Renamed `OAIChat` component to `LLMChat`

## [0.17.0]

### Added

- `KeyModal` component and secure `openaiKeyStore` for browser-stored keys

### Changed

- `OAIChat` starts disconnected with a built-in AppBar to manage the OpenAI key
- `TextField` accepts `fullWidth` to stretch inside flex rows

## [0.16.3]

- Improved `OAIChat` styling, especially on mobile / portrait.

## [0.16.2]

- Range mode on `DateSelector` uses primary tones and a filled secondary end day
- Selected dates in `DateSelector` now have bold text

## [0.16.1]

- Bugfix on `Panel` default background

## [0.16.0]

- Adjust sizing and spacing for:
  - Box
  - Panel
  - Stack
  - Surface
  - Tabs
  - Typography
  - Table

## [0.15.1]

- Adjusted size mappings for `IconButonn` and `Icon`
- Adjusted classification of some components

## [0.15.0]

### Removed

- `DateTimePicker` component

## [0.14.0]

- Added `DateSelector` widget – compact calendar component
- Added `Iterator` widget – numeric stepper input
- `Iterator` responds to mouse wheel scrolling when hovered
- `Iterator` prevents page scroll while hovered

## [0.13.0]

- Renamed `Chat` to `OAIChat`

## [0.12.1]

- Fixed `AppBar` portal to inherit font variables from the current `Surface`

## [0.12.0]

- Adjusted Avatar, Button, Icon, IconButton, Checkbox, RadioGroup,
  Select, Slider, and Progress to have more consistent sizing
  and `size` prop usage.
- Added Prop Patterns docs page to Getting Started

## [0.11.3]

- Adjusted IconButton and Button to have consistent sizing under the hood

## [0.11.2]

- Added `Image` primitive component and docs demo

## [0.11.1]

- Grid now supports an `adaptive` prop for portrait layouts

## [0.11.0]

- Renamed `Drawer` prop `responsive` to `adaptive`

## [0.10.1]

- `AppBar` uses the surface store to offset content and now renders via portal
  above responsive drawers
- Docs demo updated to show scroll behind the AppBar
- Drawer components account for AppBar height when responsive

## [0.10.0]

- `Stack` spacing defaults to 1 and respects `compact` unless explicitly set
- Docs now include a Surface usage explainer

## [0.9.0]

### Added

- `useSurface` hook now accepts an optional state selector and equality function,
  mirroring Zustand’s API for partial subscriptions

### Changed

- `Accordion`, `Chat`, `Drawer`, `Snackbar`, `Table`, and `Typography` components call `useSurface`
  with selectors and shallow equality to avoid unnecessary re-renders `Drawer`’s
  responsive logic uses the selected `Surface` element to handle persistent margins correctly

## [v0.8.7]

### Added

- DateTimePicker component

## [v0.8.6]

### Added

- Shared navigation drawer component for docs

## [v0.8.5]

### Added

- Tree component demonstrating nested navigation (renamed from TreeView)
- Responsive drawer

### Changed

- Tree now accepts a `selected` prop for controlled selection

### Improved

- List variant lines centered on expand boxes and omit root connector
- Tree demo shows a third level with mixed collapsible nodes
- List variant boxes now use the secondary theme color when expanded
- Persistent and responsive drawers now scroll if their content exceeds the viewport

## [v0.8.4]

### Added

- Chat component with OpenAI-style messages and height constraint option

## [v0.8.3]

### Fixed

- Uniform highlight width on Accordion items

### Improved

- Clearer hover contrast on Accordion headers
- Stack rows now vertically center their children

### Added

- Avatar component with Gravatar fallback
- Avatar demo page includes an interactive email form

## [v0.8.2]

### Improved

- Radio button spacing and indicator alignment

## [v0.8.1]

### Improved

- Accordion chevron orientation and animation performance
- Accordion can now constrain height with Surface

### Fixed

- Accordion constrained height now fills the available space within a Surface
- Accordion no longer clamps to its initial height before expansion

## [v0.8.0]

### Improved

- Typography `autoSize` functionality
- Stack default padding / margins
- compact prop for Stack, Box, Panel
- spacing behavior

### Changed

- `Table` now defaults to striped rows and column dividers

### Fixed

- `Surface` updates overflow state when DOM changes
- `Table` constrainHeight measures offset from the surface top to avoid shrinking loops
- `Table` accounts for content below it so controls remain visible

## [v0.7.2]

### Changed

- Main page of docs - Main page spacing styling

## [v0.7.1]

### Fixed

- Spacing units calculations internally. Mobile layouts improved.

### Added

- `compact` prop for `Box`, `Panel`, and `Stack`.

## [v0.7.0]

### Changed

- Replaced spacing size tokens (sm, md, lg, xl) with units (1, 2, 3)

## [v0.6.1]

### Changed

- Replaced @emotion/hash hashing with siphash
- Adjusted CSS-in-JS:
  - Updated the styled helper so each CSS rule’s class name uses a readable label and a siphash value
  - Keyframe and preset class names now rely on the new hash function, including a sanitized prefix for presets

## [v0.6.0]

### Added

- `Keep a Changelog` 1.1.0 rules in `AGENTS.md`
- Initial changelog with historical versions
- Components started:
  - `Snackbar`
  - `Video`

### Fixed

- Acccordion
  - Right clicking accordion headers now toggles them instead of showing the browser menu
  - Long pressing accordion headers on touch devices now toggles them

## [v0.5.2]

### Other

- vibe coded

## [v0.5.1]

### Other

- vibe coded

## [v0.5.0]

### Other

- vibe coded

## [v0.4.2]

### Other

- vibe coded

## [v0.4.1]

### Other

- vibe coded

## [v0.4.0]

### Other

- vibe coded

## [v0.3.3]

### Other

- vibe coded

## [v0.3.2]

### Other

- vibe coded

## [v0.3.1]

### Other

- vibe coded

## [v0.3.0]

### Other

- vibe coded

## [v0.2.5]

### Other

- vibe coded

## [v0.2.4]

### Other

- vibe coded

## [v0.2.3]

### Other

- vibe coded

## [v0.2.2]

### Other

- vibe coded

## [v0.2.1]

### Other

- vibe coded

[0.34.1]: https://github.com/off-court-creations/valet/releases/tag/v0.34.1
[0.34.0]: https://github.com/off-court-creations/valet/releases/tag/v0.34.0
[0.33.7]: https://github.com/off-court-creations/valet/releases/tag/v0.33.7
[0.33.6]: https://github.com/off-court-creations/valet/releases/tag/v0.33.6
[0.33.5]: https://github.com/off-court-creations/valet/releases/tag/v0.33.5
[0.33.4]: https://github.com/off-court-creations/valet/releases/tag/v0.33.4
[0.33.3]: https://github.com/off-court-creations/valet/releases/tag/v0.33.3
[0.33.2]: https://github.com/off-court-creations/valet/releases/tag/v0.33.2
[0.33.1]: https://github.com/off-court-creations/valet/releases/tag/v0.33.1
[0.33.0]: https://github.com/off-court-creations/valet/releases/tag/v0.33.0
[v0.30.1]: https://github.com/off-court-creations/valet/releases/tag/v0.30.1
[v0.30.0]: https://github.com/off-court-creations/valet/releases/tag/v0.30.0
[v0.29.1]: https://github.com/off-court-creations/valet/releases/tag/v0.29.1
[v0.29.0]: https://github.com/off-court-creations/valet/releases/tag/v0.29.0
[v0.28.7]: https://github.com/off-court-creations/valet/releases/tag/v0.28.7
[v0.28.6]: https://github.com/off-court-creations/valet/releases/tag/v0.28.6
[v0.28.5]: https://github.com/off-court-creations/valet/releases/tag/v0.28.5
[v0.28.4]: https://github.com/off-court-creations/valet/releases/tag/v0.28.4
[v0.28.3]: https://github.com/off-court-creations/valet/releases/tag/v0.28.3
[v0.28.2]: https://github.com/off-court-creations/valet/releases/tag/v0.28.2
[v0.28.1]: https://github.com/off-court-creations/valet/releases/tag/v0.28.1
[v0.28.0]: https://github.com/off-court-creations/valet/releases/tag/v0.28.0
[v0.27.0]: https://github.com/off-court-creations/valet/releases/tag/v0.27.0
[v0.26.2]: https://github.com/off-court-creations/valet/releases/tag/v0.26.2
[v0.26.1]: https://github.com/off-court-creations/valet/releases/tag/v0.26.1
[v0.26.0]: https://github.com/off-court-creations/valet/releases/tag/v0.26.0
[v0.25.5]: https://github.com/off-court-creations/valet/releases/tag/v0.25.5
[v0.25.4]: https://github.com/off-court-creations/valet/releases/tag/v0.25.4
[v0.25.3]: https://github.com/off-court-creations/valet/releases/tag/v0.25.3
[v0.25.2]: https://github.com/off-court-creations/valet/releases/tag/v0.25.2
[v0.25.1]: https://github.com/off-court-creations/valet/releases/tag/v0.25.1
[v0.25.0]: https://github.com/off-court-creations/valet/releases/tag/v0.25.0
[v0.24.0]: https://github.com/off-court-creations/valet/releases/tag/v0.24.0
[v0.23.5]: https://github.com/off-court-creations/valet/releases/tag/v0.23.5
[v0.23.4]: https://github.com/off-court-creations/valet/releases/tag/v0.23.4
[v0.23.3]: https://github.com/off-court-creations/valet/releases/tag/v0.23.3
[v0.23.2]: https://github.com/off-court-creations/valet/releases/tag/v0.23.2
[v0.23.1]: https://github.com/off-court-creations/valet/releases/tag/v0.23.1
[v0.23.0]: https://github.com/off-court-creations/valet/releases/tag/v0.23.0
[v0.22.5]: https://github.com/off-court-creations/valet/releases/tag/v0.22.5
[v0.22.4]: https://github.com/off-court-creations/valet/releases/tag/v0.22.4
[v0.22.3]: https://github.com/off-court-creations/valet/releases/tag/v0.22.3
[v0.22.2]: https://github.com/off-court-creations/valet/releases/tag/v0.22.2
[v0.22.1]: https://github.com/off-court-creations/valet/releases/tag/v0.22.1
[v0.22.0]: https://github.com/off-court-creations/valet/releases/tag/v0.22.0
[v0.21.3]: https://github.com/off-court-creations/valet/releases/tag/v0.21.3
[v0.21.2]: https://github.com/off-court-creations/valet/releases/tag/v0.21.2
[v0.21.1]: https://github.com/off-court-creations/valet/releases/tag/v0.21.1
[v0.21.0]: https://github.com/off-court-creations/valet/releases/tag/v0.21.0
[v0.20.1]: https://github.com/off-court-creations/valet/releases/tag/v0.20.1
[v0.20.0]: https://github.com/off-court-creations/valet/releases/tag/v0.20.0
[v0.19.3]: https://github.com/off-court-creations/valet/releases/tag/v0.19.3
[v0.19.2]: https://github.com/off-court-creations/valet/releases/tag/v0.19.2
[v0.19.1]: https://github.com/off-court-creations/valet/releases/tag/v0.19.1
[v0.19.0]: https://github.com/off-court-creations/valet/releases/tag/v0.19.0
[v0.18.3]: https://github.com/off-court-creations/valet/releases/tag/v0.18.3
[v0.18.2]: https://github.com/off-court-creations/valet/releases/tag/v0.18.2
[v0.18.1]: https://github.com/off-court-creations/valet/releases/tag/v0.18.1
[v0.18.0]: https://github.com/off-court-creations/valet/releases/tag/v0.18.0
[v0.17.0]: https://github.com/off-court-creations/valet/releases/tag/v0.17.0
[v0.16.3]: https://github.com/off-court-creations/valet/releases/tag/v0.16.3
[v0.16.2]: https://github.com/off-court-creations/valet/releases/tag/v0.16.2
[v0.16.1]: https://github.com/off-court-creations/valet/releases/tag/v0.16.1
[v0.16.0]: https://github.com/off-court-creations/valet/releases/tag/v0.14.0
[v0.15.1]: https://github.com/off-court-creations/valet/releases/tag/v0.15.1
[v0.15.0]: https://github.com/off-court-creations/valet/releases/tag/v0.15.0
[v0.14.0]: https://github.com/off-court-creations/valet/releases/tag/v0.14.0
[v0.13.0]: https://github.com/off-court-creations/valet/releases/tag/v0.13.0
[v0.12.1]: https://github.com/off-court-creations/valet/releases/tag/v0.12.1
[v0.12.0]: https://github.com/off-court-creations/valet/releases/tag/v0.12.0
[v0.11.3]: https://github.com/off-court-creations/valet/releases/tag/v0.11.3
[v0.11.2]: https://github.com/off-court-creations/valet/releases/tag/v0.11.2
[v0.11.1]: https://github.com/off-court-creations/valet/releases/tag/v0.11.1
[v0.11.0]: https://github.com/off-court-creations/valet/releases/tag/v0.11.0
[v0.10.1]: https://github.com/off-court-creations/valet/releases/tag/v0.10.1
[v0.10.0]: https://github.com/off-court-creations/valet/releases/tag/v0.10.0
[v0.9.0]: https://github.com/off-court-creations/valet/releases/tag/v0.9.0
[v0.8.7]: https://github.com/off-court-creations/valet/releases/tag/v0.8.7
[v0.8.6]: https://github.com/off-court-creations/valet/releases/tag/v0.8.6
[v0.8.5]: https://github.com/off-court-creations/valet/releases/tag/v0.8.5
[v0.8.4]: https://github.com/off-court-creations/valet/releases/tag/v0.8.4
[v0.8.3]: https://github.com/off-court-creations/valet/releases/tag/v0.8.3
[v0.8.2]: https://github.com/off-court-creations/valet/releases/tag/v0.8.2
[v0.8.1]: https://github.com/off-court-creations/valet/releases/tag/v0.8.1
[v0.8.0]: https://github.com/off-court-creations/valet/releases/tag/v0.8.0
[v0.7.1]: https://github.com/off-court-creations/valet/releases/tag/v0.7.1
[v0.7.0]: https://github.com/off-court-creations/valet/releases/tag/v0.7.0
[v0.6.1]: https://github.com/off-court-creations/valet/releases/tag/v0.6.1
[v0.6.0]: https://github.com/off-court-creations/valet/releases/tag/v0.6.0
[v0.5.2]: https://github.com/off-court-creations/valet/releases/tag/v0.5.2
[v0.5.1]: https://github.com/off-court-creations/valet/releases/tag/v0.5.1
[v0.5.0]: https://github.com/off-court-creations/valet/releases/tag/v0.5.0
[v0.4.2]: https://github.com/off-court-creations/valet/releases/tag/v0.4.2
[v0.4.1]: https://github.com/off-court-creations/valet/releases/tag/v0.4.1
[v0.4.0]: https://github.com/off-court-creations/valet/releases/tag/v0.4.0
[v0.3.3]: https://github.com/off-court-creations/valet/releases/tag/v0.3.3
[v0.3.2]: https://github.com/off-court-creations/valet/releases/tag/v0.3.2
[v0.3.1]: https://github.com/off-court-creations/valet/releases/tag/v0.3.1
[v0.3.0]: https://github.com/off-court-creations/valet/releases/tag/v0.3.0
[v0.2.5]: https://github.com/off-court-creations/valet/releases/tag/v0.2.5
[v0.2.4]: https://github.com/off-court-creations/valet/releases/tag/v0.2.4
[v0.2.3]: https://github.com/off-court-creations/valet/releases/tag/v0.2.3
[v0.2.2]: https://github.com/off-court-creations/valet/releases/tag/v0.2.2
[v0.2.1]: https://github.com/off-court-creations/valet/releases/tag/v0.2.1
