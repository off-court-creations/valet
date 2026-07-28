// ─────────────────────────────────────────────────────────────
// scripts/release/validate-cva-local.mjs  | valet
// Validate create-valet-app against a freshly packed local valet tarball.
// This breaks the synchronized-release dependency cycle: the new template
// pin is testable before that same valet version exists on npm.
// ─────────────────────────────────────────────────────────────
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packDir = fs.mkdtempSync(path.join(os.tmpdir(), 'valet-cva-release-'));
const validateArgs = process.argv.slice(2);
let exitCode = 0;

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: 'utf8',
    ...options,
  });
  if (result.error) throw result.error;
  return result;
}

try {
  process.stdout.write('[cva:release] packing local @archway/valet\n');
  const packed = run('npm', ['pack', '--silent', '--pack-destination', packDir], {
    stdio: ['ignore', 'pipe', 'inherit'],
  });
  exitCode = packed.status ?? 1;

  if (exitCode === 0) {
    const filename = packed.stdout.trim().split(/\r?\n/).at(-1);
    if (!filename?.endsWith('.tgz')) {
      throw new Error('npm pack did not report a tarball filename');
    }

    const tarball = path.join(packDir, filename);
    process.stdout.write(`[cva:release] validating against ${filename}\n`);
    const validation = run(
      'npm',
      ['--prefix', 'packages/create-valet-app', 'run', 'validate', '--', ...validateArgs],
      {
        stdio: 'inherit',
        env: {
          ...process.env,
          CVA_VALIDATE_VALET_PACKAGE: tarball,
        },
      },
    );
    exitCode = validation.status ?? 1;
  }
} finally {
  fs.rmSync(packDir, { recursive: true, force: true });
}

process.exitCode = exitCode;
