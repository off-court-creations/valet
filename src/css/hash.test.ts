// ─────────────────────────────────────────────────────────────
// src/css/hash.test.ts  | valet
// Characterization + seed-override suite for the FNV‑1a hash util.
// Pinned vectors were computed from the current implementation; a
// mismatch means the hash (and thus every generated class name)
// changed — release-note it, don't silently re-pin.
// ─────────────────────────────────────────────────────────────

import { afterEach, describe, expect, it, vi } from 'vitest';

import hashDefault, { hashStr } from './hash';

// Format contract: <base36 digest>-<base36 input length>
const FORMAT = /^[0-9a-z]+-[0-9a-z]+$/;

// Default-seed vectors (no VALET_HASH_SEED / __VALET_HASH_SEED set).
const DEFAULT_VECTORS: ReadonlyArray<readonly [string, string]> = [
  ['', '3mc8cafqayxs1-0'],
  ['a', '2jouqa3423esg-1'],
  ['abc', '2t2zwz0qixkn3-3'],
  ['valet', '1h3kwil4m16sh-5'],
  ['display:flex', '17wv5sodoiwtq-c'],
  ['color:red;padding:4px', '3d4gs5ieq7y2h-l'],
];

// Unicode vectors written as explicit escapes so file encoding can
// never change what is being hashed. Covers every UTF‑8 byte-width
// boundary in toUtf8Bytes plus surrogate-pair (astral) input.
const UNICODE_VECTORS: ReadonlyArray<readonly [string, string]> = [
  ['h\u00e9llo', '25sk6m0ndy0pw-5'], // precomposed e-acute (2‑byte UTF‑8)
  ['e\u0301', '3c6iv9ph74t77-2'], // decomposed e + combining acute
  ['\u65e5\u672c\u8a9e', '78nv9xj2aqg3-3'], // CJK (3‑byte sequences)
  ['\u{1f3a8}', '36t5apusj72gi-2'], // astral plane, surrogate pair
  ['\u007f', '2jov1z0df538a-1'], // 1‑byte upper bound
  ['\u0080', 'ryu4ojea3ltn-1'], // 2‑byte lower bound
  ['\u07ff', 's5vv4b9mbp8f-1'], // 2‑byte upper bound
  ['\u0800', '1mhmfkh0xcb1n-1'], // 3‑byte lower bound
  ['\uffff', '3br21xny73dkg-1'], // 3‑byte upper bound
  ['\u{10000}', '1y88qod50yhpt-2'], // 4‑byte lower bound
];

const ALL_VECTORS = [...DEFAULT_VECTORS, ...UNICODE_VECTORS];

describe('hashStr — harness preconditions', () => {
  it('runs without an ambient seed (pinned defaults assume this)', () => {
    expect(process.env.VALET_HASH_SEED ?? '').toBe('');
    expect(
      (globalThis as typeof globalThis & { __VALET_HASH_SEED?: string }).__VALET_HASH_SEED,
    ).toBeUndefined();
  });
});

describe('hashStr — determinism', () => {
  it('returns identical output for repeated calls with the same input', () => {
    for (const [input] of ALL_VECTORS) {
      const first = hashStr(input);
      expect(hashStr(input)).toBe(first);
      expect(hashStr(input)).toBe(first);
    }
  });

  it('is order-sensitive (permutations of the same bytes differ)', () => {
    const outputs = new Set([hashStr('abc'), hashStr('acb'), hashStr('bca'), hashStr('cba')]);
    expect(outputs.size).toBe(4);
  });

  it('produces no collisions across the pinned vector set', () => {
    const outputs = ALL_VECTORS.map(([input]) => hashStr(input));
    expect(new Set(outputs).size).toBe(outputs.length);
  });
});

describe('hashStr — known vectors (default seed)', () => {
  it.each(DEFAULT_VECTORS)('hashStr(%j) === %j', (input, expected) => {
    expect(hashStr(input)).toBe(expected);
  });

  it.each(UNICODE_VECTORS)('hashStr(%j) === %j (unicode)', (input, expected) => {
    expect(hashStr(input)).toBe(expected);
  });

  it('hashes a long input (2048 chars) with a base36 length suffix', () => {
    expect(hashStr('x'.repeat(2048))).toBe('15ozu0ky9asu9-1kw');
    expect((2048).toString(36)).toBe('1kw'); // suffix sanity
  });
});

describe('hashStr — output format', () => {
  it('matches <base36>-<base36> with a lowercase [0-9a-z] alphabet', () => {
    for (const [input] of ALL_VECTORS) {
      expect(hashStr(input)).toMatch(FORMAT);
    }
    expect(hashStr('x'.repeat(2048))).toMatch(FORMAT);
  });

  it('keeps the digest within 64-bit base36 bounds (1–13 chars)', () => {
    for (const [input] of ALL_VECTORS) {
      const digest = hashStr(input).split('-')[0];
      expect(digest.length).toBeGreaterThanOrEqual(1);
      expect(digest.length).toBeLessThanOrEqual(13); // 2^64‑1 is 13 base36 digits
    }
  });

  it('suffixes the UTF-16 length of the input in base36', () => {
    for (const [input] of ALL_VECTORS) {
      expect(hashStr(input).split('-')[1]).toBe(input.length.toString(36));
    }
  });
});

describe('hashStr — module shape', () => {
  it('default export exposes the same hashStr', () => {
    expect(hashDefault.hashStr).toBe(hashStr);
    expect(hashDefault.hashStr('abc')).toBe(hashStr('abc'));
  });
});

// Seeding is resolved ONCE at module evaluation (INTERNAL_SEED), so
// overrides require vi.resetModules + a fresh dynamic import.
describe('hashStr — seed overrides', () => {
  const GLOBAL_KEY = '__VALET_HASH_SEED';
  const seedGlobal = globalThis as typeof globalThis & { [GLOBAL_KEY]?: string };

  /** Re-evaluates src/css/hash.ts so resolveSeed() runs again. */
  async function freshHashStr(): Promise<typeof hashStr> {
    vi.resetModules();
    const mod = await import('./hash');
    return mod.hashStr;
  }

  afterEach(() => {
    vi.unstubAllEnvs();
    delete seedGlobal[GLOBAL_KEY];
    vi.resetModules();
  });

  it('VALET_HASH_SEED re-keys the hash space (pinned, deterministic)', async () => {
    vi.stubEnv('VALET_HASH_SEED', 'unit-test-seed');
    const seeded = await freshHashStr();
    expect(seeded('')).toBe('282df7g464z79-0');
    expect(seeded('abc')).toBe('24w1rk40fxfej-3');
    expect(seeded('display:flex')).toBe('1vq0cnis2dkre-c');
    // Differs from default seed, same format + length suffix
    expect(seeded('abc')).not.toBe(hashStr('abc'));
    expect(seeded('abc')).toMatch(FORMAT);
    expect(seeded('abc').split('-')[1]).toBe('3');
    expect(seeded('abc')).toBe(seeded('abc'));
  });

  it('an empty VALET_HASH_SEED is ignored (falls back to default seed)', async () => {
    vi.stubEnv('VALET_HASH_SEED', '');
    const seeded = await freshHashStr();
    expect(seeded('abc')).toBe('2t2zwz0qixkn3-3');
  });

  it('globalThis.__VALET_HASH_SEED re-keys the hash space (pinned)', async () => {
    seedGlobal[GLOBAL_KEY] = 'unit-test-global';
    const seeded = await freshHashStr();
    expect(seeded('')).toBe('2o685iuoz3run-0');
    expect(seeded('abc')).toBe('1cwft3ejbx369-3');
    expect(seeded('display:flex')).toBe('2efmn1rteju0w-c');
    expect(seeded('abc')).not.toBe(hashStr('abc'));
  });

  it('the env seed wins when both env and global overrides are set', async () => {
    vi.stubEnv('VALET_HASH_SEED', 'unit-test-seed');
    seedGlobal[GLOBAL_KEY] = 'unit-test-global';
    const seeded = await freshHashStr();
    expect(seeded('abc')).toBe('24w1rk40fxfej-3'); // env-seeded vector
  });

  it('captures the seed at import time — later env changes are inert', async () => {
    const beforeStub = await freshHashStr();
    vi.stubEnv('VALET_HASH_SEED', 'unit-test-seed');
    // Same module instance: still keyed by the seed seen at evaluation
    expect(beforeStub('abc')).toBe('2t2zwz0qixkn3-3');
    // A fresh evaluation picks up the override
    const afterStub = await freshHashStr();
    expect(afterStub('abc')).toBe('24w1rk40fxfej-3');
  });
});
