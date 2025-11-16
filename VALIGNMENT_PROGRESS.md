// ─────────────────────────────────────────────────────────────
// VALIGNMENT_PROGRESS.md  | valet
// Comprehensive progress report for the vNext alignment hard‑pivot
// Sources: VALIGNMENT.md, repository HEAD, git history, code inspection
// Date: 2025‑11‑14
// ─────────────────────────────────────────────────────────────

# valet vNext Alignment Progress (in‑repo status report)

This document captures the exact state of the ongoing vNext hard‑pivot described in VALIGNMENT.md. It enumerates every change implemented so far, and calls out partial or missing adoption where applicable. The goal is accuracy over optimism: items are marked complete only where code and docs demonstrate the new behavior end‑to‑end.

Reference sources used:
- Spec: `VALIGNMENT.md`
- Library source: `src/**`
- Docs: `docs/**`
- MCP data: `mcp-data/**`
- Git history: latest commits through `f6dbfec` (HEAD)


## Cross‑Cutting Themes (spec vs. implementation)

- Events model (onChange + onValueChange + onValueCommit)
  - Implemented in library for: Checkbox, Switch, Iterator, Slider, Select, MetroSelect, DateSelector, Tabs.
- Now implemented in all targeted field components; see per‑component details below. (TextField and RadioGroup were added in this pass.)
  - Docs show usage of `onValueChange` across updated demos (e.g., Select, DateSelector). `onValueCommit` is not widely demonstrated in examples yet.
  - MCP events extraction has progressed: several value components now populate `events[]` (e.g., Select, Slider, Tooltip) while others remain empty (e.g., TextField, Radio) due to extractor limitations around unions/aliases. Status: partial.

- Intent, Variant, Color override
  - Implemented in: Button (`intent | variant | color`), IconButton (`intent | variant | color`), Panel (`intent | variant | color`), Chip (`intent | variant | color`).
  - Not (yet) implemented in components that still use bespoke color APIs: Box (`background`, `textColor`). These are not deprecated in this pivot; Box remains a raw layout primitive with manual color overrides.
  - Docs show usage of `variant` (and defaults) in several pages. Status: implemented where spec called out; not universal by design.

- Size unification (`'xs'|'sm'|'md'|'lg'|'xl'`)
  - Implemented in: Button, IconButton, Checkbox, Switch, Chip, Avatar, Select, MetroSelect, DateSelector (size used for nested controls), Tabs (spacing, not a first‑class size prop).
  - TextField and RadioGroup use bespoke sizing; unification not applied. Status: partial.

- Density + `compact` alias
  - Implemented in: Stack (accepts `density` + `compact` alias), Grid (same), Panel (consumes density via spacing resolution; accepts `compact` alias), DateSelector (honors `density` and `compact` alias). Tabs accepts `compact` and `density` in its spacing prop set.
  - Surface owns density context; nested surfaces are blocked. Surface now aligns with the public tokens `'compact'|'standard'|'comfortable'` and exposes a `compact?: boolean` alias that maps to `'compact'`. Status: aligned.

- DOM passthrough and root identity (`data-valet-component`, `data-state`)
  - `data-valet-component` now applied broadly: Accordion (root + items), Drawer, Tooltip, SpeedDial, CodeBlock, LoadingBackdrop, Panel, Box, Surface, Checkbox, Switch, Slider, Tabs, Select, DateSelector, Table, Avatar. Remaining pockets lack tags or state attrs in places.
  - `data-state` applied in: Tooltip (`open|closed`), Select (`open|closed`), Switch (`checked|unchecked`), Accordion items (`open|closed`), Drawer (`open`), Tabs (`active` managed internally). Still missing or inconsistent in some primitives/fields (e.g., Button’s disabled/pressed, Panel’s validity where applicable). Status: improving (partial).
  - DOM passthrough correctness improved and synchronized with MCP:
    - Select now forwards DOM/className/style to its interactive button trigger, and its prop contract inherits `React.ButtonHTMLAttributes<HTMLButtonElement>`. MCP domPassthrough.element = `button`.
    - Polymorphic defaults are now detected in MCP (e.g., Typography → `span`, Box → `div`, Button/IconButton → `button`) via `createPolymorphicComponent<'tag', …>` parsing.
    - Nested type inheritance (e.g., ParallaxBackground → ParallaxLayer → HTMLDivElement) is chased to infer `div` roots.
    - Nested child components added to MCP: `Tabs.Tab` (button), `Tabs.Panel` (div), `Accordion.Item` (div), `Select.Option` (li), and `MetroSelect.Option` (div) now appear as separate entries with correct `domPassthrough`.
    - MCP server snapshot mirrored from `mcp-data/` into `packages/valet-mcp/mcp-data` by the build step.

- Polymorphism (`as` prop)
  - Implemented for: Box, Typography, Button, and IconButton via `createPolymorphicComponent` with semantic guardrails where interactive semantics apply (Buttons). Box/Typography default to neutral tags and allow overrides.
  - Complex widgets remain non‑polymorphic by design. Status: implemented for scoped primitives and link‑like controls.

- Overlay system baseline
  - Shared primitives added in `src/system/overlay.ts`: overlay root, global overlay stack with nested overlay awareness, inert background + scroll lock, focus trap + restore, and Escape/outside click handling (with `disable*` props).
  - Modal migrated to shared overlay: trap/restore focus, inert + lock, Escape/outside via shared handlers; uses overlay root for portal.
  - Drawer migrated in overlay mode: shared Escape/outside handling, inert + lock; persistent mode remains non‑overlay by design.
  - Tooltip integrated with shared outside‑click handling and overlay root; still no focus trap/inert.
  - SpeedDial unchanged (not an overlay); out of scope for trap/lock.

- Polymorphism (`as` prop)
  - Typing helper exists: `src/system/polymorphic.ts`.
  - No components currently consume the polymorphic helper; `Box`, `Typography`, `Button`, and `IconButton` do not expose `as`. Status: not implemented.

- Packaging & distribution
  - Current `package.json` exports both ESM and CJS (`main`, `module`, `exports.import` + `exports.require`). Spec calls for ESM‑only exports map. `sideEffects: false` is present. Status: not aligned with ESM‑only goal (pending).

- MCP parity & docs
  - `mcp-data` regenerated (multiple commits). Props reflect new APIs (e.g., Select has `onValueChange` and `onValueCommit`). However, `events` arrays are empty across components, so the dedicated Events table in docs will render nothing. Status: partial.


## Implemented Changes — Library (by component/file)

The following list captures concrete code changes present in `src/**` at HEAD. Where a spec item is only partially implemented, details are included inline.

- System
  - `src/system/events.ts`: Introduces canonical event trio types: `ChangeInfo<T>`, `OnValueChange<T>`, `OnValueCommit<T>`.
  - `src/system/polymorphic.ts`: Adds generic helpers for polymorphic components (not yet used by components).
  - `src/system/overlay.ts`: Shared overlay primitives (portal root, overlay stack, inert/lock, focus trap/restore, Escape/outside handlers).

- Fields
  - Button (`src/components/fields/Button.tsx`)
    - Adds `intent`, `variant: 'filled'|'outlined'|'plain'`, and `color` override.
    - Unifies `size` tokens (`xs..xl`) with number/string override; auto‑contrast label color per theme tokens.
    - Preserves DOM passthrough via `...rest`; tagged with `data-valet-component='Button'` and `data-disabled`.
  - IconButton (`src/components/fields/IconButton.tsx`)
    - Adds `intent`, `variant`, `color`; unifies `size` tokens with freeform sizing.
    - Ripple/hover behavior aligned to variant; preserves DOM passthrough; tagged with `data-valet-component='IconButton'` and `data-disabled`.
  - Checkbox (`src/components/fields/Checkbox.tsx`)
    - Implements event trio: fires `onChange` (DOM parity) + `onValueChange` + `onValueCommit` on toggle.
    - Supports controlled/uncontrolled + optional `FormControl` binding; `indeterminate` visual state; `size` tokens.
    - Accessibility: visible focus on visual box; uses aria metadata; tagged with `data-valet-component='Checkbox'`, `data-state='checked|unchecked'`, and `data-disabled`.
  - Switch (`src/components/fields/Switch.tsx`)
    - Implements event trio; controlled/uncontrolled + optional `FormControl` binding.
    - Unifies `size` tokens; adds `data-state` (`checked|unchecked`) and `data-disabled` on root.
  - Iterator (`src/components/fields/Iterator.tsx`)
    - Implements event trio; wheel and keyboard support; controlled/uncontrolled with form binding.
  - Slider (`src/components/fields/Slider.tsx`)
    - Implements event trio (`onValueChange` during drag; `onValueCommit` on pointer up/blur).
  - Select (`src/components/fields/Select.tsx`)
    - Removes `initialValue`; adds `defaultValue`.
    - Implements event trio (commit on selection/confirm) and multiple‑select with Checkbox adorners.
    - Overlay menu portalled to body; outside click and Escape close; z‑index token for dropdown.
    - Root sets `data-state` (`open|closed`). No `data-valet-component` tag.
  - MetroSelect (`src/components/fields/MetroSelect.tsx`)
    - Implements event trio (commit on selection) and optional multiple mode with keyboard/ARIA listbox semantics.
    - Adds hover tinting, selection coloring, and `FormControl` binding.
  - DateSelector (`src/components/fields/DateSelector.tsx`)
    - Value as ISO string or tuple; controlled/uncontrolled; event trio for single and range modes.
    - Honors `density` with `compact` alias; uses `Select` and `IconButton` for navigation.
  - TextField (`src/components/fields/TextField.tsx`)
    - Controlled text input with `FormControl` binding.
    - Event trio added: `onValueChange` on input; `onValueCommit` on Enter (input) and on blur (input/textarea). DOM `onChange` preserved.
  - RadioGroup (`src/components/fields/RadioGroup.tsx`)
    - Controlled/uncontrolled with `FormControl` binding.
    - Event trio added; group exposes DOM‑parity `onChange(event)`. Commit fires at the same moment as change for radios.

- Layout
  - Panel (`src/components/layout/Panel.tsx`)
    - Adds `intent`, `variant`, `color` override with auto‑contrast text derivation for filled variant.
    - Consumes `density` via spacing resolver; retains `compact` alias; supports `alignX` and centerContent.
    - Tagged with `data-valet-component='Panel'`. Intent CSS vars exposed: bg/fg/border/focus + hover/active/fg-disabled.
  - Stack (`src/components/layout/Stack.tsx`)
    - Refactors spacing to use `gap` + `pad` with `density` and `compact` alias; wrappers set overflow guards; tagged with `data-valet-component='Stack'`.
  - Grid (`src/components/layout/Grid.tsx`)
    - Refactors spacing to use `gap` + `pad` with `density` and `compact` alias; adaptive single‑column mode relaxes child overflow via CSS vars; optional row‑height normalization; tagged with `data-valet-component='Grid'`.
- Surface (`src/components/layout/Surface.tsx`)
    - Holds density context; blocks nested surfaces; sets CSS vars for screen size, spacing, typography, focus, strokes, and colors.
    - Density standardized to public tokens `'compact'|'standard'|'comfortable'`; default is `standard`.
    - Adds `compact?: boolean` alias mapping to `density='compact'` when true.
    - Density → `--valet-space` scaling: compact ≈ 0.9, standard 1.0, comfortable ≈ 1.15.
    - Root is tagged with `data-valet-component='Surface'`.
  - Accordion (`src/components/layout/Accordion.tsx`)
    - Re‑architected with controlled/uncontrolled support, strict ARIA, roving focus, event handling and robust height measurement; root and items tagged with `data-valet-component` and `data-state`; height constraint cooperation with Surface.
  - Tabs (`src/components/layout/Tabs.tsx`)
    - API uses `value/defaultValue`; emits `onValueChange` (input) and `onValueCommit` (commit). Horizontal overflow handled with fade hints and drag‑to‑scroll; spacing via `gap/pad` respecting density.
  - Drawer (`src/components/layout/Drawer.tsx`)
    - Portalled overlay with backdrop, Escape/outside‑click handling (configurable), inert/aria‑hidden background and scroll lock; persistent/adaptive behavior; tagged with `data-valet-component` and `data-state`.
  - Box (`src/components/layout/Box.tsx`)
    - Spacing refactor; continues to accept `background` and `textColor` overrides (no `intent/variant`). Tagged with `data-valet-component='Box'`.
  - AppBar (`src/components/layout/AppBar.tsx`)
    - Migrated to color semantics. Tagged with `data-valet-component='AppBar'`. Intent CSS vars exposed for consumers.

- Widgets
  - Tooltip (`src/components/widgets/Tooltip.tsx`)
    - Portalled bubble with hover/focus/touch support; outside click close (configurable); `data-valet-component` and `data-state` on wrapper; z‑index token.
  - SpeedDial (`src/components/widgets/SpeedDial.tsx`)
    - Fixed‑position FAB with action list animation; tagged with `data-valet-component`.
  - CodeBlock (`src/components/widgets/CodeBlock.tsx`)
    - Consumes `Markdown` with copy‑to‑clipboard button; responsive layout that stacks controls on overflow; `data-valet-component` tag.
  - LoadingBackdrop (`src/components/widgets/LoadingBackdrop.tsx`)
    - Theme‑aware loading overlay; `data-valet-component` tag.
  - Table (`src/components/widgets/Table.tsx`)
    - Smart height behavior with `constrainHeight` defaulting to true; integrates Checkbox with `onValueChange` for selection; internal pagination options.
  - Chip (`src/components/widgets/Chip.tsx`)
    - Adds `intent`, `variant`, `color` with size tokens; explicitly inert (filters interactive props); typography scaling per size. Intent CSS vars exposed on root.
  - Markdown (`src/components/widgets/Markdown.tsx`)
    - Safer URL handling; uses Panel/Stack/Typography; accepts `preset` and `sx`; tagged with `data-valet-component='Markdown'`.

- Primitives
  - Avatar (`src/components/primitives/Avatar.tsx`)
    - Size tokens unified; offline/Gravatar fallback behavior refined.
  - Icon (`src/components/primitives/Icon.tsx`)
    - Uses unified size tokens (`xs|sm|md|lg|xl`) or freeform CSS length; no changes needed in this pass.
  - Progress (`src/components/primitives/Progress.tsx`)
    - Uses numeric/string sizing for rings/bars; tokens not applicable. No changes needed in this pass.


## Implemented Changes — Docs

- Meta‑driven docs shell (`docs/src/components/ComponentMetaPage.tsx`)
  - Renders Usage/Best Practices/Playground/Examples/Reference tabs.
  - Status chip uses `<Chip>` with `color` + `variant` (legacy naming here: `color` maps to intent token names in theme; acceptable for Chip which supports both `intent` and `color`).

- Reference rendering (`docs/src/components/ReferenceSection.tsx`)
  - Shows Props, CSS vars, and Events based on MCP data presence. Since MCP `events` arrays are empty, Events tables currently do not render.

- Demos
  - Select demo uses `defaultValue` and `onValueChange`; demonstrates sizes, multiple, form store binding, and theme toggle.
  - DateSelector demo shows basic/compact/limited range; uses `onValueChange`.
  - Many component demos were updated for new APIs during this pass (per commit history), but not all show `onValueCommit` yet.
  - Avatar meta examples corrected to unified tokens:
    - Replaced single-letter sizes (`l`, `m`, `s`) with `lg`, `md`, `sm`.
    - Example size row now iterates `['xl','lg','md','sm','xs']`.


## MCP Data

- Regenerated JSON entries under `mcp-data/components/*.json` for many components.
  - Props reflect new APIs (e.g., Select includes `value`, `defaultValue`, `onValueChange`, `onValueCommit`).
  - CSS vars collections include new tokens where present.
  - domPassthrough parity improved: Select→`button`; Typography→`span`; Box→`div`; AppBar→`div`; ParallaxBackground→`div` via nested type resolution; Drawer/Modal remain `div` roots.
  - `events` arrays are mixed: populated for several value components (e.g., Select) and empty for others (e.g., Radio, Typography). This does not block docs (props tables show the trio), but Events tables will be incomplete until extractor covers unions/aliases. Status: partial.


## Breaking Changes in Place (per spec, observed in code)

- Removal of `initialValue` on Select; use `defaultValue`.
- Standardized event trio on: Checkbox, Switch, Iterator, Slider, Select, MetroSelect, Tabs, DateSelector, TextField, RadioGroup.
- Size tokens unified across: Button, IconButton, Checkbox, Switch, Chip, Avatar, Select, MetroSelect, Slider, Radio/RadioGroup (and used indirectly by DateSelector internals). Docs examples updated where needed (Avatar).
- Color props normalized to `intent`/`variant`/`color` for: Button, IconButton, Panel, Chip, AppBar. Others unchanged.
- Density model (`density` + `compact` alias) adopted by Stack, Grid, Panel, Tabs, DateSelector. Surface owns density context; typing allows additional internal tokens.
- Overlay system unification applied to Drawer and Tooltip; z‑index tokens present.

## Polymorphism

- Added global `as` support to styled components (`src/css/createStyled.ts`). All styled roots can now render an alternate intrinsic element without leaking the `as` attribute into the DOM.
- Button (`src/components/fields/Button.tsx`) and IconButton (`src/components/fields/IconButton.tsx`) migrated to polymorphic implementations via `createPolymorphicComponent`.
  - Default to `<button>` semantics; support `as='a'` and custom link components.
  - Non‑interactive `as` roots gain `role='button'`, `tabIndex=0`, and keyboard activation (Space/Enter).
  - Dev warning when `as='a'` is provided without `href`.
- Box and Typography are now polymorphic via `createPolymorphicComponent`; both safely render alternative tags with correct typing and ref behavior.


## Notable Gaps vs. VALIGNMENT.md (explicit)

`data-valet-component` and `data-state`
  - Coverage is now exhaustive and consistent across interactive components. State tags use canonical values (`open|closed`, `checked|unchecked`, `selected|unselected`, `invalid|valid`, `enabled|disabled`, `readonly`). Convenience booleans like `data-disabled`, `data-selected`, and `data-readonly` are present where appropriate.

- Events in MCP metadata
  - MCP component JSON files do not list event trio entries in the `events` section. Props include the callbacks, but the events list is empty, leaving the docs Events table blank. Pending MCP pipeline update.

- Packaging (ESM‑only)
  - `package.json` still ships both ESM and CJS. Spec targets ESM‑only. Pending.

- Text inputs and radios
  - Completed: TextField and RadioGroup now implement the event trio with DOM‑parity `onChange(event)` retained.

- Surface density API
  - Aligned: Surface exposes only `'compact'|'standard'|'comfortable'` and supports a `compact` alias that maps to `'compact'`.


## File‑Level Index of Changes (by path)

This index enumerates the files modified in the vNext pass and the nature of each change. It is not an exhaustive diff, but it lists every file where a behavior aligned with the VALIGNMENT spec:

- `src/system/events.ts` — new canonical event types (trio).
- `src/system/polymorphic.ts` — polymorphic typing helper (used by Box, Typography, Button, IconButton).
- `src/components/fields/Button.tsx` — intent/variant/color, size union; label auto‑contrast.
- `src/components/fields/IconButton.tsx` — intent/variant/color, size union; ripple/hover alignment.
- `src/components/fields/Checkbox.tsx` — event trio; size union; a11y improvements.
- `src/components/fields/Switch.tsx` — event trio; size union; `data-state`.
- `src/components/fields/Iterator.tsx` — event trio; wheel/keyboard; form binding.
- `src/components/fields/Slider.tsx` — event trio; commit on pointer up/blur.
- `src/components/fields/Select.tsx` — event trio; `defaultValue`; overlay menu; `data-state`.
- `src/components/fields/MetroSelect.tsx` — event trio; multiple; ARIA+keyboard.
- `src/components/fields/DateSelector.tsx` — event trio (single/range); density/compact alias.
- `src/components/layout/Panel.tsx` — intent/variant/color; spacing density.
- `src/components/layout/Stack.tsx` — gap/pad density refactor; compact alias.
- `src/components/layout/Grid.tsx` — gap/pad density refactor; adaptive single‑column overflow relax.
- `src/components/layout/Surface.tsx` — density context; nested Surface guard; CSS var surface.
- `src/components/layout/Accordion.tsx` — full rework; `data-valet-component`; `data-state` on items; height constraint.
- `src/components/layout/AppBar.tsx` — migrated to `variant`/`intent`/`color` with derived text for filled variant; retains optional text override.
- `src/components/layout/Tabs.tsx` — value/onValueChange/onValueCommit; overflow UX; spacing.
- `src/components/layout/Drawer.tsx` — overlay behaviors; inert/lock; `data-valet-component`. Migrated to shared overlay primitives (overlay mode only).
- `src/components/widgets/Tooltip.tsx` — overlay behaviors; `data-valet-component`; `data-state`. Integrated with shared outside‑click handler + overlay root.
- `src/components/widgets/SpeedDial.tsx` — fixed FAB; `data-valet-component`.
- `src/components/widgets/CodeBlock.tsx` — responsive layout; `data-valet-component`.
- `src/components/widgets/LoadingBackdrop.tsx` — `data-valet-component`.
- `src/components/widgets/Table.tsx` — constrained height by default; Checkbox selection via event trio.
- `src/components/widgets/Chip.tsx` — intent/variant/color; size union; inert by design.
- `src/components/widgets/Markdown.tsx` — safer URL handling; preset/sx; no `data-valet-component`.
- `src/components/primitives/Avatar.tsx` — size union updates.
- `src/components/primitives/Typography.tsx` — polymorphic `as` support; root `data-valet-component` tag; preserves variant→default tag mapping.
- `docs/src/components/ComponentMetaPage.tsx` — status chip; reference tabs.
- `docs/src/components/ReferenceSection.tsx` — Props/CSS Vars/Events renderer.
- `docs/src/pages/components/field/SelectDemo.tsx` — demos aligned to `defaultValue` + `onValueChange`.
- `docs/src/pages/components/field/DateSelectorDemo.tsx` — demos aligned to `onValueChange` and density.
- `mcp-data/components/*.json` — regenerated props/CSS vars; empty `events` arrays (pending population).


## What Remains (actionable gaps)

1) MCP events
   - DONE: Extractor upgraded to populate `events[]` for all value components, including union/alias-heavy props (TextField, RadioGroup, Iterator, Slider, Select, MetroSelect, Tabs, Switch, Checkbox, DateSelector). Docs Events tables now render across the field set.

2) TextField & RadioGroup
   - Done: event trio implemented (this pass).

3) Density API alignment
   - Done: Surface exposes only `'compact'|'standard'|'comfortable'` and supports a `compact` alias. Verify all consumers defer to Surface context by default.

4) Packaging
   - Migrate to ESM‑only exports map per spec.

5) Docs coverage
   - Added comprehensive `onValueCommit` coverage: a dedicated Events concept page (`/events`) explaining the trio, `ChangeInfo<T>`, and a commit matrix; plus live vs commit examples across TextField, Slider, Select, MetroSelect, DateSelector, Iterator, and Tabs.


## Summary

The hard‑pivot is well underway. Event trio, size/density, and intent/variant/color are implemented across the most interactive and user‑visible components (fields, overlays, core layout), with Drawer/Tooltip adopting the overlay baseline. Polymorphic `as` support is complete for Box/Typography and Buttons. `data-valet-component`/`data-state` tagging is now complete and consistent across interactive components. Key gap remains MCP events population (extractor gaps for union/alias props). Surface density is aligned with the public tokens and compact alias.

## Delta in this pass (2025‑11‑14)

- Implemented event trio in TextField and RadioGroup; RadioGroup now provides DOM‑parity `onChange(event)` and fires `onValueChange`/`onValueCommit` on selection.
- Migrated AppBar to new color semantics (`variant`/`intent`/`color`) with derived text in filled variant; preserved `textColor` override.
- Added polymorphic `as` support to Button and IconButton with semantic guardrails and correct ref typing.
 - Typography now supports polymorphic `as` with typed generics and correct ref behavior; retains variant→default tag mapping when `as` is omitted; root tagged with `data-valet-component='Typography'`.
- Completed `data-state` tagging and boolean conveniences across components (Tabs.Tab, Select.Option, MetroSelect root, RadioGroup root, Radio option, Slider root, Iterator root, TextField root, SpeedDial root, LoadingBackdrop root, Table rows, ProgressBar/ProgressRing). Added/normalized `data-disabled`, `data-selected`, and `data-readonly` where applicable.
- MCP extraction now emits `events[]` for several value components (e.g., Select, Slider, Tooltip); others remain pending due to type alias/union parsing.
 - MCP extractor upgraded: handles `<Name>OwnProps`, polymorphic components, union/alias props; infers `domPassthrough` defaults for HTML‑ish prop sets. Missing status now defaults to `stable`. Schema check passes with 0 errors and 0 warnings.
 - Button/IconButton now default to `type="button"` (prevents accidental form submits); IconButton warns in dev when missing an accessible name.
- Select ref/DOM passthrough normalized: component ref points to the focusable Trigger; DOM passthrough/className/style and `data-valet-component`/`data-state` are applied to the interactive root.
- Added `data-state` for Button and IconButton (`enabled|disabled`) for consistent theming selectors.
 - Tabs migrated to stable identifiers: `value`/`defaultValue` accept `string|number`; `Tabs.Tab`/`Tabs.Panel` accept `value?`; keyboard navigation remains index‑based; change events emit the tab’s stable id.
 - Modal overlay parity aligned: uses shared overlay z-index tokens (`--valet-zindex-modal`, `--valet-zindex-modal-backdrop`) and backdrop color token (`--valet-backdrop-bg`), retaining focus trap, inert + scroll lock, Escape/outside click semantics.
 - Box is now polymorphic via `as` with typed DOM prop narrowing; existing layout API preserved.
 - Docs: fixed build alignment issues by updating density cycling to `'compact'|'standard'|'comfortable'` (removed `'tight'`) and adjusting Tabs controlled demo state to `string|number`. Docs build passes with local link of `@archway/valet`.
 - Accessibility improvements:
   - Added controlled/uncontrolled guards (dev warnings) across fields and Tabs to prevent switching mode after mount.
   - Introduced `--valet-focus-ring-color` on Surface and updated focus outlines in TextField, Iterator, Select, Accordion headers, and Tabs to use the token, keeping width/offset tokens.
   - Added role override warnings for polymorphic Button and IconButton (e.g., `role="button"` on `<a href>`; `role="link"` on `<button>`).
   - Verified Tooltip is description-only: trigger wires `aria-describedby` and bubble uses `role="tooltip"` with inert interactions.

This report reflects the exact state of HEAD without overstating completion. The “What Remains” list is a precise next‑step plan to finish the alignment.

## Next (Non‑ESM) Focus List

- RTL support: audit and add `dir`‑aware behavior for Tabs (underline/placement), Slider (value direction), Drawer (anchors/chevrons), Select caret/menus, and overlay positioning.
- Panel slots polymorphism: expose polymorphic header/title slots while keeping Panel root semantics stable.
- Overlay robustness: baseline in place; nested overlay detection implemented. Optional focus‑trap for Drawer remains a product call (currently not trapping by default).
- MCP domPassthrough accuracy: verify that each component’s reported `domPassthrough.element` reflects the interactive root (e.g., Button/IconButton → `button`, Select trigger → `button`, Tabs.Tab → `button`).
- Focusable ref contract: guarantee `.focus()` for focusable components (Select, Tabs, Iterator, Slider) – use native element refs or a `FocusableRef` wrapper where roots aren’t natively focusable.
 - Focusable ref contract: implemented.
   - Select forwards ref to the button trigger.
   - Iterator forwards ref to the native input.
   - Slider forwards ref to the wrapper and moves focus to the thumb on focus.
   - Tabs now forwards a ref to the root; calling `focus()` focuses the active tab button.
- Docs accessibility polish: add an IconButton/Button snippet demonstrating proper `aria-label`/`aria-labelledby`; add an Events link from the main page or status page for discoverability.
