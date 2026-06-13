# Valet Repository Analysis — Exhaustive Multi-Agent Audit (2026-06-10)

## 1. Executive summary

Valet (@archway/valet 0.34.1) is a 19k-LOC, AI-first React component library published to npm with **zero tests, zero CI, and no prepublish build guard** — `npm pack` today would ship a 4-file tarball containing no code at all (package.json:37, .github/). The library cannot even be imported outside a browser: `src/css/createStyled.ts:27` touches `document` at module scope, crashing SSR, RSC, vitest, and any Node script, which makes the zero-test status self-reinforcing. Several user-facing bugs are runtime-proven and shipped: the shared focus trap kills mid-dialog Tab navigation in every Modal (src/system/overlay.ts:169), DateSelector commits the wrong calendar day for every user east of UTC (src/components/fields/DateSelector.tsx:255), and Slider arrow keys are a complete no-op for ranges under ~50 (src/components/fields/Slider.tsx:404). The bundle story is the worst measured dimension: a single-file dist with a false `"sideEffects": false` flag means importing one Button drags in the entire kit plus the full ~190-language highlight.js build (306KB gzip — 73% of total weight). The AI-first pitch is half real: the MCP server and pipeline work, but the "Web Action Graph" is marketed vaporware, all 56 component summaries are placeholders, the glossary ships empty, and `actions` is `[]` for every component. The brightest spot is security of untrusted-content paths (Markdown, code highlighting) — genuinely solid — though the Icon `svg` prop is an unsanitized XSS sink (src/components/primitives/Icon.tsx:107). The project is effectively solo (1,110 of 1,118 commits), dormant ~6 months, with 6 unreleased fix commits stranded on `development`; the highest-leverage moves are a 3-line document guard, a one-branch focus-trap fix, a prepublish hook, and a minimal CI + vitest harness — all achievable in days.

## 2. Architecture overview

**CSS engine.** ~190 lines in `src/css/createStyled.ts`. At module import it creates one `<style>` element and keeps its `CSSStyleSheet` as `globalSheet`. `styled(tag)` returns a template-literal factory producing a forwardRef component. On every render the component concatenates the template, invokes function interpolations with the full props object, normalizes whitespace, and looks the string up in a `Map<normalizedCSS, className>`. On miss it computes `z-<tag>-<hash>` (seeded 64-bit FNV-1a, `src/css/hash.ts`) and calls `insertRule` — during render, with no try/catch and no deletion path ever. Nested `&:hover`/`@media` rely on native CSS Nesting. `$`-prefixed props are stripped before the DOM; `as` enables polymorphism; a per-element layout effect registers every styled element with the surface store.

**State & theming.** Plain zustand stores. `src/system/themeStore.ts` holds mode/density plus a Theme whose spacing/radius helpers emit CSS-var `calc()` strings, so tokens resolve in the DOM. Actual values come from ~15 `--valet-*` custom properties written inline by `src/components/layout/Surface.tsx` — the non-nestable screen root that owns a per-instance surface store (width/height/breakpoint plus a child-metrics registry fed by a shared ResizeObserver). Portals escape that subtree, so `src/system/inheritSurfaceFontVars.ts` snapshots computed vars onto portal roots. Overlays (Modal/Drawer/Tooltip) coordinate through a module-level stack in `src/system/overlay.ts` (Escape, focus trap, inert background).

**Components.** One recipe everywhere: `styled('tag')` + transient props, `useTheme()`, a `preset` class from `src/css/stylePresets`, `sx` as raw inline style, a `data-valet-component` attribute for the MCP pipeline. Forms are a thin zustand layer (`createFormStore`: values/setField/reset — no validation/errors/touched); every field computes "controlled" from prop presence OR form presence and fires a canonical onChange/onValueChange/onValueCommit trio with `ChangeInfo` metadata from `src/system/events.ts`.

**MCP pipeline.** `npm run mcp:build` composes three extractors — ts-morph over component sources (authoritative), babel over docs pages (enrichment), and 45 hand-authored `.meta.json` sidecars — into `mcp-data/` (56 component docs, index, synonyms, glossary), mirrored into `packages/valet-mcp/mcp-data` and again into its `dist/mcp-data` at prepublish. The MCP server exposes 14 tools.

**Distribution.** Four independent npm projects, no workspaces: the library, valet-mcp, create-valet-app (a ~1,400-line single-file CLI that scaffolds templates, globally installs the MCP server, and edits `~/.codex/config.toml`), and the docs Vite SPA. Release is entirely manual per `dx/PUBLISH_ORDER.md`; the only automation is an AWS Amplify docs deploy.

## 3. Health scorecard

| Dimension | Score /10 | Verdict |
|---|---|---|
| testing-quality | 1.5 | Zero tests, zero CI, zero gates across all four published packages — near worst-case. |
| i18n/RTL/localization (gap probe) | 2 | Hardcoded English in ~12 components, en-US-only DateSelector, no RTL awareness anywhere. |
| performance | 2.5 | Single-bundle dist + false sideEffects flag + full highlight.js: one Button import ships everything. |
| engine-correctness | 3.5 | Elegant happy-path engine with a disqualifying SSR crash and unbounded, error-blind rule injection. |
| fields-correctness | 3.5 | Consistent recipe with shipped correctness holes: TZ off-by-one, dead arrow keys, form-presence overriding props. |
| accessibility | 3.5 | "Mandatory accessibility" promise half-delivered: broken focus trap, silent Snackbar, mouse-only Table sort. |
| browser-support contract (gap probe) | 3.5 | De-facto Baseline-2023 floor (Chrome 120/Safari 17.2) with zero documentation and silent degradation. |
| theme store internals (gap probe) | 3.5 | setMode provably wipes custom brand themes; no prefers-color-scheme, no persistence. |
| structural-correctness | 4 | Simple containers are solid; state/refs/overlay interactions hide runtime-only bugs (Tabs, Accordion, z-index). |
| ai-first-promise | 4 | Working MCP server wrapped in claims the data can't back: vaporware Action Graph, hollow corpus. |
| Google Fonts injection (gap probe) | 4 | Privacy-hostile default (GDPR exposure) and a font-load failure path that wedges the UI forever. |
| widgets-correctness | 4.5 | Ambitious widgets with real debt: Markdown drops inline formatting, Table wipes selection on data refresh. |
| react-patterns | 4.5 | Good listener hygiene, but systemic purity violations: side effects in updaters, render-phase injection. |
| typescript-api | 4.5 | Strict internals, lying public surface: core types unexported, polymorphic `as` unsound, `style` clobbered. |
| mcp-integrity | 4.5 | ts-morph prop extraction is accurate and fresh; the enrichment layers around it are broken or dead. |
| deps-oss | 4.5 | Lean, clean-licensed runtime deps; bus factor 1, dormancy, stale majors, and 9 unfixed dev-chain CVEs. |
| packaging | 5 | Published tarball works today, but only by accident — no build guard, sideEffects lie, double-shipped data. |
| docs-accuracy | 5 | Component demos type-check and match the API; CHANGELOG, governance docs, and meta-docs have rotted. |
| dead-code | 5 | Little classic rot; the problem is systematic copy-paste divergence and dead MCP infrastructure. |
| security | 6 | Best dimension: untrusted-content rendering is genuinely hardened; Icon XSS sink and key handling are the exceptions. |

## 4. Critical & high-severity findings

All findings below passed adversarial verification. Where multiple dimensions independently flagged the same defect, that is noted — convergence is signal.

### Engine & rendering core

**Module-scope `document` access crashes any non-browser import** — `src/css/createStyled.ts:27` (critical; flagged independently by engine-correctness, testing-quality, packaging). Lines 27–29 run `document.createElement('style')` / `document.head.appendChild` at module evaluation with no `typeof document` guard, and `src/index.ts:72` re-exports the module, so importing @archway/valet in Node — Next.js/Remix SSR, RSC, vitest's default environment, any script — throws immediately (empirically reproduced via esbuild bundle + Node import). This single defect blocks SSR *and* makes the library structurally untestable in Node, making the zero-test status self-reinforcing. Fix: lazily create the sheet on first `inject()` behind a guard; make inject/keyframes deterministic no-ops in non-DOM environments so SSR markup hydrates with stable classes.

**Styles are never removed: unbounded CSSOM/cache growth** — `src/css/createStyled.ts:31` (high; also performance-medium). `grep deleteRule src/` returns nothing; `styleCache` and `injected` (lines 23–24) only grow. Interpolations that bake measured pixels into rule text (e.g. Pagination's `translateX(${Math.round($x)}px)`, Pagination.tsx:163–164) mint a permanent CSSOM rule per unique value, forever. Fix: route continuously-varying values through CSS custom properties on inline style; add an LRU/refcount with deleteRule for prop-derived rules.

**`false` interpolations are stringified into CSS, silently killing the next declaration** — `src/css/createStyled.ts:101` (high). The interpolation union explicitly permits `false` (lines 61/83), inviting `${cond && 'color:red'}`, but concatenation uses `?? ''` which only catches null/undefined — `false` becomes literal text that fuses with the following declaration (`falsedisplay:flex`) and the parser drops it. Verified in Node. Fix: explicit `v === false || v == null ? '' : v` in both `styled` and `keyframes`.

**CSS rebuilt, interpolated and regex-normalized on every render; per-element registration is O(n²) at mount** — `src/css/createStyled.ts:94` (high, performance). Every render of every ~120 styled component re-concatenates the template, calls every interpolation, and runs two global regex passes before the cache lookup — never memoized. Separately, every styled element's layout effect calls `registerChild`, which does `getBoundingClientRect` and clones the entire children Map per element (`src/system/surfaceStore.ts:90–94`): mounting n elements is n map clones + n forced layouts, plus one surface-store notification each. Fix: memoize props→className; make child registration opt-in; batch registry updates.

**Single-file bundle + false `"sideEffects": false` defeats tree-shaking; one Button ships everything** — `package.json:33,37–39` (critical, performance; packaging-high hits the same flag from the styles.css angle). The build is one tsup entry with a root-only exports map; the bundle contains real top-level side effects (the document access above, `marked.setOptions` at Markdown.tsx:21, module-scope `keyframes()` calls). Measured: importing `{ Button }` retains 139k of valet code plus externals including highlight.js and marked. Worse, the same false flag means webpack will *prune* a consumer's `import '@archway/valet/styles.css'` (package.json:24) as dead code — silently dropping the first-paint token fallbacks. Fix: per-module output with subpath exports; remove module-scope side effects; set `"sideEffects": ["*.css"]`.

**Markdown statically imports the full highlight.js build** — `src/components/widgets/Markdown.tsx:7` (high, performance; also deps-oss). `import hljs from 'highlight.js'` registers ~190 languages as a side effect: measured 313,691 bytes gzip versus 73,345 bytes gzip for *all* of valet's own code. Because of the single-bundle dist, even consumers who never render Markdown pay it. Fix: `highlight.js/lib/core` + a small language set, or lazy `import()` on first fenced block.

### Overlay & focus system

**Focus trap swallows every mid-dialog Tab press — keyboard navigation inside all Modals is broken** — `src/system/overlay.ts:169` (critical; flagged independently by structural-correctness *and* accessibility, both critical). `handleKeyDown` calls `ev.preventDefault()` unconditionally on Tab when `trapFocus` is set, but `trapTabWithin` only issues `.focus()` at the boundaries (active === first/last). From any middle position, the default is suppressed and no focus is moved: Tab does nothing. Since initial focus lands on the first focusable, a keyboard user can typically reach only the first and last controls of every Modal — WCAG 2.1.1 failure on the library's flagship overlay. Fix: only preventDefault in the two wrap branches; let mid-list Tab fall through to the browser.

**Drawer is modal in behavior but has no dialog semantics and drops focus into the void** — `src/components/layout/Drawer.tsx:310` (high, accessibility). Non-persistent Drawer registers with backdrop, Escape, and `inertBackground: true` (line 312) yet its Panel is a bare div — no `role='dialog'`, no `aria-modal`, no accessible name — and it registers `trapFocus: false`, while overlay.ts only moves focus in when trapFocus is true (overlay.ts:210–213): on open, the trigger is made inert and focus is stranded. Fix: add dialog role + label and move focus into the panel on open.

**Overlay wiring built from render-phase ref reads; options frozen at registration** — `src/components/layout/Modal.tsx:223` (high, react-patterns). Modal and Drawer gate `useOverlay` on `open && dialogRef.current` read *during render* — null on the first open render, so escape/trap/inert attach one render late, and only because an unrelated `setFade` update forces a second render. The effect deps key only on the element, so later prop changes (e.g. `onRequestClose`) are stale closures. Fix: drive attachment from a ref-callback/state pair; read mutable options from a ref at event time.

**Overlay dismissal and layering implemented four different ways** — `src/components/fields/Select.tsx:286` (high, dead-code/architecture; converges with the AppBar z-index and Select overlay findings below). `src/system/overlay.ts` centralizes the stack for Modal/Drawer/Tooltip, but Select hand-rolls document-level mousedown/keydown listeners (Select.tsx:297–299) and never registers — so Escape inside a Modal closes both — while AppBar hardcodes `z-index: 10000` (AppBar.tsx:95) above Modal's tokenized 1400. Fix: route all popups through useOverlay; put every z-index on the `--valet-zindex-*` scale.

### Component correctness (shipped, runtime-proven where noted)

**DateSelector commits the wrong day in every UTC+ timezone** — `src/components/fields/DateSelector.tsx:255` (critical; flagged independently by fields-correctness and testing-quality, runtime-reproduced under TZ=Europe/Berlin and TZ=Asia/Tokyo). `new Date(viewYear, viewMonth, d).toISOString().slice(0,10)` converts local midnight to UTC, committing the *previous* day for all of Europe/Africa/Asia/Australia; `parseDate` reads local, so the round-trip is asymmetric. Also applies to `commitRange` (292–295) and the controlled fallback at line 229. Fix: format with local getters (`${y}-${pad(m+1)}-${pad(d)}`).

**Slider arrow keys are a complete no-op for ranges smaller than ~50** — `src/components/fields/Slider.tsx:404` (high, Node-reproduced). Default keyStep is `(max-min)/100`, then `roundTo(…, precision)` with precision defaulting to 0: for min=0/max=10, 5 + 0.1 rounds back to 5 — the core keyboard path of a `role='slider'` never moves. Fix: `keyStep = Math.max(step, 10**-precision)`.

**TextField inside FormControl silently ignores its `value` prop** — `src/components/fields/TextField.tsx:284` (high). Rendered value is chosen by form *presence* (`form ? form.values[name] : externalValue`), dead-coding a controlled TextField's `value` with no warning; an unseeded `name` mounts the input uncontrolled then flips controlled on first keystroke. Fix: prefer the explicit prop; base controlledness on value definedness; seed missing keys.

**Select's open menu covers the viewport with an invisible click-swallowing overlay** — `src/components/fields/Select.tsx:123` (high). "PortalWrap" is no portal: a `position:fixed; inset:0` div with no `pointer-events:none` intercepts every pointer event page-wide while open; outside clicks are eaten before mouseup. Fix: `pointer-events:none` on the wrap, `auto` on the menu (document-level click-away already exists).

**Tabs ignores `value`/`defaultValue` on the initial render** — `src/components/layout/Tabs.tsx:359` (high). `activeIndex` reads `tabValuesRef.current`, which is populated *later in the same render body* (line 409); first render sees `[]` and shows tab 0 regardless — masked by StrictMode's dev double-render, so it ships in prod only. Fix: derive the values array before computing activeIndex; don't mutate refs during render.

**Accordion `open={0}` silently becomes uncontrolled** — `src/components/layout/Accordion.tsx:280` (high). `openProp ? toArray(openProp) : undefined` treats index 0 (the most common controlled value) as falsy, flipping the component to uncontrolled and desyncing the parent. Fix: `openProp !== undefined ? … : undefined`.

**Markdown renders raw markdown for formatted/nested list content** — `src/components/widgets/Markdown.tsx:123` (high; verified against installed marked 16.1.2). The `'text'` case returns `t.text` without recursing into `t.tokens`, so list items show literal `**bold**`/`[link](url)`; nested lists and fenced code inside items fall to a raw-dump default; entities are never decoded. This is the pipeline powering LLMChat/RichChat — the AI-first library mangles AI output. Fix: recurse into `t.tokens`; route block tokens in list items back through the block renderer.

**Table selection wiped on data identity change; callbacks fired inside setState updaters** — `src/components/widgets/Table.tsx:410` (high; react-patterns independently flagged the same pattern across Table:410/445, List.tsx:460–481, Dropzone.tsx:287). Selection is `Set<T>` by object identity, pruned with `data.includes(r)` — any immutable refresh silently clears it — and `onSelectionChange` fires *inside* the `setSelected` updater, double-firing under StrictMode and firing spuriously on every data identity change. Fix: add a `rowKey` prop; compute pruning outside the updater; fire callbacks from effects on committed values.

**Surface re-renders on every store notification** — `src/components/layout/Surface.tsx:70` (high; flagged independently by react-patterns, performance, and system-state). `useStore((s) => ({width, height}))` with no equality fn on a `createWithEqualityFn` store: the fresh object fails Object.is on *every* set() — every child mount/unmount/resize, every unthrottled scroll event (line 103), every subtree MutationObserver hit (line 105), and measure() always sets a fresh state object even when unchanged. The screen root re-rendering this often multiplies every other per-render cost (notably the engine's). Fix: pass `shallow` (as Grid.tsx:98 already does); bail in measure() when values are unchanged; rAF-throttle.

### Accessibility (beyond the focus trap)

**SpeedDial: focus indicator removed, no disclosure semantics, no keyboard model** — `src/components/widgets/SpeedDial.tsx:63` (high). `outline: none` on both buttons with zero `:focus-visible` replacement (WCAG 2.4.7); no aria-expanded/haspopup/controls; icon-only actions named only via `title`; no Escape-to-close. Fix: mirror IconButton's focus-visible pattern (IconButton.tsx:103) and add disclosure ARIA.

**Snackbar has no live region and auto-dismisses untouchably; chat widgets equally silent** — `src/components/widgets/Snackbar.tsx:219` (high). No `role='status'`/aria-live anywhere in Snackbar, LLMChat, or RichChat (grep-verified); 4s auto-hide with no hover/focus pause (WCAG 4.1.3, 2.2.1). Fix: `role='status'` default + pause-on-hover; `role='log'` around chat lists.

**Table column sorting is mouse-only** — `src/components/widgets/Table.tsx:655` (high). Sortable `<th>` has onClick but no tabIndex/role/key handler — keyboard users cannot sort despite correct `aria-sort`. Fix: real `<button>` inside the header cell.

### Security

**Icon `svg` string prop is an unsanitized `dangerouslySetInnerHTML` XSS sink** — `src/components/primitives/Icon.tsx:107` (high). Raw string injected into an inline `<svg>`; SVG via innerHTML still executes event-handler attributes (`<image onerror>`, `<set onbegin>`). The prop is documented for raw path data and the library markets AI agents as first-class users — model-generated icon markup is a realistic injection vector. Fix: DOMPurify SVG profile, or restrict the string form to validated path data and render `<path d={...}>`.

**Security policy supports zero versions and routes vulnerability reports to a public issue** — `SECURITY.md:7` (high; flagged by both security and deps-oss). The support table's only row is `< 1.0.0 | :x:` — every published version unsupported — and reports go through a public GitHub issue template (full disclosure before any fix). Fix: enable GitHub Private Vulnerability Reporting or publish a security email; mark the current 0.x minor supported.

### Type system & public API

**Core vocabulary types are unexported** — `src/index.ts:1` (high; dead-code independently flagged the events subset). `Sx`, `FieldBaseProps`, `ChangeInfo`, `OnValueChange`, `OnValueCommit`, `Space`, `Presettable`, and the polymorphic helpers all yield TS2305 from the package entry (tsc-verified), yet ~52 components use `sx?: Sx` and every field's public props reference the event types. Consumers cannot type a handler or a shared style object. Fix: one-line `export type` additions to src/index.ts.

**Polymorphic `as` typing is unsound for Button/IconButton** — `src/components/fields/Button.tsx:32` (high; tsc-verified). OwnProps extend `ButtonHTMLAttributes<HTMLButtonElement>` and win the merge in `PolymorphicProps`, so `<Button as='a'>` types onClick's currentTarget as HTMLButtonElement and accepts `type='submit'`/`disabled` on an anchor. Fix: make OwnProps behavior-only; let element attributes come from `PropsOf<E>`.

**Typography and Box accept `style` in their types but clobber it at runtime — over a comment claiming the opposite** — `src/components/layout/Box.tsx:141` (high; pre-recorded in the repo's own PROP_PATTERNS_AUDIT.md, still unfixed). Box leaves `style` in `rest` then overwrites it with `style={inlineStyle}` (lines 130–141, under the comment "Never clobber an explicit style prop from the caller", 114–115); Typography.tsx:329 renders `style={sx}` after spreading props. Fix: merge or `Omit<'style'>` as Button already does.

### MCP & the AI-first contract

**"Web Action Graph" is marketed as shipped but has zero implementation** — `docs/src/pages/MainPage.tsx:251` (high). The homepage sells it in present tense, Quickstart.tsx:203 instructs users to structure forms *for* it, AGENTS.md:21 lists it as a core feature — and grep for telemetry/action-graph across src/ returns nothing; the docs Glossary itself admits it is conceptual. Fix: remove or explicitly mark as roadmap — false present-tense claims poison the very agents the library targets.

**MCP corpus is materially hollow** — `scripts/mcp/extract-ts.mjs:769` (high; converges with mcp-integrity's empty-glossary and dead-actions findings). All 56 component docs ship the placeholder summary `"<Name> component"` because `sf.getLeadingCommentRanges()` never yields the header line (empirically reproduced with the repo's ts-morph) and merge.mjs:52 always falls back; 34/56 have zero examples; 56/56 have `actions: []` (the only heuristic detects `useImperativeHandle`, used by zero components — extract-ts.mjs:626); and the shipped glossary is empty because extract-glossary.mjs:15 hardcodes a moved file path (`docs/src/pages/concepts/Glossary.tsx`; the file lives in getting-started/) and silently returns `[]`. The README's claim that the MCP "teaches AI everything there is to know about valet" is not supported by the data it serves. Fix: repair header extraction and the glossary path; assert non-placeholder summaries at build time; populate actions from sidecars or drop the field.

**Runtime AI integration is a dated browser-direct wrapper** — `src/system/aiKeyStore.ts:221` (high). The entire "AI-enabled" runtime is one `sendChat`: two providers, hardcoded `max_tokens: 1024`, no streaming/abort/tool-calling, a role union advertising `'function' | 'tool'` that is never honored, and `'anthropic-dangerous-direct-browser-access': 'true'`. LLMChat never even calls it (see medium findings). Fix: invest in a real client contract or descope and document it as a demo helper.

**Curated sidecar metadata misattached** — `src/components/fields/Radio.meta.json:1` (high in dead-code; medium duplicate in mcp-integrity). The sidecar names "Radio", so all curated bestPractices/aliases attach to the child component while the actual exported `RadioGroup` ships zero — extract-docs.mjs:53–56 even hardcodes a `NAME_ALIASES` shim codifying the mismatch; ParallaxBackground.meta.json sits beside Parallax.tsx with the same problem, and `KeyModal` (a public export, src/index.ts:66) is entirely invisible to MCP because the extractor skips default exports (extract-ts.mjs:191). Fix: rename sidecars to match exports, delete the shim, handle default exports, and add a merge-time coverage check.

### Release pipeline & governance

**No CI, no prepublish guard, no verification — `npm publish` today ships a broken or stale package** — `.github/`, `package.json:37`, `dx/PUBLISH_ORDER.md:34` (two criticals and one high, merged; flagged independently by testing-quality, packaging, and build-tooling). `.github/` has no workflows; the root package has no prepublishOnly/prepack while `main` points at gitignored `dist/` — `npm pack --dry-run` right now produces a 4-file, zero-code tarball. The validators that *do* exist are wired to nothing: `mcp:schema:check` is never invoked by any publish script, valet-mcp's selfcheck is mentioned in prose but absent from the runbook's commands, and CVA's only end-to-end harness is literally commented out (`# npm run cva:validate`, PUBLISH_ORDER.md:34). Fix: `"prepublishOnly": "npm run lint && npm run build"` at root; a minimal GitHub Actions workflow (lint + tsc + build); chain the existing validators into every publish script.

**Bus factor 1, ~6 months dormant, unreleased fixes stranded** — `CHANGELOG.md:5` (high, deps-oss; reproduced via git). 1,110 of 1,120 commits from one author; HEAD 2025-12-14; `development` is 6 commits ahead of `main` with post-0.34.1 fixes unpublished. No one else can ship a security patch. Fix: co-maintainer with publish rights; CI-driven publishing with provenance; merge or park the stranded commits.

**CHANGELOG abandoned at 0.32.0** — `CHANGELOG.md:144` (high in docs-accuracy; independently flagged by packaging and deps-oss). Nine published releases (0.33.0–0.34.1) have no sections; ~140 lines of shipped changes sit in an "Unreleased" blob with duplicated headings; post-0.34.1 work is absent entirely. Fix: backfill against the (otherwise excellent — 112 tags matching npm exactly) tag history; refuse publish when the version lacks a section.

**README's local-docs instructions produce a broken build** — `README.md:63` (high). Docs pin `@archway/valet ^0.33.0` while HEAD docs pages use post-0.34.1 APIs (AppBarDemo.tsx:30–32 `icon`/`iconOnly`/`ariaLabel`) that exist in no published release; only Amplify's `npm link` saves the deploy. Fix: add the link/alias step to README or alias docs to ../src.

### Gap-probe highs (areas the original 16 dimensions missed)

**setMode/toggleMode wipes all custom theme state except fonts** — `src/system/themeStore.ts:312` (high; proven by Node repro against the real store). Any brand customization via setTheme — colors, new tokens, spacingUnit, motion, typographyFamilies — is silently destroyed on the first dark/light toggle, because setMode rebuilds from built-in palettes preserving only `state.theme.fonts`. Fix: persist user overlays and re-apply after palette swap, or swap only mode-dependent tokens.

**Unconditional Google Fonts injection on the default path** — `src/helpers/fontLoader.ts:169` (high). Theme defaults are Google families, both CVA templates and the docs call useInitialTheme with them, and injectFontLinks appends preconnect + stylesheet links to fonts.googleapis.com/gstatic.com with no consent gate, no disable flag (`GoogleFontOptions` has none, fontLoader.ts:9–16), and no privacy documentation — concrete GDPR exposure (LG München precedent) on every zero-config scaffold. Fix: an `injectRemote: false`/self-hosted provider option; consider system-font defaults.

**createInitialTheme wedges the UI forever when a font load rejects** — `src/system/createInitialTheme.ts:83` (high). `start(); await waitForFonts(...); finish();` with no try/finally: one failed FontFace.load (404, offline, CSP) leaves fontStore at loading=1 permanently, and any `blockUntilFonts` Surface renders an infinite spinner. Fix: try/finally + catch on the effect's floating promise.

**DateSelector is hardcoded en-US; ~10 components ship non-overridable English aria-labels** — `src/components/fields/DateSelector.tsx:150`, `src/components/widgets/Pagination.tsx:1028` (two highs, i18n probe). English month/day constants, Sunday-fixed week start, no locale prop, zero Intl usage; Pagination/Chip/Drawer/Iterator/SpeedDial/Dropzone screen-reader strings have no prop escape hatch (e.g. Chip.tsx:241–242 `aria-label='Remove'`, Drawer.tsx:338 `'Open drawer'`). For a library pitched as "all humans first-class," non-English screen-reader users get untranslatable English on the most assistive paths. Fix: Intl-driven DateSelector + a `labels` prop or locale provider following the existing CodeBlock/AppBar pattern.

**No browser-support contract for a Baseline-2023 floor; four bare nested selectors raise it further** — `README.md` (no statement anywhere), `src/components/fields/RadioGroup.tsx:95` (two highs, browser probe). The de-facto floor is Chrome 120/Safari 17.2/Firefox 121 (relaxed CSS nesting + :has()), undocumented in README/AGENTS/docs/package.json (whose only environment claim, `engines.node>=18`, describes an environment the library *can't* run in). Four nested rules starting with bare type selectors (RadioGroup.tsx:95, Checkbox.tsx:85, Table.tsx:134/144) silently drop focus rings and row styling on Safari 16.5–17.1/Chrome 112–119. Fix: prefix the four selectors with `& ` (zero-risk, lowers the floor to Chrome 112/Safari 16.5) and publish a support statement.

## 5. Medium & low findings

### CSS engine internals
- `src/css/stylePresets.ts:54` — preset rules insert at app init, styled rules at first render: equal-specificity ties always favor component base styles, so presets can never override; per-component `presetHas` workarounds paper over it (Panel.tsx:150). Use `@layer` or doubled specificity. (medium)
- `src/css/createStyled.ts:33` — bare `insertRule` with no try/catch in the render path; a malformed consumer template throws a DOMException that unmounts the tree with no diagnostic. (medium)
- `src/css/createStyled.ts:37` — `normalizeCSS` collapses whitespace inside quoted strings/url() tokens, silently corrupting `content`, data URIs, and multi-space font names; duplicated verbatim at stylePresets.ts:21–23. (medium)
- `src/css/createStyled.ts:110` — render-phase `insertRule` + `Math.random()` element ids violate React purity; move injection to `useInsertionEffect`, ids to `useId()`. (medium, react-patterns)
- `src/css/stylePresets.ts:56` — inverted `styleCache.set(className, rawCSS)` (engine uses Map<css, className>): dead writes never read by any lookup; duplicate-name `definePreset` throws, breaking HMR. (low; flagged by both engine and dead-code)
- `src/css/createStyled.ts:110` — hash collisions on the `injected` Set fail silently with the wrong styles applied and no detection path. (low)
- `src/css/createStyled.ts:188` — internal `styleCache`/`globalSheet` singletons exported from the package root, carrying semver weight and inviting cache desync. (low; typescript-api + dead-code)
- `src/css/createStyled.ts:23` — mode toggles permanently double the injected sheet since ~120 templates interpolate resolved hex values and nothing is deleted. (low, theme probe)

### Component behavior
- `src/components/layout/Modal.tsx:266` — `$text={primaryText}` (#F7F7F7) over backgroundAlt (#D6D6D6): ~1.3:1 contrast in light mode for non-Typography content; Panel.tsx:178 maps the same background correctly. (medium)
- `src/components/layout/AppBar.tsx:95` — hardcoded `z-index: 10000` above Modal/backdrop/Tooltip/Snackbar (Modal's own comment claims the opposite); hover colors via hex concatenation (`base + 'F0'`) produce invalid CSS for rgb()/hsl()/named theme colors. (medium; converges with the overlay-architecture high)
- `src/components/layout/List.tsx:465` — `onReorder` fired inside setItems updaters (StrictMode double-fire) and the pointer-drop path reads a stale `items` closure. (medium)
- `src/components/primitives/WebGLCanvas.tsx:139` — default `clearColor=[0,0,0,0]` is a fresh array in the main effect's deps: the whole GL program is torn down and rebuilt on every parent re-render. (medium)
- `src/components/fields/RadioGroup.tsx:189` — form binding is write-only: it never reads `form.values`, so initial values and `form.reset()` don't affect the rendered selection, unlike every other field. (medium)
- `src/components/fields/Switch.tsx:138` — `Boolean(form.values[name])` is never undefined inside a form, so `checked`/`defaultChecked` are dead and the switch renders unchecked when the key is unseeded. (medium)
- `src/components/fields/Slider.tsx:368` — no pointercancel/setPointerCapture: a canceled gesture leaves the document move listener tracking forever; visuals diverge from rejected controlled values. (medium)
- `src/system/events.ts:8` — `ChangeInfo.source` is fabricated across every field: TextField's `instanceof KeyboardEvent` check is dead (change events carry InputEvent), Switch always reports 'pointer', Select/Iterator/MetroSelect/DateSelector hardcode 'programmatic' for real user input. Tabs additionally declares lookalike `onValueChange` props with incompatible inline payload types (Tabs.tsx:277–285). (medium; fields + typescript-api)
- `src/components/widgets/Table.tsx:445` — `toggleSort` runs `onSortChange` and `setFadingOutIndex` inside the setSort updater; descending sort reverses the ascending copy (unstable) instead of negating the comparator. (medium)
- `src/components/widgets/RichChat.tsx:509` — `onFormSubmit` receives the index in the system-message-*filtered* list, so consumers indexing their own array mutate the wrong message. (medium)
- `src/components/widgets/Pagination.tsx:282` — clicks dropped and buttons disabled during every multi-phase underline animation (including on mount); a stuck `suppressNextUnderlineAnim` flag can freeze the underline permanently. (medium)
- `src/components/widgets/Snackbar.tsx:176` — the enter-animation rAF id lives on a single `window.__valet_snackbar_enter_id2` global: concurrent snackbars cancel each other and stick at opacity 0; no queueing; controlled mode skips the exit fade; close timeout never cleaned on unmount. (medium + react-patterns low)
- `src/components/widgets/Dropzone.tsx:106` — stale rejection errors persist (and keep announcing via aria-live) through later successful drops; `onFilesChange`/URL.revokeObjectURL run inside a setFiles updater; `<img>` previews render for non-image files. (medium)
- `src/components/widgets/CodeBlock.tsx:77` — `setCopied(true)` is both the fulfilled *and* rejected clipboard handler: failed copies show "copied"; naive fence concatenation breaks on code containing ``` . (low)

### React patterns & hooks
- `src/hooks/useGoogleFonts.ts:37` — `start()` (a zustand update) scheduled from `useInsertionEffect` (forbidden), with effects keyed on caller array/object identity: inline literals re-trigger link removal/re-insertion every render. (medium)
- `src/components/primitives/Typography.tsx:223` — a new styled component type minted per instance via `useMemo(() => styled(Tag)…, [Tag])` (cache discard ⇒ full subtree remount), plus two `getComputedStyle` layout effects per text node, re-run across all text on every theme-color identity change. (two mediums, react-patterns + performance)
- `src/components/layout/Modal.tsx:220` — the "mount/unmount" layout effect depends on the `rest` spread object: cleanup+setup churn on every render of an open modal. (medium)

### Accessibility
- `src/components/layout/Tabs.tsx:702` — no `role='tablist'` anywhere (structurally invalid ARIA tabs pattern); Tabs and Accordion (Accordion.tsx:580–581) mint index-only DOM ids that collide across instances despite `useId()` being available. (medium)
- `src/components/primitives/Progress.tsx:63` — four infinite keyframe animations with no `prefers-reduced-motion` guard; same for LLMChat typing dots, SpeedDial, Snackbar, Parallax (guards exist only in RichChat/Modal/List/Accordion). (medium)
- `src/components/widgets/Tooltip.tsx:347` — `aria-describedby` sits on the non-focusable wrapper span, not the focused control, so the tooltip is never announced on keyboard focus. (medium)

### Security & privacy
- `src/system/aiKeyStore.ts:72` — replacing a passphrase-protected key with an unprotected one leaves the old localStorage cipher in place; `getItem` prefers localStorage, resurrecting the superseded credential on next load. (medium)
- `src/components/primitives/Avatar.tsx:104` — default behavior fetches `gravatar.com/avatar/{md5(email)}` whenever `src` is absent (even with undefined email), leaking a reversible email hash plus viewer IP/UA to a third party. (medium)
- `amplify.yml:9` — unpinned `curl -fsSL https://mise.jdx.dev/install.sh | sh` on every docs deploy; create-valet-app additionally runs `npm i -g @archway/valet-mcp` and edits `~/.codex/config.toml` by default with only an env-var opt-out (bin/create-valet-app.js:1203–1282). (low + medium, deps-oss/security)
- `docs/src/components/LiveCodePreview.tsx:75` — meta.json example strings compiled with @babel/standalone and executed via `new Function` on the docs origin: latent ACE path if examples are ever generated upstream. (low)

### Performance
- `src/components/layout/List.tsx:534`, Tree.tsx:484 — no virtualization anywhere; every item also registers with the surface ResizeObserver, compounding cost; Table is saved only by default pagination. (medium)
- `src/components/fields/Slider.tsx:374` — two getBoundingClientRect calls per raw pointermove with no rAF coalescing; Tooltip attaches a capture-phase window scroll listener doing layout reads per event (Tooltip.tsx:323). (low)

### TypeScript & API design
- `src/components/fields/Select.tsx:179` — `Select.Option` accepts full `LiHTMLAttributes` and applies none of them (it renders `<>{children}</>`); SelectProps isn't generic and `multiple` isn't a discriminant, so single/multi value types don't narrow. (medium)
- `src/components/fields/Switch.tsx:126` — fields extend `FieldBaseProps` but ignore label/helperText/error/fullWidth and leak them onto DOM elements via rest spread (same pattern repo-documented for Slider et al.). (medium)
- `src/components/layout/Accordion.tsx:219` — the repo's own PROP_PATTERNS_AUDIT P0 collisions all unfixed: `open: number|number[]` vs boolean `open` on overlays, Pagination's bare `onChange(page)` (Pagination.tsx:23), three divergent selection vocabularies across List/Table/Tree. (medium)

### Packaging & toolchain
- `package.json:19` — dual complete ESM/CJS bundles each carry the engine singletons: mixed import/require graphs get two style sheets and split theme state (dual-package hazard); also missing `"types"` export condition and `"./package.json"` subpath (low). (medium + low)
- `packages/valet-mcp/package.json:13` — mcp-data shipped twice in the tarball (123 of 161 files); the dist copy is dead weight given shared.ts's candidate order. (medium)
- `CHANGELOG.md:144` + `packages/create-valet-app/templates/ts/package.json:18` + `docs/package.json:12` — systemic version-pin skew: templates pin ^0.31.1 (silent-failure runtime patch as the only correction), docs pin ^0.33.0, library at 0.34.1. (medium; packaging + deps-oss)
- `package.json:67` — zustand ^4-only as a regular dependency: consumer apps on v5 silently carry two copies; marked (16 vs 18) and react-dropzone also lag majors. (low + medium, deps-oss)
- `tsconfig.build.json:7` — the strictest surface (skipLibCheck:false, declaration emit) runs only at manual build time; dev/editor checks a laxer config. Root tsconfig also omits `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes` that valet's *own scaffolded templates* enable (tsconfig.json:11). (two low/mediums)
- `eslint.config.mjs:22` — ~4,900 lines of release-critical code (CVA bin, scripts/mcp, valet-mcp src) sit outside both ESLint and any typecheck. (medium)
- `package-lock.json` — 9 unfixed npm audit findings (6 high, incl. rollup path-traversal and a CVSS 8.2 babel plugin), all dev-chain, all with fixes available — the exact toolchain that builds the published artifacts. (medium)

### MCP & metadata
- `scripts/mcp/merge.mjs:324` — stale `_ts-extract.json` (generated 5 days before the dataset, AppBar showing 6 props vs the authoritative 17) is mirrored and shipped in the npm package. (medium)
- `scripts/mcp/extract-ts.mjs:700` — TextField's required `name` reported optional; the polymorphic `as` prop missing from Box/Button/Typography docs. (low)
- `src/mcp/metaTypes.ts:68` — `defineComponentMeta` (127 lines) and load-meta.mjs's babel sidecar pipeline have zero consumers: dead infrastructure for a `.meta.ts` format no sidecar uses. Its `i18n` schema field (line 62) is likewise populated by zero sidecars. (medium + low)
- `AGENTS.md:19` — "Context Bridge … typed JSON schemas": no JSON schema, zod, or ajv anywhere in src/; the form store is `{values, setField, reset}`. (medium)
- `src/components/widgets/LLMChat.tsx:23` — hardcoded, stale model catalog (gpt-3.5-turbo era) with no override prop, and the component never calls sendChat — it is a presentational shell. (medium)

### Governance & docs
- `VALIGNMENT_PROGRESS.md:64` — directly contradicts itself (and the code) on whether polymorphism is implemented; the code proves line 64 false. (medium)
- `VALIGNMENT_ISSUES.md:16` — three High-severity regressions left at hypothesis stage with no closure, despite later commits apparently fixing them. (medium)
- `AGENTS.md:86` — references a non-existent `mcp:server:link` script, a wrong MCP.tsx path, and an inaccurate build claim — in the canonical instructions for the AI agents that author the codebase. (medium)
- `AGENTS.md:36` — "done" is defined as lint:fix + build; known bugs live in markdown audits instead of failing tests. (medium)
- `docs/src/pages/getting-started/Quickstart.tsx:222` — documents `*:agent` scripts that no template defines; `README.md:117` has zero usage code examples and overstates "Targets React 19.x" vs the ^18||^19 peer range. (two lows)
- No CONTRIBUTING.md anywhere. (low)

### Duplication
- `src/components/fields/IconButton.tsx:206` — Button/IconButton share a 152-line common subsequence including a verbatim `makeMix` helper and intent-var computation; AppBar reimplements the same color derivation incompatibly via hex concatenation. (medium)

### Browser support, theme, fonts (gap-probe mediums/lows)
- `package.json:39` — no tsup `--target`: the browser library's syntax floor is esbuild's *node16* fallback — accidental, undocumented, and one tsup upgrade away from changing. (medium)
- `src/components/primitives/Progress.tsx:146`, LoadingBackdrop.tsx:45 — `color-mix()` with no fallback: invisible progress track and non-dimming backdrop on Safari <16.2/Firefox <113. (medium)
- `src/system/aiKeyStore.ts:16`, CodeBlock.tsx:78 — `crypto.subtle` and `navigator.clipboard` unguarded: throws on plain-HTTP deployments. (medium)
- `src/components/layout/Modal.tsx:69` — `100dvh` inside calc() with no `vh` fallback: no max-height at all on pre-dvh engines. (medium)
- `src/system/themeStore.ts:304` — initial mode hardcoded `'dark'`; no `prefers-color-scheme` detection or mode persistence anywhere in library, docs, or templates. (medium)
- `src/system/themeStore.ts:325` — setTheme is carefully additive while setMode resets to defaults: the asymmetry is the clobber bug's root; `motion` isn't deep-merged either. (medium)
- `docs/src/pages/getting-started/ThemeEngine.tsx:170` — the published toggle snippet branches on non-existent `theme.mode`: copied code one-way-toggles to dark and renders "Toggle undefined". (medium)
- `src/system/themeStore.ts:294` — darkColorNames labels #F7F7F7 'Graphite' (the name for #1b1b1b): wrong palette names fed to the AI/MCP audience; palettes also shared by mutable reference (line 317). (two lows)
- `src/helpers/fontLoader.ts:277/56/283/9` and `src/hooks/useGoogleFonts.ts:43` — font pipeline resilience: no timeout on waitForFonts; the inflight promise cache never evicts rejected loads (failures unretryable for the session); readiness races the injected stylesheet; unmount-before-settle leaks `loading` increments wedging blockUntilFonts surfaces; no injection kill-switch. (three mediums, two lows)
- `src/components/widgets/Dropzone.tsx:305`, `src/components/KeyModal.tsx:47` — English-only live regions/instructions and a fully hardcoded English KeyModal UI with no override props. (two mediums, i18n probe)

## 6. Contested findings

Verifiers confirmed the underlying code facts for all five but split on severity or framing:

- **aiKeyStore ships user API keys browser-direct; plaintext key and passphrase in zustand memory** (`src/system/aiKeyStore.ts:221`, high) — facts verified verbatim; the split is whether browser-direct key transport with the explicit `anthropic-dangerous-direct-browser-access` opt-in is a defect or the component's intended (if hazardous) design for local/dev tooling. Either way it deserves loud documentation and removal of the persisted passphrase.
- **Docs-enrichment stage effectively dead: 54/56 components lack docsUrl** (`scripts/mcp/extract-docs.mjs:223`, high) — the empty output was reproduced in-memory, but verifiers split on impact because curated `.meta.json` sidecars independently supply examples/bestPractices for many components.
- **Controlled/uncontrolled guard copy-pasted into 10 components with diverging semantics** (`src/components/fields/TextField.tsx:153`, high) — duplication grep-confirmed; split on whether the divergent "controlled" predicates are deliberate per-field choices or drift (the TextField/Switch findings above suggest drift).
- **RTL wholly unsupported: 86 physical CSS usages vs 5 logical** (`src/components/layout/Drawer.tsx:108`, high) — counts and Drawer's physical anchoring verified; split on severity for a pre-1.0 library that never explicitly claims RTL — though the "all humans first-class" pitch makes the gap fair to weigh.
- **Engine inserts nested CSS verbatim with no flattening and an uncaught render-phase insertRule** (`src/css/createStyled.ts:33`, high) — substantially overlaps the *confirmed* engine-correctness medium on the same lines; the split was over how much real-world pre-nesting-browser breakage occurs, not whether the code does this.

## 7. Cross-cutting themes

1. **Nothing verifies behavior, anywhere.** Zero tests, zero CI, no prepublish hooks, validators built but disconnected from every publish path, and a quality gate defined in AGENTS.md as lint:fix + build. Every runtime-proven bug in this report (focus trap, DateSelector TZ, Slider keys, Tabs initial value) shipped through that gate and would have been caught by a single jsdom test — and the engine's module-scope `document` access structurally prevents writing one, closing the loop.

2. **The AI-first promise outruns the data served to AI.** The Web Action Graph is marketed but nonexistent; all 56 MCP summaries are placeholders; the glossary ships empty; `actions` is `[]` everywhere; "typed JSON schemas" have no schema; LLMChat's model list is stale and the component never calls the AI client. The library's target audience — agents — is precisely the audience most damaged by confidently wrong metadata.

3. **"All humans first-class" vs a11y/i18n delivery.** Real effort exists (Tree, Select combobox, RadioGroup wiring, 44/45 ARIA coverage), but the flagship overlay breaks Tab for keyboard users, Snackbar is silent to screen readers, Table sort is mouse-only, ~30 English strings are hardcoded with no override, and RTL is structurally unsupported.

4. **Module-scope singletons are the architecture's original sin.** The style element at import, the never-pruned global sheet, the overlay stack, the preset registry that throws on HMR, window-global rAF ids, dual ESM/CJS bundles each carrying all of it — one design habit produces the SSR crash, memory growth, HMR breakage, snackbar cross-talk, and the dual-package hazard.

5. **React purity violations are systemic, not incidental.** Callbacks and setState calls inside updater functions (Table ×2, List ×2, Dropzone), `insertRule` and `Math.random()` in render, ref reads during render gating overlay attachment, zustand updates from `useInsertionEffect`, component types minted inside render — the same rule broken in seven-plus places, all StrictMode/concurrent hazards.

6. **Drift through duplication and manual choreography.** A 10-way copy-pasted guard with diverged semantics, Button/IconButton 40% duplicated with AppBar reimplementing the math incompatibly, four overlay-dismissal systems, two normalizeCSS copies, template pins at ^0.31.1, docs at ^0.33.0, CHANGELOG at 0.32.0, sidecars attached to the wrong components, AGENTS.md citing scripts that don't exist. Nothing asserts consistency, so every surface rots independently.

## 8. Strategic recommendations

**Tier 1 — quick wins (days; do before any other work):**
1. Guard the engine: lazy-init the stylesheet behind `typeof document !== 'undefined'` (src/css/createStyled.ts:27) and fix the `false`-interpolation `?? ''` (line 101). This simultaneously unblocks SSR, Node imports, and all future testing.
2. Fix the focus trap: move `preventDefault` into trapTabWithin's wrap branches only (src/system/overlay.ts:169). One small diff repairs keyboard access to every Modal.
3. Fix DateSelector's local date formatting (DateSelector.tsx:255/292) and Slider's keyStep floor (Slider.tsx:404).
4. Add `"prepublishOnly": "npm run lint && npm run build"` to the root package and change `"sideEffects"` to `["*.css"]` (package.json:33,37).
5. One-line MCP repairs: glossary path (extract-glossary.mjs:15), header-comment summary extraction (extract-ts.mjs:769), rename Radio/ParallaxBackground sidecars, prefix the four bare nested selectors with `& `.
6. Pass `shallow` to Surface's selector (Surface.tsx:70) and bail in measure() when unchanged.
7. Fix SECURITY.md: enable private vulnerability reporting and mark 0.34.x supported.

**Tier 2 — this month:**
1. Stand up vitest + jsdom and a GitHub Actions workflow (lint, tsc with the build config, build, test) gating `development` and `main`. Start with pure functions — hash.ts, normalizeCSS, resolveSpace, createFormStore, DateSelector date math — then TZ-parameterized and focus-trap regression tests for every bug in section 4.
2. Wire the existing validators into every publish script (mcp:schema:check, valet-mcp selfcheck, un-comment cva:validate) and extend validate.mjs with content assertions (non-empty glossary, summary/docsUrl/example coverage, buildHash freshness, version-pin parity for templates and docs).
3. Backfill CHANGELOG 0.33.0–0.34.1 from the tag history; merge or explicitly park the 6 stranded development commits; recruit a co-maintainer with publish rights and move toward CI-driven publishing with provenance.
4. Truth in advertising: remove or roadmap-mark the Web Action Graph (MainPage.tsx:251, Quickstart.tsx:203, AGENTS.md:21) and the "typed JSON schemas" claim; document sendChat as a dev-tool; fix AGENTS.md's phantom script and paths.
5. Export the public vocabulary types from src/index.ts and fix the Box/Typography `style` clobber — small diffs, large API-contract payoff.

**Tier 3 — structural (quarter):**
1. Bundle architecture: per-module output with subpath exports, no module-scope side effects, highlight.js core + lazy languages, explicit browser `--target`, and a published browser-support statement. This attacks the worst-scoring measurable dimension.
2. Unify the overlay system: route Select (and future popups) through useOverlay; move AppBar/Snackbar onto the `--valet-zindex-*` scale; give Drawer dialog semantics.
3. Extract shared primitives to end the drift: one `useControlledState`/guard hook with a single definition of "controlled," one `computeIntentVars` color helper for Button/IconButton/AppBar/Chip, one normalizeCSS.
4. Theme system: make setMode an additive patch (fixing the brand-wipe bug at themeStore.ts:312), add prefers-color-scheme initialization and opt-in persistence, and consider CSS-variable-driven palettes so mode toggles stop doubling the stylesheet.
5. i18n foundation: a labels prop or `ValetLocaleProvider` string table covering every internal aria-label/live-region string; Intl-driven DateSelector; begin logical-property migration for RTL.
6. Privacy defaults: Google Fonts injection opt-out + self-hosting documentation; flip Avatar's Gravatar fetch to opt-in; make CVA's global MCP install an explicit prompt.

## 9. Coverage & method notes

**Process.** ~25 mapping/review agents covered eight architecture areas (CSS engine, system state, structural and interactive components, MCP pipeline, CVA/docs, build tooling, repo meta) plus a live toolchain-health pass (tsc, eslint, npm audit, hygiene greps — all clean except 9 dev-chain audit findings). Sixteen dimensions were scored; a completeness critic then identified blind spots, and four targeted gap probes (i18n/RTL, browser-support contract, theme-store internals, Google Fonts injection) were run, producing four additional scored dimensions. Every finding above passed per-finding adversarial verification against the working tree — verifiers re-read the cited code, re-ran greps, and where possible re-executed repros; **7 findings were killed** in that process and are not in this report. Five survivors are marked contested where verifiers split on severity rather than fact.

**Verification depth.** The strongest claims are execution-backed, not just read-backed: the module-scope document crash (esbuild bundle imported in Node), the DateSelector TZ bug (TZ=Europe/Berlin and Asia/Tokyo repros), Markdown's token handling (against installed marked 16.1.2), the setMode theme wipe (Node repro against the real zustand store), the empty `npm pack` tarball (dry-run), type-surface claims (tsc probes), bundle-weight claims (esbuild + gzip measurements), and the MCP summary bug (reproduced with the repo's own ts-morph).

**Known gaps (per the critic).** Two areas remain unprobed: error resilience — 22 components hard-throw outside a Surface ancestor with zero error boundaries anywhere, so misuse white-screens the host app — and create-valet-app was never executed end-to-end (its validate harness also only tests *published* packages, and a broken symlink is committed inside its published bin/ path). No real-browser interaction testing was performed; visual, pointer, and screen-reader behavior claims rest on code reading plus Node-level repros. Findings reflect HEAD of `development` (2025-12-14, ~6 months before the audit date of 2026-06-10); the 6 commits ahead of `main` mean the published 0.34.1 differs slightly from the audited tree. Severity ratings are the audit's judgment; line numbers were verbatim-verified by the adversarial pass but may drift with future edits.
