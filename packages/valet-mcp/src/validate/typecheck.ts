// ─────────────────────────────────────────────────────────────
// packages/valet-mcp/src/validate/typecheck.ts  | valet-mcp
// Type-check an in-memory valet JSX/TSX snippet against the SHIPPED
// @archway/valet types and return structured diagnostics.
//
// This is the runtime engine behind the `valet__validate_jsx` tool. It is a
// parameterized port of scripts/checks/example-types.mjs (the sidecar-example
// type gate): that gate synthesizes a `.tsx` mirroring the docs LiveCodePreview
// contract, imports the valet barrel, destructures the JSX tags a block uses,
// and runs ONE tsc program — so an invented prop, a wrong literal union, or an
// unknown component fails to compile. The corpus structurally cannot catch any
// of those; this can.
//
// Two things change versus the gate, both required for an MCP tool:
//
//   1. Valet is resolved from the INSTALLED `@archway/valet` (its `.d.mts`),
//      not the repo `src`. The tool ships inside the server package; a consumer
//      who only has the published install must get the same answer. We resolve
//      the package's own node_modules first (the published shape) and fall back
//      to the repo built dist / src when running from the workspace — mirroring
//      shared.ts's bundled-data candidate-list resolver. The resolved valet is
//      version-locked to the server it documents (versionParity): the package
//      depends on `@archway/valet` at the matching range.
//
//   2. The snippet is an arbitrary in-memory string, not a sidecar example. We
//      drive a long-lived in-process TypeScript LanguageService over a single
//      VIRTUAL TSX file (its contents served from memory; nothing is written to
//      disk, while node_modules / @types resolve exactly as for the package
//      build) rather than spawning `tsc`. A LanguageService is used over a
//      one-shot Program for two reasons: it exposes typed SUGGESTION
//      diagnostics — TS6385 `'x' is deprecated` — which a still-type-valid
//      deprecated alias (Table's `selectable`, `rowKey`) only ever produces as
//      a suggestion, never an error; and it incrementally reuses the parsed
//      valet type graph across calls, so only the first call pays the parse.
//
// Latency: the valet `.d.mts` + react/zustand/etc. type graph dominates the
// FIRST call (~0.4–0.6s cold); the service caches it, so subsequent (warm)
// calls are ~0.1s. Well under the tool's interactive budget.
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import type * as TS from 'typescript';

const requireFromHere = createRequire(import.meta.url);
// typescript is a runtime dependency of this package (it must run at tool time).
const ts = requireFromHere('typescript') as typeof TS;

/*───────────────────────────────────────────────────────────*/
/* Valet type resolution (published install → repo fallback)  */

export type ValetResolution = {
  /** Absolute path to the valet `.d.mts` (or `.d.ts` / `src/index.ts`). */
  typesPath: string;
  /** How it was found — for diagnostics / the tool's text summary. */
  source: 'package-exports' | 'package-entry' | 'repo-dist' | 'repo-src';
};

/**
 * Resolve the valet types to type-check against. Layered, most-published first:
 *
 *   1. `require.resolve('@archway/valet/package.json')` from this package, then
 *      read `exports['.'].types` — the authoritative published types entry.
 *   2. `require.resolve('@archway/valet')` and derive the sibling `.d.mts`.
 *   3. The repo's built `dist/index.d.mts` (workspace, package not installed).
 *   4. The repo `src/index.ts` (last resort; lets the tool answer before a build).
 *
 * (1)/(2) are the published shape — valet resolves from THIS package's own
 * node_modules. (3)/(4) mirror shared.ts's pkgRoot walk for the in-repo run.
 */
export function resolveValetTypes(): ValetResolution {
  // (1) exports['.'].types — the published contract.
  try {
    const pjPath = requireFromHere.resolve('@archway/valet/package.json');
    const pkg = JSON.parse(fs.readFileSync(pjPath, 'utf8')) as {
      exports?: { '.'?: { types?: string } };
      types?: string;
    };
    const typesRel = pkg.exports?.['.']?.types ?? pkg.types;
    if (typesRel) {
      const abs = path.resolve(path.dirname(pjPath), typesRel);
      if (fs.existsSync(abs)) return { typesPath: abs, source: 'package-exports' };
    }
  } catch {
    // not installed as a real package here; fall through
  }

  // (2) bare specifier → sibling declaration file.
  try {
    const entry = requireFromHere.resolve('@archway/valet'); // .../dist/index.mjs
    for (const cand of [
      entry.replace(/\.mjs$/, '.d.mts'),
      entry.replace(/\.js$/, '.d.ts'),
      entry.replace(/\.cjs$/, '.d.cts'),
    ]) {
      if (cand !== entry && fs.existsSync(cand)) {
        return { typesPath: cand, source: 'package-entry' };
      }
    }
  } catch {
    // fall through to repo layout
  }

  // (3)/(4) workspace fallbacks, relative to this file (dist/validate or src/validate).
  const here = path.dirname(fileURLToPath(import.meta.url));
  // <repoRoot>/packages/valet-mcp/{dist,src}/validate → up 4 to <repoRoot>.
  const repoRoot = path.resolve(here, '..', '..', '..', '..');
  const distDts = path.join(repoRoot, 'dist', 'index.d.mts');
  if (fs.existsSync(distDts)) return { typesPath: distDts, source: 'repo-dist' };
  const srcIndex = path.join(repoRoot, 'src', 'index.ts');
  if (fs.existsSync(srcIndex)) return { typesPath: srcIndex, source: 'repo-src' };

  throw new Error(
    'Unable to resolve @archway/valet types for validation. Install @archway/valet ' +
      'in the MCP server package, or run from the valet workspace with a built dist.',
  );
}

/*───────────────────────────────────────────────────────────*/
/* Barrel export enumeration (the destructurable names)       */

export type BarrelExports = { value: Set<string>; type: Set<string> };

const barrelCache = new Map<string, BarrelExports>();

/**
 * The named exports of the resolved valet module, partitioned into value names
 * (destructured as JSX tags) and type names (imported as `import type`). Read
 * from the resolved declaration file via the TS API — published-safe (it never
 * touches repo src) — and cached per resolved path for the process lifetime.
 */
export function valetBarrelExports(typesPath: string): BarrelExports {
  const cached = barrelCache.get(typesPath);
  if (cached) return cached;

  const program = ts.createProgram([typesPath], {
    noEmit: true,
    skipLibCheck: true,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2020,
  });
  const checker = program.getTypeChecker();
  const sf = program.getSourceFile(typesPath);
  const moduleSym = sf ? checker.getSymbolAtLocation(sf) : undefined;
  const symbols = moduleSym ? checker.getExportsOfModule(moduleSym) : [];
  const TYPE_FLAGS =
    ts.SymbolFlags.Type |
    ts.SymbolFlags.Interface |
    ts.SymbolFlags.TypeAlias |
    ts.SymbolFlags.Enum |
    ts.SymbolFlags.TypeParameter;
  const value = new Set<string>();
  const type = new Set<string>();
  for (const s of symbols) {
    const name = s.getName();
    const resolved = s.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(s) : s;
    if (resolved.flags & ts.SymbolFlags.Value) value.add(name);
    if (resolved.flags & TYPE_FLAGS) type.add(name);
  }
  const out: BarrelExports = { value, type };
  barrelCache.set(typesPath, out);
  return out;
}

/**
 * The PascalCase JSX tags a snippet uses that are real valet barrel values, so
 * each can be destructured from the namespace. Mirrors example-types /
 * LiveCodePreview detectComponentNames: opening tags `<Foo …>` plus the head of
 * compound tags `<Foo.Bar>`, filtered to actual barrel members so a locally
 * defined `<Demo />` is never mistaken for a missing export.
 */
export function detectValetTags(code: string, allow: Set<string>): string[] {
  const names = new Set<string>();
  const tagRe = /<([A-Z][A-Za-z0-9]*)\b/gm;
  for (let m = tagRe.exec(code); m; m = tagRe.exec(code)) names.add(m[1]);
  const compoundRe = /<([A-Z][A-Za-z0-9]*)\.[A-Za-z0-9_]+\b/gm;
  for (let m = compoundRe.exec(code); m; m = compoundRe.exec(code)) names.add(m[1]);
  return [...names].filter((n) => allow.has(n));
}

/*───────────────────────────────────────────────────────────*/
/* Module synthesis (fixed-height header → line remapping)    */

// Header lines preceding the snippet, at a FIXED count so a TS line number maps
// back to a 1-based line WITHIN the snippet (snippetLine = tsLine - HEADER_LINES).
function moduleHeader(
  importPath: string,
  valueBindings: string[],
  typeImports: string[],
): string[] {
  return [
    `import * as React from 'react';`,
    `import * as Valet from '${importPath}';`,
    typeImports.length
      ? `import type { ${typeImports.join(', ')} } from '${importPath}';`
      : `// (no bare valet type references)`,
    valueBindings.length
      ? `const { ${valueBindings.join(', ')} } = Valet;`
      : `// (no valet tags detected)`,
    // 'theme' mirrors what the docs runtime injects (useTheme().theme) so a
    // snippet that reads a bare `theme` resolves.
    `const theme = Valet.useTheme().theme;`,
    `void React; void theme; void (Valet as unknown);`,
    // The result union is the "renders to a valid React tree" contract
    // (element | component fn | node) — accepts a JSX literal, a bare arrow
    // component, or an IIFE while still type-checking the body.
    `type __Result = React.JSX.Element | React.FC | React.ReactNode;`,
    `function __snippet(): __Result {`,
    `  return (`,
  ];
}

const HEADER_LINES = moduleHeader('x', [], []).length;
const FOOTER = ['  );', '}', 'void __snippet;'];

export type SynthResult = { text: string; valueBindings: string[]; typeImports: string[] };

/**
 * Build the virtual `.tsx` text for a snippet. `imports`, when given, overrides
 * the auto-detected tag bindings (the tool's optional explicit `deps`). The
 * valet import specifier is always the bare `@archway/valet` — tsc maps it to
 * the resolved declaration file via a `paths` entry (see {@link typeCheckSnippet}).
 */
export function synthesizeSnippetModule(
  code: string,
  barrel: BarrelExports,
  imports?: string[],
): SynthResult {
  const requested = imports?.length
    ? imports.filter((n) => barrel.value.has(n))
    : detectValetTags(code, barrel.value);
  const valueBindings = [...new Set(requested)];
  const valueSet = new Set(valueBindings);
  // Every barrel type name except those already bound as values (a name can't
  // be declared twice) — so a snippet may reference a bare type (TableColumn…).
  const typeImports = [...barrel.type].filter((n) => !valueSet.has(n)).sort();
  const header = moduleHeader('@archway/valet', valueBindings, typeImports);
  const text = [...header, code, ...FOOTER].join('\n') + '\n';
  return { text, valueBindings, typeImports };
}

/*───────────────────────────────────────────────────────────*/
/* In-process type-check                                      */

export type Severity = 'error' | 'warning' | 'suggestion' | 'message';

export type SnippetDiagnostic = {
  /** 1-based line WITHIN the snippet (<= 0 means it landed in the synthesized header/footer). */
  line: number;
  /** 1-based column within that line. */
  col: number;
  /** TypeScript diagnostic code, e.g. "TS2322". */
  code: string;
  /** Flattened human-readable message. */
  message: string;
  severity: Severity;
  /** True when this diagnostic reports use of a `@deprecated` symbol (TS6385). */
  deprecated: boolean;
};

export type ValidateResult = {
  ok: boolean;
  diagnostics: SnippetDiagnostic[];
  valetSource: ValetResolution['source'];
  valetTypesPath: string;
  importedTags: string[];
  /** Wall-clock ms for the type-check (program build + diagnostics). */
  elapsedMs: number;
};

function severityOf(category: TS.DiagnosticCategory): Severity {
  switch (category) {
    case ts.DiagnosticCategory.Error:
      return 'error';
    case ts.DiagnosticCategory.Warning:
      return 'warning';
    case ts.DiagnosticCategory.Suggestion:
      return 'suggestion';
    default:
      return 'message';
  }
}

// The virtual snippet file lives INSIDE the package dir so node_modules /
// @types resolve up the tree exactly as for the package build. Nothing is
// written to disk — the LanguageServiceHost serves its contents from memory.
const VIRTUAL_DIR = path.dirname(fileURLToPath(import.meta.url));
const VIRTUAL_FILE = path.join(VIRTUAL_DIR, '__valet_validate_snippet__.tsx');

let cachedResolution: ValetResolution | null = null;

function getResolution(): ValetResolution {
  if (!cachedResolution) cachedResolution = resolveValetTypes();
  return cachedResolution;
}

/**
 * `paths` entries pinning `react` (and its JSX-runtime subpaths) to the
 * `@types/react` THIS package ships, so they resolve to ONE React type identity
 * for both the synthesized snippet AND valet's own `.d.mts`.
 *
 * Why this is load-bearing (and not in-repo-visible): valet's published `.d.mts`
 * imports `react`/`zustand`/etc. by bare specifier. In a published consumer
 * install those resolve relative to valet's OWN location — and a consumer who
 * has `react` (a runtime peer of valet) but no hoisted `@types/react` gets
 * valet's React resolving to the untyped `react/index.js` (implicit `any`),
 * while the snippet — sitting next to this package's bundled `@types/react` —
 * resolves a DIFFERENT, typed React. Two React identities ⇒ JSX attribute
 * checking against valet's component props silently collapses to permissive,
 * so an invented prop / a wrong `onClick` type / a bad union are NOT flagged
 * (false negatives). In the monorepo a single hoisted `@types/react` masks this,
 * which is why it only surfaces against the shipped layout. Pinning `react` to
 * the bundled `@types/react` for ALL files unifies the identity and restores
 * real type-flow (the anti-`any` guarantee) regardless of consumer node_modules.
 *
 * `@types/react` is a declared dependency of this package, so it is normally
 * present; if it is somehow unresolvable we omit the pin (TypeScript falls back
 * to ambient resolution) rather than throwing — the tool still runs.
 */
function reactPathPins(): Record<string, string[]> {
  try {
    const reactTypesPkg = requireFromHere.resolve('@types/react/package.json');
    const dir = path.dirname(reactTypesPkg);
    const noExt = (p: string) => path.join(dir, p).replace(/\.d\.ts$/, '');
    return {
      react: [noExt('index.d.ts')],
      'react/jsx-runtime': [noExt('jsx-runtime.d.ts')],
      'react/jsx-dev-runtime': [noExt('jsx-dev-runtime.d.ts')],
    };
  } catch {
    return {};
  }
}

function compilerOptions(typesPath: string): TS.CompilerOptions {
  // Map the bare `@archway/valet` specifier to the resolved declaration file so
  // the published bare import in the synthesized module type-checks against the
  // exact shipped types. baseUrl anchors the (extension-less) paths target.
  const typesNoExt = typesPath.replace(/\.d\.mts$|\.d\.ts$|\.ts$|\.mts$/, '');
  return {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    lib: ['lib.dom.d.ts', 'lib.es2020.d.ts'],
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
    strict: true,
    skipLibCheck: true,
    noEmit: true,
    // The relaxed example patterns (an unused destructured tag, a setter never
    // called) must not read as failures — same relaxation as the gate.
    noUnusedLocals: false,
    noUnusedParameters: false,
    baseUrl: path.parse(typesPath).root,
    // The valet specifier pin + the react identity pin (see reactPathPins): the
    // latter is what makes the check honest in a published install where valet's
    // transitive React would otherwise resolve to a different (untyped) copy.
    paths: { '@archway/valet': [typesNoExt], ...reactPathPins() },
  };
}

// The long-lived service + its mutable backing buffer. The service is created
// lazily on first use and reused for every subsequent call (incremental reuse
// of the valet type graph → warm calls ~0.1s). `currentText` is the virtual
// file's current contents; `currentVersion` is bumped on every change so the
// service re-checks just the snippet.
type ServiceState = {
  service: TS.LanguageService;
  typesPath: string;
  source: ValetResolution['source'];
};
let serviceState: ServiceState | null = null;
let currentText = '';
let currentVersion = 0;

function getService(): ServiceState {
  if (serviceState) return serviceState;
  const resolution = getResolution();
  const options = compilerOptions(resolution.typesPath);
  const host: TS.LanguageServiceHost = {
    getScriptFileNames: () => [VIRTUAL_FILE],
    getScriptVersion: (fileName) => (fileName === VIRTUAL_FILE ? String(currentVersion) : '1'),
    getScriptSnapshot: (fileName) => {
      if (fileName === VIRTUAL_FILE) return ts.ScriptSnapshot.fromString(currentText);
      const onDisk = ts.sys.readFile(fileName);
      return onDisk === undefined ? undefined : ts.ScriptSnapshot.fromString(onDisk);
    },
    getCurrentDirectory: () => VIRTUAL_DIR,
    getCompilationSettings: () => options,
    getDefaultLibFileName: (o) => ts.getDefaultLibFilePath(o),
    fileExists: (fileName) => fileName === VIRTUAL_FILE || ts.sys.fileExists(fileName),
    readFile: (fileName, encoding) =>
      fileName === VIRTUAL_FILE ? currentText : ts.sys.readFile(fileName, encoding),
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };
  const service = ts.createLanguageService(host, ts.createDocumentRegistry());
  serviceState = { service, typesPath: resolution.typesPath, source: resolution.source };
  return serviceState;
}

/**
 * Type-check a valet JSX/TSX snippet against the resolved shipped types.
 *
 * `ok` is true iff the snippet is CLEAN against the current valet: no
 * error-severity diagnostics AND no deprecated-alias usage. A deprecated alias
 * (Table's `selectable`/`rowKey`) is type-valid today but slated for removal, so
 * an agent self-correcting should treat it as something to fix — hence it flips
 * `ok` to false even though it is reported as a `suggestion` severity (its
 * canonical-replacement guidance is the actionable part). A snippet that has
 * type errors or deprecated usage is still a SUCCESSFUL validation reporting
 * them — distinct from the tool itself failing — so callers keep `isError:false`.
 */
export function typeCheckSnippet(code: string, imports?: string[]): ValidateResult {
  const started = Date.now();
  const { service, typesPath, source } = getService();
  const barrel = valetBarrelExports(typesPath);
  const { text, valueBindings } = synthesizeSnippetModule(code, barrel, imports);

  // Swap the virtual file's contents and bump the version so the service
  // re-checks exactly this snippet.
  currentText = text;
  currentVersion += 1;

  const raw: TS.Diagnostic[] = [
    ...service.getSyntacticDiagnostics(VIRTUAL_FILE),
    ...service.getSemanticDiagnostics(VIRTUAL_FILE),
    ...service.getSuggestionDiagnostics(VIRTUAL_FILE),
  ];

  // The snippet body occupies lines 1..snippetLines (1-based, after the header
  // offset is subtracted). The synthesized type-import header line carries an
  // unused-import suggestion (TS6192) when the snippet references no bare valet
  // type — pure wrapper noise. We keep every ERROR and every DEPRECATION flag
  // wherever it lands (a wrapper error is a real structural signal), but drop
  // other diagnostics that fall outside the snippet body.
  const snippetLines = code.split('\n').length;
  const diagnostics: SnippetDiagnostic[] = [];
  for (const d of raw) {
    // A diagnostic without a position is dropped, never swallowed into a
    // misleading line number.
    if (d.start == null) continue;
    const file = d.file;
    const pos = file
      ? file.getLineAndCharacterOfPosition(d.start)
      : ts.getLineAndCharacterOfPosition(
          ts.createSourceFile(VIRTUAL_FILE, text, ts.ScriptTarget.ES2020, true, ts.ScriptKind.TSX),
          d.start,
        );
    const line = pos.line + 1 - HEADER_LINES;
    const severity = severityOf(d.category);
    const deprecated = !!d.reportsDeprecated;
    const inBody = line >= 1 && line <= snippetLines;
    if (!inBody && severity !== 'error' && !deprecated) continue;
    diagnostics.push({
      line,
      col: pos.character + 1,
      code: `TS${d.code}`,
      message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
      severity,
      deprecated,
    });
  }
  diagnostics.sort((a, b) => a.line - b.line || a.col - b.col);

  // Clean iff no errors AND no deprecated-alias usage (see the doc comment).
  const ok = !diagnostics.some((d) => d.severity === 'error' || d.deprecated);
  return {
    ok,
    diagnostics,
    valetSource: source,
    valetTypesPath: typesPath,
    importedTags: valueBindings,
    elapsedMs: Date.now() - started,
  };
}
