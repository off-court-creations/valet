<div align="center">

# @archway/valet-mcp

[![Star](https://img.shields.io/github/stars/off-court-creations/valet?style=social)](https://github.com/off-court-creations/valet/stargazers)

[![npm version (valet-mcp)](https://img.shields.io/npm/v/@archway/valet-mcp.svg?color=CB3837&label=%40archway%2Fvalet%2Dmcp&logo=npm&logoColor=white)](https://www.npmjs.com/package/@archway/valet-mcp)

[![License: MIT](https://img.shields.io/badge/License-MIT-181817.svg?logo=open-source-initiative&logoColor=white)](https://opensource.org/licenses/MIT) [![GitHub](https://img.shields.io/badge/GitHub-valet-181717?logo=github&logoColor=white)](https://github.com/off-court-creations/valet) [![Docs](https://img.shields.io/badge/Docs-Live-181817?logo=readthedocs&logoColor=white)](https://main.db2j7e5kim3gg.amplifyapp.com/)

</div>

MCP server for valet. It serves machine‑readable metadata for every valet component (props, types, CSS vars, examples, best practices) so agents and tools can search, inspect, and generate correct UI code.

- Bundled data by default. Override to use fresh local `mcp-data/`.

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

Docs: MCP & Introspection guide lives in `docs/src/pages/concepts/MCP.tsx` and the live docs site. It covers tools, examples, best practices, and advanced flows.

Requirements: Node 18+ (20+ recommended). Communicates over stdio.

Troubleshooting: regenerate data (`npm run mcp:build`) and re‑run the selfcheck.

License: MIT © Off Court Creations
