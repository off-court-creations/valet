// ─────────────────────────────────────────────────────────────
// src/css/normalize.ts | valet
// The one canonical CSS whitespace normalizer (ruling R4). ENGINE S7
// replaced the old regex pipeline (`.trim().replace(/\s+/g, ' ')
// .replace(/; ?}/g, '}')`) with this small token-aware scanner. The
// regexes corrupted quoted `content` strings, data URIs, and
// multi-space font names, fired inside quotes/url(), missed `;;}`,
// and were not idempotent.
//
// Guarantees:
// • whitespace runs collapse to one space — EXCEPT inside '…'/"…"
//   strings and url(…) tokens, whose bytes are preserved verbatim
// • leading/trailing whitespace is trimmed
// • a run of `;` (with interleaved whitespace) directly before `}` is
//   dropped: `;}`, `; }`, `;  }`, `;;}`, `; ; }` all become `}`
//   (a `;` separated from `}` by a comment is deliberately kept)
// • backslash escapes are honored everywhere (`\'` does not close a
//   string, `\)` does not close a url(), `\ ` survives in selectors)
// • comment bodies (`/* … */`) collapse like plain CSS, but quotes
//   inside them never toggle string state
// • idempotent: normalizeCSS(normalizeCSS(x)) === normalizeCSS(x)
//
// Class hashes are computed from this function's output, so the S7
// rewrite changed every generated class name in one release
// (release-noted; class names were never a contract — plan §9 veto
// register: "normalize rewrite changes every generated class hash").
//
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────

/** ASCII whitespace (CSS whitespace + \v, matching the old `\s` intent). */
function isWS(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '\f' || c === '\v';
}

/** Chars that can end a CSS identifier — used to reject `curl(` as url(. */
function isIdentChar(c: string): boolean {
  return /[a-zA-Z0-9_-]/.test(c) || c === '\\';
}

/**
 * Normalize CSS for cache keys + injection: collapse whitespace and drop
 * `;` runs before `}` — without ever rewriting bytes inside quoted
 * strings or url(…) tokens. Idempotent.
 */
export function normalizeCSS(css: string): string {
  const n = css.length;
  let out = '';
  let pendingSpace = false;
  let i = 0;

  /** Emit the single collapsed space for a pending whitespace run (trims at start). */
  const flush = (): void => {
    if (pendingSpace) {
      if (out !== '') out += ' ';
      pendingSpace = false;
    }
  };

  /**
   * Copy verbatim (escape-aware) from `from` through the next unescaped
   * `close` char. Returns the index after `close` (or `n` if unterminated —
   * the remainder is preserved as-is, which keeps the function idempotent).
   */
  const copyVerbatimUntil = (from: number, close: string): number => {
    let j = from;
    while (j < n) {
      const c = css[j];
      if (c === '\\' && j + 1 < n) {
        out += c + css[j + 1];
        j += 2;
        continue;
      }
      out += c;
      j += 1;
      if (c === close) return j;
    }
    return j;
  };

  /**
   * Copy a `url(…)` token verbatim from the `url(` opener at `from`.
   * Quoted payloads may contain `)`, so string state is tracked; escapes
   * (`\)`) never close the token. Returns the index after `)`.
   */
  const copyUrl = (from: number): number => {
    out += css.slice(from, from + 4); // `url(` in its original casing
    let j = from + 4;
    while (j < n) {
      const c = css[j];
      if (c === '\\' && j + 1 < n) {
        out += c + css[j + 1];
        j += 2;
        continue;
      }
      if (c === "'" || c === '"') {
        out += c;
        j = copyVerbatimUntil(j + 1, c);
        continue;
      }
      out += c;
      j += 1;
      if (c === ')') return j;
    }
    return j;
  };

  // Copy a comment from the `/*` at `from` through its closing delimiter,
  // collapsing internal whitespace runs (like the old global collapse) but
  // interpreting nothing else — quotes inside comments never open a string.
  const copyComment = (from: number): number => {
    out += '/*';
    let j = from + 2;
    let sp = false;
    while (j < n) {
      const c = css[j];
      if (isWS(c)) {
        sp = true;
        j += 1;
        continue;
      }
      if (sp) {
        out += ' ';
        sp = false;
      }
      if (c === '*' && css[j + 1] === '/') {
        out += '*/';
        return j + 2;
      }
      out += c;
      j += 1;
    }
    return j; // unterminated: trailing whitespace dropped, content kept
  };

  /** True when `url(` (any casing) starts at `i` as its own token. */
  const isUrlOpen = (at: number): boolean =>
    css.slice(at, at + 4).toLowerCase() === 'url(' && (at === 0 || !isIdentChar(css[at - 1]));

  while (i < n) {
    const ch = css[i];

    if (isWS(ch)) {
      pendingSpace = true;
      i += 1;
      continue;
    }

    if (ch === "'" || ch === '"') {
      flush();
      out += ch;
      i = copyVerbatimUntil(i + 1, ch);
      continue;
    }

    if (ch === '/' && css[i + 1] === '*') {
      flush();
      i = copyComment(i);
      continue;
    }

    if ((ch === 'u' || ch === 'U') && isUrlOpen(i)) {
      flush();
      i = copyUrl(i);
      continue;
    }

    if (ch === ';') {
      /* Look past further `;` and whitespace: if the next significant
         char is `}`, the whole run is dead — drop it (whitespace inside
         the dropped run is dropped too; a space pending from BEFORE the
         run still flushes ahead of the `}`). */
      let j = i + 1;
      while (j < n && (css[j] === ';' || isWS(css[j]))) j += 1;
      if (j < n && css[j] === '}') {
        i = j;
        continue;
      }
      flush();
      out += ';';
      i += 1;
      continue;
    }

    if (ch === '\\' && i + 1 < n) {
      flush();
      out += ch + css[i + 1];
      i += 2;
      continue;
    }

    flush();
    out += ch;
    i += 1;
  }

  return out;
}
