#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// servers/valet-mcp/src/index.ts  | valet-mcp
// MCP server exposing Valet component data from mcp-data/
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { Readable } from 'node:stream';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { PRIMER_TEXT } from './primer.js';
const requireFromHere = createRequire(import.meta.url);
const pkg = requireFromHere('../package.json') as { version?: string; name?: string };
const MCP_VERSION = pkg.version ?? '0.0.0';

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
  cssPresets?: string[];
  events?: Array<{ name: string; payloadType?: string }>;
  actions?: Array<{ name: string; signature?: string }>;
  slots?: Array<{ name: string }>;
  bestPractices?: string[];
  bestPracticeSlugs?: string[];
  examples?: Array<{ id: string; title?: string; code: string; lang?: string; source?: { file: string; line?: number } }>;
  docsUrl?: string;
  sourceFiles: string[];
  version: string;
  schemaVersion?: string;
};

type DataSource = 'env-root+dir' | 'env-dir' | 'nearest-cwd' | 'bundled' | 'package' | 'fallback-cwd';

function getDataInfo(): { dir: string; source: DataSource } {
  const explicitRoot = process.env.VALET_ROOT && path.isAbsolute(process.env.VALET_ROOT)
    ? process.env.VALET_ROOT
    : undefined;
  const explicit = process.env.VALET_MCP_DATA_DIR
    ? (explicitRoot ? path.resolve(explicitRoot, process.env.VALET_MCP_DATA_DIR) : path.resolve(process.cwd(), process.env.VALET_MCP_DATA_DIR))
    : undefined;
  if (explicit && fs.existsSync(explicit)) return { dir: explicit, source: explicitRoot ? 'env-root+dir' : 'env-dir' };

  // Walk up to find a folder named mcp-data
  let dir = process.cwd();
  for (let i = 0; i < 6; i++) {
    const candidate = path.join(dir, 'mcp-data');
    if (fs.existsSync(candidate)) return { dir: candidate, source: 'nearest-cwd' };
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  // Check package-local data (bundled with this package)
  try {
    const fileDir = path.dirname(fileURLToPath(import.meta.url)); // ..../dist
    const pkgRoot = path.resolve(fileDir, '..');
    const localCandidates = [
      path.join(pkgRoot, 'mcp-data'),
      path.join(fileDir, 'mcp-data'),
    ];
    for (const c of localCandidates) {
      if (fs.existsSync(c)) return { dir: c, source: 'bundled' };
    }
  } catch {
    // ignore
  }

  // Try resolving an optional data package
  try {
    const req = createRequire(import.meta.url);
    const dataEntry = req.resolve('@archway/valet-mcp-data/mcp-data/index.json');
    const pkgDataDir = path.dirname(dataEntry);
    const maybeDir = path.resolve(pkgDataDir, '..');
    if (fs.existsSync(maybeDir)) return { dir: maybeDir, source: 'package' };
  } catch {
    // ignore if not installed
  }

  // Fallback to cwd/mcp-data
  return { dir: path.resolve(process.cwd(), 'mcp-data'), source: 'fallback-cwd' };
}
const DATA_INFO = getDataInfo();
const DATA_DIR = DATA_INFO.dir;

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

function getMeta(): { valetVersion?: string; generatedAt?: string; schemaVersion?: string; buildHash?: string } | null {
  try {
    const file = path.join(DATA_DIR, '_meta.json');
    if (!fs.existsSync(file)) return null;
    const raw = readJSON<{ version?: string; builtAt?: string; schemaVersion?: string; buildHash?: string }>(file);
    return { valetVersion: raw.version, generatedAt: raw.builtAt, schemaVersion: raw.schemaVersion, buildHash: raw.buildHash };
  } catch {
    return null;
  }
}

type GlossaryEntry = { term: string; definition: string; aliases?: string[]; seeAlso?: string[]; category?: string };

function getGlossary(): { entries: GlossaryEntry[] } | null {
  ensureDataDir();
  const p = path.join(DATA_DIR, 'glossary.json');
  if (!fs.existsSync(p)) return null;
  return readJSON<{ entries: GlossaryEntry[] }>(p);
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

type SynonymsMap = Record<string, string[]>; // alias -> target component names

function loadSynonyms(): SynonymsMap {
  try {
    const p = path.join(DATA_DIR, 'component_synonyms.json');
    if (fs.existsSync(p)) return readJSON<SynonymsMap>(p);
  } catch {}
  // Built-in minimal aliases
  return {
    textinput: ['TextField'],
    input: ['TextField'],
    textbox: ['TextField'],
    modal: ['Modal'],
    dialog: ['Modal'],
    navbar: ['AppBar'],
    appbar: ['AppBar'],
    footer: ['AppBar'],
    dropdown: ['Select'],
    combobox: ['Select'],
    select: ['Select'],
    daterange: ['DateSelector'],
    datepicker: ['DateSelector'],
    toast: ['Snackbar'],
    notification: ['Snackbar'],
    tooltip: ['Tooltip'],
    chip: ['MetroSelect'],
    segmented: ['MetroSelect'],
    tabs: ['Tabs'],
    grid: ['Grid'],
    table: ['Table'],
    image: ['Image'],
    icon: ['Icon'],
    button: ['Button'],
    box: ['Box'],
    stack: ['Stack'],
    surface: ['Surface'],
    accordion: ['Accordion'],
    list: ['List'],
    typography: ['Typography'],
    hero: ['Surface'],
    card: ['Panel'],
    form: ['FormControl'],
  };
}

function simpleSearch(query: string, items: ValetIndexItem[], opts?: { category?: string }): Array<{ item: ValetIndexItem; score: number }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const synonyms = loadSynonyms();
  const byCategory = opts?.category ? items.filter((i) => i.category === opts.category) : items;

  // Tokenize to support "kitchen sink" queries containing many words.
  // - Split on non-alphanumerics, keep tokens >= 2 chars to reduce noise.
  // - Example: "hero card grid button navbar" → ["hero","card","grid","button","navbar"]
  const tokens = Array.from(new Set(q.split(/[^a-z0-9]+/g).filter((t) => t.length >= 2)));

  const scored = byCategory
    .map((it) => {
      const name = it.name.toLowerCase();
      const cat = it.category.toLowerCase();
      const hay = `${name} ${it.summary.toLowerCase()} ${cat}`;
      let score = 0;

      // Full-phrase boost (when query is a single term or meaningful phrase)
      if (hay.includes(q)) score += 2;
      if (name.startsWith(q)) score += 3; // strong prefix on name
      if (name === q) score += 5; // exact name
      if (cat === q) score += 2; // exact category query

      // Token-wise scoring: accumulate for each token that matches
      for (const t of tokens) {
        if (!t) continue;
        if (hay.includes(t)) score += 1;
        if (name.startsWith(t)) score += 2;
        if (name === t) score += 3;
        if (cat === t) score += 1;
        // synonyms: if token alias maps to this component name
        const targets = (synonyms[t] || []).map((x) => x.toLowerCase());
        if (targets.includes(name)) score += 3;
      }

      return { item: it, score };
    })
    .filter((s) => s.score > 0);

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
  category: z.string().optional().describe('Optional category filter: primitives|fields|layout|widgets'),
} as const;

const GetExamplesParamsShape = GetComponentParamsShape;

async function createServer() {
  const server = new McpServer({ name: '@archway/valet-mcp', version: MCP_VERSION });

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
    const { query, limit = 10, category } = args as { query: string; limit?: number; category?: string };
    const index = getIndex();
    const scored = simpleSearch(query, index, { category }).slice(0, limit);
    return { content: [{ type: 'text', text: JSON.stringify(scored.map((s) => ({ ...s.item, score: s.score }))) }] };
  });

  // get_examples
  server.tool('get_examples', GetExamplesParamsShape, async (args) => {
    const slug = resolveSlug(args as { name?: string; slug?: string });
    if (!slug) return { content: [{ type: 'text', text: '[]' }] };
    const comp = getComponentBySlug(slug);
    return { content: [{ type: 'text', text: JSON.stringify(comp?.examples ?? []) }] };
  });

  // get_docs_info – docs URL and best-practice slugs/text
  server.tool('get_docs_info', GetComponentParamsShape, async (args) => {
    const slug = resolveSlug(args as { name?: string; slug?: string });
    if (!slug) return { content: [{ type: 'text', text: JSON.stringify({}) }] };
    const comp = getComponentBySlug(slug);
    if (!comp) return { content: [{ type: 'text', text: JSON.stringify({}) }] };
    const payload = {
      name: comp.name,
      slug: comp.slug,
      docsUrl: comp.docsUrl,
      bestPracticeSlugs: comp.bestPracticeSlugs ?? [],
      bestPractices: comp.bestPractices ?? [],
    };
    return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
  });

  // get_glossary – full glossary dataset
  server.tool('get_glossary', async () => {
    const g = getGlossary();
    if (!g) return { content: [{ type: 'text', text: JSON.stringify({ entries: [] }) }] };
    return { content: [{ type: 'text', text: JSON.stringify(g) }] };
  });

  // define_term – lookup a term (exact, alias, then fuzzy/contains) with soft-fail suggestions
  const DefineParamsShape = { word: z.string().min(1), limit: z.number().int().positive().max(10).optional() } as const;
  server.tool('define_term', DefineParamsShape, async (args) => {
    const { word, limit = 5 } = args as { word: string; limit?: number };
    const g = getGlossary();
    const q = word.trim().toLowerCase();
    const entries = g?.entries ?? [];
    const exact = entries.find((e) => e.term.toLowerCase() === q) || entries.find((e) => (e.aliases || []).some((a) => a.toLowerCase() === q));
    if (exact) return { content: [{ type: 'text', text: JSON.stringify({ found: true, entry: exact }) }] };
    // soft search: includes in term, alias, or definition
    const scored = entries.map((e) => {
      let s = 0;
      const name = e.term.toLowerCase();
      if (name.includes(q)) s += 3;
      if ((e.aliases || []).some((a) => a.toLowerCase().includes(q))) s += 2;
      if ((e.definition || '').toLowerCase().includes(q)) s += 1;
      return { e, s };
    }).filter((r) => r.s > 0).sort((a, b) => b.s - a.s || a.e.term.localeCompare(b.e.term));
    const suggestions = scored.slice(0, limit).map((r) => r.e);
    return { content: [{ type: 'text', text: JSON.stringify({ found: false, suggestions }) }] };
  });

  // get_primer – opinionated context dump for agents
  server.tool('get_primer', async () => ({ content: [{ type: 'text', text: PRIMER_TEXT }] }));

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

  // Primer and Glossary as resources
  server.resource('valet-primer', 'mcp://valet/primer', { mimeType: 'text/markdown', name: 'valet Primer' }, async () => ({
    contents: [{ uri: 'mcp://valet/primer', mimeType: 'text/markdown', text: PRIMER_TEXT }],
  }));
  server.resource('valet-glossary', 'mcp://valet/glossary', { mimeType: 'application/json', name: 'valet Glossary' }, async () => ({
    contents: [{ uri: 'mcp://valet/glossary', mimeType: 'application/json', text: JSON.stringify(getGlossary() ?? { entries: [] }, null, 2) }],
  }));

  return server;
}

async function main() {
  if (process.env.MCP_SELFCHECK === '1') {
    // Quick data sanity check and exit
    try {
      const index = getIndex();
      const box = index.find((i) => i.name === 'Box');
      const hasBox = !!(box && getComponentBySlug(box.slug));
      const meta = getMeta();
      const mcpMinor = MCP_VERSION.split('.').slice(0, 2).join('.');
      const valetMinor = meta?.valetVersion ? meta.valetVersion.split('.').slice(0, 2).join('.') : undefined;
      const parity = valetMinor ? (mcpMinor === valetMinor) : undefined;
      // eslint-disable-next-line no-console
      console.log(JSON.stringify({
        ok: true,
        components: index.length,
        hasBox,
        mcpVersion: MCP_VERSION,
        dataSource: (DATA_INFO as any).source,
        valetVersion: meta?.valetVersion,
        generatedAt: meta?.generatedAt,
        versionParity: parity,
        schemaVersion: meta?.schemaVersion,
        buildHash: meta?.buildHash,
        glossaryEntries: (getGlossary()?.entries?.length) ?? 0,
        hasPrimer: true,
      }, null, 2));
      process.exit(0);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(JSON.stringify({ ok: false, error: (err as Error).message, mcpVersion: MCP_VERSION }));
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
