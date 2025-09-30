// ─────────────────────────────────────────────────────────────
// docs/src/data/componentsStatus.ts  | valet-docs
// Snapshot of component statuses derived from MCP build output
// ─────────────────────────────────────────────────────────────

import componentsIndex from '../../../mcp-data/index.json';

export type ComponentStatus = {
  name: string;
  category: string;
  slug: string;
  status: 'production' | 'stable' | 'experimental' | 'unstable' | 'deprecated';
};

const STATUS_VALUES = ['production', 'stable', 'experimental', 'unstable', 'deprecated'] as const;

type StatusValue = (typeof STATUS_VALUES)[number];

type RawComponentIndexEntry = {
  name?: unknown;
  category?: unknown;
  slug?: unknown;
  status?: unknown;
};

function toStatus(value: unknown): StatusValue | null {
  if (typeof value !== 'string') return null;
  const normalized = value.toLowerCase();
  return (STATUS_VALUES as readonly string[]).includes(normalized)
    ? (normalized as StatusValue)
    : null;
}

function normalize(entry: unknown): ComponentStatus | null {
  const data = entry as RawComponentIndexEntry;
  const name = typeof data.name === 'string' ? data.name : null;
  const category = typeof data.category === 'string' ? data.category : null;
  const slug = typeof data.slug === 'string' ? data.slug : null;
  const status = toStatus(data.status);
  if (!name || !category || !slug || !status) return null;
  return { name, category, slug, status };
}

const rawIndex = Array.isArray(componentsIndex) ? (componentsIndex as unknown[]) : [];

export const COMPONENTS_STATUS: ComponentStatus[] = rawIndex
  .map((entry) => normalize(entry))
  .filter((entry): entry is ComponentStatus => entry !== null);

export function sortComponents(a: ComponentStatus, b: ComponentStatus) {
  return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
}
