// ─────────────────────────────────────────────────────────────
// servers/valet-mcp/src/tools/shared.ts  | valet-mcp
// Shared data access, types, and helpers for MCP tools
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

export type ValetIndexItem = {
  name: string;
  category: string;
  summary: string;
  slug: string;
};

export type ValetComponentDoc = {
  name: string;
  category: string;
  slug: string;
  summary: string;
  status?: 'experimental' | 'stable' | 'deprecated';
  description?: string;
  usage?: {
    purpose?: string | string[];
    whenToUse?: string[];
    whenNotToUse?: string[];
    alternatives?: string[];
  };
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

export type GlossaryEntry = { term: string; definition: string; aliases?: string[]; seeAlso?: string[]; category?: string };

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

export const DATA_INFO = getDataInfo();
export const DATA_DIR = DATA_INFO.dir;

export function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    throw new Error(`mcp-data directory not found at: ${DATA_DIR}`);
  }
}

export function readJSON<T>(p: string): T {
  const s = fs.readFileSync(p, 'utf8');
  return JSON.parse(s) as T;
}

export function getIndex(): ValetIndexItem[] {
  ensureDataDir();
  const p = path.join(DATA_DIR, 'index.json');
  return readJSON<ValetIndexItem[]>(p);
}

export function getComponentBySlug(slug: string): ValetComponentDoc | null {
  ensureDataDir();
  const file = path.join(DATA_DIR, 'components', `${slug.replace(/\//g, '_')}.json`);
  if (!fs.existsSync(file)) return null;
  return readJSON<ValetComponentDoc>(file);
}

export function getMeta(): { valetVersion?: string; generatedAt?: string; schemaVersion?: string; buildHash?: string } | null {
  try {
    const file = path.join(DATA_DIR, '_meta.json');
    if (!fs.existsSync(file)) return null;
    const raw = readJSON<{ version?: string; builtAt?: string; schemaVersion?: string; buildHash?: string }>(file);
    return { valetVersion: raw.version, generatedAt: raw.builtAt, schemaVersion: raw.schemaVersion, buildHash: raw.buildHash };
  } catch {
    return null;
  }
}

export function getGlossary(): { entries: GlossaryEntry[] } | null {
  ensureDataDir();
  const p = path.join(DATA_DIR, 'glossary.json');
  if (!fs.existsSync(p)) return null;
  return readJSON<{ entries: GlossaryEntry[] }>(p);
}

export function resolveSlug(input: { name?: string; slug?: string }): string | null {
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

type SynonymsMap = Record<string, string[]>;

function loadSynonyms(): SynonymsMap {
  try {
    const p = path.join(DATA_DIR, 'component_synonyms.json');
    if (fs.existsSync(p)) return readJSON<SynonymsMap>(p);
  } catch {}
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

export function simpleSearch(query: string, items: ValetIndexItem[], opts?: { category?: string }): Array<{ item: ValetIndexItem; score: number }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const synonyms = loadSynonyms();
  const byCategory = opts?.category ? items.filter((i) => i.category === opts.category) : items;
  const tokens = Array.from(new Set(q.split(/[^a-z0-9]+/g).filter((t) => t.length >= 2)));

  const scored = byCategory
    .map((it) => {
      const name = it.name.toLowerCase();
      const cat = it.category.toLowerCase();
      const hay = `${name} ${it.summary.toLowerCase()} ${cat}`;
      let score = 0;
      if (hay.includes(q)) score += 2;
      if (name.startsWith(q)) score += 3;
      if (name === q) score += 5;
      if (cat === q) score += 2;
      for (const t of tokens) {
        if (!t) continue;
        if (hay.includes(t)) score += 1;
        if (name.startsWith(t)) score += 2;
        if (name === t) score += 3;
        if (cat === t) score += 1;
        const targets = (synonyms[t] || []).map((x) => x.toLowerCase());
        if (targets.includes(name)) score += 3;
      }
      return { item: it, score };
    })
    .filter((s) => s.score > 0);

  scored.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name));
  return scored;
}
