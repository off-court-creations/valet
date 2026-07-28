<div align="center">

# @archway/valet-mcp

[![Star](https://img.shields.io/github/stars/off-court-creations/valet?style=social)](https://github.com/off-court-creations/valet/stargazers)

[![npm version (valet-mcp)](https://img.shields.io/npm/v/@archway/valet-mcp.svg?color=CB3837&label=%40archway%2Fvalet%2Dmcp&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet-mcp)

[![License: MIT](https://img.shields.io/badge/License-MIT-181817.svg?logo=open-source-initiative&logoColor=white)](https://opensource.org/licenses/MIT) [![GitHub](https://img.shields.io/badge/GitHub-valet-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet) [![Docs](https://img.shields.io/badge/Docs-Live-181817?logo=readthedocs&logoColor=white)](https://main.db2j7e5kim3gg.amplifyapp.com/)

</div>

MCP server for valet. It serves machine‑readable metadata for every valet component (props, types, CSS vars, examples, best practices) so agents and tools can search, inspect, and generate correct UI code. It also exposes a packaged directional-navigation workflow.

- Bundled data by default. Override to use fresh local `mcp-data/`.
- 15 introspection tools plus the `valet__build_directional_navigation` MCP prompt.

---

## Quick Start

```bash
npm i -g @archway/valet-mcp
MCP_SELFCHECK=1 valet-mcp
```

Use with Codex (`config.toml`):

```toml
[mcp_servers.valet]
command = "valet-mcp"
args = []
```

Data source (dev): set `VALET_MCP_DATA_DIR` to an absolute path to your `mcp-data/`; otherwise the server uses the bundled snapshot. See the docs for details.

### Directional-navigation workflow

MCP clients that support prompts can invoke `valet__build_directional_navigation`. The same canonical guidance is readable at `mcp://valet/skill/valet-directional-navigation`, and ships in the package at `skills/valet-directional-navigation/SKILL.md`.

Registering the MCP server does not by itself install that file into a host's skill search path. The prompt and resource are the portable MCP surfaces; copy or install the packaged skill explicitly when a host supports filesystem skills.

Docs: MCP & Introspection guide lives in `docs/src/pages/getting-started/MCP.tsx` and the live docs site. It covers tools, the workflow prompt, examples, best practices, and advanced flows.

Requirements: Node 18+ (20+ recommended). Communicates over stdio.

Troubleshooting: re‑run the selfcheck with `MCP_SELFCHECK=1 valet-mcp` — the component data ships bundled with the package, so there is no regeneration step. Note: the `validate_jsx` tool additionally needs `@archway/valet` installed alongside the server (it type‑checks snippets against valet's shipped types); every other tool works from the bundled snapshot.

License: MIT © Off Court Creations
