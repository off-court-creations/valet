> **Status: PLANNED** — the road from `@archway/valet` **v0.37.0** (the
> intentional "dogfood-before-1.0" minor) to a defensible, terrific **1.0.0**.
> Produced 2026-06-27 by a 38-agent deep recursive analysis (15 subsystem
> deep-reads + 4 downstream-product probes, every blocker adversarially verified,
> synthesized and passed through a completeness critic), then re-verified by hand
> against the live `main` tree. Supersedes the scoping in
> [`../valet-1.0-prep-2026-06-14/plan.md`](../valet-1.0-prep-2026-06-14/plan.md),
> which was written against v0.36.0 before the W1-W6 epic shipped.
>
> **Companion docs:** [`findings.md`](findings.md) (full per-subsystem deep-reads),
> [`product-readiness.md`](product-readiness.md) (the 4 product probes),
> [`critique.md`](critique.md) (completeness-critic corrections),
> [`verification.md`](verification.md) (independent ground-truth spot-checks).

---

## 0. Verified ground truth & corrections (2026-06-27)

These were re-checked by hand against the live `main` tree at 0.37.0 (see
[`verification.md`](verification.md)) and **correct or sharpen the synthesis below**:

1. **The W1-W6 epic has landed in `main` at 0.37.0.** `src/system/deprecate.ts` is
   gone; **zero `@deprecated` props** remain in `src/components`. The breaking 1.0
   sweep is done, not pending — the prior plan's "~85%, blocker = deprecation sweep"
   framing is stale.
2. **Experimental→stable is ~95% done, but the trackers disagree.** The on-disk
   metadata is **63 `*.meta.json` → 60 `stable` / 3 `experimental`**
   (`KeyModal`, `LLMChat`, `RichChat`); the **served MCP corpus**
   (`mcp-data/index.json`) is **62 components → 59 stable / 3 experimental**, and
   `ValetLocaleProvider` is absent from the corpus entirely. This 63/62 + 60/59
   drift is itself blocker #19 — reconcile to one authoritative count before quoting it.
3. **`Intent` ↔ palette mismatch confirmed.** `Intent` (`src/types.ts:61`) advertises
   `success`/`warning`/`info`/`default`; the palette (`src/system/themeUtils.ts`)
   defines none of them. The fix freezes across **Button, Chip, IconButton, Panel,
   AppBar** (all share `Intent`), not just Button/Chip — widen P0 #2 accordingly.
4. **`icon` prop type collision is a frozen-vocabulary item that the synthesis's
   Phase-0 batch missed.** `Icon`/`IconButton`/`Chip` use `icon?: string`;
   `SpeedDial` uses required `icon: React.ReactNode`. Add the whole
   `icon`/`data`/`title`/`size`/`variant` overload class (PROP_PATTERNS_AUDIT.md) to
   the Phase-0 accept-or-fix triage (P1 #9).
5. **WCAG 1.4.4 pinch-zoom fix is 4 files, not 3.** `user-scalable=no,
   maximum-scale=1` ships in **`docs/index.html`** *and* all three create-valet-app
   templates (`ts`/`js`/`hybrid`). The docs-site instance is the more visible
   credibility hit for an a11y-first project (P1 #16).
6. **`VERSIONING.md:78` still reads "every component is currently flagged
   `experimental`"** — factually false against the 59-stable corpus and
   self-contradictory. It must be *rewritten* at the cut to state the final
   disposition (the 3 that remain experimental), not merely "re-affirmed."
7. **Architectural call I am elevating: pull the R3F overlay primitives INTO the
   1.0 freeze, not 1.x.** The synthesis defers *all* G (game) primitives to
   fast-follow, which contradicts its own "G is where pre-freeze additive
   investment pays the most." Since G is the **named highest-risk product** and
   adding into a fresh barrel is clean while bolting onto a frozen one forces the
   game onto ≥1.x from day one, land the **transparent/pointer-pass-through
   `Surface` overlay mode, `modal={false}`/`keepBackgroundInteractive`, and an
   exported `Presence`/HUD-layer** *inside* 1.0 — or at minimum reserve their API
   shapes pre-freeze exactly as the SSR per-request context must be (risk #2).

The synthesis report follows unedited.

---

# @archway/valet — Road to a Terrific 1.0.0

*Lead-architect synthesis of 15 subsystem deep-reads + 4 downstream-product probes, with adversarial verifier verdicts applied (refuted findings dropped or downgraded).*

---

## 1. Executive verdict

**valet is ~75% of the way to a confident 1.0 — but that single number hides a real split.** The *library's frozen surface* is roughly **85% ready**; the *downstream-product story* is roughly **60% ready**, and is dominated by one cross-cutting gap (SSR style extraction). The engineering core is genuinely excellent and the in-flight 1.0-prep plan is essentially executed: the deprecation sweep (W1) is verifiably done, the ESM packaging is continuously gated, and **60 of 63 components are already promoted to `stable`** — the prompt's "every component is experimental" premise is stale; only `KeyModal`, `LLMChat`, `RichChat` remain experimental and are correctly carved out of SemVer.

**The architectural insight that should drive every decision before the cut:** the freeze only locks *removals, renames, narrowings, and existing default behavior*. **Adding** new exports, props, components, or an SSR API in a 1.x minor is non-breaking. So the pre-1.0 must-fix list is exactly the *irreversible* items; everything additive (SSR collection API, virtualization, R3F primitives, charts) is legitimately fast-follow. This is what makes a confident 1.0 achievable on a short timeline.

**The 4-5 things that matter most:**

1. **Lock the frozen surface mechanically before it grows.** The barrel is 50 `export *` lines with **no named-export snapshot test**, and two internal symbol sets have already leaked (`isExternalHref`/`isSafeHref`/`isSafeImageSrc` from `src/components/widgets/Markdown.tsx`; orphaned `RowKey<T>` from `Table.tsx:41`). At 1.0 these become frozen; removing them later is a MAJOR. *(Public API)*
2. **Reconcile the frozen vocabulary with the frozen runtime.** `Intent` advertises `success`/`warning`/`info`/`default` but the default palette defines none of them, so `<Button intent="success">` renders blue and `<Chip intent="success">` renders grey (`src/types.ts:61`, `src/system/themeUtils.ts:121-173`, `Button.tsx:257`, `Chip.tsx:161`). Both the type and the palette freeze.
3. **Make the SSR position honest.** There is no server style-collection API; SSR/SSG HTML ships correct hash class names but zero component CSS → unstyled first paint until hydration (`src/css/createStyled.ts:277`, `README.md:75`, `foundation-audit-2026-06-18.md:47`). This is *not* an API-freeze blocker (the fix is additive), but it caps W and A confidence and must be explicitly carved out of the SemVer guarantee in `VERSIONING.md` before the freeze.
4. **Honor the headline a11y/AI-proxy promise where it's currently weakest.** `FormControl.errors` is frozen public API that renders a visible message on only 1 of 9 fields; the three experimental chat/key widgets ship with named accessible-name gaps; and the scaffold disables pinch-zoom. None block the freeze, but they undercut "treats all humans and their AI proxies as first-class users."
5. **Close the release ceremony.** Enable GitHub Private Vulnerability Reporting (W5's own definition-of-done), add a fail-closed `prepublishOnly` to the root package, and write a dated dogfood→1.0 exit checklist.

**Effort shape:** The must-fix-before-freeze list is ~20 items, the large majority **S/M**, no XL. A focused **~2-4 weeks** of work plus a deliberate soak window on 0.37.x clears it. The big-ticket downstream items (SSR extraction XL, table virtualization L, R3F HUD primitives M-L) are **1.x fast-follows** and should be explicitly scheduled as such, not rushed into the freeze.

---

## 2. Definition of Done for 1.0

All of the following must be true to cut 1.0.0. This builds directly on the team's W1-W6 plan state (`dx/plans/valet-1.0-prep-2026-06-14/`).

**A. API freeze surface is locked and mechanically enforced**
- [ ] A **named-export snapshot test** over the built `dist/index.d.mts` + `dist/index.mjs` is checked in and run in CI (the durable mechanism that makes "the public API is exactly the barrel" enforceable).
- [ ] The two confirmed `export *` leaks are curated or removed (Markdown URL helpers; orphaned `RowKey<T>`).
- [ ] The dist-mapped type probe (`dx/type-tests/tsconfig.json` against the shipped `.d.mts`) runs in CI `typecheck`, not just the src-mapped one.
- [ ] Frozen-vocabulary irreversibles are resolved: `Intent`↔palette, `SelectOptionProps` narrowing, `equalize`/`normalizeRowHeights`, `thickness` units, `alignX` RTL meaning, `motion.underline`/`motion.hover` disposition, `Video.onError` type.

**B. Experimental→stable promotion is complete or formally scoped** *(already 60/63)*
- [ ] The final 3 (`KeyModal`, `LLMChat`, `RichChat`) are either fixed-and-promoted or explicitly documented as experimental/preview, with `VERSIONING.md`'s experimental carve-out re-affirmed.
- [ ] The plan trackers are reconciled to one authoritative record (currently `execution.md` vs `verification-order.md` vs `widget-sweep-handoff.md` disagree; Dropzone is promoted but absent from `verification-order.md`).

**C. Packaging / CI gates are green and fail-closed** *(mostly done)*
- [ ] `verify:pack`, `check:package` (publint + attw esm-only), `check:engine`, `check-bundle` (12KB Button ceiling), `mcp:schema:check`, `mcp:check` all green in CI (currently true).
- [ ] Root `@archway/valet` gains a `prepublishOnly` that re-runs the §1 gate (the frozen package currently has the weakest publish guard of the four).
- [ ] The "zero deprecated props" invariant remains CI-gated (`scripts/mcp/validate.mjs` — done).

**D. Accessibility bar**
- [ ] `FormControl.errors` renders a visible, `role="alert"` message on all 9 fields (today only `TextField`).
- [ ] The 7 fields drop always-on `aria-live` on neutral hints and fix the `theme.colors.text + 'AA'` hex bug (breaks under non-hex brand themes).
- [ ] The three experimental widgets' named a11y blockers are landed, or the widgets are formally scoped out.
- [ ] A decision is recorded on landmarks/skip-links (add `<main>`+skip to `Surface`, or document it as the app's responsibility).

**E. Docs accuracy & completeness**
- [ ] Every barrel-exported component has a reachable doc page: add `LoadingBackdrop` + `FormControl` pages and the missing `Parallax` NavDrawer entry.
- [ ] An R3F/canvas-overlay guide + the public z-index API (`VALET_ZINDEX`/`zVar`/`zIndexVarName`/`ZIndexLayer`) are documented.
- [ ] MCP docs page stale numbers fixed (28 components → 62; 0.31.x → 1.0.x).
- [ ] `VERSIONING.md` explicitly carves SSR style-extraction out of the 1.0 SemVer guarantee.

**F. MCP corpus matches the frozen barrel**
- [ ] `ValetLocaleProvider` (and its i18n companions) are present in the corpus (extractor currently scans only `src/components/**`).
- [ ] Peer range bumped to the 1.0 line; the MCP↔valet minor-lockstep version-parity policy is written into `VERSIONING.md`.
- [ ] `validate_jsx` works on the documented install path (promote `@archway/valet` to a true `optionalDependency`, or rewrite Quick Start to a local install).

**G. Release governance**
- [ ] GitHub Private Vulnerability Reporting is live (`SECURITY.md` still warns the channel does not exist — W5 DoD).
- [ ] `dx/RELEASING.md` has a durable 1.0.0 section (BREAKING `[1.0.0]` changelog entry, zero-deprecated gate, fix 0.x-isms in §7/§8).
- [ ] A **written, dated dogfood→1.0 exit checklist** exists (soak window, 3-widget disposition, PVR live, readiness eval re-run green).

---

## 3. Prioritized 1.0 blockers (deduplicated, ranked)

> Refuted/downgraded by the verifier and **dropped from the blocker list**: the "FieldBaseProps over-promises fullWidth/helperText/error" claim (only `fullWidth` is a no-op; additive to fix), the "AI-proxy marker is a defeatable source-scan" claim (41/47 components have runtime root assertions), "no SSR/SSG template" as a *blocker* (separate package, outside the freeze), "committed coverage report" as *high* (not published; trivial cleanup), and "no written dogfood exit criteria" as *high* (intentionally human-reserved). These survive only as low-priority hygiene items below.

### Must-fix before 1.0 — P0 (freeze-gating or confidence-defining)

| # | Item | Area | Effort | Why (one line) |
|---|------|------|--------|----------------|
| 1 | Named-export snapshot test + remove the 2 leaked symbol sets | Public API (`src/index.ts`) | M | 50 `export *` with no snapshot → surface silently grows; leaks freeze at 1.0 (removal = major). |
| 2 | Reconcile `Intent` ↔ default palette (add success/warning/info[/default] tokens w/ WCAG hues + align Button/Chip fallbacks) | Theme + fields/widgets | M | 4 of 7 frozen intents render the wrong color; Button (blue) and Chip (grey) disagree. |
| 3 | Narrow `SelectOptionProps` to `value/disabled/children/sx` (drop `LiHTMLAttributes`) | fields/Select | S | Over-wide type promises DOM passthrough the marker component ignores; narrowing later = breaking. |
| 4 | `VERSIONING.md` + README: carve SSR style-extraction out of the SemVer guarantee; state FOUC position | Docs/Versioning | S | Sets honest W/A expectations; the additive fix can then ship in 1.x without surprise. |
| 5 | Render `FormControl`/field error **message** on all 9 fields (shared `role="alert"` region) | fields | M | Frozen public `errors` API is functional on only 1/9; D/A validation messages are invisible. |

### Must-fix before 1.0 — P1 (irreversible naming/semantics, a11y, release)

| # | Item | Area | Effort | Why |
|---|------|------|--------|-----|
| 6 | Reconcile `equalize` (Grid) vs `normalizeRowHeights` (Panel) | Layout | S | Two frozen names for one cooperative feature. |
| 7 | Resolve `thickness` unit collision (Divider = stroke multiplier; ProgressRing = px) | Primitives | S | Same prop name, two mental models, same subsystem — frozen. |
| 8 | Pin/document `alignX` `'left'`/`'right'` as logical (RTL-mirrored); consider adding `'start'`/`'end'` | Layout | S | Physical names + logical behavior is ambiguous on an RTL-first 1.0; meaning freezes. |
| 9 | Decide `motion.underline`/`motion.hover` (demote/optional/move out of public `Theme`) | Theme | S | A Tabs-only detail freezes into the global token contract forever. |
| 10 | Unify ref-forwarding across all 8 primitives; give `Video` an element handle | Primitives | M | 5/8 split bakes in a footgun; Video has no play/pause/seek access (W/G/D). |
| 11 | Enforce `Avatar` accessible name (require `alt` or derive from `name`/`email`) | Primitives | S | Sibling `Image` requires `alt`; unlabeled `<Avatar src>` fails WCAG 1.1.1. |
| 12 | Propagate TextField helper/error patterns to 7 fields (drop always-on `aria-live`; fix `+'AA'` color bug via `makeMix`) | fields | S | a11y inconsistency at freeze + a real theming-correctness bug under non-hex brand themes. |
| 13 | Sticky `thead` under `constrainHeight` | widgets/Table | S | Flagship dashboard table drops its header on scroll (CSS-only fix). |
| 14 | Land named a11y fixes for the 3 experimental widgets, or formally carve | widgets | L | RichChat composer/KeyModal modal have no accessible name — exactly the AI-proxy surface. |
| 15 | Fix `Video.onError` type (`ErrorEvent` → actual React event) | Primitives | S | Wrong public type freezes; correcting later is breaking. |
| 16 | Root `@archway/valet` `prepublishOnly` fail-closed gate | Release | S | The frozen package has the weakest publish guard of the four. |
| 17 | Enable GitHub Private Vulnerability Reporting | Release/operator | S | W5's own DoD; `SECURITY.md` still warns the channel doesn't exist. |
| 18 | Remove `user-scalable=no, maximum-scale=1` from create-valet-app templates | Scaffold | S | WCAG 1.4.4 failure shipped by an a11y-first project's scaffolder (mobile ad traffic). |
| 19 | R3F/overlay + z-index API docs guide | Docs | M | Highest-risk lens; the only frozen public API with zero docs. |
| 20 | Component-doc completeness: `LoadingBackdrop` + `FormControl` pages, `Parallax` nav entry | Docs | M | Frozen exports with no/unreachable pages break the "every component documented" claim. |
| 21 | `git rm -r coverage/` + `.gitignore` + CI text-summary artifact | Tests | S | Committed report claims 0.65% (real ~82%) and self-destructs on local runs. |
| 22 | 1.0 runbook section in `dx/RELEASING.md` + dated dogfood→1.0 exit checklist | Release | M | Runbook is still 0.x-shaped; the cut hinges on an unwritten judgment call. |
| 23 | MCP: add `ValetLocaleProvider` to corpus; bump peer to 1.0; write version-parity policy | MCP | S-M | Corpus must match the frozen barrel; minor-lockstep cadence is an unstated contract. |
| 24 | MCP `validate_jsx` works on documented install (`optionalDependency` or local Quick Start) | MCP | M | The flagship "better than docs" tool is non-functional in the README's global install. |
| 25 | Fix MCP docs page stale numbers (28→62, 0.31.x→1.0.x) | Docs | S | >2x-wrong component count on the page that markets the MCP. |

### Fast-follow (1.x — additive, non-breaking; explicitly *not* gating the freeze)

- **SSR/SSG style collection**: `getServerStyles()`/`flushStyles()` built on existing `pendingRules`/registry + per-request isolation. *(XL — but reserve the per-request context shape pre-freeze, since it may touch the engine surface.)*
- **R3F/game primitives**: a transparent/pointer-pass-through HUD overlay mode for `Surface`, a non-blocking `Modal` mode (`modal={false}`), an exported `Presence` helper. *(M-L)*
- **Dense-table capability**: virtualization, server-side mode (`manualSort`/`manualPagination`/`rowCount`/`loading`/empty state), horizontal scroll, column width/resize/pin. Plus `List`/`Tree` windowing. *(L)*
- **Charts theming bridge + recipe; generic `Menu`/`Popover`; `Combobox`/`Autocomplete`; form-validation helper (zod adapter → name-keyed errors).** *(M-L each)*
- **Engine perf-regression baseline gate** (promote `engine-bench` to a soft gate); **coverage threshold floor** seeded at current baseline. *(M)*
- **Supply chain**: CI publish workflow with `npm publish --provenance` via OIDC, npm 2FA, named co-maintainer; Dependabot + CodeQL + dependency-review. *(M)*
- **Theming**: live OS `prefers-color-scheme` follow; scoped/section color theming; typed `BuiltinColorToken` surface. *(M-L)*
- **Motion a11y**: export `usePrefersReducedMotion`; gate `Video` autoplay + a reduced-motion path for `WebGLCanvas`. *(S)*
- **SSG/marketing scaffold template** + SEO meta + theme no-flash helper; bound the `vite` range in templates. *(L / S)*
- **AI-proxy hardening**: an all-exports `renderToString` root-marker gate; automated axe pass over default renders. *(M)*

---

## 4. Per-product readiness

### W — Brand marketing website — **55/100**
**Verdict:** Beautiful and on-brand as a CSR SPA; not yet "terrific" for the SSR/SSG brief.

- **What works:** real brand theming (`themeStore` + `definePreset`), CLS/LCP-aware `Image` (`priority`→eager+`fetchpriority=high`, intrinsic-size attrs), pure-CSS `@media` responsive `Stack`/`Grid` with no JS reflow, SSR-safe portalled `AppBar`, privacy-by-default self-hosted fonts, no client FOUC (rules flush in `useInsertionEffect` before paint).
- **Defining gap:** **no server style-collection API** → SSR/SSG ships correct class names but no rules → unstyled first paint until hydration (`src/css/sheet.ts:135`, `createStyled.ts:277`). The process-global registry (`sheet.ts:68`) also blocks per-request isolation.
- **Secondary gaps:** `Surface` defaults to a fixed full-screen app-shell, not document flow (footgun for long scroll pages — pass `fullscreen={false}`); no head/SEO helper (framework's job, but undocumented); theme-mode persistence/system-follow can flash + hydration-mismatch under SSR; no SSG scaffold.
- **Add/fix:** ship `getServerStyles()` (or at minimum a documented critical-CSS prerender recipe) and reserve its architecture pre-freeze; an SSG template + SSR integration guide; a theme no-flash helper; document `fullscreen={false}` as the marketing default.

### G — R3F video-game HUD over a live canvas — **65/100** *(highest-risk, most novel)*
**Verdict:** More ready than its "DOM kit" label suggests, but it ships no game-specific primitive and its mandatory screen root fights the over-canvas use case. A competent dev can build a good HUD today via `Box`+`sx` escape hatches; nothing is structurally broken; valet just offers no first-class scaffolding.

**Strengths (genuinely de-risked):**
- **The engine is rAF-safe by construction.** Render only computes cached class names; all CSSOM mutation defers to `useInsertionEffect` (`createStyled.ts:277`); valet re-renders are driven by zustand, not the rAF loop, so the engine does not thrash next to a 60fps `<Canvas>`. Continuous values go through inline style/CSS vars (`Progress.tsx:186`), and a **dev cardinality tripwire** warns if you leak an immortal rule (`createStyled.ts:69,203-217`).
- **Clean coexistence with @react-three/fiber's custom reconciler** — valet renders only to the DOM tree; peers are just react/react-dom/zustand; singletons dedup via one `globalThis` registry.
- **Layering is a real strength:** one ordered, CSS-var-overridable z-index scale (1050-1600), exported as `VALET_ZINDEX`/`zVar`, repo-enforced against stray literals.
- **Non-blocking overlays exist:** `Select`/`Tooltip`/`SpeedDial`/`Snackbar` register with `inertBackground:false`, so a FAB menu or toast floats over a still-interactive canvas. Focus trap/restore is mature and `isConnected`-guarded.

**Gaps (ergonomic, not correctness):**
- **No HUD-layer / Portal / Presence primitive is exported**, and `getOverlayRoot`/`useOverlay` are internal — pointer pass-through and reusable portaling are DIY.
- **`Surface` is an opaque, `position:fixed`/`inset:0`, pointer-eating event sink by default** (`Surface.tsx:229-244`), throws on nesting, and is mandatory (every component throws without it). The over-canvas pattern (`sx={{ background:'transparent', pointerEvents:'none' }}` + interactive islands at `pointerEvents:'auto'`) works but is undocumented and fights the defaults.
- **`Modal` hardcodes `inertBackground` + `trapFocus`** (`Modal.tsx:239-241`) with no opt-out and returns `null` on close (enter-only animation) — there's no way to show a floating panel that keeps the canvas live, and no generic exit-presence.
- **Zero R3F guidance/example.** `WebGLCanvas` is valet's own raw WebGL2 host, *not* an R3F `<Canvas>` — useful only as a reference pattern.
- **Watch-out for D/G:** a `Surface` whose subtree mutates every frame triggers a `getBoundingClientRect` per frame via its ResizeObserver/MutationObserver (`Surface.tsx:129-159`) — guide HUD content to live outside the measured subtree.

**Add/fix (G is where pre-freeze additive investment pays the most):** a documented transparent/pass-through overlay mode (or exported HUD layer that joins the z-scale + overlay stack); a `modal={false}`/`keepBackgroundInteractive` prop; an exported `Presence`/portal helper; and a runnable "valet UI over an R3F canvas" concept doc covering pointer pass-through, z-index interleaving via `--valet-zindex-*` overrides, focus-over-canvas, and the "route per-frame values through inline style/CSS vars, never a `styled` template" rule.

### D — Internal dashboards — **60/100**
**Verdict:** Strong for small/medium dashboards; weak for serious large-data ones.

- **What works:** complete, stable app-shell (`Surface`+`AppBar`+`Drawer`+`Tabs`); **best-in-class density** (global `tight/standard/comfortable` + an orthogonal `compact` boolean that cascades across portals); a solid mid-size `Table` (keyboard-operable sort + `aria-sort`, selection that survives immutable live refresh keyed by `getItemKey` — `Table.tsx:539-574`, a real live-update win); good form plumbing (`createFormStore`+`FormControl`: async submit, name-keyed errors, `isSubmitting`/aria-busy, focus-first-invalid); live-data ergonomics via `Snackbar`/`LoadingBackdrop`/zustand.
- **Hard gaps:** **zero virtualization** anywhere (Table/List/Tree render all rows); **no charts** component or theming bridge; Table has **no server-side mode** (always sorts/paginates the full client array), **no sticky header**, **forced `overflow-x:hidden`** with even-width `table-layout:fixed` (wide tables wrap instead of scroll), no column resize/pin/reorder, no empty/loading state; **no generic `Menu`/`Popover`** for row actions; no filtering `Combobox`.
- **Freeze-gating subset (resolve defaults now):** Table's `overflow-x:hidden` and `table-layout:fixed` are *visual defaults* that freeze (`Table.tsx:116,140`) — decide the intended default this cycle even if `scrollX`/`stickyHeader`/per-column `width` props land additively in 1.x. Everything else (virtualization, server mode, Menu) is additive fast-follow.
- **Add/fix:** sticky `thead` (S, pre-1.0); then a sanctioned large-data path (windowing or a documented headless/`react-window` recipe that inherits theme tokens + Table server-side props); `emptyPlaceholder`/`loading`; a `Menu`/`Popover` built on the existing overlay system; a charts theming bridge.

### A — Ad campaign landing pages — **60/100**
**Verdict:** Excellent bundle story and a strong, accessible conversion toolbox; missing the one thing that defines a high-converting ad LP — fast server-rendered first paint.

- **What works:** first-class tree-shaking (per-module ESM, Button-only ~6.4KB gzip, 12KB CI ceiling); polymorphic `Button` (`as='a'`+href for tracked CTAs, spreads native `onClick`/`data-*`); LCP/CLS-aware `Image`; accessible `Modal`/`Snackbar`/`Drawer`; `FormControl`+`createFormStore` for async submit with full ARIA; analytics via escape hatches (native handlers, `data-*`, `onSubmitValues`, `ValetErrorBoundary.onError`).
- **Defining gap:** same SSR-CSS gap as W → blank/FOUC first paint cripples LCP/CLS, which directly drive Ad Quality Score and conversion. Compounded by the **client-only Vite SPA scaffold** (empty `<div id="root">`).
- **Secondary:** the scaffold **disables pinch-zoom** (WCAG 1.4.4 — one-line fix, must-do for an a11y-first 1.0); conversion forms have **no built-in validation** (values-only store) and submit always `preventDefault`s (SPA-only, no progressive enhancement); no head/meta helper for per-variant OG/title.
- **Add/fix:** the SSR collection API (or critical-CSS prerender recipe); fix the viewport meta; a lightweight validation helper + a documented conversion-form + pixel recipe; an "ad landing page" playbook (bundle budget, `Image priority` hero, brand theme, preset-driven A/B variants).

---

## 5. Sequenced roadmap

Work splits cleanly into parallel tracks; the freeze-gating items gate the cut, the additive items don't.

### Phase 0 — Freeze-surface lockdown (gates everything; ~3-5 days)
1. Land the **named-export snapshot test** + dist-mapped type probe in CI, then remove/curate the two leaks. *(Public API)*
2. Resolve every **irreversible vocabulary item** in one batch: `Intent`↔palette, `SelectOptionProps`, `equalize`/`normalizeRowHeights`, `thickness`, `alignX`, `motion.underline`/`hover`, `Video.onError`. *(Theme + Layout + Primitives + fields)*
3. Update `VERSIONING.md`: SSR carve-out, experimental carve-out re-affirmation, MCP version-parity policy.

*Rationale:* nothing else should merge into the freeze branch until the surface these tests guard is settled.

### Phase 1 — Correctness & a11y to the 1.0 bar (parallel with Phase 0; ~1 week)
- **Track A (fields/a11y):** `FormControl` error message on all 9 fields; propagate TextField helper/error patterns (kill always-on `aria-live`, fix `+'AA'` color bug); `Avatar` accessible name.
- **Track B (primitives):** unify ref-forwarding + `Video` handle; `WebGLCanvas` fallback out of `aria-hidden`.
- **Track C (widgets):** sticky `thead`; land the 3 experimental widgets' named a11y fixes (RichChat composer name, KeyModal modal name + real inputs, LLMChat status control) **or** formally carve them.

### Phase 2 — Docs, MCP, release ceremony (parallel; ~1 week)
- **Docs:** R3F/overlay + z-index guide; `LoadingBackdrop`/`FormControl` pages + `Parallax` nav entry; MCP page numbers; SSR status page; fix scaffold viewport meta.
- **MCP:** add `ValetLocaleProvider` to corpus; `validate_jsx` install fix; peer range bump.
- **Release:** root `prepublishOnly`; coverage `git rm` + gitignore; 1.0 runbook section; **enable PVR**; reconcile plan trackers to one source of truth; **write the dated dogfood→1.0 exit checklist**.

### Phase 3 — Dogfood soak → cut
- Re-run the 14-dimension readiness eval (`.claude/wf-1.0-readiness.js`) against the post-fix surface to confirm no regression. Follow `verification-order.md`'s two-gate promotion discipline for any re-touched component. When the exit checklist is green and the soak window elapses, flip `[Unreleased]`→`[1.0.0]`, freeze the barrel, tag.

### Immediate 1.x fast-follows (schedule explicitly, ship in minors)
1. **SSR style collection** (W/A unblock) — highest downstream leverage; reserve its per-request context shape during Phase 0 so the 1.x add is clean.
2. **R3F HUD primitives** (G) — transparent overlay mode, `modal={false}`, `Presence`.
3. **Dense-table capability** (D) — virtualization/server-mode/horizontal-scroll/column sizing; then `Menu`/`Popover`, `Combobox`, charts bridge.
4. **CI hardening** — perf-regression baseline gate, coverage floor, provenance/OIDC publish, Dependabot/CodeQL.
5. **SSG scaffold template** + SEO/theming-no-flash story.

---

## 6. Top risks & unknowns

1. **Scope creep turns additive fast-follows into freeze-gating "blockers."** The single biggest risk to the *timeline* is treating SSR extraction, virtualization, or R3F primitives as 1.0 requirements. They are non-breaking 1.x adds. **De-risk first:** explicitly publish the must-fix vs fast-follow split (Section 3) and the carve-outs in `VERSIONING.md` so the team holds the line.

2. **The SSR architecture could force a breaking retrofit if deferred blindly.** The collection API itself is additive, but a *per-request style context* may need to touch the engine surface (`sheet.ts:68`, `createStyled.ts:105`) that 1.0 freezes. **De-risk first:** design and reserve the per-request collector/context shape *before* the freeze, even if implementation ships in 1.1.

3. **The dogfood→1.0 decision is an unwritten judgment call.** Every code workstream is done; "proven in use" has no defined soak window, acceptance gate, or date. This risks the freeze slipping indefinitely *or* being cut without agreed criteria. **De-risk first:** the dated exit checklist (Phase 2).

4. **The frozen vocabulary contradictions are quiet but permanent.** `Intent` rendering the wrong color and `thickness`/`equalize`/`alignX` ambiguities are "compiles-but-misbehaves" issues that get baked in and can only be undone with a major. They are cheap now and expensive forever. **De-risk first:** Phase 0 batch.

5. **The AI-proxy and a11y headline promises are weakest exactly where they're most marketed.** The chat/key widgets (the AI-key-entry path), `FormControl.errors` (forms), and the missing landmark story sit behind "treats all humans and their AI proxies as first-class users." Shipping 1.0 with known accessible-name gaps on those surfaces is a credibility risk even though it's not a hard freeze blocker. **De-risk first:** Phase 1 Track C + the all-exports root-marker gate as fast-follow.

6. **Operator/bus-factor items can stall the actual publish.** PVR, npm 2FA, a named co-maintainer, and a fail-closed root `prepublishOnly` are not code — they're operator actions with bus-factor 1. **De-risk first:** treat them as explicit checklist gates in the 1.0 runbook, not assumptions.

7. **Plan-tracker drift could hide an un-promoted or regressed component.** With `execution.md`, `verification-order.md`, and `widget-sweep-handoff.md` disagreeing (and Dropzone promoted but unlisted), there's a small risk a component is mis-tracked at freeze. **De-risk first:** collapse to one authoritative tracker and re-run the readiness eval before the cut.

**Net:** the library is close, the plan is mature, and the path is short — provided the team rigorously separates the irreversible must-fixes (Section 3, P0/P1) from the additive 1.x work and refuses to let the latter gate the freeze.