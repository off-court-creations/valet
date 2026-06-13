// ─────────────────────────────────────────────────────────────
// scripts/release/check-changelog.mjs  | valet
// Release gate: the version in package.json must have a CHANGELOG.md
// section, and the Unreleased section must be empty at release time.
// CLI: node scripts/release/check-changelog.mjs [--warn] [--root <dir>]
// (--warn reports problems without failing, for non-release CI)
// ─────────────────────────────────────────────────────────────
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

/**
 * Parse a Keep-a-Changelog style document into its `## ` sections.
 * Handles both `## Unreleased` / `## [Unreleased]` and version headings
 * like `## [0.32.0]` or `## 0.32.0 - 2026-06-10`.
 * Returns [{ title, version|null, unreleased, body: string[] }].
 */
export function parseChangelog(markdown) {
  const sections = [];
  let current = null;
  for (const line of String(markdown).split(/\r?\n/)) {
    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      const title = heading[1].trim();
      const version = title.match(/^\[?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\]?/);
      current = {
        title,
        version: version ? version[1] : null,
        unreleased: /^\[?unreleased\]?$/i.test(title),
        body: [],
      };
      sections.push(current);
      continue;
    }
    if (current) current.body.push(line);
  }
  return sections;
}

/** A section counts as empty when it holds only blank lines and `###` stubs. */
export function sectionBodyIsEmpty(body) {
  return body.every((line) => line.trim() === '' || /^###\s/.test(line.trim()));
}

/** Pure gate: returns a list of problem strings (empty array = pass). */
export function checkChangelog({ version, changelog }) {
  const problems = [];
  const sections = parseChangelog(changelog);
  if (!sections.some((s) => s.version === version)) {
    problems.push(`CHANGELOG.md has no "## [${version}]" section for the version being released`);
  }
  const unreleased = sections.find((s) => s.unreleased);
  if (unreleased && !sectionBodyIsEmpty(unreleased.body)) {
    problems.push(
      `CHANGELOG.md "## ${unreleased.title}" still has content; move it into the [${version}] section before publishing`,
    );
  }
  return problems;
}

function parseArgs(argv) {
  const warn = argv.includes('--warn');
  let root = path.resolve(fileURLToPath(import.meta.url), '../../..');
  const i = argv.indexOf('--root');
  if (i !== -1 && argv[i + 1]) root = path.resolve(argv[i + 1]);
  return { warn, root };
}

/** Thin CLI wrapper; returns the intended exit code. */
export function main(argv = process.argv.slice(2)) {
  const { warn, root } = parseArgs(argv);
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const changelogPath = path.join(root, 'CHANGELOG.md');
  const problems = fs.existsSync(changelogPath)
    ? checkChangelog({ version: pkg.version, changelog: fs.readFileSync(changelogPath, 'utf8') })
    : ['CHANGELOG.md not found at the repo root'];
  if (problems.length === 0) {
    console.log(
      `check-changelog: OK — CHANGELOG.md has a [${pkg.version}] section and Unreleased is empty`,
    );
    return 0;
  }
  for (const p of problems) console.error(`check-changelog: ${warn ? 'WARN' : 'ERROR'} — ${p}`);
  return warn ? 0 : 1;
}

const entry = process.argv[1];
if (entry && pathToFileURL(path.resolve(entry)).href === import.meta.url) {
  process.exit(main());
}
