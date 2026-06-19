# Checkbox redo — diagnosis, rewrite, decision record (2026-06-17)

> Output of a 12-agent redo workflow (recon: current+root-cause / valet conventions /
> MUI·Radix·Chakra·Ant — 3 design stances, each red-teamed → 2 judges → one spec),
> then implemented. Ben: "checkbox needs to be redone — inconsistent colors, mobile,
> sizing." Companion to [`verification-order.md`](verification-order.md). Checkbox is
> Tier 4; it stays `experimental` pending Ben's visual pass (colors/contrast and the
> 44px feel are unverifiable in jsdom — see Risks).

## Root causes (diagnosed in the old Checkbox)

- **Colors (inconsistent):** the box never used `computeIntentVars` — the unchecked
  border was `theme.colors.divider` (grey), the fill was raw `theme.colors.primary`,
  and the **checkmark glyph was a hard-coded white (`%23fff`) data-URL SVG** → invisible
  on a pale `primary` fill. Disabled used a bespoke `mix(text, black/white, 0.4)`. None
  of it matched Button/IconButton/Switch, which all key off the shared intent contract.
- **Mobile:** no real touch target (the box was ~12–28px, well under the 44px WCAG
  2.5.5 floor); missing `-webkit-touch-callout`/`onContextMenu` long-press guards.
- **Sizing:** the tick used a fixed `calc(size - 4px)` inset (wrong at small/large
  sizes) and a background-image mask (not `currentColor`, can't follow theme).
- Plus: `helperText`/`fullWidth` were silently discarded; no accessible-name dev-guard;
  no reduced-motion guard; `aria-checked="mixed"` was set on a native input (redundant/
  conflicting — the native `.indeterminate` IDL already exposes "mixed").

## What the redo does (implemented)

- **Colors → one `computeIntentVars` call** (the same contract Button/IconButton use):
  `bg: primary`, `fg: primaryButtonText` (the glyph — readable, never white), `focus:
  primary`, and an **explicit neutral border** `makeMix(background, text, 0.4)` for the
  unchecked outline. Checked fill, glyph, border, hover, and focus ring are now
  theme-consistent in light **and** dark.
- **Disabled → keep colours + `opacity: 0.5`** (NOT the near-white `fg-disabled` token,
  which the red team proved invisible in light mode).
- **Glyph → inline `<svg>` with `stroke="currentColor"`**, proportional tick (`box*0.6`),
  centered via `display:grid; place-items:center`; checkmark `<polyline>` / indeterminate
  `<line>` dash. No mask, no fixed inset → crisp + jsdom-renderable.
- **Mobile → chrome kit** (`-webkit-tap-highlight-color`/`-webkit-touch-callout`/
  `user-select:none`/`touch-action:manipulation` + `onContextMenu` preventDefault) and a
  **`@media (pointer: coarse)` `::before` hit-expander to ≥44px** (`--valet-cb-hit`,
  relaxed to 24px under `compact`) that grows the tap target **without** changing the
  visual box — desktop (fine pointer) rhythm is untouched. Centered with the logical
  `inset:0; margin:auto` trick (no physical `left`/`top` — passes the RTL gate).
- **a11y:** real visually-hidden native `<input type=checkbox>` (queryable for AT/forms);
  `label` rendered inside the `<label>` (names it natively); **`helperText` rendered
  OUTSIDE the label** as a sibling + `aria-describedby` (so it never leaks into the
  accessible name); `warnOnce` dev-guard when there's no name; focus-visible ring on the
  box via the adjacent-sibling selector.
- **Indeterminate:** keeps the native `.indeterminate` IDL effect (exposes "mixed"),
  shows the dash glyph, adds `data-state="indeterminate"`, and **drops the conflicting
  `aria-checked="mixed"`**.
- **Control layer kept verbatim:** `classifyChangeSource`, `useFieldState` (prop > form >
  internal), `handleChange` (onChange → onValueChange/input → onValueCommit/commit),
  `bindForm` veto, `setRefs`. Reduced-motion guard + `data-valet-component` marker retained.

## API compatibility

**No public API change** — every prop keeps its name, type, default, and the `forwardRef`
target. `helperText` is now *rendered* (was discarded). The native checkbox stays
queryable with a live `.checked`, so all controlled-contract + source gates pass. No
renames, aliases, removals, or codemod.

## Verification (agent pass)

Green: typecheck×4, lint, **1420 tests** (11 in `Checkbox.dom` incl. 6 new redo cases:
intent-var color model, currentColor svg, indeterminate dash + IDL + no-aria-checked,
the 44px hit var, helperText-outside-label + aria-describedby, name-guard warn),
controlledContract + fieldsAccessibleName green, build, SSR, engine, RTL gate,
check:examples (102), mcp gates, docs tsc. Contract tests updated to pass `aria-label`
to their bare checkboxes (mirroring Switch, now that the name-guard exists).

## For Ben's visual pass (the bits jsdom can't prove) + open questions

Run `/checkbox-demo`, light **and** dark:
1. **Contrast** — the neutral unchecked border and the checkmark must be clearly visible
   in both modes (the whole point of the redo).
2. **Sizing** — crisp checkmark + box aligned to the label across `xs`→`xl` and custom sizes.
3. **Mobile** — the ≥44px tap target on a touch device / coarse-pointer emulation.
4. **Disabled** — `opacity: 0.5` may read faint on a small checked tick (open question:
   opacity vs a dedicated muted token).
5. **Indeterminate** — dash renders + screen-reader announces "mixed".

Open questions for Ben: (a) keep the coarse-pointer 44px expander, or rely on row height?
(b) disabled via `opacity` or a muted token? (c) confirm dropping `aria-checked="mixed"`
(recommended — native IDL covers it). (d) add a `forced-colors` (Windows high-contrast)
block now or defer?
