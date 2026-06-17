# 1.0 Component Verification Order — 2026-06-14

> Companion to [`plan.md`](plan.md) / [`execution.md`](execution.md). Every component
> was reset to `status: experimental` for a pre-1.0 re-test pass; promote each back
> to `stable` as it's verified. This is the **ideal order to verify in** — derived
> from the real cross-component import graph (topological sort), so a foundation is
> never fixed after something that depends on it (no chicken-and-egg rework).

## The principle

**Strict bottom-up topological order:** verify a component only after *everything it
imports/renders* is already verified and locked. Leaves and cross-cutting subsystems
first; the most composite widgets last. Three layering **inversions** (a "low" layer
importing a "high" one) are resolved by hoisting the depended-upon piece earlier —
see [Gotchas](#gotchas-the-back-edges).

## How to use

- Work top-to-bottom. Don't start a tier until the tiers above it are green.
- When a component passes your review, flip its `*.meta.json` `status` → `stable`,
  then `npm run mcp:build && npm run mcp:check`. (Or hand me the batch and I'll do
  the flip + corpus rebuild + gates.)
- A component still `experimental` at the 1.0 cut is simply carved out of the SemVer
  guarantee (see [`VERSIONING.md`](../../../VERSIONING.md)).

## Tier 0 — Cross-cutting foundations (NOT components — verify first)

Everything renders through these; lock them before any component. Most are already
covered by the suite — this is "confirm the gates are green + eyeball the freshly
retuned spacing/density numbers."

- [ ] **CSS engine** (`src/css`) — the graph root; all `styled()`/`keyframes()` flow through it.
  `npm run build && npm run check:engine` · `npx vitest run src/css`
- [ ] **Theme + spacing/density** (`themeStore`, `themeUtils.spacing`, `densityScale`, `resolveSpace`, `compactContext`, `styles.css`) — **freshest, riskiest change.**
  `npx vitest run src/utils/resolveSpace.test.ts src/system/themeUtils.test.ts src/system/createInitialTheme.test.ts src/system/intentVars.test.ts`
  Canary for the retune: `npx vitest run src/components/layout/Grid.dom.test.tsx src/components/layout/Panel.dom.test.tsx` (gap/pad default ×2; density writes inline `--valet-space`; `--valet-panel-width:100%`). Inspect `densityScale.ts` (0.8/0.9/1.0) + `styles.css` root `--valet-space`.
- [ ] **surfaceStore *contract*** (store/breakpoint/child-registry — *not* the Surface component yet).
  `npx vitest run src/system/surfaceStore.dom.test.ts`
- [ ] **Overlay engine** (`src/system/overlay` + `zIndex`).
  `npx vitest run src/system/overlay.dom.test.ts src/system/overlay.registry.dom.test.tsx src/system/resolveOutsideClick.test.ts src/system/resolveTabAction.test.ts src/system/zIndex.repo.test.ts`
- [ ] **Form store** (`createFormStore` + `FormControl`/`useControlledState`).
  `npx vitest run src/system/createFormStore.test.ts src/components/fields/controlledContract.dom.test.tsx`
- [ ] **Events vocabulary** (`src/system/events.ts` — `ChangeInfo`/source/phase table).
  `npx vitest run src/system/events.contract.dom.test.tsx`

## Tier 1 — Pure leaves (no sibling-component imports)

- [x] **Icon** — highest fan-in; lock first
- [x] **Typography** — highest fan-in; lock first
- [x] **Progress** (ProgressBar/ProgressRing) — bottom of the `Surface→LoadingBackdrop→Progress` chain
- [x] Avatar · [x] Image · [x] Divider · [x] Video · [x] WebGLCanvas
- [ ] **FormControl** (form-store provider; before any bound field) — _reviewed 2026-06-17, tests green, awaiting Ben's manual pass_ · [ ] ValetErrorBoundary

## Tier 2 — Box-family layout + the hoists

- [ ] **Box** · [ ] **Stack** · [ ] **Grid** — center of the spacing/density retune; reads only the surfaceStore *contract*
- [ ] **LoadingBackdrop** — hoisted out of widgets; renders Progress; must precede the Surface component
- [ ] List (→ Typography)

## Tier 3 — Surface component + overlay composites

- [ ] **Surface** — now safe (Progress + LoadingBackdrop locked); the DOM bridge that writes `--valet-space`/density
- [ ] Modal · [ ] **Tooltip** (hoisted early to unblock Tabs) · [ ] SpeedDial

## Tier 4 — Field foundations + standalone fields

- [ ] **Button** (→ Typography) · [ ] **IconButton** (→ Icon) — foundations for AppBar/Drawer/Iterator/CodeBlock
- [ ] **Checkbox** (before Select/Table) · [ ] Switch · [ ] Slider · [ ] TextField
- [ ] **Radio + RadioGroup** — verify as ONE unit (Radio lives inside RadioGroup with a context guard; not splittable)
- [ ] **Pagination** (→ Typography; hoisted — foundation for Table)

## Tier 5 — Surface-consuming layout + Select

- [ ] AppBar (→ Button) · [ ] Drawer (→ IconButton) · [ ] Accordion · [ ] **Tabs** (→ Tooltip, now locked)
- [ ] **Select** (→ Checkbox + overlay; foundation for DateSelector) · [ ] Snackbar · [ ] Chip · [ ] Tree

## Tier 6 — Composite fields

- [ ] Iterator (→ IconButton) · [ ] MetroSelect (→ Icon/Panel/Stack/Typography) · [ ] **DateSelector** (→ IconButton + Select; field-tier sink)

## Tier 7 — Table / Markdown subtree

- [ ] **Table** (→ Checkbox + Pagination) · [ ] **Markdown** (→ Stack/Panel/Typography/Image/Divider/**Table**) · [ ] KeyModal (→ Button/Modal/Panel/Stack/Typography + aiKeyStore)

## Tier 8 — Final composites

- [ ] CodeBlock (→ IconButton/Markdown/Snackbar) · [ ] RichChat (→ …/Markdown)
- [ ] **LLMChat** — dead last (transitively pulls in nearly the whole graph: …/Select/TextField/Markdown/KeyModal + aiKeyStore)
- [ ] Parallax cluster — isolated; `ParallaxScroll` → `ParallaxLayer` → `ParallaxBackground` (any time after foundations)

## Gotchas (the back-edges)

The real import graph has "low imports high" inversions; naive "layout first" breaks on these:

| Inversion | Handling |
| --- | --- |
| `Surface` → `LoadingBackdrop` → `Progress` | Pull the chain down: Progress (T1) → LoadingBackdrop (T2, hoisted from widgets) → **Surface component** (T3). The surfaceStore *contract* is split into T0 so `Grid` (reads only the store) needn't wait on the Surface component. |
| `Tabs` → `Tooltip` | Hoist `Tooltip` to T3 (its only real dep is the overlay engine); verify `Tabs` in T5. |
| `AppBar`/`Drawer` → `Button`/`IconButton` | Verify the two button fields early (T4); AppBar/Drawer in T5. No cycle (buttons don't import layout). |
| `Markdown` → `Table` → `Pagination`/`Checkbox` | `Pagination`+`Checkbox` (T4) → `Table` (T7) → `Markdown` (T7). |
| `CodeBlock`/`RichChat`/`LLMChat` → `Markdown` (+ `LLMChat` → `KeyModal`) | Lock `Markdown`+`KeyModal` (T7); chat/code shells in T8, `LLMChat` last. |
| `Radio` ⇄ `RadioGroup` | Not a file cycle — a coupled unit. Verify together (T4). |

> Edges beyond the initial grep were confirmed in source by the mapping pass:
> `Markdown.tsx:15` (→Table), `CodeBlock.tsx:7-8`, `RichChat.tsx:16`, `LLMChat.tsx:34/36`,
> `DateSelector.tsx:32-33`, `Select.tsx:31`, `Iterator.tsx:16`.

## Promotion workflow (per batch)

1. Verify a tier's components (top-down).
2. For each passing component: set `status: "stable"` in its `src/components/**/<Name>.meta.json`.
3. `npm run mcp:build && npm run mcp:check && npm run mcp:schema:check` (corpus stays fresh + valid).
4. Commit (`chore(1.0): promote <components> to stable after verification`).

Derived via `.claude/wf-verify-order.js` (re-runnable if the import graph changes).
