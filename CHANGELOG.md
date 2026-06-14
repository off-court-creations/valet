# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

> **1.0 prep (epic branch `feat/valet-1.0`).** These entries accumulate toward the
> 1.0 cut; the `## Unreleased` heading becomes `## [1.0.0]` at release (Wave 4).

### Added

- Docs: [`VERSIONING.md`](./VERSIONING.md) — the post-1.0 stability policy. Defines the public API surface (the barrel; deep imports and generated class names are not API), what patch/minor/major mean, the post-1.0 deprecation lifecycle (alias + dev-warn for ≥1 minor, then removal in the next major), and the `experimental` carve-out.
- Accessibility (WCAG 4.1.2): `Switch`/`Slider`/`Select`/`Iterator` now render the documented `FieldBaseProps.label` (and `helperText`) and wire it as the control's accessible name (`aria-labelledby`, or native `<label htmlFor>` for `Iterator`) — previously the prop was accepted and silently discarded. Each gained a dev-time accessible-name guard.
- Types: `sendChat` now returns a named `ChatCompletion` type (was `Promise<any>`).
- Testing: `src/ssr-render.test.ts` — a renderToString regression gate over the app-shell components (CI runs it post-build).
- CI: PR CI now also runs `check:package` (publint + are-the-types-wrong) and `mcp:check` (corpus freshness).

### Removed

- **BREAKING (deprecation sweep — all 0.x prop aliases removed, pre-1.0 policy `deprecate.ts`/Q12(a)):** every prop alias that was marked "removed at 1.0" is gone, along with `src/system/deprecate.ts` (`deprecateProp`/`resolveDeprecatedProp`) and its tests. The canonical names already existed and are unchanged. Migrations:
  - `Accordion`: `open` → `expanded`, `defaultOpen` → `defaultExpanded`, `onOpenChange` → `onExpandedChange`.
  - `Pagination`: `onChange` → `onPageChange`.
  - `RadioGroup`: `spacing` → `gap`.
  - `Panel`: `normalizeRowHeight` → `normalizeRowHeights`.
  - `Table`: `selectable='single'|'multi'` → `selectionMode='single'|'multiple'`; `rowKey` → `getItemKey`.
  - `List`: `selectable={true}` → `selectionMode='single'`; `getKey` → `getItemKey`.
  - `Switch`: **`onChange` removed (not a rename).** It was a raw `MouseEvent` passthrough — read the boolean from `onValueChange(next, info)` and `info.event` for the DOM event, or attach a native `onClick`.
- **BREAKING (`Typography.bold` removed):** the boolean `bold` prop is gone — use `weight='bold'` (or any `weight` alias / number). The kit and docs are migrated.
- **BREAKING (`Progress` wrapper removed):** the back-compat `Progress` component (and its `variant`/`mode`/`showLabel` props, plus the `ProgressVariant`/`ProgressMode` types) is removed. Use the primitives directly: `ProgressBar` for linear, `ProgressRing` for circular (omit `value` for indeterminate).

### Changed

- **Spacing (density scale tightened + centralized):** the density → `--valet-space` multiplier is now **tight 0.8 / standard 0.9 / comfortable 1.0** (was 0.9 / 1.0 / 1.15) — every tier reads a touch tighter while staying evenly stepped (0.1) and visibly distinct, with `comfortable` sitting at the design unit and the tiers stepping down from there. The mapping is now a single `densityScale()` helper (`src/system/densityScale.ts`) instead of being copy-pasted across `Surface`/`Grid`/`Panel`/`Stack`/`Tabs`. Class hashes for density-bearing components change (internal-only).
- **Spacing (`Grid` equalizes child widths):** a normalizing `Grid` now drives child `--valet-panel-width: 100%` (alongside the existing row-height stretch), so a grid of `Panel` cards is uniform in **both** axes with no per-card `fullWidth`. Standalone `Panel`s keep their content-width default.
- **Spacing (role-aware "beautiful by default" defaults):** `Grid`'s default `gap` and `Panel`'s default `pad` are now **2 spacing units (~16px)**, up from 1 (~8px). A Grid lays out cards/regions and a Panel is a bordered card surface, so their content-layout defaults now match the conventional card-grid gutter / card inset instead of the tight 8px baseline — a card grid looks intentional with **zero** spacing props. Tight layouts opt down with `gap={1}` / `pad={1}` / `pad={0}` / `density='tight'` / `compact`; `Stack`/`Tabs` defaults are unchanged (1). Generated class hashes for default `Grid`/`Panel` change (internal-only). Migration: pass an explicit `gap`/`pad` anywhere you relied on the old 8px default.
- **BREAKING (`Tabs.tabAlign` collapsed):** the `tabAlign` alias is removed; use `alignX` (one concept, one prop).
- **BREAKING (fonts privacy-by-default, Q13/THEMING S7):** `injectRemote` now defaults to **`false`** (was `true` through 0.x). A named Google family with no explicit `injectRemote` is treated as a **local** family — zero network requests. To fetch named families from Google's servers, pass `injectRemote: true` (it then prints the once-per-session dev privacy notice). Self-hosted `CustomFont` entries are unaffected.
- Positioning: **every component is flagged `experimental` for a pre-1.0 verification pass.** Given the breadth of the 1.0 changes (deprecation sweep, accessibility rewiring, SSR guards, type-surface curation, spacing/density retune), each component's `status` is reset to `experimental` and is promoted back to `stable` as it is re-verified before the cut. The `stable` set at 1.0 is whatever has passed review by then; see `VERSIONING.md` and check a component's `status` (docs / MCP corpus) for its current standing.
- Types: the public barrel is curated (no `export *` leaks) — `encrypt`/`decrypt` are no longer public (module-internal); the bare `Variant` is no longer exported (use `TypographyVariant`). The `dx/type-tests` probes are now gated in CI (`typecheck:types`).
- SSR: `AppBar`/`Drawer` no longer crash `renderToString` (portal is mounted-gated; the `Drawer` `HTMLElement` guard); `Accordion` reduced-motion reads `usePrefersReducedMotion` (no hydration class mismatch).
- MCP corpus / tooling: the served corpus now carries **zero** deprecated props. `validate.mjs`'s deprecated-alias gate is inverted to the 1.0 invariant (it fails if any prop ever carries a `deprecated` flag); `DEPRECATED_ALIAS_FLOOR` is now empty. The deprecation-banner/flag code in the MCP server remains but is dormant (no deprecated props on the surface).

## [0.36.0] — 2026-06-13

### Added

- Spacing (`compact` cascade): new `src/system/compactContext.ts` exporting `CompactCtx` and `useCompact(own?) → own ?? inherited`. A container with `compact` now zeros its own layout spacing **and** propagates the flag to every spacing-aware descendant via React context (it crosses portals by tree position, so `Modal`/`Select` menus inherit). `compact={false}` on any descendant opts its subtree back out. Seeded at `<Surface>`, provided by `Box`/`Stack`/`Panel`/`Grid`/`Tabs`/`Modal`/`Accordion`, consumed by `Divider`, and relayed by the field/widget containers (`MetroSelect`/`LLMChat`/`RichChat`/`DateSelector`).
- Spacing (density scales a subtree): `density` on `Stack`/`Panel`/`Grid`/`Tabs` now sets `--valet-space` locally when explicitly provided, so `<Panel density="comfortable">` genuinely loosens its subtree and `density="tight"` tightens it (0.9 / 1.0 / 1.15 × the spacing unit) — mirroring `<Surface>`. Previously `density` on these components was inert apart from the (now removed) compact conflation.

### Changed

- Spacing (**BREAKING**, density value rename): the density tier `'compact'` is renamed to `'tight'` across the `Density` union (`themeStore.ts`) and `SpacingProps.density` (`types.ts`) — now `'tight' | 'standard' | 'comfortable'`. Hard rename, **no alias** (pre-1.0 policy). **Migration:** replace every `density="compact"` / `density: 'compact'` with `'tight'`. This frees the word `compact` for the boolean prop and removes its overlap with the density tier.
- Spacing (**BREAKING**, `compact` semantics): the boolean `compact` is now a **hard zero of layout spacing that cascades**, fully decoupled from the density scale. It zeros container `pad`/`gap`/spacing-margins on the component and all spacing-aware descendants; it no longer shrinks the density scale to 0.9 (that is now `density="tight"`). It deliberately **preserves** control-internal padding, structural geometry (e.g. Tree indentation/connectors), border-radius, glyph sizes, alignment/centering margins, safe-area insets, and `sx`-supplied padding (the explicit author escape hatch). The `compact || density === 'compact'` conflation is removed from `Stack`/`Panel`/`Grid`/`Tabs`/`Surface`.
- Spacing (DateSelector): its small/"compact" visual mode (icon sizes, cell height, single-letter weekday + 3-letter month labels, the block/inline layout switch) now follows `density="tight"` instead of `compact`, so the spacing and visual-scale axes are independent. `compact` on `<DateSelector>` is retained as a cascade relay (no visual effect of its own). **Migration:** use `density="tight"` for the compact-looking calendar.

### Fixed

- `Panel`/`Grid`/`Tabs`: `density` was spread onto the rendered DOM element as an invalid HTML attribute (it was never destructured) — now consumed and dropped.
- `Tabs`/`Modal`/`Accordion`: a `compact = false` destructure default made these components silently opt **out** of an inherited compact, so the cascade from a compact ancestor never reached them; the default is dropped so an absent prop inherits (`undefined`), while an explicit `compact={false}` still opts out.
- `MetroSelect`: the inner `<Stack compact>` was hardcoded, permanently dead-zeroing the public `gap` prop; it now reflects the field's effective compact, so `gap` takes effect when not compact.
- `RichChat`: the outer `<Panel>` misused `compact={portrait}` as an orientation flag immediately before setting an explicit `pad`, silently zeroing the intended bottom padding in portrait; orientation now drives `pad` directly and `compact` is no longer abused.

## [0.35.1] — 2026-06-13

### Fixed

- MCP corpus: prop `type` text no longer leaks an absolute, machine-specific `import("/…/src/types").Name` qualifier (ts-morph prints cross-module types this way) — stripped to the bare type name (e.g. `Space | undefined`), so the served corpus is reproducible across machines. A `validate.mjs` gate now rejects any `import("…")` qualifier in a served type. (The 0.35.0 `valet-mcp` corpus, published from a dev machine, carried such paths in ~10 prop types.)
- `aiKeyStore`: pass `BufferSource` (TypedArray views) to WebCrypto instead of raw `.buffer` ArrayBuffers — Node 20's webcrypto rejects cross-realm ArrayBuffers under jsdom. Behaviour is unchanged in real browsers; this hardens the encrypt/decrypt path and its tests across runtimes.
- `create-valet-app`: the `js` and `hybrid` templates' ESLint configs gained `parserOptions.ecmaFeatures.jsx`, so generated `.jsx` files lint cleanly (they previously failed with "Unexpected token <").

### Changed

- CI: the `core` job builds before testing (dist-dependent suites — `validate_jsx`, bundle-size — need `dist/`) and installs the `valet-mcp`/`create-valet-app` sub-package deps before typecheck; `check-fresh` no longer requires the gitignored `_ts-extract.json` intermediate. Full suite green on Node 20 and 22.

## [0.35.0] — 2026-06-12

### Added

- Testing: vitest two-project harness (node + jsdom selected by `*.dom.test` suffix), 380+ colocated tests — hash vectors, normalize characterization, createFormStore, TZ-parameterized date math, focus-trap keydown matrix, 50+ adversarial svgSafe vectors, a repo-wide bare-nested-selector source gate, StrictMode purity suites.
- CI/release safety: GitHub Actions workflow gating `development` and `main` (Node 20.x/22.x: lint, typecheck, test, build, `mcp:schema:check`, `verify:pack`, `check:engine`); `scripts/verify-pack.mjs` + `prepack: npm run build` make the previously-shipped 4-file empty tarball structurally impossible; release gates `scripts/release/check-changelog.mjs` (this file is now enforced at publish time) and `check-pins.mjs`; `check:engine` Node smoke (import-no-throw in both formats, deterministic class names, keyframes/presets in Node).
- Engine: `src/css/sheet.ts` — lazy, `document`-guarded stylesheet init; non-DOM environments record pending rules and flush them in order if a sheet later exists; `insertRule` failures dev-log diagnostics instead of crashing (behavior note: malformed preset CSS no longer throws from `definePreset`; prod is silent).
- Types (API-TYPES S1): the consumer vocabulary is now importable from the barrel — `Sx`, `Presettable`, `Space`, `SpacingProps`, `FieldBaseProps`, `ChangeInfo`/`OnValueChange`/`OnValueCommit`/`InputPhase`/`InputSource`, `PolymorphicProps`/`PolymorphicRef`/`PolymorphicComponent`/`PropsOf` (all nine were TS2305 before); committed type probes under `dx/type-tests/`.
- Security: `src/helpers/svgSafe.ts` allowlist SVG parser (Icon wiring landed in Phase 1, gated Q6 — see Changed); `src/system/devErrors.ts` (`valetError` + `warnOnce`) with enriched messages at 7 throw sites (component name + fix hint).
- Security (Icon, SECURITY S5, gated Q6(a)): new `dangerouslySetSvg?: string` prop on `<Icon>` — the named escape hatch that reproduces the old raw-`innerHTML` behavior for **trusted** full-SVG markup (the prop name is the warning). Untrusted/AI-generated markup belongs on `svg`, which is now parsed.
- AI runtime (LLMChat, SECURITY S7, gated Q8(a); audit MEDIUM `LLMChat.tsx:23`): new `models?: string[]` prop on `<LLMChat>` overrides the model picker's options, plus a new exported `DEFAULT_MODELS` catalog. Replaces the hardcoded gpt-3.5-era list (`gpt-4o`/`gpt-4-turbo`/`gpt-3.5-turbo` + a single dated `claude-sonnet-4-20250514`) with current sensible defaults (OpenAI `gpt-4o`/`gpt-4o-mini`/`gpt-4.1`; Anthropic `claude-opus-4-8`/`claude-sonnet-4-6`/`claude-haiku-4-5`).
- Resilience (ruling Q18(a), GOVERNANCE S10): new opt-in `<ValetErrorBoundary>` export. valet's policy stays hard, enriched throws (component name + fix hint + docs link) as the failure signal — agents need crisp signals — so components outside a `<Surface>` still throw rather than silently degrade. This boundary is the **opt-in** catcher you wrap around any independently-recoverable subtree to render a fallback instead of white-screening the host. It is deliberately self-contained — **no `styled()`/theme machinery, no `useSurface`, no valet context** — so it survives the very failures that originate above or outside the surface tree; its built-in fallback is a plain `role='alert'` panel (inline-styled, zero theme vars) with a retry wired to `reset()`. Accepts a `fallback` (static node or `({ error, reset }) => ReactNode`) and an `onError(error, info)` that fires once per caught failure from `componentDidCatch`. Like every React error boundary it only catches render/lifecycle/constructor throws — not event handlers, async, or SSR.

### Changed

- Engine (SSR guard, audit Tier-1 #1): importing valet in Node/SSR no longer crashes — the module-scope `document.createElement` is gone; `renderToString` emits deterministic hash-derived classes. `globalSheet` widened to `CSSStyleSheet | undefined`.
- Engine: falsy interpolations (`false`/`null`/`undefined`) are dropped at template compile (`src/css/compile.ts`) — the `falsedisplay:flex` bug class is dead; `0`/`''` still render.
- Engine (behavior, ruling R5): `definePreset` redefinition now **replaces** the prior rule with a one-time dev warning (was: silent stale rule across HMR); theme updates re-insert full rule text so nested rules survive.
- Engine: bare nested selectors gained explicit `& ` prefixes (RadioGroup, Checkbox, Table, Video, Pagination) — lowers the floor toward Chrome 112/Safari 16.5; **generated class hashes changed** for the touched components (internal names only).
- Engine (behavior, ENGINE S7 / ruling R4, §9 veto register): `normalizeCSS` is now a quote/`url()`-aware scanner — whitespace inside quoted strings and `url(…)` is byte-preserved (no more corrupted `content` strings, data URIs, or multi-space font names), `;` runs before `}` are fully stripped (`;;}` included), and normalization is idempotent; **every generated class hash changes this release** (class names were never a contract).
- Theme (behavioral fix, THEMING S1): `setMode` recomposes the theme from base + the caller's accumulated overlay instead of resetting to factory palettes — brand overrides now survive mode toggles; new `resetTheme()`; dark palette `colorNames` data errors and by-reference palette sharing fixed.
- Fonts (**BREAKING** default, ruling Q14(a), THEMING S9): `useInitialTheme`/`createInitialTheme` now load **only the fonts the caller explicitly names** — the `patch.fonts.*` overrides plus the `extras` array. The three built-in family defaults (`Kumbh Sans`, `Inter`, `JetBrains Mono`) are **no longer auto-loaded**, so a zero-config `useInitialTheme({})` injects no font links, starts no font load, and makes **zero network requests** (the truly unconditional GDPR path — it removes the request site entirely, where `injectRemote:false` only reinterprets named Google families as local). Those default families still appear as the theme's `fontFamily` values and fall back to whatever face the platform already has installed; only the _webfont download_ is gone. **Migration:** zero-config third-party apps will visibly change fonts (the built-in families render in a system/installed fallback). To keep loading them, name them — `useInitialTheme({ fonts: { heading: 'Kumbh Sans', body: 'Inter', mono: 'JetBrains Mono', button: 'Kumbh Sans' } }, ['Kumbh Sans', 'Inter', 'JetBrains Mono'])` — or self-host via `extras`; the generated CVA templates and docs app already pass their fonts explicitly and are unaffected.
- Packaging (package.json truth pass): `sideEffects: ["*.css"]` (the previous `false` was provably wrong), explicit per-format `types` conditions, `./package.json` subpath export, unused `marked-highlight` dependency removed, root `engines` removed (CLIs keep theirs).
- Packaging (**BREAKING** for `require()` consumers, ruling Q1(a), PACKAGING S4): the package is now **ESM-only with a per-module dist** — tsup multi-entry + code splitting emits `dist/**/*.mjs` so bundlers tree-shake at module granularity (Button-only consumer ≈136KB→19.7KB raw / 40KB→7.8KB gzip, measured), types are one bundled `dist/index.d.mts`, the CJS build (`dist/index.js`/`index.d.ts`) is gone, and the barrel `dist/index.mjs` stays the only public JS entry (no deep-import subpaths).
- Engine (behavior, ENGINE S11, §9 veto register): preset rules now insert with **doubled-specificity selectors** (`.zp-x.zp-x`, 0-2-0) so a preset can finally override equal-specificity styled() base rules (0-1-0) regardless of insertion order — pre-fix, presets registered at app init always lost the cascade tie to component rules inserted at first render (audit `stylePresets.ts:54`). The DOM class attribute is unchanged (`preset()` still returns one class); only the rule text doubles. Chosen over `@layer`: layering valet's rules would demote them below all unlayered consumer CSS and break the in-place themed rule swap. Consumer note: single-class consumer CSS that previously out-ordered a preset rule now loses to it — use `sx`/inline style (always wins) or a more specific selector for one-off overrides.
- Engine (**BREAKING**, ENGINE S11): `presetHas` is removed from the barrel — it existed solely as a component-side workaround for the preset specificity tie, which is fixed at the cascade level. Panel (its only consumer) now renders its default filled background unconditionally; a background-bearing preset overrides it via specificity. Panel's nested `&::-webkit-scrollbar` rule moved to the end of its template (declarations-before-nested-rules form; Panel's class hash changed — internal name only).
- Engine (**BREAKING**, ruling Q2(a), ENGINE S10): `styleCache` and `globalSheet` are no longer exported — the engine's mutable singletons are private. All singleton state (style cache, injected-rule set, render queue, raw-css memo, pending rules, sheet ref) now lives in a process-wide registry at `globalThis[Symbol.for('@archway/valet/style-registry/v1')]`, so a bundler-duplicated second copy of the engine shares one cache and one `<style>` sheet instead of double-injecting; dev builds now `console.error` on a hash collision (the same class name minted for two different css bodies).
- Packaging (behavior, ruling Q22(a)): syntax highlighting now runs on a curated `highlight.js/lib/core` registry (`src/system/highlight.ts`) instead of the full ~190-language build (≈306KB gzip) — registered grammars: typescript, javascript, xml/html, css, json, bash, shell, python, yaml, markdown, diff, sql, plaintext (+ their aliases). Fences in unregistered languages render as plaintext (no crash); new public `registerHighlightLanguage(name, languageFn)` escape hatch restores any grammar à la carte.
- Security (**BREAKING** for full-SVG `svg` strings, ruling Q6(a), SECURITY S5; audit HIGH `Icon.tsx:107`): `<Icon>`'s `svg` string prop is no longer a `dangerouslySetInnerHTML` XSS sink. Strings now flow through the `svgSafe` allowlist parser and render as real React `<svg>`/`<path>` elements — accepted forms are bare path `d`-data or `<path>`-only markup (optionally inside one `<svg>` wrapper); anything else (full-SVG documents with `<g>`/`<defs>`/`<style>`/`<image>`, event-handler attributes, entities, scripts, comments, …) renders nothing and dev-warns. This makes untrusted/model-generated icon markup safe. **Migration:** trusted full-SVG markup you control moves to the new `dangerouslySetSvg` prop (verbatim innerHTML, same as before) or a `ReactElement`; the one docs demo (mygymlogo) migrated in-slice.
- Performance: Surface no longer re-renders the app on every scroll/mount — shallow store selector, measure bail-when-unchanged, **document scroll listener removed** (verified unconsumed); `surfaceStore.registerChild` drops the sync `getBoundingClientRect` + per-element Map clone and microtask-batches commits (n mounts → 1 notification).
- Performance (behavior, ruling Q9(a), PERF S9): per-element size tracking is now **opt-in** via the `$trackSize` transient prop. Previously every `styled()` element registered with the nearest `<Surface>` store on mount (a ResizeObserver observe + store entry per element), even though the `--valet-el-width`/`--valet-el-height` vars that registration was meant to feed were never set on the initial mount and nothing in the library consumed them — pure observer/store churn proportional to the styled-element count. A styled element now registers, and exposes `--valet-el-width`/`--valet-el-height` (updated via ResizeObserver), **only when passed `$trackSize`**; the default path does no registration. First-party widgets that need their own metrics (AppBar, Table, Accordion, Snackbar, LLMChat, RichChat) register their root explicitly via `useSurface` and are unaffected. **Migration:** if you read `--valet-el-*` off a plain styled element, add `$trackSize` to that element (no `--valet-el-*` value was actually being set before this release, so this fixes the vars as much as it gates them).
- Performance (ENGINE S8): the styled render path memoizes raw css → class name in a bounded LRU (`src/css/lru.ts`, cap 4096) so repeat strings skip normalize+hash, plus a per-component-instance last-raw short-circuit so re-renders with unchanged css skip even the LRU (warm repeat-string cost 10.3µs → 7.4µs, fresh-instance fn-interpolation overhead 7.1µs → 5.7µs, same-instance re-render 84.6µs → 80.5µs, cold path unchanged — `npm run check:bench`); only the memo is bounded — injected/pending rule bookkeeping is never evicted (rules stay immortal). New `scripts/checks/engine-bench.mjs` reporting tool (`check:bench`, not a gate).
- Types (type-level breaking, decision-free P0, API-TYPES S3): Button/IconButton polymorphism is sound — `<Button as='a' disabled type='submit'>` no longer compiles; runtime behavior identical.
- Types (documented-but-broken behavior now real, API-TYPES S2): Box/Typography merge caller `style` with `sx` (caller `style` loses to `sx`) instead of silently clobbering one with the other.
- Types (behavior, API-TYPES S8): uniform `style`/`sx` precedence — caller `style` now loses to `sx` everywhere both are accepted. Tooltip, SpeedDial and Drawer previously merged `style` **after** `sx` (so a caller `style` could override `sx`); they now match Box/Typography/Button (caller `style` < component-owned vars < `sx`). Migration: if you relied on `style` beating `sx` on those three, move the winning value into `sx`.
- Types (internal refactor + AppBar bug fix, API-TYPES S13): the duplicated intent CSS-variable computation in Button/IconButton (a ~152-line verbatim dup) and the incompatible re-implementation in AppBar/Chip now route through one shared `src/system/intentVars.ts` helper (`computeIntentVars`/`makeMix`). Button/IconButton/Chip output is byte-identical (characterized in tests). **Fix:** AppBar's hover/active/disabled intent vars were built by hex-string concatenation (`base + 'F0'`), which produced **invalid CSS** for any non-hex theme color (`rgb()`/`hsl()`/named); the shared `makeMix` parses every common color format and always returns a valid `#rrggbb`.
- Types (rename with deprecation aliases, ruling Q12(a), API-TYPES S9): a new deprecation shim — `src/system/deprecate.ts` (`deprecateProp`/`resolveDeprecatedProp`, built on `devErrors`' `warnOnce`, ruling R30) — carries the 0.35.0 prop renames as **additive aliases** that keep working through 0.x and are removed at **1.0**. `<Accordion>`'s control props are renamed: `open` → `expanded`, `defaultOpen` → `defaultExpanded`, `onOpenChange` → `onExpandedChange`. The old names still work but dev-warn **once each** via the shared `warnOnce` core; when both a canonical and its deprecated alias are supplied, the **canonical name wins** and the alias still warns. The `@deprecated` JSDoc tags on the old props make IDEs flag them. The `open={0}` controlled-vs-uncontrolled falsiness fix (FF S4) is preserved on the resolved value (`expanded !== undefined`). **Migration:** rename `open`/`defaultOpen`/`onOpenChange` to `expanded`/`defaultExpanded`/`onExpandedChange` on every `<Accordion>`.
- Types (onChange normalization, ruling Q12(a), API-TYPES S10): two more `deprecate.ts`-carried changes that align the value-callback vocabulary, both warning **once** via the shared `warnOnce` core.
  - **`Pagination` `onChange` → `onPageChange` (rename with deprecation alias)** — the page-change callback is renamed to the explicit `onPageChange`. `onChange` keeps working through 0.x as an additive alias resolved via `resolveDeprecatedProp`; `onPageChange` **wins** when both are supplied; the old name dev-warns once and carries an `@deprecated` JSDoc tag. **Migration:** rename `onChange` → `onPageChange` on `<Pagination>`.
  - **`Switch` `onChange` → `onValueChange` (deprecation, not a rename)** — `Switch`'s `onChange` is the **raw DOM passthrough** (a `MouseEvent`), distinct in shape from the canonical `onValueChange` (which carries the boolean value + a typed `ChangeInfo` payload). It is deprecated in favour of `onValueChange` and dev-warns once on presence (via `deprecateProp`), but **still fires** — it is not mutually exclusive with `onValueChange`, so both can be supplied and both run. The `@deprecated` JSDoc tag makes IDEs flag it. **Migration:** move toggle handling to `onValueChange`; reach for the raw event only when you specifically need the DOM `MouseEvent`.
- Types (token paper cuts, API-TYPES S12): a sweep of small prop-type corrections and two more `deprecate.ts`-carried renames.
  - **Shared `Intent` union** — the seven-token semantic-colour union (`'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | (string & {})`) was declared **verbatim five times** (Button, IconButton, Chip, Panel, AppBar) — a copy-paste that drifts on edit. It now lives once in `src/types.ts` as `Intent`; all five components alias it. No prop-type change (each `intent?` prop resolves to the same union); the public surface is reachable today through any intent-driven component's `intent` prop (e.g. `PanelProps['intent']`).
  - **`Space` retypes** — `Modal` `pad` and `MetroSelect` `gap` were hand-typed `number | string`; both now reference the canonical `Space` alias (identical type, single source). Runtime unchanged.
  - **`Video` width/height widening** — `width`/`height` were `string`-only; both widen to `Space` (`number | string`). A bare number is now treated as a CSS pixel length (`640` → `640px`); strings pass through unchanged. Purely additive — no existing call breaks.
  - **`RadioGroup` `spacing` → `gap` (rename with deprecation alias, ruling Q12(a))** — the inter-option gap prop is renamed to `gap` (aligning with the shared `SpacingProps` vocabulary). `spacing` keeps working through 0.x as an additive alias that dev-warns once; `gap` wins when both are supplied. **Migration:** rename `spacing` → `gap` on `<RadioGroup>`.
  - **`Panel` `normalizeRowHeight` → `normalizeRowHeights` (rename with deprecation alias, ruling Q12(a))** — the per-Panel row-height opt-out is renamed to the canonical plural `normalizeRowHeights` (matching Grid's `normalizeRowHeights`). The singular keeps working through 0.x as an additive alias that dev-warns once; the plural wins when both are supplied; default stays `true` (normalize). **Migration:** rename `normalizeRowHeight` → `normalizeRowHeights` on `<Panel>`.
- Types (selection unification, ruling Q11(a)/R12, API-TYPES S11): a single keyed selection vocabulary — `SelectionProps<K>` in `src/types.ts` (exported from the barrel) — now spans the collection components so the same name means the same thing everywhere. `K` is each component's **selection unit**: `selectionMode` (`'none' | 'single' | 'multiple'`), keyed `selected`/`defaultSelected` arrays, `onSelectionChange(selected: K[])`, and a cross-component `getItemKey` (`keyof K | ((item, index) => key)`). Each component carries its pre-0.35 names as additive deprecation aliases (via `deprecate.ts`) that keep working through 0.x, dev-warn **once each**, and are removed at **1.0**; the canonical name **wins** when both are supplied. The keyed Table internals (PERF S8) are unchanged — this is alias wiring + the unified vocabulary only.
  - **`Table` (`K = T`, the row type)** — `selectable` (`'single' | 'multi'`) → `selectionMode` (`'none' | 'single' | 'multiple'`, where `'multi'` ≡ `'multiple'`); `rowKey` → `getItemKey` (identical `keyof T | fn` shape). `onSelectionChange` already emitted the selected **rows** and keeps doing so. **Migration:** `selectable='multi'` → `selectionMode='multiple'`, `rowKey=…` → `getItemKey=…`.
  - **`List` (`K = T`, single-by-reference)** — the boolean `selectable` → `selectionMode` (`'none' | 'single'`; `selectable` ≡ `selectionMode='single'`); `getKey` → `getItemKey`. List keeps its single-reference `selected`/`onSelectionChange(item, index)` model. **Migration:** `selectable` → `selectionMode='single'`, `getKey=…` → `getItemKey=…`.
  - **`Tree` (`K = string`, node ids)** — adopts `selectionMode` (`'none' | 'single'`; default `'single'` preserves today's behavior, `'none'` disables selection writes — rows still expand/collapse and navigate). Expansion already spoke the canonical `expanded`/`defaultExpanded`/`onExpandedChange` trio (shared with Accordion). No deprecated alias — Tree had no pre-0.35 selection flag to rename.
- Overlay (z-order normalization, ruling Q3(a), OVERLAY S7): every overlaying layer now stacks on one TS-defined scale in `src/system/zIndex.ts` (`VALET_ZINDEX` + the `zVar(layer)` helper emitting `var(--valet-zindex-<layer>, <fallback>)`), replacing the ad-hoc literals that let the AppBar cover modals and left Snackbar/Tooltip below them. A repo-scan test rejects any literal `z-index ≥ 1000` outside `zIndex.ts`. Hosts can re-order layers by setting the `--valet-zindex-*` custom properties. Old → new per component:

  | Component                      | Layer           | Old z-index            | New z-index            |
  | ------------------------------ | --------------- | ---------------------- | ---------------------- |
  | SpeedDial (FAB container)      | `fab`           | _(none)_               | 1050                   |
  | AppBar                         | `appbar`        | 10000                  | 1100                   |
  | Drawer collapsed-toggle button | `appbar`        | 9999                   | 1100                   |
  | Modal backdrop                 | `modalBackdrop` | 1390                   | 1390                   |
  | Modal dialog                   | `modal`         | 1400                   | 1400                   |
  | Drawer backdrop                | `modalBackdrop` | 1390                   | 1390                   |
  | Drawer panel                   | `modal`         | 1400 (persistent 1399) | 1400 (persistent 1399) |
  | LoadingBackdrop                | `modal`         | 1400                   | 1400                   |
  | Select dropdown                | `dropdown`      | 1450                   | 1450                   |
  | Snackbar                       | `snackbar`      | 1000                   | 1500                   |
  | Tooltip                        | `tooltip`       | 1200                   | 1600                   |

- MCP corpus honesty: all 56 placeholder summaries replaced with real header-comment summaries; glossary populated (0 → 13 entries); `docsUrls` derived from the real docs route table; KeyModal relocated to `widgets/` (public import path unchanged) and now visible to MCP; required-prop detection fixed (TextField `name`) and the polymorphic `as` prop extracted; `_ts-extract.json` regenerated fresh instead of mirroring a stale copy; valet-mcp resolves its bundled `mcp-data` from the true package root (selfcheck green, `dataSource: "bundled"`).
- `@archway/valet-mcp` upgrade (the server package, versioned in lockstep with the library at `0.35.0`): the MCP stops returning stale lies and gains a closed correctness loop. Changes:
  - **Residual-lying fix + content gate.** A JSDoc `{@link}` in a prop's comment made `getComment()` return `(string | JSDocLink)[]`; the extractor called string methods on that array, so descriptions serialized as `[object Object]` and a throw in the same `try` (a bare `catch {}`) abandoned `@deprecated` detection for that component. A single `commentText()` normalizer flattens the link parts at every comment read, recovering the corrupted descriptions and the lost deprecation flags; deprecation truth is additionally derived from the `resolveDeprecatedProp`/`deprecateProp` **call sites** (a function-argument tuple that cannot array-coerce), not just JSDoc. The `mcp:schema:check` gate now asserts content correctness, not just rebuild-consistency: it **rejects** any prop description containing `[object Object]`, rejects `type:'unknown'` for a public prop unless allow-listed, and asserts every known deprecated alias carries its `deprecated` flag — so this class of stale lie can no longer pass.
  - **`valet__validate_jsx` (new tool, the headline).** Type-checks a valet JSX/TSX snippet against the **shipped** `@archway/valet` types (resolved from the installed package's `.d.mts`, with a repo `dist`/`src` fallback for the in-workspace run) and returns structured diagnostics — `{ line, col, code, message, severity, deprecated }` per finding plus `errorCount`/`warningCount`/`deprecatedCount`/`importedTags`/`valetSource`/`elapsedMs`. It runs a real in-process TypeScript LanguageService over one virtual TSX module (nothing written to disk), so it catches invented props, the wrong member of a literal union, and still-valid-but-deprecated aliases (TS6385 suggestions) — none of which the corpus can express. `ok=false` reports a snippet with problems and is **not** a tool error; `isError` is reserved for the tool itself failing to run (e.g. valet types unresolvable). Annotated `readOnlyHint`/`idempotentHint`/`openWorldHint:false`. Resolution caveat: it requires `@archway/valet` present, declared as an **optionalDependency** at the matching `^0.35.0` range — available in-repo today and on any install once `0.35.0` is published.
  - **Structured output + `outputSchema`.** `get_component`, `search_props`, and `list_components` now return `structuredContent` validated against a Zod `outputSchema` (built from the corpus shape) alongside the text content.
  - **Deprecation-aware responses.** `get_component` surfaces deprecation from the corpus flags: each deprecated prop carries a flat `deprecation` view (`{ deprecated, replacement?, reason? }`), the doc grows a top-level `deprecatedProps` rollup, and the text content leads with a human-readable "DEPRECATED PROPS" banner so the warning is impossible to miss.
  - **`isError` on genuine failures.** A not-found `get_component` (and peers) now returns `isError:true` with a directive message instead of a success-shaped empty payload.
  - **SDK/zod currency.** `@modelcontextprotocol/sdk` tilde-pinned to `~1.29.0` (reproducible, no caret float) on a single resolved `zod` `^3.25.76`; server builds and `selfcheck` green.
  - **`check_version_parity` cwd fix.** The package root is resolved from `import.meta.url`/the resolved valet module instead of `process.cwd()`, so parity is correct regardless of where the server is launched from.
  - Net tool surface: **15 tools** (the 14 introspection tools plus `validate_jsx`).
- Security (**BREAKING** default, ruling Q7(a), SECURITY S6; audit MEDIUM `Avatar.tsx:104`): `<Avatar>` no longer makes a third-party Gravatar request by default. A src-less avatar previously hashed `email` (or `''`) and fetched `gravatar.com/avatar/{md5}`, disclosing a reversible email hash plus the viewer's IP/UA to Automattic with no opt-in — and it did so even when `email` was undefined (hashing `''`). Gravatar is now gated behind a new `gravatar?: boolean` prop (default `false`); src-less avatars render the offline initials/placeholder fallback and make **no network request**. New `src/helpers/gravatar.ts` (`gravatarUrl`/`gravatarHash`/`canonicalizeEmail`) returns `undefined` for an empty/whitespace email, so even opted-in avatars never hash `''`. **Migration:** add `gravatar` to any `<Avatar email=… />` that should still load a Gravatar; the bundled `LLMChat`/`RichChat` avatars pass an explicit `src` and are unaffected.
- Security posture docs (SECURITY S7, gated Q8(a)): `src/system/aiKeyStore.ts` now carries a loud threat-model header — the key store, `sendChat`, `useAIKey`, KeyModal, and LLMChat are a **dev tool** for browser-direct LLM prototyping, not secret management (keys are reachable by any script on the page and sent straight to the provider; at-rest encryption is opt-in and defends only against casual storage inspection, never a hostile runtime). `KeyModal` gained a matching header comment plus a visible in-modal posture note; `LLMChat`'s header now documents honestly that it is a **presentational shell** that never calls `sendChat`. `LLMChat.meta.json` carries the same guidance for MCP consumers.
- Dependencies (**BREAKING** install semantics, ruling Q21(a), PACKAGING S8): `zustand` moved out of `dependencies` and is now a **peer dependency** (`^4.5.7 || ^5.0.0`, declared non-optional via `peerDependenciesMeta`); it is also a `devDependency` so valet's own dev/test/build runs against v4. **Why:** as a regular `^4`-only dependency, apps already on zustand v5 silently shipped two copies (two store registries, split theme/surface state). A non-optional peer lets the consumer's single install (v4 **or** v5) satisfy valet. **Migration:** consumers that did not already depend on zustand directly must add `zustand` (`^4.5.7 || ^5.0.0`) to their own `dependencies`; npm 7+ no longer auto-installs peers it cannot find, so a missing peer surfaces as an install warning (and, for stricter package managers, a resolution error) rather than a silent duplicate. valet's public API does not require any zustand import from consumers — the peer exists so the engine's internal stores deduplicate against the app's copy. **v5 compatibility:** verified — valet only touches APIs unchanged across the v4→v5 boundary: `createWithEqualityFn` (`zustand/traditional`), `shallow` (`zustand/shallow`), `persist`/`createJSONStorage`/`StateStorage` (`zustand/middleware`), and the `StoreApi`/`UseBoundStore` types (`zustand`) all exist with identical signatures in v5; valet uses neither the removed default `equalityFn` of the bare `create` (it is on `zustand/traditional`, which v5 keeps) nor any of the v4 deep-import paths (`zustand/context`, default `shallow` from the root) that v5 dropped.
- Dependencies (dev-chain CVEs, PACKAGING S8): `npm audit fix` cleared all 9 reported dev-chain advisories (6 high incl. rollup arbitrary-file-write path traversal `GHSA-mw96-cpmx-2vgc` and the `@babel/plugin-transform-modules-systemjs` issue, 3 moderate) — all transitive, all resolved without a breaking-major bump (`npm audit` → 0 vulnerabilities). No runtime dependency changed; the lockfile-only updates affect the toolchain that builds the published artifacts.
- A11y/RTL (A11Y S11, §9 a11y veto register — RTL Phase A; ships unflagged, **LTR pixel-identical**): the mechanical subset of physical CSS across `src/components/**` migrated to logical properties — `margin-left`/`margin-right` → `margin-inline-start`/`-end`, `padding-left`/`-right` → `padding-inline-start`/`-end` (symmetric pairs collapsed to `padding-inline`), `border-left`/`-right` → `border-inline-start`/`-end`, `text-align: left`/`right` → `start`/`end`, and symmetric/edge `left`/`right` positioning → `inset-inline[-start/-end]`. Touched: Box/Stack/Panel/AppBar anchoring margins, Modal/Tabs padding, Accordion/Table `text-align`, Table column dividers + sort-icon gap, the whole Tree indentation/connector axis, LLMChat/RichChat sender-relative bubble padding, List/Table/Tabs underline-and-indicator insets, Snackbar/SpeedDial corner anchors, the Progress determinate fill, and the Dropzone remove-button badge. In `dir: ltr` every logical property resolves to the exact same box, so LTR rendering is byte-identical; the payoff is correct mirroring once `dir: rtl` lands (A11Y S12). Genuinely physical declarations — Drawer slide/anchor transforms (driven by the physical `anchor` prop), Pagination/Tabs/Slider/Switch measured-pixel and thumb-slide math, Tooltip arrow placement, Select/Tooltip `getBoundingClientRect` portal anchoring, Modal viewport centering, and the Progress indeterminate sweep keyframes — are kept physical and marked `/* rtl: physical-by-design */` (full interactive RTL: drag math, animated underline, sweep mirroring is a logged deferral). New source-scan gate `scripts/checks/rtl-physical.mjs` (`check:rtl`) lexes every `styled()`/`keyframes()` template under `src/components` + `src/css` and **fails on any unannotated physical property** (mirrors the ENGINE S3 nested-selector gate). Class hashes changed for every touched component — already covered by this release's blanket "every generated class hash changes" note above (internal names only; never a contract).
- A11y/RTL (A11Y S12, §9 a11y veto register — RTL Phase A direction plumbing; **additive**, **LTR pixel-identical**): writing direction now flows from the locale into the DOM and into Drawer placement. `Surface` stamps `dir="ltr"|"rtl"` (from `useValetLocale().dir`) on its single root element, so the logical properties migrated in S11 finally resolve RTL for the whole subtree; SSR-safe (React context only, no `document`/`window` access — identical server and client output) and overridable by a caller-supplied `dir` prop on a specific `Surface`. `Drawer` gains additive **logical anchors** `anchor='start'`/`anchor='end'` via a pure `resolveAnchor(anchor, dir)` helper (`src/components/layout/resolveAnchor.ts`): `start` resolves to the leading edge, `end` to the trailing edge (LTR: start=left/end=right; RTL: start=right/end=left). The existing physical `'left'`/`'right'`/`'top'`/`'bottom'` values are **unchanged and direction-invariant** — an explicit `anchor='left'` Drawer never flips under RTL. Snackbar/SpeedDial already pin with `inset-inline-end` (S11), so they sit at the trailing corner automatically. New honest **RTL Status** docs page (`/rtl-status`) documents exactly what works (dir plumbing, logical properties, start/end anchors) and what does **not** yet (interactive drag math, animated-underline direction, full visual mirroring — all logged deferrals). Default behavior is unchanged for every existing app: no provider ⇒ `dir="ltr"`, no anchor change.

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
- A11y (reduced motion, A11Y S5, §9 a11y veto register — ships unflagged): every infinite/scroll-driven animation now honors `prefers-reduced-motion: reduce` and degrades to a static, still-visible state. `Progress` indeterminate bar + ring stop animating (the ring shows a fixed arc, the bar a centered band); `LLMChat`/`RichChat` typing dots hold at full opacity; `SpeedDial` slide/rotate and `Snackbar` enter/exit transitions are suppressed (open/close and the auto-hide timer are unchanged); `Parallax` layers collapse their scroll offset to zero (no relative movement). Internal `usePrefersReducedMotion` hook for the inline-JS sites; a new repo-wide source gate (`src/system/reducedMotion.test.ts`) fails CI on any unguarded infinite animation.

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
