// ─────────────────────────────────────────────────────────────
// scripts/mcp/validate.test.mjs | valet
// MCP-TRUTH S7 regression suite (node env, ruling Q16a HARD gates):
// • validateCorpus is pure — fixtures are broken in-memory to prove
//   each content gate fires with a clear per-failure message
// • the committed mcp-data/ corpus stays green (floors sit below
//   the measured actuals: docsUrl 80.7%, examples 38.6%, bp 73.7%)
// • the pre-gate schema checks survived the pure-core refactor
// ─────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  loadCorpus,
  validateCorpus,
  isPlaceholderSummary,
  GLOSSARY_FLOOR,
  COVERAGE_FLOORS,
} from './validate.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// ── in-memory fixture corpus (passes every gate) ─────────────
// 20 components: docsUrl on 17 (85% ≥ 80%), examples on 8 (40% ≥ 35%),
// bestPractices on 15 (75% ≥ 70%); glossary exactly at the floor.
function makeFixtureCorpus() {
  const names = Array.from({ length: 20 }, (_, i) => `Comp${String(i).padStart(2, '0')}`);
  const components = {};
  const index = [];
  const routes = {};
  names.forEach((name, i) => {
    const slug = `components/widgets/${name.toLowerCase()}`;
    const doc = {
      name,
      slug,
      category: 'widgets',
      status: 'stable',
      summary: `${name} renders a fixture widget for validator tests.`,
      props: [{ name: 'value', type: 'string' }],
      schemaVersion: '1.6',
    };
    if (i < 17) {
      doc.docsUrl = `/${name.toLowerCase()}-demo`;
      routes[doc.docsUrl] = `docs/src/pages/${name}Demo.tsx`;
    }
    if (i < 8) doc.examples = [{ id: `${name.toLowerCase()}-basic`, code: `<${name} />` }];
    if (i < 15) doc.bestPractices = [`Use ${name} sparingly.`];
    components[slug] = doc;
    index.push({ name, category: doc.category, summary: doc.summary, slug, status: doc.status });
  });
  return {
    index,
    meta: { schemaVersion: '1.6', buildHash: 'fixture-hash' },
    components,
    synonyms: { 'comp-zero': ['Comp00'] },
    glossary: {
      entries: Array.from({ length: GLOSSARY_FLOOR }, (_, i) => ({
        term: `term-${String(i).padStart(2, '0')}`,
        definition: `Definition ${i}.`,
      })),
    },
    routes: { source: 'docs/src/App.tsx', routes },
    sidecars: [
      { file: 'src/components/widgets/Comp00.meta.json', name: 'Comp00' },
      { file: 'src/components/widgets/Comp01.meta.json', name: 'Comp01' },
    ],
  };
}

const firstDoc = (corpus) => corpus.components[corpus.index[0].slug];

describe('validateCorpus — green fixture control', () => {
  it('passes all hard gates with zero errors', () => {
    const res = validateCorpus(makeFixtureCorpus());
    expect(res.errors).toEqual([]);
    expect(res.ok).toBe(true);
    expect(res.stats.components).toBe(20);
    expect(res.stats.coverage.docsUrl.count).toBe(17);
    expect(res.stats.coverage.examples.count).toBe(8);
    expect(res.stats.coverage.bestPractices.count).toBe(15);
    expect(res.stats.glossaryEntries).toBe(GLOSSARY_FLOOR);
    expect(res.stats.sidecars).toEqual({ total: 2, orphans: 0 });
  });
});

describe('validateCorpus — placeholder summary gate (hard)', () => {
  it("flags the literal '<Name> component' doc summary as an error", () => {
    const corpus = makeFixtureCorpus();
    firstDoc(corpus).summary = 'Comp00 component';
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain(
      "Comp00: placeholder summary 'Comp00 component' — write a real summary (sidecar or component header comment)",
    );
    expect(res.stats.placeholderSummaries).toBe(1);
  });

  it('flags an empty doc summary as an error', () => {
    const corpus = makeFixtureCorpus();
    firstDoc(corpus).summary = '   ';
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain(
      'Comp00: summary is empty — the sidecar or header comment must supply a real summary',
    );
  });

  it('flags a stale placeholder in index.json even when the doc summary is real', () => {
    const corpus = makeFixtureCorpus();
    corpus.index[0].summary = 'Comp00 component';
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain(
      "Comp00: index.json summary is the '<Name> component' placeholder (stale index)",
    );
  });

  it('isPlaceholderSummary matches only the literal pattern', () => {
    expect(isPlaceholderSummary('Box', 'Box component')).toBe(true);
    expect(isPlaceholderSummary('Box', '  Box component  ')).toBe(true);
    expect(isPlaceholderSummary('Box', 'Box component for layout')).toBe(false);
    expect(isPlaceholderSummary('Box', 'Layout primitive')).toBe(false);
  });
});

describe('validateCorpus — glossary floor gate (hard)', () => {
  it(`fails when the glossary has fewer than ${GLOSSARY_FLOOR} entries`, () => {
    const corpus = makeFixtureCorpus();
    corpus.glossary.entries = corpus.glossary.entries.slice(0, GLOSSARY_FLOOR - 1);
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain(
      `glossary gate: ${GLOSSARY_FLOOR - 1} entries below floor ${GLOSSARY_FLOOR} (mcp-data/glossary.json)`,
    );
  });

  it('fails when glossary.json is missing entirely', () => {
    const corpus = makeFixtureCorpus();
    corpus.glossary = undefined;
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.warnings).toContain('glossary.json missing');
    expect(res.errors).toContain(
      `glossary gate: 0 entries below floor ${GLOSSARY_FLOOR} (mcp-data/glossary.json)`,
    );
  });
});

describe('validateCorpus — coverage floor gates (hard)', () => {
  it('enforces the docsUrl ≥80% floor with named missing components', () => {
    const corpus = makeFixtureCorpus();
    // 17/20 → 15/20 (75%) — below the 80% floor
    delete firstDoc(corpus).docsUrl;
    delete corpus.components[corpus.index[1].slug].docsUrl;
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    const msg = res.errors.find((e) => e.startsWith('coverage gate: docsUrl'));
    expect(msg).toBe(
      'coverage gate: docsUrl 15/20 (75.0%) below floor 80% — missing: Comp00, Comp01, Comp17, Comp18, Comp19',
    );
  });

  it('enforces the examples ≥35% floor', () => {
    const corpus = makeFixtureCorpus();
    // 8/20 → 6/20 (30%) — below the 35% floor
    delete firstDoc(corpus).examples;
    delete corpus.components[corpus.index[1].slug].examples;
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    const msg = res.errors.find((e) => e.startsWith('coverage gate: examples'));
    expect(msg).toMatch(/^coverage gate: examples 6\/20 \(30\.0%\) below floor 35% — missing: /);
  });

  it('enforces the bestPractices ≥70% floor', () => {
    const corpus = makeFixtureCorpus();
    // 15/20 → 13/20 (65%) — below the 70% floor
    delete firstDoc(corpus).bestPractices;
    delete corpus.components[corpus.index[1].slug].bestPractices;
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    const msg = res.errors.find((e) => e.startsWith('coverage gate: bestPractices'));
    expect(msg).toMatch(
      /^coverage gate: bestPractices 13\/20 \(65\.0%\) below floor 70% — missing: /,
    );
  });

  it('truncates long missing-component lists at 10 names', () => {
    const corpus = makeFixtureCorpus();
    for (const item of corpus.index) delete corpus.components[item.slug].docsUrl;
    const res = validateCorpus(corpus);
    const msg = res.errors.find((e) => e.startsWith('coverage gate: docsUrl'));
    expect(msg).toContain('… +10 more');
  });

  it('fails an empty corpus outright', () => {
    const corpus = makeFixtureCorpus();
    corpus.index = [];
    corpus.components = {};
    corpus.sidecars = [];
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain('index.json lists zero components — empty corpus');
  });
});

describe('validateCorpus — docsUrl ↔ _routes.json cross-check (hard)', () => {
  it('rejects a docsUrl that is not a real route', () => {
    const corpus = makeFixtureCorpus();
    firstDoc(corpus).docsUrl = '/not-a-real-route';
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain(
      "Comp00: docsUrl '/not-a-real-route' is not a route in _routes.json (docs/src/App.tsx)",
    );
  });

  it('fails when _routes.json is missing while components declare docsUrl', () => {
    const corpus = makeFixtureCorpus();
    corpus.routes = undefined;
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain(
      'docsUrl cross-check impossible: mcp-data/_routes.json missing or malformed while 17 components declare a docsUrl',
    );
  });
});

describe('validateCorpus — orphan sidecar gate (hard)', () => {
  it('fails on a sidecar naming a component absent from the corpus', () => {
    const corpus = makeFixtureCorpus();
    corpus.sidecars.push({ file: 'src/components/fields/Radio.meta.json', name: 'Radio' });
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain(
      "orphan sidecar: src/components/fields/Radio.meta.json names 'Radio' but no such component exists in the corpus",
    );
    expect(res.stats.sidecars.orphans).toBe(1);
  });

  it("fails on a sidecar without a readable 'name' field", () => {
    const corpus = makeFixtureCorpus();
    corpus.sidecars.push({ file: 'src/components/widgets/Broken.meta.json', name: null });
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain(
      "orphan sidecar: src/components/widgets/Broken.meta.json has no readable 'name' field — it can never attach to a component",
    );
  });
});

describe('validateCorpus — pre-gate schema checks survived the refactor', () => {
  it('index/doc name mismatch is an error', () => {
    const corpus = makeFixtureCorpus();
    firstDoc(corpus).name = 'Renamed';
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain("index/doc name mismatch: index='Comp00' doc='Renamed'");
  });

  it('missing component doc is an error', () => {
    const corpus = makeFixtureCorpus();
    corpus.components[corpus.index[0].slug] = null;
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain(`missing component doc: ${corpus.index[0].slug}`);
  });

  it('duplicate prop names are an error', () => {
    const corpus = makeFixtureCorpus();
    firstDoc(corpus).props.push({ name: 'value', type: 'number' });
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain('Comp00: duplicate prop: value');
  });

  it('missing status (doc and index) is an error', () => {
    const corpus = makeFixtureCorpus();
    delete firstDoc(corpus).status;
    delete corpus.index[0].status;
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain('Comp00: missing status (doc and index)');
  });

  it('synonym alias referencing a missing component is an error', () => {
    const corpus = makeFixtureCorpus();
    corpus.synonyms.ghost = ['NoSuchComponent'];
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain("alias 'ghost' references missing component 'NoSuchComponent'");
  });

  it('docsUrl-without-examples stays a warning, not an error', () => {
    const res = validateCorpus(makeFixtureCorpus());
    expect(res.warnings.some((w) => w.includes('docsUrl present but no examples'))).toBe(true);
    expect(res.ok).toBe(true);
  });
});

describe('committed corpus — mcp:schema:check stays green (floors below actuals)', () => {
  it('loadCorpus + validateCorpus pass on the real mcp-data/', () => {
    const corpus = loadCorpus(repoRoot);
    const res = validateCorpus(corpus);
    expect(res.errors).toEqual([]);
    expect(res.ok).toBe(true);
    // Floors deliberately sit below the measured actuals
    // (2026-06-11: docsUrl 46/57 = 80.7%, examples 22/57 = 38.6%,
    //  bestPractices 42/57 = 73.7%, glossary 13, sidecars 45/0 orphans).
    const { coverage, glossaryEntries, placeholderSummaries, sidecars } = res.stats;
    expect(coverage.docsUrl.count / coverage.docsUrl.total).toBeGreaterThanOrEqual(
      COVERAGE_FLOORS.docsUrl,
    );
    expect(coverage.examples.count / coverage.examples.total).toBeGreaterThanOrEqual(
      COVERAGE_FLOORS.examples,
    );
    expect(coverage.bestPractices.count / coverage.bestPractices.total).toBeGreaterThanOrEqual(
      COVERAGE_FLOORS.bestPractices,
    );
    expect(glossaryEntries).toBeGreaterThanOrEqual(GLOSSARY_FLOOR);
    expect(placeholderSummaries).toBe(0);
    expect(sidecars.orphans).toBe(0);
  });
});
