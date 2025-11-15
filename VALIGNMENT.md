# valet vNext Alignment and Upgrade Spec (Pre‑1.0 Hard Pivot)

Status: Draft for review • Owner: 0xbenc (+ agent) • Scope: library + docs + MCP • Date: 2025‑11‑14

This document locks the API and behavioral conventions for the upcoming pre‑1.0 upgrade of valet. It reflects a hard pivot: no deprecations, no shims, immediate removal/renames. The goal is long‑term alignment and quality across two consuming apps and the docs.

Contents
- Principles & Non‑Goals
- Important Context & Preferences
- Cross‑Cutting API Conventions
- Events Model (adopted)
- Intent, Variant, and Color Override (adopted)
- Size & Density (adopted)
- Controlled vs Uncontrolled (adopted)
- Accessibility Baselines (adopted)
- Overlay System Baseline (adopted)
- Styling Escape Hatches & DOM Passthrough (adopted)
- Polymorphism (adopted)
- Packaging & Distribution (adopted)
- MCP Parity & Docs (adopted)
- Component Inventory & Required Changes
- Breaking Change Index
 - Implementation Progress
 - What Remains (Next Steps)
 - Critical References & Commands
 - Key Decisions Recap
 - Pitfalls to Avoid
- Validation & Release Gates
- Appendices (Types, CSS Vars, Overlay Tokens, Event Matrix, Polymorphic Typing)

---

## Principles & Non‑Goals

- Hard pivot policy
  - No deprecations or compatibility shims. Remove legacy props/behaviors outright.
  - Align names, events, and tokens now to avoid post‑launch churn across both apps.
- Non‑goals (for this release)
  - SSR/FOUC: intentionally out of scope. Client theme init and font loading are acceptable.
- Target environment
  - Node ≥ 18 (CI/dev target Node 22). React 18+. ESM‑first bundling.
  - Accessibility is mandatory. Performance and bundle size are first‑class concerns.

---

## Important Context & Preferences

- Hard pivot is policy
  - Pre‑1.0: no deprecations, no shims, remove legacy props/events immediately.
- No hidden synonyms
  - Tokens are exact. Use `error`, not `danger`. Do not alias status/intent/density/size names.
- Focusable ref contract
  - Focusable components forward a ref to the focusable root element. If the concrete element is abstracted, they expose a `FocusableRef` shape that guarantees a working `.focus()`.
- DOM passthrough is required
  - Forward `aria-*`, `data-*`, `id`, `tabIndex`, `role`, `className`, `style` to the semantic root; tag roots with `data-valet-component` and `data-state` consistently.
- Packaging
  - ESM‑only, no deep imports; `sideEffects: false`; exports map drives both runtime and types.
- MCP parity
  - Rebuild MCP data after changes; examples/props must match shipping components.

## Cross‑Cutting API Conventions

- Naming & props
  - `intent` and `variant` standardize color semantics; `color` is an explicit override.
  - `size` uses a shared union across all components.
  - `density` uses named tokens; optional `compact` alias maps to `density="compact"`.
  - Every component supports styling escape hatches (`preset`, `sx`) and passes through DOM attributes.
  - No hidden synonyms for tokens or props. Only the documented spellings are accepted.
- DOM passthrough & root identity
  - Forward `aria-*`, `data-*`, `id`, `tabIndex`, `role`, `className`, `style` to the semantic root.
  - Add `data-valet-component="<Name>"` and state flags: `data-disabled`, `data-invalid`, `data-selected`, etc.
  - Standardize `data-state` as the primary state indicator across components (e.g., `open|closed`, `checked|unchecked`, `selected|unselected`, `invalid|valid`). See Styling section for full guidance.
- Refs
  - `forwardRef` to the logical/focusable root. Components that expose focus behavior must provide a consistent ref contract (see Appendix: FocusableRef).
  - Ref typing guarantees that `.focus()` is callable for focusable components: either via the native element ref (e.g., `HTMLButtonElement`) or a `FocusableRef` object with a `focus()` method.
  - Surface invariants: nested `<Surface>` are disallowed. Each Surface sets `--valet-screen-width`/`--valet-screen-height` on the root and owns a child registry for component metrics.
- RTL & logical properties
  - Components respect document or nearest `dir` and prefer logical CSS properties (inline/block start/end). Positioning, chevrons/arrows, and overlays honor RTL.
- Events
  - Implement the trio across fields: `onChange(event)`, `onValueChange(value, info)`, `onValueCommit(value, info)`.
  - Remove bespoke signatures; align all fields to the canonical shapes.
- Accessibility
  - Keyboard, focus management, ARIA roles/names/relationships are required. Never remove focus rings; they are themeable and PRM‑aware.

---

## Events Model (adopted)

Adopt three event hooks everywhere a user can change a value:

- `onChange(event)`
  - Parity with native elements. Always fires with the raw React/SyntheticEvent.
- `onValueChange(value, info)`
  - Fires for every value mutation (typing, drag, increments). Strongly typed by field.
- `onValueCommit(value, info)`
  - Fires when the interaction is “committed” (pointer up, blur, Enter/selection). See matrix in Appendix C.

Canonical `ChangeInfo<T>` shape:

```ts
export type InputPhase = 'input' | 'commit';
export type InputSource = 'keyboard' | 'pointer' | 'programmatic' | 'clipboard' | 'wheel';

export interface ChangeInfo<T> {
  name?: string;
  previousValue?: T;
  phase: InputPhase;          // 'input' or 'commit'
  source: InputSource;         // interaction source
  event?: React.SyntheticEvent; // underlying event when available
  index?: number;               // selection index (menus, sliders with steps)
  id?: string;                  // option id, etc.
}
```

Notes
- Phase invariants: `onValueChange` always provides `info.phase = 'input'`; `onValueCommit` always provides `info.phase = 'commit'`.
- Controlled/uncontrolled components use the same trio; controlled users usually handle `onValueChange`, optionally `onValueCommit` for batched updates.
- For text inputs, “commit” occurs on blur or Enter; for pickers/selectors on selection; for sliders/draggers on pointer up.
- Debouncing: valet does not debounce events; consumers may debounce in handlers as needed.
 - IME composition: during text composition, `onValueChange` fires as usual with `source: 'keyboard'`, but `onValueCommit` does not fire until after `compositionend` (i.e., on blur/Enter post‑composition).
 - Form reset: native form resets emit `onValueChange` with `source: 'programmatic'`; `onValueCommit` does not fire on reset.
 - Wheel input: only affects components that explicitly support it (e.g., focused sliders). Components must not change on passive wheel over unless focused.

---

## Intent, Variant, and Color Override (adopted)

Props
- `intent?: 'default'|'primary'|'secondary'|'success'|'warning'|'error'|'info'|string`
- `variant?: 'filled'|'outlined'|'plain'`
- `color?: string` (explicit override; any CSS color or var, e.g. `#09f`, `color(display-p3 0 0.5 1)`, `var(--brand)`)

Naming rules
- Use `error` (not `danger`). No hidden synonyms or aliases for intents or variants.

Precedence
- `color` (explicit) > `intent` (semantic) > component default.
- Variant dictates which channels are painted by the chosen color:
  - `filled`: background uses color; text/border auto‑contrast.
  - `outlined`: border/text use color; background transparent or faint.
  - `plain`: text uses color; minimal background/underline accents.

Accessibility & theming
- Auto‑contrast foreground computed from the final background color.
- Expose CSS vars so `sx` can adjust: `--valet-intent-bg`, `--valet-intent-fg`, `--valet-intent-border`, `--valet-intent-focus`.
- Hover/active/disabled derive from base color with theme‑controlled ramps.
 - `intent="default"` is a neutral, non‑status appearance that adapts to theme mode (light/dark) and emphasizes readability over chroma.

---

## Size & Density (adopted)

Size
- `size?: 'xs'|'sm'|'md'|'lg'|'xl'` shared across all components.
- Theme controls per‑size dimensions, fonts, and icon scales.

Density
- Public API: `density?: 'compact'|'standard'|'comfortable'`.
- Alias: `compact?: boolean` maps to `density: 'compact'` when `true`, else no override.
- Inheritance: `Surface` provides default density via context; components inherit unless overridden.
- Internal mapping (example; theme‑configurable):
  - compact → 0.9, standard → 1.0, comfortable → 1.15 (multipliers for gaps/padding/radii)
- Guardrails: interactive targets remain ≥ 44px in both dimensions regardless of density; density tightens whitespace, not hit‑areas.

Interplay with size
- `size` defines the component’s visual scale; `density` tunes spacing tightness. They combine but do not compromise accessibility.

CSS variables
- Surface sets `--valet-density` and `--valet-space-unit`; components derive local spacing from these.
 - Visual affordances may be optically smaller if wrapped by a larger interactive region, but the interactive bounding box must still meet the 44px minimum in both dimensions.

---

## Controlled vs Uncontrolled (adopted)

- All fields support `value?`, `defaultValue?`, and the event trio.
- Remove any `initialValue` props (e.g., `Select.initialValue` → eliminated). Use `defaultValue`.
- Detect and error in dev if a component switches between controlled/uncontrolled after mount.
- `FieldBaseProps` standard across inputs: `name`, `label`, `helperText`, `error`, `fullWidth`, `required`, `disabled`, `readOnly`, `size`, `density`, `intent`.
  - DateSelector must require `name` when binding to a single value or range; values flow through the form store created by `createFormStore` via `useOptionalForm` just like TextField and Select.

---

## Accessibility Baselines (adopted)

- Focus
  - Visible keyboard focus rings always on; themeable thickness/offset; respect `prefers-reduced-motion`.
- Labels and descriptions
  - Fields associate labels via `label` + `id` or `aria-labelledby`, and helper/error through `aria-describedby`.
- Roles and semantics
  - Use native elements where possible; supplement with roles only when needed.
- Keyboard support
  - Ensure expected navigation patterns for menus, tabs, sliders, and dialogs.
- Tooltip
  - Treated as descriptions (`aria-describedby`), never essential information. Consistent delay/interaction rules.
 - Icon-only controls
  - `IconButton` requires accessible text via `aria-label` or `aria-labelledby` when no visible label is present; a dev error is thrown otherwise.
 - Disabled and readOnly
  - Apply native `disabled`/`readOnly` attributes where applicable and reflect state via `data-disabled`/`data-readonly`; disabled elements are unfocusable.
 - Focus ring tokens
  - Expose `--valet-focus-ring-color`, `--valet-focus-ring-width`, `--valet-focus-ring-offset` for consistent, themeable focus indicators.
 - Role overrides
  - Emit a dev warning when a provided `role` contradicts native semantics (e.g., `role="button"` on `<a href>`).
 - Button type default
  - Buttons default to `type="button"` to avoid implicit form submission; `type="submit"` is opt‑in.

---

## Overlay System Baseline (adopted)

- Centralized portal root and z‑index scale.
- Focus management: trap, restore on close, inert/aria‑hidden background, scroll locking.
- Background inerting: use `inert` where supported; fallback to `aria-hidden` on non‑overlay siblings for older browsers; ensure only one strategy is applied at a time.
- Positioning: collision avoidance, RTL awareness, arrow placement primitives.
- Escape key
  - Overlays listen for `Escape` and call `onClose` unless `disableEscapeKeyDown` is provided. Expose `disableEscapeKeyDown` consistently across overlay components.
- Outside click
  - Overlays close on outside pointer down by default; expose `disableOutsideClick` consistently. Do not close when the event originates from a nested overlay.
- Roles & labeling
  - Dialogs use `role="dialog"` with `aria-modal="true"`. Menus/popovers use appropriate roles and relationships (e.g., `role="menu"`, `aria-haspopup`, `aria-controls`, `aria-expanded`). Tooltips rely on `aria-describedby` only.
- Tokens/vars
  - `--valet-zindex-modal`, `--valet-zindex-popover`, `--valet-zindex-tooltip`
  - Backdrop colors/opacity as theme tokens (e.g., `--valet-backdrop-bg`, `--valet-backdrop-opacity`).

---

## Styling Escape Hatches & DOM Passthrough (adopted)

- Every component extends `Presettable & { sx?: Sx }` and forwards `className`/`style` to the semantic root.
- Merge order
  - preset < component defaults < prop‑driven styles < variant/intent resolution < `sx` < inline `style`.
- DOM passthrough
  - Forward `aria-*`, `data-*`, `id`, `tabIndex`, `role`. Tag root with `data-valet-component` and relevant state data‑attrs.
  - Semantic root for multi‑element widgets: passthrough applies to the interactive root (e.g., Tooltip’s trigger), not to portal content.
  - Standardize `data-state` with canonical values per component (e.g., `open|closed`, `checked|unchecked`, `selected|unselected`, `invalid|valid`). Keep specific booleans like `data-disabled` for convenience; prefer `data-state` for theming and selectors.

Sx authoring
- `sx` accepts plain style objects and theme functions `(theme) => styles`; supports nested selectors (`&:hover`) and media queries (`@media (prefers-reduced-motion)`), and may reference CSS vars.

---

## Polymorphism (adopted)

Goal
- Enable a safe, type‑sound `as` prop on selected components to swap the rendered element/component without losing accessibility, typing, styling, or ref correctness.

Scope
- Fully polymorphic primitives: `Box`, `Text`.
- Link‑like controls: `Button`, `IconButton` (default to `button`, allow `a` and custom link components).
- Structural containers: `Panel` (header/title slots polymorphic), `Stack`, `Grid` can expose polymorphism only where semantics are neutral (default `div`).
- Not polymorphic: complex widgets that depend on fixed semantics/structure (`Tooltip`, `Drawer`, `Tabs`, `Accordion`, `SpeedDial`, `Select`, `Slider`, `DateSelector`, `Iterator`, tables).

Design Rules
- Semantics first
  - Prefer native elements that match behavior (e.g., navigation → `<a>`, action → `<button>`).
  - If a non‑interactive element is used for an interactive role (e.g., `as="div"` on `Button`), automatically apply `role="button"`, `tabIndex=0`, keyboard activation (Space/Enter), and aria‑pressed when applicable.
  - Dev‑only warning when an obviously semantically wrong combination is detected (can be disabled in production builds). Examples: `Button as="div"` with navigation intent; `a` without `href` when used as a link.
- Typing and refs
  - `as?: React.ElementType` with generic inference. Props narrow to the selected element’s props, intersected with the component’s own props.
  - `ref` type derives from `as` (e.g., `HTMLAnchorElement` for `as="a"`).
  - Forward `className`, `style`, `aria-*`, `data-*`, and relevant DOM props of the chosen element.
- Styling
  - Component styles and variants apply regardless of element. ClassName and CSS vars are preserved; the root keeps `data-valet-component`.
- Routing integration
  - When `as` is a router link component, pass through props untouched (e.g., `to` for React Router). The caller supplies correct prop names; valet does not auto‑rename `href`↔`to`.
- Constraints
  - No `as` on widgets with internal portals, focus traps, or multi‑element markup where the root is not a simple semantic element.

Developer Experience
- Strong TS generics ensure only valid props for the chosen `as` are accepted.
- `Box`/`Text` act as escape hatches for edge semantics while preserving theme and `sx`.
- `Button`/`IconButton` recommend `as="a"` for navigation and apply anchor semantics; allow custom link components with the same contract.
  - Rendering `Button` as a non‑interactive tag is supported for special cases; valet adds `role="button"`, `tabIndex=0`, and Space/Enter activation automatically, but this is discouraged for navigation—prefer `as="a"`.

Type Shapes (informative; see Appendix G)
- `PolymorphicProps<E, OwnProps>` merges intrinsic props for `E` with valet’s `OwnProps`, omitting conflicts.
- `PolymorphicComponent<DefaultE, OwnProps>` exposes a callable component with an `as` generic that updates props/ref.

Examples
```tsx
// Button rendered as an anchor
<Button as="a" href="/pricing" intent="primary" variant="filled">Pricing</Button>

// IconButton rendered as React Router Link
<IconButton as={RouterLink} to="/settings" aria-label="Settings" intent="secondary" />

// Text rendered as h2 while keeping typography scale
<Text as="h2" size="lg">Section Title</Text>

// Box as nav element with role and data attributes
<Box as="nav" data-section="main" sx={{ borderBlockEnd: '1px solid var(--border)' }} />
```

Adoption Matrix (initial)
- `Box`: default `div`; accepts any block/inline element or custom component.
- `Text`: default `p`; supports `span|p|strong|em|code|pre|h1..h6|label` and custom.
- `Button`: default `button`; supports `a` and custom link components. For non‑interactive elements, valet adds button semantics.
- `IconButton`: same as `Button`.
- `Panel`: root remains non‑polymorphic; header/title slots are polymorphic `Text` under the hood.

Testing
- Type tests to assert prop narrowing and ref types per `as`.
- Interactive tests for button semantics when rendered as non‑interactive elements (Space/Enter activation, focus ring, ARIA).

Custom link components
- Recommended contracts: either anchor‑like props (`href`, `target`, `rel`) or router‑like props (e.g., `to`). Components must forward refs and `aria-*`/`data-*` to the underlying anchor/node. Valet does not adapt prop names.

Ref type guarantees
- When `as` resolves to an intrinsic element, refs are DOM element refs of that element (e.g., `HTMLAnchorElement` for `as="a"`). When `as` is a custom component, the ref type is whatever that component forwards (caller responsibility).

Future‑proofing
- If needed later, an `asChild` pattern can be introduced to adopt a child element directly. For now, `as` covers the majority of use cases with clearer typing.

---

## Packaging & Distribution (adopted)

- ESM‑only distribution; subpath exports via `exports` map; no deep imports. CJS is not shipped.
- `sideEffects: false` in `package.json`; whitelist files that must always execute if any (e.g., style sidecars).
- Bundler interop: Vite/Webpack/TS path resolution covered by exports map; types fully emitted and referenced per subpath.
- Node target consistent with CI; no reliance on CJS.
 - Types publishing: `.d.ts` files are emitted per subpath; optional `.d.ts.map` may be included to improve editor navigation.

Exports map example (indicative)
```json
{
  "name": "@archway/valet",
  "type": "module",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./css": {
      "types": "./dist/css/index.d.ts",
      "import": "./dist/css/index.js"
    }
  },
  "sideEffects": false
}
```
Import guidance
- `import { Button } from '@archway/valet'` (preferred). No deep subpath imports.
 - Deep imports like `@archway/valet/dist/...` are unsupported and may break; tooling/docs should enforce top‑level imports only.

SSR note
- SSR/FOUC are intentionally out of scope in this release; builds are client‑only.

Simplified benefits (ELI5)
- Tree‑shaking drops unused code → smaller bundles.
- Editors get types immediately via the exports map.
- Fewer “module not found” and path hacks.

---

## MCP Parity & Docs (adopted)

- Regenerate MCP data after changes: `npm run mcp:build`; validate: `npm run mcp:server:selfcheck`.
- Ensure component props/examples reflect: `intent`, `variant`, `color`, `size`, `density`, `preset`, `sx`, polymorphism where applicable (`as`), and the event trio including `onValueCommit`.
- MCP event metadata should include `ChangeInfo<T>` examples and phase/source semantics.
- Docs prop tables must include the event trio signatures and a `ChangeInfo` example (value, previousValue, phase, source).
- Examples coverage checklist: Button, IconButton, Panel, Box, Text each demonstrate intent/variant/color override, size+density interaction, `sx` usage, and polymorphism where applicable.

---

## Component Inventory & Required Changes

Notes
- Line numbers are indicative and may drift; the component and file names define the authoritative scope.

Styling escape hatches (add `preset`, `sx`, DOM passthrough; forward `className`/`style` to root)
- src/components/layout/Accordion.tsx:214‑225
- src/components/layout/Drawer.tsx:27‑51
- src/components/widgets/SpeedDial.tsx:18‑25
- src/components/widgets/Tooltip.tsx:139‑153
- src/components/widgets/CodeBlock.tsx:11‑22
- src/components/widgets/LoadingBackdrop.tsx:9‑48
- src/components/widgets/Markdown.tsx:21‑28

Controlled/uncontrolled naming normalization
- src/components/fields/Select.tsx:30‑45 → remove `initialValue`; add `defaultValue`; support event trio.
  - Select is generic: `Select<T>` with options `{ value: T; label: React.ReactNode; id?: string; disabled?: boolean }`. Equality uses strict `===` unless a `getKey` prop is provided for custom comparison.

Standardize event signatures (field set)
- src/components/fields/Checkbox.tsx:27‑46 → implement trio; primary value boolean.
- src/components/fields/Switch.tsx:90‑100 → implement trio; primary value boolean.
- src/components/fields/Iterator.tsx:20‑29 → implement trio; primary value item/index.
- src/components/fields/Slider.tsx:156‑193 → implement trio; commit on pointer up/blur.
- src/components/fields/Select.tsx:36‑44 → implement trio; commit on selection/blur.
- src/components/fields/MetroSelect.tsx:47‑64 → implement trio; commit on selection.
- src/components/layout/Tabs.tsx:… → expose `onValueChange`/`onValueCommit` for active tab changes.

DateSelector conformance
- src/components/fields/DateSelector.tsx:16‑52 → wrap with `FieldBaseProps`; add label/helper/error/fullWidth; integrate form store via `useOptionalForm`; implement event trio; expose locale/TZ hooks.
  - Value shape: single date as ISO string `YYYY-MM-DD`; range as tuple `[string, string]`. Avoid `Date` objects to prevent timezone ambiguity.

Size tokens unification
- src/components/fields/Button.tsx:14‑29 → `size?: 'xs'|'sm'|'md'|'lg'|'xl'`.
- src/components/fields/IconButton.tsx:14‑38 → same.
- src/components/fields/Switch.tsx:13‑28 → expand to shared union.
- src/components/widgets/Chip.tsx:14‑41 → expand to shared union.
- src/components/primitives/Avatar.tsx:12‑36 → expand to shared union.

Color/intent normalization
- src/components/fields/Button.tsx:21‑25 → replace color/textColor with `intent`, `variant`, `color` override.
- src/components/fields/IconButton.tsx:20‑36 → replace background/iconColor with `intent`, `variant`, `color` override.
- src/components/layout/Panel.tsx:19‑35 → `intent`, `variant`, `color` override; maintain auto‑contrast.
- src/components/widgets/Chip.tsx:33‑40 → align to `intent`, `variant`, `color`.

Density/compact normalization
- src/components/layout/Stack.tsx:16‑25 → adopt `density`; keep `compact` alias mapping; default from nearest `Surface`.
- src/components/layout/Grid.tsx:15‑33 → same.
- src/components/layout/Panel.tsx:19‑35 → same.
- src/components/layout/Tabs.tsx:270‑289 → same.
- src/components/fields/DateSelector.tsx:41‑50 → replace custom compact mode with `density`.
- src/components/layout/Surface.tsx:39‑66 → owns density context (`compact` alias → maps to `density='compact'`).

Overlay unification
- Drawer, Tooltip, SpeedDial → migrate to shared overlay primitives (portal, focus trap, aria‑hiding, z‑index tokens, motion).
Tabs behavior
- Tabs expose `value`/`defaultValue` for the active tab id and emit `onValueChange`/`onValueCommit` on tab selection changes. Default selection: first tab when uncontrolled.
  - `value`/`defaultValue` are stable string (or number) identifiers for tabs; selection by index is not supported.
Tables and height behavior
- Tables respect available height by default; content scrolls inside the component. `constrainHeight={false}` opts out.

---

## Breaking Change Index

- Remove all bespoke event signatures; adopt trio on all fields.
- Remove `initialValue` (Select) and any nonstandard controlled/uncontrolled props.
- Normalize `size` unions and remove any alternative size sets.
- Replace all component‑specific color props with `intent`, `variant`, and `color` override.
- Replace `compact` booleans with `density` tokens; retain `compact` as an alias only (no separate behavior). Any unique `auto` modes are removed.
- Add `preset`, `sx`, DOM passthrough everywhere; root may change where a semantic element was incorrect.
- Tabs emit standardized `onValueChange`/`onValueCommit` for tab changes.

---

## Open Questions

None at this time. Polymorphism is adopted per section above. Additional nuances (e.g., `asChild`) may be reconsidered post‑adoption if concrete needs arise.

---

## Implementation Progress

Current progress is tracked to facilitate handoff and ensure a clean continuation.

Spec alignment
- Hard pivot confirmed (no deprecations or shims).
- Event model adopted: `onChange(event)`, `onValueChange(value, info)`, `onValueCommit(value, info)` with phase invariants (input vs commit).
- Density (public): `'compact'|'standard'|'comfortable'` with a `compact` alias. Tap targets are ≥ 44px.
- Color semantics: `intent` + `variant` with explicit `color` override; precedence: `color > intent > default`.
- Polymorphism: adopted for `Box`, `Text`, `Button`, `IconButton`; complex widgets remain non‑polymorphic; dev warnings on misuse.
- Overlay baseline: portal + inert/aria-hidden, focus trap + restore, Escape/outside click props, z-index tokens.
- SSR/FOUC: explicitly out of scope (client only).

Implemented (library)
- Shared: `src/system/events.ts` (ChangeInfo, OnValueChange/OnValueCommit).
- Escape hatches/DOM passthrough added: Accordion, Drawer, SpeedDial, Tooltip, CodeBlock, LoadingBackdrop, Markdown (preset/sx, className/style forwarded; `data-valet-component` added).
- Fields (trio standardized): Checkbox, Switch, Iterator, Slider, Select (`initialValue`→`defaultValue`), MetroSelect.
- Tabs: `active/defaultActive`→`value/defaultValue`; `onTabChange`→`onValueChange/onValueCommit`.
- DateSelector pivoted to unified `value?: string | [string,string]`; `defaultValue?` same; `onValueChange/onValueCommit`; `name` binding only in single-date mode.
- Table row selection updated for Checkbox `onValueChange`.

Implemented (docs)
- All updated to event trio + `defaultValue` where applicable; builds pass.
- Updated core demos: Accordion, AppBar, Box, Grid, Tabs (value/onValueCommit), Iterator, Slider, Select, DateSelector (single+range), Switch, Chip, Snackbar, Tooltip, Dropzone, SpeedDial, Tree, CodeBlock, Pagination, Table, Markdown, RichChat; Avatar, Icon, Image, Divider, WebGLCanvas; Glossary; Main page.

Notes
- Accessibility guarantees are in place: focus rings, roles/ARIA, keyboard patterns.
- DOM passthrough standardized; roots tagged with `data-valet-component` and `data-state` where relevant.

---

## What Remains (Next Steps)

1) Size & Density Unification
- Unify size unions: Switch, Chip, Avatar → `'xs'|'sm'|'md'|'lg'|'xl'` (adjust geometry as needed).
- Adopt `density?: 'compact'|'standard'|'comfortable'` for Stack, Grid, Panel, Tabs, DateSelector; default from Surface; add docs density demo.

2) Intent/Variant/Color Normalization
- Button, IconButton, Panel, Chip: replace bespoke color props with `intent`, `variant`, `color?` override.
- Implement contrast-aware CSS vars per Appendix B; update docs examples.

3) Overlay System Baseline
- Introduce shared overlay primitives (portal root, inert/aria-hidden fallback, focus trap/restore, Escape & outside click with disable* props, z-index tokens).
- Migrate Drawer/Tooltip/SpeedDial to the shared primitives.

4) Polymorphism Wiring
- Implement as on Box/Text/Button/IconButton (typing via `src/system/polymorphic.ts`).
- Add dev warnings for semantics misuse; add docs examples; simple type tests for ref inference.

5) Packaging & Exports
- Finalize ESM-only exports map with per-subpath types; ensure `sideEffects: false`.
- Validate top-level imports only in docs.

6) MCP & Docs Parity
- Run `npm run mcp:build`; ensure trio/intent/density/types in MCP metadata.
- Update docs reference pages with event trio signatures and `ChangeInfo` example; ensure examples show `sx`, density inheritance, polymorphism.

7) App Integration & QA
- Link local valet into both apps; migrate handlers to `onValueChange/onValueCommit`; update DateSelector to union value shape.
- A11y smoke: focus rings, keyboard navigation, overlay semantics.
- Record docs home bundle size delta; verify density demo.

---

## Critical References & Commands

Spec files
- This document: `VALIGNMENT.md` (root) — canonical decisions, event matrix, intent CSS vars, density, overlay, and risks.

Types/utilities
- `src/system/events.ts`: `InputPhase`, `InputSource`, `ChangeInfo<T>`, `OnValueChange`, `OnValueCommit`.
- `src/system/polymorphic.ts`: `createPolymorphicComponent`, `PolymorphicProps` helpers.

Build/lint
- Library: `npm run lint:fix`, `npm run build`
- Docs: `npm --prefix docs run build`
- MCP: `npm run mcp:build`, `npm run mcp:server:selfcheck`

---

## Key Decisions Recap

- Hard pivot: remove legacy props/events immediately (no deprecations).
- Event model: trio with invariant phases; `onChange` for raw event parity.
- Density: public tokens + `compact` alias; ≥44px tap targets preserved.
- Color: `intent` + `variant` with explicit `color` override; precedence `color > intent > default`.
- Polymorphism: adopted (scoped) with dev misuse warnings.
- Overlay: unified baseline primitives and tokens.
- Packaging: ESM‑only exports map; no deep imports.
- SSR/FOUC: out of scope.

---

## Pitfalls to Avoid

- Do not reintroduce legacy props (e.g., `initialValue`, `onChange(value)`).
- Preserve form store binding semantics where applicable (single‑date `DateSelector`).
- Keep DOM passthrough consistent; tag roots with `data-valet-component` and `data-state`.
- Avoid token aliases; use exact strings (`error`, not `danger`).
- Ensure focusable components always satisfy the FocusableRef contract (`ref.current.focus()`).

## Validation & Release Gates

- Repo gates (must pass locally before publishing)
  - `npm run lint:fix` (no lint errors)
  - `npm run build` (library)
  - `npm run build` in `docs` (docs site)
  - `npm run mcp:build` and `npm run mcp:server:selfcheck` (components > 0, Box present)
- App adoption gates (both apps)
  - Link local valet into both apps; run type‑checks and builds error‑free.
  - Exercise critical user flows; verify a11y on interactive components (quick axe smoke). 
- Bundle check
  - Record bundle size delta for the docs home route (`/`); ensure tree‑shaking remains effective.
  - Visual density inheritance smoke on a dedicated docs section: show Surface (standard) with nested containers overriding to compact/comfortable.

---

## Appendix G: Polymorphic Typing Helpers (informative)

```ts
// ─────────────────────────────────────────────────────────────
// src/system/polymorphic.ts  | valet
// typing helpers for polymorphic components (`as` prop)
// ─────────────────────────────────────────────────────────────
import * as React from 'react';

export type PropsOf<E extends React.ElementType> = React.ComponentPropsWithRef<E>;

export type PolymorphicRef<E extends React.ElementType> = React.ComponentPropsWithRef<E>['ref'];

export type MergeProps<A, B> = Omit<A, keyof B> & B;

export type PolymorphicProps<E extends React.ElementType, OwnProps> = MergeProps<
  PropsOf<E>,
  OwnProps & { as?: E }
> & { ref?: PolymorphicRef<E> };

export interface PolymorphicComponent<DefaultE extends React.ElementType, OwnProps> {
  <E extends React.ElementType = DefaultE>(
    props: PolymorphicProps<E, OwnProps>
  ): React.ReactElement | null;
  displayName?: string;
}

export function createPolymorphicComponent<DefaultE extends React.ElementType, OwnProps>(
  render: <E extends React.ElementType = DefaultE>(
    props: PolymorphicProps<E, OwnProps>,
    ref: PolymorphicRef<E>
  ) => React.ReactElement | null
): PolymorphicComponent<DefaultE, OwnProps> {
  return React.forwardRef(render) as unknown as PolymorphicComponent<DefaultE, OwnProps>;
}
```

---

## Appendix A: Canonical Types (informative)

```ts
// Shared size
export type ComponentSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

// Density (public tokens)
export type Density = 'compact' | 'standard' | 'comfortable';

// Intent & variant
export type Intent = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | (string & {});
export type Variant = 'filled' | 'outlined' | 'plain';

// Event info
export type InputPhase = 'input' | 'commit';
export type InputSource = 'keyboard' | 'pointer' | 'programmatic' | 'clipboard' | 'wheel';
export interface ChangeInfo<T> {
  name?: string;
  previousValue?: T;
  phase: InputPhase;
  source: InputSource;
  event?: React.SyntheticEvent;
  index?: number;
  id?: string;
}

// Styling
export interface Sx {
  // keyed style object and/or function of theme; supports CSS vars
  [cssProp: string]: any;
}
export interface Presettable {
  preset?: string | string[]; // name(s) registered via definePreset
}

// DOM passthrough to root
export interface DomPassthrough {
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  role?: string;
  tabIndex?: number;
  [dataOrAria: `data-${string}` | `aria-${string}`]: any;
}

// Field base props
export interface FieldBaseProps<Value> {
  name?: string;
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: React.ReactNode | boolean;
  required?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  size?: ComponentSize;
  density?: Density;
  intent?: Intent;
  variant?: Variant;
  color?: string; // explicit override
  value?: Value;
  defaultValue?: Value;
  onChange?: (event: React.SyntheticEvent) => void;
  onValueChange?: (value: Value, info: ChangeInfo<Value>) => void;
  onValueCommit?: (value: Value, info: ChangeInfo<Value>) => void;
}

// FocusableRef contract (for focusable components)
export interface FocusableRef {
  focus: (opts?: FocusOptions) => void;
}

// Select options and generics (informative)
export interface Option<T> {
  value: T;
  label: React.ReactNode;
  id?: string;
  disabled?: boolean;
}

// Date values
export type DateString = string; // ISO YYYY-MM-DD
export type DateRange = [DateString, DateString];
```

---

## Appendix B: Intent CSS Variable Contract (informative)

Components that support intent/variant must compute and expose:

- Core
  - `--valet-intent-bg`
  - `--valet-intent-fg`
  - `--valet-intent-border`
  - `--valet-intent-focus`
- States (derived)
  - `--valet-intent-bg-hover`
  - `--valet-intent-bg-active`
  - `--valet-intent-fg-disabled`

Variant mapping guidelines
- filled: bg ← color/intent; fg ← contrast(bg); border ← mix(bg, fg, theme);
- outlined: border/fg ← color/intent; bg ← transparent/faint;
- plain: fg ← color/intent; bg ← transparent; underline/hover accents from color.

---

## Appendix C: Event Commit Matrix (informative)

- TextField/Input
  - onValueChange: on input; phase: input.
  - onValueCommit: on blur or Enter; phase: commit.
- Checkbox/Switch
  - onValueChange: on toggle; phase: input.
  - onValueCommit: same moment (toggle); phase: commit.
- Select/MetroSelect
  - onValueChange: highlight/type‑ahead changes (optional); phase: input.
  - onValueCommit: on selection/confirm; phase: commit.
- Slider/RangeSlider
  - onValueChange: during drag; phase: input.
  - onValueCommit: on pointer up/blur; phase: commit.
- Iterator (stepper)
  - onValueChange: on increment/decrement; phase: input.
  - onValueCommit: on release/blur or after final step action.
- DateSelector
  - onValueChange: on day selection changes, typing.
  - onValueCommit: on date confirm, blur, or Enter depending on mode.

---

## Appendix D: Overlay Tokens & Z‑Index (informative)

- Z‑index scale (example; theme‑configurable)
  - `--valet-zindex-base`: 0
  - `--valet-zindex-dropdown`: 1000
  - `--valet-zindex-sticky`: 1100
  - `--valet-zindex-tooltip`: 1200
  - `--valet-zindex-popover`: 1300
  - `--valet-zindex-modal`: 1400
  - `--valet-zindex-toast`: 1500
- Backdrops
  - `--valet-backdrop-bg`: e.g., `rgba(0,0,0,0.5)`
  - `--valet-backdrop-opacity`: numeric 0–1
- Motion
  - Respect `prefers-reduced-motion`; expose motion scale tokens for entry/exit durations.

---

## Appendix E: Risks & Mitigations

- Risk: Polymorphism misuse (semantic regressions)
  - Mitigation: Dev warnings for incorrect combinations, enforced a11y guardrails (roles, keyboard activation), and clear docs/examples for link/navigation patterns.
- Risk: Immediate hard removals produce larger one‑time refactor cost.
  - Mitigation: Centralized breaking change list and codemod scripts (optional) to speed local refactors.
- Risk: Intent/color mapping regressions across components.
  - Mitigation: Shared resolver and visual snapshots in docs; MCP examples tested against live components.
- Risk: Density/size interplay surprises.
  - Mitigation: Document inheritance and min hit‑areas; verify via a11y smoke.

---

## Appendix F: Migrations for the Two Apps (actionable checklist)

- Replace any `initialValue` with `defaultValue` across fields.
- Update all event handlers to the trio; prefer `onValueChange` and add `onValueCommit` where batching helps.
- Normalize `size` props to the shared union; remove any `s/m/l` or restricted size sets.
- Replace color‑specific props with `intent`/`variant`/`color`.
- Adopt `density` from `Surface`; remove bespoke `compact` toggles; use `compact` alias only as a boolean for convenience.
- Begin using `sx` and `preset` where override is needed; stop ad‑hoc className hacks.
- Verify overlay components behave consistently (focus, scroll lock, stacking).

---

End of spec.
