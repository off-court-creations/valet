<div align="center">

# valet

[![Star](https://img.shields.io/github/stars/off-court-creations/valet?style=social)](https://github.com/off-court-creations/valet/stargazers)

[![npm version](https://img.shields.io/npm/v/@archway/valet.svg?color=CB3837&label=%40archway%2Fvalet&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet)

[![npm version (valet-mcp)](https://img.shields.io/npm/v/@archway/valet-mcp.svg?color=CB3837&label=%40archway%2Fvalet%2Dmcp&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet-mcp)

[![npm version (create-valet-app)](https://img.shields.io/npm/v/@archway/create-valet-app.svg?color=CB3837&label=%40archway%2Fcreate%2Dvalet%2Dapp&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/create-valet-app)

[![License: MIT](https://img.shields.io/badge/License-MIT-181817.svg?logo=open-source-initiative&logoColor=white)](https://opensource.org/licenses/MIT) [![GitHub](https://img.shields.io/badge/GitHub-valet-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet) [![Docs](https://img.shields.io/badge/Docs-Live-181817?logo=readthedocs&logoColor=white)](https://main.db2j7e5kim3gg.amplifyapp.com/)

</div>

## Welcome

`@archway/valet` is a library for making beautiful websites and apps.
Valet is capable and easy for people who have never coded or made websites. 
Valet feels familiar and powerful to experienced devs.
You can tinker with every last thing, or valet can literally drive itself.

Valet includes opinions on **design** and **style**. 
If you prefer, you can easily reconfigure valet to look however you want.

Valet produces experiences that are:
 - stable
 - beautiful
 - scalable
 - dependable across devices 
 - AI-enabled, no fluff or gimmicks

## MCP

An MCP is a toolbox which AI chatbots and coding agents can use to learn things as well as act on your behalf. 

Whether this is your first frontend or your 1000th, valet has a compelling X-factor. Valet has traditional docs, which experienced developers would benefit from reading, but the `@archway/valet-mcp` is better than any docs can be. 

The MCP teaches AI valet's components and patterns from data generated out of this repo: fifteen tools covering component search, typed props and defaults, usage examples, best practices, and a glossary — plus `validate_jsx`, which type-checks a generated valet JSX snippet against the shipped `@archway/valet` types and reports structured diagnostics so an agent can catch invented props, wrong literal-union values, and deprecated aliases and self-correct before emitting code. From there, your agent can build beautiful and functional apps and experiences from your natural language requests. Deeper runtime integration — such as the planned Web Action Graph — is roadmap, not yet shipped.

## Tech Specs

Human developers and AI proxies may wish to learn what specific areas of a modern stack valet covers. Valet is:

- a TypeScript CSS‑in‑JS engine
  - you don't need `Styled` or `Emotion` when you use valet
- a fully-typed UI component library
  - If you've used `MUI` or `chakra`, you'll pick it up quick, and you won't go back
- color, motion, and spacing engines
  - powerful tokens are easy to remember
- `@archway/valet-mcp`
  - your companion that uses valet to its fullest potential
- `@archway/create-valet-app`
  - for when you need a whole app / website, not just a component library
- built for `React`
  - powerful and compatible with the modern web

## Privacy

valet sends no analytics or telemetry. The only third-party request it can originate is loading Google Fonts (`fonts.googleapis.com`), which carries the visitor's IP to Google — a GDPR concern (cf. *LG München I*, 3 O 17493/20). That request is opt-out: pass `injectRemote: false` and self-host the same families with `@fontsource` for an identical look with zero third-party requests, or go explicit-fonts-only (`useInitialTheme({})` makes zero network requests and falls back to installed system faces). See the [Fonts & Privacy docs](https://main.db2j7e5kim3gg.amplifyapp.com/fonts-privacy) for the three loading strategies and the never-block 5s timeout semantics.

## Browser support

valet targets modern evergreen browsers. The supported floor is **Chrome/Edge 112+, Safari 16.5+, and Firefox 121+**. Each floor is set by a specific platform feature the library actually emits — not a guess:

- **Chrome/Edge 112, Safari 16.5** — native CSS nesting. valet's styling engine writes nested rules and prefixes every nested selector with `& ` (so `& th { … }` rather than a bare `th { … }`). The `& `-prefixed form parses from Chrome 112 / Safari 16.5; the relaxed grammar that lets nested rules start with a bare type selector would have demanded Chrome 120 / Safari 17.2, which a source-level gate keeps the codebase clear of.
- **Firefox 121** — the [`:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) relational pseudo-class, which a few components use for sibling/state-driven styling. Firefox shipped CSS nesting in 117 but `:has()` only in 121, so 121 is the real Firefox floor. (`:has()` reached Chrome 105 / Safari 15.4, below their nesting floors, so it does not move those numbers.)
- Also relied on, all below the floors above: [`color-mix()`](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix) (Chrome 111 / Safari 16.2 / Firefox 113) and the dynamic-viewport [`dvh`](https://caniuse.com/viewport-unit-variants) unit (Chrome 108 / Safari 15.5 / Firefox 101).

The build target is pinned to **es2020** (tsup), and the package ships **ESM only** — there is no CommonJS build, so `require('@archway/valet')` will not resolve; use `import` (Vite, Next, modern Node ESM, or a bundler).

A secure context (HTTPS or `localhost`) is required for the optional AI-key encryption helpers, which depend on `crypto.subtle`; that Web Crypto API is unavailable on plain HTTP.

**SSR: not yet.** valet imports cleanly in Node and renders deterministic, hash-derived class names under `renderToString`, so it will not crash a server render. What is missing is a style-collection API: there is no `getServerStyles`-style call to gather the generated CSS and flush it into the server-rendered HTML, so first paint can flash unstyled before the client hydrates and injects styles. A proper server-side style collection API is on the roadmap, not shipped.

## Docs

Our live docs can be found [here](https://main.db2j7e5kim3gg.amplifyapp.com/).

To use the docs locally, run from the repo root:

```shell
npm run dx       # installs deps for the repo, docs, and packages
npm run dx:link  # builds valet and links it into docs (and the packages)
cd docs
npm run dev
```

The link step matters: the docs pages track the local source, which can be
ahead of the published `@archway/valet` release that `docs/package.json` pins.
A plain `npm install && npm run dev` inside `docs/` builds against the
published release and can fail.

## Getting Started

### natural language + valet

Use `create-valet-app` to make a modern web app. Use codex or Claude Code to provide natural language input. 

If you have used codex or Claude Code before, `create-valet-app` will automatically install the `valet MCP` into your tools

Get started by running this command in your terminal with the folder name you want

```shell
npx @archway/create-valet-app REPLACE-WITH-YOUR-FOLDERNAME 
```

Follow the installation flow on screen.

### Integration with existing app

```shell
npm i @archway/valet
```

To migrate a website / app from another component UI system to valet, see  [Migrate from MUI](https://main.db2j7e5kim3gg.amplifyapp.com/migrate-from-mui).

## MCP manual installation

https://www.npmjs.com/package/@archway/valet-mcp

```shell
npm i -g @archway/valet-mcp@latest
```

Codex config (`~/.codex/config.toml`)

add these lines:

```toml
[mcp_servers.valet]
command = "valet-mcp"
args = []
```

## Contributing

We welcome issues and PRs. See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for dev setup, the repo map, the branch model, and the quality gates, and [valet issues](https://github.com/off-court-creations/valet/issues) for open work. If you’re an agent/AI, read `AGENTS.md`.

Works with React `^18 || ^19` (peer dependency).

> made with love by Archway
