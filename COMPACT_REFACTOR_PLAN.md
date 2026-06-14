# Compact = zero + cascade — refactor plan

Branch: `feat/compact-zero-cascade` · off `development` · 2026-06-13

## Goal

Make the `compact` boolean a **hard zero of layout spacing** that **cascades** to all
spacing-aware descendants, and cleanly separate it from the density scale (whose
`'compact'` tier is renamed to `'tight'`). Two orthogonal axes after this:

| Axis | Prop | Meaning | Mechanism |
|---|---|---|---|
| **Spacing zero** | `compact?: boolean` | zero container pad / gap / spacing-margins, cascade to subtree | React context (`CompactCtx`) |
| **Spacing scale** | `density?: 'tight' \| 'standard' \| 'comfortable'` | multiply the spacing unit (0.9 / 1.0 / 1.15) | CSS var `--valet-space` |

## Locked decisions (signed off)

- **D1** — Keep the prop name `compact`. Do **not** reuse it for a density tier.
- **D2** — Rename the density value `'compact'` → `'tight'`. **Hard rename, no alias**
  (per the pre-1.0 "drop all deprecations" policy).
- **D3** — `compact={false}` on a descendant **opts out** of an inherited compact.
  `useCompact(own) = own ?? inherited`.
- **D4** — Preserve **alignment** under compact: `auto`/centering margins (alignX,
  centerContent) are never zeroed.
- **D5** — **Layout spacing only.** Compact zeros container `pad`, `gap`, and
  spacing-margins. It **preserves** control-internal padding (Select trigger inset,
  Chip pill padding, tab-button padding, field insets), **structural geometry**
  (Tree indentation + connector lines), border-radius, glyph/icon sizes, control
  heights, safe-area insets, and Modal viewport gutters.
- **D6** — **Visual scale follows density.** Size/label switches currently riding on
  `compact` (DateSelector icon size, cell height, weekday/month label length) move to
  `density === 'tight'`. Compact no longer changes element sizes.

## Veto register (awaiting your call — recommendation in **bold**)

- **V1 — Make `density` actually scale on layout components.** Today `density` on
  Stack/Panel/Grid/Tabs does *nothing* but feed the old conflation; after decoupling
  it would be a dead prop. **Recommend: have these set `--valet-space` locally**
  (mirroring Surface) so `<Panel density="comfortable">` genuinely loosens its
  subtree and `density="tight"` tightens it — matches "density changes everything" at
  subtree granularity. Alt: drop the `density` prop from these components.
- **V2 — Chat widget depth (LLMChat / RichChat).** **Recommend: minimal** — add a
  `compact` prop, route the existing hardcoded inner `compact` flags + fix
  RichChat's `compact={portrait}` misuse through the effective value, provide context,
  zero the top-level inter-message/wrapper gaps; **preserve** message-bubble padding
  (a readable inset per D5). Alt: exhaustively zero every literal inside the bubbles.
- **V3 — No new public `compact` prop on pure controls.** Chip / Select / Tree get
  **no** `compact` prop and **no** internal changes — context flows through them to
  any nested layout primitives automatically (per D5 their own chrome is preserved).
  DateSelector keeps its existing `compact` (now a relay; its visual effect moves to
  density per D6). **Recommend: yes, keep pure controls untouched.**

## Design — the cascade

New file `src/system/compactContext.ts`:

```ts
import { createContext, useContext } from 'react';
export const CompactCtx = createContext<boolean>(false);
export const useCompact = (own?: boolean): boolean =>
  own ?? useContext(CompactCtx);          // own=false opts out, true forces, undefined inherits
```

- A component zeroes its own layout spacing with `useCompact(ownCompact)`.
- A component that **changes** the value (has its own `compact` prop) wraps children in
  `<CompactCtx.Provider value={effective}>`. Components that only *relay* need no
  provider — React context passes through untouched, including across portals
  (Modal, Select menu) which inherit by React-tree position.
- Seed point: `Surface` provides the root value (default `false`).

## Waves

### Wave 0 — core (do first; everything imports these)
- `src/system/compactContext.ts` — new (above).
- `src/types.ts` — `SpacingProps.density` union `'compact'`→`'tight'`; rewrite the
  `compact` JSDoc to "zeros all layout spacing and cascades to descendants".
- `src/system/themeStore.ts` — `Density` union `'compact'`→`'tight'` (default stays
  `'standard'`; scale ternary already maps the 0.9 tier).

### Wave 1 — layout containers (decouple density + wire cascade; disjoint files, parallel)
- **Box** — `useCompact(compact)`; provide context. (pad already zeros.)
- **Stack** — delete `compact || density==='compact'`; `useCompact`; provide; (V1) density→`--valet-space`.
- **Panel** — delete conflation + unsafe cast; **destructure `density`** (fixes DOM leak); `useCompact`; provide; (V1).
- **Grid** — delete conflation; **destructure `density`** (DOM leak); rename local union; `useCompact`; provide; (V1).
- **Tabs** — delete conflation + cast; **destructure `density`** (DOM leak); `useCompact`; provide. Tab-button padding preserved (D5); (V1).
- **Modal** — replace bare `compact` with `useCompact(compact)`; provide. (already manually zeros sections.)
- **Accordion** — **drop `compact = false` default** (fixes inheritance); `useCompact`; provide. Item header padding preserved (D5).
- **Surface** — remove the `compact`→`'compact'` density alias; `useCompact` zeros the inner wrapper padding; keep `--valet-space` as the density scale; seed `CompactCtx.Provider`; rename density literals/JSDoc.

### Wave 2 — widgets + latent bug fixes
- **Divider** — `useCompact(compact)` so it inherits (its pad is a layout gutter → zeros). Leaf, no provider.
- **MetroSelect** — **fix latent bug**: inner `<Stack compact>` is hardcoded so the public `gap` prop is always dead-zeroed → route through effective compact; add `compact`; provide. Option insets preserved (D5).
- **LLMChat** — (V2) add `compact`; route the 3 hardcoded inner flags through effective; provide; zero top-level gaps; preserve bubble insets/radius.
- **RichChat** — (V2) **fix misuse**: `compact={portrait}` → `pad={portrait ? … }`; add `compact`; provide; preserve alignX bubble margins (D4) + bubble insets.

### Wave 3 — rename sweep + density-driven scale + regen docs
- 33 sweep sites: TS comparisons (`=== 'compact'` → `'tight'` where they survive), Grid local union, DateSelector union+JSDoc.
- Docs pages: `MainPage.tsx` density cycle, `ThemeEngine.tsx`, `DateSelectorDemo.tsx`, `PropPatterns.tsx` prose.
- **DateSelector** — move icon-size / cell-height / weekday+month label switches from `compact` to `density === 'tight'` (D6).
- Regenerate `mcp-data/**` via `scripts/mcp/extract-ts.mjs` (both copies) — do **not** hand-edit generated JSON.

### Wave 4 — tests, changelog, verify
- New: `compactContext.test.ts` (own ?? inherited) + a cascade dom test (`<Panel compact>` zeros a nested `<Stack>`, `compact={false}` opts a child back out).
- Update any density `'compact'` literals in tests/stories → `'tight'`.
- CHANGELOG entry: compact semantics change + density `'compact'`→`'tight'` hard rename + migration note.
- Verify: `tsc --noEmit`, eslint, vitest, build.

## Explicitly preserved / out of scope (D4 + D5)

Tree indentation & `--indent` connector geometry · Select trigger/menu/item insets &
Caret glyph & Menu UA reset · Chip pill padding/gap & DeleteBtn micro-margin · tab-button
padding · Accordion item-header padding · DateSelector cell/grid padding · raw `<input>`
padding in KeyModal · border-radius from the spacing scale · icon/glyph sizes & control
heights · `env(safe-area-inset-*)` · Modal `--valet-modal-viewport-margin` · all
`auto`/centering margins · `sx`-supplied padding (explicit author escape hatch).
`ProgressRing` (in `Progress.tsx`, no `ProgressRing.tsx`) is spacing-free → no change.

## Risks

- Wide blast radius: `<Surface compact>` / `<Stack compact>` now zero an entire subtree;
  intended, but documented as a behavior change (old `compact` shrank density to 0.9).
- Many leaf literals bypass `resolveSpace`; D5 means most are *preserved*, so the risk is
  reduced vs. the maximalist audit recommendations — but each container's own pad/gap
  path must be verified to route through the effective compact.
- Measurement-coupled components (Accordion height anim, chat constrain, ProgressRing
  fit) re-measure on layout change; verify compact toggling re-settles.
- `mcp-data` is generated → must re-run the extractor or docs drift.
