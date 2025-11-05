<div align="center">

# valet

[![Star](https://img.shields.io/github/stars/off-court-creations/valet?style=social)](https://github.com/off-court-creations/valet/stargazers)

[![npm version](https://img.shields.io/npm/v/@archway/valet.svg?color=CB3837&label=%40archway%2Fvalet&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet)

[![npm version (valet-mcp)](https://img.shields.io/npm/v/@archway/valet-mcp.svg?color=CB3837&label=%40archway%2Fvalet%2Dmcp&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet-mcp)

[![npm version (create-valet-app)](https://img.shields.io/npm/v/@archway/create-valet-app.svg?color=CB3837&label=%40archway%2Fcreate%2Dvalet%2Dapp&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/create-valet-app)

[![License: MIT](https://img.shields.io/badge/License-MIT-181817.svg?logo=open-source-initiative&logoColor=white)](https://opensource.org/licenses/MIT) [![GitHub](https://img.shields.io/badge/GitHub-valet-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet) [![Docs](https://img.shields.io/badge/Docs-Live-181817?logo=readthedocs&logoColor=white)](https://main.db2j7e5kim3gg.amplifyapp.com/)

</div>

## Welcome

`valet` is a TypeScript CSS‑in‑JS engine + UI kit with an AI‑forward agentic layer. Beautiful by default; precise and accessible when customized.

The ecosystem also includes the app scaffold `@archway/create-valet-app` and the MCP server `@archway/valet-mcp`.

> [!CAUTION]
> Pre‑1.0: APIs may change without notice

## Docs

- Live docs (components, concepts, guides): https://main.db2j7e5kim3gg.amplifyapp.com/
- Develop docs locally:

```shell
cd docs && npm install && npm run dev
```

### MCP (introspection)

- MCP server: https://www.npmjs.com/package/@archway/valet-mcp
- Guide: “MCP & Introspection” in the docs (tools, examples, best practices)

Quick install:

```shell
npm i -g @archway/valet-mcp
```

Codex config (see docs for details):

```toml
[mcp_servers.valet]
command = "valet-mcp"
args = []
```

## Contributing

We welcome issues and PRs. See [valet issues](https://github.com/off-court-creations/valet/issues). If you’re an agent/AI, read `AGENTS.md`.

Targets React 19.x.

## Scripts (essentials)

- `build` – build the library
- `dev` – watch mode for components
- `lint`, `lint:fix` – ESLint
- `format`, `format:fix` – Prettier
- `link:docs` – build + link `@archway/valet` into `docs`
- `mcp:build` – generate `mcp-data/`
- `mcp:server:selfcheck` – MCP selfcheck using fresh `mcp-data/`

See `package.json` for the full list.

> made with love by Archway
