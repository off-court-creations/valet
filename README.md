# valet

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![GitHub](https://img.shields.io/badge/GitHub-valet-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet) [![GitHub](https://img.shields.io/badge/GitHub-valet--playground-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet-playground)[![npm](https://img.shields.io/badge/npm-%40archway%2Fvalet-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet)


`valet` is a CSS-in-JS engine, a UI component kit, and an accessibility layer that treats all humans and their AI proxies as first class users.

---

This library is currently pre-1.0 and the API may change without notice. It is released under the MIT license.

When version `1.0.x` arrives you can depend on a stable interface.

---

To use `valet` in your project run:

```shell
cd your-project-using-valet
npm install @archway/valet
```

## Quick start example:

```tsx
import { Button, Surface } from '@archway/valet'

export default function Example() {
  return (
    <Surface>
      <Button>Click me</Button>
    </Surface>
  )
}
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
npm link @archway/valet
```

## Surface state and child registry

Each `<Surface>` instance now owns a Zustand store that tracks its screen size
and every registered child element. Components created with `createStyled`
register themselves automatically and expose `--valet-el-width` and
`--valet-el-height` CSS variables. The surface exposes
`--valet-screen-width` and `--valet-screen-height` on its root element.
Nested `<Surface>` components are disallowed.

Tables respect available height by default. Their content scrolls inside the
component rather than the page. Pass `constrainHeight={false}` to opt out.

## Build

Run `npm run build` to generate the `dist` folder for publishing. Use `npm run dev` during development for a live rebuild.

## Playground

You can try every component in the [Valet Playground](https://github.com/off-court-creations/valet-playground). ([Live Demo!](https://main.d3h9kmt4y5ma0a.amplifyapp.com/)) Clone that repository and run:

```shell
npm install
npm run dev
```

## Components

These have been mostly tested in the [Valet Playground](https://github.com/off-court-creations/valet-playground). ([Live Demo!](https://main.d3h9kmt4y5ma0a.amplifyapp.com/))

| Component          | Works 💻 | Works 📱 | Prod Style 💻📱 | Ok Style 💻| Ok Style 📱 | Playground QC | Comments                         |
|--------------------|:--------:|:--------:|:---------------:|:----------:|:-----------:|:-------------:|----------------------------------|
| Accordion          | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |
| App Bar            | 🟡       | 🟡       |        🟡       | 🟡         | 🟡          | 🟡            | WIP                              |
| Box                | ✅       | ✅       |        ✅       | ✅         | ✅          | ✅            | ----------                       |
| Button             | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |
| Checkbox           | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |
| Drawer             | 🟡       | 🟡       |        🟡       | 🟡         | 🟡          | 🟡            | WIP                              |
| FormControl        | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |
| Grid               | ✅       | ✅       |        ✅       | ✅         | ✅          | ✅            | ----------                       |
| Icon               | ✅       | ✅       |        ✅       | ✅         | ✅          | ✅            | ----------                       |
| IconButton         | ✅       | ✅       |        ✅       | ✅         | ✅          | ✅            | ----------                       |
| List               | ✅       | ❌       |        ❌       | ✅         | ❌          | ❌            | Needs mobile support!            |
| Modal              | 🟡       | 🟡       |        ❌       | 🟡         | 🟡          | 🟡            | styling                          |
| Pagination         | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |
| Panel              | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |
| Parallax           | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |
| Progress           | 🟡       | 🟡       |        ❌       | 🟡         | 🟡          | 🟡            | styling                          |
| Radio Group        | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |
| Select             | 🟡       | 🟡       |        ❌       | 🟡         | 🟡          | 🟡            | styling                          |
| Slider             | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |
| Speed Dial         | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |
| Stack              | ✅       | ✅       |        ✅       | ✅         | ✅          | ✅            | ----------                       |
| Stepper            | 🟡       | 🟡       |        🟡       | 🟡         | 🟡          | 🟡            | WIP                              |
| Surface            | ✅       | ✅       |        ✅       | ✅         | ✅          | ✅            | ----------                       |
| Switch             | ✅       | ✅       |        ✅       | ✅         | ✅          | ✅            | ----------                       |
| Table              | ✅       | ❌       |        ❌       | ✅         | ❌          | ❌            | Needs mobile support!            |
| Tabs               | ✅       | ✅       |        ✅       | ✅         | ✅          | ✅            | ----------                       |
| Textfield          | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |
| Tooltip            | ✅       | ❌       |        ❌       | ✅         | ❌          | ❌            | mobile long-press support        |
| Typography         | ✅       | ✅       |        🟡       | ✅         | ✅          | ✅            | ----------                       |

## Hooks

| Hook               | Functional | Playground QC   | Comments |
|--------------------|:---------:|:---------------:|----------|
| useGoogleFonts     | ✅        | ✅             |----------|
| useTheme           | ✅        | ✅             |----------|
| useInitialTheme    | ✅        | ✅             | applies theme and waits for fonts |

The loader hides content until Google Fonts are fully applied.
If fonts aren't cached, it waits an extra ~300ms after load to
avoid flashes of unstyled text.

## Utilities

| Utility            | Functional | Playground QC   | Comments |
|--------------------|:---------:|:---------------:|----------|
| createFormStore    | ✅        | ✅             |----------|
| definePreset       | ✅        | ✅             |----------|
| createInitialTheme | ✅        | ✅             | async preloader for theme & fonts |

## Roadmap

- Develop the AI "bridge" that lets proxies introspect component semantics and drive user interactions
- As close to AAA accessibility support as possible
  - No compromises on getting to AA

## Intended Components

- TBD

## Contributing

We welcome issues and pull requests. Please read `AGENTS.md` for coding standards and open an issue before making large changes. Use the standard GitHub workflow at [valet issues](https://github.com/off-court-creations/valet/issues).
