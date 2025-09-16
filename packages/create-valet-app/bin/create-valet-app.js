#!/usr/bin/env node
// @archway/create-valet-app — CLI
// Minimal ESM CLI to scaffold a Valet + React + Vite app.
// Phase 1 + Phase 2: implement TS-only template.

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
// readline not used with enquirer prompts
import chalk from 'chalk';
import enquirer from 'enquirer';
import ora from 'ora';
import gradient from 'gradient-string';
import figlet from 'figlet';
import boxen from 'boxen';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PKG = readJSONSafe(path.join(__dirname, '..', 'package.json')) || {};

// Determine the target Valet minor line to use for generated apps and MCP.
// Default behavior: tie to this CLI's own minor (x.MINOR.x), e.g. 0.31.x.
// Overrides: env CVA_VALET_MINOR (e.g. "0.31"), or package.json { cva: { valetMinor } }.
function resolveValetMinor() {
  // Explicit env override wins
  if (process.env.CVA_VALET_MINOR) return String(process.env.CVA_VALET_MINOR);
  // Config override in package.json
  if (PKG && PKG.cva && PKG.cva.valetMinor) return String(PKG.cva.valetMinor);
  // Derive from this package version (use MAJOR.MINOR)
  const ver = String(PKG.version || '0.31.0');
  const parts = ver.split('.');
  const major = parts[0] || '0';
  const minor = parts[1] || '30';
  return `${major}.${minor}`;
}

// Produce a semver range that tracks the highest PATCH within the chosen MINOR.
// For example, minor "0.31" -> "^0.31.0" (for 0.x, caret behaves like patch range within the same minor).
function valetMinorRange(minor) {
  return `^${minor}.0`;
}

// Parse a semver string into { major, minor, patch } numbers. Returns null on failure.
function parseSemver(v) {
  if (!v || typeof v !== 'string') return null;
  const m = v.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  return { major: Number(m[1]), minor: Number(m[2]), patch: Number(m[3]) };
}

// Produce a range that locks within the same MINOR and upgrades to latest PATCH.
// - For 0.x: caret (e.g., ^0.31.0) already locks to same minor.
// - For 1.x+: use tilde (e.g., ~1.2.0) to keep minor locked.
function minorLockedRange(major, minor) {
  return Number(major) === 0 ? `^0.${minor}.0` : `~${major}.${minor}.0`;
}

// ─────────────────────────────────────────────────────────────
// Styling helpers
const COLORS = {
  goAwayGreen: '#8E9A76', // Disney "Go Away Green" (approx)
  noSeeUmGray: '#A3A3A2', // Disney "No-See-Um Gray" (approx)
};

const mark = {
  info: chalk.cyan('›'),
  warn: chalk.yellow('!'),
  error: chalk.red('✖'),
  ok: chalk.green('✔'),
};

function isInteractive() {
  return process.stdin.isTTY && process.stdout.isTTY && process.env.CVA_NONINTERACTIVE !== '1';
}

function banner() {
  const titleLines = ['create', 'valet', 'app'];
  try {
    const ascii = titleLines
      .map((t) => figlet.textSync(t, { font: 'ANSI Shadow', width: 100 }))
      .join('\n');
    const grad = gradient(COLORS.goAwayGreen, COLORS.noSeeUmGray)(ascii);
    console.log('\n' + grad);
    console.log(chalk.dim(`v${PKG.version || 'dev'}`));
  } catch {
    console.log();
    for (const line of titleLines) {
      console.log(chalk.bold.bgCyan.black(`  ${line}  `));
    }
    console.log(chalk.dim(`v${PKG.version || 'dev'}`));
  }
  console.log(chalk.dim('React + Vite the valet way'));
  console.log();
}

function readJSONSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function log(...args) { console.log(mark.info, ...args); }
function err(...args) { console.error(mark.error, ...args); }

function step(msg) { console.log(chalk.dim('•'), chalk.bold(msg)); }
function done(msg) { console.log(mark.ok, msg); }

async function withSpinner(text, fn) {
  if (!isInteractive()) {
    step(text);
    const res = await fn();
    return res;
  }
  const spinner = ora({ text, color: 'green' }).start();
  try {
    const res = await fn();
    spinner.succeed(text);
    return res;
  } catch (e) {
    spinner.fail(text);
    throw e;
  }
}

function usage() {
  console.log();
  console.log(chalk.bold('Create Valet App'), chalk.dim(`v${PKG.version || 'dev'}`));
  console.log();
  console.log(chalk.bold('Usage:'));
  console.log('  ', chalk.cyan('npx @archway/create-valet-app'), chalk.gray('<dir> [options]'));
  console.log('  ', chalk.cyan('npm create @archway/valet-app'), chalk.gray('<dir> [options]'));
  console.log();
  console.log(chalk.bold('Options:'));
  console.log('  ', chalk.green('--template'), chalk.gray('ts|js|hybrid   Choose template (default: ts)'));
  console.log('  ', chalk.green('--no-install'), chalk.gray('Skip dependency install (default runs install)'));
  console.log('  ', chalk.green('--pm'), chalk.gray('npm|pnpm|yarn|bun    Package manager (default: auto)'));
  console.log('  ', chalk.green('--git|--no-git'), chalk.gray('Initialize git repo (default: --git)'));
  console.log('  ', chalk.green('--mcp'), chalk.gray('Enable valet MCP guidance (default)'));
  console.log('  ', chalk.green('--no-mcp'), chalk.gray('Disable MCP guidance'));
  console.log('  ', chalk.green('--router|--no-router'), chalk.gray('Include React Router (default: --router)'));
  console.log('  ', chalk.green('--zustand|--no-zustand'), chalk.gray('Include Zustand store (default: --zustand)'));
  console.log('  ', chalk.green('--three|--r3f'), chalk.gray('Enable 3D (React Three Fiber) experience (default: off)'));
  console.log('  ', chalk.green('--no-three'), chalk.gray('Disable 3D experience'));
  console.log('  ', chalk.green('--minimal'), chalk.gray('Minimal files (single page; trims extras)'));
  console.log('  ', chalk.green('--path-alias'), chalk.gray('<token>     Import alias for src (default: @)'));
  console.log('  ', chalk.green('-h, --help'), chalk.gray('Show help'));
  console.log();
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const out = {
    dir: undefined,
    template: 'ts',
    install: true,
    pm: undefined,
    git: true,
    mcp: true,
    router: true,
    zustand: true,
    three: false,
    minimal: false,
    pathAlias: '@',
    help: false,
    // true if any CLI flag (starts with '-') was supplied
    hadFlags: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!out.dir && !a.startsWith('-')) { out.dir = a; continue; }
    if (a.startsWith('-')) out.hadFlags = true;
    if (a === '--template') { out.template = args[++i]; continue; }
    if (a === '--install') { out.install = true; continue; }
    if (a === '--no-install') { out.install = false; continue; }
    if (a === '--pm') { out.pm = args[++i]; continue; }
    if (a === '--git') { out.git = true; continue; }
    if (a === '--no-git') { out.git = false; continue; }
    if (a === '--mcp') { out.mcp = true; continue; }
    if (a === '--no-mcp') { out.mcp = false; continue; }
    if (a === '--router') { out.router = true; continue; }
    if (a === '--no-router') { out.router = false; continue; }
    if (a === '--zustand') { out.zustand = true; continue; }
    if (a === '--no-zustand') { out.zustand = false; continue; }
    if (a === '--three' || a === '--r3f') { out.three = true; continue; }
    if (a === '--no-three') { out.three = false; continue; }
    if (a === '--minimal') { out.minimal = true; continue; }
    if (a === '--path-alias') { out.pathAlias = args[++i]; continue; }
    if (a === '-h' || a === '--help') { out.help = true; continue; }
    err('Unknown option:', a);
    usage();
    process.exit(1);
  }
  return out;
}

function ensureNodeVersion() {
  const min = 18;
  const major = Number(process.versions.node.split('.')[0]);
  if (major < min) {
    err(`Node ${min}+ required. Detected ${process.versions.node}.`);
    process.exit(1);
  }
}

function resolvePM(preferred) {
  if (preferred) return preferred;
  const ua = process.env.npm_config_user_agent || '';
  if (/pnpm\//.test(ua)) return 'pnpm';
  if (/yarn\//.test(ua)) return 'yarn';
  if (/bun\//.test(ua)) return 'bun';
  return 'npm';
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dest, entry);
    const stat = fs.statSync(s);
    if (stat.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', ...opts });
    let settled = false;
    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      code === 0 ? resolve() : reject(new Error(`${cmd} exited ${code}`));
    });
  });
}

// Run a command while suppressing stdout/stderr. Returns a Promise that
// resolves on success or rejects with the captured error output (if any).
function runQuiet(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '';
    let errOut = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (errOut += d.toString()));
    let settled = false;
    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      reject(err);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      code === 0 ? resolve() : reject(new Error(errOut.trim() || out.trim() || `${cmd} exited ${code}`));
    });
  });
}

async function main() {
  ensureNodeVersion();
  const opts = parseArgs(process.argv);
  const interactive = process.stdin.isTTY && process.stdout.isTTY && process.env.CVA_NONINTERACTIVE !== '1';

  if (opts.help) { usage(); process.exit(0); }

  // Friendly banner for interactive sessions
  if (interactive) {
    // Clear the screen for a clean, modern feel
    try { console.clear(); } catch {}
    banner();
  }

  // New experience: if run without any --flags in an interactive TTY, ask
  // whether to customize defaults (defaults to "No"). If "Yes", launch a
  // guided wizard that helps decide flags. If "No", proceed with defaults
  // and only ask for a directory if missing.
  if (interactive && !opts.hadFlags) {
    const change = await promptConfirm('Would you like to change any of the default settings?', false);
    if (change) {
      const answers = await promptForFlagsExperience(opts);
      Object.assign(opts, answers);
    } else {
      if (!opts.dir) {
        opts.dir = await promptForDir(opts.dir || 'valet-app');
      }
    }
  } else if (!opts.dir && interactive) {
    // Fallback to existing full options prompt when flags are present but dir missing
    const answers = await promptForOptions(opts);
    Object.assign(opts, answers);
  }

  if (!opts.dir) { usage(); process.exit(1); }

  if (!['ts', 'js', 'hybrid'].includes(opts.template)) {
    err(`Unknown template '${opts.template}'. Use: ts | js | hybrid`);
    process.exit(1);
  }

  const targetDir = path.resolve(process.cwd(), opts.dir);
  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    err(`Target directory '${targetDir}' is not empty.`);
    process.exit(1);
  }
  fs.mkdirSync(targetDir, { recursive: true });

  await withSpinner('Scaffolding project', async () => {
    // Copy template
    const templateRoot = path.join(__dirname, '..', 'templates', opts.template);
    copyDir(templateRoot, targetDir);

    // Patch app package.json
    const appPkgPath = path.join(targetDir, 'package.json');
    const appPkg = readJSONSafe(appPkgPath);
    if (!appPkg) {
      err('Template package.json missing or invalid.');
      process.exit(1);
    }
    appPkg.name = normalizePkgName(opts.dir);
    // Ensure @archway/valet dependency is aligned to our target minor
    try {
      const minor = resolveValetMinor();
      const range = valetMinorRange(minor);
      appPkg.dependencies = appPkg.dependencies || {};
      if (appPkg.dependencies['@archway/valet'] !== range) {
        appPkg.dependencies['@archway/valet'] = range;
      }
    } catch {}
    writeJSON(appPkgPath, appPkg);

    // Ensure a useful .gitignore exists in the project
    ensureGitignore(targetDir);

    // Ensure an empty .valet-mcp directory exists at project root
    try {
      const mcpDir = path.join(targetDir, '.valet-mcp');
      if (!fs.existsSync(mcpDir)) fs.mkdirSync(mcpDir, { recursive: true });
    } catch {}
  });

  // Apply feature toggles (router/zustand/minimal/path alias)
  await withSpinner('Applying options', async () => {
    await applyFeatureToggles({ targetDir, template: opts.template, router: opts.router, zustand: opts.zustand, minimal: opts.minimal, pathAlias: opts.pathAlias, three: opts.three });
  });

  // Generate AGENTS.md from single source template unless --no-mcp
  await withSpinner('Generating guidance', async () => {
    await generateAgentsDoc({
      targetDir,
      include: opts.mcp,
      template: opts.template,
      router: opts.router,
      zustand: opts.zustand,
      minimal: opts.minimal,
      pathAlias: opts.pathAlias,
      three: opts.three,
    });
  });

  // If MCP is enabled, attempt to install the valet MCP server globally
  if (opts.mcp) {
      await withSpinner('Installing MCP', async () => {
      await installGlobalMCP();
    });
    // Run potential interactive config outside spinner to avoid UI conflicts
    await ensureMCPConfig();
  }

  // Git init (default; opt-out with --no-git)
  if (opts.git) {
    try {
      await withSpinner('Initializing git', async () => {
        // verify git is available
        try { await execCapture('git', ['--version']); } catch {
          throw new Error('git is not installed or not in PATH');
        }

        // init repository with main as default branch (fallback to rename)
        try {
          await runQuiet('git', ['init', '-b', 'main'], { cwd: targetDir });
        } catch {
          await runQuiet('git', ['init'], { cwd: targetDir });
          try { await runQuiet('git', ['branch', '-M', 'main'], { cwd: targetDir }); } catch {}
        }

        // ensure identity, prompting locally if missing
        const identityReady = await ensureGitIdentity({ cwd: targetDir });

        // stage and (optionally) commit
        await runQuiet('git', ['add', '.'], { cwd: targetDir });
        if (identityReady) {
          await runQuiet('git', ['commit', '-m', 'init(create-valet-app): scaffold template'], { cwd: targetDir });
        } else {
          log('Skipping initial commit. Tip: configure git identity then run:');
          console.log('   ', chalk.gray('git'), 'config user.name', chalk.cyan('"Your Name"'));
          console.log('   ', chalk.gray('git'), 'config user.email', chalk.cyan('"you@example.com"'));
          console.log('   ', chalk.gray('git'), 'commit -m', chalk.cyan('"init(create-valet-app): scaffold template"'));
        }
      });
    } catch (e) {
      err('git init failed (continuing):', e.message);
    }
  }

  // Install (optional)
  if (opts.install) {
    const pm = resolvePM(opts.pm);
    const args = pm === 'npm' ? ['install'] : ['install'];
    try {
      await withSpinner(`Installing dependencies (${pm})`, async () => {
        await runQuiet(pm, args, { cwd: targetDir });
      });
    } catch (e) {
      err(`${pm} install failed (continuing):`, e.message);
    }
  }

  // Final handoff
  showSuccessSummary({ targetDir, installed: opts.install });

  // Optional niceties in interactive terminals
  if (interactive) {
    // Ask both questions first, then act.
    let openInCode = false;
    let startNow = false;

    const canCode = await hasBinary('code', ['-v']);
    if (canCode) {
      openInCode = await promptConfirm('Open project in VS Code?', true);
    }
    startNow = await promptConfirm('Start the dev server now?', true);

    // Act after both answers are known
    if (openInCode) {
      try {
        const readme = path.join(targetDir, 'README.md');
        const args = fs.existsSync(readme)
          ? ['-n', targetDir, readme]
          : ['-n', targetDir];
        await run('code', args);
      } catch {}
    }
    if (startNow) {
      const pmNow = resolvePM(opts.pm);
      const args = pmNow === 'npm' ? ['run', 'dev', '--', '--open'] : ['run', 'dev', '--', '--open'];
      try {
        await run(pmNow, args, { cwd: targetDir });
      } catch (e) {
        err('Failed to start dev server (continuing):', e.message);
      }
    }

    // Finally, switch the user into a shell whose cwd is the project directory.
    await openShellInProject(targetDir);
  }
}

function normalizePkgName(input) {
  // turn into kebab, drop invalid chars
  const base = path.basename(input).toLowerCase().replace(/[^a-z0-9-_.]/g, '-');
  return base || 'valet-app';
}

main().catch((e) => {
  err(e.stack || e.message || String(e));
  process.exit(1);
});

// ─────────────────────────────────────────────────────────────
// Feature toggles and file transformations
async function applyFeatureToggles({ targetDir, template, router, zustand, minimal, pathAlias, three }) {
  const isJS = template === 'js';
  const exts = {
    main: isJS ? 'jsx' : 'tsx',
    app: isJS ? 'jsx' : 'tsx',
    quickstart: isJS ? 'jsx' : 'tsx',
    second: isJS ? 'jsx' : 'tsx',
    presets: isJS ? 'js' : 'ts',
    store: isJS ? 'js' : 'ts',
  };

  const p = (...xs) => path.join(targetDir, ...xs);
  const files = {
    main: p('src', `main.${exts.main}`),
    app: p('src', `App.${exts.app}`),
    quickstart: p('src', 'pages', 'start', `Quickstart.${exts.quickstart}`),
    secondPage: p('src', 'pages', 'second', `SecondPage.${exts.second}`),
    secondDir: p('src', 'pages', 'second'),
    storeDir: p('src', 'store'),
    viteConfig: p(`vite.config.${isJS ? 'js' : 'ts'}`),
    tsconfigApp: p('tsconfig.app.json'),
    jsconfig: p('jsconfig.json'),
    pkg: p('package.json'),
  };

  // Router toggle
  if (!router) {
    safePkgMutate(files.pkg, (pkg) => {
      if (pkg.dependencies && pkg.dependencies['react-router-dom']) delete pkg.dependencies['react-router-dom'];
      return pkg;
    });
    // main.* without BrowserRouter
    const mainNoRouter = isJS
      ? `import React from "react";
import ReactDOM from "react-dom/client";
import "@/presets/globalPresets";
import { App } from "@/App";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`
      : `import React from "react";
import ReactDOM from "react-dom/client";
import "@/presets/globalPresets";
import { App } from "@/App";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;
    fs.writeFileSync(files.main, mainNoRouter);

    // App.* render Quickstart only, keep theme init
    const appNoRouter = isJS
      ? `import { useInitialTheme } from "@archway/valet";
import QuickstartPage from "@/pages/start/Quickstart";

export function App() {
  useInitialTheme(
    {
      fonts: {
        heading: "Kumbh Sans",
        body: "Inter",
        mono: "JetBrains Mono",
        button: "Kumbh Sans",
      },
    },
    ["Kumbh Sans", "JetBrains Mono", "Inter"],
  );
  return <QuickstartPage />;
}
`
      : `import { useInitialTheme } from "@archway/valet";
import QuickstartPage from "@/pages/start/Quickstart";

export function App() {
  useInitialTheme(
    {
      fonts: {
        heading: "Kumbh Sans",
        body: "Inter",
        mono: "JetBrains Mono",
        button: "Kumbh Sans",
      },
    },
    ["Kumbh Sans", "JetBrains Mono", "Inter"],
  );
  return <QuickstartPage />;
}
`;
    fs.writeFileSync(files.app, appNoRouter);

    // Quickstart: remove navigate button and import
    const qsNoNav = isJS
      ? `import { Surface, Stack, Box, Typography } from "@archway/valet";

export default function QuickstartPage() {
  return (
    <Surface>
      <Box alignX="center" centerContent>
        <Stack>
          <Typography>Welcome to Valet</Typography>
        </Stack>
      </Box>
    </Surface>
  );
}
`
      : `import { Surface, Stack, Box, Typography } from "@archway/valet";

export default function QuickstartPage() {
  return (
    <Surface>
      <Box alignX="center" centerContent>
        <Stack>
          <Typography>Welcome to Valet</Typography>
        </Stack>
      </Box>
    </Surface>
  );
}
`;
    fs.writeFileSync(files.quickstart, qsNoNav);

    // Remove second page entirely
    if (fs.existsSync(files.secondDir)) fs.rmSync(files.secondDir, { recursive: true, force: true });
  } else {
    // Router is enabled; if minimal, keep only Quickstart route and remove SecondPage
    if (minimal) {
      const appRouterMinimal = isJS
        ? `import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { useInitialTheme, Surface, Stack, Typography } from "@archway/valet";

const page = (p) => lazy(() => p().then((m) => ({ default: m.default })));
const QuickstartPage = page(() => import("@/pages/start/Quickstart"));

export function App() {
  useInitialTheme(
    {
      fonts: {
        heading: "Kumbh Sans",
        body: "Inter",
        mono: "JetBrains Mono",
        button: "Kumbh Sans",
      },
    },
    ["Kumbh Sans", "JetBrains Mono", "Inter"],
  );

  const Fallback = (
    <Surface>
      <Stack sx={{ padding: "2rem", alignItems: "center" }}>
        <Typography variant="subtitle">Loading…</Typography>
      </Stack>
    </Surface>
  );

  return (
    <Suspense fallback={Fallback}>
      <Routes>
        <Route path="/" element={<QuickstartPage />} />
      </Routes>
    </Suspense>
  );
}
`
        : `import React, { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { useInitialTheme, Surface, Stack, Typography } from "@archway/valet";

const page = <T extends { default: React.ComponentType }>(
  p: () => Promise<T>,
) =>
  lazy(() => p().then((m) => ({ default: m.default })));

const QuickstartPage = page(() => import("@/pages/start/Quickstart"));

export function App() {
  useInitialTheme(
    {
      fonts: {
        heading: "Kumbh Sans",
        body: "Inter",
        mono: "JetBrains Mono",
        button: "Kumbh Sans",
      },
    },
    ["Kumbh Sans", "JetBrains Mono", "Inter"],
  );

  const Fallback = (
    <Surface>
      <Stack sx={{ padding: "2rem", alignItems: "center" }}>
        <Typography variant="subtitle">Loading…</Typography>
      </Stack>
    </Surface>
  );

  return (
    <Suspense fallback={Fallback}>
      <Routes>
        <Route path="/" element={<QuickstartPage />} />
      </Routes>
    </Suspense>
  );
}
`;
      fs.writeFileSync(files.app, appRouterMinimal);

      // Quickstart should not link to non-existent second page
      const qsMinimal = isJS
        ? `import { Surface, Stack, Box, Typography } from "@archway/valet";

export default function QuickstartPage() {
  return (
    <Surface>
      <Box alignX=\"center\" centerContent>
        <Stack>
          <Typography>Welcome to Valet</Typography>
        </Stack>
      </Box>
    </Surface>
  );
}
`
        : `import { Surface, Stack, Box, Typography } from "@archway/valet";

export default function QuickstartPage() {
  return (
    <Surface>
      <Box alignX=\"center\" centerContent>
        <Stack>
          <Typography>Welcome to Valet</Typography>
        </Stack>
      </Box>
    </Surface>
  );
}
`;
      fs.writeFileSync(files.quickstart, qsMinimal);
      if (fs.existsSync(files.secondDir)) fs.rmSync(files.secondDir, { recursive: true, force: true });
    }
  }

  // Zustand toggle
  if (!zustand) {
    safePkgMutate(files.pkg, (pkg) => {
      if (pkg.dependencies && pkg.dependencies['zustand']) delete pkg.dependencies['zustand'];
      return pkg;
    });
    if (fs.existsSync(files.storeDir)) fs.rmSync(files.storeDir, { recursive: true, force: true });
  }

  // Path alias token change across code and config
  if (pathAlias && pathAlias !== '@') {
    // Update Vite alias key
    if (fs.existsSync(files.viteConfig)) {
      const vc = fs.readFileSync(files.viteConfig, 'utf8');
      const updated = vc.replace(/(['"])@(['"])\s*:\s*path\.resolve/g, `$1${pathAlias}$2: path.resolve`);
      fs.writeFileSync(files.viteConfig, updated);
    }
    // Update tsconfig/jsconfig path mapping
    if (!isJS && fs.existsSync(files.tsconfigApp)) {
      const raw = fs.readFileSync(files.tsconfigApp, 'utf8');
      try {
        const j = JSON.parse(raw);
        if (j.compilerOptions && j.compilerOptions.paths) {
          if (j.compilerOptions.paths['@/*']) {
            j.compilerOptions.paths[`${pathAlias}/*`] = j.compilerOptions.paths['@/*'];
            delete j.compilerOptions.paths['@/*'];
          }
        }
        fs.writeFileSync(files.tsconfigApp, JSON.stringify(j, null, 2) + '\n');
      } catch {
        // Very loose fallback: swap the key token only
        const swapped = raw.split('"@/*"').join(`"${pathAlias}/*"`);
        fs.writeFileSync(files.tsconfigApp, swapped);
      }
    }
    if (isJS && fs.existsSync(files.jsconfig)) {
      const raw = fs.readFileSync(files.jsconfig, 'utf8');
      try {
        const j = JSON.parse(raw);
        if (j.compilerOptions && j.compilerOptions.paths) {
          if (j.compilerOptions.paths['@/*']) {
            j.compilerOptions.paths[`${pathAlias}/*`] = j.compilerOptions.paths['@/*'];
            delete j.compilerOptions.paths['@/*'];
          }
        }
        fs.writeFileSync(files.jsconfig, JSON.stringify(j, null, 2) + '\n');
      } catch {
        const swapped = raw.split('"@/*"').join(`"${pathAlias}/*"`);
        fs.writeFileSync(files.jsconfig, swapped);
      }
    }
    // Update source imports '@/...' -> '<alias>/...'
    const srcDir = p('src');
    rewriteAliasInTree(srcDir, '@/', `${pathAlias}/`);
  }

  // ─────────────────────────────────────────────────────────
  // Optional 3D (React Three Fiber) experience
  if (three) {
    // Ensure dependencies
    safePkgMutate(files.pkg, (pkg) => {
      pkg.dependencies = pkg.dependencies || {};
      if (!pkg.dependencies['three']) pkg.dependencies['three'] = '^0.179.0';
      if (!pkg.dependencies['@react-three/fiber']) pkg.dependencies['@react-three/fiber'] = '^9.3.0';
      if (!pkg.dependencies['@react-three/drei']) pkg.dependencies['@react-three/drei'] = '^10.7.0';
      return pkg;
    });

    // Replace Quickstart with a fullscreen Canvas + Valet HUD overlay
    const isJS = template === 'js';
    const quickstartContent = isJS
      ? `import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Surface, Stack, Panel, Box, Typography, Icon } from "@archway/valet";

function SpinningCube() {
  const ref = useRef();
  useFrame((_, dt) => {
    if (!ref.current) return;
    ref.current.rotation.x += dt * 0.6;
    ref.current.rotation.y += dt * 0.9;
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4bd0d2" roughness={0.4} metalness={0.2} />
    </mesh>
  );
}

export default function QuickstartPage() {
  return (
    <Surface>
      {/* Fullscreen 3D background */}
      <Canvas
        shadows
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: "#1a2230",
        }}
        camera={{ position: [2.5, 2, 3.5], fov: 55 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 5]} intensity={1} castShadow />
        <group position={[0, 0, 0]}>
          <SpinningCube />
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.51, 0]}
            receiveShadow
          >
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#263445" roughness={1} metalness={0} />
          </mesh>
        </group>
      </Canvas>

      {/* Simple Valet UI overlay */}
      <Box sx={{ position: "relative", pointerEvents: "none" }}>
        <Box sx={{ position: "fixed", top: "1rem", left: "1rem" }}>
          <Panel preset="frostedGlass">
            <Stack direction="row" gap={2}>
              <Stack direction="row" gap={1}>
                <Icon icon="mdi:cube-outline" size="md" />
                <Typography variant="subtitle">Spinning cube</Typography>
              </Stack>
              <Stack direction="row" gap={1}>
                <Icon icon="mdi:vector-triangle" size="md" />
                <Typography variant="subtitle">R3F + Valet overlay</Typography>
              </Stack>
            </Stack>
          </Panel>
        </Box>
      </Box>
    </Surface>
  );
}
`
      : `import React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Surface, Stack, Panel, Box, Typography, Icon } from "@archway/valet";

function SpinningCube() {
  const ref = React.useRef(null);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    // @ts-expect-error dynamic ref typing for demo simplicity
    m.rotation.x += dt * 0.6;
    // @ts-expect-error dynamic ref typing for demo simplicity
    m.rotation.y += dt * 0.9;
  });
  return (
    <mesh ref={ref} position={[0, 0, 0]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4bd0d2" roughness={0.4} metalness={0.2} />
    </mesh>
  );
}

export default function QuickstartPage() {
  return (
    <Surface>
      {/* Fullscreen 3D background */}
      <Canvas
        shadows
        style={{
          position: "fixed",
          inset: 0,
          zIndex: -1,
          background: "#1a2230",
        }}
        camera={{ position: [2.5, 2, 3.5], fov: 55 }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 6, 5]} intensity={1} castShadow />
        <group position={[0, 0, 0]}>
          <SpinningCube />
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.51, 0]}
            receiveShadow
          >
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#263445" roughness={1} metalness={0} />
          </mesh>
        </group>
      </Canvas>

      {/* Simple Valet UI overlay */}
      <Box sx={{ position: "relative", pointerEvents: "none" }}>
        <Box sx={{ position: "fixed", top: "1rem", left: "1rem" }}>
          <Panel preset="frostedGlass">
            <Stack direction="row" gap={2}>
              <Stack direction="row" gap={1}>
                <Icon icon="mdi:cube-outline" size="md" />
                <Typography variant="subtitle">Spinning cube</Typography>
              </Stack>
              <Stack direction="row" gap={1}>
                <Icon icon="mdi:vector-triangle" size="md" />
                <Typography variant="subtitle">R3F + Valet overlay</Typography>
              </Stack>
            </Stack>
          </Panel>
        </Box>
      </Box>
    </Surface>
  );
}
`;
    try {
      if (template === 'hybrid') {
        const jsxPath = p('src', 'pages', 'start', 'Quickstart.jsx');
        fs.writeFileSync(jsxPath, quickstartContent);
        // Remove TSX version if present to align with R3F pages policy
        if (fs.existsSync(files.quickstart)) {
          try { fs.rmSync(files.quickstart); } catch {}
        }
      } else {
        fs.writeFileSync(files.quickstart, quickstartContent);
      }
    } catch {}
  }
}

function rewriteAliasInTree(rootDir, fromPrefix, toPrefix) {
  for (const entry of fs.readdirSync(rootDir)) {
    const full = path.join(rootDir, entry);
    const st = fs.statSync(full);
    if (st.isDirectory()) rewriteAliasInTree(full, fromPrefix, toPrefix);
    else if (/\.(t|j)sx?$/.test(entry)) {
      const txt = fs.readFileSync(full, 'utf8');
      // Only replace bare '@/', avoid '@archway/...'
      const updated = txt.replace(/([\'\"])@\//g, `$1${toPrefix}`);
      if (updated !== txt) fs.writeFileSync(full, updated);
    }
  }
}

function safePkgMutate(pkgPath, mutator) {
  const pkg = readJSONSafe(pkgPath);
  if (!pkg) return;
  const next = mutator(pkg) || pkg;
  writeJSON(pkgPath, next);
}

// ─────────────────────────────────────────────────────────────
// Git helpers
function ensureGitignore(targetDir) {
  const p = path.join(targetDir, '.gitignore');
  if (fs.existsSync(p)) return;
  const contents = `# Logs
logs
*.log
npm-debug.log*


build/Release

node_modules/

*.tsbuildinfo

.npm

.eslintcache

.stylelintcache

*.tgz

.env
.env.*
!.env.example

dist

.temp
.cache

# Valet MCP working directory
.valet-mcp/

**/.vitepress/dist
**/.vitepress/cache
vite.config.js.timestamp-*
vite.config.ts.timestamp-*

# Stores VSCode versions used for testing VSCode extensions
.vscode-test
`;
  try { fs.writeFileSync(p, contents); } catch {}
}

async function ensureGitIdentity({ cwd }) {
  // Returns true if identity is configured (locally or globally). If missing
  // and interactive, prompts and sets local config for this repo.
  const nonInteractive = process.env.CVA_NONINTERACTIVE === '1' || !process.stdin.isTTY || !process.stdout.isTTY;

  async function get(key) {
    try {
      const out = await execCapture('git', ['config', '--get', key], { cwd });
      return out.trim();
    } catch {
      return '';
    }
  }

  let name = await get('user.name');
  let email = await get('user.email');
  if (name && email) return true;

  if (nonInteractive) return false;

  const { Input } = enquirer;
  if (!name) {
    name = await new Input({ name: 'gitName', message: 'Git user.name', initial: os.userInfo().username || '' }).run();
  }
  if (!email) {
    email = await new Input({ name: 'gitEmail', message: 'Git user.email', initial: '' }).run();
  }
  if (!name || !email) return false;

  try {
    await runQuiet('git', ['config', 'user.name', name], { cwd });
    await runQuiet('git', ['config', 'user.email', email], { cwd });
    return true;
  } catch {
    return false;
  }
}

function execCapture(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'], ...opts });
    let out = '';
    let err = '';
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    let settled = false;
    child.on('error', (e) => {
      if (settled) return;
      settled = true;
      reject(e);
    });
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      code === 0 ? resolve(out) : reject(new Error(err || `${cmd} exited ${code}`));
    });
  });
}

function showSuccessSummary({ targetDir, installed }) {
  const rel = path.relative(process.cwd(), targetDir) || '.';
  const title = chalk.bold.green('Success! ') + chalk.reset('Your Valet app is ready');
  const steps = [
    chalk.cyan(`cd ${rel}`),
    !installed ? chalk.gray('npm install') : null,
    chalk.cyan('npm run dev'),
  ].filter(Boolean).map((l) => `• ${l}`).join('\n');

  const body = `${title}\n\n${steps}`;
  const box = boxen(body, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'green',
  });
  console.log(box);
}

async function hasBinary(cmd, testArgs = ['--version']) {
  try { await execCapture(cmd, testArgs); return true; } catch { return false; }
}

async function openShellInProject(dir) {
  const isWin = process.platform === 'win32';
  const shell = isWin ? (process.env.COMSPEC || process.env.ComSpec || 'cmd.exe') : (process.env.SHELL || 'bash');
  const args = [];
  try {
    done(`Opening shell in ${chalk.cyan(dir)} (type 'exit' to return)`);
    await run(shell, args, { cwd: dir });
  } catch (e) {
    err('Failed to open an interactive shell:', e.message);
  }
}

// ─────────────────────────────────────────────────────────────
// Render single-source AGENTS.md (and CLAUDE.md) tailored to template and flags
async function generateAgentsDoc({ targetDir, include, template, router, zustand, minimal, pathAlias, three }) {
  const agentsPath = path.join(targetDir, 'AGENTS.md');
  const claudePath = path.join(targetDir, 'CLAUDE.md');
  if (!include) {
    if (fs.existsSync(agentsPath)) fs.rmSync(agentsPath);
    if (fs.existsSync(claudePath)) fs.rmSync(claudePath);
    return;
  }
  const basePath = path.join(__dirname, '..', 'templates', 'AGENTS.base.md');
  let base = '';
  try {
    base = fs.readFileSync(basePath, 'utf8');
  } catch {
    // If missing, skip gracefully
    return;
  }

  const isJS = template === 'js';
  const isTS = template === 'ts';
  const isHybrid = template === 'hybrid';

  const LANG_NOTE = isJS
    ? 'This is a JavaScript-only template; there is no typecheck step.'
    : isTS
      ? 'This is a TypeScript template.'
      : 'This is a hybrid template: TypeScript by default, JavaScript files allowed.';

  const AGENT_COMMANDS = [
    '- Lint: `npm run -s lint:agent`',
    '- Fix lint: `npm run -s lint:fix:agent`',
    !isJS ? '- Typecheck: `npm run -s typecheck:agent`' : null,
    '- Format check: `npm run -s format:agent`',
    '- Format write: `npm run -s format:fix:agent`',
    '- Build: `npm run -s build:agent`',
  ].filter(Boolean).join('\n');

  const FEATURES_LIST = [
    `- Router: ${router ? 'enabled' : 'disabled'}`,
    `- Zustand: ${zustand ? 'enabled' : 'disabled'}`,
    `- Minimal mode: ${minimal ? 'on' : 'off'}`,
    `- Path alias token: \`${pathAlias || '@'}\` (import from \`${pathAlias || '@'}/...\`)`,
  ].join('\n');

  const DOD_LIST = [
    !isJS ? '- TypeScript typechecks clean.' : '- Typecheck: n/a for JS template.',
    '- Build succeeds.',
    '- Lint/format clean or auto-fixed.',
  ].join('\n');

  let rendered = base
    .replace('{{LANG_NOTE}}', LANG_NOTE)
    .replace('{{AGENT_COMMANDS}}', AGENT_COMMANDS)
    .replace('{{FEATURES_LIST}}', FEATURES_LIST)
    .replace('{{DOD_LIST}}', DOD_LIST);

  // If 3D experience is enabled and hybrid template is used, append R3F Pages Policy note
  if (three && isHybrid) {
    const R3F_POLICY = `\n---\n\nR3F Pages Policy\n\n- For React Three Fiber heavy pages (scenes, start screens with 3D backgrounds, gameplay canvases), implement them as \`.jsx\` files instead of \`.tsx\`.\n- Reason: JSX avoids TypeScript friction with R3F/three element props and keeps iterative scene work fast. Keep TypeScript for UI/logic modules where typing adds the most value.\n`;
    rendered += '\n' + R3F_POLICY;
  }

  // Write AGENTS.md as-is
  fs.writeFileSync(agentsPath, rendered);

  // Write CLAUDE.md with the same content but a CLAUDE.md heading
  const renderedClaude = rendered.replace('# AGENTS.md', '# CLAUDE.md');
  fs.writeFileSync(claudePath, renderedClaude);
}

// Attempt to install @archway/valet-mcp globally when MCP is enabled.
// Uses the same minor line as the Valet dependency in templates.
// Skips install if CVA_SKIP_GLOBAL_MCP=1 is set, or if install fails (non-fatal).
async function installGlobalMCP() {
  if (process.env.CVA_SKIP_GLOBAL_MCP === '1') return;
  try {
    // Prefer upgrading within the currently installed MINOR if valet-mcp is present.
    // Otherwise, install aligned to this CLI's target minor.
    let range;

    // Try to detect installed global version from the binary first
    let installedVersion = '';
    try {
      const out = await execCapture('valet-mcp', ['--version']);
      installedVersion = (out || '').trim();
    } catch {
      // Fallback to npm ls -g (best-effort)
      try {
        const json = await execCapture('npm', ['ls', '-g', '@archway/valet-mcp', '--json', '--long']);
        const info = JSON.parse(json);
        const dep = (info && (info.dependencies && info.dependencies['@archway/valet-mcp'])) || info;
        if (dep && dep.version) installedVersion = String(dep.version);
      } catch {}
    }

    const parsed = parseSemver(installedVersion);
    if (parsed) {
      range = minorLockedRange(parsed.major, parsed.minor);
    } else {
      const minor = resolveValetMinor();
      range = valetMinorRange(minor); // e.g., ^0.31.0
    }

    // Use npm explicitly for global install to match common tooling
    await runQuiet('npm', ['i', '-g', `@archway/valet-mcp@${range}`, '--no-fund', '--no-audit']);
  } catch (e) {
    err('Global install of @archway/valet-mcp failed (continuing):', e.message);
    const minor = resolveValetMinor();
    const range = valetMinorRange(minor);
    err(`You can install it manually: npm i -g @archway/valet-mcp@${range}`);
  }
}

// Ensure Codex CLI knows about the valet MCP server by checking ~/.codex/config.toml.
// If the file is missing the valet entry, prompt the user to add it.
async function ensureMCPConfig() {
  const nonInteractive = process.env.CVA_NONINTERACTIVE === '1' || !process.stdin.isTTY || !process.stdout.isTTY;
  const configDir = path.join(os.homedir(), '.codex');
  const configPath = path.join(configDir, 'config.toml');
  let content = '';
  let exists = false;
  try {
    content = fs.readFileSync(configPath, 'utf8');
    exists = true;
  } catch {}
  const hasValet = /\[mcp_servers\.valet\]/m.test(content);
  if (hasValet) return; // already configured

  const block = `\n[mcp_servers.valet]\ncommand = "valet-mcp"\nargs = []\n`;

  if (nonInteractive) {
    log('MCP is enabled. Tip: add valet server to ~/.codex/config.toml:');
    console.log(block.trim());
    return;
  }

  const question = exists
    ? 'MCP enabled, but ~/.codex/config.toml lacks a valet entry. Add it now?'
    : 'MCP enabled. Create ~/.codex/config.toml with a valet entry?';

  const answer = await promptConfirm(question, true);
  if (!answer) return;

  try {
    if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
    const prefix = exists && content.trim().length ? (content.endsWith('\n') ? '' : '\n') + '\n' : '';
    const next = (content || '') + prefix + block;
    fs.writeFileSync(configPath, next);
    done(`Updated ${chalk.cyan(configPath)} with valet MCP server`);
  } catch (e) {
    err('Failed to update', configPath, '(continuing):', e.message);
  }
}

async function promptConfirm(message, initial = true) {
  const { Confirm } = enquirer;
  const prompt = new Confirm({ name: 'answer', message, initial });
  const answer = await prompt.run();
  return Boolean(answer);
}

async function promptForDir(initial = 'valet-app') {
  const { Input } = enquirer;
  const dir = await new Input({
    name: 'dir',
    message: 'Project directory',
    initial,
  }).run();
  return dir;
}

async function promptForOptions(defaults) {
  const { Select, Confirm, Input } = enquirer;

  const dir = await new Input({
    name: 'dir',
    message: 'Project directory',
    initial: defaults.dir || 'valet-app',
  }).run();

  const template = await new Select({
    name: 'template',
    message: 'Choose a template',
    choices: [
      { name: 'ts', message: 'TypeScript (recommended)' },
      { name: 'js', message: 'JavaScript' },
      { name: 'hybrid', message: 'Hybrid (TS + JS)' },
    ],
    initial: ['ts', 'js', 'hybrid'].indexOf(defaults.template || 'ts'),
  }).run();

  const router = await new Confirm({
    name: 'router',
    message: 'Include React Router?',
    initial: defaults.router !== undefined ? defaults.router : true,
  }).run();

  const zustand = await new Confirm({
    name: 'zustand',
    message: 'Include Zustand store?',
    initial: defaults.zustand !== undefined ? defaults.zustand : true,
  }).run();

  const three = await new Confirm({
    name: 'three',
    message: 'Enable 3D (React Three Fiber) experience?',
    initial: defaults.three !== undefined ? defaults.three : false,
  }).run();

  const minimal = await new Confirm({
    name: 'minimal',
    message: 'Minimal mode (single page)?',
    initial: Boolean(defaults.minimal),
  }).run();

  const pathAlias = await new Input({
    name: 'pathAlias',
    message: 'Path alias token for src imports',
    initial: defaults.pathAlias || '@',
  }).run();

  const git = await new Confirm({
    name: 'git',
    message: 'Initialize a git repository?',
    initial: Boolean(defaults.git),
  }).run();

  const mcp = await new Confirm({
    name: 'mcp',
    message: 'Enable valet MCP guidance?',
    initial: defaults.mcp !== undefined ? defaults.mcp : true,
  }).run();

  const install = await new Confirm({
    name: 'install',
    message: 'Install dependencies?',
    initial: defaults.install !== undefined ? defaults.install : true,
  }).run();

  let pm = defaults.pm;
  if (install) {
    const detected = resolvePM();
    pm = await new Select({
      name: 'pm',
      message: 'Package manager',
      choices: [
        { name: 'npm', message: 'npm' },
        { name: 'pnpm', message: 'pnpm' },
        { name: 'yarn', message: 'yarn' },
        { name: 'bun', message: 'bun' },
      ],
      initial: ['npm', 'pnpm', 'yarn', 'bun'].indexOf(detected),
    }).run();
  }

  console.log();
  done('Configuration ready');
  return { dir, template, router, zustand, three, minimal, pathAlias, git, mcp, install, pm };
}

// Guided refinement wizard to tweak all flags.
async function promptForFlagsExperience(defaults) {
  // No preset selection; jump straight to full-options refinement seeded with current defaults

  // Intro text
  console.log(boxen(chalk.bold('Customize your Valet app') + '\n' + chalk.dim('Review and tweak any setting'), {
    padding: 1,
    margin: 0,
    borderColor: 'cyan',
    borderStyle: 'round',
  }));
  console.log();
  const base = {
    dir: defaults.dir || 'valet-app',
    template: defaults.template,
    install: defaults.install,
    pm: defaults.pm,
    git: defaults.git,
    mcp: defaults.mcp,
    router: defaults.router,
    zustand: defaults.zustand,
    three: defaults.three,
    minimal: defaults.minimal,
    pathAlias: defaults.pathAlias,
  };

  // Now let the user review and refine all options
  return await promptForOptions(base);
}
