#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────
// consent.test.mjs | @archway/create-valet-app
//
// Scripted sandbox regression for SECURITY S8 (CVA consent).
//
// The valet test harness (vitest) globs only src/** and scripts/** of the
// LIBRARY root; packages/** is outside those globs, so this package has no
// vitest hook. This is a self-contained node test (same style as the package's
// scripts/validate.mjs) that runs the real bin end-to-end in a sandbox:
//
//   • HOME = a fresh temp dir, so any ~/.codex/config.toml write is observable.
//   • PATH is prefixed with a shim dir holding a FAKE `npm` (and git/code/
//     valet-mcp) that only append their argv to a log file and exit 0 — so a
//     real `npm i -g @archway/valet-mcp` can never run.
//   • The bin runs non-interactively (CVA_NONINTERACTIVE=1, stdin from
//     /dev/null) with --no-install --no-git for a fast hermetic scaffold.
//
// Asserted behavior (plan §3.10 S8 + §9 Security register):
//   1. Non-interactive default: NO global MCP install attempted, NO config edit.
//   2. CVA_GLOBAL_MCP=1 opts back in: install attempted + config written.
//   3. --global-mcp flag opts back in: install attempted + config written.
//   4. CVA_SKIP_GLOBAL_MCP=1 beats --global-mcp (hard opt-out wins).
//
// Run: node scripts/consent.test.mjs
// Exit 0 = all pass; non-zero = a failure (argv/assert printed).
// ─────────────────────────────────────────────────────────────
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const pkgRoot = path.resolve(path.dirname(__filename), '..');
const BIN = path.join(pkgRoot, 'bin', 'create-valet-app.js');

let failures = 0;
function check(cond, msg) {
  if (cond) {
    console.log('  ✓', msg);
  } else {
    failures += 1;
    console.error('  ✗ FAIL:', msg);
  }
}

// Build a sandbox: temp HOME, temp PATH-shim with fake npm/git/code/valet-mcp.
// Each shim logs its full argv (one invocation per line) to <shim>/calls.log.
function makeSandbox() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cva-consent-'));
  const home = path.join(root, 'home');
  const shim = path.join(root, 'shim');
  const target = path.join(root, 'target');
  fs.mkdirSync(home, { recursive: true });
  fs.mkdirSync(shim, { recursive: true });
  const callsLog = path.join(shim, 'calls.log');

  // A fake binary that records "<name> <args...>" and exits 0. valet-mcp must
  // also answer `--version` (the bin probes it before deciding the range);
  // returning a non-semver keeps the install-range path simple and harmless.
  const fake = (name, extra = '') => `#!/usr/bin/env node
import fs from 'node:fs';
const argv = process.argv.slice(2);
fs.appendFileSync(${JSON.stringify(callsLog)}, ${JSON.stringify(name)} + ' ' + argv.join(' ') + '\\n');
${extra}
process.exit(0);
`;

  writeShim(shim, 'npm', fake('npm'));
  writeShim(shim, 'git', fake('git'));
  writeShim(shim, 'code', fake('code'));
  // valet-mcp --version → print nothing parseable so the bin falls back to the
  // configured minor range (exercised, but irrelevant to the consent gate).
  writeShim(shim, 'valet-mcp', fake('valet-mcp'));

  return { root, home, shim, target, callsLog };
}

function writeShim(shimDir, name, body) {
  const p = path.join(shimDir, name);
  fs.writeFileSync(p, body);
  fs.chmodSync(p, 0o755);
}

function runBin({ home, shim, target, env = {}, args = [] }) {
  const res = spawnSync(
    process.execPath,
    [BIN, target, '--no-install', '--no-git', ...args],
    {
      // stdin from a closed pipe → not a TTY → non-interactive.
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        HOME: home,
        PATH: `${shim}${path.delimiter}${process.env.PATH}`,
        CVA_NONINTERACTIVE: '1',
        ...env,
      },
    },
  );
  const stdout = res.stdout ? res.stdout.toString() : '';
  const stderr = res.stderr ? res.stderr.toString() : '';
  return { status: res.status, stdout, stderr };
}

function npmGlobalMcpAttempted(callsLog) {
  if (!fs.existsSync(callsLog)) return false;
  const log = fs.readFileSync(callsLog, 'utf8');
  // The bin runs: npm i -g @archway/valet-mcp@<range> --no-fund --no-audit
  return /^npm .*\bi -g @archway\/valet-mcp/m.test(log);
}

function codexConfigWritten(home) {
  return fs.existsSync(path.join(home, '.codex', 'config.toml'));
}

// ── Scenario 1: non-interactive default → SKIP install + config ───────────────
{
  console.log('Scenario 1: non-interactive default skips global MCP');
  const sbx = makeSandbox();
  const r = runBin({ ...sbx });
  check(r.status === 0, 'bin exits 0');
  check(!npmGlobalMcpAttempted(sbx.callsLog), 'no `npm i -g @archway/valet-mcp` attempted');
  check(!codexConfigWritten(sbx.home), '~/.codex/config.toml NOT created');
  check(/opt in with --global-mcp or CVA_GLOBAL_MCP=1/.test(r.stdout), 'prints the opt-in tip');
  fs.rmSync(sbx.root, { recursive: true, force: true });
}

// ── Scenario 2: CVA_GLOBAL_MCP=1 → opt back in ────────────────────────────────
{
  console.log('Scenario 2: CVA_GLOBAL_MCP=1 opts back in');
  const sbx = makeSandbox();
  const r = runBin({ ...sbx, env: { CVA_GLOBAL_MCP: '1' } });
  check(r.status === 0, 'bin exits 0');
  check(npmGlobalMcpAttempted(sbx.callsLog), '`npm i -g @archway/valet-mcp` WAS attempted (fake npm)');
  check(codexConfigWritten(sbx.home), '~/.codex/config.toml WAS written');
  fs.rmSync(sbx.root, { recursive: true, force: true });
}

// ── Scenario 3: --global-mcp flag → opt back in ───────────────────────────────
{
  console.log('Scenario 3: --global-mcp flag opts back in');
  const sbx = makeSandbox();
  const r = runBin({ ...sbx, args: ['--global-mcp'] });
  check(r.status === 0, 'bin exits 0');
  check(npmGlobalMcpAttempted(sbx.callsLog), '`npm i -g @archway/valet-mcp` WAS attempted (fake npm)');
  check(codexConfigWritten(sbx.home), '~/.codex/config.toml WAS written');
  fs.rmSync(sbx.root, { recursive: true, force: true });
}

// ── Scenario 4: CVA_SKIP_GLOBAL_MCP=1 beats the opt-in (hard opt-out wins) ─────
{
  console.log('Scenario 4: CVA_SKIP_GLOBAL_MCP=1 overrides --global-mcp');
  const sbx = makeSandbox();
  const r = runBin({ ...sbx, env: { CVA_SKIP_GLOBAL_MCP: '1' }, args: ['--global-mcp'] });
  check(r.status === 0, 'bin exits 0');
  check(!npmGlobalMcpAttempted(sbx.callsLog), 'no global install attempted (opt-out wins)');
  check(!codexConfigWritten(sbx.home), '~/.codex/config.toml NOT created (opt-out wins)');
  fs.rmSync(sbx.root, { recursive: true, force: true });
}

console.log('');
if (failures > 0) {
  console.error(`consent.test.mjs: ${failures} assertion(s) failed`);
  process.exit(1);
}
console.log('consent.test.mjs: all scenarios passed');
