// ─────────────────────────────────────────────────────────────
// scripts/check-bundle.mjs  | valet
// Tree-shake / payload regression probe (PACKAGING S5).
// Runs against ./dist; run `npm run build` first. CLI:
//   node scripts/check-bundle.mjs [--root <dir>]   (npm run check:bundle)
//
// What it asserts, using esbuild (already in node_modules via tsup)
// to bundle a Button-only fixture exactly the way a consumer's
// bundler would (alias '@archway/valet' → dist/index.mjs; only the
// react peers external — zustand etc. are real payload the consumer
// pays for, so they stay in the measurement):
//  1. The gzipped Button-only bundle is ≤ 12KB (and ≥ a small floor,
//     so an accidentally-empty bundle can't pass vacuously).
//  2. None of the heavy optional deps — highlight.js, marked,
//     react-dropzone — reach the bundle. Three independent layers:
//       a. metafile: no node_modules/<pkg>/ file contributes bytes
//          to the output (bytesInOutput > 0; the raw input GRAPH
//          legitimately contains them pre-tree-shake);
//       b. specifier scan: no quoted import specifier of those
//          packages survives in the output text;
//       c. marker scan: distinctive string literals from each
//          package's code (literals survive minification) are
//          absent. NB a naive substring scan would false-positive:
//          Button's own CSS contains `-webkit-tap-highlight-color`.
//  3. The full barrel (dist/index.mjs) evaluates in plain Node in a
//     fresh subprocess (import side-effect smoke).
//
// Negative-tested in scripts/check-bundle.test.mjs by re-adding
// `import hljs from 'highlight.js'` to the fixture (plan §3.3).
// ─────────────────────────────────────────────────────────────
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

import { build } from 'esbuild';

export const GZIP_LIMIT_BYTES = 12 * 1024;
/** Anti-vacuity floor: Button + engine can't honestly minify below this. */
export const RAW_FLOOR_BYTES = 4 * 1024;

export const BUTTON_FIXTURE = "export { Button } from '@archway/valet';\n";

/**
 * Heavy deps that must NEVER reach a Button-only bundle.
 * `marker` is a distinctive string literal from the package's own
 * source (string literals survive minification; identifiers do not).
 */
export const FORBIDDEN = [
  { pkg: 'highlight.js', marker: 'Could not find the language' },
  { pkg: 'marked', marker: 'markedjs/marked' },
  { pkg: 'react-dropzone', marker: 'noDragEventsBubbling' },
];

/* ─── esbuild wrapper ────────────────────────────────────────── */

/** Bundle a fixture against the built dist; returns { text, metafile }. */
export async function bundleFixture(root, contents = BUTTON_FIXTURE) {
  const result = await build({
    stdin: {
      contents,
      resolveDir: root,
      sourcefile: 'check-bundle-fixture.mjs',
      loader: 'js',
    },
    alias: { '@archway/valet': path.join(root, 'dist', 'index.mjs') },
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2020',
    minify: true,
    write: false,
    metafile: true,
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    logLevel: 'silent',
  });
  return { text: result.outputFiles[0].text, metafile: result.metafile };
}

/* ─── pure checks (unit-tested) ──────────────────────────────── */

/** Layer 2a — forbidden node_modules files contributing output bytes. */
export function scanContributions(metafile) {
  const problems = [];
  for (const output of Object.values(metafile.outputs ?? {})) {
    for (const [file, { bytesInOutput }] of Object.entries(output.inputs ?? {})) {
      if (bytesInOutput <= 0) continue;
      for (const { pkg } of FORBIDDEN) {
        if (file.includes(`node_modules/${pkg}/`)) {
          problems.push(`${pkg} code in the Button bundle: ${file} (${bytesInOutput} bytes)`);
        }
      }
    }
  }
  return problems;
}

/** Layer 2b — quoted module specifiers surviving in the output. */
export function scanSpecifiers(outputText) {
  const problems = [];
  for (const { pkg } of FORBIDDEN) {
    const esc = pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`["'\`]${esc}(?:/[^"'\`]*)?["'\`]`);
    const hit = outputText.match(re);
    if (hit) {
      problems.push(`module specifier ${hit[0]} survives in the Button bundle`);
    }
  }
  return problems;
}

/** Layer 2c — distinctive package string literals in the output. */
export function scanMarkers(outputText) {
  const problems = [];
  for (const { pkg, marker } of FORBIDDEN) {
    if (outputText.includes(marker)) {
      problems.push(`${pkg} code marker ${JSON.stringify(marker)} found in the Button bundle`);
    }
  }
  return problems;
}

/** Check 1 — gzip ceiling + anti-vacuity raw floor. */
export function checkSize(outputText) {
  const problems = [];
  const raw = Buffer.byteLength(outputText);
  const gzip = gzipSync(Buffer.from(outputText)).length;
  if (gzip > GZIP_LIMIT_BYTES) {
    problems.push(
      `Button-only bundle is ${gzip} bytes gzipped — over the ${GZIP_LIMIT_BYTES}-byte ceiling (raw ${raw})`,
    );
  }
  if (raw < RAW_FLOOR_BYTES) {
    problems.push(
      `Button-only bundle is only ${raw} raw bytes (< ${RAW_FLOOR_BYTES}) — fixture is vacuous, Button likely failed to bundle`,
    );
  }
  return { problems, raw, gzip };
}

/* ─── check 3: barrel evaluates in a fresh Node process ──────── */

export function checkBarrelEvaluates(root) {
  const mjsUrl = pathToFileURL(path.join(root, 'dist', 'index.mjs')).href;
  try {
    execFileSync(
      process.execPath,
      ['--input-type=module', '-e', `await import(${JSON.stringify(mjsUrl)});`],
      { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
    );
    return [];
  } catch (err) {
    const stderr = String(err.stderr ?? err.message ?? '');
    return [`import('./dist/index.mjs') threw in Node:\n${stderr.trim().slice(-1000)}`];
  }
}

/* ─── CLI ────────────────────────────────────────────────────── */

function parseArgs(argv) {
  let root = path.resolve(fileURLToPath(import.meta.url), '../..');
  const i = argv.indexOf('--root');
  if (i !== -1 && argv[i + 1]) root = path.resolve(argv[i + 1]);
  return { root };
}

/** Thin CLI wrapper; returns the intended exit code. */
export async function main(argv = process.argv.slice(2)) {
  const { root } = parseArgs(argv);

  if (!fs.existsSync(path.join(root, 'dist', 'index.mjs'))) {
    console.error('check-bundle: FAIL — dist/index.mjs missing. Run `npm run build` first.');
    return 1;
  }

  const failures = [];
  const record = (name, problems) => {
    if (problems.length === 0) {
      console.log(`check-bundle: OK — ${name}`);
    } else {
      failures.push(...problems.map((p) => `[${name}] ${p}`));
    }
  };

  const { text, metafile } = await bundleFixture(root);

  const size = checkSize(text);
  record(
    `Button-only payload ${size.gzip}B gzip / ${size.raw}B raw (ceiling ${GZIP_LIMIT_BYTES}B gzip)`,
    size.problems,
  );
  record('no highlight.js/marked/react-dropzone bytes (metafile)', scanContributions(metafile));
  record('no forbidden module specifiers (string scan)', scanSpecifiers(text));
  record('no forbidden code markers (string scan)', scanMarkers(text));
  record('full barrel evaluates in Node', checkBarrelEvaluates(root));

  if (failures.length === 0) {
    console.log('check-bundle: OK — all checks passed');
    return 0;
  }
  console.error(`check-bundle: FAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  return 1;
}

const entry = process.argv[1];
if (entry && pathToFileURL(path.resolve(entry)).href === import.meta.url) {
  process.exit(await main());
}
