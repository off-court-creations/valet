// ─────────────────────────────────────────────────────────────
// scripts/checks/example-types.mjs | valet
// DOCS S? — sidecar example type gate (`npm run check:examples`).
//
// The runtime crash class this closes: every `examples[].code` block in a
// `src/components/**/*.meta.json` sidecar is *untype-checked JSON*. The docs
// site (docs/src/components/LiveCodePreview.tsx) compiles each block live with
// @babel/standalone and renders it — Babel strips the TS annotations and runs
// the JS, so a block that references a non-existent prop or an invalid literal
// (e.g. <Typography variant='body-sm'> — 'body-sm' is not a Variant) sails
// through the build and white-screens the docs page at runtime
// (Typography reads theme.typography[variant].md unguarded → TypeError).
//
// This gate type-checks those blocks against the CURRENT valet types, FROM
// SOURCE. For each example it synthesizes a `.tsx` module that mirrors the
// LiveCodePreview contract exactly:
//
//   • `React` is in scope (examples call React.useState / React.useMemo …);
//   • the full valet barrel is imported as `Valet` (examples reference
//     Valet.useTheme / Valet.createFormStore …) and every JSX tag the block
//     uses is destructured from it (so an unknown component fails to compile);
//   • `theme` is in scope, typed exactly as the runtime injects it
//     (`useTheme().theme`), because some blocks read a bare `theme`;
//   • the block (an IIFE, a bare arrow component, or a JSX literal — all three
//     forms occur) becomes the return of a function whose declared result type
//     is `JSX.Element | React.FC | React.ReactNode`. That union is the
//     "renders to a valid React tree" contract LiveCodePreview enforces at
//     call time (isValidElement → element, typeof fn → component, else node),
//     so a CORRECT block of any form passes while a type error anywhere in the
//     block body still surfaces.
//
// All synthesized modules are type-checked by ONE tsc program (fast) driven by
// a dedicated tsconfig that EXTENDS the repo's src tsconfig and re-includes
// `src` — so the source's own ambient declarations (src/types/fontface.d.ts),
// @types/node and the DOM lib resolve identically to `npm run typecheck:src`,
// and the source itself stays clean. `noUnusedLocals`/`noUnusedParameters` are
// turned off so the relaxed example patterns (an unused `setV`, a destructured-
// but-unused component) don't read as failures.
//
// tsc diagnostics are mapped back to the originating sidecar file + example id
// (and the line WITHIN the block) via a per-module line table.
//
// CLI:  node scripts/checks/example-types.mjs          → exit 1 on any error
//       node scripts/checks/example-types.mjs --keep   → leave the synthesized
//                                                         modules on disk (debug)
// ─────────────────────────────────────────────────────────────
import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..');
const COMPONENTS_ROOT = join(REPO_ROOT, 'src', 'components');
// Synthesized modules live UNDER the repo so node_modules (react types) and the
// src ambient .d.ts resolve; the dir name is dot-prefixed and git-ignored-shaped.
const WORK_DIR = join(HERE, '.examples-typecheck');
const TSC_BIN = join(REPO_ROOT, 'node_modules', '.bin', 'tsc');

/*───────────────────────────────────────────────────────────*/
/* Sidecar discovery + extraction                            */

/** Recursively collect every `*.meta.json` under src/components. */
export function listMetaFiles(dir = COMPONENTS_ROOT) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listMetaFiles(full));
      continue;
    }
    if (entry.name.endsWith('.meta.json')) out.push(full);
  }
  return out.sort();
}

/**
 * Extract every code example from a parsed sidecar. Returns
 * `{ id, code }[]` for examples that carry a non-empty `code` string.
 * `id` falls back to the array index when a sidecar omits it.
 */
export function extractExamples(meta) {
  const examples = Array.isArray(meta?.examples) ? meta.examples : [];
  const out = [];
  examples.forEach((ex, i) => {
    if (ex && typeof ex.code === 'string' && ex.code.trim() !== '') {
      out.push({ id: typeof ex.id === 'string' && ex.id ? ex.id : String(i), code: ex.code });
    }
  });
  return out;
}

/*───────────────────────────────────────────────────────────*/
/* Barrel export names (the runtime `scope` keys)            */

let _barrelExports = null;

/**
 * The named exports of the valet barrel (src/index.ts), derived from SOURCE via
 * the TypeScript API (typescript is already a dev dependency), partitioned into
 * `{ value, type }` name sets (a name like `ValetErrorBoundary` is in both).
 *
 * `value` is the static equivalent of the docs runtime's
 * `hasOwnProperty(Valet, name)` guard: only real barrel VALUES are destructured
 * into a synthesized module, so a PascalCase identifier the block defines
 * LOCALLY (a `const Demo`, a `type Row`) is never mistaken for a missing export.
 *
 * `type` drives a synthesized `import type { … }` so a block that references a
 * barrel TYPE by its bare name (e.g. `const cols: TableColumn<Row>[]`,
 * `RichMessage[]`) — exactly as a user copying the snippet would — resolves.
 *
 * Cached for the process lifetime.
 */
export function barrelExports() {
  if (_barrelExports) return _barrelExports;
  const require = createRequire(import.meta.url);
  const ts = require('typescript');
  const tsconfigPath = join(REPO_ROOT, 'tsconfig.json');
  const cfg = ts.readConfigFile(tsconfigPath, ts.sys.readFile).config;
  const parsed = ts.parseJsonConfigFileContent(cfg, ts.sys, REPO_ROOT);
  const barrel = join(REPO_ROOT, 'src', 'index.ts');
  const program = ts.createProgram([barrel], parsed.options);
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(barrel);
  const symbols = sf ? checker.getExportsOfModule(checker.getSymbolAtLocation(sf)) : [];
  const TYPE_FLAGS =
    ts.SymbolFlags.Type |
    ts.SymbolFlags.Interface |
    ts.SymbolFlags.TypeAlias |
    ts.SymbolFlags.Enum |
    ts.SymbolFlags.TypeParameter;
  const value = new Set();
  const type = new Set();
  for (const s of symbols) {
    const name = s.getName();
    // `export { default as X }` produces an Alias symbol whose own flags carry
    // neither Value nor Type — resolve it to the real declaration's flags.
    const resolved = s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s;
    if (resolved.flags & ts.SymbolFlags.Value) value.add(name);
    if (resolved.flags & TYPE_FLAGS) type.add(name);
  }
  _barrelExports = { value, type };
  return _barrelExports;
}

/** Back-compat shim: the set of barrel VALUE names (the runtime `scope` keys). */
export function barrelExportNames() {
  return barrelExports().value;
}

/*───────────────────────────────────────────────────────────*/
/* Component-name detection (mirrors docs LiveCodePreview)   */

/**
 * The JSX tags a block uses, restricted to names that are actually valet barrel
 * members, so each can be safely destructured from `Valet`. Mirrors
 * LiveCodePreview.detectComponentNames (opening tags `<Foo …>` plus the head of
 * compound tags `<Foo.Bar>`, with Box/Stack/Typography as a safety net) AND its
 * runtime `scope` guard: tags the block defines locally (`<Demo />`) are dropped
 * rather than destructured. `allow` defaults to the live barrel export set.
 */
export function detectComponentNames(code, allow = barrelExportNames()) {
  const names = new Set();
  const tagRe = /<([A-Z][A-Za-z0-9]*)\b/gm;
  for (let m = tagRe.exec(code); m; m = tagRe.exec(code)) names.add(m[1]);
  const compoundRe = /<([A-Z][A-Za-z0-9]*)\.[A-Za-z0-9_]+\b/gm;
  for (let m = compoundRe.exec(code); m; m = compoundRe.exec(code)) names.add(m[1]);
  for (const n of ['Box', 'Stack', 'Typography']) names.add(n);
  return [...names].filter((n) => allow.has(n));
}

/*───────────────────────────────────────────────────────────*/
/* Module synthesis                                          */

// Header lines that precede the example block in every synthesized module.
// Kept at a FIXED line count (HEADER_LINES) regardless of content so a tsc
// line number maps back to a line WITHIN the original block
// (blockLine = tscLine - HEADER_LINES). The value/type binding lists are folded
// onto single lines to preserve that invariant.
const MODULE_HEADER = (importPath, valueBindings, typeImports) => [
  `import * as React from 'react';`,
  `import * as Valet from '${importPath}';`,
  // Bare barrel TYPE names a block may reference (TableColumn, RichMessage, …).
  typeImports.length
    ? `import type { ${typeImports.join(', ')} } from '${importPath}';`
    : `// (no bare barrel type references)`,
  // JSX components the block uses, brought into bare scope from the namespace.
  valueBindings.length ? `const { ${valueBindings.join(', ')} } = Valet;` : `// (no valet tags)`,
  // 'theme' mirrors the value LiveCodePreview injects: useTheme().theme.
  `const theme = Valet.useTheme().theme;`,
  `void React; void theme; void (Valet as unknown);`,
  // The result union is the "renders to a valid React tree" contract the docs
  // runtime enforces (element | component fn | node), accepting all three
  // block forms while still type-checking the block body below.
  `type __Result = React.JSX.Element | React.FC | React.ReactNode;`,
  `function __example(): __Result {`,
  `  return (`,
];

// 1-based source line where the example block's first line lands.
const HEADER_LINES = MODULE_HEADER('x', [], []).length;
const FOOTER = [`  );`, `}`, `void __example;`];

/**
 * Synthesize one `.tsx` module string for a block. `importPath` is the POSIX
 * relative path (from WORK_DIR) to the valet barrel source. `exports` is the
 * partitioned barrel name set from {@link barrelExports}.
 */
export function synthesizeModule(code, importPath, exports = barrelExports()) {
  const valueBindings = detectComponentNames(code, exports.value);
  // Import every barrel type name EXCEPT those already bound as values above
  // (only `ValetErrorBoundary` overlaps) — a name can't be declared twice.
  const valueSet = new Set(valueBindings);
  const typeImports = [...exports.type].filter((n) => !valueSet.has(n)).sort();
  const header = MODULE_HEADER(importPath, valueBindings, typeImports);
  return [...header, code, ...FOOTER].join('\n') + '\n';
}

/*───────────────────────────────────────────────────────────*/
/* tsc orchestration                                         */

const DIAG_RE = /^(.+?)\((\d+),(\d+)\):\s+error\s+(TS\d+):\s+(.*)$/;

/**
 * Parse tsc's `file(line,col): error TSxxxx: message` output into structured
 * diagnostics. Only diagnostics whose file is one of our synthesized modules
 * are example failures; anything else (a source-tree error) is surfaced
 * separately so the gate never silently swallows a broken source build.
 */
export function parseDiagnostics(stdout, moduleIndex) {
  const examples = [];
  const foreign = [];
  for (const raw of stdout.split('\n')) {
    const line = raw.trimEnd();
    const m = DIAG_RE.exec(line);
    if (!m) continue;
    const [, file, lineNo, col, ts, message] = m;
    const base = file.split(/[\\/]/).pop();
    const entry = moduleIndex.get(base);
    if (!entry) {
      foreign.push({ file, line: Number(lineNo), code: ts, message });
      continue;
    }
    examples.push({
      sidecar: entry.sidecar,
      exampleId: entry.exampleId,
      blockLine: Number(lineNo) - HEADER_LINES,
      tsLine: Number(lineNo),
      col: Number(col),
      code: ts,
      message,
    });
  }
  return { examples, foreign };
}

/**
 * Read every sidecar and flatten its examples into
 * `{ sidecar, id, code }[]` — the default input to {@link runCheck}.
 */
export function collectEntries() {
  const out = [];
  for (const file of listMetaFiles()) {
    let meta;
    try {
      meta = JSON.parse(readFileSync(file, 'utf8'));
    } catch (e) {
      throw new Error(`Failed to parse ${file}: ${e.message}`);
    }
    const sidecar = relative(REPO_ROOT, file).split(sep).join('/');
    for (const ex of extractExamples(meta)) out.push({ sidecar, id: ex.id, code: ex.code });
  }
  return out;
}

/**
 * Build every synthesized module on disk, run ONE tsc program over them, and
 * return parsed diagnostics. Side-effect free w.r.t. the caller's cwd.
 *
 * `entries` ({ sidecar, id, code }[]) defaults to every example in every
 * sidecar; passing an explicit list lets a test type-check an injected block
 * (e.g. the body-sm bite-test) without mutating any real sidecar on disk.
 *
 * Returns { modulesWritten, examplesChecked, sidecarsChecked, diagnostics,
 *           foreign, raw }.
 *
 * @param {{ keep?: boolean, entries?: { sidecar: string, id: string, code: string }[] }} [opts]
 */
export function runCheck({ keep = false, entries } = {}) {
  const list = entries ?? collectEntries();
  rmSync(WORK_DIR, { recursive: true, force: true });
  mkdirSync(WORK_DIR, { recursive: true });

  // Barrel import path, POSIX, relative to WORK_DIR.
  const barrel = join(REPO_ROOT, 'src', 'index');
  const importPath = relative(WORK_DIR, barrel).split(sep).join('/');

  const moduleIndex = new Map(); // basename -> { sidecar, exampleId }
  const sidecars = new Set();
  let idx = 0;
  for (const ex of list) {
    sidecars.add(ex.sidecar);
    const base = `example_${idx}.tsx`;
    idx += 1;
    moduleIndex.set(base, { sidecar: ex.sidecar, exampleId: ex.id });
    writeFileSync(join(WORK_DIR, base), synthesizeModule(ex.code, importPath), 'utf8');
  }
  const examplesChecked = idx;
  const sidecarsChecked = sidecars.size;

  // Dedicated tsconfig: EXTENDS the repo src tsconfig (identical lib/jsx/strict
  // + ambient src .d.ts via re-including ../../../src), with the unused-binding
  // checks relaxed for the example patterns.
  // Paths are relative to WORK_DIR (scripts/checks/.examples-typecheck), which
  // is three levels below the repo root.
  const tsconfig = {
    extends: '../../../tsconfig.json',
    compilerOptions: {
      noEmit: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
    },
    // Re-include src so its ambient declarations resolve exactly as in the
    // src build; '*.tsx' is every synthesized example module.
    include: ['../../../src', '*.tsx'],
  };
  const tsconfigPath = join(WORK_DIR, 'tsconfig.json');
  writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n', 'utf8');

  let raw = '';
  try {
    raw = execFileSync(TSC_BIN, ['-p', tsconfigPath], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (e) {
    // tsc exits non-zero when it reports diagnostics; its output is on stdout.
    raw = `${e.stdout || ''}${e.stderr || ''}`;
  }

  const { examples: diagnostics, foreign } = parseDiagnostics(raw, moduleIndex);

  if (!keep) rmSync(WORK_DIR, { recursive: true, force: true });

  return {
    modulesWritten: idx,
    examplesChecked,
    sidecarsChecked,
    diagnostics,
    foreign,
    raw,
  };
}

/*───────────────────────────────────────────────────────────*/
/* CLI                                                       */

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

if (isMain) {
  const keep = process.argv.includes('--keep');
  const { examplesChecked, sidecarsChecked, diagnostics, foreign } = runCheck({ keep });

  if (foreign.length > 0) {
    console.error(
      `\n✗ check:examples: the valet source tree did not type-check ` +
        `(${foreign.length} error${foreign.length === 1 ? '' : 's'}) — the example ` +
        `gate cannot run against a broken source build:\n`,
    );
    for (const f of foreign.slice(0, 20)) {
      console.error(`    ${f.file}:${f.line} → ${f.code}: ${f.message}`);
    }
    process.exit(1);
  }

  if (diagnostics.length > 0) {
    // Group by sidecar + example for a readable report.
    const byKey = new Map();
    for (const d of diagnostics) {
      const key = `${d.sidecar}#${d.exampleId}`;
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key).push(d);
    }
    console.error(
      `\n✗ check:examples: ${diagnostics.length} type ` +
        `error${diagnostics.length === 1 ? '' : 's'} in ` +
        `${byKey.size} sidecar example${byKey.size === 1 ? '' : 's'}:\n`,
    );
    for (const [key, ds] of byKey) {
      const [sidecar, exampleId] = key.split('#');
      console.error(`  ${sidecar} → example '${exampleId}':`);
      for (const d of ds) {
        const at = d.blockLine >= 1 ? `block line ${d.blockLine}` : `module line ${d.tsLine}`;
        console.error(`      ${at}, col ${d.col} → ${d.code}: ${d.message}`);
      }
    }
    console.error(
      `\n  These blocks render live in the docs (LiveCodePreview) and will\n` +
        `  TypeError/white-screen at runtime. Fix them against the current\n` +
        `  valet types (e.g. a valid Typography variant, an existing prop).\n`,
    );
    process.exit(1);
  }

  console.log(
    `✓ check:examples: ${examplesChecked} examples across ${sidecarsChecked} ` +
      `sidecars type-check against current valet types.`,
  );
}
