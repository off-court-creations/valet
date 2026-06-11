// ─────────────────────────────────────────────────────────────
// src/css/compile.test.ts | valet
// compileTemplate — veto interpolations (`false`/null/undefined) are
// dropped at concat, falsy-but-valid values (0, '') survive, function
// interpolations receive the full props object, and ordinary templates
// compile byte-identically to the pre-extraction concat loop.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';

import { compileTemplate, type Interpolation } from './compile';

/** Capture a tagged template's parts so each test reads like real usage. */
function capture<Props>(strings: TemplateStringsArray, ...exprs: Array<Interpolation<Props>>) {
  return { strings, exprs };
}

describe('compileTemplate — veto values are dropped', () => {
  it('drops a literal `false` (the `falsedisplay:flex` bug)', () => {
    const t = capture`${false}display:flex;`;
    expect(compileTemplate(t.strings, t.exprs, {})).toBe('display:flex;');
  });

  it('drops null and undefined', () => {
    const t = capture`a${null}b${undefined}c`;
    expect(compileTemplate(t.strings, t.exprs, {})).toBe('abc');
  });

  it("`${cond && 'color:red'}` vetoes cleanly — no 'false' in the output", () => {
    const cond = false as boolean;
    const t = capture`${cond && 'color:red;'}display:flex;`;
    const out = compileTemplate(t.strings, t.exprs, {});
    expect(out).toBe('display:flex;');
    expect(out).not.toContain('false');
  });

  it('keeps the declaration when the condition holds', () => {
    const cond = true as boolean;
    const t = capture`${cond && 'color:red;'}display:flex;`;
    expect(compileTemplate(t.strings, t.exprs, {})).toBe('color:red;display:flex;');
  });
});

describe('compileTemplate — falsy-but-valid values are preserved', () => {
  it('renders 0', () => {
    const t = capture`margin:${0};flex:${0} ${0} auto;`;
    expect(compileTemplate(t.strings, t.exprs, {})).toBe('margin:0;flex:0 0 auto;');
  });

  it("renders '' (empty string is a no-op, not an error)", () => {
    const t = capture`a${''}b`;
    expect(compileTemplate(t.strings, t.exprs, {})).toBe('ab');
  });
});

describe('compileTemplate — function interpolations', () => {
  it('receives the full props object by reference', () => {
    const seen: unknown[] = [];
    const props = { $size: 4, className: 'x', nested: { deep: true } };
    const t = capture<typeof props>`padding:${(p) => {
      seen.push(p);
      return p.$size;
    }}px;`;
    expect(compileTemplate(t.strings, t.exprs, props)).toBe('padding:4px;');
    expect(seen).toHaveLength(1);
    expect(seen[0]).toBe(props); // same reference, not a clone
  });

  it('applies the same drop/keep rules to function results', () => {
    const t = capture`a${() => false}b${() => null}c${() => undefined}d${() => 0}e${() => ''}f`;
    expect(compileTemplate(t.strings, t.exprs, {})).toBe('abcd0ef');
  });

  it("`${(p) => p.$on && 'color:red'}` vetoes per-props — no 'false' ever", () => {
    const t = capture<{ $on?: boolean }>`${(p) => p.$on && 'color:red;'}display:flex;`;
    const off = compileTemplate(t.strings, t.exprs, { $on: false });
    expect(off).toBe('display:flex;');
    expect(off).not.toContain('false');
    // `$on` omitted → `p.$on && …` is undefined → dropped, same as false
    expect(compileTemplate(t.strings, t.exprs, {})).toBe('display:flex;');
    expect(compileTemplate(t.strings, t.exprs, { $on: true })).toBe('color:red;display:flex;');
  });

  it('nested function results: a fn returning another expression chain', () => {
    const t = capture<{ $w: number; $hide: boolean }>`width:${(p) =>
      p.$hide ? null : `${p.$w}px`};`;
    expect(compileTemplate(t.strings, t.exprs, { $w: 12, $hide: false })).toBe('width:12px;');
    expect(compileTemplate(t.strings, t.exprs, { $w: 12, $hide: true })).toBe('width:;');
  });
});

describe('compileTemplate — characterization vs the pre-extraction loop', () => {
  // Expectation computed by hand from the old createStyled.ts concat
  // (`rawCSS += strings[i]; rawCSS += (fn(props) ?? '') | (piece ?? '')`):
  // 'display:' + 'flex' + ';gap:' + '8' + 'px;width:' + '42' + 'px;'
  it('a normal template produces the identical raw CSS string', () => {
    const t = capture<{ w: number }>`display:${'flex'};gap:${8}px;width:${(p) => p.w}px;`;
    expect(compileTemplate(t.strings, t.exprs, { w: 42 })).toBe('display:flex;gap:8px;width:42px;');
  });

  it('preserves template whitespace and ordering exactly (multi-line)', () => {
    const t = capture`
      color: ${'red'};
      padding: ${4}px;
    `;
    // Old loop output, by hand: leading '\n      color: ' + 'red' +
    // ';\n      padding: ' + '4' + 'px;\n    '
    expect(compileTemplate(t.strings, t.exprs, {})).toBe(
      '\n      color: red;\n      padding: 4px;\n    ',
    );
  });

  it('a template with no interpolations passes through untouched', () => {
    const t = capture`display:flex;`;
    expect(compileTemplate(t.strings, t.exprs, {})).toBe('display:flex;');
  });
});
