// ─────────────────────────────────────────────────────────────
// src/css/nestedSelectors.test.ts | valet
// ENGINE S3 regression gate — no nested rule inside a styled()
// template may start with a bare type selector (`th {`, `input {`,
// `tbody tr {`). Relaxed CSS nesting (ident-led nested selectors)
// needs Chrome 120/Safari 17.2; prefixing `& ` parses from
// Chrome 112/Safari 16.5 with identical semantics, which is the
// browser floor the README support statement advertises.
//
// The scan covers every non-test .ts/.tsx under src/: each
// styled('tag')`…` template is lexed out of the source, its static
// chunks are checked as CSS, and every string literal inside its
// interpolations (the `$cond ? 'tbody tr {…}' : ''` pattern) is
// checked as a CSS fragment too. jsdom's nesting support is
// unreliable, so this gate works on sources, not computed styles.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/*───────────────────────────────────────────────────────────*/
/* Template extraction (source-level lexer)                  */

interface StyledTemplate {
  /** 1-based line of the opening backtick. */
  line: number;
  /** Static chunks joined with `;` placeholders per interpolation. */
  css: string;
  /** String-literal contents found inside the interpolations. */
  fragments: string[];
}

/** Advance past a quoted string; `i` points at the opening quote. */
function skipString(src: string, i: number, quote: string): number {
  i += 1;
  while (i < src.length) {
    if (src[i] === '\\') i += 2;
    else if (src[i] === quote) return i + 1;
    else i += 1;
  }
  throw new Error('unterminated string literal');
}

/** Advance past an optional `<…>` generic argument list. */
function skipGenerics(src: string, i: number): number {
  if (src[i] !== '<') return i;
  let depth = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"') {
      i = skipString(src, i, c);
      continue;
    }
    if (c === '=' && src[i + 1] === '>') {
      i += 2; // arrow in a function type — its `>` is not a closer
      continue;
    }
    if (c === '<') depth += 1;
    if (c === '>') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  throw new Error('unterminated generic argument list');
}

/** Lex a template literal; `start` points at the opening backtick. */
function lexTemplate(
  src: string,
  start: number,
): { end: number; css: string; fragments: string[] } {
  let css = '';
  const fragments: string[] = [];
  let i = start + 1;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') {
      css += c + (src[i + 1] ?? '');
      i += 2;
      continue;
    }
    if (c === '`') return { end: i + 1, css, fragments };
    if (c === '$' && src[i + 1] === '{') {
      i = lexInterpolation(src, i + 2, fragments);
      css += ';'; // placeholder — terminates any selector/declaration run
      continue;
    }
    css += c;
    i += 1;
  }
  throw new Error('unterminated template literal');
}

/** Lex `${…}`; collects string/template literal contents into `fragments`. */
function lexInterpolation(src: string, i: number, fragments: string[]): number {
  let depth = 1;
  while (i < src.length) {
    const c = src[i];
    if (c === "'" || c === '"') {
      const end = skipString(src, i, c);
      fragments.push(src.slice(i + 1, end - 1));
      i = end;
      continue;
    }
    if (c === '`') {
      const nested = lexTemplate(src, i);
      fragments.push(nested.css, ...nested.fragments);
      i = nested.end;
      continue;
    }
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      i = close === -1 ? src.length : close + 2;
      continue;
    }
    if (c === '{') depth += 1;
    if (c === '}') {
      depth -= 1;
      if (depth === 0) return i + 1;
    }
    i += 1;
  }
  throw new Error('unterminated interpolation');
}

const STYLED_CALL = /\bstyled\(\s*['"][a-zA-Z][a-zA-Z0-9]*['"]\s*\)/g;

/** Extract every styled('tag')`…` template from a source file. */
function extractStyledTemplates(src: string): StyledTemplate[] {
  const out: StyledTemplate[] = [];
  STYLED_CALL.lastIndex = 0;
  for (let m = STYLED_CALL.exec(src); m; m = STYLED_CALL.exec(src)) {
    let i = skipGenerics(src, m.index + m[0].length);
    while (src[i] === ' ' || src[i] === '\n' || src[i] === '\r' || src[i] === '\t') i += 1;
    if (src[i] !== '`') continue; // styled(...) without a tagged template
    const { end, css, fragments } = lexTemplate(src, i);
    out.push({ line: src.slice(0, i).split('\n').length, css, fragments });
    STYLED_CALL.lastIndex = end;
  }
  return out;
}

/*───────────────────────────────────────────────────────────*/
/* Selector analysis                                         */

/** Split a selector list on top-level commas only. */
function splitSelectorList(selector: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const c of selector) {
    if (c === '(' || c === '[') depth += 1;
    else if (c === ')' || c === ']') depth -= 1;
    if (c === ',' && depth === 0) {
      parts.push(cur.trim());
      cur = '';
    } else cur += c;
  }
  parts.push(cur.trim());
  return parts.filter(Boolean);
}

/**
 * Every selector opening a `{…}` block inside a styled template is a
 * nested rule (the engine wraps the whole body in `.z-hash{…}`), so
 * each comma part must start with a symbol (`&`, `@media`, `.x`,
 * `:hover`, `[attr]`, `>`, `+`, `~`, `*`) — never a bare ident.
 */
function bareTypeSelectors(cssText: string): string[] {
  const css = cssText.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const out: string[] = [];
  let run = '';
  for (const c of css) {
    if (c === '{') {
      for (const part of splitSelectorList(run)) {
        if (/^[a-zA-Z]/.test(part)) out.push(part);
      }
      run = '';
    } else if (c === '}' || c === ';') {
      run = '';
    } else {
      run += c;
    }
  }
  return out;
}

/*───────────────────────────────────────────────────────────*/
/* Repo scan                                                 */

const SRC_ROOT = fileURLToPath(new URL('..', import.meta.url));

function listSourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listSourceFiles(full));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (/\.test\.(ts|tsx)$/.test(entry.name) || entry.name.endsWith('.d.ts')) continue;
    out.push(full);
  }
  return out;
}

interface Violation {
  file: string;
  line: number;
  selector: string;
}

function scanRepo() {
  const templatesByFile = new Map<string, StyledTemplate[]>();
  const violations: Violation[] = [];
  for (const file of listSourceFiles(SRC_ROOT)) {
    const rel = relative(SRC_ROOT, file).split(sep).join('/');
    const templates = extractStyledTemplates(readFileSync(file, 'utf8'));
    if (templates.length === 0) continue;
    templatesByFile.set(rel, templates);
    for (const t of templates) {
      for (const text of [t.css, ...t.fragments]) {
        for (const selector of bareTypeSelectors(text)) {
          violations.push({ file: rel, line: t.line, selector });
        }
      }
    }
  }
  return { templatesByFile, violations };
}

/*───────────────────────────────────────────────────────────*/
/* Suite                                                     */

describe('styled templates — `& `-prefixed nested selectors (ENGINE S3)', () => {
  it('flags ident-led nested selectors and accepts symbol-led ones', () => {
    expect(
      bareTypeSelectors(`
        display: flex;
        input[type='radio']:focus-visible + [data-indicator] { outline: none; }
      `),
    ).toEqual(["input[type='radio']:focus-visible + [data-indicator]"]);
    expect(
      bareTypeSelectors(`
        & input[type='radio']:focus-visible + [data-indicator] { outline: none; }
        &:hover { color: red; }
        &::after { content: ''; }
        @media (hover: hover) { &:hover { filter: brightness(1.25); } }
        [data-x] { color: red; }
        > td { color: red; }
      `),
    ).toEqual([]);
  });

  it('checks every comma part of a selector list independently', () => {
    expect(bareTypeSelectors('th, td { padding: 0; }')).toEqual(['th', 'td']);
    expect(bareTypeSelectors('& th, td { padding: 0; }')).toEqual(['td']);
    expect(bareTypeSelectors('& th, & td { padding: 0; }')).toEqual([]);
    // commas inside :not()/:nth-of-type() never split the list
    expect(bareTypeSelectors('& th:not(:last-child, :first-child) { border: 0; }')).toEqual([]);
  });

  it('ignores declarations, comments and interpolation placeholders', () => {
    const tpl = extractStyledTemplates(
      "const A = styled('div')<{ $w: string }>`\n" +
        '  /* th { not a rule } */\n' +
        '  width: calc(100% - ${({ $w }) => $w} * 2);\n' +
        '`;',
    );
    expect(tpl).toHaveLength(1);
    expect(bareTypeSelectors(tpl[0].css)).toEqual([]);
  });

  it('sees through interpolation-returned CSS fragments (Table pattern)', () => {
    const bad = extractStyledTemplates(
      "const T = styled('table')`\n" +
        '  ${({ $striped }) =>\n' +
        '    $striped\n' +
        '      ? `\n' +
        '    tbody tr:nth-of-type(odd) td { background: red; }\n' +
        '  `\n' +
        "      : ''}\n" +
        "  ${({ $click }) => ($click ? 'tbody tr { cursor: pointer; }' : '')}\n" +
        '`;',
    );
    expect(bad).toHaveLength(1);
    const flagged = bad[0].fragments.flatMap(bareTypeSelectors);
    expect(flagged).toEqual(['tbody tr:nth-of-type(odd) td', 'tbody tr']);
  });

  it('extraction canary — the S3 files still yield styled templates', () => {
    const { templatesByFile } = scanRepo();
    expect(templatesByFile.get('components/fields/RadioGroup.tsx')?.length).toBeGreaterThan(0);
    expect(templatesByFile.get('components/fields/Checkbox.tsx')?.length).toBeGreaterThan(0);
    expect(templatesByFile.get('components/widgets/Table.tsx')?.length).toBeGreaterThan(0);
    const total = [...templatesByFile.values()].reduce((n, t) => n + t.length, 0);
    expect(total).toBeGreaterThan(50); // repo-wide extraction is alive
  });

  it('repo-wide: no nested rule in any styled template starts with a bare type selector', () => {
    // Bare type selectors in nested rules need relaxed CSS nesting
    // (Chrome 120/Safari 17.2) and silently drop their rule on
    // Chrome 112–119/Safari 16.5–17.1; the fix is prefixing `& `.
    // The repo is clean as of Wave 0.3 (RadioGroup/Checkbox/Table in
    // the ENGINE S3 lane; Video/Pagination as its gate follow-up) —
    // any NEW bare selector anywhere fails this gate.
    const { violations } = scanRepo();
    const report = violations.map((v) => `${v.file} → ${v.selector}`);
    expect(report).toEqual([]);
  });
});
