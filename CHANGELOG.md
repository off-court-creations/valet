# Changelog

All notable changes to this project will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased
### Improved
- Typography `autoSize` functionality
- Stack default padding / margins
- Tabs alignment and docs typography page now uses tabs for intro and reference
### Fixed
- Reference tab on Typography demo no longer shows a tiny scrollbar
- Tab panels scale to content height so switching tabs doesn't scroll
- Switching tabs no longer leaves a tiny page scroll
- Removed extra padding on Typography page stack so Reference tab fits without scrolling
### Changed
- `Table` now defaults to striped rows and column dividers

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
