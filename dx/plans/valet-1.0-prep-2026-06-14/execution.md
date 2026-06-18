# Valet 1.0 Prep — Execution Tracker

> Live progress log for [`plan.md`](plan.md). **Last updated: 2026-06-17.
> Status: W1–W6 CODE-COMPLETE & GREEN on `feat/valet-1.0` (7 commits off
> `development`). Every CI-equivalent gate passes — lint, typecheck×4, build,
> 1345 tests, check:package (publint+attw), verify:pack, check:engine,
> check:bundle, mcp:schema:check + mcp:check, docs tsc. Ready for Ben's 1.0.0
> cut. Remaining is operator/human-elevation only (Wave 4 + PVR) — see hand-off.**
>
> **Pre-1.0 re-test pass (2026-06-14):** every component reset to `experimental`;
> verify bottom-up and promote to `stable` per
> [`verification-order.md`](verification-order.md) (topological order from the real
> import graph). Plus spacing polish committed: role-aware Grid/Panel defaults,
> Grid equal-width children, density scale tightened+centralized (0.8/0.9/1.0).

## Status at a glance

The 1.0 readiness evaluation is complete (v0.36.0, ~85%, release-candidate
quality). There is exactly **one blocking workstream** — the deprecation removal
sweep (W1) — that the project's own policy mandates; the 10 "confirmed blockers"
all reduce to it. The foundation (engine, security, packaging, perf, test
discipline) is 1.0-grade and is **not** reopened. Remaining work is W2–W5
(confirmed majors) plus a W6 minor tail slated for 1.0.x.

## Branch strategy

- **`feat/valet-1.0`** = the single cumulative epic branch, off `development`.
  Plan + execution log + every 1.0-prep wave (W1–W5) land here, each building on
  the last. Waves are commit groupings, **not** separate PRs.
- **No PRs / no merges** to `development` or `main` without Ben. The first and only
  PR(s) come in **Wave 4, near the 1.0.0 cut**, integrating the whole epic line.
- W6 (minor tail) stays off the critical path — opportunistic commits on the epic
  branch or a 1.0.x fast-follow after the cut.

## Workstream progress

| WS | Title | State | Notes |
| --- | --- | --- | --- |
| **W1** | DEPREC — remove all alias props (7 components) + 3 stragglers | ✅ done + verified | Blocker cleared. 11 alias props + `deprecate.ts` removed; `Typography.bold`→`weight`, `Progress` wrapper→`ProgressBar`/`ProgressRing`, `Tabs.tabAlign`→`alignX`. MCP alias-floor gate inverted to the 1.0 invariant (corpus carries 0 deprecated props). **Tree excluded** (no aliases); `SurfaceState.children` veto carve-out preserved. Green: lint 0 err, typecheck (src+scripts+mcp), 1247/1247 tests, check:engine/verify:pack/check:bundle/check:package, mcp:schema:check + mcp:check, docs tsc. |
| **W2** | A11Y-NAMES — wire `label` into Switch/Slider/Select/Iterator | ✅ done + verified | Major cleared (+ the prop-consistency "FieldBaseProps does nothing" finding). All four render `label`+`helperText` visibly and associate them (aria-labelledby / native htmlFor); dev accessible-name guards added; new `fieldsAccessibleName.a11y.dom.test.tsx` (15 tests). Also fixed a pre-existing WCAG defect: `DateSelector`'s internal month/year Selects were unnamed → `aria-label`. Green: tsc, lint, 1262/1262 tests, build. |
| **W3** | SSR — guard AppBar/Drawer crashes + Accordion hydration | ✅ done + verified | Major cleared. AppBar portal now mounted-gated (SSR-safe, no hydration mismatch); Drawer's `HTMLElement` useState init guarded; Accordion reduced-motion now via `usePrefersReducedMotion` (server snapshot false). New `src/ssr-render.test.ts` renderToString gate (CI runs post-build). Green: tsc, lint, 1265/1265, build. Note: an OPEN overlay Drawer/Modal portals to the overlay root — a client-only scenario by design. |
| **W4** | TYPES — curate barrel, type `sendChat`, kill `export *` leaks | ✅ done + verified | Major cleared. `sendChat` → `Promise<ChatCompletion>` (new named type); aiKeyStore barrel curated (dropped `encrypt`/`decrypt` from the public surface; explicit `useAIKey`/`sendChat`/`AIProvider`/`ChatMessage`/`ChatCompletion`); bare `Variant` un-exported (only `TypographyVariant` public). Type-probes now **gated** (`typecheck:types`) and inverted to assert the 1.0 surface rejects removed aliases. Green: typecheck×4, check:package (publint+attw), 1265/1265, build. |
| **W5** | RELEASE-POLICY — PVR, VERSIONING.md, experimental flags, injectRemote, PR-CI check:package | 🟦 mostly done | `VERSIONING.md` written (+ README/CONTRIBUTING pointers); `injectRemote` flipped true→false (Q13, +tests/docs/CHANGELOG); experimental→stable for Accordion/Table/DateSelector, the rest (LLMChat/RichChat/KeyModal/Parallax×3) carved out in VERSIONING.md; `check:package` + `mcp:check` added to PR CI. Green: 1266/1266, docs tsc, mcp gates. **Remaining: [operator] enable GitHub Private Vulnerability Reporting** (§6 — agent cannot). |
| **W6** | TAIL — minors (PBKDF2, MD-XSS test, untested components, coverage, mcp pins, bump.mjs) | ✅ done + verified | PBKDF2 120k→600k (OWASP); Markdown XSS regression suite (5 cases); `create-valet-app` bump.mjs dead docs-path removed; `check-pins` now gates `valet-mcp` (+optionalDependencies); coverage tooling wired (`@vitest/coverage-v8` + `test:coverage`, measurement-only); KeyModal docs page added + routed; **12 untested components now tested (74 new tests)**; Chip got the missing `data-valet-component` marker; FontsPrivacy docs reconciled to default-false. Green: lint, typecheck×4, **1345/1345**, check:package, mcp gates, docs tsc, build. **Deferred (info-level / by-design):** engine hash-collision-guard & insert-retry are accepted tradeoffs; coverage-CI + engine-bench perf thresholds need a committed baseline first. |

State key: ⬜ not started · 🟦 in progress · ✅ done + verified · ⛔ blocked.

## W1 — deprecation sweep checklist

- [ ] Accordion — remove `open` / `defaultOpen` / `onOpenChange` (`Accordion.tsx:224/230/236`); drop resolves `:309-317`; delete `Accordion.deprecate.dom.test.tsx`.
- [ ] Pagination — remove `onChange` (`:28`); drop resolve `:241`; delete `Pagination.deprecate.dom.test.tsx`.
- [ ] RadioGroup — remove `spacing` (`:163`); drop resolve `:282`; delete `RadioGroup.deprecate.dom.test.tsx`.
- [ ] Panel — remove `normalizeRowHeight` (`:44`); drop resolve `:163`; delete `Panel.deprecate.dom.test.tsx`.
- [ ] Switch — remove `onChange` (`:123`); drop warn `:195`; rewrite the deprecation block in `Switch.dom.test.tsx`; **document migration** (raw-event → onValueChange / native onClick).
- [ ] Table — remove `selectable` + `rowKey` (`:60/:67`); drop resolves `:341/:352`; trim `Table.selection.dom.test.tsx`.
- [ ] List — remove `selectable` + `getKey` (`:37/:66`); drop resolves `:220/:229`; trim `List.selection.dom.test.tsx`.
- [ ] Delete `src/system/deprecate.ts` + `deprecate.test.ts` once grep for `resolveDeprecatedProp|deprecateProp` is clean (keep `warnOnce`).
- [ ] Stragglers per §7: Typography.bold, Progress.showLabel (+ wrapper), Tabs.tabAlign.
- [ ] Verify: `grep -rn '@deprecated' src/components` returns nothing; rebuild; `dist/index.d.mts` carries no alias `@deprecated` except `SurfaceState.children`; full suite green.

## W2–W5 checklists

**W2:** [ ] Switch `:166` · [ ] Slider `:250` · [ ] Select `:232` · [ ] Iterator `:132` wire `label` → name · [ ] dev accessible-name guard · [ ] 4 regression tests.

**W3:** [ ] AppBar portal guard (`:394-395`) · [ ] Drawer `HTMLElement` guard (`:251-252`) · [ ] Accordion → `usePrefersReducedMotion` (`:696-699`) · [ ] productionize renderToString gate in `scripts/checks/`.

**W4:** [ ] type `sendChat` return (`aiKeyStore.ts:245`) · [ ] curate `src/index.ts:6` (drop bare `Variant`) · [ ] curate `:70` aiKeyStore star (`ChatMessage`/`encrypt`/`decrypt`) · [ ] gate `dx/type-tests` in CI.

**W5:** [ ] enable PVR (operator) · [ ] write `VERSIONING.md` · [ ] rule + apply the 10 experimental flags · [ ] flip `injectRemote` + CHANGELOG BREAKING · [ ] add `check:package` to `ci.yml` (and optionally `mcp:check`).

## Hand-off — the [Ben] / operator list

Things the agent cannot or should not do:

1. **[operator]** Enable **Private Vulnerability Reporting** in repo settings (or
   repoint `SECURITY.md` to a working channel). Blocks W5.
2. **[operator]** Publish hardening — npm 2FA + provenance; bus-factor. Roadmap,
   not a hard 1.0 gate.
3. **[Ben]** Rule the §7 register — the four stragglers, the experimental set, the
   veto carve-out, the injectRemote timing, and the scope line. Blocks W1 close + W5.
4. **[Ben]** Final go/no-go + the `1.0.0` version tag and `npm publish`.

## Decisions register (pending Ben — mirrors plan §7)

| # | Decision | Ruling | State |
| --- | --- | --- | --- |
| 1 | Switch.onChange removal (raw event, not rename) | **Remove** + document migration | ✅ ruled 2026-06-14 |
| 2 | Typography.bold | **Remove** (migrate to weight) | ✅ ruled 2026-06-14 |
| 3 | Progress.showLabel + back-compat wrapper | **Remove** (transitional shim) | ✅ ruled 2026-06-14 |
| 4 | Tabs.tabAlign | **Collapse to `alignX`**, no alias | ✅ ruled 2026-06-14 |
| 5 | SurfaceState.children veto carve-out | Hold (ships 1.0, leaves in a future major) | ✅ holds |
| 6 | 10 experimental components | **Promoted Accordion/Table/DateSelector → stable; carved out LLMChat/RichChat/KeyModal/Parallax×3** in VERSIONING.md | ✅ done W5 (Ben can veto via meta `status`) |
| 7 | injectRemote flip timing | **Flipped true→false** (Q13) on the epic branch (lands at the 1.0 cut) | ✅ done W5 |
| 8 | Scope line | **1.0 = W1–W6 (everything); no 1.0.x fast-follow** | ✅ ruled 2026-06-14 |

## Re-test pass — verification log

Bottom-up promotions per [`verification-order.md`](verification-order.md).
**`stable` gates on BOTH the agent pass (tests + source review) AND Ben's visual
pass** — green tests are necessary, not sufficient. The agent verifies and leaves
the component `experimental`, logged as _agent-verified, awaiting Ben's visual
pass_; only after Ben's visual confirmation does `*.meta.json` flip to `stable`
(then `mcp:build && mcp:check && mcp:schema:check`).

- **Tier 1 leaves — DONE (stable):** Icon, Typography, Progress
  (ProgressBar/ProgressRing), Avatar, Image, Divider, Video, WebGLCanvas.
  - *WebGLCanvas* (promoted 2026-06-17) also gained a docs scene — a raymarched
    "Tron City" flyover shader — plus a fan-out pass of **look-preserving** perf
    optimizations (terrain-gated raymarch step factor, per-row `zoneType` hoist +
    whole-row skip, zone/CSE reuse, `mediump` bloom passes; 28 analyzed → 16
    verified pixel-safe). Docs page de-WIP'd to a generic component explainer
    (Pause/Speed playground removed).
- **FormControl — REVIEWED, NOT promoted (2026-06-17).** Tests green (74 across
  `FormControl.dom` + `controlledContract` + `createFormStore` + `useControlledState`);
  source clean (SSR-safe, `data-valet-component` marker, intentional store-type
  erasure with casts localized to `useForm`/`useOptionalForm`). Left `experimental`
  pending Ben's manual pass.
- **ValetErrorBoundary — AGENT-VERIFIED, NOT promoted (2026-06-17).** Last Tier 1
  leaf. Tests green (6 in `ValetErrorBoundary.dom`: pass-through, catch→role='alert'
  panel, onError-once, reset()→re-render, static + render-fn fallback, no-Surface/
  no-theme-vars). Source clean: deliberately self-contained class boundary — no
  `styled()`/theme/`useSurface`, so it survives failures in the surface tree
  itself; SSR-safe (no browser globals). No `data-valet-component` marker by
  design — children pass-through with no consistent owned root; documented in the
  marker-gate ALLOWLIST (`dataValetComponentMarker.repo.test.ts`). Docs demo
  (`ValetErrorBoundaryDemo.tsx`) exercises a custom fallback + reset. **Left
  `experimental` pending Ben's visual pass.** _(An earlier commit flipped it to
  `stable` prematurely on the agent pass alone; reverted — see the gate rule above.)_
- **Tier 2 — Box / Stack / Grid: AGENT-VERIFIED, NOT promoted (2026-06-17).** The
  spacing/density retune center; each reads only the surfaceStore *contract*. Tests
  green (20 in `Box.dom`/`Stack.dom`/`Grid.dom`; 126 across the whole layout dir +
  `compactContext`). Source clean and the retuned numbers are pinned by tests: Grid
  default gap 2× (card-grid gutter) + equal-width children via `--valet-panel-width:100%`;
  Stack default gap 1×; density 0.8/0.9/1.0 written inline as `--valet-space`; `compact`→0.
  Box/Stack are SSR-safe (`useTheme`+`useCompact`); Grid requires a `<Surface>` by
  design (`useSurface` hard-throws otherwise) and is SSR-exercised inside one
  (`ssr-render.test.ts`). Also fixed Box's meta: dropped a stale best-practice
  reference to the removed `centered` prop (→ `centerContent`). **All three left
  `experimental` pending Ben's visual pass — Ben testing now.**
- **Stack & Grid — first-class redesign (decided 2026-06-17).** Ben: "Grid and
  Stack need to be first class … better than MUI, shadcn." Ran an adversarial
  16-agent evaluation (4 recon → 4 design stances → red-team → 3 judges →
  synthesis); verdict + concrete APIs + phased plan in
  [`stack-grid-evaluation-2026-06-17.md`](stack-grid-evaluation-2026-06-17.md).
  **Verdict: Stack = improve, Grid = rewrite**, both on ONE responsive mechanism —
  breakpoint maps compile to CSS `@media` inside the styled rule (no JS, no
  Surface, SSR-stable), the engine path 13 components already use.
  - **W0 — DONE & committed (`227c677`).** `Responsive<T>` in `types.ts` +
    `utils/responsive.ts` compile helper (+ 9 tests). Non-breaking infra.
  - **W1 — Stack improve + full sugar: DONE (stable 2026-06-17 — both gates).**
    Ben's visual pass on `/stack-demo`: "both seem really great." Promoted Stack +
    HStack/VStack/Center/Cluster/Spacer to `stable`.
    Additive: `align`/`justify` tokens, `gapX`/`gapY`, `divider`, `grow`, public
    `scroll`, responsive widening of `direction`/`gap`/`pad`/`align`/`justify`/
    `gapX`/`gapY`, polymorphic `as`; plus sugar `HStack`/`VStack`/`Center`/
    `Cluster`/`Spacer` (each its own override-able marker + meta). Kept ALL current
    defaults + `alignX`; no wrap/overflow/pad flips. `forwardRef` contract change
    (React.FC → polymorphic) is the one deliberate break. Green: typecheck×4, my
    files lint-clean, **1404 tests** (7 legacy Stack + 18 new W1 + 9 W0), build,
    SSR render+import, engine smoke, mcp gates (62 components, coverage floors held
    by the 5 sugar metas), docs tsc. Stack demo page extended to exercise every new
    feature for the visual pass. **Stack stays `experimental` pending Ben's visual pass.**
  - **W2 — Grid rewrite + GridItem: DONE (stable 2026-06-17 — both gates).**
    Ben's visual pass on `/grid-demo`: "grid looks great." Promoted Grid + GridItem.
    Real `display:grid` (was equal-columns-only). New: `minColWidth` auto-fit/fill
    (via the `--valet-grid-min` inline var, immortal-rule-safe; `autoFlow` default
    **`fill`** per Ben), responsive `columns`/`gap`/`gapX`/`gapY`/`pad`/`align`/
    `justifyItems` via `@media`, `equalize` (renamed from `normalizeRowHeights`,
    default true, broadened via `--valet-cell-stretch`), polymorphic `as`, and
    `GridItem` (`span`/`rowSpan`/`colStart`, responsive). **Removed `adaptive`** (it
    keyed off the Surface aspect-ratio — wrong signal) and **`useSurface`**: Grid is
    now Surface-decoupled and unit-testable in isolation. Single-column relax kept
    for an explicit static `columns={1}`. Codemodded 14 `<Grid adaptive>` docs sites
    → `columns={{ xs: 1, md: N }}`; Grid demo rebuilt (minColWidth/responsive/
    GridItem + a minColWidth/equalize/autoFit playground). Green: typecheck×4, lint
    (changed files), **1413 tests** (18 new Grid/GridItem), build, SSR render+import,
    engine smoke, check:examples (101), mcp gates (63 components + GridItem meta),
    docs tsc. **Grid + GridItem stay `experimental` pending Ben's visual pass on
    `/grid-demo`.** Panel keeps its own `normalizeRowHeights` (separate stable
    component — untouched).
  - **Stack & Grid first-class: COMPLETE.** All 9 layout primitives stable (Box,
    Stack + HStack/VStack/Center/Cluster/Spacer, Grid + GridItem).
- **Tier 2 tail — LoadingBackdrop + List: DONE (stable 2026-06-17 — both gates).**
  Ben's visual pass: "both seem fine." Promoted both. (Details below.)
  Tests green (LoadingBackdrop.dom + List.dom + List.selection.dom =
  12). LoadingBackdrop: clean fixed-scrim overlay that renders the stable ProgressRing;
  fade/`aria-hidden`/`pointer-events`/`data-state` track `fading`; i18n via
  `labels`/`useComponentStrings`; SSR-safe; marker present. List: single-selection
  listbox (`selectionMode`) with pointer/touch reorder + FLIP, roving focus, reduced-
  motion guard, correct list/listbox + option roles; SSR-safe (window listeners only
  in handlers/effects); marker present; the W1-removed `selectable`/`getKey` aliases
  are gone from source. **Meta fix:** List's bestPractices still described
  `selectable`/`getKey` as "deprecated aliases that still work / removed at 1.0" —
  stale post-W1; reworded to the current `selectionMode`/`getItemKey` (same class as
  the Box `centered` fix). Both left `experimental` pending Ben's visual pass. **Next:**
  Tier 3 (Surface, Modal, Tooltip, SpeedDial) per the verification order.
- **Tier 3 — Surface: DONE (stable 2026-06-17 — both gates).** Ben's visual pass:
  "approved." Promoted Surface. The
  keystone (the `useSurface` provider + DOM bridge). 15 tests green
  (`Surface.dom`). Source clean: nested-surface guard (enriched throw), per-instance
  `createSurfaceStore`, rAF-coalesced ResizeObserver+MutationObserver measure with a
  change-bail, the full `--valet-*` var contract (space/radius/stroke/divider/focus/
  screen-size/fonts), font-blocking backdrop (renders the now-stable LoadingBackdrop)
  with the 500ms never-block grace, RTL `dir` stamping (SSR-safe context read), and
  the compact cascade seed. Render path touches no browser globals (observers live in
  effects); already SSR-exercised by `ssr-render.test.ts`. **Meta fix:** density
  bestPractice still quoted the legacy scale ('tight' 0.9× / 'standard' 1× /
  'comfortable' 1.15×); corrected to the retuned 0.8× / 0.9× / 1× (`densityScale`).
  Left `experimental` pending Ben's visual pass. **Next:** Modal · Tooltip · SpeedDial.
- **Tier 3 overlay trio — Modal + Tooltip + SpeedDial: DONE (stable 2026-06-17 — both
  gates).** Ben's visual pass: "those all work great" + asked for the SSR hardening.
  Extending the `ssr-render.test.ts` gate to the trio **caught a real Tooltip SSR
  crash** (it always called `createPortal(bubble, getOverlayRoot())`; the server stub
  container made createPortal throw "Target container is not a DOM element"). Fixed via
  AppBar's mounted-gate pattern (portal only when `mounted && document`); Modal/SpeedDial
  were already SSR-safe. Promoted all three; the fix is SSR/first-render-only so it
  didn't change the client behavior Ben saw. 25 tests green (Modal.overlay + Tooltip.a11y +
  Tooltip.overlay + SpeedDial.dom + SpeedDial.overlay). All three build on the Tier-0
  overlay engine + `zIndex`; source clean: **Modal** — focus-trap/ESC/outside/inert/
  restore via `useOverlay`, dialog/alertdialog a11y + dev name-guard, reduced-motion
  guards, override-able marker, SSR-safe (closed → `null` before the portal).
  **Tooltip** — placement/arrow/delays/long-press/controlled, outside-click dismissal,
  `aria-describedby` cloned onto the *focusable* child, single-active-tooltip registry;
  SSR-safe (always portals, but `getOverlayRoot` is `document`-guarded → server no-op).
  **SpeedDial** — FAB + slide-out actions, Escape refocuses the FAB while outside-click
  doesn't, roving tabindex + aria-expanded/controls, reduced-motion guards; not
  portalled (fixed in place) → SSR-safe. No meta fixes needed. All three left
  `experimental` pending Ben's visual pass. _Optional hardening (not a blocker):_ the
  `ssr-render.test.ts` gate covers AppBar/Drawer/Accordion but not the overlay trio;
  a closed-Modal / Tooltip / SpeedDial renderToString case could lock their SSR-safety.
  **Next:** Tier 4 (Button, IconButton → fields) per the verification order.
- **Tier 4 foundations — Button + IconButton: DONE (stable 2026-06-17 — both gates).**
  Ben's visual pass: "both great!" Promoted both.
  7 tests green (Button.dom + IconButton.dom). Both source-clean
  and consistent: polymorphic (`as`) with shared a11y (role/tabIndex/Enter-Space
  keydown fallback for non-button roots, anchor-href + role-contradiction dev-warns,
  `type='button'` default stripped for anchors); intent/variant/color/size via the
  shared `computeIntentVars`; style precedence caller < (geometry <) intent-vars < sx;
  markers + data-state. **Button** auto-wraps string children in Typography (stable);
  **IconButton** renders the stable Icon, adds the icon-only accessible-name dev-guard
  and `aria-hidden`s the glyph when the control is labelled. SSR-safe (no browser
  globals at render). Metas clean — no fixes needed. Both left `experimental` pending
  Ben's visual pass. **Next:** Checkbox (before Select/Table) · Switch · Slider ·
  TextField · Radio+RadioGroup · Pagination.
- **Tier 4 Checkbox — REDONE + DONE (stable 2026-06-17 — both gates).** Ben's visual
  pass: "seems great." Promoted Checkbox.
  Ben: "checkbox needs to be redone — inconsistent colors, mobile, sizing." Ran a
  12-agent redo workflow (diagnose → 3 specs red-teamed → 2 judges → one spec) and
  implemented it; full record in
  [`checkbox-redo-2026-06-17.md`](checkbox-redo-2026-06-17.md). Root causes fixed:
  colors now from ONE `computeIntentVars` call (neutral `makeMix` border, glyph =
  `primaryButtonText` not hard-white) consistent with Button/Switch in light+dark;
  disabled = colors + `opacity:0.5` (not the invisible-in-light `fg-disabled`); mobile
  = chrome kit + a coarse-pointer `::before` ≥44px hit-expander (24px compact, logical
  `inset:0;margin:auto` so the RTL gate passes) that leaves the desktop box unchanged;
  sizing = proportional inline-SVG `currentColor` tick (no fixed inset/mask). Also:
  `helperText` now rendered OUTSIDE the label + `aria-describedby`, a `warnOnce`
  name-guard, dropped the conflicting `aria-checked="mixed"` (native IDL covers it),
  reduced-motion guard. **No public API change**; control layer kept verbatim. Green:
  typecheck×4, lint, 1420 tests (6 new redo cases), build, SSR, engine, RTL, mcp,
  check:examples (102), docs tsc. Contract tests gained `aria-label` on bare checkboxes
  (the name-guard now exists, mirroring Switch). Stays `experimental` pending Ben's
  visual pass — contrast/glyph-crispness/44px-feel are unverifiable in jsdom.
- **Tier 4 Switch — DONE (stable 2026-06-17 — both gates).** Ben's mobile pass: "this
  one's good." Promoted Switch.
  Ben approved look/feel ("I like the way switch looks and works") and
  asked to "make sure it's good to go on mobile." It was NOT: every size's track was
  under the 44px WCAG floor vertically (xs 16 → xl 38) and it lacked the chrome kit.
  Applied the Checkbox-redo mobile pattern (no look/feel change): chrome kit
  (`-webkit-tap-highlight-color`/`-webkit-touch-callout`/`user-select`/`touch-action`
  + `onContextMenu`) and a `@media (pointer: coarse)` `::before` ≥44px hit-expander
  (`--valet-switch-hit`, 24px under `compact`, logical `inset:0;margin:auto` → RTL gate
  green) that grows the tap target without changing the visual track or desktop rhythm.
  Meta tap-target advice updated. Green: typecheck×4, lint, 1422 tests (2 new mobile
  cases), build, RTL, mcp, check:examples, docs tsc. Stays `experimental` pending Ben's
  confirmation on a touch device / coarse-pointer emulation.
- **Tier 4 Slider — DONE (stable 2026-06-17 — both gates).** Ben: "slider is approved."
  Promoted Slider.
  Source review clean: solid a11y (role=slider, full keyboard
  Home/End/Page/Arrows, aria-value*), pointer-capture drag with `pointercancel`
  cleanup, controlled+FormControl contract, label/helperText wired + name-guard.
  **Mobile gaps found + fixed** (same pattern as Switch): the thumb (14–34px) lacked a
  ≥44px grab target and the chrome kit, and neither Track nor Thumb set `touch-action`
  (only the Wrapper did, and it's not inherited) so a touch-drag could pan the page.
  Added: thumb chrome kit (`tap-highlight`/`touch-callout`/`user-select` + `onContextMenu`),
  `touch-action: none` on Track + Thumb, and a `@media (pointer: coarse)` `::before`
  ≥44px grab-expander (`--valet-slider-hit`, 24px under compact, logical
  `inset:0;margin:auto` → RTL gate green). Tapping the track to jump still works. Meta
  tap-target advice updated. No API change. Green: typecheck×4, lint, 1424 tests (2 new
  mobile cases), build, RTL, mcp, check:examples, docs tsc. Stays `experimental` pending
  Ben's visual pass (look + the touch grab target).
- **Tier 4 TextField + FormControl epic (decided 2026-06-17).** Ben asked for a full
  workflow critique of TextField and to consider FormControl; ran a 13-agent critique
  (verdict + spec in [textfield-critique-2026-06-17.md](textfield-critique-2026-06-17.md)).
  Verdict: **TextField = rewrite the styled layer (keep plumbing); FormControl = none
  for 1.0** — but Ben chose to also do the FormControl epic now (`FormConfigCtx`), with a
  new `errorText` prop and the full size/variant surface. Sequenced in waves:
  - **Wave A — FormConfigCtx foundation: DONE & committed (`65d39a0`).** A SECOND context
    alongside the untouched FormCtx store snapshot: `useFormConfig()` → `{ disabled,
    errors, isSubmitting }` (inert default outside a form); FormControl gains `disabled`,
    name-keyed `errors`, async `onSubmitValues` → `isSubmitting`/`aria-busy`, and
    focus-first-invalid. Additive; zero blast radius (nothing consumed it yet).
  - **Wave B — TextField rewrite: DONE (stable 2026-06-17 — both gates; `3eac0b4`).**
    Ben's visual pass: "seems great!" Promoted TextField. Plumbing kept byte-for-byte (controlledContract + source-grep
    gate green unedited). Rewrote the styled layer: width model (100% + min-inline-size:0
    + `width` prop; fullWidth→flex:1), intent-var colors (neutral border, border+ring
    recolor on error), backgroundAlt surface, `size` scale, helperText/errorText split
    (role=alert, no aria-live on neutral), composed caller handlers, coarse ≥44px (input
    arm), autofill fix, name-guard. **Consumes FormConfigCtx** (form-wide disabled +
    name-keyed error) — the first field to, proving the infra end-to-end. 1437 tests
    (9 new). Demo extended. Stays `experimental` pending Ben's visual pass.
  - **Wave C — FormConfigCtx rollout: verified field set DONE; rest at their verification.**
    Wired the already-stable siblings — **Checkbox, Switch, Slider** — to `useFormConfig()`:
    `effectiveDisabled = own || form.disabled`, `effectiveError = own || form.errors[name]`,
    swapped into the disabled/error usages (incl. the toggle/drag guards). Plus TextField
    (Wave B). So `<FormControl disabled>` / `errors` now reach the core form fields
    (text/checkbox/switch/slider). Each gained a form-config regression test; 1440 tests.
    **Deliberately deferred** the 5 remaining bound fields (Select, RadioGroup, MetroSelect,
    Iterator, DateSelector) — they're unverified + complex (DateSelector/Select especially),
    so they get the identical `useFormConfig()` wiring during THEIR verification pass (the
    pattern is locked by TextField/Checkbox/Switch/Slider), rather than blind now. The
    store-snapshot binding stays untouched throughout.
- **Tier 4 Radio + RadioGroup — DONE (stable 2026-06-17 — both gates).** Ben's visual
  pass: "this one is good." Promoted Radio + RadioGroup. Verified as one unit. Source review found the same issues the field
  cluster has been fixing, so brought it to parity with the redone Checkbox (verify +
  the established patterns, not a workflow redo): **colours → the shared intent
  contract** (`computeIntentVars`/`makeMix`) — the unchecked ring is a neutral border,
  the checked dot is `intent-fg` not a hard `#fff` (fixes the white-dot-on-pale bug,
  same class as Checkbox's checkmark), disabled dims via `opacity:0.5` (dropped the
  bespoke Accordion mix recipe); **mobile** — chrome kit completion (`touch-callout`/
  `user-select`/`onContextMenu`) + a `@media (pointer:coarse)` ≥44px tap row per option
  (`--valet-radio-hit`, 24px under compact); **FormConfigCtx** (the Wave C deferral) —
  new group-level `disabled` prop + `effectiveDisabled`/`effectiveError` from the form
  config, propagated to every radio via context (the focus ring now reads
  `--valet-intent-focus`). Metas updated (stale ≥40–48px tap advice → automatic).
  Green: typecheck×4, lint, 1444 tests (4 new), build, RTL, mcp, check:examples, docs
  tsc. Stays `experimental` pending Ben's visual pass.
- **Tier 4 Pagination — DONE (stable 2026-06-17 — both gates).** Ben: "approved."
  Promoted Pagination — **Tier 4 complete.** Not a bound field (no FormConfig). Source review clean: solid a11y
  (nav `aria-label`, `aria-current='page'`, labelled prev/next/scroll buttons),
  `page`-controlled + `onPageChange` (the W1 rename; `onChange` is just an internal
  alias), the rule-lifecycle-safe measured-px→CSS-var underline/window animation.
  **Mobile**: nav buttons were ~30px tall — added the chrome kit (`tap-highlight`/
  `touch-action`) + a `@media (pointer:coarse)` ≥44px **min-height** on the buttons
  (24px under compact, `--valet-pag-hit`). Height-only by design — widths feed the
  elastic-underline/sliding-window measurement, so they're left to content (the
  viewport measurement absorbs the height). **Meta fix**: a bestPractice referenced a
  non-existent `siblingCount` prop (MUI's name) → corrected to `visibleWindow`. Green:
  typecheck×4, lint, 1445 tests (1 new), build, RTL, mcp, check:examples, docs tsc.
  Stays `experimental` pending Ben's visual pass (the underline animation + the mobile
  tap heights are jsdom-unverifiable). **Tier 4 complete after this promotes.**
- **Tier 5 Select — DONE (stable 2026-06-18 — both gates).** Ben: "select is now
  approved." The visual pass took two extra rounds after the initial verify: (a) Ben
  flagged the open Select still looked bad in dark mode — root cause was the trigger
  inheriting Surface vars (`var(--valet-bg…)` resolved to the PAGE background, `divider`
  border) + a muddy `primary+'22'` menu highlight; migrated to the deterministic intent
  palette TextField uses (explicit backgroundAlt surface, `theme.colors.text`, neutral
  `makeMix` border + `error` recolour, opaque primary-mix option highlights, explicit
  menu text/keyline; new regression test pins no inherited `--valet-bg/-text-color/
  -border`). (b) The demo then looked awkward (every Select full-width by the new
  default) → gave the SelectDemo examples explicit `width`s (also showcasing the prop).
  Promoted Select + Select.Option. Verification detail below.
- **Tier 5 Select — verification detail (2026-06-17).** First Tier 5 component; Ben
  asked to start here and address the flagged dropdown-overlap.
  **Fixed the flagged finding** (see deferred-findings, now RESOLVED): the root was
  `inline-block` content-width → now the TextField width model (block flex-column,
  `width:100%` default + `min-inline-size:0` + `width` prop + `fullWidth`), so the
  Select stays in its own column. **FormConfigCtx** wired (its Wave C deferral):
  `effectiveDisabled`/`effectiveError` from the form config (own props win); a
  form-wide `disabled`/name-keyed `errors` reach the trigger. **Mobile**: chrome kit +
  coarse ≥44px on the trigger AND the option rows (`--valet-select-hit`, 24px compact).
  **Error recolor**: on error the trigger border + focus ring go to `theme.colors.error`
  via local CSS-var overrides (`--valet-border`/`--valet-focus-ring-color`). The
  portalled menu still anchors to the trigger's measured rect (overlay logic untouched).
  Source-grep + controlledContract gates green unedited. Green: typecheck×4, lint, 1449
  tests (4 new), build, RTL, mcp, check:examples, docs tsc. Stays `experimental`
  pending Ben's visual pass.
- **Tier 5 Accordion — DONE (stable 2026-06-18 — both gates).** Ben: "seems great."
  Verify + mobile-harden (his ask: "mobile ready, excellent, and stable"). Source review
  clean — already sophisticated (headless controlled/uncontrolled core via the shared
  `useControlledState`, roving-focus ARIA with per-instance id namespacing, reduced-
  motion-aware height animation, `headingLevel`/`multiple`/`unmountOnExit`/`constrainHeight`).
  The header was already ~50px (generous padding) but the chrome kit was incomplete and
  there was no guaranteed touch floor: completed it (`touch-action: manipulation` +
  `user-select:none`) and added a `@media (pointer:coarse)` ≥44px `min-height` floor on
  the header (`--valet-acc-hit` on the Root, 40px under compact) for compact/short-title
  cases. Metas accurate (`headingLevel` verified real; added a touch-target bestPractice).
  Promoted Accordion + Accordion.Item. Green: typecheck×4, lint, full suite (2 new mobile
  tests), RTL, mcp, docs tsc.
- **Tier 5 Tabs — DONE (stable 2026-06-18 — both gates).** Ben: "tabs is great!"
  Promoted Tabs + Tabs.Tab + Tabs.Panel. The other roving-focus widget; pairs with
  Accordion. Source review clean and already mobile-aware
  (the tab button shipped the chrome kit + `min-width:4rem` + overflow drag/swipe-scroll
  with edge fades; headless controlled/uncontrolled via the shared `useControlledState`;
  honest `ChangeInfo.source`; per-instance id namespacing; orientation/placement). Closed
  the small gaps: added `user-select:none` (a double-tap no longer selects the tab label),
  switched the button to `inline-flex` centering, and added a `@media(pointer:coarse)`
  ≥44px `min-height` floor (`--valet-tab-hit` on the Root, 40px compact) for compact/short
  labels. **Meta fixes**: a bestPractice referenced a non-existent `variant` prop →
  corrected to `orientation`/`placement`/`alignX`; the meta had NO examples → added two
  (basic + controlled-vertical; both pass check:examples). Green: typecheck×4, lint, 1454
  tests (2 new), build, RTL, mcp, check:examples (106), docs tsc. Stays `experimental`
  pending Ben's visual pass.
- **Tier 5 AppBar + Drawer — DONE (stable 2026-06-18 — both gates).** Ben: "both are
  great." Promoted AppBar + Drawer. The mobile-nav chrome pair. Both already mature: **AppBar** uses `computeIntentVars`
  + an SSR-safe portal (mounted-gate) + Surface margin offset; **Drawer** is a real
  focus-trapping dialog in overlay mode (useOverlay trapFocus/inert/restoreFocus),
  inline region when persistent, with adaptive orientation (portrait toggle), RTL-aware
  logical anchors, and SSR guards. Mobile touches added: **AppBar** — icon-only
  `navigation` buttons were forced to ~28px; they now size from `--valet-appbar-navbtn`
  (28px desktop) which `NavWrap` floors to 44px under `@media(pointer:coarse)` (set on
  the children via the stylesheet, not inline, so the media override wins over the
  inline width). Desktop look unchanged. **Drawer** — added `touch-action:none` on the
  backdrop so a drag never scrolls the page behind the open drawer (tap-to-close still
  fires). Metas verified accurate (no stale prop refs). Green: typecheck×4, lint, 1456
  tests (2 new), RTL, mcp, docs tsc. Both stay `experimental` pending Ben's visual pass.
- **Tier 5 Chip — DONE (stable 2026-06-18 — both gates).** Ben: "approved." Promoted
  Chip. Modern already — `computeIntentVars` colours, and a deliberate inert static-descriptor
  contract (it strips `onClick`/`role`/`tabIndex` with dev warnings; the chip is never
  a button). The only interactive part is the optional `onDelete` button, whose visual
  size was `icon+6` ≈ 18–26px — well under the touch floor. Added the invisible coarse
  ≥44px hit-expander (the Checkbox/Switch pattern: `::before` with logical
  `inset:0; margin:auto`, reading `--valet-chip-del-hit` on the Root, 32px under
  compact), plus the chrome kit (`tap-highlight`/`touch-action`) and a themed
  `:focus-visible` ring on the delete button. The chip body itself stays correctly
  non-interactive. Meta accurate; touch note added. Green: typecheck×4, lint, 1458 tests
  (2 new), RTL, mcp, check:examples. Stays `experimental` pending Ben's visual pass.
- **Tier 5 Snackbar — DONE (stable 2026-06-18 — both gates).** Ben: "promote." Plus,
  on his request, added a new `filled` variant (solid primary surface + shadow; `outline`
  stays the default) and fixed the playground trigger (uncontrolled toasts now remount
  via a nonce key instead of relying on a dead `open`). Already excellent: WCAG 2.2.1 auto-hide that pauses on hover AND focus with
  remaining-time banking, `role='status'`/`aria-live='polite'` live region (overridable
  to alert/assertive), reduced-motion-aware, controlled-exit fade, surface z-ordering,
  orphan-timer cleanup. Only real mobile gap: it was pinned `bottom: spacing(1)` with no
  safe-area inset, so on notched/gesture phones it sat under the home indicator. Fix:
  `bottom: calc(spacing(1) + env(safe-area-inset-bottom, 0px))` (falls back to 0 → desktop
  unchanged) + a `-webkit-tap-highlight-color: transparent`. Behaviour/timing/a11y
  untouched. Meta accurate (has an a11y block); added a safe-area + action-touch note.
  Green: typecheck×4, lint, 1459 tests (1 new), RTL, mcp, check:examples. Stays
  `experimental` pending Ben's visual pass (the env() offset shows only on a notched
  device/emulator; desktop position is unchanged).
- **Tier 5 Tree — DONE (stable 2026-06-18 — both gates). TIER 5 COMPLETE.** Ben:
  "tree approved!" Promoted Tree.
  Ben: "full rewrite... we got this." Executed the [tree-analysis](tree-analysis-2026-06-18.md)
  rewrite verdict in one pass — all 7 blockers + the spec:
  (1) ONE unified recursive render path for all three variants → every expanded parent
  owns a nested `ul[role=group]` (the flat chevron path is gone); aria-level/setsize/
  posinset from the recursion index (no O(n²) findIndex).
  (2) `useControlledState` for both `expanded` and `selected` — kills the
  side-effect-in-setState (StrictMode double-fire) and adds the controlled-flip warning.
  (3) Canonical `SelectionProps<string>`: `selectionMode` none/single/**multiple** (all
  implemented), `selected`/`defaultSelected` as id arrays, `onSelectionChange(ids)`;
  `aria-multiselectable` in multiple; `aria-selected` omitted (not false) under none.
  Dropped the old scalar `selected`/`onNodeSelect` (experimental + pre-1.0 deprecation
  sweep — no aliases). NavDrawer + the demo migrated to the array API.
  (4) Gated focus via `userMovedRef` — NO focus-steal on mount; one `.focus()` per move.
  (5) Intent colours (`computeIntentVars`/`makeMix`): selected = subtle primary tint,
  hover strictly lighter, AA text contrast; dropped the bespoke toRgb/mix/toHex distort.
  (6) Mobile: chrome kit + `@media(pointer:coarse)` ≥44px row floor (`--valet-tree-hit`
  via useCompact, 40px compact) + a ≥44px hit-expander on the disclosure glyph for
  `iconToggleOnly`.
  (7) Removed `onDoubleClick` (no triple-fire); `▶` → `<Icon carbon:chevron-right>` with
  reduced-motion guard; typeahead (printable-key jump, `getTextValue` for node labels);
  `disabled` nodes (aria-disabled, inert, still navigable); pulled role/onKeyDown out of
  the rest-spread; dropped the dead `$border` prop + duplicate header + dead CSS vars.
  Rewrote the test suite (19 tests: selection matrix, per-variant role=group, ARIA meta,
  keyboard + typeahead, mount-focus-steal regression, StrictMode single-fire, disabled,
  mobile). Green: typecheck×4, lint, 1475 tests, build, docs tsc + docs vite build, RTL,
  mcp, check:examples (107). Deferred post-1.0 (not implemented, names free to add later
  non-breaking): lazy/async children, virtualization, drag-drop, imperative ref, custom
  renderNode. Stays `experimental` pending Ben's visual pass.
- **Tier 6 bound fields (Iterator + MetroSelect + DateSelector) — AGENT-VERIFIED via
  a fan-out workflow, awaiting Ben's visual pass (2026-06-18).** Ben: "fan out workflow
  all bound fields. I'll visual check all at once." Ran `bound-fields-harden` (3 impl
  agents + 3 reviewers): each wired FormConfigCtx (effectiveDisabled/effectiveError in
  render AND interaction guards; per-item disabled left separate; useFieldState store
  binding untouched — controlledContract green), added the mobile chrome kit + a
  coarse-pointer ≥44px target, reviewed colours, and added tests.
  - **Iterator**: input-box coarse min-height floor (`--valet-iter-hit`); colours
    unchanged (neutral bordered number box, no intent fill).
  - **MetroSelect**: tile colours migrated off bespoke toRgb/mix/toHex to the intent
    contract (makeMix, hover < selected); coarse ≥44px tile.
  - **DateSelector**: day-cell `::before` ≥44px hit-expander + chrome kit; selected-day
    error recolour; per-DATE disabled kept separate from the field disabled.
  Reviewers passed Iterator + DateSelector clean and FLAGGED MetroSelect — the ≥44px
  floor sat on the non-interactive `HoverWrap` while the click handler was on the inner
  `Panel`, so the tap target wasn't actually enlarged. **Integrator fix:** moved the
  tile size onto HoverWrap (which carries the floor) and made the clickable Panel fill
  it (width/height:100%), so the floored box IS the tap target. Also aligned Iterator's
  compact hit value to the cohort (24px/44px). Green: typecheck×4, lint, 1488 tests,
  build, RTL, mcp, check:examples (107), docs tsc. All three started `experimental`.
- **Tier 6 Iterator + DateSelector — DONE (stable 2026-06-18 — both gates).** Ben's
  visual pass + two requested tweaks: Iterator gained a `buttonVariant`
  (`outlined` default / `filled` / `plain`) for the −/+ steppers; DateSelector's month
  picker now shows the locale SHORT month ("Jun", not "June") via
  `getMonthNames(locale, 'short')` (the intl + fields characterization tests updated to
  match the deliberate change). Promoted both. **MetroSelect stays `experimental`** —
  Ben has notes coming. Green: typecheck×4, lint, 1489 tests, build, RTL, mcp,
  check:examples, docs tsc.
- **Box — DONE (stable 2026-06-17 — both gates).** Ben's visual pass cleared it;
  the `centered`→`centerContent` meta fix shipped.
- **Pre-existing repo debt (not from this work):** `eslint .` reports 51 prettier
  errors on clean HEAD, all in `WebGLCanvas.tsx`/`Progress.dom.test.tsx` etc. from
  the Tron City commits; `check-pins` WARNs on docs/template `@archway/valet`
  version pins. Flagged for a separate cleanup; untouched here (WebGLCanvas is WIP).

## Re-test pass — deferred findings

Defects noticed while verifying one component that actually belong to a
*different* (usually not-yet-verified) component. Logged here so they resurface
at the right tier; not blockers for the component in hand.

- **[RESOLVED 2026-06-17 — Select verification] Open `Select` dropdown overlaps the
  neighbouring field.** Observed 2026-06-16 while verifying Icon (the `size` control
  in `IconDemoPage.tsx:206`): with the `<Select>` open, its trigger/overlay overlapped
  the adjacent `icon` `TextField` instead of staying in its own column. **Root cause
  (confirmed in source):** the Select root was `display: inline-block` with no width
  while its trigger was `width:100%` — so the whole Select was content-width (shrunk to
  the value), unlike every sibling field. In a flex row it didn't establish its own
  column. **Fix:** gave Select the TextField width model — the root is now a block
  flex-column at `width:100%` by default + `min-inline-size:0` (shrinks in a row) + a
  `width` prop + `fullWidth`. The portalled menu still anchors to the trigger's measured
  rect (unchanged). Confirmed by a new DOM test (`root.style.width === '100%'`) and
  Ben's visual pass.
- **[→ TextField, Tier 4] Bare `<TextField>` sits at the UA default width (~20ch),
  not content/row-aware.** Observed 2026-06-16 while verifying Avatar, in the
  "Try your Gravatar" demo: a `<TextField>` inside a `<Stack direction='row'>`
  renders at the browser's intrinsic `<input>` width regardless of content, so a
  short value leaves dead space between the text and the next control (read as an
  uneven gap by the "Show" button). **Not a spacing-engine bug** — Stack's `gap`
  is uniform; the wrapper has no width unless `fullWidth` (`TextField.tsx:197`)
  and the `<input>` is `width:100%` (`:103`) of a content-sized wrapper, so it
  falls back to the UA default. Decision for TextField's verification: is UA-default
  inline width the intended default (docs just pass `fullWidth`), or should the
  field be more row-aware by default? Docs workaround: `fullWidth` on the field.

## Flags & issues

- **The one non-mechanical removal** in W1 is `Switch.onChange` — it's a raw
  `MouseEvent`, so removing it is a genuine behavior change, not a rename. Treat it
  as the headline BREAKING entry with a migration recipe.
- **Veto register vs "remove all deprecations":** the policy has exactly one ruled
  exception (`SurfaceState.children`). Keep them reconciled so a future "why is this
  `@deprecated` still here at 1.0?" has a written answer.
- **8 `npm test` failures on a clean checkout** are a `validate-jsx` env artifact
  (green once `packages/valet-mcp` deps install, as CI does) — not a product bug,
  not a 1.0 task.

## Next step — Ben's 1.0.0 cut (Wave 4, human-elevation only)

W1–W6 are code-complete and green on `feat/valet-1.0`. Everything left is the
release ceremony / operator actions the agent deliberately did **not** perform:

1. **Review the epic branch** (7 commits; the CHANGELOG `## Unreleased` block holds
   the full 1.0 entry set, ready to become `## [1.0.0]`).
2. **Cut 1.0.0:** flip `## Unreleased` → `## [1.0.0] — <date>`, bump `package.json`
   0.36.0 → 1.0.0 (+ the valet-mcp / docs / template pins per `dx/RELEASING.md`),
   confirm `release:check` is green.
3. **Integrate + publish:** open the PR(s) `feat/valet-1.0` → `development`/`main`
   (the first/only PRs), tag, and `npm publish` per the runbook + PUBLISH_ORDER.
4. **[operator] Enable GitHub Private Vulnerability Reporting** so `SECURITY.md`'s
   reporting flow works (the one W5 item the agent cannot do).

Deferred, non-blocking (need a committed baseline first, by design): a coverage-CI
threshold gate and an engine-bench perf-threshold gate. Engine hash-collision-guard
and insert-retry are accepted info-level tradeoffs.
