# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Added

- MCP: added `valet__search_best_practices` and `valet__list_synonyms` tools for agents to surface guidance and inspect alias mappings directly.
- Primitives: add `WebGLCanvas` — a reusable WebGL2 canvas host that handles context creation, DPR-aware resizing, and RAF. Docs lava-lamp hero now uses this component. Status: stable.
- Grid/Panel: introduce per-row height normalization.
  - Grid: new `normalizeRowHeights` prop (default `true`) stretches items so each row matches its tallest Panel when in 2+ columns (adaptive not collapsed).
  - Panel: new `normalizeRowHeight` prop (default `true`) to opt out on a per-panel basis.
 - Iterator: new props and docs
   - `onCommit(value)` event for blur/controls/wheel/keyboard commits
   - `commitOnChange` opt-in to live commits while typing
   - `roundToStep` to snap committed values to `step` from `min` (or `0`)
   - `wheelBehavior`: `'off' | 'focus' | 'hover'` (default `'focus'`)
   - Best Practices and curated Examples added to sidecar; docs page renders them
 - Fields: introduce `FieldBaseProps` with JSDoc for shared field props (`name`, `label`, `helperText`, `error`, `fullWidth`, `sx`, `preset`) to seed consistent reference descriptions across all fields.
 - MCP: extractor now reads per‑prop JSDoc comments from shared types and component interfaces to populate the Reference table descriptions by default.
- Table: smart height constraints for better UX on small viewports
  - New `minConstrainedRows` (default `4`): when `constrainHeight` would show fewer than this many rows, the table temporarily disables internal scrolling to avoid a tiny scroller.
  - New `maxExpandedRows` (default `30`): when `minConstrainedRows` disables constraining and the dataset exceeds this size, Table paginates (using `<Pagination/>`) with `maxExpandedRows` rows per page instead of using a scrollbar.
  - New `paginate` (default `false`): force pagination always using `maxExpandedRows`; otherwise pagination engages automatically only when `minConstrainedRows` kicks in.
  - Controlled pagination support via `page`, `onPageChange`, and `paginationWindow` (forwarded to Pagination’s `visibleWindow`).

### Changed

- Security: require Vite >= 6.4.1 across docs and templates.
 - Fields/Checkbox: add `indeterminate` prop with ARIA mixed state; accept `id` to pair with external labels/descriptions.
 - Fields/Checkbox: improve contrast — unchecked outline uses `theme.colors.divider`; checked fill uses `theme.colors.primary` with white indicator.
 - Fields/Checkbox: mark status to `stable`.
- CSS hashing: replace runtime siphash with dependency‑free BigInt FNV‑1a (64‑bit).
  - Hash output remains base36 but now includes a `-<len>` suffix (input length in base36) to further reduce practical collision risk.
  - Removes the `siphash` runtime dependency; reduces bundle size and CPU.
  - Generated class/keyframe names change; this is internal and does not affect public APIs.
- CVA: bump create‑valet‑app templates to Vite >=6.4.1 by default.
- MCP: extend component status enum to include `production` (very stable, polished; formerly `golden`) and `unstable` (known problem; avoid depending on it). Bumped MCP `schemaVersion` to `1.6` and regenerated `mcp-data/`.
- Docs: extracted LavaLampBackgroundGL shaders to standalone GLSL files under `docs/src/shaders/lava-lamp` and import via `?raw` for readability and better editor support.
- Docs: increase lava‑lamp pulse crowd repulsion ~100× (stronger scene reconfiguration). Parameters in `docs/src/shaders/lava-lamp/lavaLampParams.ts`.
- Docs: MetroSelect playground now controls selection mode (single/multiple) and tile size; removed non-functional `gap` control.
- Grid: now normalizes row heights by default for multi-column layouts; behavior is disabled automatically when adaptive collapses to a single column.
 - Modal: graduate to stable and refine API/UX
   - Add DOM passthrough and `sx` support; merge `className` with presets
   - Constrain dialog height to viewport via `--valet-modal-viewport-margin` and scroll content inside
   - Dev-time a11y guard warns when no accessible name (`title`, `aria-label`, or `aria-labelledby`)
   - Docs: simplify page; remove alert/controlled/size sections and add a11y + long-content demos
 - Iterator: UX and a11y improvements
   - Forward native `min`/`max`/`step` to the input for correct browser semantics
   - Wheel steps only when focused by default; `'hover'` mode is opt-in
   - Keyboard: ArrowUp/Down step; PageUp/Down big-step; Home/End to bounds; Enter commits; Escape reverts
   - Plus/minus icons use bold glyphs for readability (`mdi:plus-thick`/`mdi:minus-thick`)
 - Docs usage spacing refined to use `gap`/`pad` props (no `sx`)
 - List: `focusMode` prop to control row focus behavior
   - `auto` (default): non-selectable rows are not tabbable; selectable lists use roving focus
   - `row`: every row is tabbable (opt-in; not recommended for long lists)
   - `none`: rows are not in the tab order; programmatic focus only

 - Image: simplify and promote to `stable`
   - Remove custom IntersectionObserver lazy logic; rely on native `loading="lazy"`
   - Add `aspectRatio` prop and `max-width: 100%` default for better responsiveness
   - Remove `rounded` prop; apply rounding via wrapper with `overflow: hidden` (more robust across object-fit modes)
   - Forward refs; default `decoding="async"`; keep `sx` and preset support

 - Image: finalize simple API and defaults
   - Replace `objectFit` with `fit`; add `objectPosition` for focus/cropping control
   - Remove `lazy` boolean and `placeholder`; use native `loading` (default `'lazy'`)
   - Require `alt` text (empty string allowed for decorative)
   - Keep `aspectRatio`, `width`/`height` (number ⇒ px), `decoding='async'`, and `draggable={false}` by default
   - Passthrough responsive imaging attributes (`srcSet`, `sizes`) and `fetchPriority`

 - Progress: complete redesign with simpler API and better a11y/compat
  - New primitives `ProgressBar` and `ProgressRing` replace mode/variant juggling
  - Back-compat `Progress` wrapper remains (maps legacy `variant`/`mode`/`showLabel`)
  - Fewer props; more control via CSS vars and sensible defaults
 - Improved visuals: ring track + rounded caps; subtle indeterminate motion
 - Tight ARIA: role, value range, and indeterminate implied by omitted `value`

- Fields: migrate Checkbox, TextField, Select, RadioGroup/Radio, Switch, Slider, Iterator, and MetroSelect to extend `FieldBaseProps`. No runtime behavior changes; types and docs only.
- MCP: safer extractor for inherited props
  - Includes inherited userland props (from `src/`) and their JSDoc in component docs
  - Filters DOM attributes from alias/union shapes to avoid noisy Reference tables
  - Honors `Omit<...>` for DOM inheritance while still including same‑name userland props (e.g., `name`).

- Docs: Glossary page significantly improved for readability and navigation
  - Search across terms, aliases, definitions; live result count (ARIA‑announced)
  - Category filter and grouping (A–Z or by category) with section headings
  - Per‑entry deep links with copy‑link button; clickable “See also” anchors
  - Clear spacing, dividers, and sticky controls bar; optional JSON copy action
  - Preserves `GLOSSARY` structure for MCP extraction; recommend regenerating `mcp-data/`

### Fixed

- Chip: outlined variant border was invisible due to missing `divider` token in theme. Added `colors.divider` for light/dark themes and use it for default outlined borders.
 - Modal: raise backdrop/dialog z-index above AppBar so modals always cover app bars.

 
### Removed

- Skeleton: remove component from library, docs, and MCP data.

### Fixed

- Accessibility: Enhance `Tree` with robust keyboard navigation
  - Roving tabindex and initial focus on selected/first item
  - Arrow Up/Down, Left/Right, Home/End, and `*` siblings expand
  - ARIA `aria-level`, `aria-setsize`, `aria-posinset` on items
  - Docs NavDrawer now passes `aria-label` and is keyboard operable
 - Accessibility: Accordion keyboard support now consistent across browsers (incl. Safari)
   - Roving tabIndex on headers; Arrow Up/Down/Left/Right moves focus; Home/End jump
   - Space/Enter toggle reliably without page scroll in Safari
   - Disabled state dims with opacity and slight grayscale (Iterator-style), and is skipped by keyboard navigation
- Docs: LiveCodePreview now executes function component examples (e.g. `() => <...>`), fixing MetroSelect “Controlled value” example rendering in the playground/examples.
- Avatar: Gravatar fallback when neither `src` nor `email` is provided now resolves to a stable default image instead of a broken URL; default `loading="lazy"` for better performance.
- Switch: set `type="button"` to avoid unintended form submissions when used inside a `<form>`.
 - Iterator: Disabled field now dims text/border to match disabled icon buttons; `readOnly` respected across wheel/buttons/keyboard; typing no longer forces premature commit unless `commitOnChange` is enabled.
 - Image: respect `draggable` when true; no longer prevents dragstart unconditionally
 - Accordion: flip chevron orientation so collapsed shows down and expanded shows up.
 - Accordion: divider borders now fade using theme motion tokens on hover; selected (open) item keeps dividers visible when hovered.

- Tooltip/IconButton: prevent iOS long‑press selection handles (“selection gates”) from appearing in Tooltip demos. Added `-webkit-user-select: none`, `-webkit-touch-callout: none`, and tap‑highlight/`touch-action` guards to IconButton and disabled selection on the Tooltip bubble.

- Icon: prevent selection and long‑press callout on iOS/Android by disabling selection and touch callout on the wrapper and SVG; also remove tap highlight and mark the wrapper `draggable={false}`.

- List: ground‑up rewrite for simplicity and function
  - Unified pointer-based reordering (mouse/touch/pen), plus Alt+Arrow keyboard reorder
  - Cleaner selection with roving tabIndex and Arrow/Enter/Space navigation
  - Optional `getKey(item, index)` for stable keys; `emptyPlaceholder` for empty states
  - Simpler styling (striped/hover/selected) with fewer side-effects; retains presets and `sx`
 - Accessibility: List no longer forces non-selectable rows into the tab order
   - Non-selectable lists keep `tabIndex` unset; selectable lists retain roving focus
  - Adds explicit override via `focusMode` for advanced use cases

- SpeedDial: prevent iOS long‑press text selection and callout on the main FAB and action buttons by disabling selection (`user-select: none`), iOS touch callout, and using `touch-action: manipulation`; also suppress the long‑press context menu.

## [0.32.0]

### Added

- MCP: component-level `status` field in schema and merged output; server types updated to include status badges.
- MCP: aliases support and generated synonyms file. Merge now emits `mcp-data/component_synonyms.json` from sidecar `aliases[]` to power search and MCP tooling.
- Docs: new Component Status page (`/component-status`) listing all components with category, slug, and status (sortable Valet Table).
- Docs: reusable `BestPractices` component that renders sidecar-driven guidance across demo pages.

### Changed

- MCP: migrated all sidecar metadata to JSON (`*.meta.json`) and made sidecars the source of truth for `docs.bestPractices`. Merge prefers sidecar best practices over in-code defaults. Bumped MCP schema version to `1.5`.
- Docs: converted demo pages to consume sidecar best practices and removed legacy inline “Best Practices” panels to de-duplicate guidance. Surface explainer now pulls practices directly from `Surface.meta.json`.
- Theme: use off‑white text (`primaryText`) on `backgroundAlt` surfaces for improved contrast (Panel, Modal, Select, DateSelector).
- Theme: promote Signal Orange (`#D16701`) to `secondary`; introduce new error color Signal Red (`#D32F2F`) with off‑white `errorText`.
- Docs: homepage dividers now use `secondary` instead of `error` for visual consistency.

### Fixed

- Docs build: corrected JSON import paths and Vite CSS import for `@archway/valet` styles to avoid resolution errors.
- Types: cleaned up theme typing in Typography demos to avoid implicit `any`s and ensure stable token usage.
- MCP validation: resolved `mcp:schema:check` warning by always generating `component_synonyms.json` (even when empty).

### Migration notes

- If you have custom sidecars, convert them to `*.meta.json` and add `status` and `aliases` as needed. Move any “Best Practices” content from docs into sidecars under `docs.bestPractices`.

## [0.31.0]

- docs: Add hyperspace starfield (light‑speed) motion layer under hero blobs. GPU-friendly canvas with trails, DPR aware, and respects reduced motion.
- MCP: Add `adjust_theme` tool to safely update `useInitialTheme` in an App file. Supports marker-bound edits, merging theme and font overrides/extras, and always applies with a pre-write backup and diff.

## [0.30.5]
- MCP: Add glossary pipeline and tools. New docs page at `/glossary` powers `glossary.json` via `scripts/mcp/extract-glossary.mjs`; server exposes `get_glossary` and `define_term` (soft-fail suggestions).
- MCP: Add hardcoded `get_primer` tool and resources to guide agents on ethos, patterns, and recommended flows; selfcheck now reports `glossaryEntries` and `hasPrimer`.

## [0.30.4]
- docs: add Best Practices sections for Surface, Styled Engine, and Theme concept pages; plus AppBar, Stack, and Drawer component demos for consistent guidance.
- docs: add Best Practices sections for Pagination, Snackbar, and RadioGroup demos to strengthen accessibility, motion, and state guidance.
- docs: enhance Best Practices for Tabs, Grid, and Select demos with surface-aware overflow, tokenized motion/spacing, and accessibility guidance.
- docs: add Best Practices for List, Tree, and Dropzone demos to cover selection/reorder ergonomics, keyboard navigation patterns, and secure file handling.
- docs: add Best Practices for Stepper, SpeedDial, and Checkbox demos; emphasize presentational vs. navigational roles, safe action clusters, and accessible toggle semantics.
- docs: add Best Practices for Switch, Slider, and Typography demos; clarify instant vs. form toggles, snapping/precision and keyboard support, and semantic heading usage with tokenized type scale.
- docs: add Best Practices for IconButton, Image, and Progress demos; strengthen accessible naming, layout stability, and mode/ARIA guidance.
- docs: add Best Practices for Icon, Skeleton, and Video demos; emphasize semantic sizing and labeling, realistic placeholders, and media accessibility/performance.

## [0.30.3]

- Updated docs to represent the changes and upgrades to `@archway/valet-mcp`!

## [0.30.2]
- Updated AGENTS.md and the docs to represent the changes and upgrades to `@archway/valet-mcp`!

## [0.30.1]
- `Tabs`: switch overflow behavior to single-row horizontal scroll with edge fade indicators; removes multi-row wrapping when tab strip exceeds width. Improves discoverability with a subtle gradient implying more content.
- `Tabs`: drag-to-scroll with mouse when the tab strip overflows horizontally; vertical mouse wheel converts to horizontal scroll for usability.

## [0.30.0]
- Tabs: replace `centered` with Box-like `alignX` prop for tab strip alignment. Removed `centered`.
- Panel: add Box-like `alignX` and rename `centered` (content centering) to `centerContent`.

## [0.29.1]
- `MetroSelect` color theme adjustments

## [0.29.0]
- Theme: add `error`/`errorText` tokens to light and dark palettes.
- Fields: use `theme.colors.error` for `TextField` borders/helpers and `KeyModal` error text.
- `Select`: fix `--valet-text-color` usage and standardize control backgrounds on `backgroundAlt`.
- `Modal`: switch dialog background to `backgroundAlt` for consistency with controls.
- `Pagination`: remove unused `nudgeSlide` helper and clean up dependencies.
- Docs: update Styled Engine badge example to `primary`/`primaryText` tokens.

## [0.28.7]
- Fix: Adaptive `Grid` on older iOS/WebKit no longer forces an inner scrollbar on the first item. Panels now respect CSS vars for overflow/max-height, and `Grid` relaxes them in single‑column portrait so content stacks and the page scrolls naturally.

## [0.28.6]
- RichChat styling

## [0.28.5]
- RichChat: auto-scrolls to bottom on new messages when scrollable, ensuring latest user/system messages are visible.

## [0.28.4]
- Fix: RichChat always keeps input visible and makes messages the scroll container. Resolves portrait screens not showing newest chat or input; messages now scroll under the input instead of hiding it.

## [0.28.3]
- Pagination: normalize WebKit button appearance with transparent background

## [0.28.2]
- DateSelector: auto-compact mode for narrow containers

## [0.28.1]
- Fix: persistent Drawer now respects AppBar offset and no longer renders under the AppBar; height adjusts to avoid overlap. Also offsets the adaptive toggle button.

## [0.28.0]
- `style={{}}` behavior changed to `sx={{}}` for all Valet components

## [0.27.0]
- `Grid` behavior change to improve `adpative` behavior

## [0.26.2]
- Enhance `SpeedDial` with slide-out/in animation for actions with direction-aware offsets and staggered transitions. 

## [0.26.1]
- Adjusted `Pagination` component
- Adjusted theme values for motion

## [0.26.0]
- Added theme tokens for motion!
- `Pagination` now powered by theme token.
- `Pagination` now has fancy animations.

## [0.25.5]
- Enhanced `Pagination` with windowed view via `visibleWindow` and non-destructive window scroll controls
- Performance: optimize `Pagination`

## [0.25.4]
- Improved vertically aligned `Tabs` styling.
- Improved `Accordion` styling. 


## [0.25.3]
- Add `Divider` component with spacing ergonomics and docs page (Usage/Playground/Reference); wired into docs Nav.
- Enhance `Pagination` with animated sliding underline and subtle elastic width pulse for active page
- Improved docs


## [0.25.2]
- Docs improvements
- `Drawer`, `Typography`, `Tree` interplay improvements
- Fix: eliminate resize-induced leak with persistent `Drawer`
- Improved `Codeblock`

## [0.25.1]

- Improved docs

## [0.25.0]

- Revamped spacing systems
- Improved `List` and `Box`
- Improved docs

## [0.24.0]

- Setup ESLint and Prettier
- linted valet and docs

## [0.23.5]

- Auto-hide `Skeleton` when wrapped image finishes loading

## [0.23.4]

- Allow `Skeleton` to display optional icon while loading

## [0.23.3]

- Added `Skeleton` component
- Prevent `Image` dragging to avoid ghost cursor

## [0.23.2]

- Add `fontFamily` prop to `TextField` and `RichChat` for custom input fonts

## [0.23.1]

- Add disabled style for MetroSelect options

## [0.23.0]

- Add `left` and `right` slots to `AppBar` for flexible placement
  - **Migration**: replace `icon`/`iconAlign` with `left`/`right`
    - before: `<AppBar icon={<Icon />} iconAlign="left" />`
    - after: `<AppBar left={<Icon />} right={<Button />} />`

## [0.22.5]

- Add `noSelect` prop to `Typography` to disable text selection
- Use `Typography` `noSelect` for `Accordion` headers, `Tabs` labels, and `MetroSelect` options
- Use `Typography` `noSelect` in `Button` and drop redundant selection overrides

## [0.22.4]

- Add optional `tooltip` prop to `Tabs.Tab` for hover hints

## [0.22.3]

- Add `centered` prop to `Tabs` to center tab headings

## [0.22.2]

- Improved visual bug involving skrinking / resizing for `Table` and `Accordion`

## [0.22.1]

- Fixed a visibility bug with `Tooltip`
- Adjusted `Stepper` styling

## [0.22.0]

- Added support support for local OTF font files

## [0.21.3]

- Adjusted internal Zustand store setup

## [0.21.2]

- Adjusted `Icon` sizing for better iOS / Safari support
- Reworked `AppBar` to ensure background color renders on older Safari
- Portaled `AppBar` to `document.body` to fix background color bug on old Safari
- Added `MetroSelect` component

## [0.21.1]

- Adjusted `Icon` sizing for better iOS / Safari support

## [0.21.0]

- Removed edit pencil functionality from `Rich Chat`

## [0.20.1]

- Fix Button text spacing when wrapping primitives

## [0.20.0]

- Added optional `icon` prop to `AppBar` with left/right placement and improved spacing
- Fixed theme fonts not loading unless `fontFamily` prop set on `Typography`
- Added `family` prop to `Typography` for choosing theme fonts
- `Tree` text now uses the body font

## [0.19.3]

- Updated `Accordion` demo

## [0.19.2]

- Adjusted `Accordion`
- Adjust `RichChat` and `LLMChat` to use "outlined" `Accordion`

## [0.19.1]

- Removed Pixi.js integration demo

## [0.19.0]

- Added React 19 compatibility
- Added Pixi.js integration demo

## [0.18.3]

- `Dropzone` component for simple drag-and-drop uploads

## [0.18.2]

- `RichChat` component for local chats with embeddable content

## [0.18.1]

- Added `Markdown` component
- Used `Markdown` component in `LLMChat` to improve response styling

## [0.18.0]

- Renamed `OAIChat` component to `LLMChat`

## [0.17.0]

### Added

- `KeyModal` component and secure `openaiKeyStore` for browser-stored keys

### Changed

- `OAIChat` starts disconnected with a built-in AppBar to manage the OpenAI key
- `TextField` accepts `fullWidth` to stretch inside flex rows

## [0.16.3]

- Improved `OAIChat` styling, especially on mobile / portrait.

## [0.16.2]

- Range mode on `DateSelector` uses primary tones and a filled secondary end day
- Selected dates in `DateSelector` now have bold text

## [0.16.1]

- Bugfix on `Panel` default background

## [0.16.0]

- Adjust sizing and spacing for:
  - Box
  - Panel
  - Stack
  - Surface
  - Tabs
  - Typography
  - Table

## [0.15.1]

- Adjusted size mappings for `IconButonn` and `Icon`
- Adjusted classification of some components

## [0.15.0]

### Removed

- `DateTimePicker` component

## [0.14.0]

- Added `DateSelector` widget – compact calendar component
- Added `Iterator` widget – numeric stepper input
- `Iterator` responds to mouse wheel scrolling when hovered
- `Iterator` prevents page scroll while hovered

## [0.13.0]

- Renamed `Chat` to `OAIChat`

## [0.12.1]

- Fixed `AppBar` portal to inherit font variables from the current `Surface`

## [0.12.0]

- Adjusted Avatar, Button, Icon, IconButton, Checkbox, RadioGroup,
  Select, Slider, and Progress to have more consistent sizing
  and `size` prop usage.
- Added Prop Patterns docs page to Getting Started

## [0.11.3]

- Adjusted IconButton and Button to have consistent sizing under the hood

## [0.11.2]

- Added `Image` primitive component and docs demo

## [0.11.1]

- Grid now supports an `adaptive` prop for portrait layouts

## [0.11.0]

- Renamed `Drawer` prop `responsive` to `adaptive`

## [0.10.1]

- `AppBar` uses the surface store to offset content and now renders via portal
  above responsive drawers
- Docs demo updated to show scroll behind the AppBar
- Drawer components account for AppBar height when responsive

## [0.10.0]

- `Stack` spacing defaults to 1 and respects `compact` unless explicitly set
- Docs now include a Surface usage explainer

## [0.9.0]

### Added

- `useSurface` hook now accepts an optional state selector and equality function,
  mirroring Zustand’s API for partial subscriptions

### Changed

- `Accordion`, `Chat`, `Drawer`, `Snackbar`, `Table`, and `Typography` components call `useSurface`
  with selectors and shallow equality to avoid unnecessary re-renders `Drawer`’s
  responsive logic uses the selected `Surface` element to handle persistent margins correctly

## [v0.8.7]

### Added

- DateTimePicker component

## [v0.8.6]

### Added

- Shared navigation drawer component for docs

## [v0.8.5]

### Added

- Tree component demonstrating nested navigation (renamed from TreeView)
- Responsive drawer

### Changed

- Tree now accepts a `selected` prop for controlled selection

### Improved

- List variant lines centered on expand boxes and omit root connector
- Tree demo shows a third level with mixed collapsible nodes
- List variant boxes now use the secondary theme color when expanded
- Persistent and responsive drawers now scroll if their content exceeds the viewport

## [v0.8.4]

### Added

- Chat component with OpenAI-style messages and height constraint option

## [v0.8.3]

### Fixed

- Uniform highlight width on Accordion items

### Improved

- Clearer hover contrast on Accordion headers
- Stack rows now vertically center their children

### Added

- Avatar component with Gravatar fallback
- Avatar demo page includes an interactive email form

## [v0.8.2]

### Improved

- Radio button spacing and indicator alignment

## [v0.8.1]

### Improved

- Accordion chevron orientation and animation performance
- Accordion can now constrain height with Surface

### Fixed

- Accordion constrained height now fills the available space within a Surface
- Accordion no longer clamps to its initial height before expansion

## [v0.8.0]

### Improved

- Typography `autoSize` functionality
- Stack default padding / margins
- compact prop for Stack, Box, Panel
- spacing behavior

### Changed

- `Table` now defaults to striped rows and column dividers

### Fixed

- `Surface` updates overflow state when DOM changes
- `Table` constrainHeight measures offset from the surface top to avoid shrinking loops
- `Table` accounts for content below it so controls remain visible

## [v0.7.2]

### Changed

- Main page of docs - Main page spacing styling

## [v0.7.1]

### Fixed

- Spacing units calculations internally. Mobile layouts improved.

### Added

- `compact` prop for `Box`, `Panel`, and `Stack`.

## [v0.7.0]

### Changed

- Replaced spacing size tokens (sm, md, lg, xl) with units (1, 2, 3)

## [v0.6.1]

### Changed

- Replaced @emotion/hash hashing with siphash
- Adjusted CSS-in-JS:
  - Updated the styled helper so each CSS rule’s class name uses a readable label and a siphash value
  - Keyframe and preset class names now rely on the new hash function, including a sanitized prefix for presets

## [v0.6.0]

### Added

- `Keep a Changelog` 1.1.0 rules in `AGENTS.md`
- Initial changelog with historical versions
- Components started:
  - `Snackbar`
  - `Video`

### Fixed

- Acccordion
  - Right clicking accordion headers now toggles them instead of showing the browser menu
  - Long pressing accordion headers on touch devices now toggles them

## [v0.5.2]

### Other

- vibe coded

## [v0.5.1]

### Other

- vibe coded

## [v0.5.0]

### Other

- vibe coded

## [v0.4.2]

### Other

- vibe coded

## [v0.4.1]

### Other

- vibe coded

## [v0.4.0]

### Other

- vibe coded

## [v0.3.3]

### Other

- vibe coded

## [v0.3.2]

### Other

- vibe coded

## [v0.3.1]

### Other

- vibe coded

## [v0.3.0]

### Other

- vibe coded

## [v0.2.5]

### Other

- vibe coded

## [v0.2.4]

### Other

- vibe coded

## [v0.2.3]

### Other

- vibe coded

## [v0.2.2]

### Other

- vibe coded

## [v0.2.1]

### Other

- vibe coded

[v0.30.1]: https://github.com/off-court-creations/valet/releases/tag/v0.30.1
[v0.30.0]: https://github.com/off-court-creations/valet/releases/tag/v0.30.0
[v0.29.1]: https://github.com/off-court-creations/valet/releases/tag/v0.29.1
[v0.29.0]: https://github.com/off-court-creations/valet/releases/tag/v0.29.0
[v0.28.7]: https://github.com/off-court-creations/valet/releases/tag/v0.28.7
[v0.28.6]: https://github.com/off-court-creations/valet/releases/tag/v0.28.6
[v0.28.5]: https://github.com/off-court-creations/valet/releases/tag/v0.28.5
[v0.28.4]: https://github.com/off-court-creations/valet/releases/tag/v0.28.4
[v0.28.3]: https://github.com/off-court-creations/valet/releases/tag/v0.28.3
[v0.28.2]: https://github.com/off-court-creations/valet/releases/tag/v0.28.2
[v0.28.1]: https://github.com/off-court-creations/valet/releases/tag/v0.28.1
[v0.28.0]: https://github.com/off-court-creations/valet/releases/tag/v0.28.0
[v0.27.0]: https://github.com/off-court-creations/valet/releases/tag/v0.27.0
[v0.26.2]: https://github.com/off-court-creations/valet/releases/tag/v0.26.2
[v0.26.1]: https://github.com/off-court-creations/valet/releases/tag/v0.26.1
[v0.26.0]: https://github.com/off-court-creations/valet/releases/tag/v0.26.0
[v0.25.5]: https://github.com/off-court-creations/valet/releases/tag/v0.25.5
[v0.25.4]: https://github.com/off-court-creations/valet/releases/tag/v0.25.4
[v0.25.3]: https://github.com/off-court-creations/valet/releases/tag/v0.25.3
[v0.25.2]: https://github.com/off-court-creations/valet/releases/tag/v0.25.2
[v0.25.1]: https://github.com/off-court-creations/valet/releases/tag/v0.25.1
[v0.25.0]: https://github.com/off-court-creations/valet/releases/tag/v0.25.0
[v0.24.0]: https://github.com/off-court-creations/valet/releases/tag/v0.24.0
[v0.23.5]: https://github.com/off-court-creations/valet/releases/tag/v0.23.5
[v0.23.4]: https://github.com/off-court-creations/valet/releases/tag/v0.23.4
[v0.23.3]: https://github.com/off-court-creations/valet/releases/tag/v0.23.3
[v0.23.2]: https://github.com/off-court-creations/valet/releases/tag/v0.23.2
[v0.23.1]: https://github.com/off-court-creations/valet/releases/tag/v0.23.1
[v0.23.0]: https://github.com/off-court-creations/valet/releases/tag/v0.23.0
[v0.22.5]: https://github.com/off-court-creations/valet/releases/tag/v0.22.5
[v0.22.4]: https://github.com/off-court-creations/valet/releases/tag/v0.22.4
[v0.22.3]: https://github.com/off-court-creations/valet/releases/tag/v0.22.3
[v0.22.2]: https://github.com/off-court-creations/valet/releases/tag/v0.22.2
[v0.22.1]: https://github.com/off-court-creations/valet/releases/tag/v0.22.1
[v0.22.0]: https://github.com/off-court-creations/valet/releases/tag/v0.22.0
[v0.21.3]: https://github.com/off-court-creations/valet/releases/tag/v0.21.3
[v0.21.2]: https://github.com/off-court-creations/valet/releases/tag/v0.21.2
[v0.21.1]: https://github.com/off-court-creations/valet/releases/tag/v0.21.1
[v0.21.0]: https://github.com/off-court-creations/valet/releases/tag/v0.21.0
[v0.20.1]: https://github.com/off-court-creations/valet/releases/tag/v0.20.1
[v0.20.0]: https://github.com/off-court-creations/valet/releases/tag/v0.20.0
[v0.19.3]: https://github.com/off-court-creations/valet/releases/tag/v0.19.3
[v0.19.2]: https://github.com/off-court-creations/valet/releases/tag/v0.19.2
[v0.19.1]: https://github.com/off-court-creations/valet/releases/tag/v0.19.1
[v0.19.0]: https://github.com/off-court-creations/valet/releases/tag/v0.19.0
[v0.18.3]: https://github.com/off-court-creations/valet/releases/tag/v0.18.3
[v0.18.2]: https://github.com/off-court-creations/valet/releases/tag/v0.18.2
[v0.18.1]: https://github.com/off-court-creations/valet/releases/tag/v0.18.1
[v0.18.0]: https://github.com/off-court-creations/valet/releases/tag/v0.18.0
[v0.17.0]: https://github.com/off-court-creations/valet/releases/tag/v0.17.0
[v0.16.3]: https://github.com/off-court-creations/valet/releases/tag/v0.16.3
[v0.16.2]: https://github.com/off-court-creations/valet/releases/tag/v0.16.2
[v0.16.1]: https://github.com/off-court-creations/valet/releases/tag/v0.16.1
[v0.16.0]: https://github.com/off-court-creations/valet/releases/tag/v0.14.0
[v0.15.1]: https://github.com/off-court-creations/valet/releases/tag/v0.15.1
[v0.15.0]: https://github.com/off-court-creations/valet/releases/tag/v0.15.0
[v0.14.0]: https://github.com/off-court-creations/valet/releases/tag/v0.14.0
[v0.13.0]: https://github.com/off-court-creations/valet/releases/tag/v0.13.0
[v0.12.1]: https://github.com/off-court-creations/valet/releases/tag/v0.12.1
[v0.12.0]: https://github.com/off-court-creations/valet/releases/tag/v0.12.0
[v0.11.3]: https://github.com/off-court-creations/valet/releases/tag/v0.11.3
[v0.11.2]: https://github.com/off-court-creations/valet/releases/tag/v0.11.2
[v0.11.1]: https://github.com/off-court-creations/valet/releases/tag/v0.11.1
[v0.11.0]: https://github.com/off-court-creations/valet/releases/tag/v0.11.0
[v0.10.1]: https://github.com/off-court-creations/valet/releases/tag/v0.10.1
[v0.10.0]: https://github.com/off-court-creations/valet/releases/tag/v0.10.0
[v0.9.0]: https://github.com/off-court-creations/valet/releases/tag/v0.9.0
[v0.8.7]: https://github.com/off-court-creations/valet/releases/tag/v0.8.7
[v0.8.6]: https://github.com/off-court-creations/valet/releases/tag/v0.8.6
[v0.8.5]: https://github.com/off-court-creations/valet/releases/tag/v0.8.5
[v0.8.4]: https://github.com/off-court-creations/valet/releases/tag/v0.8.4
[v0.8.3]: https://github.com/off-court-creations/valet/releases/tag/v0.8.3
[v0.8.2]: https://github.com/off-court-creations/valet/releases/tag/v0.8.2
[v0.8.1]: https://github.com/off-court-creations/valet/releases/tag/v0.8.1
[v0.8.0]: https://github.com/off-court-creations/valet/releases/tag/v0.8.0
[v0.7.1]: https://github.com/off-court-creations/valet/releases/tag/v0.7.1
[v0.7.0]: https://github.com/off-court-creations/valet/releases/tag/v0.7.0
[v0.6.1]: https://github.com/off-court-creations/valet/releases/tag/v0.6.1
[v0.6.0]: https://github.com/off-court-creations/valet/releases/tag/v0.6.0
[v0.5.2]: https://github.com/off-court-creations/valet/releases/tag/v0.5.2
[v0.5.1]: https://github.com/off-court-creations/valet/releases/tag/v0.5.1
[v0.5.0]: https://github.com/off-court-creations/valet/releases/tag/v0.5.0
[v0.4.2]: https://github.com/off-court-creations/valet/releases/tag/v0.4.2
[v0.4.1]: https://github.com/off-court-creations/valet/releases/tag/v0.4.1
[v0.4.0]: https://github.com/off-court-creations/valet/releases/tag/v0.4.0
[v0.3.3]: https://github.com/off-court-creations/valet/releases/tag/v0.3.3
[v0.3.2]: https://github.com/off-court-creations/valet/releases/tag/v0.3.2
[v0.3.1]: https://github.com/off-court-creations/valet/releases/tag/v0.3.1
[v0.3.0]: https://github.com/off-court-creations/valet/releases/tag/v0.3.0
[v0.2.5]: https://github.com/off-court-creations/valet/releases/tag/v0.2.5
[v0.2.4]: https://github.com/off-court-creations/valet/releases/tag/v0.2.4
[v0.2.3]: https://github.com/off-court-creations/valet/releases/tag/v0.2.3
[v0.2.2]: https://github.com/off-court-creations/valet/releases/tag/v0.2.2
[v0.2.1]: https://github.com/off-court-creations/valet/releases/tag/v0.2.1
