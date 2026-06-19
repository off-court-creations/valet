# MetroSelect — Metro-UI upgrade analysis (2026-06-18)

Fan-out workflow (`metroselect-upgrade`, 6 agents, 5 lenses → synthesis), 42
recommendations. Ben: "windows 8 launch day vibes… the boxes are spaced too far
apart." MetroSelect is `experimental`.

## North star

The Windows 8 launch-day Start screen: a left-anchored wall of **flat,
sharp-cornered, saturated rectangles** sitting nearly shoulder-to-shoulder with
one **tiny uniform ~8px gutter**. Every tile has an opaque flat fill **at rest**
(not a hollow keyline box), a simple monochrome glyph upper/centre, and a
**light-weight label pinned bottom-left**. Square 1×1 modules mix with **wide
2×1** tiles on the same grid rhythm. Selection reads as a treatment change
(brighter fill + inset accent keyline), not "the only filled tile." Signature
interaction: the **3D press tilt** — touch a tile and it leans toward your finger
and dips, springing back on release (reduced-motion-gated). No rounding, no
border-as-card, no shadow, no gradient.

## Verdict: **restyle** (new tile visual + layout; API shape mostly intact, additive props)

## Immediate fix — DONE (the flagged complaint)

The "too far apart" was **not** the component (default was `gap=0`) — it was the
**demo + meta examples passing `gap={4}` (=32px)**. Fixed: `gap` now defaults to a
density-aware **8px (4px compact)** gutter (author `gap` still overrides), and
`gap={4}` is stripped from all 5 demo blocks + 3 meta examples. Tiles go from a
32px scatter to an 8px snapped gutter.

## Restyle spec (ordered) — pending Ben's scope decision

2. **Drop `<Panel variant='outlined' compact>` as the tile substrate.** Promote a
   dedicated `styled('div')` Tile that owns the surface (bg, `border:none`,
   `border-radius:0`, flex content, onClick, focus ring, press transform).
   **Carry verbatim** onto it: the onClick `setValue('pointer')`, the data-active
   focus ring, the role/id/aria-selected cloneElement injection, the disabled/
   opacity/colour sx, the tap-highlight + touch-action, and the coarse `≥44px`
   `@media` floor. Keep the geometry vars.
3. **Sharp corners** — `border-radius:0` explicit (no theme.radius leak).
4. **Flat fills + invert the selection contract.** Unselected tiles get a solid
   opaque fill at rest (per-option colour if set, else `makeMix(accent,
   background, ~0.85)`); selected keeps the full intent fill + an **inset accent
   keyline** (`box-shadow: inset 0 0 0 2px <accent>`, sharp) so selection isn't
   colour-only (a11y). Keep error recolour + disabled tone.
5. **Monochrome glyph on the fill** — set the on-fill foreground in the resting
   state too (now that tiles are filled).
6. **Label bottom-left, light weight** — `innerStyle` → `justify-content:flex-end;
   align-items:flex-start` + bottom-left pad; drop `centered`/`variant='h6'`, use
   `fontWeight 300`, text-align left. Glyph centred-upper for square tiles.
7. **Press tilt (signature).** Perspective on the wrapper; on `pointerdown`
   compute normalized `px/py` from the press point, write to inline vars
   `--valet-metro-tilt-x/y` (continuous → inline vars, NOT rule text — createStyled
   cardinality), `data-pressed` → `transform: perspective(800px)
   rotateY(calc(var(--x)*8deg)) rotateX(calc(var(--y)*-8deg)) scale(.965)`; clear
   on up/cancel/leave. Leave `onClick`/`onKeyDown` untouched so `ChangeInfo.source`
   stays honest. `backface-visibility:hidden; will-change:transform`.
8. **Reduced-motion guard** — wrap the tilt in `@media (prefers-reduced-motion:
   no-preference)`; under reduce, a flat tactile cue (`brightness(.92)`/1px inset).
9. **Token the press timing** — `--valet-metro-press-dur` (motion.duration.xshort)
   + `--valet-metro-press-ease` on the root sx.
10. **Per-option flat colour (additive)** — `color?: string` on `MetroOptionProps`
    (resting fill; falls back to the field accent → existing look preserved when
    omitted). Continuous colour → inline var.
11. **Wide 2×1 tiles (additive)** — `wide?: boolean` on `MetroOptionProps` (spans 2
    modules + 1 gutter, same height). Cleanest via the grid (#12) as `span 2`.
12. **(Recommended) Layout: `<Stack wrap>` → a bespoke `styled('div')` CSS grid** —
    `grid-template-columns: repeat(auto-fill, var(--tile-w)); grid-auto-rows:
    var(--tile-h); gap: var(--metro-gap); justify-content:start`. NOT the `<Grid>`
    primitive (its `minmax(…,1fr)` stretches tracks + force-injects equalize vars,
    breaking the fixed Metro module + 2:1 wide ratio). Keep ALL listbox/role/
    keyboard/roving-activedescendant handlers + geometry vars on the new root.
    Floor the **track** for coarse (`repeat(auto-fill, max(var(--tile-w),
    var(--hit,44px)))`), not just the child. This is what makes the wall "snap";
    tight-gutter flex-wrap (#1, done) is the acceptable fallback.
13. Refresh `MetroSelect.meta.json` (done for gap; add `color`/`wide` + the visual
    restyle note when shipped).

## API changes (all additive / experimental, none type-breaking)

- `gap` default `0` → density-aware Metro gutter (8px / 4px compact). **[done]**
- `MetroOptionProps.color?: string` — per-tile flat resting fill (default: field accent).
- `MetroOptionProps.wide?: boolean` — 2×1 module (default false).
- Internal CSS vars: `--valet-metro-gap`, `--valet-metro-press-dur/-ease`, inline
  `--valet-metro-tilt-x/y` (per-press).

## Out of scope (post-1.0)

Finger-tracking tilt while held; per-press transform-origin; bespoke keyboard tilt
(a static scale-dip suffices); hover elevation; `MetroSelect.Group` headings +
group gaps; tile spans beyond 2×1; spring physics.

## Effort

Item 1 (gutter) ~30 min, **done**. Items 2–9 (flat sharp tiles + bottom-left label
+ press tilt) ~1–1.5 days, moderate risk concentrated in re-attaching all the
recent hardening (FormConfig, ≥44px floor, listbox ARIA + roving focus, useFieldState
binding, honest ChangeInfo.source) onto the new Tile when Panel goes away, and the
cardinality discipline on the tilt. Items 10–11 (color/wide) additive, ~½ day. Item
12 (grid) the swingiest (true snap vs tighter chips), ~½ day. Full restyle ~2–3 days.
Highest value-per-effort: gutter → press tilt → flat sharp tiles → grid → color/wide.
