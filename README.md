# valet

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[![GitHub](https://img.shields.io/badge/GitHub-valet-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet)

`valet` is a CSS-in-JS engine, a UI component kit, and an accessibility layer that treats all humans and their AI proxies as first class users.

This library is currently pre-1.0 and the API may change without notice. It is released under the MIT license.

When version `1.0.x` arrives you can depend on a stable interface.


To use `valet` in your project run:

```shell
cd your-project-using-valet
npm install @archway/valet
```

Quick start example:

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

### Build

Run `npm run build` to generate the `dist` folder for publishing. Use `npm run dev` during development for a live rebuild.

### Playground

You can try every component in the [Valet Playground](https://github.com/off-court-creations/valet-playground). Clone that repository and run:

```shell
npm install
npm run dev
```

## Components

These have been mostly tested in the [Valet Playground](https://github.com/off-court-creations/valet-playground).

| Component          | Functional | Playground QC | Comments |
|--------------------|:---------:|:-------------:|----------|
| Accordion          | ✅        | ✅           |----------|
| Box                | ✅        | ✅           |----------|
| Button             | ✅        | ✅           |----------|
| Checkbox           | ✅        | ❌           | styling  |
| Drawer             | ❌        | ❌           |   WIP    |
| FormControl        | ✅        | ✅           |----------|
| Icon               | ✅        | ✅           |----------|
| IconButton         | ✅        | ✅           |----------|
| List               | ✅        | ✅           |----------|
| Modal              | ✅        | ❌           | styling  |
| Panel              | ✅        | ✅           |----------|
| Parallax           | ✅        | ✅           |----------|
| Progress           | ✅        | ❌           | styling  |
| Radio Group        | ✅        | ❌           | styling  |
| Select             | ✅        | ❌           | styling  |
| Slider             | ✅        | ✅           |----------|
| Stack              | ✅        | ✅           |----------|
| Surface            | ✅        | ✅           |----------|
| Switch             | ✅        | ✅           |----------|
| Table              | ✅        | ✅           |----------|
| Tabs               | ✅        | ✅           |----------|
| Textfield          | ✅        | ✅           |----------|
| Tooltip            | ✅        | ✅           |----------|
| Typography         | ✅        | ✅           |----------|

## Hooks

| Hook               | Playground QC   | Comments |
|--------------------|:---------------:|----------|
| useGoogleFonts     | ✅             |----------|
| useTheme           | ✅             |----------|

## Utilities

| Utility               | Playground QC   | Comments |
|--------------------|:---------------:|----------|
| createFormStore    | ✅             |----------|
| definePreset       | ✅             |----------|

## Roadmap

- Develop the AI "bridge" that lets proxies introspect component semantics and drive user interactions
- As close to AAA accessibility support as possible
  - No compromises on getting to AA

## Intended Components

- List
- App Bar
- Breadcrumbs
- Drawer
- Pagination
- Stepper
- Speed Dial
- Grid

## Contributing

We welcome issues and pull requests. Please read `AGENTS.md` for coding standards and open an issue before making large changes. Use the standard GitHub workflow at [valet issues](https://github.com/off-court-creations/valet/issues).
