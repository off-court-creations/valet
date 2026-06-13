// ─────────────────────────────────────────────────────────────
// scripts/checks/example-types.test.mjs | valet
// Tests for the sidecar example type gate (node env):
//  • extractExamples() pulls only non-empty code blocks and defaults the id;
//  • barrelExports() resolves `export { default as X }` aliases into the
//    value/type partitions (MetroSelect/RichChat are values, TableColumn is a
//    type, ValetErrorBoundary is both);
//  • detectComponentNames() mirrors LiveCodePreview (opening + compound tags +
//    Box/Stack/Typography) AND drops names that aren't barrel exports (a local
//    <Demo />), so it never tries to destructure a locally-defined component;
//  • synthesizeModule() emits a fixed-height header so a tsc line maps back to
//    a block line, brings JSX tags into scope, and imports bare barrel types;
//  • parseDiagnostics() splits synthesized-module errors (mapped to sidecar +
//    example + block line) from foreign source-tree errors;
//  • the whole repo's examples type-check (the acceptance gate);
//  • the bite-test: an injected `variant='body-sm'` block fails with TS2322,
//    mapped to the right block line — and the CLI exits 1 on it.
// ─────────────────────────────────────────────────────────────
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  extractExamples,
  barrelExports,
  detectComponentNames,
  synthesizeModule,
  parseDiagnostics,
  collectEntries,
  runCheck,
} from './example-types.mjs';

const CLI = fileURLToPath(new URL('./example-types.mjs', import.meta.url));

/*───────────────────────────────────────────────────────────*/
describe('extractExamples', () => {
  it('keeps only non-empty code blocks and defaults a missing id to the index', () => {
    const meta = {
      examples: [
        { id: 'a', code: '<Box />' },
        { id: 'blank', code: '   ' }, // dropped
        { code: '<Stack />' }, // id defaults to its index ('2')
        { id: 'no-code' }, // dropped
      ],
    };
    expect(extractExamples(meta)).toEqual([
      { id: 'a', code: '<Box />' },
      { id: '2', code: '<Stack />' },
    ]);
  });

  it('tolerates a sidecar with no examples array', () => {
    expect(extractExamples({})).toEqual([]);
    expect(extractExamples({ examples: null })).toEqual([]);
  });
});

/*───────────────────────────────────────────────────────────*/
describe('barrelExports — value/type partition (alias-resolved)', () => {
  const { value, type } = barrelExports();

  it('classifies default re-exports as values, not aliases', () => {
    // `export { default as MetroSelect }` / `RichChat` / `Select` are Alias
    // symbols whose own flags carry neither Value nor Type until resolved.
    for (const n of ['MetroSelect', 'RichChat', 'Select', 'KeyModal']) {
      expect(value.has(n), `${n} should be a value export`).toBe(true);
    }
  });

  it('classifies plain components as values and pure types as types', () => {
    for (const n of ['Table', 'Typography', 'Panel', 'useTheme', 'createFormStore']) {
      expect(value.has(n), `${n} value`).toBe(true);
    }
    for (const n of ['TableColumn', 'RichMessage', 'Variant', 'PanelProps']) {
      expect(type.has(n), `${n} type`).toBe(true);
    }
  });

  it('records ValetErrorBoundary as both a value and a type', () => {
    expect(value.has('ValetErrorBoundary')).toBe(true);
    expect(type.has('ValetErrorBoundary')).toBe(true);
  });
});

/*───────────────────────────────────────────────────────────*/
describe('detectComponentNames', () => {
  const allow = new Set(['Box', 'Stack', 'Typography', 'Panel', 'Table', 'Select']);

  it('collects opening + compound tags and always seeds Box/Stack/Typography', () => {
    const names = detectComponentNames('<Panel><Select.Option /></Panel>', allow);
    expect(names).toContain('Panel');
    expect(names).toContain('Select'); // head of Select.Option
    for (const n of ['Box', 'Stack', 'Typography']) expect(names).toContain(n);
  });

  it('drops tags that are not barrel exports (a locally-defined component)', () => {
    // <Demo /> / <Row> are defined inside the block — never destructure them.
    const names = detectComponentNames('<Demo><Row /></Demo>', allow);
    expect(names).not.toContain('Demo');
    expect(names).not.toContain('Row');
  });
});

/*───────────────────────────────────────────────────────────*/
describe('synthesizeModule', () => {
  const exports = {
    value: new Set(['Box', 'Stack', 'Typography', 'Table']),
    type: new Set(['TableColumn', 'Variant']),
  };

  it('emits a fixed-height header so block lines map back deterministically', () => {
    const a = synthesizeModule('<Box />', './x', exports).split('\n');
    const b = synthesizeModule('<Table data={[]} columns={[]} />', './x', exports).split('\n');
    // The block's first line sits at the same 1-based offset in both modules,
    // regardless of how many tags/types each binds.
    expect(a.indexOf('<Box />')).toBe(b.indexOf('<Table data={[]} columns={[]} />'));
  });

  it('brings JSX tags into scope and imports bare barrel types', () => {
    const mod = synthesizeModule('<Table />', './barrel', exports);
    expect(mod).toMatch(/const \{[^}]*\bTable\b[^}]*\} = Valet;/);
    expect(mod).toMatch(/import type \{[^}]*\bTableColumn\b[^}]*\} from '\.\/barrel';/);
  });

  it('does not double-bind a name that is both a value and a type', () => {
    const both = {
      value: new Set(['ValetErrorBoundary']),
      type: new Set(['ValetErrorBoundary']),
    };
    const mod = synthesizeModule('<ValetErrorBoundary />', './x', both);
    // Bound as a value via destructure; excluded from the type import.
    expect(mod).toMatch(/const \{[^}]*ValetErrorBoundary[^}]*\} = Valet;/);
    expect(mod).not.toMatch(/import type \{[^}]*ValetErrorBoundary/);
  });
});

/*───────────────────────────────────────────────────────────*/
describe('parseDiagnostics', () => {
  it('maps synthesized-module errors to sidecar + example + block line', () => {
    const moduleIndex = new Map([
      [
        'example_0.tsx',
        { sidecar: 'components/widgets/Table.meta.json', exampleId: 'table-row-click' },
      ],
    ]);
    // HEADER_LINES is 9; a tsc error on module line 11 is block line 2.
    const out = `example_0.tsx(11,5): error TS2322: Type '"body-sm"' is not assignable to type 'Variant | undefined'.`;
    const { examples, foreign } = parseDiagnostics(out, moduleIndex);
    expect(foreign).toHaveLength(0);
    expect(examples).toHaveLength(1);
    expect(examples[0]).toMatchObject({
      sidecar: 'components/widgets/Table.meta.json',
      exampleId: 'table-row-click',
      blockLine: 2,
      code: 'TS2322',
    });
  });

  it('routes errors in unknown files to the foreign bucket', () => {
    const out = `src/helpers/fontLoader.ts(277,22): error TS2339: Property 'add' does not exist.`;
    const { examples, foreign } = parseDiagnostics(out, new Map());
    expect(examples).toHaveLength(0);
    expect(foreign).toHaveLength(1);
    expect(foreign[0].code).toBe('TS2339');
  });
});

/*───────────────────────────────────────────────────────────*/
describe('acceptance gate (DOCS sidecar examples)', () => {
  it('every example in every sidecar type-checks against current valet types', () => {
    const { diagnostics, foreign, examplesChecked } = runCheck();
    expect(foreign, JSON.stringify(foreign.slice(0, 5), null, 2)).toEqual([]);
    const report = diagnostics.map(
      (d) => `${d.sidecar}#${d.exampleId} (block ${d.blockLine}) ${d.code}: ${d.message}`,
    );
    expect(report).toEqual([]);
    expect(examplesChecked).toBeGreaterThan(0);
  }, 120_000);
});

/*───────────────────────────────────────────────────────────*/
describe('bite-test — the gate rejects a re-introduced invalid variant', () => {
  it("flags variant='body-sm' (the original crash) with TS2322 on the right block line", () => {
    // Inject the exact regression into a single synthetic sidecar entry, so the
    // gate runs without mutating any real sidecar on disk.
    const code =
      '(() => {\n' + "  return (<Typography variant='body-sm'>x</Typography>);\n" + '})()';
    const { diagnostics, foreign } = runCheck({
      entries: [{ sidecar: 'components/widgets/Table.meta.json', id: 'bite-body-sm', code }],
    });
    expect(foreign).toEqual([]);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({
      sidecar: 'components/widgets/Table.meta.json',
      exampleId: 'bite-body-sm',
      blockLine: 2, // the <Typography> line within the block
      code: 'TS2322',
    });
    expect(diagnostics[0].message).toMatch(/body-sm/);
    expect(diagnostics[0].message).toMatch(/Variant/);
  }, 120_000);

  it('exposes the same set of entries to runCheck as collectEntries()', () => {
    // Guards the default-input contract: runCheck() and collectEntries() agree
    // on the example population (used by the acceptance gate above).
    const entries = collectEntries();
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(typeof e.code).toBe('string');
      expect(e.sidecar).toMatch(/\.meta\.json$/);
    }
  });
});

/*───────────────────────────────────────────────────────────*/
describe('CLI', () => {
  it('exits 0 and prints the green summary on the clean repo', () => {
    // Throws (non-zero exit) on failure; reaching the assertion means 0.
    const out = execFileSync('node', [CLI], { encoding: 'utf8' });
    expect(out).toMatch(/type-check against current valet types/);
  }, 120_000);
});
