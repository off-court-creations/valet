// ─────────────────────────────────────────────────────────────
// servers/valet-mcp/src/index.ts  | valet-mcp
// MCP server exposing Valet component data from mcp-data/
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

type ValetIndexItem = {
  name: string;
  category: string;
  summary: string;
  slug: string;
};

type ValetComponentDoc = {
  name: string;
  category: string;
  slug: string;
  summary: string;
  description?: string;
  props: Array<{
    name: string;
    type: string;
    required: boolean;
    default?: string;
    description?: string;
    deprecated?: true | { reason?: string; replacement?: string };
    source?: { file: string; line?: number };
  }>;
  domPassthrough?: { element: string; omitted?: string[] };
  cssVars?: string[];
  bestPractices?: string[];
  examples?: Array<{ id: string; title?: string; code: string; lang?: string; source?: { file: string; line?: number } }>;
  docsUrl?: string;
  sourceFiles: string[];
  version: string;
};

function findDataDir(): string {
  const explicitRoot = process.env.VALET_ROOT && path.isAbsolute(process.env.VALET_ROOT)
    ? process.env.VALET_ROOT
    : undefined;
  const explicit = process.env.VALET_MCP_DATA_DIR
    ? (explicitRoot ? path.resolve(explicitRoot, process.env.VALET_MCP_DATA_DIR) : path.resolve(process.cwd(), process.env.VALET_MCP_DATA_DIR))
    : undefined;
  if (explicit && fs.existsSync(explicit)) return explicit;

  // Walk up to find a folder named mcp-data
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'mcp-data');
    if (fs.existsSync(candidate)) return candidate;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Fallback to cwd/mcp-data
  return path.resolve(process.cwd(), 'mcp-data');
}
const DATA_DIR = findDataDir();

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`mcp-data directory not found at: ${DATA_DIR}`);
  }
}

function readJSON<T>(p: string): T {
  const s = fs.readFileSync(p, 'utf8');
  return JSON.parse(s) as T;
}

function getIndex(): ValetIndexItem[] {
  ensureDataDir();
  const p = path.join(DATA_DIR, 'index.json');
  return readJSON<ValetIndexItem[]>(p);
}

function getComponentBySlug(slug: string): ValetComponentDoc | null {
  ensureDataDir();
  const file = path.join(DATA_DIR, 'components', `${slug.replace(/\//g, '_')}.json`);
  if (!fs.existsSync(file)) return null;
  return readJSON<ValetComponentDoc>(file);
}

function resolveSlug(input: { name?: string; slug?: string }): string | null {
  const index = getIndex();
  if (input.slug) {
    const hit = index.find((i) => i.slug === input.slug);
    return hit ? hit.slug : null;
  }
  if (input.name) {
    const byName = index.find((i) => i.name.toLowerCase() === input.name!.toLowerCase());
    return byName ? byName.slug : null;
  }
  return null;
}

function simpleSearch(query: string, items: ValetIndexItem[]): Array<{ item: ValetIndexItem; score: number }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const scored = items.map((it) => {
    const hay = `${it.name} ${it.summary} ${it.category}`.toLowerCase();
    let score = 0;
    if (hay.includes(q)) score += 2;
    // bonus for prefix on name
    if (it.name.toLowerCase().startsWith(q)) score += 1;
    return { item: it, score };
  }).filter((s) => s.score > 0);
  scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  return scored;
}

// Tool parameter schemas (zod)
const GetComponentParamsShape = {
  name: z.string().describe('Component name, e.g., "Box"').optional(),
  slug: z.string().describe('Component slug, e.g., "components/layout/box"').optional(),
} as const;

const SearchParamsShape = {
  query: z.string().min(1).describe('Search string across names and summaries'),
  limit: z.number().int().positive().max(100).optional(),
} as const;

const GetExamplesParamsShape = GetComponentParamsShape;

async function createServer() {
  const server = new McpServer({ name: '@archway/valet-mcp', version: '0.1.0' });

  // list_components
  server.tool('list_components', async () => ({
    content: [{ type: 'text', text: JSON.stringify(getIndex()) }],
  }));

  // get_component
  server.tool('get_component', GetComponentParamsShape, async (args) => {
    const slug = resolveSlug(args as { name?: string; slug?: string });
    if (!slug) return { content: [{ type: 'text', text: JSON.stringify({ error: 'Component not found' }) }] };
    const comp = getComponentBySlug(slug);
    if (!comp) return { content: [{ type: 'text', text: JSON.stringify({ error: 'Component doc missing' }) }] };
    return { content: [{ type: 'text', text: JSON.stringify(comp) }] };
  });

  // search_components
  server.tool('search_components', SearchParamsShape, async (args) => {
    const { query, limit = 10 } = args as { query: string; limit?: number };
    const index = getIndex();
    const scored = simpleSearch(query, index).slice(0, limit);
    return { content: [{ type: 'text', text: JSON.stringify(scored.map((s) => ({ ...s.item, score: s.score }))) }] };
  });

  // get_examples
  server.tool('get_examples', GetExamplesParamsShape, async (args) => {
    const slug = resolveSlug(args as { name?: string; slug?: string });
    if (!slug) return { content: [{ type: 'text', text: '[]' }] };
    const comp = getComponentBySlug(slug);
    return { content: [{ type: 'text', text: JSON.stringify(comp?.examples ?? []) }] };
  });

  // Optional resources (component JSON as resources)
  server.resource('valet-index', 'mcp://valet/index', { mimeType: 'application/json', name: 'Valet Components Index' }, async () => ({
    contents: [{
      uri: 'mcp://valet/index',
      mimeType: 'application/json',
      text: JSON.stringify(getIndex(), null, 2),
    }],
  }));

  // Expose each component JSON as a resource lazily
  try {
    const index = getIndex();
    for (const item of index) {
      const uri = `mcp://valet/component/${item.slug}`;
      server.resource(`valet-${item.slug}`, uri, { mimeType: 'application/json', name: `${item.name} (${item.slug})` }, async () => ({
        contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(getComponentBySlug(item.slug), null, 2) }],
      }));
    }
  } catch {
    // ignore
  }

  return server;
}

async function main() {
  if (process.env.MCP_SELFCHECK === '1') {
    // Quick data sanity check and exit
    try {
      const index = getIndex();
      const box = index.find((i) => i.name === 'Box');
      const hasBox = !!(box && getComponentBySlug(box.slug));
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({ ok: true, components: index.length, hasBox }, null, 2));
      process.exit(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({ ok: false, error: (err as Error).message }));
      process.exit(1);
    }
    return;
  }

  const server = await createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// Run
main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Fatal:', err);
  process.exit(1);
});
