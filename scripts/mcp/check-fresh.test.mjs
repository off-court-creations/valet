// ─────────────────────────────────────────────────────────────
// scripts/mcp/check-fresh.test.mjs | valet (MCP-TRUTH S8)
// Freshness guard: buildCorpus determinism, volatile-field policy,
// drift detection (stale / missing / orphaned), and the green path
// against the real committed corpus.
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  buildCorpusCaptureRoutes,
  canonicalize,
  diffAgainstDir,
  expectedFilesFromCorpus,
  normalizeActual,
  stableStringify,
} from './check-fresh.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// ── pure helpers ───────────────────────────────────────────────

describe('canonicalize / stableStringify', () => {
  it('sorts object keys recursively so insertion order cannot cause drift', () => {
    const a = { b: 1, a: { d: [{ z: 1, y: 2 }], c: 3 } };
    const b = { a: { c: 3, d: [{ y: 2, z: 1 }] }, b: 1 };
    expect(stableStringify(a)).toBe(stableStringify(b));
  });

  it('preserves array order (prop order is content, not enumeration noise)', () => {
    expect(stableStringify([1, 2])).not.toBe(stableStringify([2, 1]));
    expect(canonicalize([3, 1, 2])).toEqual([3, 1, 2]);
  });
});

describe('volatile-field policy (determinism exclusions)', () => {
  it('_meta.json: builtAt and buildHash are excluded from the comparison', () => {
    const normalized = normalizeActual('_meta.json', {
      version: '0.34.1',
      builtAt: '1999-01-01T00:00:00.000Z',
      schemaVersion: '1.6',
      buildHash: 'deadbeef',
    });
    expect(normalized).toEqual({ version: '0.34.1', schemaVersion: '1.6' });
  });

  it('glossary.json: builtAt is excluded', () => {
    const normalized = normalizeActual('glossary.json', {
      entries: [{ term: 'a', definition: 'b' }],
      version: '0.34.1',
      builtAt: '1999-01-01T00:00:00.000Z',
    });
    expect(normalized).toEqual({ entries: [{ term: 'a', definition: 'b' }], version: '0.34.1' });
  });

  it('index.json and synonym target lists compare order-insensitively', () => {
    const idx = normalizeActual('index.json', [{ slug: 'b' }, { slug: 'a' }]);
    expect(idx.map((i) => i.slug)).toEqual(['a', 'b']);
    expect(normalizeActual('component_synonyms.json', { k: ['B', 'A'] })).toEqual({
      k: ['A', 'B'],
    });
  });
});

describe('diffAgainstDir drift detection (fixture corpus)', () => {
  let dir;
  const expected = {
    'index.json': [{ name: 'Box', slug: 'components/layout/box', summary: 'real' }],
    'components/components_layout_box.json': { name: 'Box', summary: 'real' },
    '_meta.json': { version: '1.0.0', schemaVersion: '1.6' },
  };

  const writeFresh = () => {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(path.join(dir, 'components'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(expected['index.json']));
    fs.writeFileSync(
      path.join(dir, 'components', 'components_layout_box.json'),
      JSON.stringify(expected['components/components_layout_box.json']),
    );
    fs.writeFileSync(
      path.join(dir, '_meta.json'),
      JSON.stringify({
        version: '1.0.0',
        schemaVersion: '1.6',
        builtAt: 'whenever',
        buildHash: 'xyz',
      }),
    );
  };

  beforeAll(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-fresh-fixture-'));
  });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('green when content matches (volatile fields may differ freely)', () => {
    writeFresh();
    const res = diffAgainstDir(expected, dir);
    expect(res).toEqual({ ok: true, stale: [], missing: [], extra: [] });
  });

  it('red: mutated file content is reported stale', () => {
    writeFresh();
    fs.writeFileSync(
      path.join(dir, 'components', 'components_layout_box.json'),
      JSON.stringify({ name: 'Box', summary: 'OUT OF DATE' }),
    );
    const res = diffAgainstDir(expected, dir);
    expect(res.ok).toBe(false);
    expect(res.stale).toEqual(['components/components_layout_box.json']);
  });

  it('red: deleted file is reported missing', () => {
    writeFresh();
    fs.rmSync(path.join(dir, 'components', 'components_layout_box.json'));
    const res = diffAgainstDir(expected, dir);
    expect(res.ok).toBe(false);
    expect(res.missing).toEqual(['components/components_layout_box.json']);
  });

  it('red: orphaned component file is reported extra', () => {
    writeFresh();
    fs.writeFileSync(path.join(dir, 'components', 'components_zzz_ghost.json'), '{}');
    const res = diffAgainstDir(expected, dir);
    expect(res.ok).toBe(false);
    expect(res.extra).toEqual(['components/components_zzz_ghost.json']);
  });

  it('red: unparseable JSON is reported stale, not crashed on', () => {
    writeFresh();
    fs.writeFileSync(path.join(dir, 'index.json'), '{not json');
    const res = diffAgainstDir(expected, dir);
    expect(res.ok).toBe(false);
    expect(res.stale).toEqual(['index.json (unparseable JSON)']);
  });
});

// ── integration against the real repo (one shared rebuild) ────

describe('check-fresh integration (real corpus)', () => {
  let corpus;
  let routesTruth;
  let expected;
  let routesBytesBefore;
  const routesPath = path.join(ROOT, 'mcp-data', '_routes.json');

  beforeAll(async () => {
    routesBytesBefore = fs.readFileSync(routesPath);
    ({ corpus, routesTruth } = await buildCorpusCaptureRoutes(ROOT));
    expected = expectedFilesFromCorpus(corpus);
    if (routesTruth != null) expected['_routes.json'] = routesTruth;
  }, 120_000);

  it('regression: buildCorpusCaptureRoutes leaves the working tree byte-identical', () => {
    expect(fs.readFileSync(routesPath).equals(routesBytesBefore)).toBe(true);
    expect(fs.existsSync(path.join(ROOT, 'mcp-data', '_tmp-meta'))).toBe(false);
  });

  it('regression: committed mcp-data/ is fresh (mcp:check green on current tree)', () => {
    const res = diffAgainstDir(expected, path.join(ROOT, 'mcp-data'));
    expect(res).toEqual({ ok: true, stale: [], missing: [], extra: [] });
  });

  it('regression: shipped mirror packages/valet-mcp/mcp-data is fresh too', () => {
    const mirrorExpected = { ...expected };
    delete mirrorExpected['_routes.json'];
    const res = diffAgainstDir(
      mirrorExpected,
      path.join(ROOT, 'packages', 'valet-mcp', 'mcp-data'),
    );
    expect(res).toEqual({ ok: true, stale: [], missing: [], extra: [] });
  });

  it('regression: a mutated component JSON in a temp copy turns the check red', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-fresh-mut-'));
    try {
      fs.cpSync(path.join(ROOT, 'mcp-data'), tmp, { recursive: true });
      const target = path.join(tmp, 'components', 'components_layout_box.json');
      const doc = JSON.parse(fs.readFileSync(target, 'utf8'));
      doc.summary = 'STALE — sidecar changed without npm run mcp:build';
      fs.writeFileSync(target, JSON.stringify(doc, null, 2));
      const res = diffAgainstDir(expected, tmp);
      expect(res.ok).toBe(false);
      expect(res.stale).toContain('components/components_layout_box.json');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('regression: rebuild is deterministic — second build matches the first canonically', async () => {
    const second = await buildCorpusCaptureRoutes(ROOT);
    const expected2 = expectedFilesFromCorpus(second.corpus);
    if (second.routesTruth != null) expected2['_routes.json'] = second.routesTruth;
    expect(Object.keys(expected2).sort()).toEqual(Object.keys(expected).sort());
    for (const key of Object.keys(expected)) {
      expect(stableStringify(expected2[key]), `file ${key} differs between rebuilds`).toBe(
        stableStringify(expected[key]),
      );
    }
    // buildHash contains no timestamps; it must be reproducible per checkout.
    expect(second.corpus.buildHash).toBe(corpus.buildHash);
  }, 120_000);

  it('corpus floors: >= 50 components and a populated glossary', () => {
    expect(corpus.index.length).toBeGreaterThanOrEqual(50);
    expect(corpus.glossaryError).toBeUndefined();
    expect(corpus.glossary.length).toBeGreaterThan(0);
  });
});
