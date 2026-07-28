// ─────────────────────────────────────────────────────────────
// scripts/release/cva-local-package.test.mjs  | valet
// Regression tests for local-tarball CVA release validation.
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { assertInstalledValetPackage, prepareValetDependency } from './cva-local-package.mjs';

const fixtures = [];

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'valet-cva-package-test-'));
  fixtures.push(root);
  const packageJsonPath = path.join(root, 'package.json');
  fs.writeFileSync(
    packageJsonPath,
    `${JSON.stringify({ dependencies: { '@archway/valet': '^0.39.0' } }, null, 2)}\n`,
  );
  return { root, packageJsonPath };
}

afterEach(() => {
  for (const root of fixtures.splice(0)) {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

describe('prepareValetDependency', () => {
  it('preserves the published range when no local tarball is supplied', () => {
    const { packageJsonPath } = fixture();
    const result = prepareValetDependency({ packageJsonPath });
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(result).toEqual({
      declaredSpec: '^0.39.0',
      expectedVersion: '0.39.0',
      localSpec: null,
    });
    expect(pkg.dependencies['@archway/valet']).toBe('^0.39.0');
  });

  it('rewrites only the temporary app dependency to an absolute tarball spec', () => {
    const { root, packageJsonPath } = fixture();
    const tarball = path.join(root, 'archway-valet-0.39.0.tgz');
    fs.writeFileSync(tarball, 'fixture');

    const result = prepareValetDependency({
      packageJsonPath,
      localPackagePath: tarball,
    });
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    expect(result.localSpec).toBe(`file:${tarball}`);
    expect(pkg.dependencies['@archway/valet']).toBe(`file:${tarball}`);
  });

  it('rejects invalid release ranges', () => {
    const { packageJsonPath } = fixture();
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify({ dependencies: { '@archway/valet': 'latest' } }),
    );

    expect(() => prepareValetDependency({ packageJsonPath })).toThrow('parseable');
  });

  it('rejects relative, missing, and non-tarball overrides', () => {
    const { root, packageJsonPath } = fixture();

    expect(() =>
      prepareValetDependency({
        packageJsonPath,
        localPackagePath: path.join(root, 'missing.tgz'),
      }),
    ).toThrow('existing .tgz');
    expect(() =>
      prepareValetDependency({
        packageJsonPath,
        localPackagePath: 'relative.tgz',
      }),
    ).toThrow('absolute');
    const notTarball = path.join(root, 'valet.zip');
    fs.writeFileSync(notTarball, 'fixture');
    expect(() =>
      prepareValetDependency({
        packageJsonPath,
        localPackagePath: notTarball,
      }),
    ).toThrow('existing .tgz');
  });
});

describe('assertInstalledValetPackage', () => {
  it('accepts the expected package name and version', () => {
    const { root } = fixture();
    const installedDir = path.join(root, 'node_modules', '@archway', 'valet');
    fs.mkdirSync(installedDir, { recursive: true });
    fs.writeFileSync(
      path.join(installedDir, 'package.json'),
      JSON.stringify({ name: '@archway/valet', version: '0.39.0' }),
    );

    expect(assertInstalledValetPackage({ appDir: root, expectedVersion: '0.39.0' })).toMatchObject({
      name: '@archway/valet',
      version: '0.39.0',
    });
  });

  it('rejects missing, wrong-name, and version-mismatched installs', () => {
    const { root } = fixture();
    expect(() => assertInstalledValetPackage({ appDir: root, expectedVersion: '0.39.0' })).toThrow(
      'did not install',
    );

    const installedDir = path.join(root, 'node_modules', '@archway', 'valet');
    fs.mkdirSync(installedDir, { recursive: true });
    const installedPath = path.join(installedDir, 'package.json');
    fs.writeFileSync(installedPath, JSON.stringify({ name: 'wrong', version: '0.39.0' }));
    expect(() => assertInstalledValetPackage({ appDir: root, expectedVersion: '0.39.0' })).toThrow(
      'expected @archway/valet',
    );

    fs.writeFileSync(installedPath, JSON.stringify({ name: '@archway/valet', version: '0.38.0' }));
    expect(() => assertInstalledValetPackage({ appDir: root, expectedVersion: '0.39.0' })).toThrow(
      'expected 0.39.0',
    );
  });
});
