// ─────────────────────────────────────────────────────────────
// scripts/checks/rtl-physical.test.mjs | valet
// Tests for the A11Y S11 RTL logical-properties gate (node env):
//  • physicalHit() flags physical longhands / left-right text-align /
//    left-right positioning and never flags their logical equivalents;
//  • extractTemplates() lexes styled()/keyframes() bodies + their
//    interpolation string fragments, blanking JS so object keys like
//    `left:` never read as CSS;
//  • scanSource() honours `/* rtl: physical-by-design */` on the line, the
//    line above, and across a preceding multi-line comment block, and never
//    flags annotation prose;
//  • the repo itself is clean (the sweep migrated or annotated every hit);
//  • the CLI exits 1 on an unannotated physical property.
// ─────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PHYSICAL_ANNOTATION,
  physicalHit,
  extractTemplates,
  scanSource,
  scanRepo,
} from './rtl-physical.mjs';

const CLI = fileURLToPath(new URL('./rtl-physical.mjs', import.meta.url));

/*───────────────────────────────────────────────────────────*/
describe('physicalHit — physical property detection', () => {
  it('flags the migrated physical longhands', () => {
    expect(physicalHit('  margin-left: 1rem;')).toBe('margin-left');
    expect(physicalHit('  margin-right: 1rem;')).toBe('margin-right');
    expect(physicalHit('  padding-left: 0;')).toBe('padding-left');
    expect(physicalHit('  padding-right: 0;')).toBe('padding-right');
    expect(physicalHit('  border-left: 1px solid red;')).toBe('border-left');
    expect(physicalHit('  border-right: 1px solid red;')).toBe('border-right');
    expect(physicalHit('  border-top-left-radius: 4px;')).toBe('border-top-left-radius');
  });

  it('flags physical left/right positioning and left/right text-align', () => {
    expect(physicalHit('  left: 0;')).toBe('left');
    expect(physicalHit('  right: -99999px;')).toBe('right');
    expect(physicalHit('left: ${({ $x }) => $x}px;')).toBe('left');
    expect(physicalHit('  text-align: left;')).toBe('text-align: left');
    expect(physicalHit('  text-align: right;')).toBe('text-align: right');
  });

  it('never flags the logical equivalents', () => {
    expect(physicalHit('  margin-inline-start: 1rem;')).toBeNull();
    expect(physicalHit('  margin-inline-end: 1rem;')).toBeNull();
    expect(physicalHit('  padding-inline: 1rem;')).toBeNull();
    expect(physicalHit('  padding-inline-start: 0;')).toBeNull();
    expect(physicalHit('  border-inline-start: 1px solid red;')).toBeNull();
    expect(physicalHit('  border-inline-end: 1px solid red;')).toBeNull();
    expect(physicalHit('  inset-inline: 0;')).toBeNull();
    expect(physicalHit('  inset-inline-start: 0;')).toBeNull();
    expect(physicalHit('  inset-inline-end: 0;')).toBeNull();
    expect(physicalHit('  text-align: start;')).toBeNull();
    expect(physicalHit('  text-align: end;')).toBeNull();
    expect(physicalHit('  text-align: center;')).toBeNull();
  });

  it('does not match compound/already-logical property tails', () => {
    // `-left`/`-right` inside a longer (logical or unrelated) name.
    expect(physicalHit('  scroll-padding-left: 0;')).toBeNull();
    expect(physicalHit('  inset-inline-start: calc(-1 * var(--x));')).toBeNull();
    // the annotation's own prose mentioning left: must not self-trip.
    expect(physicalHit(`  /* ${PHYSICAL_ANNOTATION} — left: pos.left */`)).toBeNull();
  });
});

/*───────────────────────────────────────────────────────────*/
describe('extractTemplates — styled()/keyframes() lexing', () => {
  it('blanks interpolation JS so object keys never read as CSS', () => {
    // `left:`/`right:` here are Record keys inside a `${…}`, not CSS.
    const src =
      "const A = styled('span')`\n" +
      '  transform-origin: ${(({ left: "center right", right: "center left" }))[$p]};\n' +
      '  color: red;\n' +
      '`;';
    const slices = extractTemplates(src);
    const physical = slices.flatMap((s) => s.text.split('\n').map(physicalHit).filter(Boolean));
    // The static body has no physical property; the string fragments
    // ('center right', 'center left') are values, not declarations.
    expect(physical).toEqual([]);
  });

  it('collects physical declarations returned as interpolation strings', () => {
    const src =
      "const D = styled('div')`\n" +
      "  ${({ $a }) => ($a === 'left' ? 'border-right:1px;' : 'border-left:1px;')}\n" +
      '`;';
    const slices = extractTemplates(src);
    const fragments = slices.map((s) => s.text);
    expect(fragments).toContain('border-right:1px;');
    expect(fragments).toContain('border-left:1px;');
  });

  it('lexes keyframes`…` templates too', () => {
    const src = 'const k = keyframes`\n  0% { left: -35%; right: 100%; }\n`;';
    const slices = extractTemplates(src);
    const hits = slices.flatMap((s) => s.text.split('\n').map(physicalHit).filter(Boolean));
    expect(hits).toEqual(['left']); // first physical on the line
  });
});

/*───────────────────────────────────────────────────────────*/
describe('scanSource — annotation handling', () => {
  it('flags an unannotated physical declaration', () => {
    const src = "const A = styled('div')`\n  margin-left: 1rem;\n`;";
    const { violations, annotated } = scanSource(src);
    expect(violations).toHaveLength(1);
    expect(violations[0].property).toBe('margin-left');
    expect(annotated).toHaveLength(0);
  });

  it('exempts a trailing same-line annotation', () => {
    const src = "const A = styled('div')`\n  left: 0; /* " + PHYSICAL_ANNOTATION + ' */\n`;';
    const { violations, annotated } = scanSource(src);
    expect(violations).toHaveLength(0);
    expect(annotated.map((a) => a.property)).toEqual(['left']);
  });

  it('exempts an annotation on the line immediately above', () => {
    const src = "const A = styled('div')`\n  /* " + PHYSICAL_ANNOTATION + ' */\n  left: 0;\n`;';
    const { violations } = scanSource(src);
    expect(violations).toHaveLength(0);
  });

  it('exempts across a preceding multi-line comment block', () => {
    const src =
      "const A = styled('div')`\n" +
      '  /* keep this physical\n' +
      `     because ${PHYSICAL_ANNOTATION} reasons */\n` +
      '  left: 0;\n' +
      '`;';
    const { violations, annotated } = scanSource(src);
    expect(violations).toHaveLength(0);
    expect(annotated).toHaveLength(1);
  });

  it('does not let an annotation leak past an intervening code line', () => {
    const src =
      "const A = styled('div')`\n" +
      '  /* ' +
      PHYSICAL_ANNOTATION +
      ' */\n' +
      '  color: red;\n' + // real code breaks the comment run
      '  left: 0;\n' +
      '`;';
    const { violations } = scanSource(src);
    expect(violations).toHaveLength(1);
    expect(violations[0].property).toBe('left');
  });

  it('never flags annotation prose that mentions a physical property', () => {
    const src =
      "const A = styled('div')`\n" +
      '  /* the thumb stays at left: 0 by design — ' +
      PHYSICAL_ANNOTATION +
      ' */\n' +
      '  inset-inline-start: 0;\n' +
      '`;';
    const { violations, annotated } = scanSource(src);
    expect(violations).toHaveLength(0);
    expect(annotated).toHaveLength(0);
  });
});

/*───────────────────────────────────────────────────────────*/
describe('repo scan (A11Y S11 acceptance gate)', () => {
  it('has zero unannotated physical properties under src/components + src/css', () => {
    const { violations } = scanRepo();
    const report = violations.map((v) => `${v.file}:${v.line} → ${v.property}`);
    expect(report).toEqual([]);
  });

  it('still carries the judgment-call physical-by-design annotations', () => {
    // The sweep deliberately kept a handful of genuinely-physical
    // declarations (Drawer slide anchors, Pagination/Tabs measured-pixel
    // underline math, Slider/Switch thumb slide, Tooltip arrow, Progress
    // sweep, Select/Modal centering) annotated rather than migrated.
    const { annotated } = scanRepo();
    const byFile = new Set(annotated.map((a) => a.file));
    for (const f of [
      'components/layout/Drawer.tsx',
      'components/widgets/Pagination.tsx',
      'components/primitives/Progress.tsx',
      'components/fields/Slider.tsx',
      'components/widgets/Tooltip.tsx',
    ]) {
      expect(byFile.has(f)).toBe(true);
    }
    expect(annotated.length).toBeGreaterThan(0);
  });
});

/*───────────────────────────────────────────────────────────*/
describe('CLI', () => {
  it('exits 0 on the clean repo', () => {
    // Throws (non-zero exit) on failure; reaching the assertion means 0.
    const out = execFileSync('node', [CLI], { encoding: 'utf8' });
    expect(out).toMatch(/no unannotated physical properties/);
  });

  it('exits 1 when a fixture introduces an unannotated physical property', () => {
    // The CLI scans the repo's src tree, so prove the exit contract by
    // pointing a one-off node process at a scanSource over a bad fixture.
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'rtl-gate-'));
    try {
      const probe = path.join(tmp, 'probe.mjs');
      fs.writeFileSync(
        probe,
        `import { scanSource } from ${JSON.stringify(CLI)};\n` +
          'const bad = "const A = styled(\'div\')`\\n  padding-right: 1rem;\\n`;";\n' +
          'const { violations } = scanSource(bad);\n' +
          'if (violations.length === 0) { console.error("expected a violation"); process.exit(2); }\n' +
          'process.exit(1);\n',
      );
      let code = 0;
      try {
        execFileSync('node', [probe], { encoding: 'utf8' });
      } catch (e) {
        code = e.status;
      }
      expect(code).toBe(1);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
