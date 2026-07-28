// ─────────────────────────────────────────────────────────────
// scripts/release/cva-local-package.mjs  | valet
// Pure helpers for validating CVA against a local release tarball.
// ─────────────────────────────────────────────────────────────
import fs from 'node:fs';
import path from 'node:path';

import { pinTargetVersion } from './check-pins.mjs';

const VALET_PACKAGE = '@archway/valet';

export function prepareValetDependency({ packageJsonPath, localPackagePath = null }) {
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const declaredSpec = pkg.dependencies?.[VALET_PACKAGE];
  const expectedVersion = pinTargetVersion(declaredSpec);
  if (!expectedVersion) {
    throw new Error(
      `${packageJsonPath} must declare a parseable ${VALET_PACKAGE} release range; received ${JSON.stringify(declaredSpec)}`,
    );
  }

  if (!localPackagePath) {
    return { declaredSpec, expectedVersion, localSpec: null };
  }
  if (!path.isAbsolute(localPackagePath)) {
    throw new Error('CVA_VALIDATE_VALET_PACKAGE must be an absolute tarball path');
  }
  if (
    path.extname(localPackagePath) !== '.tgz' ||
    !fs.existsSync(localPackagePath) ||
    !fs.statSync(localPackagePath).isFile()
  ) {
    throw new Error('CVA_VALIDATE_VALET_PACKAGE must name an existing .tgz file');
  }

  const localSpec = `file:${localPackagePath}`;
  pkg.dependencies[VALET_PACKAGE] = localSpec;
  fs.writeFileSync(packageJsonPath, `${JSON.stringify(pkg, null, 2)}\n`);
  return { declaredSpec, expectedVersion, localSpec };
}

export function assertInstalledValetPackage({ appDir, expectedVersion }) {
  const installedPath = path.join(appDir, 'node_modules', '@archway', 'valet', 'package.json');
  let installed;
  try {
    installed = JSON.parse(fs.readFileSync(installedPath, 'utf8'));
  } catch {
    throw new Error(`generated app did not install ${VALET_PACKAGE}`);
  }
  if (installed.name !== VALET_PACKAGE) {
    throw new Error(
      `local tarball installed ${JSON.stringify(installed.name)}, expected ${VALET_PACKAGE}`,
    );
  }
  if (installed.version !== expectedVersion) {
    throw new Error(
      `local tarball installed ${VALET_PACKAGE}@${installed.version}, expected ${expectedVersion}`,
    );
  }
  return installed;
}
