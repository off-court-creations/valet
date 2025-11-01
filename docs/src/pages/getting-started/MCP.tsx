// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// src/pages/getting-started/MCP.tsx  | valet-docs
// MCP & introspection guide
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel, CodeBlock } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'mcp',
  title: 'MCP & Introspection',
  description:
    'Install, understand, and use the valet MCP for deep introspection: discover components, inspect typed props, search best practices, and keep data in sync for agent-assisted UI.',
  pageType: 'guide',
  prerequisites: ['overview', 'quickstart'],
  tldr: 'Install @archway/valet-mcp. In your MCP host, use list/search tools to discover, get_component to verify props, get_examples to copy usage, search_best_practices to follow guidance, and get_primer to align context. Keep mcp-data fresh.',
};

export default function MCPGuidePage() {
  return (
    <Surface>
      <NavDrawer />
      <Stack
        gap={2}
        sx={{ padding: '1rem', maxWidth: 1100 }}
      >
        <Typography
          variant='h2'
          bold
        >
          MCP & Introspection for valet
        </Typography>
        <Typography>
          valet’s MCP is a small, stdio‑based server that exposes machine‑readable metadata for
          every component: typed props, DOM passthrough, CSS variables, examples, events, and
          best‑practice guidance. Agents and editors use it to search, inspect, and generate UI that
          stays aligned with valet’s design language and accessibility rules.
        </Typography>

        <Panel
          fullWidth
          variant='alt'
          pad={2}
        >
          <Typography>
            • Bundled by default: the server ships with a snapshot in <code>mcp-data/</code>.
            <br />• Override during development: point the server at your local
            <code> mcp-data/</code> to reflect changes immediately.
          </Typography>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          Quick start
        </Typography>
        <Typography>Install globally and run a self‑check:</Typography>
        <CodeBlock
          code={`npm i -g @archway/valet-mcp
MCP_SELFCHECK=1 valet-mcp
# → {
#   ok: true,
#   components: <count>,
#   hasBox: true,
#   mcpVersion: "0.31.x",
#   dataSource: "bundled|env-dir",
#   valetVersion: "0.31.x",
#   generatedAt: "<iso-date>",
#   schemaVersion: "<schema>",
#   buildHash: "<sha>",
#   glossaryEntries: <n>,
#   hasPrimer: true,
#   versionParity: true
# }`}
          ariaLabel='Copy MCP install and self-check commands'
        />

        <Typography
          variant='h3'
          bold
        >
          Keep MCP data fresh (valet dev)
        </Typography>
        <Typography>
          Regenerate the JSON corpus whenever you change components or docs, then self‑check the
          server against your local snapshot:
        </Typography>
        <CodeBlock
          code={`# From valet repo root
npm run mcp:build            # writes JSON into mcp-data/
VALET_MCP_DATA_DIR="$(pwd)/mcp-data" npm run mcp:server:selfcheck
VALET_MCP_DATA_DIR="$(pwd)/mcp-data" npm run mcp:server:start`}
          ariaLabel='Copy MCP data build + selfcheck commands'
        />

        <Typography
          variant='h3'
          bold
        >
          Use with @openai/codex (agents)
        </Typography>
        <Typography>Append to your Codex MCP config:</Typography>
        <CodeBlock
          code={`# config.toml
[mcp_servers.valet]
command = "valet-mcp"
args = []`}
          ariaLabel='Copy Codex MCP server config'
        />
        <Typography>
          With the server registered, your agent can discover components, verify props, fetch
          examples, search props or CSS variables, and consult docs metadata and the glossary. Start
          each session with <code>valet__get_primer</code> so the agent aligns to valet’s mental
          model and semantics.
        </Typography>

        <Typography
          variant='h3'
          bold
        >
          Tools overview
        </Typography>
        <Panel fullWidth>
          <Stack gap={1}>
            <Typography>
              <b>Discover</b>
            </Typography>
            <Typography>
              <b>valet__list_components</b> →{' '}
              <code>[{`{ name, category, status, summary, slug }`}]</code>
            </Typography>
            <CodeBlock
              code={`[
  { "name": "Table", "category": "widgets", "status": "stable", "summary": "Table component", "slug": "components/widgets/table" }
]`}
              ariaLabel='Copy list_components example'
              language='json'
            />
            <Typography>
              <b>valet__search_components</b> <code>{`{ query, category?, status?, limit? }`}</code>{' '}
              → ranked list with filters
            </Typography>
            <CodeBlock
              code={`[
  { "name": "Tooltip", "category": "widgets", "summary": "Tooltip component", "slug": "components/widgets/tooltip", "score": 3 }
]`}
              ariaLabel='Copy search_components example'
              language='json'
            />
            <Typography>
              <b>valet__list_categories</b> →{' '}
              <code>
                [&quot;primitives&quot;,&quot;fields&quot;,&quot;layout&quot;,&quot;widgets&quot;]
              </code>
            </Typography>
            <CodeBlock
              code={`["primitives", "fields", "layout", "widgets"]`}
              ariaLabel='Copy list_categories example'
              language='json'
            />

            <Typography>
              <b>Inspect</b>
            </Typography>
            <Typography>
              <b>valet__get_component</b> <code>{`{ name? | slug? }`}</code> → full document (props,
              cssVars, examples, events, bestPractices, sourceFiles, version)
            </Typography>
            <CodeBlock
              code={`{
  "name": "Table",
  "slug": "components/widgets/table",
  "props": [
    { "name": "data", "type": "T[]", "required": true },
    { "name": "columns", "type": "TableColumn<T>[]", "required": true },
    { "name": "selectable", "type": "'single' | 'multi' | undefined", "required": true }
  ],
  "cssVars": ["--valet-divider-stroke", "--valet-table-underline"],
  "events": [{ "name": "rowClick", "payloadType": "{ row: T }" }],
  "sourceFiles": ["src/components/widgets/Table.tsx"],
  "version": "<valet-version>"
}`}
              ariaLabel='Copy get_component example'
              language='json'
            />
            <Typography>
              <b>valet__get_examples</b> <code>{`{ name? | slug? }`}</code> → code samples
            </Typography>
            <CodeBlock
              code={`[
  { "id": "basic", "title": "Basic Table", "lang": "tsx", "code": "<Table ... />" }
]`}
              ariaLabel='Copy get_examples example'
              language='json'
            />

            <Typography>
              <b>Search by shape</b>
            </Typography>
            <Typography>
              <b>valet__search_props</b> <code>{`{ query, category?, limit? }`}</code> → find
              components by prop name
            </Typography>
            <CodeBlock
              code={`[
  { "name": "Modal", "slug": "components/layout/modal", "prop": "open" },
  { "name": "Tooltip", "slug": "components/widgets/tooltip", "prop": "placement" }
]`}
              ariaLabel='Copy search_props example'
              language='json'
            />
            <Typography>
              <b>valet__search_css_vars</b> <code>{`{ query, category?, limit? }`}</code> → find
              components by CSS variable
            </Typography>
            <CodeBlock
              code={`[
  { "name": "Surface", "slug": "components/layout/surface", "cssVar": "--valet-screen-width" },
  { "name": "Table", "slug": "components/widgets/table", "cssVar": "--valet-divider-stroke" }
]`}
              ariaLabel='Copy search_css_vars example'
              language='json'
            />

            <Typography>
              <b>Explain & advise</b>
            </Typography>
            <Typography>
              <b>valet__search_best_practices</b>{' '}
              <code>{`{ query, category?, status?, limit? }`}</code> → curated guidance
            </Typography>
            <CodeBlock
              code={`[
  {
    "name": "Modal",
    "slug": "components/widgets/modal",
    "category": "widgets",
    "status": "stable",
    "bestPractice": "Focus the first actionable element when the modal opens.",
    "matchScore": 12,
    "matchType": "text|token",
    "index": 0
  }
]`}
              ariaLabel='Copy search_best_practices example'
              language='json'
            />
          </Stack>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          More MCP tools
        </Typography>
        <Panel fullWidth>
          <Stack gap={1}>
            <Typography>
              <b>valet__get_glossary</b> → full glossary dataset
            </Typography>
            <CodeBlock
              code={`{\n  "entries": [\n    { "term": "Surface", "definition": "Route-level container owning screen state.", "aliases": ["root surface"] }\n  ]\n}`}
              ariaLabel='Copy get_glossary example'
              language='json'
            />
            <Typography>
              <b>valet__define_term</b> <code>{`{ word, limit? }`}</code> → exact match or
              suggestions
            </Typography>
            <CodeBlock
              code={`{\n  "found": false,\n  "suggestions": [\n    { "term": "Surface", "definition": "Route-level container owning screen state." }\n  ]\n}`}
              ariaLabel='Copy define_term example'
              language='json'
            />
            <Typography>
              <b>valet__get_primer</b> → opinionated Markdown primer for agents
            </Typography>
            <CodeBlock
              code={`"# valet Primer – Read Me First\n..."`}
              ariaLabel='Copy get_primer example'
            />
            <Typography>
              <b>valet__get_info</b> → concise server + data metadata
            </Typography>
            <CodeBlock
              code={`{\n  "ok": true,\n  "server": "@archway/valet-mcp",\n  "mcpVersion": "0.31.0",\n  "valetVersion": "0.31.0",\n  "schemaVersion": "1.6",\n  "buildHash": "<sha1>",\n  "dataSource": "env-dir",\n  "dataDir": "/abs/path/to/mcp-data",\n  "components": 28,\n  "glossaryEntries": 12,\n  "hasPrimer": true,\n  "versionParity": true\n}`}
              language='json'
              ariaLabel='Copy valet__get_info example'
            />
            <Typography>
              <b>valet__list_synonyms</b> → expose alias → component mappings powering slug
              resolution
            </Typography>
            <CodeBlock
              code={`{\n  "source": "merged",\n  "pairs": [\n    { "alias": "dropdown", "targets": ["Select"] },\n    { "alias": "toast", "targets": ["Snackbar"] }\n  ]\n}`}
              language='json'
              ariaLabel='Copy valet__list_synonyms example'
            />
            <Typography>
              <b>valet__check_version_parity</b> → ensure MCP minor matches valet and data
            </Typography>
            <CodeBlock
              code={`{\n  "ok": true,\n  "status": "ok",\n  "mcpVersion": "0.31.2",\n  "valetVersion": "0.31.4",\n  "mcpMinor": "0.31",\n  "valetMinor": "0.31",\n  "valetSource": "module",\n  "dataSource": "env-dir",\n  "dataDir": "/abs/path/to/mcp-data",\n  "message": "All minors aligned at 0.31."\n}`}
              language='json'
              ariaLabel='Copy valet__check_version_parity example'
            />
          </Stack>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          Environment & data sources
        </Typography>
        <Typography>
          The server reads JSON snapshots from <code>mcp-data/</code> bundled with
          <code> @archway/valet-mcp</code>. During development, override the data directory via a
          single environment variable:
        </Typography>
        <Panel fullWidth>
          <Stack gap={1}>
            <Typography>
              <b>Resolution</b>: <code>VALET_MCP_DATA_DIR</code> (absolute path) → bundled snapshot
              (or optional <code>@archway/valet-mcp-data</code> package)
            </Typography>
            <CodeBlock
              code={`# Use bundled data (default)
valet-mcp

# Use a local checkout’s fresh data
VALET_MCP_DATA_DIR=/absolute/path/to/valet/mcp-data valet-mcp`}
              ariaLabel='Copy data source examples'
            />
          </Stack>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          Create Valet App (CVA) integration
        </Typography>
        <Panel fullWidth>
          <Typography>
            New apps scaffolded with <code>@archway/create-valet-app</code> include MCP guidance by
            default (unless <code>--no-mcp</code>). The CLI attempts to install
            <code> @archway/valet-mcp</code> globally and helps ensure your MCP host is configured.
            You can always point the server at your local data via
            <code> VALET_MCP_DATA_DIR</code>.
          </Typography>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          Best practices (using MCP effectively)
        </Typography>
        <Panel fullWidth>
          <Typography>
            • Start sessions with <code>valet__get_primer</code> so agents adopt valet’s semantics.
            <br />• Search with intent: &ldquo;table zebra multi‑select&rdquo; beats
            &ldquo;table&rdquo;.
            <br />• Confirm prop shapes with <code>valet__get_component</code> before wiring
            generics.
            <br />• Prefer semantic props and theme tokens; bind colours via <code>cssVars</code>,
            not literals.
            <br />• Wrap each route in one <code>Surface</code>; do not nest surfaces.
            <br />• Keep tables height‑constrained (default); only opt out when the page controls
            scrolling.
            <br />• When versions drift, run <code>valet__check_version_parity</code> and rebuild
            data.
          </Typography>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          Requirements & security
        </Typography>
        <Panel fullWidth>
          <Typography>
            • Node 18+ required (20+ recommended).
            <br />• The server reads JSON from disk and communicates over stdio. It does not perform
            arbitrary file or network access.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}
