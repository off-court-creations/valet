// ─────────────────────────────────────────────────────────────
// src/css/hash.ts  | valet
// Siphash-based hash util for stable class names
// ─────────────────────────────────────────────────────────────
import * as siphash from 'siphash';

const KEY = siphash.string16_to_key('valet-hash-key!1');

export function hashStr(str: string): string {
  return siphash.hash_uint(KEY, str).toString(36);
}
