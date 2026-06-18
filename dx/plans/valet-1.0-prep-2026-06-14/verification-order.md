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
- **`stable` requires BOTH gates — never flip on the agent's say-so alone:**
  1. **Agent pass** — tests green + source review (the agent does this and records it
     in the log as _"agent-verified, awaiting Ben's visual pass"_; status stays
     `experimental`).
  2. **Ben's visual pass** — Ben runs the component in the docs/app and confirms it
     looks/behaves right.
  Only after **both** does the `*.meta.json` `status` flip to `stable`, then
  `npm run mcp:build && npm run mcp:check`. The agent must not pre-promote on the
  strength of the test suite — green tests are necessary, not sufficient.
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
- [ ] **FormControl** (form-store provider; before any bound field) — _agent-verified 2026-06-17, tests green, awaiting Ben's visual pass_ · [ ] **ValetErrorBoundary** — _agent-verified 2026-06-17, tests green, awaiting Ben's visual pass_

## Tier 2 — Box-family layout + the hoists

> **Stack/Grid are on a first-class redesign track** (Ben, 2026-06-17) — see
> [`stack-grid-evaluation-2026-06-17.md`](stack-grid-evaluation-2026-06-17.md).
> Verdict: Stack = improve (W0 infra + W1 done, awaiting visual pass), Grid =
> rewrite (W2, pending). These supersede a plain "verify as-is" for those two.

- [x] **Box** _(stable 2026-06-17 — both gates)_ · [x] **Stack** _(stable 2026-06-17 — W1 improve + HStack/VStack/Center/Cluster/Spacer; both gates)_ · [x] **Grid** + **GridItem** _(stable 2026-06-17 — W2 rewrite; both gates)_ — Grid is now Surface-decoupled (the old surfaceStore read is gone)
- [x] **LoadingBackdrop** _(stable 2026-06-17 — both gates)_ — hoisted out of widgets; renders Progress; must precede the Surface component
- [x] **List** _(stable 2026-06-17 — both gates)_ (→ Typography)

## Tier 3 — Surface component + overlay composites

- [x] **Surface** _(stable 2026-06-17 — both gates)_ — now safe (Progress + LoadingBackdrop locked); the DOM bridge that writes `--valet-space`/density
- [x] **Modal** _(stable 2026-06-17 — both gates)_ · [x] **Tooltip** _(stable 2026-06-17 — both gates; SSR portal fix landed)_ (hoisted early to unblock Tabs) · [x] **SpeedDial** _(stable 2026-06-17 — both gates)_

## Tier 4 — Field foundations + standalone fields

- [x] **Button** _(stable 2026-06-17 — both gates)_ (→ Typography) · [x] **IconButton** _(stable 2026-06-17 — both gates)_ (→ Icon) — foundations for AppBar/Drawer/Iterator/CodeBlock
- [x] **Checkbox** _(stable 2026-06-17 — REDONE colors/mobile/sizing per [checkbox-redo](checkbox-redo-2026-06-17.md); both gates)_ (before Select/Table) · [x] **Switch** _(stable 2026-06-17 — both gates; mobile hardened: chrome kit + ≥44px coarse-pointer hit target)_ · [x] **Slider** _(stable 2026-06-17 — both gates; mobile hardened: thumb chrome kit + ≥44px coarse-pointer grab target + track/thumb touch-action)_ · [x] **TextField** _(stable 2026-06-17 — REWRITTEN styled layer per [textfield-critique](textfield-critique-2026-06-17.md) + FormConfigCtx; both gates)_
- [x] **Radio + RadioGroup** _(stable 2026-06-17 — both gates; intent-color alignment (fixed the white-dot-on-pale bug) + mobile (≥44px tap rows + chrome kit) + group `disabled` + FormConfigCtx)_ — verified as ONE unit
- [x] **Pagination** _(stable 2026-06-17 — both gates; mobile ≥44px nav buttons + chrome kit; meta `siblingCount`→`visibleWindow` fix)_ (→ Typography; hoisted — foundation for Table)

## Tier 5 — Surface-consuming layout + Select

- [x] **AppBar** _(stable 2026-06-18 — both gates; intent vars + SSR-safe portal; added a coarse-pointer ≥44px floor for icon-only `navigation` buttons via `--valet-appbar-navbtn`)_ · [x] **Drawer** _(stable 2026-06-18 — both gates; focus-trap dialog + inert bg + adaptive orientation + RTL; added `touch-action:none` on the backdrop)_ · [x] **Accordion** _(stable 2026-06-18 — both gates; mobile chrome kit + coarse ≥44px header floor (`--valet-acc-hit`, 40px compact). Accordion.Item promoted too.)_ · [x] **Tabs** _(stable 2026-06-18 — both gates; chrome kit completion + coarse ≥44px tab floor (`--valet-tab-hit`, 40px compact); meta fixed (`variant`→orientation/placement, added examples). Tabs.Tab + Tabs.Panel promoted too.)_ (→ Tooltip, now locked)
- [x] **Select** _(stable 2026-06-18 — both gates; FIXED the flagged dropdown-overlap (inline-block → width:100% column model) + `width` prop + FormConfigCtx + mobile ≥44px trigger/options + deterministic intent-aligned colours matching TextField. Select.Option promoted too.)_ (→ Checkbox + overlay; foundation for DateSelector) · [x] **Snackbar** _(stable 2026-06-18 — both gates; WCAG 2.2.1 pause-on-hover/focus + role=status live region + reduced-motion; added safe-area-inset-bottom positioning + new `filled` variant (outline default))_ · [x] **Chip** _(stable 2026-06-18 — both gates; intent vars + inert static-descriptor contract; coarse ≥44px hit-expander + chrome kit + focus ring on the delete button (`--valet-chip-del-hit`, 32px compact))_ · [ ] Tree

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

1. **Agent pass:** verify a tier's components (top-down) — tests + source review.
   Leave each `experimental`; log it as _agent-verified, awaiting Ben's visual pass_.
2. **Ben's visual pass:** Ben runs each in the docs/app and confirms it.
3. Only for components that cleared **both** gates: set `status: "stable"` in its
   `src/components/**/<Name>.meta.json`.
4. `npm run mcp:build && npm run mcp:check && npm run mcp:schema:check` (corpus stays fresh + valid).
5. Commit (`chore(1.0): promote <components> to stable after verification`).

Derived via `.claude/wf-verify-order.js` (re-runnable if the import graph changes).
