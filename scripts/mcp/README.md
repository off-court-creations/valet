MCP data pipeline (initial pass)

This folder contains scripts to extract component facts from the library source (TS) and the docs pages (TSX) and merge them into a machine-readable corpus under `mcp-data/`.

Commands:

- node scripts/mcp/merge.mjs

Outputs:

- mcp-data/index.json
- mcp-data/components/*.json
- mcp-data/_meta.json

Scope:

- First pass focuses on `Box` and is generic enough for other components.

