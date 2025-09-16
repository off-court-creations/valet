<div align="center">

# valet

[![License: MIT](https://img.shields.io/badge/License-MIT-181817.svg?logo=open-source-initiative&logoColor=white)](https://opensource.org/licenses/MIT) [![GitHub](https://img.shields.io/badge/GitHub-valet-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet) [![Star](https://img.shields.io/github/stars/off-court-creations/valet?style=social)](https://github.com/off-court-creations/valet/stargazers) [![Docs](https://img.shields.io/badge/Docs-Live-181817?logo=readthedocs&logoColor=white)](https://main.db2j7e5kim3gg.amplifyapp.com/)

[![npm version](https://img.shields.io/npm/v/@archway/valet.svg?color=CB3837&label=%40archway%2Fvalet&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet)

[![npm version (valet-mcp)](https://img.shields.io/npm/v/@archway/valet-mcp.svg?color=CB3837&label=%40archway%2Fvalet%2Dmcp&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet-mcp)

[![npm version (create-valet-app)](https://img.shields.io/npm/v/@archway/create-valet-app.svg?color=CB3837&label=%40archway%2Fcreate%2Dvalet%2Dapp&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/create-valet-app)

</div>

## Welcome

`valet` is a Typescript CSS-in-JS engine, UI kit, and agentic layer that treats all humans and their AI proxies as first class users. Beautiful by default. Limitless when customized.

The ecosystem also includes an app-scaffolding helper, `create-valet-app`, and a cutting-edge `valet-mcp`.

> [!CAUTION]
> Pre‑1.0: APIs may change without notice.

## Docs

You can try every component in the ([Live Demo!](https://main.db2j7e5kim3gg.amplifyapp.com/)) 

Try locally with:

```shell
cd docs
npm install
npm run dev
```

### MCP

We offer an [MCP](https://www.npmjs.com/package/@archway/valet-mcp). Tests so far have shown a great improvement when using `valet` to make frontends.

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

#### Example `AGENTS.md` inclusion for the MCP

```md
## valet-mcp

When available, use the `@archway/valet-mcp` server. IMPORTANT!
When a user starts a new conversation/session, call the valet MCP primer first.
Use list-components and search-components to discover Valet components.
Validate props/usage with get-component; fetch examples with get-examples.
Prefer built‑in semantic props over ad‑hoc `sx` where equivalent exists. IMPORTANT!
```

## Contributing

We welcome issues and pull requests. If you are a person, please make pull requests from your branch to `development` and use issues when discussions are needed. Please read `AGENTS.md` if you are an AI, agent, NLP, bot, or scraper. Humans may find the document insightful as well. Use the standard GitHub workflow at [valet issues](https://github.com/off-court-creations/valet/issues).

`valet` targets the React ecosystem. Improvements and examples should assume a
React 19.x setup.

## NPM Scripts

| Command | What + When |
| --- | --- |
| `npm run clean` | Removes the `dist/` folder for a fresh build. Use when cached outputs might interfere or before a clean publish.
| `npm run build` | Builds the library with tsup (ESM, CJS, and TypeScript dts). Use before publishing or linking the package into another app.
| `npm run dev` | Builds in watch mode for rapid local iteration. Use while developing components and testing via linked docs.
| `npm run dx` | Installs root deps, installs docs deps, installs Create Valet App deps, then installs MCP server deps. Use on fresh checkouts to prep the full dev environment quickly.
| `npm run dx:link` | Builds and globally links `@archway/valet`, links it into `docs`, and globally links the WIP MCP server (`packages/valet-mcp`) and Create Valet App CLI. Use to enable full local linked DX in one step.
| `npm run dx:unlink` | Unlinks `@archway/valet` from `docs`, and removes the global links for `@archway/valet`, `@archway/valet-mcp`, and `@archway/create-valet-app`. Use to clean up your environment.
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
| `npm run mcp:server:build` | Builds the MCP server (`packages/valet-mcp`). Use after server code changes or before publishing the server.
| `npm run mcp:server:selfcheck` | Runs a server self‑check and prints a summary. Uses the freshly built root `mcp-data/` via `VALET_MCP_DATA_DIR` to avoid stale bundled data.
| `npm run mcp:server:start` | Starts the MCP server locally. Use to serve `mcp-data/` to tools during development.
| `npm run mcp:server:link` | Links the MCP server globally as `valet-mcp`. Use if your environment discovers global bins.
| `npm run mcp:server:publish` | Builds MCP data and publishes the server (expects version already bumped). Use for releases where you’ve handled versioning manually.
| `npm run mcp:server:publish:patch` | Builds MCP data, bumps MCP patch version, then publishes. Use for data‑only refreshes within the same valet minor version.
| `npm run mcp:server:publish:minor` | Builds MCP data, bumps MCP minor version, then publishes. Use for minor feature releases.
| `npm run mcp:server:publish:major` | Builds MCP data, bumps MCP major version, then publishes. Use for breaking changes.
| `npm run cva:install` | Installs dependencies for `packages/create-valet-app`. Use when working on the CLI locally.
| `npm run cva:validate` | Runs validation checks for Create Valet App. Use before publishing changes to the CLI.
| `npm run cva:dev` | Opens the Create Valet App CLI help (dev entry). Use to inspect flags quickly during development.
| `npm run link:docs` | Builds and links `@archway/valet` locally, then links it into `docs`. Use for rapid docs iteration with local components.

> made with love by Archway
