#!/usr/bin/env node
// Validate @archway/create-valet-app templates and flags by generating real apps
// and running lint/typecheck/build (+ optional preview) in a temp workspace.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CLI = path.join(ROOT, 'bin', 'create-valet-app.js');

const args = process.argv.slice(2);
const opts = {
  noPreview: args.includes('--no-preview'),
  only: null,
};
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--only') opts.only = args[i + 1];
}

const scenarios = [
  // Baseline without MCP docs
  { id: 'ts:default', template: 'ts', flags: [], mcp: false, checks: ['files:baseline'] },
  { id: 'js:default', template: 'js', flags: [], mcp: false, checks: ['files:baseline'] },
  { id: 'hybrid:default', template: 'hybrid', flags: [], mcp: false, checks: ['files:baseline'] },
  // Feature toggles
  { id: 'ts:no-router', template: 'ts', flags: ['--no-router'], mcp: false, checks: ['no-router'] },
  { id: 'js:minimal', template: 'js', flags: ['--minimal'], mcp: false, checks: ['minimal'] },
  { id: 'hybrid:no-zustand', template: 'hybrid', flags: ['--no-zustand'], mcp: false, checks: ['no-zustand'] },
  { id: 'ts:alias-app', template: 'ts', flags: ['--path-alias', 'app'], mcp: false, checks: ['alias:app'] },
  // MCP-on scenarios to validate AGENTS.md rendering
  { id: 'ts:mcp-default', template: 'ts', flags: [], mcp: true, checks: ['agents:ts-default'] },
  { id: 'js:mcp-default', template: 'js', flags: [], mcp: true, checks: ['agents:js-default'] },
  { id: 'hybrid:mcp-custom', template: 'hybrid', flags: ['--no-router', '--no-zustand', '--minimal', '--path-alias', 'app'], mcp: true, checks: ['agents:hybrid-custom'] },
  // R3F/three opt-in scenarios
  { id: 'ts:three', template: 'ts', flags: ['--three'], mcp: false, checks: ['three:deps', 'three:quickstart'] },
  { id: 'js:three', template: 'js', flags: ['--three'], mcp: false, checks: ['three:deps', 'three:quickstart'] },
  { id: 'hybrid:three-mcp', template: 'hybrid', flags: ['--three'], mcp: true, checks: ['three:deps', 'three:quickstart', 'agents:r3f-policy'] },
].filter((s) => (opts.only ? s.id === opts.only : true));

function run(cmd, argv, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, argv, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'pipe',
    });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('close', (code) => {
      resolve({ code, out, err });
    });
    child.on('error', (e) => reject(e));
  });
}

function logLine(line) {
  process.stdout.write(line + '\n');
}

async function install(cwd) {
  return await run('npm', ['install', '--no-audit', '--no-fund'], cwd);
}

async function lint(cwd) {
  return await run('npm', ['run', '-s', 'lint:agent'], cwd);
}

async function typecheck(cwd, template) {
  if (template === 'js') return { code: 0, out: 'TYPECHECK_STATUS:skipped', err: '' };
  return await run('npm', ['run', '-s', 'typecheck:agent'], cwd);
}

async function build(cwd) {
  return await run('npm', ['run', '-s', 'build:agent'], cwd);
}

async function preview(cwd) {
  const port = 5173 + Math.floor(Math.random() * 1000);
  const p = spawn('npx', ['vite', 'preview', '--strictPort', '--port', String(port)], {
    cwd,
    env: process.env,
    stdio: 'pipe',
  });
  let ready = false;
  let out = '';
  p.stdout.on('data', (d) => {
    out += d.toString();
    if (/Local:\s*http:\/\/localhost:/.test(out)) ready = true;
  });
  // Wait up to ~12s for server, then fetch /
  const started = Date.now();
  while (!ready && Date.now() - started < 12000) {
    await new Promise((r) => setTimeout(r, 200));
  }
  let status = 0;
  try {
    const res = await fetch(`http://localhost:${port}/`);
    status = res.status;
  } catch {}
  p.kill('SIGTERM');
  return { code: status === 200 ? 0 : 1, out: `PREVIEW_STATUS:${status === 200 ? 'ok' : 'fail'}`, err: '' };
}

async function runScenario(baseDir, s) {
  const dir = path.join(baseDir, s.id.replace(/[:]/g, '-'));
  fs.mkdirSync(dir, { recursive: true });
  const appDir = path.join(dir, 'app');
  const cliArgs = ['node', CLI, appDir, '--template', s.template, '--install', s.mcp ? '--mcp' : '--no-mcp', ...s.flags];
  logLine(`[validate] ${s.id} -> generate`);
  const gen = await run(cliArgs[0], cliArgs.slice(1), ROOT, s.mcp ? { CVA_SKIP_GLOBAL_MCP: '1' } : {});
  if (gen.code !== 0) return { id: s.id, ok: false, reason: 'generate', logs: gen.out + gen.err };

  // Post-generate file/content checks
  const checkRes = await postChecks(appDir, s);
  if (!checkRes.ok) {
    logLine(checkRes.log || '[validate] checks failed (no log)');
    return { id: s.id, ok: false, reason: 'checks', logs: checkRes.log };
  }

  logLine(`[validate] ${s.id} -> lint`);
  const lintRes = await lint(appDir);
  const lintOk = /LINT_STATUS:ok/.test(lintRes.out) || lintRes.code === 0;

  logLine(`[validate] ${s.id} -> typecheck`);
  const typeRes = await typecheck(appDir, s.template);
  const typeOk = /TYPECHECK_STATUS:ok/.test(typeRes.out) || s.template === 'js' || typeRes.code === 0;

  logLine(`[validate] ${s.id} -> build`);
  const buildRes = await build(appDir);
  const buildOk = /BUILD_STATUS:ok/.test(buildRes.out) || buildRes.code === 0;

  let prevOk = true;
  let prevRes = { out: 'PREVIEW_STATUS:skipped' };
  if (!opts.noPreview) {
    logLine(`[validate] ${s.id} -> preview`);
    prevRes = await preview(appDir);
    prevOk = prevRes.code === 0;
  }

  const ok = lintOk && typeOk && buildOk && prevOk;
  return {
    id: s.id,
    ok,
    results: {
      lint: lintOk ? 'ok' : 'fail',
      typecheck: typeOk ? 'ok' : 'fail',
      build: buildOk ? 'ok' : 'fail',
      preview: prevOk ? 'ok' : 'fail',
    },
    logs: { gen, lintRes, typeRes, buildRes, prevRes },
  };
}

function readFileSafe(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return null; }
}

function exists(p) { try { return fs.existsSync(p); } catch { return false; } }

async function postChecks(appDir, s) {
  const msgs = [];
  const fail = (m) => { msgs.push(`[check] ${m}`); };

  // Baseline: when MCP is off, AGENTS.md should not exist
  if (s.checks?.includes('files:baseline')) {
    if (exists(path.join(appDir, 'AGENTS.md'))) fail('AGENTS.md should be absent when --no-mcp');
    if (exists(path.join(appDir, 'CLAUDE.md'))) fail('CLAUDE.md should be absent when --no-mcp');
  }

  // No-router: package should not depend on react-router-dom and second page removed
  if (s.checks?.includes('no-router')) {
    const pkg = JSON.parse(readFileSafe(path.join(appDir, 'package.json')) || '{}');
    if (pkg.dependencies && pkg.dependencies['react-router-dom']) fail('react-router-dom should be removed');
    if (exists(path.join(appDir, 'src', 'pages', 'second'))) fail('second page directory should be removed');
  }

  // Minimal: second page removed
  if (s.checks?.includes('minimal')) {
    if (exists(path.join(appDir, 'src', 'pages', 'second'))) fail('second page directory should be removed in minimal');
  }

  // No-zustand: dependency and store directory removed
  if (s.checks?.includes('no-zustand')) {
    const pkg = JSON.parse(readFileSafe(path.join(appDir, 'package.json')) || '{}');
    if (pkg.dependencies && pkg.dependencies['zustand']) fail('zustand should be removed');
    if (exists(path.join(appDir, 'src', 'store'))) fail('src/store should be removed');
  }

  // Alias: verify vite config, tsconfig paths, and source import prefix swap
  if (s.checks?.includes('alias:app')) {
    const vite = readFileSafe(path.join(appDir, 'vite.config.ts')) || readFileSafe(path.join(appDir, 'vite.config.js')) || '';
    if (!/['"]app['"]\s*:\s*path\.resolve/.test(vite)) fail('vite.config should map alias "app"');
    const tsapp = readFileSafe(path.join(appDir, 'tsconfig.app.json')) || '';
    if (!tsapp.includes('"app/*"')) {
      const snippet = tsapp ? tsapp.substring(0, 140).replace(/\n/g, ' ') : '(missing)';
      fail(`tsconfig.app.json should contain paths mapping for "app/*"; saw: ${snippet}`);
    }
    const appSrc = readFileSafe(path.join(appDir, 'src', 'App.tsx')) || '';
    const mainSrc = readFileSafe(path.join(appDir, 'src', 'main.tsx')) || '';
    if (!/app\//.test(appSrc + mainSrc)) fail('source files should import using app/ prefix');
    // Ensure no bare '@/'
    const hasAtSlash = /['"]@\//.test(appSrc + mainSrc);
    if (hasAtSlash) fail('source should not contain "@/" after alias swap');
  }

  // AGENTS rendering checks
  if (s.checks?.includes('agents:ts-default')) {
    const md = readFileSafe(path.join(appDir, 'AGENTS.md')) || '';
    if (!md) fail('AGENTS.md should exist when --mcp');
    if (!/This is a TypeScript template\./.test(md)) fail('AGENTS.md should mention TypeScript template');
    if (!/Typecheck:\s*`npm run -s typecheck:agent`/.test(md)) fail('AGENTS.md should include typecheck command');
    if (!/Router:\s*enabled/.test(md)) fail('AGENTS.md Router feature should be enabled');
    if (!/Zustand:\s*enabled/.test(md)) fail('AGENTS.md Zustand feature should be enabled');

    const cd = readFileSafe(path.join(appDir, 'CLAUDE.md')) || '';
    if (!cd) fail('CLAUDE.md should exist when --mcp');
    if (!/This is a TypeScript template\./.test(cd)) fail('CLAUDE.md should mention TypeScript template');
    if (!/Typecheck:\s*`npm run -s typecheck:agent`/.test(cd)) fail('CLAUDE.md should include typecheck command');
    if (!/Router:\s*enabled/.test(cd)) fail('CLAUDE.md Router feature should be enabled');
    if (!/Zustand:\s*enabled/.test(cd)) fail('CLAUDE.md Zustand feature should be enabled');
  }
  if (s.checks?.includes('agents:js-default')) {
    const md = readFileSafe(path.join(appDir, 'AGENTS.md')) || '';
    if (!md) fail('AGENTS.md should exist when --mcp');
    if (!/JavaScript-only template/.test(md)) fail('AGENTS.md should mention JavaScript-only template');
    if (/Typecheck:\s*`npm run -s typecheck:agent`/.test(md)) fail('AGENTS.md should not include typecheck command for JS');
    if (!/Typecheck:\s*n\/a for JS template\./.test(md)) fail('AGENTS.md should mark typecheck n/a for JS');

    const cd = readFileSafe(path.join(appDir, 'CLAUDE.md')) || '';
    if (!cd) fail('CLAUDE.md should exist when --mcp');
    if (!/JavaScript-only template/.test(cd)) fail('CLAUDE.md should mention JavaScript-only template');
    if (/Typecheck:\s*`npm run -s typecheck:agent`/.test(cd)) fail('CLAUDE.md should not include typecheck command for JS');
    if (!/Typecheck:\s*n\/a for JS template\./.test(cd)) fail('CLAUDE.md should mark typecheck n/a for JS');
  }
  if (s.checks?.includes('agents:hybrid-custom')) {
    const md = readFileSafe(path.join(appDir, 'AGENTS.md')) || '';
    if (!/hybrid template/.test(md)) fail('AGENTS.md should mention hybrid template');
    if (!/Router:\s*disabled/.test(md)) fail('AGENTS.md Router feature should be disabled');
    if (!/Zustand:\s*disabled/.test(md)) fail('AGENTS.md Zustand feature should be disabled');
    if (!/Minimal mode:\s*on/.test(md)) fail('AGENTS.md Minimal feature should be on');
    if (!/Path alias token:\s*`app`/.test(md)) fail('AGENTS.md should reflect alias token app');

    const cd = readFileSafe(path.join(appDir, 'CLAUDE.md')) || '';
    if (!/hybrid template/.test(cd)) fail('CLAUDE.md should mention hybrid template');
    if (!/Router:\s*disabled/.test(cd)) fail('CLAUDE.md Router feature should be disabled');
    if (!/Zustand:\s*disabled/.test(cd)) fail('CLAUDE.md Zustand feature should be disabled');
    if (!/Minimal mode:\s*on/.test(cd)) fail('CLAUDE.md Minimal feature should be on');
    if (!/Path alias token:\s*`app`/.test(cd)) fail('CLAUDE.md should reflect alias token app');
  }

  // three/R3F checks
  if (s.checks?.includes('three:deps')) {
    const pkgRaw = readFileSafe(path.join(appDir, 'package.json')) || '{}';
    let pkg = {};
    try { pkg = JSON.parse(pkgRaw); } catch {}
    const d = (pkg.dependencies || {});
    if (!d['three']) fail('package.json should include three');
    if (!d['@react-three/fiber']) fail('package.json should include @react-three/fiber');
    if (!d['@react-three/drei']) fail('package.json should include @react-three/drei');
  }
  if (s.checks?.includes('three:quickstart')) {
    const jsPath = path.join(appDir, 'src', 'pages', 'start', 'Quickstart.jsx');
    const tsPath = path.join(appDir, 'src', 'pages', 'start', 'Quickstart.tsx');
    const src = readFileSafe(jsPath) || readFileSafe(tsPath) || '';
    if (!/from\s+"@react-three\/fiber"/.test(src)) fail('Quickstart should import from @react-three/fiber');
    if (!/<Canvas\b/.test(src)) fail('Quickstart should render a <Canvas>');
    // For hybrid template, ensure .jsx is used when three is enabled
    if (s.id.startsWith('hybrid:')) {
      if (!exists(jsPath)) fail('Hybrid 3D Quickstart should be .jsx');
      if (exists(tsPath)) fail('Hybrid 3D Quickstart should not leave a .tsx file');
    }
  }
  if (s.checks?.includes('agents:r3f-policy')) {
    const md = readFileSafe(path.join(appDir, 'AGENTS.md')) || '';
    if (!/R3F Pages Policy/.test(md)) fail('AGENTS.md should include R3F Pages Policy when 3D is enabled on hybrid');
    if (!/implement them as `\.jsx` files/.test(md)) fail('AGENTS.md should advise .jsx for R3F-heavy pages');
  }

  return { ok: msgs.length === 0, log: msgs.join('\n') };
}

(async function main() {
  const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cva-validate-'));
  logLine(`[validate] workspace: ${baseDir}`);
  const results = [];
  for (const s of scenarios) {
    const res = await runScenario(baseDir, s);
    results.push(res);
    const summary = `[validate] ${s.id} -> LINT:${res.results?.lint || 'fail'} TYPECHECK:${res.results?.typecheck || 'fail'} BUILD:${res.results?.build || 'fail'} PREVIEW:${res.results?.preview || 'skipped'}`;
    logLine(summary);
    if (!res.ok) {
      logLine(`[validate] FAILED: ${s.id}`);
      break;
    }
  }
  const allOk = results.length && results.every((r) => r.ok);
  logLine(`[validate] summary: ${results.map((r) => `${r.id}:${r.ok ? 'ok' : 'fail'}`).join(' ')}`);
  process.exit(allOk ? 0 : 1);
})();
