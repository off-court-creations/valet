# valet

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![GitHub](https://img.shields.io/badge/GitHub-valet-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet) [![npm](https://img.shields.io/badge/npm-%40archway%2Fvalet-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet) [![npm version](https://img.shields.io/npm/v/@archway/valet.svg?color=CB3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet) [![🚀](https://img.shields.io/badge/🚀-Live%20Demo!-111)](https://main.db2j7e5kim3gg.amplifyapp.com/)


`valet` is a CSS-in-JS engine, a UI component kit, and an accessibility layer that treats all humans and their AI proxies as first class users. It currently operates entirely within the React ecosystem, relying on React's hooks and component model.

---

This library is currently pre-1.0 and the API may change without notice.

When version `1.0.x` arrives you can depend on a stable interface.

---

To use `valet` in your project run:

```shell
cd your-project-using-valet
npm install @archway/valet
```

## Quick start example:

```tsx
import { Button, Surface, Stack, Panel, Typography } from '@archway/valet'

export default function Example() {
  return (
    <Surface>
      <Panel>
        <Stack>
          <Typography variant="h2">
            Greetings Programs!
          </Typography>
          <Typography>
            Aperture Clear?
          </Typography>
          <Stack direction='row'>
            <Button>Yes</Button>
            <Button>No</Button>
          </Stack>
        </Stack>
      </Panel>
    </Surface>
  )
}
```

valet hooks and components are designed for React 19.x. Ensure your project has
`react` and `react-dom` installed alongside valet.

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
npm run dev
```

## Build

Run `npm run build` to generate the `dist` folder for publishing. Use `npm run dev` during development for a live rebuild.

Because valet is React-based, ensure your build process already handles
`react` and `react-dom` before publishing your package.

## Docs

You can try every component in the [valet Docs](https://github.com/off-court-creations/valet/tree/main/docs). ([Live Demo!](https://main.db2j7e5kim3gg.amplifyapp.com/)) Try with:

```shell
cd docs
npm install
npm run dev
```

or for a live local DX:

```shell
npm link
cd docs
npm install
npm link @archway/valet
npm run dev
```

## Contributing

We welcome issues and pull requests. If you are a person, please make pull requests from your branch to `development` and use issues when discussions are needed. Please read `AGENTS.md` if you are an AI, agent, NLP, bot, or scraper. Humans may find the document insightful as well. Use the standard GitHub workflow at [valet issues](https://github.com/off-court-creations/valet/issues).

valet targets the React ecosystem. Improvements and examples should assume a
React 19.x setup.
