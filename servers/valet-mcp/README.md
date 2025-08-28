# @archway/valet-mcp

Model Context Protocol (MCP) server for the valet UI system. It exposes structured, machine‑readable metadata about every valet component — props, types, CSS variables, examples, and best practices — so agents and tooling can search, inspect, and generate UI code that matches valet’s patterns and accessibility rules.

valet itself is a TypeScript‑first, AI‑forward React UI library with strict accessibility and a compact runtime. This MCP is a helper for valet: you can use it alongside any frontend (including, but not limited to, the valet docs site) to introspect the library and build better developer tooling.

• Zero‑setup default: ships with a bundled `mcp-data/` snapshot.
• Power‑user override: point at your own freshly generated `mcp-data/`.

---

## Quick Start

Install globally (recommended for shared dev machines):

```bash
npm i -g @archway/valet-mcp
valet-mcp            # starts the MCP server over stdio
```

Or install locally to a project:

```bash
npm i -D @archway/valet-mcp
npx valet-mcp
```

Health check:

```bash
MCP_SELFCHECK=1 valet-mcp
# → {
#     ok: true,
#     components: <count>,
#     hasBox: true,
#     mcpVersion: "0.30.0",
#     dataSource: "bundled|nearest-cwd|env-dir|env-root+dir|package|fallback-cwd",
#     valetVersion: "0.30.1",
#     generatedAt: "2025-08-28T07:13:33.176Z",
#     versionParity: true
#   }
```

The server communicates over stdio using the MCP protocol. Most editors/agents detect the `valet-mcp` binary and register the tools automatically.

---

## What You Get

Tools exposed to MCP clients:

- list_components → lists `{ name, category, summary, slug }`
- search_components `{ query, limit? }` → fuzzy search over names/summaries
- get_component `{ name? | slug? }` → full component doc (props, cssVars, examples, sourceFiles, version)
- get_examples `{ name? | slug? }` → example code snippets

Data source: JSON files in `mcp-data/` generated from valet’s TypeScript and docs.

---

## Data Resolution Order (override friendly)

When starting, the server looks for `mcp-data/` in this order:

1) `VALET_ROOT` + `VALET_MCP_DATA_DIR` (both set)
2) `VALET_MCP_DATA_DIR` (absolute or relative to cwd)
3) The nearest `mcp-data/` walking up from the current directory
4) Bundled `mcp-data/` shipped inside `@archway/valet-mcp`
5) Optional `@archway/valet-mcp-data` package if installed

Examples:

```bash
# Use bundled data (default)
valet-mcp

# Use a local checkout’s fresh data
VALET_MCP_DATA_DIR=/path/to/valet/mcp-data valet-mcp

# Use both root + relative dir
VALET_ROOT=/path/to/valet VALET_MCP_DATA_DIR=mcp-data valet-mcp
```

---

## Use In Your App (consuming valet)

Goal: keep your frontend typed, accessible, and theme‑correct while moving fast.

1) Install and run the server:

```bash
npm i -D @archway/valet-mcp
npx valet-mcp &   # background or via your MCP‑capable agent
```

2) Ask your agent/tools to:

- Discover components: “List valet primitives” or “Search valet for zebra table with selection”.
- Inspect props: “Show props for Table” → get exact generics and required flags.
- Pull examples: “Give examples for Tooltip and Tabs with keyboard support”.
- Surface CSS variables: bind theme values via `cssVars` instead of hard‑coding.

3) Wire with types in code (example):

```ts
type User = { id: string; name: string; email: string };

const columns: TableColumn<User>[] = [
  { header: 'Name',   render: (u) => u.name,   width: 240 },
  { header: 'Email',  render: (u) => u.email,  width: 320 },
];

<Table
  data={users}
  columns={columns}
  striped
  hoverable
  selectable="multi"
  onSelectionChange={(rows) => setSelected(rows)}
  sx={{
    '--valet-table-underline': 'var(--valet-divider-stroke)',
  }}
/>
```

4) Respect valet best practices while you iterate:

- Wrap routes in `<Surface />` and avoid nested surfaces.
- Keep table `constrainHeight` enabled so scrolling happens inside the component.
- Use `preset`/`sx` instead of ad‑hoc styling for theme cohesion.

---

## Use For Valet Development (editing the library)

Generate fresh data whenever you change components or docs:

```bash
# in the valet repo root
npm run mcp:build            # writes JSON into mcp-data/
npm run mcp:server:selfcheck # { ok, components, hasBox }
```

Develop the MCP locally against fresh data:

```bash
VALET_MCP_DATA_DIR=./mcp-data npm run mcp:server:start
```

Publishing (maintainers):

```bash
# from the valet repo root
npm run mcp:server:publish
# runs: mcp:build → bundles data into servers/valet-mcp → npm publish
```

---

## API Reference

All methods follow MCP’s tool protocol and respond with JSON text payloads.

• list_components → `[{ name, category, summary, slug }]`

```jsonc
[
  { "name": "Table", "category": "widgets", "summary": "Table component", "slug": "components/widgets/table" }
]
```

• search_components `{ query, limit? }` → ranked list

```jsonc
[
  { "name": "Tooltip", "category": "widgets", "summary": "Tooltip component", "slug": "components/widgets/tooltip", "score": 3 }
]
```

• get_component `{ name? | slug? }` → full component document

```jsonc
{
  "name": "Table",
  "slug": "components/widgets/table",
  "props": [
    { "name": "data", "type": "T[]", "required": true },
    { "name": "columns", "type": "TableColumn<T>[]", "required": true },
    { "name": "selectable", "type": "'single' | 'multi' | undefined", "required": true }
  ],
  "cssVars": ["--valet-divider-stroke", "--valet-table-underline"],
  "sourceFiles": ["src/components/widgets/Table.tsx"],
  "version": "<valet-version>"
}
```

• get_examples `{ name? | slug? }` → example code blocks

```jsonc
[
  { "id": "basic", "title": "Basic Table", "lang": "tsx", "code": "<Table ... />" }
]
```

---

## CLI and Environment

- `VALET_MCP_DATA_DIR` – absolute or relative path to `mcp-data/`.
- `VALET_ROOT` – pairs with `VALET_MCP_DATA_DIR` when both are set.
- `MCP_SELFCHECK=1` – prints `{ ok, components, hasBox }` and exits.

Node 18+ required; Node 20+ recommended.

Security note: the server reads JSON from disk and serves it over MCP stdio; it does not make network calls or mutate your files.

---

## Troubleshooting

- `components: 0` in selfcheck: run `npm run mcp:build` in the valet repo and ensure `mcp-data/index.json` exists. If using bundled data, upgrade `@archway/valet-mcp`.
- “Component not found”: verify `name`/`slug` case and existence in `mcp-data/index.json`.
- Path issues: prefer absolute `VALET_MCP_DATA_DIR` to avoid cwd surprises.
- Version drift: check `mcpVersion`, `valetVersion`, and `versionParity` in selfcheck. If parity is false, either upgrade MCP to the matching minor or point to the correct data via `VALET_MCP_DATA_DIR`.

---

## Versioning & Releases

- Minor parity with valet: MCP `0.N.x` aligns with valet `0.N.x`.
- MCP patch bumps (`0.N.y`) are for server-only improvements; data remains from the same valet minor unless regenerated.
- When valet moves from `0.N.x` to `0.(N+1).x`, bump MCP to `0.(N+1).0` and publish with a fresh data snapshot.
- For experimental or ahead-of-release data, point the server to a locally generated `mcp-data/` via env vars.

---

## License

MIT © Off Court Creations
