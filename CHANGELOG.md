# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

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
