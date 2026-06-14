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
  isUnknownType,
  hasObjectObjectDescription,
  GLOSSARY_FLOOR,
  COVERAGE_FLOORS,
  UNKNOWN_TYPE_ALLOW,
  DEPRECATED_ALIAS_FLOOR,
} from './validate.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// ── in-memory fixture corpus (passes every gate) ─────────────
// 20 base components (Comp00..Comp19): docsUrl on 17 (85% ≥ 80%),
// examples on 8 (40% ≥ 35%), bestPractices on 15 (75% ≥ 70%); glossary
// exactly at the floor. No prop carries a `deprecated` flag — the 1.0
// invariant is a zero-deprecated-alias corpus (DEPRECATED_ALIAS_FLOOR is
// empty), so the inverted deprecation gate passes on this control.
function makeFixtureCorpus() {
  const names = Array.from({ length: 20 }, (_, i) => `Comp${String(i).padStart(2, '0')}`);
  const components = {};
  const index = [];
  const routes = {};
  const add = (doc) => {
    components[doc.slug] = doc;
    index.push({
      name: doc.name,
      category: doc.category,
      summary: doc.summary,
      slug: doc.slug,
      status: doc.status,
    });
  };
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
    add(doc);
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

// At 1.0 the deprecated-alias floor is intentionally EMPTY, so the fixture adds
// no extra alias-owner components. ALIAS_OWNERS is therefore [] (length 0); the
// `+ ALIAS_OWNERS.length` terms below evaluate to `+ 0` and keep the base
// fixture's counts exact while documenting the now-empty floor.
const ALIAS_OWNERS = [...new Set(DEPRECATED_ALIAS_FLOOR.map((a) => a.component))];

describe('validateCorpus — green fixture control', () => {
  it('passes all hard gates with zero errors', () => {
    const res = validateCorpus(makeFixtureCorpus());
    expect(res.errors).toEqual([]);
    expect(res.ok).toBe(true);
    expect(res.stats.components).toBe(20 + ALIAS_OWNERS.length);
    expect(res.stats.coverage.docsUrl.count).toBe(17 + ALIAS_OWNERS.length);
    expect(res.stats.coverage.examples.count).toBe(8 + ALIAS_OWNERS.length);
    expect(res.stats.coverage.bestPractices.count).toBe(15 + ALIAS_OWNERS.length);
    expect(res.stats.glossaryEntries).toBe(GLOSSARY_FLOOR);
    expect(res.stats.sidecars).toEqual({ total: 2, orphans: 0 });
    // 1.0 invariant: zero deprecated props on the surface, and an empty floor —
    // both counts are 0, and the `=== DEPRECATED_ALIAS_FLOOR.length` form keeps
    // documenting that the floor itself is 0 (0 === 0).
    expect(res.stats.content.objectObjectDescriptions).toBe(0);
    expect(res.stats.content.unknownTypeProps).toBe(0);
    expect(res.stats.content.deprecatedFlaggedProps).toBe(DEPRECATED_ALIAS_FLOOR.length);
    expect(res.stats.content.deprecatedAliasFloor).toBe(DEPRECATED_ALIAS_FLOOR.length);
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
  // Strip a field from every component until coverage sits just below `floor`.
  const dropFieldBelowFloor = (corpus, field, floor) => {
    const docs = corpus.index.map((i) => corpus.components[i.slug]);
    const present = docs.filter(
      (d) => d && d[field] != null && (!Array.isArray(d[field]) || d[field].length > 0),
    );
    const total = docs.length;
    // Largest count still strictly below the floor.
    const target = Math.ceil(floor * total) - 1;
    let toDelete = present.length - target;
    for (const d of docs) {
      if (toDelete <= 0) break;
      if (d && d[field] != null) {
        delete d[field];
        toDelete--;
      }
    }
  };

  it('enforces the docsUrl ≥80% floor with named missing components', () => {
    const corpus = makeFixtureCorpus();
    dropFieldBelowFloor(corpus, 'docsUrl', COVERAGE_FLOORS.docsUrl);
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    const msg = res.errors.find((e) => e.startsWith('coverage gate: docsUrl'));
    expect(msg).toMatch(
      /^coverage gate: docsUrl \d+\/\d+ \(\d+\.\d%\) below floor 80% — missing: /,
    );
    expect(res.stats.coverage.docsUrl.count / res.stats.coverage.docsUrl.total).toBeLessThan(
      COVERAGE_FLOORS.docsUrl,
    );
  });

  it('enforces the examples ≥35% floor', () => {
    const corpus = makeFixtureCorpus();
    dropFieldBelowFloor(corpus, 'examples', COVERAGE_FLOORS.examples);
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    const msg = res.errors.find((e) => e.startsWith('coverage gate: examples'));
    expect(msg).toMatch(
      /^coverage gate: examples \d+\/\d+ \(\d+\.\d%\) below floor 35% — missing: /,
    );
  });

  it('enforces the bestPractices ≥70% floor', () => {
    const corpus = makeFixtureCorpus();
    dropFieldBelowFloor(corpus, 'bestPractices', COVERAGE_FLOORS.bestPractices);
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    const msg = res.errors.find((e) => e.startsWith('coverage gate: bestPractices'));
    expect(msg).toMatch(
      /^coverage gate: bestPractices \d+\/\d+ \(\d+\.\d%\) below floor 70% — missing: /,
    );
  });

  it('truncates long missing-component lists at 10 names', () => {
    const corpus = makeFixtureCorpus();
    for (const item of corpus.index) delete corpus.components[item.slug].docsUrl;
    const res = validateCorpus(corpus);
    const msg = res.errors.find((e) => e.startsWith('coverage gate: docsUrl'));
    // every component is missing → list shows 10 then a "+N more" remainder
    expect(msg).toMatch(/… \+\d+ more$/);
    expect(msg).toContain(`… +${corpus.index.length - 10} more`);
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
    const declared = 17 + ALIAS_OWNERS.length;
    expect(res.errors).toContain(
      `docsUrl cross-check impossible: mcp-data/_routes.json missing or malformed while ${declared} components declare a docsUrl`,
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

// ── B1 gate 1: '[object Object]' descriptions (hard) ──────────
describe("validateCorpus — '[object Object]' description gate (hard)", () => {
  it('fails when a prop description equals the array-coerce sentinel', () => {
    const corpus = makeFixtureCorpus();
    firstDoc(corpus).props.push({
      name: 'badDesc',
      type: 'string',
      description: '[object Object]',
    });
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain(
      "Comp00.badDesc: description contains '[object Object]' — JSDoc {@link} array-coercion bug; " +
        'the extractor must flatten getComment() arrays (see A1)',
    );
    expect(res.stats.content.objectObjectDescriptions).toBe(1);
  });

  it('fails when a prop description merely CONTAINS the sentinel', () => {
    const corpus = makeFixtureCorpus();
    firstDoc(corpus).props.push({
      name: 'badDesc2',
      type: 'string',
      description: 'See the [object Object] link for details.',
    });
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(
      res.errors.some((e) =>
        e.startsWith("Comp00.badDesc2: description contains '[object Object]'"),
      ),
    ).toBe(true);
  });

  it('hasObjectObjectDescription matches equal-or-contains, ignores clean strings', () => {
    expect(hasObjectObjectDescription('[object Object]')).toBe(true);
    expect(hasObjectObjectDescription('prefix [object Object] suffix')).toBe(true);
    expect(hasObjectObjectDescription('A normal description.')).toBe(false);
    expect(hasObjectObjectDescription(undefined)).toBe(false);
  });
});

// ── B1 gate 2: public 'unknown'-typed prop (hard) ─────────────
describe("validateCorpus — public 'unknown'-type prop gate (hard)", () => {
  it("fails a public prop typed 'unknown' that is not allow-listed", () => {
    const corpus = makeFixtureCorpus();
    firstDoc(corpus).props.push({ name: 'mystery', type: 'unknown' });
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(res.errors).toContain(
      "Comp00.mystery: public prop has type 'unknown' (not on the documented allow-list) — " +
        'likely a phantom prop or an unresolved type; fix the extractor or allow-list it in ' +
        'UNKNOWN_TYPE_ALLOW with a justification',
    );
    expect(res.stats.content.unknownTypeProps).toBe(1);
  });

  it('tolerates leading/trailing whitespace around the unknown literal', () => {
    const corpus = makeFixtureCorpus();
    firstDoc(corpus).props.push({ name: 'mystery2', type: '  unknown  ' });
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(
      res.errors.some((e) => e.startsWith("Comp00.mystery2: public prop has type 'unknown'")),
    ).toBe(true);
  });

  it('the documented allow-list is empty on the corrected corpus', () => {
    // DECISION evidence: zero genuinely-untyped public render props survive
    // extraction, so the strictest correct floor is an empty allow-list.
    expect(UNKNOWN_TYPE_ALLOW.size).toBe(0);
  });

  it('isUnknownType only matches the literal (trimmed) unknown', () => {
    expect(isUnknownType('unknown')).toBe(true);
    expect(isUnknownType(' unknown ')).toBe(true);
    expect(isUnknownType('unknown[]')).toBe(false);
    expect(isUnknownType('any')).toBe(false);
    expect(isUnknownType(undefined)).toBe(false);
  });
});

// ── B1 gate 3: deprecation gate (1.0 invariant — INVERTED) ────
// Pre-1.0 this gate asserted the known aliases EXIST + carry `deprecated`.
// At 1.0 every prop alias is removed, so the gate is inverted: the corpus must
// carry ZERO `deprecated` props. A clean corpus passes; ANY prop with a
// `deprecated` field (shape `true | { replacement? }`, schema 1.7) fails with a
// `deprecation gate (1.0):` error naming the offending `Component.prop`.
describe('validateCorpus — deprecation gate (1.0 invariant, hard)', () => {
  it('the deprecated-alias floor is intentionally empty at 1.0', () => {
    // The floor was emptied at the 1.0 cut; the gate that consumed it is now
    // inverted. Anchor that reality so a future re-population is deliberate.
    expect(DEPRECATED_ALIAS_FLOOR.length).toBe(0);
  });

  it('a clean corpus (no prop carries `deprecated`) passes the gate', () => {
    const res = validateCorpus(makeFixtureCorpus());
    expect(res.ok).toBe(true);
    expect(res.errors.some((e) => e.startsWith('deprecation gate (1.0):'))).toBe(false);
    expect(res.stats.content.deprecatedFlaggedProps).toBe(0);
  });

  it('fails when ANY prop carries a `deprecated` flag, naming Component.prop', () => {
    const corpus = makeFixtureCorpus();
    // Inject a deprecated alias onto a real fixture component. The extractor's
    // schema-1.7 shape is `deprecated: true | { reason?, replacement? }`; use
    // the `{ replacement }` form (matches how A3 emits a known canonical name).
    firstDoc(corpus).props.push({
      name: 'somethingOld',
      type: 'string',
      deprecated: { deprecated: true, replacement: 'somethingNew' },
    });
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    const msg = res.errors.find((e) => e.startsWith('deprecation gate (1.0):'));
    expect(msg).toBeTruthy();
    expect(msg).toContain('Comp00.somethingOld');
    expect(res.stats.content.deprecatedFlaggedProps).toBe(1);
  });

  it('flags a `deprecated: true` (bare, no replacement) prop too', () => {
    const corpus = makeFixtureCorpus();
    firstDoc(corpus).props.push({ name: 'legacyFlag', type: 'boolean', deprecated: true });
    const res = validateCorpus(corpus);
    expect(res.ok).toBe(false);
    expect(
      res.errors.some(
        (e) => e.startsWith('deprecation gate (1.0):') && e.includes('Comp00.legacyFlag'),
      ),
    ).toBe(true);
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
