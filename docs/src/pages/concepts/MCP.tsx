// ─────────────────────────────────────────────────────────────
// src/pages/concepts/MCP.tsx  | valet-docs
// Comprehensive guide for installing and using the valet MCP.
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Panel, CodeBlock } from '@archway/valet';
import NavDrawer from '../../components/NavDrawer';
import type { DocMeta } from '../../types';

export const meta: DocMeta = {
  id: 'mcp',
  title: 'MCP & Introspection',
  description:
    'Install and use the valet Model Context Protocol (MCP) server to introspect components, props, CSS variables, and examples for AI-assisted development.',
  pageType: 'guide',
  prerequisites: ['overview', 'quickstart'],
  tldr: 'Install @archway/valet-mcp, add it to your MCP host (e.g., @openai/codex), then list/search/inspect components and fetch examples from mcp-data.',
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
          The valet MCP is a lightweight server that exposes machine‑readable metadata for every
          component: props and types, supported DOM passthrough, CSS variables, examples, and best
          practices. Agents and editors use this to search, inspect, and generate UI that matches
          valet’s accessibility and design rules.
        </Typography>

        <Panel
          fullWidth
          variant='alt'
          pad={2}
        >
          <Typography>
            • Zero‑setup default: ships with a bundled <code>mcp-data/</code> snapshot.
            <br />• Power‑user override: point at your freshly generated <code>mcp-data/</code> when
            developing valet.
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
#   mcpVersion: "0.30.x",
#   dataSource: "bundled|nearest-cwd|env-dir|env-root+dir|package|fallback-cwd",
#   valetVersion: "0.30.x",
#   generatedAt: "<iso-date>",
#   versionParity: true
# }`}
          ariaLabel='Copy MCP install and self-check commands'
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
          Once registered, your agent gains tools like <code>valet__list_components</code>,
          <code> valet__search_components</code>, <code>valet__get_component</code>, and
          <code> valet__get_examples</code>. Ask it to list primitives, inspect props for
          <code> Table</code>, or fetch examples for <code>Tooltip</code>. New: use{' '}
          <code>valet__get_glossary</code> to fetch all terms or
          <code> valet__define_term</code> to look up a definition. Start every session with
          <code> valet__get_primer</code> to align on valet’s expectations.
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
              <b>list_components</b> → <code>[{`{ name, category, summary, slug }`}]</code>
            </Typography>
            <CodeBlock
              code={`[
  { "name": "Table", "category": "widgets", "summary": "Table component", "slug": "components/widgets/table" }
]`}
              ariaLabel='Copy list_components example'
              language='json'
            />
            <Typography>
              <b>search_components</b> <code>{`{ query, limit? }`}</code> → ranked list
            </Typography>
            <CodeBlock
              code={`[
  { "name": "Tooltip", "category": "widgets", "summary": "Tooltip component", "slug": "components/widgets/tooltip", "score": 3 }
]`}
              ariaLabel='Copy search_components example'
              language='json'
            />
            <Typography>
              <b>get_component</b> <code>{`{ name? | slug? }`}</code> → full document (props,
              cssVars, examples, sourceFiles, version)
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
  "sourceFiles": ["src/components/widgets/Table.tsx"],
  "version": "<valet-version>"
}`}
              ariaLabel='Copy get_component example'
              language='json'
            />
            <Typography>
              <b>get_examples</b> <code>{`{ name? | slug? }`}</code> → code samples
            </Typography>
            <CodeBlock
              code={`[
  { "id": "basic", "title": "Basic Table", "lang": "tsx", "code": "<Table ... />" }
]`}
              ariaLabel='Copy get_examples example'
              language='json'
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
          The server reads JSON snapshots from <code>mcp-data/</code>. You can override the source
          by setting environment variables:
        </Typography>
        <Panel fullWidth>
          <Stack gap={1}>
            <Typography>
              <b>Resolution order</b>: <code>VALET_ROOT + VALET_MCP_DATA_DIR</code> →
              <code> VALET_MCP_DATA_DIR</code> → nearest <code>mcp-data</code> from CWD → bundled
              snapshot → optional <code>@archway/valet-mcp-data</code> package
            </Typography>
            <CodeBlock
              code={`# Use bundled data (default)
valet-mcp

# Use a local checkout’s fresh data
VALET_MCP_DATA_DIR=/path/to/valet/mcp-data valet-mcp

# Use both root + relative dir
VALET_ROOT=/path/to/valet VALET_MCP_DATA_DIR=mcp-data valet-mcp`}
              ariaLabel='Copy data source examples'
            />
          </Stack>
        </Panel>

        <Typography
          variant='h3'
          bold
        >
          Developing valet with MCP
        </Typography>
        <Typography>
          When editing components or docs in this repository, regenerate MCP data and validate the
          server:
        </Typography>
        <CodeBlock
          code={`# in repo root
npm run mcp:build            # writes JSON into mcp-data/
npm run mcp:server:selfcheck # { ok, components, hasBox }

# dev the MCP against fresh data
VALET_MCP_DATA_DIR=./mcp-data npm run mcp:server:start`}
          ariaLabel='Copy valet development flow for MCP'
        />

        <Typography
          variant='h3'
          bold
        >
          Best practices (using MCP effectively)
        </Typography>
        <Panel fullWidth>
          <Typography>
            • Prefer searching with intent: “table zebra multi‑select” vs. “table”.
            <br />• Always confirm prop shapes via <code>get_component</code> before wiring complex
            generics.
            <br />• Bind theme tokens via <code>cssVars</code> instead of hard‑coding colors.
            <br />• Keep tables constrained to the component’s height; only opt out when the page
            controls scrolling.
            <br />• Wrap your route in a single <code>Surface</code> and avoid nesting.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}
