// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/selfcheck.ts  | valet-mcp
// Pure selfcheck assertions (MCP-TRUTH S8 hardening).
//
// MCP_SELFCHECK=1 (the prepublish gate) used to pass whenever the
// index parsed and Box existed — a 1-component dataset with an empty
// glossary and 56 '<Name> component' placeholders shipped green.
// These assertions make that impossible:
//  • index must list at least MIN_COMPONENTS components
//  • glossary must have at least one entry
//  • no index entry or component doc may carry a placeholder/empty
//    summary (the literal '<Name> component' merge fallback)
//  • every index entry's component doc must load
// ─────────────────────────────────────────────────────────────

/** Floor for the component index; the real corpus ships 56+. */
export const MIN_COMPONENTS = 50;

export type SelfcheckIndexItem = { name: string; slug: string; summary?: string };

export type SelfcheckDocSample = {
  slug: string;
  name: string;
  /** null = component file missing/unreadable */
  doc: { name?: string; summary?: string } | null;
};

export type SelfcheckInput = {
  index: SelfcheckIndexItem[];
  glossaryEntries: number;
  /** One entry per index item (the full corpus is cheap to read). */
  docs: SelfcheckDocSample[];
};

export type SelfcheckResult = { ok: boolean; failures: string[] };

/** The merge-time fallback summary is `${name} component` — never shippable. */
export function isPlaceholderSummary(name: string, summary: string | undefined): boolean {
  const s = (summary ?? '').trim();
  return s === '' || s === `${name} component`;
}

const listSome = (names: string[], cap = 8): string =>
  names.slice(0, cap).join(', ') + (names.length > cap ? `, … (${names.length} total)` : '');

export function evaluateSelfcheck(input: SelfcheckInput): SelfcheckResult {
  const failures: string[] = [];

  if (input.index.length < MIN_COMPONENTS) {
    failures.push(`index has ${input.index.length} components; expected >= ${MIN_COMPONENTS}`);
  }

  if (input.glossaryEntries <= 0) {
    failures.push('glossary has 0 entries; expected > 0');
  }

  const placeholderIndex = input.index
    .filter((i) => isPlaceholderSummary(i.name, i.summary))
    .map((i) => i.name);
  if (placeholderIndex.length) {
    failures.push(`placeholder/empty summaries in index.json: ${listSome(placeholderIndex)}`);
  }

  const missingDocs: string[] = [];
  const placeholderDocs: string[] = [];
  for (const sample of input.docs) {
    if (!sample.doc) {
      missingDocs.push(sample.slug);
      continue;
    }
    if (isPlaceholderSummary(sample.doc.name ?? sample.name, sample.doc.summary)) {
      placeholderDocs.push(sample.name);
    }
  }
  if (missingDocs.length) {
    failures.push(`component docs missing for indexed slugs: ${listSome(missingDocs)}`);
  }
  if (placeholderDocs.length) {
    failures.push(`placeholder/empty summaries in component docs: ${listSome(placeholderDocs)}`);
  }

  return { ok: failures.length === 0, failures };
}
