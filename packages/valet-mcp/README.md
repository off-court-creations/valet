# @archway/valet-mcp

MCP server for valet. It serves machine‑readable metadata for every valet component (props, types, CSS vars, examples, best practices) so agents and tools can search, inspect, and generate correct UI code.

- Bundled data by default. Override to use fresh local `mcp-data/`.

---

## Quick Start

Global install (recommended):

```bash
npm i -g @archway/valet-mcp
valet-mcp
```

Per‑project:

```bash
npm i -D @archway/valet-mcp
npx valet-mcp
```

Self‑check:

```bash
MCP_SELFCHECK=1 valet-mcp
# → { ok, components, hasBox, mcpVersion, valetVersion, versionParity }
```

Communicates over stdio; most MCP‑aware editors auto‑register it.

---

## Codex Setup

Add to your Codex `config.toml`:

```toml
[mcp_servers.valet]
command = "valet-mcp"
args = []
```

Notes:
- Works in user‑level or project‑level config.
- See the valet docs MCP guide for details: `docs/src/pages/concepts/MCP.tsx`.

---

## Tools

- valet__list_components: `{ name, category, summary, slug }[]`
- valet__list_categories: `string[]`
- valet__search_components: fuzzy search by `query`, with optional `category`, `status`, and `limit`
  - `category`: one of `primitives|fields|layout|widgets`
  - `status`: `'golden'|'stable'|'experimental'|'unstable'|'deprecated'` (string or string[])
- valet__search_props: search by prop names (optionally filter by `category`)
- valet__search_css_vars: search by CSS variable names (optionally filter by `category`)
- valet__get_component: full doc (props, cssVars, examples, sourceFiles, version)
- valet__get_examples: example snippets for a component
- valet__get_glossary: full glossary dataset `{ entries: GlossaryEntry[] }`
- valet__define_term: lookup term/alias with soft-fail suggestions `{ found, entry? , suggestions? }`
- valet__get_primer: opinionated context dump (Markdown) to guide agents
- valet__get_info: concise server/data metadata `{ ok, mcpVersion, valetVersion, schemaVersion, buildHash, dataSource, dataDir, components, glossaryEntries, hasPrimer, versionParity }`

Notes:
- Tool IDs are strictly namespaced with `valet__` (double underscore) to avoid collisions and to comply with provider naming rules (`^[a-zA-Z0-9_-]+$`). No unprefixed aliases are registered.
 

---

## Data Sources (resolution order)

1) `VALET_ROOT` + `VALET_MCP_DATA_DIR` (both set)
2) `VALET_MCP_DATA_DIR` (abs or cwd‑relative)
3) Nearest `mcp-data/` from cwd
4) Bundled `mcp-data/` in this package
5) Optional `@archway/valet-mcp-data` package

Examples:

```bash
valet-mcp                                          # bundled
VALET_MCP_DATA_DIR=/path/to/valet/mcp-data valet-mcp
VALET_ROOT=/path/to/valet VALET_MCP_DATA_DIR=mcp-data valet-mcp
```

---

## Using It

- In apps: run `valet-mcp` and have your agent list/search/inspect components, props, and examples; bind theme values via `cssVars`.
- For valet dev: regenerate data and self‑check.

```bash
# in valet repo root
npm run mcp:build            # writes JSON into mcp-data/
npm run mcp:server:selfcheck # { ok, components, hasBox }
VALET_MCP_DATA_DIR=./mcp-data npm run mcp:server:start
```

Publishing (maintainers):

```bash
npm run mcp:server:publish   # builds data, bundles, publishes
```

---

## Env & Runtime

- `VALET_MCP_DATA_DIR`: path to `mcp-data/`
- `VALET_ROOT`: pairs with `VALET_MCP_DATA_DIR`
- `MCP_SELFCHECK=1`: print selfcheck JSON then exit
- Node 18+ (20+ recommended)
- Security: reads JSON and serves over stdio.

---

## Troubleshooting

- `components: 0`: run `npm run mcp:build` in valet; ensure `mcp-data/index.json` exists.
- Not found: verify component `name`/`slug` matches `mcp-data/index.json`.
- Version drift: check `mcpVersion`, `valetVersion`, `versionParity`; upgrade or point via `VALET_MCP_DATA_DIR`.

---

## Versioning

- MCP minor matches valet minor: `0.N.x` ⇄ `0.N.x`
- Patch bumps are server‑only; data stays within the minor unless regenerated

---

## License

MIT © Off Court Creations
