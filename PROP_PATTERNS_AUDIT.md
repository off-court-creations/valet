# valet prop patterns audit (v0.34.1 snapshot)

This doc captures observed prop-pattern inconsistencies and adoption “footguns” across valet
components, with enough context for another agent to continue the work without prior discussion.

The goal is: **make component props logical, intuitive, and repetitive when appropriate**, so
developers can transfer knowledge between components without re-learning patterns.

---

## Snapshot + data sources

This audit is based on:

- The repository’s generated metadata in `mcp-data/` (built from TS source + docs).
- Spot-checking source for the main outliers (see file references throughout).

At the time of analysis:

- Components indexed: **56**
- Unique prop names across components: **232**
- Top shared props:
  - `preset` appears on **54** components
  - `sx` appears on **52** components

Reproduce counts quickly (requires `python`):

```bash
python - <<'PY'
import json, glob
from collections import Counter
files = glob.glob('mcp-data/components/*.json')
components = [json.load(open(p)) for p in files]
prop_counts = Counter(p['name'] for c in components for p in c.get('props', []))
print('components', len(components))
print('unique props', len(prop_counts))
print('top 10', prop_counts.most_common(10))
PY
```

If `mcp-data/` is stale after code changes, rebuild it first:

```bash
npm run mcp:build
```

---

## What’s already working (baseline consistency)

These are good foundations worth keeping and spreading:

- **Styling**: `sx` + `preset` are near-universal.
- **Controlled/uncontrolled pairs**: `value/defaultValue`, `open/defaultOpen`, `checked/defaultChecked`
  are established patterns.
- **Boolean naming**: no widespread drift into `isX` (good).
- **Canonical value events exist**: many “field-like” components expose `onValueChange` and
  `onValueCommit`, and there’s a core definition in `src/system/events.ts`.
- **Shared field base props exist**: `FieldBaseProps` in `src/types.ts` is already a clear target.

However, some components “almost” follow these patterns but miss just enough to be confusing.

---

## Problems / needs improvement

### 1) Same prop name, different meaning (name collisions)

These are the biggest “transfer learning” failures: you bring expectations from one component and
get a different behavior in another.

#### `open` / `defaultOpen`

- Overlay components use `open: boolean`:
  - `src/components/layout/Modal.tsx`
  - `src/components/layout/Drawer.tsx`
  - `src/components/widgets/Tooltip.tsx`
  - `src/components/widgets/Snackbar.tsx` (controlled `open` only; no `defaultOpen`)
- `Accordion` uses `open: number | number[]` (indices of open items):
  - `src/components/layout/Accordion.tsx:215`

This creates a strong API surprise: “open” sometimes means **visibility**, sometimes **open item
indices**.

#### `onChange`

`onChange` is not semantically stable across the library:

- DOM-parity input events:
  - `Checkbox`: `(event: ChangeEvent<HTMLInputElement>) => void` (`src/components/fields/Checkbox.tsx`)
  - `RadioGroup`: `(event: React.ChangeEvent<HTMLInputElement>) => void` (`src/components/fields/RadioGroup.tsx`)
  - `TextField`: `ChangeEventHandler<HTMLInputElement|HTMLTextAreaElement>` (`src/components/fields/TextField.tsx`)
- A click event:
  - `Switch`: `(event: React.MouseEvent<HTMLButtonElement>) => void` (`src/components/fields/Switch.tsx:93`)
- A value callback:
  - `Pagination`: `(page: number) => void` (`src/components/widgets/Pagination.tsx:15`)

This defeats the “DOM-parity” expectation implied by the existing events concept docs page:
`docs/src/pages/concepts/Events.tsx`.

#### `selectable`, `selected`, `defaultSelected`, `onSelectionChange`

Selection is modeled differently across list-like components:

- `List` (single selection, boolean `selectable`):
  - `selectable?: boolean`
  - `selected?: T | null`
  - `defaultSelected?: T | null`
  - `onSelectionChange?: (item: T, index: number) => void`
  - `src/components/layout/List.tsx:15`
- `Table` (mode-based selection, callback returns selected array):
  - `selectable?: 'single' | 'multi'`
  - `onSelectionChange?: (selected: T[]) => void`
  - `src/components/widgets/Table.tsx:40`
- `Tree` (selection by id string, plus expanded state):
  - `selected?: string`, `defaultSelected?: string`
  - `src/components/widgets/Tree.tsx:26`

Same prop names (`selected`, `defaultSelected`, `onSelectionChange`) do not consistently represent:

- identity (`string` id) vs object reference (`T`)
- single selection vs multi selection
- callback payload (`(item, index)` vs `(selected[])`)

#### `data`

`data` flips meaning depending on component:

- `Markdown.data` is **markdown text** (`string`) (`src/components/widgets/Markdown.tsx:17`)
- `List.data` / `Table.data` are **datasets** (`T[]`) (`src/components/layout/List.tsx:15`, `src/components/widgets/Table.tsx:40`)

#### `direction` / `columns` / `actions`

These are contextually reasonable, but still collide:

- `direction`:
  - `Stack.direction`: layout axis (`'row'|'column'`) (`src/components/layout/Stack.tsx:16`)
  - `SpeedDial.direction`: expansion direction (`'up'|'down'|'left'|'right'`) (`src/components/widgets/SpeedDial.tsx:18`)
- `columns`:
  - `Grid.columns`: number of columns (`src/components/layout/Grid.tsx:15`)
  - `Table.columns`: column definitions array (`src/components/widgets/Table.tsx:40`)
- `actions`:
  - `Modal.actions`: a render slot (`ReactNode`) (`src/components/layout/Modal.tsx:115`)
  - `SpeedDial.actions`: data model (`SpeedDialAction[]`) (`src/components/widgets/SpeedDial.tsx:18`)

#### `variant`

“Variant” is used for unrelated concepts:

- Visual skin variants: `Button`, `IconButton`, `Chip`, `Panel`, `Typography`, etc.
- `Modal.variant` is **ARIA semantics** (`'dialog'|'alert'`) not an appearance variant:
  - `src/components/layout/Modal.tsx:115`
- `Tree.variant` is **rendering style** (`'chevron'|'list'|'files'`):
  - `src/components/widgets/Tree.tsx:26`

This is likely fine long-term, but it’s a naming smell: `variant` does not reliably mean “visual style”.

#### `title`

`title` is overloaded:

- `Tooltip.title`: tooltip content (`src/components/widgets/Tooltip.tsx:140`)
- `Modal.title`: dialog title (`src/components/layout/Modal.tsx:115`)
- `AppBar.title`: app header title (`src/components/layout/AppBar.tsx:29`)
- `CodeBlock.title`: the **copy button** `title` attribute (`src/components/widgets/CodeBlock.tsx:13`)

Again: same prop name, different target element, different semantics.

#### `icon`

`icon` varies between:

- Iconify name (`string`): `Icon`, `IconButton`, `Chip` (`src/components/primitives/Icon.tsx:13`, `src/components/fields/IconButton.tsx:19`, `src/components/widgets/Chip.tsx:27`)
- `ReactNode`: `SpeedDial.icon` (`src/components/widgets/SpeedDial.tsx:18`)
- `string | ReactElement`: `MetroSelect.Option.icon` (`src/components/fields/MetroSelect.tsx:69`)

“Icon” as `string` vs `ReactNode` is a common, repeated adoption paper-cut across UI libs; valet should
pick a primary convention and use explicit names for alternates (`icon`, `iconName`, `iconNode`, etc).

#### `onClose`

`onClose` is used with different timing/intent across overlays:

- Request-close semantics (caller should set `open={false}` when controlled):
  - `Modal` (`src/components/layout/Modal.tsx:115`)
  - `Drawer` (`src/components/layout/Drawer.tsx:28`)
  - `Tooltip` (`src/components/widgets/Tooltip.tsx:140`)
- Snackbar mixes semantics:
  - Docs + uncontrolled behavior imply “after fully hidden” (`src/components/widgets/Snackbar.tsx:31`)
  - Controlled mode calls `onClose` as a close request (`src/components/widgets/Snackbar.tsx`)

This makes it hard to know whether `onClose` should be treated as “request close” vs “did close”
and whether it fires before/after exit animation.

#### `label`

`label` is commonly a “field label”, but it also means different things in some components:

- Field-like label (expected by `FieldBaseProps` in `src/types.ts:37`): `Checkbox`, `Select`, etc.
- “Inline label content” (fine, but not a field label):
  - `Chip.label` is the chip’s visible text (`src/components/widgets/Chip.tsx:27`)
  - `RadioProps.label` is a `string` label despite also allowing `children` (`src/components/fields/RadioGroup.tsx:129`)
- `ProgressRing.label` toggles/format-displays a percent label (not a field label):
  - `src/components/primitives/Progress.tsx:117`

The same prop name signals different “kinds” of labels (field label vs content label vs percent label).

#### `size`

`size` is widespread but often means different “dimensions”:

- Tokenized control sizing (e.g. `Button`, `IconButton`, `Checkbox`, etc.)
- Explicit geometry for non-controls:
  - `Drawer.size` is width/height depending on anchor (`src/components/layout/Drawer.tsx:28`)
  - `ProgressRing.size` is diameter (`src/components/primitives/Progress.tsx:117`)

This isn’t inherently wrong, but it’s a repeat source of “same prop name, different mental model”.

---

### 2) Same concept, different prop names (semantic drift)

These aren’t always “bugs”, but they reduce learnability.

#### Expanded state naming (`Accordion` vs `Tree`)

- `Accordion`: `open/defaultOpen/onOpenChange` but it really models “expanded items”
  (`src/components/layout/Accordion.tsx:215`)
- `Tree`: `expanded/defaultExpanded/onExpandedChange` (`src/components/widgets/Tree.tsx:26`)

The Tree naming is closer to “what it is”. Accordion’s API collides with overlay “open”.

#### Pagination naming (`Pagination` vs `Table`)

The same concept is named differently:

- `Pagination.onChange(page)` (`src/components/widgets/Pagination.tsx:15`)
- `Table.onPageChange(page)` (`src/components/widgets/Table.tsx:40`)

And the “window size” prop differs:

- `Pagination.visibleWindow`
- `Table.paginationWindow`

#### Spacing naming (`gap` vs `spacing`)

Most layout and many field-like components use `gap` (and have `Space` in `src/types.ts`), but:

- `RadioGroup` uses `spacing?: number | string` for option gap:
  - `src/components/fields/RadioGroup.tsx:111`

#### Normalization naming (`Grid` vs `Panel`)

These appear to be the same cross-component feature but don’t share naming:

- `Grid.normalizeRowHeights` (`src/components/layout/Grid.tsx:15`)
- `Panel.normalizeRowHeight` (`src/components/layout/Panel.tsx:29`)

#### “Disable input” naming

Chat widgets use:

- `disableInput?: boolean` (`src/components/widgets/LLMChat.tsx:40`, `src/components/widgets/RichChat.tsx:32`)

Most other interactive components use `disabled`.

---

### 3) Value event API drift (`onValueChange` / `onValueCommit`)

There’s a canonical event payload type:

- `src/system/events.ts` defines `ChangeInfo<T>` and `OnValueChange<T>` / `OnValueCommit<T>`.
- Docs reinforce this in `docs/src/pages/concepts/Events.tsx`.

But `Tabs` uses the same prop names with a different payload shape:

- `TabsProps.onValueChange` / `onValueCommit` in `src/components/layout/Tabs.tsx:271` do **not**
  use `ChangeInfo<T>` and omit `source`, `event`, `name`, etc.

This is subtle because it “looks consistent” at the call site, but isn’t.

---

### 4) Field-base prop adoption is incomplete / inconsistent

`FieldBaseProps` in `src/types.ts:37` defines the “field base cluster”:

- `name`, `label`, `helperText`, `error`, `fullWidth`, `sx`, `preset`

Observed issues:

- `DateSelector` is field-like but does not use `FieldBaseProps`:
  - `src/components/fields/DateSelector.tsx:17`
  - It currently exposes `name`, `sx`, `preset`, but not the standard `label/helperText/error/fullWidth` set.
- `TextField` requires `name` at the type level, but the metadata currently reports it as optional:
  - Types: `src/components/fields/TextField.tsx:24` (both union branches require `name: string`)
  - Metadata: `mcp-data/components/components_fields_textfield.json` lists `name` as optional.
  - This mismatch will confuse both humans and agents relying on MCP data.
- `Select` uses `name` for FormControl binding (it reads `name` and calls `form.setField(...)`),
  but the metadata does not surface `name` as a prop:
  - Code: `src/components/fields/Select.tsx:184` destructures `name` and uses it for form binding.
  - Metadata: `mcp-data/components/components_fields_select.json` lacks `name`.
  - Likely cause: `SelectProps` extends `React.ButtonHTMLAttributes` without omitting `name`, so
    extraction treats it as intrinsic passthrough rather than a “documented field prop”.

Also: only `Checkbox` has `bindForm` to explicitly disable form binding (`src/components/fields/Checkbox.tsx`).
Other field-like components don’t have a parallel escape hatch, so the “visual-only” pattern differs
(e.g. `Select` passes `bindForm={false}` to a Checkbox inside the menu).

---

### 5) Styling API inconsistencies (`sx`, `preset`, and `style`)

#### Missing `sx` / `preset` on some exported subcomponents (metadata)

From `mcp-data/`:

- Missing `sx`: `Option`, `Select.Option`, `Tabs.Tab`, `Tabs.Panel`
- Missing `preset`: `Option`, `Select.Option`

Some of these are true API gaps (`Tabs.Tab` / `Tabs.Panel`), while others are likely
metadata/implementation mismatches (`Select.Option`).

#### `style` passthrough is inconsistent and sometimes broken

Across components, `style` is usually omitted to force `sx`, but a subset allow `style`.
This would be fine if it were consistent and intentional; currently, it’s mixed.

More importantly: at least two polymorphic primitives allow `style` via the type system but
**effectively clobber it** by always setting `style={sx}`:

- `Typography`: `src/components/primitives/Typography.tsx:309` spreads props then sets `style={sx}`,
  so any user-provided `style` is lost (even when `sx` is `undefined`).
- `Box`: `src/components/layout/Box.tsx:130` spreads `rest` then sets `style={inlineStyle}` where
  `inlineStyle` is built from `sx`, so user `style` is lost.

If the intended rule is “use `sx`, not `style`”, these components should omit `style` from their
passthrough types, like most other components do.
If the intended rule is “support both”, they should merge `style` + `sx` (as `Tooltip` and
`SpeedDial` do).

#### `Select.Option` / `Option` accept DOM props but don’t apply them

In `Select`, `OptionProps` extends `React.LiHTMLAttributes<HTMLLIElement>`, but the exported
`Option` helper renders only `{children}`:

- `src/components/fields/Select.tsx:56` (type)
- `src/components/fields/Select.tsx:179` (implementation)

So callers can pass `className`, `style`, `id`, `title`, etc, but they are ignored.
This is a major “it compiles but does nothing” trap.

---

### 6) Props that target different elements than their name suggests

These are not necessarily wrong, but they read like “global component props” while actually applying
to an internal sub-element.

- `CodeBlock.ariaLabel` and `CodeBlock.title` apply to the internal copy button, not the code block root:
  - `src/components/widgets/CodeBlock.tsx:13`

To reduce confusion, these should be explicit (e.g. `copyButtonAriaLabel`, `copyButtonTitle`) or the
component should accept a richer “actions” slot.

---

### 7) Type and token drift that reduces predictability

These are smaller issues that still add cognitive load:

- `alignX` union ordering differs:
  - `Stack`: `'left' | 'center' | 'right'` (`src/components/layout/Stack.tsx:16`)
  - `Box` / `Panel` / `Tabs`: `'left' | 'right' | 'center'` (`src/components/layout/Box.tsx:18`, `src/components/layout/Panel.tsx:29`, `src/components/layout/Tabs.tsx:271`)
- `gap` type differs:
  - Most: `Space` (from `src/types.ts`)
  - `MetroSelect.gap`: `number | string` (`src/components/fields/MetroSelect.tsx:48`)
- `pad` type differs:
  - Most: `Space`
  - `Modal.pad`: `number | string` (`src/components/layout/Modal.tsx:115`) — functionally identical to `Space`, but inconsistent.
- `density` type differs:
  - Some use `'compact' | 'standard' | 'comfortable'`
  - `Surface` uses a `Density` type (`src/components/layout/Surface.tsx`)
- `width` / `height` types differ:
  - `Image.width` / `Image.height` accept `number | string` (`src/components/primitives/Image.tsx`)
  - `Video.width` / `Video.height` accept `string` only (`src/components/primitives/Video.tsx:25`)
- `Intent` is duplicated as a local type in multiple components instead of a shared export:
  - `src/components/fields/Button.tsx`
  - `src/components/fields/IconButton.tsx`
  - `src/components/widgets/Chip.tsx`
  - `src/components/layout/Panel.tsx`
  - `src/components/layout/AppBar.tsx`

---

## Suggested priority order (so another agent can pick up)

This is a suggested sequence; it’s not implemented here.

### P0 (largest adoption footguns)

- Resolve `open/defaultOpen` collision between Accordion and overlay components.
  - Consider renaming Accordion to `expanded`/`expandedItems`/`defaultExpanded`, etc.
- Resolve `onChange` semantic drift:
  - Prefer reserving `onChange(event)` for DOM-parity change events.
  - Use `onPageChange(page)` (or `onValueChange`) for Pagination-like “value callbacks”.
- Unify selection patterns across `List`, `Table`, `Tree` (naming + callback payload).

### P1 (consistency + metadata correctness)

- Fix `style` clobbering in polymorphic components (`Box`, `Typography`).
- Make `Select.Option` actually apply the props it claims to accept, or narrow the type so it cannot.
- Align `Tabs` `onValueChange/onValueCommit` payloads with `ChangeInfo<T>` (`src/system/events.ts`).
- Bring `DateSelector` onto `FieldBaseProps` (or document why it intentionally differs).
- Fix MCP data mismatches (e.g. `TextField.name` required vs reported optional; `Select.name` missing).

### P2 (paper-cuts / naming polish)

- Normalize `gap`/`spacing`, `pad` type, `density` type, `alignX` ordering.
- Disambiguate overloaded `title` and `icon` where they target different kinds of values.
- Consolidate duplicated ad-hoc types (e.g. `Intent` is duplicated across multiple components).

---

## Appendix: quick lists

### Components missing `sx` or `preset` in metadata

As of this snapshot (`mcp-data/`):

- Missing `sx`: `Option`, `Select.Option`, `Tabs.Tab`, `Tabs.Panel`
- Missing `preset`: `Option`, `Select.Option`

### Components that allow `style` passthrough (metadata) + pitfalls

From `mcp-data` `domPassthrough.omitted`, `style` is *not* omitted for:

- `Accordion`, `Accordion.Item`
- `Box`
- `Drawer`
- `Option`, `Select.Option`
- `SpeedDial`
- `Tabs.Tab`, `Tabs.Panel`
- `TextField`
- `Tooltip`
- `Typography`

Known pitfalls based on source inspection:

- `Typography` and `Box` clobber caller-provided `style` by always setting `style={sx}`/`style={inlineStyle}`
  (`src/components/primitives/Typography.tsx:309`, `src/components/layout/Box.tsx:130`).
- `Select.Option` / `Option` accept DOM props in their TS types but ignore them at runtime (`src/components/fields/Select.tsx:56`).
- `TextField` TS types omit `style`, but metadata currently reports it as passthrough (`src/components/fields/TextField.tsx:24`).

### Props with high “type variance” across components (warning sign)

From metadata, these prop names appear in multiple components but with many different type shapes:

- `size` (12 type variants across 15 components)
- `variant` (9 variants across 9 components)
- `onChange` (5 variants across 5 components)
- `value` / `defaultValue` (multiple shapes across 16/7 components)
- `title` / `icon` / `label` (multiple shapes)

Type variance isn’t inherently wrong, but it’s a good predictor of “same prop name, different meaning”.
