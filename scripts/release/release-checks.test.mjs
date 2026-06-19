// ─────────────────────────────────────────────────────────────
// scripts/release/release-checks.test.mjs  | valet
// Fixture tests for the release-gate scripts (node environment):
// check-changelog.mjs + check-pins.mjs pure functions and CLI exit codes
// ─────────────────────────────────────────────────────────────
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  parseChangelog,
  sectionBodyIsEmpty,
  checkChangelog,
  main as changelogMain,
} from './check-changelog.mjs';
import {
  pinTargetVersion,
  collectPins,
  checkPins,
  lockedValetVersion,
  checkLockfiles,
  main as pinsMain,
} from './check-pins.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');

// ── fixtures ─────────────────────────────────────────────────
const RELEASED_CHANGELOG = `# Changelog

Intro prose.

## Unreleased

## [0.34.1] - 2026-06-10

### Fixed

- A fix that shipped.

## [0.32.0]

### Added

- An older entry.

[v0.32.0]: https://example.com/v0.32.0
`;

const UNRELEASED_FULL_CHANGELOG = `# Changelog

## Unreleased

### Added

- Pending work not yet cut into a release.

## [0.34.1]

- Released entry.
`;

/** Build a throwaway repo on disk for CLI exit-code tests. */
function makeFixtureRepo({ version, changelog, docsPin, templatePin }) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'valet-release-checks-'));
  const write = (rel, data) => {
    const file = path.join(root, rel);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, data);
  };
  write('package.json', JSON.stringify({ name: '@archway/valet', version }));
  write('CHANGELOG.md', changelog);
  write('docs/package.json', JSON.stringify({ dependencies: { '@archway/valet': docsPin } }));
  write(
    'packages/create-valet-app/templates/ts/package.json',
    JSON.stringify({ dependencies: { '@archway/valet': templatePin } }),
  );
  return root;
}

const GOOD_REPO = {
  version: '0.34.1',
  changelog: RELEASED_CHANGELOG,
  docsPin: '^0.34.1',
  templatePin: '^0.34.1',
};

const DRIFTED_REPO = {
  version: '0.34.1',
  changelog: UNRELEASED_FULL_CHANGELOG,
  docsPin: '^0.33.0',
  templatePin: '^0.31.1',
};

// ── check-changelog: parsing ─────────────────────────────────
describe('parseChangelog', () => {
  it('extracts Unreleased and version sections in order', () => {
    const sections = parseChangelog(RELEASED_CHANGELOG);
    expect(sections.map((s) => s.version)).toEqual([null, '0.34.1', '0.32.0']);
    expect(sections[0].unreleased).toBe(true);
    expect(sections[1].body.join('\n')).toContain('A fix that shipped.');
  });

  it('handles bracketed-with-date, bare, and [Unreleased] heading variants', () => {
    const sections = parseChangelog('## [Unreleased]\n\n## 0.31.0 - 2025-01-01\n- x\n');
    expect(sections[0].unreleased).toBe(true);
    expect(sections[1].version).toBe('0.31.0');
  });

  it('does not treat ### subheadings as sections', () => {
    const sections = parseChangelog('## [1.0.0]\n### Added\n- x\n');
    expect(sections).toHaveLength(1);
  });
});

describe('sectionBodyIsEmpty', () => {
  it('treats blank lines and ### stubs as empty', () => {
    expect(sectionBodyIsEmpty(['', '### Added', '  '])).toBe(true);
  });

  it('counts bullets and prose as content', () => {
    expect(sectionBodyIsEmpty(['', '- pending change'])).toBe(false);
  });
});

// ── check-changelog: gate ────────────────────────────────────
describe('checkChangelog', () => {
  it('passes when the version has a section and Unreleased is empty', () => {
    expect(checkChangelog({ version: '0.34.1', changelog: RELEASED_CHANGELOG })).toEqual([]);
  });

  it('fails when the version has no section', () => {
    const problems = checkChangelog({ version: '0.35.0', changelog: RELEASED_CHANGELOG });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('no "## [0.35.0]" section');
  });

  it('fails when Unreleased still has content', () => {
    const problems = checkChangelog({ version: '0.34.1', changelog: UNRELEASED_FULL_CHANGELOG });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('Unreleased');
  });

  it('matches versions exactly (0.34.1 is not satisfied by 0.34.10)', () => {
    const problems = checkChangelog({ version: '0.34.1', changelog: '## [0.34.10]\n- x\n' });
    expect(problems.some((p) => p.includes('no "## [0.34.1]" section'))).toBe(true);
  });

  it('passes when no Unreleased section exists at all', () => {
    expect(checkChangelog({ version: '1.0.0', changelog: '## [1.0.0]\n- x\n' })).toEqual([]);
  });
});

// ── check-pins: spec parsing ─────────────────────────────────
describe('pinTargetVersion', () => {
  it('extracts the base version from common pin shapes', () => {
    expect(pinTargetVersion('^0.34.1')).toBe('0.34.1');
    expect(pinTargetVersion('~1.2.3')).toBe('1.2.3');
    expect(pinTargetVersion('>=0.1.0')).toBe('0.1.0');
    expect(pinTargetVersion('0.34.1')).toBe('0.34.1');
    expect(pinTargetVersion('1.0.0-rc.1')).toBe('1.0.0-rc.1');
  });

  it('rejects wildcards, compound ranges, tags, and non-strings', () => {
    expect(pinTargetVersion('*')).toBeNull();
    expect(pinTargetVersion('^1.0.0 || ^2.0.0')).toBeNull();
    expect(pinTargetVersion('latest')).toBeNull();
    expect(pinTargetVersion(undefined)).toBeNull();
  });
});

// ── check-pins: gate ─────────────────────────────────────────
describe('checkPins', () => {
  it('passes when every pin targets the root version', () => {
    const pins = [
      { label: 'docs', file: 'docs/package.json', spec: '^0.34.1' },
      { label: 'template:ts', file: 't/ts/package.json', spec: '0.34.1' },
    ];
    expect(checkPins({ rootVersion: '0.34.1', pins })).toEqual([]);
  });

  it('reports each drifted pin (audit skew: docs ^0.33.0, templates ^0.31.1)', () => {
    const pins = [
      { label: 'docs', file: 'docs/package.json', spec: '^0.33.0' },
      { label: 'template:ts', file: 't/ts/package.json', spec: '^0.31.1' },
    ];
    const problems = checkPins({ rootVersion: '0.34.1', pins });
    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain('^0.33.0');
    expect(problems[1]).toContain('^0.31.1');
  });

  it('reports missing files, missing deps, and unparsable specs', () => {
    const pins = [
      { label: 'docs', file: 'docs/package.json', spec: undefined, missingFile: true },
      { label: 'template:js', file: 't/js/package.json', spec: undefined },
      { label: 'template:ts', file: 't/ts/package.json', spec: 'latest' },
    ];
    const problems = checkPins({ rootVersion: '0.34.1', pins });
    expect(problems).toHaveLength(3);
    expect(problems[0]).toContain('not found');
    expect(problems[1]).toContain('no "@archway/valet" dependency');
    expect(problems[2]).toContain('unparsable');
  });

  it('skips intentional in-repo specs (file:/link:/workspace:) — docs consume the local build', () => {
    const pins = [
      { label: 'docs', file: 'docs/package.json', spec: 'file:..' },
      { label: 'docs2', file: 'd2/package.json', spec: 'link:../..' },
      { label: 'pkg', file: 'p/package.json', spec: 'workspace:*' },
    ];
    expect(checkPins({ rootVersion: '0.37.0', pins })).toEqual([]);
  });
});

// ── check-pins: lockfile-sync gate (the Amplify npm-ci failure) ──
describe('lockedValetVersion', () => {
  it('reads the resolved version from lockfileVersion 2/3 `packages`', () => {
    const lock = { packages: { 'node_modules/@archway/valet': { version: '0.35.1' } } };
    expect(lockedValetVersion(lock)).toBe('0.35.1');
  });
  it('falls back to lockfileVersion 1 `dependencies`', () => {
    expect(lockedValetVersion({ dependencies: { '@archway/valet': { version: '0.35.1' } } })).toBe(
      '0.35.1',
    );
  });
  it('returns null when the lock lacks the package', () => {
    expect(lockedValetVersion({ packages: {} })).toBeNull();
    expect(lockedValetVersion(null)).toBeNull();
  });
});

describe('checkLockfiles', () => {
  it('passes when the lockfile resolves the root version', () => {
    const lockfiles = [{ label: 'docs', file: 'docs/package-lock.json', locked: '0.35.1' }];
    expect(checkLockfiles({ rootVersion: '0.35.1', lockfiles })).toEqual([]);
  });
  it('catches a stale lockfile (the 0.33.0-vs-0.35.1 Amplify break)', () => {
    const lockfiles = [{ label: 'docs', file: 'docs/package-lock.json', locked: '0.33.0' }];
    const problems = checkLockfiles({ rootVersion: '0.35.1', lockfiles });
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain('0.33.0');
    expect(problems[0]).toContain('npm install');
  });
  it('flags a lockfile with no resolved valet entry', () => {
    const lockfiles = [{ label: 'docs', file: 'docs/package-lock.json', locked: null }];
    expect(checkLockfiles({ rootVersion: '0.35.1', lockfiles })[0]).toContain('no resolved');
  });
});

describe('collectPins (live repo, structural assertions only)', () => {
  it('finds the docs pin and one pin per template', () => {
    const pins = collectPins(REPO_ROOT);
    const labels = pins.map((p) => p.label);
    expect(labels).toContain('docs');
    expect(labels).toContain('template:js');
    expect(labels).toContain('template:ts');
    expect(labels).toContain('template:hybrid');
    for (const pin of pins) expect(typeof pin.spec).toBe('string');
  });
});

// ── CLI wiring (in-process main + subprocess exit codes) ─────
describe('CLI', () => {
  let logSpy;
  let errorSpy;
  let fixtureRoots;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    fixtureRoots = [];
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    for (const root of fixtureRoots) fs.rmSync(root, { recursive: true, force: true });
  });

  const fixture = (spec) => {
    const root = makeFixtureRepo(spec);
    fixtureRoots.push(root);
    return root;
  };

  it('both mains return 0 on a clean fixture repo', () => {
    const root = fixture(GOOD_REPO);
    expect(changelogMain(['--root', root])).toBe(0);
    expect(pinsMain(['--root', root])).toBe(0);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('both mains return 1 on a drifted fixture repo and print ERROR lines', () => {
    const root = fixture(DRIFTED_REPO);
    expect(changelogMain(['--root', root])).toBe(1);
    expect(pinsMain(['--root', root])).toBe(1);
    const lines = errorSpy.mock.calls.map((c) => c[0]);
    expect(lines.some((l) => l.startsWith('check-changelog: ERROR'))).toBe(true);
    expect(lines.some((l) => l.startsWith('check-pins: ERROR'))).toBe(true);
  });

  it('--warn downgrades both gates to exit 0 with WARN lines', () => {
    const root = fixture(DRIFTED_REPO);
    expect(changelogMain(['--root', root, '--warn'])).toBe(0);
    expect(pinsMain(['--root', root, '--warn'])).toBe(0);
    const lines = errorSpy.mock.calls.map((c) => c[0]);
    expect(lines.some((l) => l.startsWith('check-changelog: WARN'))).toBe(true);
    expect(lines.some((l) => l.startsWith('check-pins: WARN'))).toBe(true);
  });

  it('subprocess entry exits 1 without --warn and 0 with --warn (drifted fixture)', () => {
    const root = fixture(DRIFTED_REPO);
    for (const script of ['check-changelog.mjs', 'check-pins.mjs']) {
      const file = path.resolve(fileURLToPath(import.meta.url), '..', script);
      expect(() => execFileSync(process.execPath, [file, '--root', root])).toThrowError(
        expect.objectContaining({ status: 1 }),
      );
      expect(() => execFileSync(process.execPath, [file, '--root', root, '--warn'])).not.toThrow();
    }
  });
});
