// ─────────────────────────────────────────────────────────────
// VALIGNMENT_ISSUES.md  | valet
// Visual regression & interaction checklist during vNext upgrade
// This file tracks the open issues discovered in smoke tests and
// our hypotheses and next-step investigations. Keep technical and
// action‑oriented; do not treat as release docs.
// ─────────────────────────────────────────────────────────────

# vNext Regression Checklist (visual + interaction)

Status key
- [ ] Not investigated
- [~] Hypothesis formed / reproducible
- [x] Fixed (pending validation)

## 1) Clicks scroll page to top; action doesn’t fire unless at top

- Scope (reported):
  - Buttons: toggles in Accordion usage, theme toggle in Box page, “often on buttons but also other places”.
  - Vertical Tabs example (#4): clicking tab causes page to jump to top.
- Severity: High (blocks basic interaction)
- Repro: Visual smoke on docs; not gated by build.
- [~] Hypotheses (root‑cause candidates):
  - Accidental “link” behavior:
    - Any element acting as `<a href="#">…</a>` would cause jump to top. Search showed no `href="#"` in repo.
    - Polymorphic `as="a"` used? Only in docs Events page (Button as link with real path). Unlikely.
  - Implicit form submit:
    - Buttons inside a `<form>` without `type="button"` would submit and potentially reload/scroll. Our Button defaults `type="button"` unless `as='a'`.
  - Global pointer/keyboard handlers:
    - New overlay system adds capture‐phase `pointerdown` listeners. We do not call `preventDefault`, so scrolling shouldn’t be impacted. Still a target for isolation (disable overlay stack in docs to test).
  - Focus/scroll coupling:
    - Tabs root now has `tabIndex={-1}` and an `onFocus` that moves focus to the active tab. Focusing off‑viewport could scroll unexpectedly. But issue appears broadly beyond Tabs.
  - Style overlay interception:
    - `Select` renders a fullscreen fixed `PortalWrap` when open; could snatch clicks, but the issue manifests even when menus aren’t open.
  - createStyled runtime side effects:
    - Global style sheet injection at module load; no scroll hooks. Low suspicion.
- Triage plan:
  1. Instrument a tiny doc page with plain `<button>` (no valet) and a `<Button>` next to each other to compare.
  2. Disable the overlay module’s global listeners in docs build to bisect overlay involvement.
  3. Temporarily remove Tabs root `tabIndex`/`onFocus` to see if it changes the vertical Tabs regression.
  4. Inspect event propagation on a failing button (log native event target + defaultPrevented + composedPath).
  5. Confirm no scrollIntoView/anchor logic is invoked by container layouts or examples.

## 2) TextFields: cannot place caret / cannot click inside

- Scope: All TextField inputs appear non‑interactive.
- Severity: High (blocks basic input)
- [~] Hypotheses:
  - Overlay capture: A fullscreen, zero‑opacity layer intercepting pointer events would block input.
  - Pointer handling in `Iterator`/`Slider`/other may attach `wheel` listeners to window and `preventDefault`; but TextField should be unaffected.
  - Z‑index/positioning from AppBar/Surface causing an invisible element overlaying content.
  - Global pointer handlers or CSS on the docs layout (e.g., `pointer-events: none` bubbling) introduced during refactors.
- Triage plan:
  1. Use devtools to inspect click target above TextField; verify topmost element in the stacking context.
  2. Toggle `pointer-events: none` styles incrementally in devtools on suspect layer(s) (AppBar, overlay root) to isolate.
  3. Add a temporary `onPointerDown` logger to TextField wrapper to see if events reach it.

## 3) AppBar usage: overlapping text in hero/title area

- Scope: AppBar demo page displays overlapping text (“semantic intent” text blending with the AppBar heading).
- Severity: Medium (visual bug)
- [~] Hypotheses:
  - AppBar layout update (variant/intent) changed default padding/height. The usage page’s heading content might now be too close.
  - The docs hero container may have lost margin‑top when AppBar variant changed to `filled` with larger height.
- Triage plan:
  1. Inspect computed styles for the hero/heading and AppBar container; verify margins/padding and stacking.
  2. If necessary, increase the content offset below the AppBar or ensure the hero respects AppBar height via a CSS var.

## Environment/changes that may contribute

- Overlay system: global capture listeners on `pointerdown` + inert & scroll lock behavior for open overlays.
- Tabs: added root focus management (root focuses active tab on focus) and changed alignment handling.
- createStyled: polymorphic `as` support introduced; class injection via a global stylesheet (unlikely to cause scroll).
- Alignment cleanup: removed control‑level centering; container anchoring rules updated (Box/Panel/Stack).

## Triage checklist (do in order, capture findings)

- [ ] Reproduce “scroll to top” on a minimal page; compare valet Button vs native `<button>`.
- [ ] Disable overlay listeners (in docs build only) to rule overlays in/out.
- [ ] Remove Tabs root focus side‑effect temporarily and retest vertical Tabs (#4) behavior.
- [ ] Inspect event target stack for a failing button (ensure no ancestor has `href="#"`).
- [ ] Inspect topmost element over TextField during click; identify blocking layer.
- [ ] Verify AppBar/hero layout metrics; ensure sufficient content offset under AppBar.

## Exit criteria (before any code change)

- One concrete root cause for the scroll‑to‑top behavior identified (with an isolated repro and proof).
- One concrete root cause for TextField non‑interaction identified (with isolated repro/proof).
- AppBar overlap cause identified (usage‑page content spacing vs. AppBar metrics).

## Notes

- Do not ship further alignment/intent cleanups until these are understood.
- Once causes are confirmed, patch surgically with tests or doc examples to prevent regressions.

