// ─────────────────────────────────────────────────────────────
// src/css/normalize.test.ts | valet
// Characterization of the ENGINE S7 quote/url()-aware scanner. This
// REPLACES the Phase-0 suite that pinned the old regex pipeline's
// deficiencies as S7's tripwire — those bugs are now fixed, and class
// hashes changed in this release (release-noted; class names were
// never a contract, plan §9 veto register).
//
// Contract pinned here:
// • collapse whitespace runs to one space, trim ends
// • NEVER rewrite bytes inside '…'/"…" strings or url(…) tokens
// • drop `;` runs (with interleaved whitespace) directly before `}`
// • honor backslash escapes; comments collapse but stay inert
// • idempotent: normalizeCSS(normalizeCSS(x)) === normalizeCSS(x)
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';

import { normalizeCSS } from './normalize';

describe('normalizeCSS — plain whitespace', () => {
  it('trims leading/trailing whitespace', () => {
    expect(normalizeCSS('  color: red;  ')).toBe('color: red;');
  });

  it('collapses every whitespace run (spaces/tabs/newlines) to one space', () => {
    expect(normalizeCSS('color: red;\n  display:\tflex;')).toBe('color: red; display: flex;');
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

describe('normalizeCSS — `;` before `}`', () => {
  it('drops `;}`, `; }` and the `;  }` the old regex missed', () => {
    expect(normalizeCSS('&:hover { color: blue; }')).toBe('&:hover { color: blue}');
    expect(normalizeCSS('&:hover { color: blue;}')).toBe('&:hover { color: blue}');
    expect(normalizeCSS('color:red;  }')).toBe('color:red}');
    expect(normalizeCSS('color:red;\t\n}')).toBe('color:red}');
  });

  it('drops the WHOLE run — `;;}` and `; ; }` (old regex left `;}` behind)', () => {
    expect(normalizeCSS('a:b;;}')).toBe('a:b}');
    expect(normalizeCSS('a:b; ; }')).toBe('a:b}');
    expect(normalizeCSS('a:b;;;\n;}')).toBe('a:b}');
  });

  it('a space pending from BEFORE the run still flushes ahead of `}`', () => {
    expect(normalizeCSS('color: blue ; }')).toBe('color: blue }');
  });

  it('keeps `;` when not before `}` (including `;;` mid-declaration)', () => {
    expect(normalizeCSS('a:b; c:d;')).toBe('a:b; c:d;');
    expect(normalizeCSS('a:b;;c:d')).toBe('a:b;;c:d');
  });

  it('keeps `;` separated from `}` by a comment (deliberate: comments are inert)', () => {
    expect(normalizeCSS('a:b;/* c */}')).toBe('a:b;/* c */}');
  });
});

describe('normalizeCSS — quoted strings are byte-preserved', () => {
  it('preserves runs of spaces inside \'single\' and "double" quotes', () => {
    expect(normalizeCSS("content: 'a   b';")).toBe("content: 'a   b';");
    expect(normalizeCSS('content: "a \t b";')).toBe('content: "a \t b";');
  });

  it('preserves multi-space font family names', () => {
    expect(normalizeCSS("font-family: 'My   Font', sans-serif;")).toBe(
      "font-family: 'My   Font', sans-serif;",
    );
  });

  it('`;` / `; }` inside quotes never trigger the semicolon rule', () => {
    expect(normalizeCSS("content: '; }';")).toBe("content: '; }';");
    expect(normalizeCSS('content: ";;}";')).toBe('content: ";;}";');
  });

  it('an escaped quote does not close the string', () => {
    expect(normalizeCSS("content: 'don\\'t   stop';")).toBe("content: 'don\\'t   stop';");
  });

  it('the other quote kind inside a string is plain content', () => {
    expect(normalizeCSS('content: \'say "hi   there"\';')).toBe('content: \'say "hi   there"\';');
  });

  it('an unterminated string is preserved verbatim to the end', () => {
    expect(normalizeCSS("content: 'a   b")).toBe("content: 'a   b");
  });

  it('whitespace AROUND a string still collapses', () => {
    expect(normalizeCSS("content:   'a  b'   ;")).toBe("content: 'a  b' ;");
  });
});

describe('normalizeCSS — url() tokens are byte-preserved', () => {
  it('preserves whitespace inside url() payloads (data URIs)', () => {
    expect(normalizeCSS("background: url(data:image/svg+xml,<svg viewBox='0 0  24 24'/>);")).toBe(
      "background: url(data:image/svg+xml,<svg viewBox='0 0  24 24'/>);",
    );
  });

  it('`;}` inside url() payloads never triggers the semicolon rule', () => {
    expect(normalizeCSS("background: url('data:text/css,a{b:c;}');")).toBe(
      "background: url('data:text/css,a{b:c;}');",
    );
  });

  it('a quoted `)` inside url() does not close the token', () => {
    expect(normalizeCSS('background: url("a )  b");')).toBe('background: url("a )  b");');
  });

  it('an escaped `\\)` does not close an unquoted url()', () => {
    expect(normalizeCSS('background: url(a\\)  b);')).toBe('background: url(a\\)  b);');
  });

  it('matches url( case-insensitively', () => {
    expect(normalizeCSS("background: URL('a   b');")).toBe("background: URL('a   b');");
  });

  it('does NOT treat other functions ending in `url(` as url tokens', () => {
    // `curl(` is an ordinary function: its whitespace collapses.
    expect(normalizeCSS('mask: curl(a   b);')).toBe('mask: curl(a b);');
  });

  it('whitespace after url() still collapses', () => {
    expect(normalizeCSS('background: url(x.png)   no-repeat;')).toBe(
      'background: url(x.png) no-repeat;',
    );
  });
});

describe('normalizeCSS — comments', () => {
  it('collapses whitespace inside comments (matching the old global collapse)', () => {
    expect(normalizeCSS('a:b; /* c    d */ e:f;')).toBe('a:b; /* c d */ e:f;');
  });

  it("a quote inside a comment never opens a string (/* don't */)", () => {
    expect(normalizeCSS("/* don't */ a:b;   c:d;")).toBe("/* don't */ a:b; c:d;");
  });

  it('an unterminated comment keeps its content (trailing whitespace trimmed)', () => {
    expect(normalizeCSS('a:b; /* dangling   ')).toBe('a:b; /* dangling');
  });
});

describe('normalizeCSS — escapes in plain context', () => {
  it('a backslash-escaped space survives (CSS identifier escapes)', () => {
    expect(normalizeCSS('.a\\ b { color: red }')).toBe('.a\\ b { color: red }');
  });

  it('a trailing lone backslash is kept', () => {
    expect(normalizeCSS('a:b\\')).toBe('a:b\\');
  });
});

describe('normalizeCSS — idempotence (normalize ∘ normalize = normalize)', () => {
  const samples = [
    '  color: red;  display: flex;  ',
    '\n  color: red;\n  padding: 4px;\n',
    '&:hover { color: blue; }',
    '@media (min-width: 600px) { padding: 8px; }',
    "content: '; }'; font-family: 'My   Font';",
    'content: "a \t b";',
    "content: 'don\\'t   stop';",
    "content: 'a   b", // unterminated string
    "background: url('data:text/css,a{b:c;}');",
    "background: url(data:image/svg+xml,<svg viewBox='0 0  24 24'/>);",
    'background: url("a )  b");',
    'background: url(a\\)  b);',
    'a:b;;}',
    'a:b; ; }',
    'a:b;;c:d',
    'a:b;/* c */}',
    'a:b; /* c    d */ e:f;',
    "/* don't */ a:b;   c:d;",
    'a:b; /* dangling   ',
    '.a\\ b { color: red }',
    'a:b\\',
    'color: blue ; }',
    '',
    '   \n\t ',
    `
      display: flex;
      gap: 8px;
      &::after { content: '  ::  '; }
      @media (hover: hover) { &:hover { filter: brightness(1.25); } }
    `,
  ];

  it.each(samples)('normalize(normalize(%j)) === normalize(%j)', (css) => {
    const once = normalizeCSS(css);
    expect(normalizeCSS(once)).toBe(once);
  });
});
