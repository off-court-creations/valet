// ─────────────────────────────────────────────────────────────
// src/mcp/metaTypes.ts  | valet
// Shared types + helper for per-component meta (build-time only)
// ─────────────────────────────────────────────────────────────

export type ValetPropSemanticKind =
  | 'string'
  | 'number'
  | 'boolean'
  | 'enum'
  | 'color'
  | 'length'
  | 'duration';

export type ValetComponentMeta = {
  name: string;
  aliases?: string[];
  status?: 'experimental' | 'stable' | 'deprecated';
  since?: string;
  category?: string;
  tags?: string[];
  usage?: {
    purpose?: string | string[];
    whenToUse?: string[];
    whenNotToUse?: string[];
    alternatives?: string[];
  };
  a11y?: {
    roles?: string[];
    aria?: string[];
    keyboard?: string[];
    notes?: string;
  };
  intents?: {
    actions?: string[];
    events?: string[];
    props?: Array<{
      name: string;
      synonyms?: string[];
      kind?: ValetPropSemanticKind;
      range?: { min?: number; max?: number; step?: number };
    }>;
  };
  constraints?: {
    ssrSafe?: boolean;
    controlled?: boolean;
    multiSelect?: boolean;
    portal?: boolean;
  };
  related?: { see?: string[]; replaces?: string[]; replacedBy?: string[] };
  theming?: {
    cssVars?: string[];
    semantics?: Record<string, 'color' | 'length' | 'duration' | 'easing' | 'shadow'>;
  };
  test?: { selectors?: string[] };
  i18n?: { bidi?: boolean; localeAware?: boolean; truncation?: 'ellipsis' | 'wrap' | 'clip' };
  docs?: { bestPracticeSlugs?: string[]; docsUrl?: string };
};

// Small helper to encourage consistent authoring shape. This function is
// a no-op at runtime but provides a typed surface and light normalization.
export function defineComponentMeta<T extends ValetComponentMeta>(meta: T): T {
  const normStrings = (arr?: readonly unknown[]) =>
    Array.isArray(arr)
      ? Array.from(new Set(arr.map((s) => String(s).trim()).filter(Boolean)))
      : undefined;

  const name = typeof meta.name === 'string' ? meta.name.trim() : meta.name;
  const aliases = meta.aliases ? normStrings(meta.aliases)?.map((s) => s.toLowerCase()) : undefined;
  const tags = meta.tags ? normStrings(meta.tags) : undefined;

  let a11y: ValetComponentMeta['a11y'] | undefined;
  if (meta.a11y) {
    a11y = { ...meta.a11y };
    if (a11y.roles) a11y.roles = normStrings(a11y.roles);
    if (a11y.aria) a11y.aria = normStrings(a11y.aria);
    if (a11y.keyboard) a11y.keyboard = normStrings(a11y.keyboard);
  }

  let related: ValetComponentMeta['related'] | undefined;
  if (meta.related) {
    related = { ...meta.related };
    if (related.see) related.see = normStrings(related.see);
    if (related.replaces) related.replaces = normStrings(related.replaces);
    if (related.replacedBy) related.replacedBy = normStrings(related.replacedBy);
  }

  let usage: ValetComponentMeta['usage'] | undefined;
  if (meta.usage) {
    usage = { ...meta.usage };
    if (Array.isArray(usage.purpose)) usage.purpose = normStrings(usage.purpose);
    if (usage.whenToUse) usage.whenToUse = normStrings(usage.whenToUse);
    if (usage.whenNotToUse) usage.whenNotToUse = normStrings(usage.whenNotToUse);
    if (usage.alternatives) usage.alternatives = normStrings(usage.alternatives);
  }

  let test: ValetComponentMeta['test'] | undefined;
  if (meta.test) {
    test = { ...meta.test };
    if (test.selectors) test.selectors = normStrings(test.selectors);
  }

  let docs: ValetComponentMeta['docs'] | undefined;
  if (meta.docs) {
    docs = { ...meta.docs };
    if (docs.bestPracticeSlugs) docs.bestPracticeSlugs = normStrings(docs.bestPracticeSlugs);
  }

  const out: T = {
    ...meta,
    name,
    aliases,
    tags,
    usage,
    a11y,
    related,
    test,
    docs,
  };
  return out;
}
