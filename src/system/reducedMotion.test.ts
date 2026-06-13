// ─────────────────────────────────────────────────────────────
// src/system/reducedMotion.test.ts | valet
// A11Y S5 regression gate — every infinite CSS animation in the repo
// must sit behind a prefers-reduced-motion guard so motion-sensitive
// users get a static, still-visible degrade (WCAG 2.3.3 / 2.2.2).
//
// House style mirrors nestedSelectors.test.ts: this is a *source-level*
// gate (jsdom can't prove computed `@media` matching reliably), with
// companion DOM tests (Progress/Parallax) asserting the runtime
// behavior via a matchMedia mock.
//
// Two guard mechanisms are accepted, picked per site:
//   • styled() CSS  → the same styled template must contain a
//     `@media (prefers-reduced-motion: reduce)` block. The infinite
//     `animation:` may be static or returned from an interpolation.
//   • inline JS style (e.g. `style={{ animation: … }}`) → the file must
//     consult `usePrefersReducedMotion` (the JS-branch mechanism), since
//     a styled @media block cannot reach an inline style object.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

/*───────────────────────────────────────────────────────────*/
/* styled('tag')`…` template lexer (shared shape with the S3 gate) */

interface StyledTemplate {
  line: number;
  /** Static chunks, with `;` placeholders standing in for interpolations. */
  css: string;
  /** String-literal contents found inside the interpolations. */
  fragments: string[];
}

function skipString(src: string, i: number, quote: string): number {
  i += 1;
  while (i < src.length) {
    if (src[i] === '\\') i += 2;
    else if (src[i] === quote) return i + 1;
    else if (src[i] === '\n')
      return i; // unterminated on this line (regex/JSX) — bail
    else i += 1;
  }
  return src.length;
}

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
      i += 2;
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
      css += ';';
      continue;
    }
    css += c;
    i += 1;
  }
  throw new Error('unterminated template literal');
}

const STYLED_CALL = /\bstyled\(\s*['"][a-zA-Z][a-zA-Z0-9]*['"]\s*\)/g;

interface ExtractResult {
  templates: StyledTemplate[];
  /** Full source with every styled template body blanked out, so the
      inline-JS scan never re-counts an in-template `infinite`. */
  outsideTemplates: string;
}

function extractStyled(src: string): ExtractResult {
  const templates: StyledTemplate[] = [];
  let outside = '';
  let cursor = 0;
  STYLED_CALL.lastIndex = 0;
  for (let m = STYLED_CALL.exec(src); m; m = STYLED_CALL.exec(src)) {
    let i = skipGenerics(src, m.index + m[0].length);
    while (src[i] === ' ' || src[i] === '\n' || src[i] === '\r' || src[i] === '\t') i += 1;
    if (src[i] !== '`') continue;
    const { end, css, fragments } = lexTemplate(src, i);
    templates.push({ line: src.slice(0, i).split('\n').length, css, fragments });
    outside += src.slice(cursor, i); // keep up to the opening backtick
    cursor = end; // skip the template body
    STYLED_CALL.lastIndex = end;
  }
  outside += src.slice(cursor);
  return { templates, outsideTemplates: outside };
}

/*───────────────────────────────────────────────────────────*/
/* Detectors                                                 */

// Both styled CSS (`animation: ${kf} 1s infinite;`, where the lexer turns the
// `${kf}` interpolation into a `;` placeholder) and inline JS style values
// (`animation: \`${rotate360} 1.4s linear infinite\``, where the interpolation
// `}` breaks a strict run) interpose a separator between the `animation` key
// and the `infinite` keyword. A proximity matcher — `animation` followed by
// `infinite` within a short window — survives both shapes without matching the
// finite `transition:`/`animation: fadeIn 0.2s` cases that have no `infinite`.
const INFINITE = /\banimation\b[^}]{0,160}?\binfinite\b/;
const ITER_INFINITE = /\banimation-iteration-count\s*:\s*infinite\b/;
const REDUCED_GUARD = /@media[^{]*prefers-reduced-motion\s*:\s*reduce/;

/** Does any chunk of a styled template declare an infinite animation? */
function templateHasInfinite(t: StyledTemplate): boolean {
  return [t.css, ...t.fragments].some((s) => INFINITE.test(s) || ITER_INFINITE.test(s));
}

function templateHasGuard(t: StyledTemplate): boolean {
  // Guard text can be static or interpolation-returned; check both.
  return [t.css, ...t.fragments].some((s) => REDUCED_GUARD.test(s));
}

/** Strip comments + string-literal contents so we don't false-positive on
    prose like "animation runs infinite" or the gate's own regex. */
function stripCommentsAndStrings(src: string): string {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') {
      while (i < src.length && src[i] !== '\n') i += 1;
      continue;
    }
    if (c === '/' && src[i + 1] === '*') {
      const close = src.indexOf('*/', i + 2);
      i = close === -1 ? src.length : close + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      out += ' ';
      i = skipString(src, i, c);
      continue;
    }
    out += c;
    i += 1;
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
  kind: 'styled' | 'inline';
  detail: string;
}

function scanRepo() {
  const byFile = new Map<string, ExtractResult>();
  const violations: Violation[] = [];
  for (const file of listSourceFiles(SRC_ROOT)) {
    const rel = relative(SRC_ROOT, file).split(sep).join('/');
    const src = readFileSync(file, 'utf8');
    const result = extractStyled(src);
    byFile.set(rel, result);

    // (a) styled-CSS infinite animations must carry a reduced-motion @media.
    for (const t of result.templates) {
      if (templateHasInfinite(t) && !templateHasGuard(t)) {
        violations.push({
          file: rel,
          kind: 'styled',
          detail: `styled template @ line ${t.line} has an infinite animation but no @media (prefers-reduced-motion: reduce) block`,
        });
      }
    }

    // (b) inline-JS infinite animations (outside any styled template) must be
    // gated by the JS mechanism — the file consults usePrefersReducedMotion.
    // We look at the source with all comments/strings blanked so prose can't
    // false-positive, then require the keyword to come from a real `animation`
    // value. The styled bodies are already excised in `outsideTemplates`.
    const outside = stripCommentsAndStrings(result.outsideTemplates);
    if (INFINITE.test(outside) || ITER_INFINITE.test(outside)) {
      const usesJsGuard = /usePrefersReducedMotion|prefers-reduced-motion/.test(src);
      if (!usesJsGuard) {
        violations.push({
          file: rel,
          kind: 'inline',
          detail:
            'inline-JS infinite animation without a usePrefersReducedMotion / prefers-reduced-motion guard in the file',
        });
      }
    }
  }
  return { byFile, violations };
}

/*───────────────────────────────────────────────────────────*/
/* Suite                                                     */

describe('reduced-motion gate (A11Y S5)', () => {
  it('detector flags an unguarded infinite animation declaration', () => {
    expect(INFINITE.test('animation: spin 1.4s linear infinite')).toBe(true);
    // lexer placeholder shape: `${kf}` becomes `;` between key and value, so
    // a real `animation: ${typingDot} 1s infinite;` lexes to this:
    expect(INFINITE.test('animation: ; 1s infinite;')).toBe(true);
    expect(ITER_INFINITE.test('animation-iteration-count: infinite;')).toBe(true);
    // a finite transition is not an infinite animation
    expect(INFINITE.test('transition: transform 200ms linear;')).toBe(false);
    expect(INFINITE.test('animation: fadeIn 0.2s ease-out;')).toBe(false);
    // `infinite` past the proximity window of an unrelated `animation` mention
    expect(INFINITE.test('animation: fadeIn 0.2s ease-out; ' + 'x'.repeat(200) + ' infinite')).toBe(
      false,
    );
  });

  it('detector recognizes a reduced-motion @media block', () => {
    expect(REDUCED_GUARD.test('@media (prefers-reduced-motion: reduce) {')).toBe(true);
    expect(REDUCED_GUARD.test('@media   (prefers-reduced-motion:reduce){')).toBe(true);
    expect(REDUCED_GUARD.test('@media (min-width: 600px) {')).toBe(false);
  });

  it('extraction canary — the S5 files still yield styled templates', () => {
    const { byFile } = scanRepo();
    expect(byFile.get('components/primitives/Progress.tsx')?.templates.length).toBeGreaterThan(0);
    expect(byFile.get('components/widgets/LLMChat.tsx')?.templates.length).toBeGreaterThan(0);
    expect(byFile.get('components/widgets/RichChat.tsx')?.templates.length).toBeGreaterThan(0);
  });

  it('repo-wide: every infinite animation sits behind a reduced-motion guard', () => {
    const { violations } = scanRepo();
    const report = violations.map((v) => `${v.file} [${v.kind}] — ${v.detail}`);
    expect(report).toEqual([]);
  });

  it('the gate would FAIL on an unguarded infinite styled animation (self-check)', () => {
    // Prove the gate has teeth: an infinite animation with no guard is a
    // violation; adding the @media block clears it.
    const unguarded = extractStyled(
      "const A = styled('div')`\n  animation: ${spin} 1s infinite;\n`;",
    );
    expect(unguarded.templates).toHaveLength(1);
    expect(templateHasInfinite(unguarded.templates[0])).toBe(true);
    expect(templateHasGuard(unguarded.templates[0])).toBe(false);

    const guarded = extractStyled(
      "const A = styled('div')`\n" +
        '  animation: ${spin} 1s infinite;\n' +
        '  @media (prefers-reduced-motion: reduce) { animation: none; }\n' +
        '`;',
    );
    expect(templateHasInfinite(guarded.templates[0])).toBe(true);
    expect(templateHasGuard(guarded.templates[0])).toBe(true);
  });
});
