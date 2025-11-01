// ─────────────────────────────────────────────────────────────
// src/css/hash.ts  | valet
// Dependency‑free, deterministic hash util for class/keyframe names
// Replaces runtime siphash with BigInt FNV‑1a 64‑bit.
// Output is base36, suffixed with '-' + input length (base36) to
// further reduce practical collision probability.
// ─────────────────────────────────────────────────────────────

/*
  Rationale
  - 64‑bit FNV‑1a is tiny, fast, deterministic across Node/browsers via BigInt.
  - We include the input length (base36) as a suffix to reduce practical
    collision likelihood for similarly‑shaped strings.
  - A small seed is mixed in so multiple apps can optionally coordinate
    hash spaces without depending on external libs.
*/

const FNV_OFFSET_64 = 0xcbf29ce484222325n; // 14695981039346656037
const FNV_PRIME_64 = 0x100000001b3n; // 1099511628211
const MASK_64 = 0xffffffffffffffffn;

// Default seed string; can be overridden at runtime in advanced cases.
const DEFAULT_SEED = 'valet-hash-key!1';

function toUtf8Bytes(input: string): number[] {
  const out: number[] = [];
  for (const ch of input) {
    const cp = ch.codePointAt(0)!; // for..of iterates code points
    if (cp <= 0x7f) {
      out.push(cp);
    } else if (cp <= 0x7ff) {
      out.push(0xc0 | (cp >> 6));
      out.push(0x80 | (cp & 0x3f));
    } else if (cp <= 0xffff) {
      out.push(0xe0 | (cp >> 12));
      out.push(0x80 | ((cp >> 6) & 0x3f));
      out.push(0x80 | (cp & 0x3f));
    } else {
      out.push(0xf0 | (cp >> 18));
      out.push(0x80 | ((cp >> 12) & 0x3f));
      out.push(0x80 | ((cp >> 6) & 0x3f));
      out.push(0x80 | (cp & 0x3f));
    }
  }
  return out;
}

function fnv1a64(bytes: number[], seed: bigint): bigint {
  let h = (FNV_OFFSET_64 ^ seed) & MASK_64;
  for (let i = 0; i < bytes.length; i++) {
    h ^= BigInt(bytes[i] & 0xff);
    h = (h * FNV_PRIME_64) & MASK_64;
  }
  return h & MASK_64;
}

function seedFromString(s: string): bigint {
  const bytes = toUtf8Bytes(s);
  // Seed hashing without additional seed (0n)
  return fnv1a64(bytes, 0n);
}

function resolveSeed(): bigint {
  try {
    // Node override: process.env.VALET_HASH_SEED
    // Guard to avoid bundling 'process' into browsers
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const proc: any = typeof process !== 'undefined' ? process : undefined;
    const envSeed = proc?.env?.VALET_HASH_SEED as unknown;
    if (typeof envSeed === 'string' && envSeed.length) return seedFromString(envSeed);
  } catch {
    // ignore
  }
  try {
    // Browser/global override: globalThis.__VALET_HASH_SEED
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g: any = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
    const gSeed = g?.__VALET_HASH_SEED as unknown;
    if (typeof gSeed === 'string' && gSeed.length) return seedFromString(gSeed);
  } catch {
    // ignore
  }
  return seedFromString(DEFAULT_SEED);
}

const INTERNAL_SEED = resolveSeed();

export function hashStr(str: string): string {
  const bytes = toUtf8Bytes(str);
  const h = fnv1a64(bytes, INTERNAL_SEED);
  const base = h.toString(36);
  const len = str.length.toString(36);
  return `${base}-${len}`;
}

export default { hashStr };
