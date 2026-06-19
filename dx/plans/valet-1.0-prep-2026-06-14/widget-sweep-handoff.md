# Widget sweep — session handoff (2026-06-18)

Branch: `feat/valet-1.0`. This is the live handoff for the 1.0 widget verification
sweep. **`verification-order.md` is the source of truth for component status** (it is
correct/current). `execution.md` is NOT — see the "Docs caveat" at the bottom.

## The sweep, in one line
Per-component, bottom-up: run an **adversarial fan-out analysis** (Workflow: N lenses →
independent verify → synthesis of questions/concerns/notes), present to Ben, fix
(agent gate: tests + source review), then Ben's **visual pass** → promote to `stable`.
A component is `stable` ONLY after BOTH gates. See memory [[stable-gates-on-bens-visual-pass]]
and [[both-gates-shipped-surface-blindspot]].

## Done this run (all committed + stable, both gates)
1. **Panel** — `ccee77d`-era; intent colours via computeIntentVars.
2. **Parallax trio** — `c3a49ff`; preset double-apply + reduced-motion video + `alt`.
3. **CodeBlock** — `c87cc6b`; honest copy, labelled/focusable code region, copy button
   floated INSIDE the block corner (compact `sm`), dropped overflow-stacking machinery.
4. **Markdown** — `d8df09c`; **blocker**: fenced code crashed bare consumers (depended on
   the app-only `codePanel` preset) → now uses Panel `pad={1}`. URL-sanitiser obfuscation
   fix, start=0/blockquote-token/keys, external-link `rel`, single-source code surface
   (stripped `.hljs` background). Helpers exported for unit tests.
5. **Table** — `91af530` (fix) + `d18d250` (promote); **blocker**: controlled selection
   was accept-then-void → now wired via `useControlledState<T[]>` keyed by `getItemKey`.
   Select-all header checkbox, selected-row visual, keyboard/≥44px rows, intent colours +
   divider token + inline vars, `scope='col'`, gated `aria-sort`, sort→page-1, page via
   useControlledState, stripped stale `selectable`/`rowKey` alias docs (meta/types/test).

## #6 Dropzone — IMPLEMENTED, NOT VERIFIED, NOT COMMITTED ⚠️
Ben's calls: **"defer, wire it"** → DEFER the add/remove screen-reader live region (do
NOT add it; keep the rejection region conditional), **WIRE** the `drag-active` class.
Then "exhaustively and excellently" on everything else.

Uncommitted working-tree changes (verify before trusting):
- **`src/components/widgets/Dropzone.tsx`** — full render restructure:
  - New outer container `<div>` (component root: `{...rest}`, `data-valet-component`,
    preset+className, consumer `sx`, sets shared vars `--valet-dz-focus` = primary and
    `--valet-dz-rm-hit` = `effCompact ? 24px : 44px`).
  - New `const DropArea = styled('div')` = the interactive drop target (gets
    `{...rootProps}`, `role='button'`, `aria-labelledby`/`aria-describedby`, the hidden input,
    icon, instructions). Border/bg via inline `--valet-dz-*` vars that flip on
    `isDragActive`: dashed idle → **solid + intent tint** (`makeMix(primary, background,
    0.1)`) drop-armed. Themed `:focus-visible` ring (`--valet-dz-focus`). Mobile chrome
    kit. `drag-active` className kept as a documented public styling hook.
  - New `const RemoveButton = styled('button')` — per-file remove; focus ring + chrome kit
    + coarse `::before` ≥44px hit-expander (`--valet-dz-rm-hit`). Used in both previews and
    file list (appearance via inline style per usage).
  - **Previews / fileList / rejections moved OUTSIDE `DropArea`** (siblings in the outer
    container) — fixes the bug where clicking a thumbnail re-opened the file picker, and
    the invalid interactive-in-`role=button` nesting.
  - Colours: remove-button border `${theme.colors.text}33` → `theme.colors.divider`;
    dropped the hardcoded `#00000010/#00000022` loading gradient (tile `backgroundAlt`
    shows through instead). All via `makeMix`/tokens.
  - Imports: removed `Panel`; added `styled`, `makeMix`, `useCompact`.
- **`src/components/widgets/Dropzone.meta.json`** — `a11y.notes` rewritten for honesty:
  drag state is NOT live-announced (updates instructions + chrome only); rejections ARE
  announced (polite, mounted while rejections exist); accepted add/remove NOT yet
  announced; focus ring present; `drag-active` is a public hook.

DEFERRED (Ben's call, not done): the always-present add/remove SR live region.

### Next session — finish Dropzone
1. **Run the gate battery** (nothing has been run — classifier was down):
   `npx eslint --fix src/components/widgets/Dropzone.tsx`, then `npm run lint`,
   `npm run typecheck`, `npm run check:engine`, `node scripts/checks/rtl-physical.mjs`,
   `npx vitest run` (esp. `Dropzone.dom.test.tsx` — expected to pass UNCHANGED: rejection
   region stays conditional so the `[aria-live="polite"]`-is-null assertion holds; remove
   `aria-label`s unchanged; previews/img/icon still inside the container), `npm run build`,
   `npm run mcp:build && npm run mcp:check && npm run mcp:schema:check`,
   `node scripts/checks/example-types.mjs`, `npx tsc -b docs`.
   - Likely-watch: the `dropAreaVars` is typed `Record<string,string>` and cast
     `as React.CSSProperties` at the `style=` site (avoids the custom-prop overlap error).
     The DropArea replaces Panel — confirm it visually reads as a proper drop zone.
2. Fix any failures; commit `feat(Dropzone): … [widget sweep #6]`.
3. **Present for Ben's visual pass** (`npm --prefix docs run dev` → Dropzone demo): dashed
   border turns solid + tinted on drag-over; focus ring on Tab; clicking a thumbnail no
   longer reopens the picker; remove buttons comfortably tappable.
4. On approval: flip meta `experimental`→`stable`, mark Dropzone `[x]` in
   verification-order.md, `npm run mcp:build`, commit the promotion.

## Remaining after Dropzone (Tier 8, hardest last)
- **#7 RichChat** (→ …/Markdown) — known notes: accessible name on composer textarea
  (a11y blocker); autoscroll bug (keys only on `messages.length`); input safe-area inset.
- **#8 KeyModal (rewrite)** — Modal accessible name; raw inputs→TextField/Select/Checkbox;
  try/catch async + disable-while-pending.
- **#9 LLMChat** — dead last (pulls in nearly the whole graph): nested span-in-button
  status control→IconButton+aria-live; model state via useControlledState; retire the
  Anthropic default model id.
Run the same dynamic fan-out per widget. NOTE: the Dropzone run's **verify stage hit API
529 overloads** and dropped several findings — supplement workflow output with a manual
source read when verifiers fail.

## Docs caveat
`verification-order.md` = correct + authoritative. `execution.md` has reverted to an older
"2026-06-17 / W1–W6" version and LOST the widget-sweep narrative log (commit `040d0f8`
still has the old log if reconstruction is wanted). Ben was asked whether to reconstruct
or keep it slimmed — undecided. Do not rely on `execution.md` for status.
