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

The MCP teaches AI everything there is to know about valet, quickly and efficiently, and then it gives it the tools to make beautiful and functional apps and experiences from your natural language requests.

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

## Docs

Our live docs can be found [here](https://main.db2j7e5kim3gg.amplifyapp.com/).

To use the docs locally:

```shell
cd docs
npm install
npm run dev
```

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

We welcome issues and PRs. See [valet issues](https://github.com/off-court-creations/valet/issues). If you’re an agent/AI, read `AGENTS.md`.

Targets React 19.x.

> made with love by Archway
