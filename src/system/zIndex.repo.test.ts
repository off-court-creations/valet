// ─────────────────────────────────────────────────────────────
// src/system/zIndex.repo.test.ts | valet
// OVERLAY S7 regression gate — every overlaying layer stacks on the
// single TS-defined scale in `zIndex.ts`, never on an ad-hoc literal.
//
// The scan walks every non-test .ts/.tsx under src/ and rejects any
// literal z-index value ≥ 1000 (CSS `z-index: 1500` or JS inline
// `zIndex: 1500`) anywhere except `src/system/zIndex.ts` itself, the
// one place the scale's numbers are allowed to live. Layers below
// 1000 (local stacking contexts like `z-index: 5`, `zIndex: 1`,
// `z-index: -1`) are not part of the overlay scale and are left
// alone — the floor matches Q3's scale (fab 1050 is the lowest tier).
//
// Modelled on nestedSelectors.test.ts: a source-level lexer, not
// computed styles, so it catches a regression at review time
// regardless of whether the rule is ever injected in jsdom.
// ─────────────────────────────────────────────────────────────
import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { VALET_ZINDEX, zVar, zIndexVarName } from './zIndex';

/*───────────────────────────────────────────────────────────*/
/* z-index literal scan                                       */

/**
 * Match a `z-index` (CSS) or `zIndex` (JS) assignment to a bare numeric
 * literal: `z-index: 1500`, `z-index:1500;`, `zIndex: 1500`,
 * `zIndex: '1500'`. Values inside `var(...)`, `calc(...)`, function
 * calls (`zVar('fab')`) or token references never match — those have a
 * non-digit (a letter, `(`, `-` of `--var`, or quote-then-letter)
 * before the first digit. We capture the literal integer and let the
 * caller apply the ≥ 1000 threshold.
 */
const ZINDEX_LITERAL = /\bz-?index\b\s*[:=]\s*['"]?(-?\d+)/gi;

interface Violation {
  file: string;
  line: number;
  value: number;
  text: string;
}

const SRC_ROOT = fileURLToPath(new URL('..', import.meta.url));
/** The scale module is the one place the numbers are allowed to live. */
const SCALE_FILE = 'system/zIndex.ts';
/** Any literal at or above this floor must route through the scale. */
const FLOOR = 1000;

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

function lineOf(src: string, index: number): number {
  return src.slice(0, index).split('\n').length;
}

function scanFile(rel: string, src: string): Violation[] {
  const out: Violation[] = [];
  ZINDEX_LITERAL.lastIndex = 0;
  for (let m = ZINDEX_LITERAL.exec(src); m; m = ZINDEX_LITERAL.exec(src)) {
    const value = Number(m[1]);
    if (Math.abs(value) < FLOOR) continue;
    out.push({ file: rel, line: lineOf(src, m.index), value, text: m[0] });
  }
  return out;
}

function scanRepo(): { files: string[]; violations: Violation[] } {
  const files: string[] = [];
  const violations: Violation[] = [];
  for (const file of listSourceFiles(SRC_ROOT)) {
    const rel = relative(SRC_ROOT, file).split(sep).join('/');
    files.push(rel);
    if (rel === SCALE_FILE) continue;
    violations.push(...scanFile(rel, readFileSync(file, 'utf8')));
  }
  return { files, violations };
}

/*───────────────────────────────────────────────────────────*/
/* Suite                                                     */

describe('z-index scale (OVERLAY S7)', () => {
  it('keeps the layers strictly ordered low → high', () => {
    const order: Array<keyof typeof VALET_ZINDEX> = [
      'fab',
      'appbar',
      'modalBackdrop',
      'modal',
      'dropdown',
      'snackbar',
      'tooltip',
    ];
    const values = order.map((k) => VALET_ZINDEX[k]);
    expect(values).toEqual([1050, 1100, 1390, 1400, 1450, 1500, 1600]);
    for (let i = 1; i < values.length; i += 1) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });

  it('zVar emits var(--valet-zindex-<kebab>, <fallback>) with the scale value', () => {
    expect(zVar('fab')).toBe('var(--valet-zindex-fab, 1050)');
    expect(zVar('modalBackdrop')).toBe('var(--valet-zindex-modal-backdrop, 1390)');
    expect(zVar('tooltip')).toBe('var(--valet-zindex-tooltip, 1600)');
    expect(zIndexVarName('modalBackdrop')).toBe('--valet-zindex-modal-backdrop');
  });

  it('the literal scanner flags numeric z-index ≥ 1000 but not vars/calc/sub-1000', () => {
    expect(scanFile('x.tsx', 'z-index: 1500;')).toHaveLength(1);
    expect(scanFile('x.tsx', "zIndex: '10000',")).toHaveLength(1);
    expect(scanFile('x.tsx', 'z-index: 5;')).toHaveLength(0);
    expect(scanFile('x.tsx', 'zIndex: 1,')).toHaveLength(0);
    expect(scanFile('x.tsx', 'z-index: -1;')).toHaveLength(0);
    // vars / helper calls / calc never carry a bare literal after the colon
    expect(scanFile('x.tsx', 'z-index: var(--valet-zindex-modal, 1400);')).toHaveLength(0);
    expect(scanFile('x.tsx', "z-index: ${zVar('snackbar')};")).toHaveLength(0);
    expect(scanFile('x.tsx', 'z-index: ${`calc(${zVar(`modal`)} - 1)`};')).toHaveLength(0);
  });

  it('extraction canary — the scan reaches real source files', () => {
    const { files } = scanRepo();
    expect(files).toContain('components/layout/AppBar.tsx');
    expect(files).toContain('components/widgets/Snackbar.tsx');
    expect(files).toContain('components/widgets/Tooltip.tsx');
    expect(files.length).toBeGreaterThan(50);
  });

  it('repo-wide: no literal z-index ≥ 1000 outside zIndex.ts', () => {
    // Overlaying layers (AppBar 1100, Snackbar 1500, Tooltip 1600,
    // Modal 1390/1400, Drawer, Select dropdown 1450, SpeedDial fab
    // 1050, LoadingBackdrop) all route through zVar(...) so the order
    // lives in exactly one file. Any new hardcoded ≥1000 literal fails.
    const { violations } = scanRepo();
    const report = violations.map((v) => `${v.file}:${v.line} → ${v.text} (=${v.value})`);
    expect(report).toEqual([]);
  });
});
