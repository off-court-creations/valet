// ─────────────────────────────────────────────────────────────
// scripts/checks/engine-smoke.mjs  | valet
// Node SSR smoke harness (ENGINE S5 — the Phase-0 engine gate).
// Runs against ./dist; run `npm run build` first (the gate is
// `npm run build && npm run check:engine`). Exits non-zero with a
// clear message per failed check.
//
// Checks
//  1. require('./dist/index.js') and import('./dist/index.mjs')
//     both succeed in plain Node (ENGINE S1 — no document at import).
//  2. styled class names are deterministic `z-<tag>-*` across two
//     SEPARATE node invocations (subprocesses spawned and compared).
//  3. keyframes() and definePreset() are callable in Node without
//     throwing and return stable `z-kf-*` / `zp-*` names.
//  4. No literal 'false' substring in any recorded rule after
//     rendering a fixture with false-conditional interpolations
//     (asserts ENGINE S2's compileTemplate fix at the dist level).
//
// Probe path for check 4 (documented per the slice spec): the sheet
// module's pending-rule store (src/css/sheet.ts `getPendingRules`) is
// NOT reachable from dist — tsup bundles a single entry and the public
// barrel re-exports only `globalSheet` (undefined in Node). Instead:
//  • `styleCache` IS public (createStyled.ts re-export) and its keys
//    are byte-identical to the normalized rule bodies the sheet
//    records as pending (`.<class>{<key>}`), so scanning every key
//    (plus every rendered class name) for 'false' inspects exactly
//    what was recorded for styled rules; and
//  • hash equality: a fixture WITH `${false && …}` interpolations
//    must produce the same class / keyframes name as its clean twin —
//    names are FNV-1a hashes of the normalized CSS, so equality
//    proves the 'false' text never entered the recorded rule.
// ENGINE S10 (registry privatization) revisits this probe by design.
//
// CLI: node scripts/checks/engine-smoke.mjs [--root <dir>]
// ─────────────────────────────────────────────────────────────
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const SENTINEL = '__ENGINE_SMOKE__';

/** Fixture source run in a fresh subprocess; prints one sentinel JSON line. */
export function fixtureSource(distMjsUrl) {
  return `
import React from 'react';
import { renderToString } from 'react-dom/server';
const { styled, keyframes, definePreset, preset, styleCache } =
  await import(${JSON.stringify(distMjsUrl)});

/* styled fixture with false-conditional interpolations (value + fn) */
const Box = styled('div')\`
  display: flex;
  \${false && 'color: red;'}
  \${(p) => p.$danger && 'outline: 1px solid red;'}
  padding: 4px;
\`;
/* clean twin — must hash to the SAME class when the vetoes drop */
const BoxClean = styled('div')\`
  display: flex;
  padding: 4px;
\`;
const Label = styled('span')\`
  font-weight: 600;
\`;

const html = renderToString(
  React.createElement(Box, { $danger: false }, React.createElement(Label, null, 'hi')),
);
const htmlClean = renderToString(React.createElement(BoxClean, null));
const classOf = (markup) => {
  const m = markup.match(/class="([^"]+)"/);
  return m ? m[1].split(/\\s+/)[0] : null;
};

/* keyframes: veto interpolations must not change the hashed name */
const kfClean = keyframes\`from{opacity:0}to{opacity:1}\`;
const kfVeto = keyframes\`from{opacity:0}\${false}to{opacity:1}\${null}\${undefined}\`;

/* presets are callable in Node; preset() returns the stable class */
definePreset('engineSmoke', () => 'color: rebeccapurple;');
const presetClass = preset('engineSmoke');

console.log(
  ${JSON.stringify(SENTINEL)} +
    JSON.stringify({
      boxClass: classOf(html),
      boxCleanClass: classOf(htmlClean),
      labelClass: classOf(html.slice(html.indexOf('<span'))),
      kfClean,
      kfVeto,
      presetClass,
      recorded: [...styleCache.keys()],
    }),
);
`;
}

/** Spawn a fresh node subprocess; returns { status, stdout, stderr }. */
function runNode(args, root) {
  try {
    const stdout = execFileSync(process.execPath, args, {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
    });
    return { status: 0, stdout, stderr: '' };
  } catch (err) {
    return {
      status: err.status ?? 1,
      stdout: String(err.stdout ?? ''),
      stderr: String(err.stderr ?? err.message ?? ''),
    };
  }
}

function parseFixture(run, problems, label) {
  if (run.status !== 0) {
    problems.push(`${label}: fixture exited ${run.status}\n${run.stderr.trim().slice(-1000)}`);
    return null;
  }
  const line = run.stdout.split('\n').find((l) => l.startsWith(SENTINEL));
  if (!line) {
    problems.push(`${label}: no sentinel JSON line on stdout`);
    return null;
  }
  return JSON.parse(line.slice(SENTINEL.length));
}

/* ─── Check 1: both module formats import without throwing ─────────── */
export function checkImports(root) {
  const problems = [];
  const cjsPath = path.join(root, 'dist', 'index.js');
  const mjsUrl = pathToFileURL(path.join(root, 'dist', 'index.mjs')).href;

  const cjs = runNode(['-e', `require(${JSON.stringify(cjsPath)})`], root);
  if (cjs.status !== 0) {
    problems.push(
      `require('./dist/index.js') threw (exit ${cjs.status}):\n${cjs.stderr.trim().slice(-1000)}`,
    );
  }
  const esm = runNode(
    ['--input-type=module', '-e', `await import(${JSON.stringify(mjsUrl)});`],
    root,
  );
  if (esm.status !== 0) {
    problems.push(
      `import('./dist/index.mjs') threw (exit ${esm.status}):\n${esm.stderr.trim().slice(-1000)}`,
    );
  }
  return problems;
}

/* ─── Checks 2–4: fixture invariants across two separate processes ─── */
export function verifyFixtureRuns(a, b) {
  const problems = [];

  /* Check 2 — determinism across processes + z-<tag>-* shape */
  for (const key of ['boxClass', 'boxCleanClass', 'labelClass', 'kfClean', 'presetClass']) {
    if (a[key] !== b[key]) {
      problems.push(`non-deterministic ${key} across processes: ${a[key]} vs ${b[key]}`);
    }
  }
  if (!/^z-div-[0-9a-z]+-[0-9a-z]+$/.test(a.boxClass ?? '')) {
    problems.push(`styled('div') class is not z-div-*: ${a.boxClass}`);
  }
  if (!/^z-span-[0-9a-z]+-[0-9a-z]+$/.test(a.labelClass ?? '')) {
    problems.push(`styled('span') class is not z-span-*: ${a.labelClass}`);
  }

  /* Check 3 — keyframes/presets returned stable, well-formed names */
  if (!/^z-kf-[0-9a-z]+-[0-9a-z]+$/.test(a.kfClean ?? '')) {
    problems.push(`keyframes() name is not z-kf-*: ${a.kfClean}`);
  }
  if (!/^zp-enginesmoke-[0-9a-z]+-[0-9a-z]+$/.test(a.presetClass ?? '')) {
    problems.push(`definePreset()/preset() class is not zp-enginesmoke-*: ${a.presetClass}`);
  }

  /* Check 4 — false vetoes never reach the recorded CSS */
  if (a.boxClass !== a.boxCleanClass) {
    problems.push(
      `false-conditional interpolation changed the class hash: ${a.boxClass} vs clean twin ${a.boxCleanClass} — 'false' leaked into the rule text`,
    );
  }
  if (a.kfVeto !== a.kfClean) {
    problems.push(
      `false/null/undefined interpolations changed the keyframes name: ${a.kfVeto} vs clean twin ${a.kfClean}`,
    );
  }
  for (const css of a.recorded ?? []) {
    if (css.includes('false')) {
      problems.push(`literal 'false' in recorded rule CSS: ${JSON.stringify(css)}`);
    }
  }
  for (const cls of [a.boxClass, a.labelClass, a.kfClean, a.presetClass]) {
    if (cls && cls.includes('false')) {
      problems.push(`literal 'false' in generated name: ${cls}`);
    }
  }
  return problems;
}

function parseArgs(argv) {
  let root = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const i = argv.indexOf('--root');
  if (i !== -1 && argv[i + 1]) root = path.resolve(argv[i + 1]);
  return { root };
}

/** Thin CLI wrapper; returns the intended exit code. */
export function main(argv = process.argv.slice(2)) {
  const { root } = parseArgs(argv);

  for (const rel of ['dist/index.js', 'dist/index.mjs']) {
    if (!fs.existsSync(path.join(root, rel))) {
      console.error(`engine-smoke: FAIL — ${rel} missing. Run \`npm run build\` first.`);
      return 1;
    }
  }

  const failures = [];
  const record = (name, problems) => {
    if (problems.length === 0) {
      console.log(`engine-smoke: OK — ${name}`);
    } else {
      failures.push(...problems.map((p) => `[${name}] ${p}`));
    }
  };

  record('import-no-throw (CJS require + ESM import)', checkImports(root));

  const mjsUrl = pathToFileURL(path.join(root, 'dist', 'index.mjs')).href;
  const src = fixtureSource(mjsUrl);
  const problems = [];
  const a = parseFixture(runNode(['--input-type=module', '-e', src], root), problems, 'run A');
  const b = parseFixture(runNode(['--input-type=module', '-e', src], root), problems, 'run B');
  if (a && b) problems.push(...verifyFixtureRuns(a, b));
  record('deterministic classes, keyframes/presets in Node, no false leak', problems);

  if (failures.length === 0) {
    console.log('engine-smoke: OK — all checks passed');
    return 0;
  }
  console.error(`engine-smoke: FAIL — ${failures.length} problem(s):`);
  for (const f of failures) console.error(`  - ${f}`);
  return 1;
}

const entry = process.argv[1];
if (entry && pathToFileURL(path.resolve(entry)).href === import.meta.url) {
  process.exit(main());
}
