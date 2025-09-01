# valet

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![GitHub](https://img.shields.io/badge/GitHub-valet-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet) [![npm](https://img.shields.io/badge/npm-%40archway%2Fvalet-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet) [![npm version](https://img.shields.io/npm/v/@archway/valet.svg?color=CB3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet) [![npm version (valet-mcp)](https://img.shields.io/npm/v/@archway/valet-mcp.svg?color=CB3837&logo=npm&logoColor=white&label=valet-mcp)](https://www.npmjs.com/package/@archway/valet-mcp) [![🚀](https://img.shields.io/badge/🚀-Live%20Demo!-111)](https://main.db2j7e5kim3gg.amplifyapp.com/)


`valet` is a Typescript CSS-in-JS engine, a UI kit, and an accessibility / agentic layer that treats all humans and their AI proxies as first class users. It currently operates entirely within the React ecosystem, working with React's hooks and component model.

---

This library is currently pre-1.0 and the API may change without notice.

When version `1.0.x` arrives you can depend on a stable interface.

---

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

### MCP

We offer an expirimental [MCP](https://www.npmjs.com/package/@archway/valet-mcp). Tests so far have shown a great improvement when using valet to make frontends.

Install with:

```shell
npm i -g @archway/valet-mcp
```

#### `@openai/codex` MCP setup

in your `config.toml` append:

```toml
[mcp_servers.valet]
command = "valet-mcp"
args = []
```

> This works in the home level config and the project level config

#### Example `AGENTS.md` inclusion for the MCP

```md
## valet-mcp

You have access to the valet-mcp MCP! 
Use this when you are making front ends or dealing with UI.
You can use it to search, find reference, and get examples.
Whenever you use or add a valet component, use the MCP to ensure that you got the prop usage correct!
```

## Contributing

We welcome issues and pull requests. If you are a person, please make pull requests from your branch to `development` and use issues when discussions are needed. Please read `AGENTS.md` if you are an AI, agent, NLP, bot, or scraper. Humans may find the document insightful as well. Use the standard GitHub workflow at [valet issues](https://github.com/off-court-creations/valet/issues).

valet targets the React ecosystem. Improvements and examples should assume a
React 19.x setup.

## NPM Scripts

| Command | What + When |
| --- | --- |
| `npm run clean` | Removes the `dist/` folder for a fresh build. Use when cached outputs might interfere or before a clean publish.
| `npm run build` | Builds the library with tsup (ESM, CJS, and TypeScript dts). Use before publishing or linking the package into another app.
| `npm run dev` | Builds in watch mode for rapid local iteration. Use while developing components and testing via linked docs.
| `npm run dx` | Installs root deps, installs docs deps, then installs MCP server deps. Use on fresh checkouts to prep the full dev environment quickly.
| `npm run lint` | Runs ESLint over `src` and `docs`. Use to check code quality in CI or before commits.
| `npm run lint:fix` | Runs ESLint with auto‑fix. Use after refactors to apply standard rules automatically.
| `npm run format` | Runs Prettier in check mode. Use in CI or to verify formatting consistency.
| `npm run format:fix` | Runs Prettier and writes changes. Use to normalize formatting across the repo.
| `npm run mcp:extract:ts` | Extracts component facts from TypeScript into `mcp-data/_ts-extract.json`. Use for debugging the TS extraction phase.
| `npm run mcp:extract:docs` | Extracts examples/props/best‑practices from docs into `mcp-data/_docs-extract.json`. Use for debugging the docs parsing phase.
| `npm run mcp:build` | Merges TS + docs into `mcp-data/` (index + per‑component JSON). Use whenever components or docs change before using MCP tools.
| `npm run mcp:watch` | Rebuilds `mcp-data/` on file changes. Use during active development for instant MCP data refresh.
| `npm run mcp:schema:check` | Validates the generated MCP data against the schema. Use to sanity‑check before publishing or integrating.
| `npm run mcp:server:install` | Installs MCP server dependencies. Use on first setup or after dependency changes.
| `npm run mcp:server:build` | Builds the MCP server (`servers/valet-mcp`). Use after server code changes or before publishing the server.
| `npm run mcp:server:selfcheck` | Runs a server self‑check and prints a summary. Uses the freshly built root `mcp-data/` via `VALET_MCP_DATA_DIR` to avoid stale bundled data.
| `npm run mcp:server:start` | Starts the MCP server locally. Use to serve `mcp-data/` to tools during development.
| `npm run mcp:server:link` | Links the MCP server globally as `valet-mcp`. Use if your environment discovers global bins.
| `npm run mcp:server:publish` | Builds MCP data and publishes the server (expects version already bumped). Use for releases where you’ve handled versioning manually.
| `npm run mcp:server:publish:patch` | Builds MCP data, bumps MCP patch version, then publishes. Use for data‑only refreshes within the same valet minor version.

Note: To publish a data‑only MCP version, run:

```shell
npm run mcp:build

# Check version during publish

# cd servers/valet-mcp
# npm run bundle:data
# npm run selfcheck
# cd ../..

npm run mcp:server:publish:patch
```
