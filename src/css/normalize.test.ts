// ─────────────────────────────────────────────────────────────
// src/css/normalize.test.ts | valet
// normalizeCSS characterization — pins the CURRENT regex pipeline
// byte-for-byte, including its known deficiencies. Class hashes are
// computed from this function's output, so any byte of drift here
// changes every generated class name.
//
// PINNED-BUG TRIPWIRES (do not "fix" these expectations piecemeal):
// the quoted-content / url() collapse and the `;;}` / comment misses
// are ENGINE S7's Phase-1 tripwire. S7 replaces the regexes with a
// quote/url-aware scanner and updates these tests in the same commit.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';

import { normalizeCSS } from './normalize';

describe('normalizeCSS — intended behavior', () => {
  it('trims leading/trailing whitespace', () => {
    expect(normalizeCSS('  color: red;  ')).toBe('color: red;');
  });

  it('collapses every whitespace run (spaces/tabs/newlines) to one space', () => {
    expect(normalizeCSS('color: red;\n  display:\tflex;')).toBe('color: red; display: flex;');
  });

  it('drops a `;` directly before `}` (`;}` and `; }`)', () => {
    expect(normalizeCSS('&:hover { color: blue; }')).toBe('&:hover { color: blue}');
    expect(normalizeCSS('&:hover { color: blue;}')).toBe('&:hover { color: blue}');
  });

  it('`;  }` IS caught through the full pipeline — collapse runs first', () => {
    // The `; ?}` regex alone misses two spaces, but `\s+` → ' ' has
    // already run, so the composed function still strips the `;`.
    expect(normalizeCSS('color:red;  }')).toBe('color:red}');
    expect(normalizeCSS('color:red;\t}')).toBe('color:red}');
  });

  it('empty / whitespace-only input → empty string', () => {
    expect(normalizeCSS('')).toBe('');
    expect(normalizeCSS('   \n\t ')).toBe('');
  });

  it('a typical styled() template normalizes to the cache-key shape', () => {
    expect(
      normalizeCSS(`
        display: flex;
        gap: 8px;
      `),
    ).toBe('display: flex; gap: 8px;');
  });
});

describe('normalizeCSS — pinned bugs (ENGINE S7 tripwire, fix in S7 only)', () => {
  it('PINNED BUG: collapses whitespace inside quoted strings (content)', () => {
    // A quote-aware scanner must preserve 'a   b'.
    expect(normalizeCSS("content: 'a   b';")).toBe("content: 'a b';");
  });

  it('PINNED BUG: collapses multi-space font family names', () => {
    expect(normalizeCSS("font-family: 'My   Font', sans-serif;")).toBe(
      "font-family: 'My Font', sans-serif;",
    );
  });

  it('PINNED BUG: `; ?}` fires inside quoted content', () => {
    // `content: '; }'` loses its semicolon — the regex cannot see quotes.
    expect(normalizeCSS("content: '; }';")).toBe("content: '}';");
  });

  it('PINNED BUG: mangles whitespace inside url() tokens (data URIs)', () => {
    expect(normalizeCSS("background: url(data:image/svg+xml,<svg viewBox='0 0  24 24'/>);")).toBe(
      "background: url(data:image/svg+xml,<svg viewBox='0 0 24 24'/>);",
    );
  });

  it('PINNED BUG: `; ?}` fires inside url() payloads', () => {
    expect(normalizeCSS("background: url('data:text/css,a{b:c;}');")).toBe(
      "background: url('data:text/css,a{b:c}');",
    );
  });

  it('PINNED BUG: misses `;;}` — and is therefore not idempotent', () => {
    // Left-to-right scan eats the second `;` only, leaving a fresh `;}`.
    const once = normalizeCSS('a:b;;}');
    expect(once).toBe('a:b;}');
    expect(normalizeCSS(once)).toBe('a:b}'); // second pass keeps rewriting
  });

  it('PINNED BUG: misses `;` separated from `}` by a comment', () => {
    expect(normalizeCSS('a:b;/* c */}')).toBe('a:b;/* c */}');
  });
});

describe('normalizeCSS — extraction is byte-identical to both old copies', () => {
  // The exact bodies removed from createStyled.ts:35–37 (`normalizeCSS`)
  // and stylePresets.ts:23–25 (`normalise`). If the shared module ever
  // drifts from them, every generated class hash silently changes.
  const oldCreateStyledCopy = (css: string): string =>
    css.trim().replace(/\s+/g, ' ').replace(/; ?}/g, '}');
  const oldStylePresetsCopy = (css: string) =>
    css.trim().replace(/\s+/g, ' ').replace(/; ?}/g, '}');

  const samples = [
    '  color: red;  display: flex;  ',
    '\n  color: red;\n  padding: 4px;\n',
    '&:hover { color: blue; }',
    '@media (min-width: 600px) { padding: 8px; }',
    "content: '; }'; font-family: 'My   Font';",
    "background: url('data:text/css,a{b:c;}');",
    'a:b;;}',
    '',
    '   \n\t ',
  ];

  it.each(samples)('matches both removed copies for %j', (css) => {
    expect(normalizeCSS(css)).toBe(oldCreateStyledCopy(css));
    expect(normalizeCSS(css)).toBe(oldStylePresetsCopy(css));
  });
});
