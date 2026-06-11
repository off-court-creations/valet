// ─────────────────────────────────────────────────────────────
// src/css/normalize.ts | valet
// The one canonical CSS whitespace normalizer (ruling R4 — the name
// `normalizeCSS.ts` is dead). Mechanical extraction of the two
// byte-identical copies that lived at createStyled.ts:35–37
// (`normalizeCSS`) and stylePresets.ts:23–25 (`normalise`).
//
// The regexes are MOVED, not fixed. Known deficiencies are pinned
// AS-IS by normalize.test.ts as ENGINE S7's Phase-1 tripwire:
// • `\s+` collapses whitespace inside quoted strings and url() tokens
//   (corrupts `content`, data URIs, multi-space font names)
// • `; ?}` fires inside quotes/url() and misses `;;}` / `;/* c */}`
// S7 replaces this body with a quote/url-aware scanner and updates
// those tests in the same commit (class hashes change in one release).
//
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────

/** Trim, collapse every whitespace run to one space, drop `;` before `}`. */
export function normalizeCSS(css: string): string {
  return css.trim().replace(/\s+/g, ' ').replace(/; ?}/g, '}');
}
