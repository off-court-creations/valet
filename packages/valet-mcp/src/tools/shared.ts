// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/tools/shared.ts  | valet-mcp
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
  status?: 'golden' | 'stable' | 'experimental' | 'unstable' | 'deprecated';
};

// Status semantics (for clients/agents):
// 'golden' > 'stable' > 'experimental' > 'unstable' > 'deprecated'
// golden: very stable + polished; stable: production‑ready; experimental: new/iterating;
// unstable: known issues; deprecated: slated for removal.
export type ValetComponentDoc = {
  name: string;
  category: string;
  slug: string;
  summary: string;
  status?: 'golden' | 'stable' | 'experimental' | 'unstable' | 'deprecated';
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

export function normalizeStatusFilter(input?: string | string[]): Set<string> {
  if (!input) return new Set<string>();
  const arr = Array.isArray(input) ? input : String(input).split(/[|,\s]+/);
  const normalized = arr.map((s) => s.trim().toLowerCase()).filter(Boolean);
  return new Set(normalized);
}

export type GlossaryEntry = { term: string; definition: string; aliases?: string[]; seeAlso?: string[]; category?: string };

type DataSource = 'env-dir' | 'bundled';

function resolveExplicitDir(): { dir: string; source: DataSource } | null {
  const provided = process.env.VALET_MCP_DATA_DIR;
  if (!provided) return null;

  const resolved = path.resolve(provided);
  if (!path.isAbsolute(provided)) {
    throw new Error('VALET_MCP_DATA_DIR must be an absolute path to the mcp-data directory.');
  }
  if (!fs.existsSync(resolved)) {
    throw new Error(`VALET_MCP_DATA_DIR points to a non-existent directory: ${resolved}`);
  }
  const stats = fs.statSync(resolved);
  if (!stats.isDirectory()) {
    throw new Error(`VALET_MCP_DATA_DIR must reference a directory. Received: ${resolved}`);
  }
  return { dir: resolved, source: 'env-dir' };
}

function resolveBundledDir(): { dir: string; source: DataSource } | null {
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
  return null;
}

function resolvePackageData(): { dir: string; source: DataSource } | null {
  try {
    const req = createRequire(import.meta.url);
    const dataEntry = req.resolve('@archway/valet-mcp-data/mcp-data/index.json');
    const pkgDataDir = path.dirname(dataEntry);
    const maybeDir = path.resolve(pkgDataDir, '..');
    if (fs.existsSync(maybeDir)) return { dir: maybeDir, source: 'bundled' };
  } catch {
    // ignore if not installed
  }
  return null;
}

function getDataInfo(): { dir: string; source: DataSource } {
  const explicit = resolveExplicitDir();
  if (explicit) return explicit;

  const bundled = resolveBundledDir() ?? resolvePackageData();
  if (bundled) return bundled;

  throw new Error('Unable to locate bundled valet MCP data.');
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
    const q = input.name.trim().toLowerCase();
    const byName = index.find((i) => i.name.toLowerCase() === q);
    if (byName) return byName.slug;
    // Try synonyms
    const { map: synonyms } = loadSynonyms();
    const targets = synonyms[q];
    if (Array.isArray(targets) && targets.length) {
      // Prefer an exact name match from targets
      for (const t of targets) {
        const hit = index.find((i) => i.name.toLowerCase() === t.toLowerCase());
        if (hit) return hit.slug;
      }
      // Fallback: simpleSearch to pick best candidate for the query
      const scored = simpleSearch(q, index);
      if (scored.length) return scored[0].item.slug;
    }
    // Final fallback: simpleSearch over index
    const scored = simpleSearch(q, index);
    if (scored.length) return scored[0].item.slug;
  }
  return null;
}

export type SynonymsMap = Record<string, string[]>;
export type SynonymSource = 'file' | 'fallback' | 'merged';
export type SynonymInfo = { map: SynonymsMap; source: SynonymSource };

const FALLBACK_SYNONYMS: SynonymsMap = {
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

let synonymCache: SynonymInfo | null = null;

function normalizeSynonymEntries(source: SynonymsMap | undefined | null): SynonymsMap {
  if (!source) return {};
  const normalized: SynonymsMap = {};
  for (const [alias, rawTargets] of Object.entries(source)) {
    const key = alias.trim().toLowerCase();
    if (!key) continue;
    const targets = Array.from(new Set((rawTargets ?? []).map((t) => t.trim()).filter((t) => t.length > 0)));
    if (targets.length) normalized[key] = targets;
  }
  return normalized;
}

export function clearSynonymCache(): void {
  synonymCache = null;
}

export function loadSynonyms(): SynonymInfo {
  if (synonymCache) return synonymCache;
  const fallback = normalizeSynonymEntries(FALLBACK_SYNONYMS);
  let map: SynonymsMap = { ...fallback };
  let source: SynonymSource = 'fallback';
  let fileUsed = false;

  try {
    const p = path.join(DATA_DIR, 'component_synonyms.json');
    if (fs.existsSync(p)) {
      const fileData = normalizeSynonymEntries(readJSON<SynonymsMap>(p));
      if (Object.keys(fileData).length > 0) {
        fileUsed = true;
        map = { ...map, ...fileData };
      }
    }
  } catch {
    // ignore parsing/IO issues and fall back to defaults
  }

  if (fileUsed && Object.keys(fallback).length > 0) source = 'merged';
  else if (fileUsed) source = 'file';
  else source = 'fallback';

  synonymCache = { map, source };
  return synonymCache;
}

export function simpleSearch(query: string, items: ValetIndexItem[], opts?: { category?: string }): Array<{ item: ValetIndexItem; score: number }> {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const { map: synonyms } = loadSynonyms();
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
