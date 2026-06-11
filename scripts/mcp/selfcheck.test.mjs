// ─────────────────────────────────────────────────────────────
// scripts/mcp/selfcheck.test.mjs | valet (MCP-TRUTH S8)
// Hardened valet-mcp selfcheck assertions (pure module under
// packages/valet-mcp/src/selfcheck.ts; vitest transforms the TS).
// Old behavior under test as regression: a 1-component dataset with
// an empty glossary and placeholder summaries used to pass selfcheck.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import {
  MIN_COMPONENTS,
  evaluateSelfcheck,
  isPlaceholderSummary,
} from '../../packages/valet-mcp/src/selfcheck.ts';

const healthyIndex = (n = 56) =>
  Array.from({ length: n }, (_, i) => ({
    name: `Comp${i}`,
    slug: `components/cat/comp${i}`,
    summary: `Real summary for component number ${i}.`,
  }));

const docsFor = (index) =>
  index.map((i) => ({ slug: i.slug, name: i.name, doc: { name: i.name, summary: i.summary } }));

const healthyInput = () => {
  const index = healthyIndex();
  return { index, glossaryEntries: 13, docs: docsFor(index) };
};

describe('isPlaceholderSummary', () => {
  it("flags the literal '<Name> component' merge fallback and empties", () => {
    expect(isPlaceholderSummary('Box', 'Box component')).toBe(true);
    expect(isPlaceholderSummary('Box', '  Box component  ')).toBe(true);
    expect(isPlaceholderSummary('Box', '')).toBe(true);
    expect(isPlaceholderSummary('Box', '   ')).toBe(true);
    expect(isPlaceholderSummary('Box', undefined)).toBe(true);
  });

  it('accepts real summaries, including ones that merely mention the word component', () => {
    expect(isPlaceholderSummary('Box', 'Layout primitive with spacing controls.')).toBe(false);
    expect(isPlaceholderSummary('Box', 'The Box component anchors layout.')).toBe(false);
    expect(isPlaceholderSummary('Box', 'Grid component')).toBe(false); // wrong name → not the fallback
  });
});

describe('evaluateSelfcheck (hardened gate)', () => {
  it('green on a healthy corpus', () => {
    expect(evaluateSelfcheck(healthyInput())).toEqual({ ok: true, failures: [] });
  });

  it(`regression: fails when the index has fewer than ${MIN_COMPONENTS} components`, () => {
    const index = healthyIndex(MIN_COMPONENTS - 1);
    const res = evaluateSelfcheck({ index, glossaryEntries: 13, docs: docsFor(index) });
    expect(res.ok).toBe(false);
    expect(res.failures.join('\n')).toMatch(new RegExp(`expected >= ${MIN_COMPONENTS}`));
  });

  it('regression: fails on an empty glossary', () => {
    const res = evaluateSelfcheck({ ...healthyInput(), glossaryEntries: 0 });
    expect(res.ok).toBe(false);
    expect(res.failures.join('\n')).toMatch(/glossary has 0 entries/);
  });

  it('regression: fails when an index entry carries a placeholder summary', () => {
    const input = healthyInput();
    input.index[3] = { ...input.index[3], summary: `${input.index[3].name} component` };
    const res = evaluateSelfcheck(input);
    expect(res.ok).toBe(false);
    expect(res.failures.join('\n')).toContain('placeholder/empty summaries in index.json');
    expect(res.failures.join('\n')).toContain(input.index[3].name);
  });

  it('regression: fails when a component doc carries a placeholder summary', () => {
    const input = healthyInput();
    input.docs[5] = { ...input.docs[5], doc: { name: input.docs[5].name, summary: '' } };
    const res = evaluateSelfcheck(input);
    expect(res.ok).toBe(false);
    expect(res.failures.join('\n')).toContain('placeholder/empty summaries in component docs');
  });

  it('regression: fails when an indexed component doc is missing', () => {
    const input = healthyInput();
    input.docs[7] = { ...input.docs[7], doc: null };
    const res = evaluateSelfcheck(input);
    expect(res.ok).toBe(false);
    expect(res.failures.join('\n')).toContain('component docs missing for indexed slugs');
    expect(res.failures.join('\n')).toContain(input.docs[7].slug);
  });

  it('aggregates multiple failures instead of stopping at the first', () => {
    const index = healthyIndex(10).map((i) => ({ ...i, summary: `${i.name} component` }));
    const res = evaluateSelfcheck({ index, glossaryEntries: 0, docs: docsFor(index) });
    expect(res.ok).toBe(false);
    expect(res.failures.length).toBeGreaterThanOrEqual(3);
  });
});
