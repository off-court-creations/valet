# valet

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![GitHub](https://img.shields.io/badge/GitHub-valet-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet)

`valet` is a CSS-in-JS engine, a UI component kit, and an accessibility layer that treats all humans and their AI proxies as first class users.

Please expect many breaking changes but feel free to check it out!

When `1.0.X` drops hop in and depend on that thing!

`valet` is pronounced like the British attendant but pronouncing it like the car attendant is also very cool and encouraged.
Unless you don't like `valet` in which case its pronounced like the British attendant and go make `valet2` and tell us about it.

To read the docs, run:

```shell
npm install
npm run styleguide
```

To use `valet` in your project run:

```shell
cd YourReactLibraryThatUses_valet
npm install valet
```

To run a local dev server, run:

```shell
npm install
npm link
npm run dev
```

(second terminal emulator)

```shell
cd YourReactLibraryThatUses_valet
npm link valet
```

## Components

These have been mostly tested in the [Valet Playground](https://github.com/off-court-creations/valet-playground).

| Component          | Playground QC   | Comments |
|--------------------|:---------------:|----------|
| Accordion          | ✅             |----------|
| Box                | ✅             |----------|
| Button             | ✅             |----------|
| Checkbox           | ❌             | styling  |
| FormControl        | ✅             |----------|
| Icon               | ✅             |----------|
| IconButton         | ✅             |----------|
| Modal              | ❌             | styling  |
| Panel              | ✅             |----------|
| Radio Button       | ❌             | styling  |
| Switch             | ✅             |----------|
| Slider             | ✅             |----------|
| Tabs               | ✅             |----------|
| Tooltip            | ✅             |----------|
| Typography         | ✅             |----------|

## Hooks

- useGoogleFonts
- useTheme

## Utilities

- createFormStore

## Roadmap + Intended Components

- Everything related to being an AI "bridge"
- As close to AAA accessibility support as possible
  - No compromises on getting to AA

---

- Select
- List
- Table
- Progress
- App Bar
- Breadcrumbs
- Drawer
- Pagination
- Stepper
- Speed Dial
- Grid
