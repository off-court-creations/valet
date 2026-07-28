# Releasing valet

The release runbook for the four-package valet distribution: the library
(`@archway/valet`), the MCP server (`@archway/valet-mcp`), the scaffolder
(`@archway/create-valet-app`), and the docs site.

> **Supersedes `dx/PUBLISH_ORDER.md`** (now a tombstone pointing here). Unlike
> the old file, **every gate below is mandatory and uncommented** — nothing is
> "optional" or `# commented out`. Run this top to bottom. Each command is a
> real `package.json` script or a real `scripts/**` entry that exists today.
>
> **Agent boundary.** A coding agent prepares everything up to (and including)
> the version bump and CHANGELOG move on a branch. The acts marked **[Ben]** —
> `npm publish`, pushes/merges to `development`/`main`, and GitHub repo-settings
> changes — are human-only and never executed by an agent.

---

## 0. One-time setup (do these once, then never again)

These are prerequisites for a clean release. Each is idempotent to check.

### 0.1 — Enable Private Vulnerability Reporting **[Ben, one-time]**

`SECURITY.md` routes reports through GitHub Private Vulnerability Reporting
(PVR). The "Report a vulnerability" button does not exist until PVR is on, so
this must happen **before `SECURITY.md` reaches `main`**.

- GitHub → repo **Settings** → **Code security and analysis** →
  **Private vulnerability reporting** → **Enable**.

### 0.2 — Branch protection on `development` and `main` **[Ben, one-time]** (Q17)

Require the CI checks to pass before anything merges. The required check names
are the job names from `.github/workflows/ci.yml`: `core (20.x)`,
`core (22.x)`, and `mcp-server`. Apply the **same** required checks to both
branches (replace `OWNER/REPO`; for this repo `off-court-creations/valet`):

```sh
for BR in development main; do
  gh api -X PUT "repos/OWNER/REPO/branches/$BR/protection" --input - <<'JSON'
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "core (20.x)" },
      { "context": "core (22.x)" },
      { "context": "mcp-server" }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": { "required_approving_review_count": 1 },
  "restrictions": null
}
JSON
done

# Verify both:
for BR in development main; do
  gh api "repos/OWNER/REPO/branches/$BR/protection/required_status_checks" | jq '.checks'
done
```

### 0.3 — Hardening roadmap **[Ben, staged]** (Q19)

The end state for `npm publish` is **not** a single maintainer running it from a
laptop. Stage toward it; each step is independent and additive:

1. **Recruit a named co-maintainer** with npm publish rights on all four
   packages (today bus-factor is 1; a stranded security fix cannot ship). Record
   the name here when done: _Co-maintainer: **\*\*\*\***\_\_\_\_**\*\*\*\*** ._
2. **Enable npm 2FA** (`auth-and-writes`) on every `@archway/*` package so a
   leaked token alone cannot publish.
3. **Move publishing into CI with provenance** — a `release` GitHub Actions
   workflow that runs this whole runbook's gates and publishes with
   `npm publish --provenance` from a trusted-publisher OIDC token. Once this
   lands, the manual `npm publish` steps below become the CI job's body and the
   human role narrows to approving the release PR.

---

## 1. Preflight — the full gate (all mandatory, all uncommented)

Run from the repo root on a clean checkout of the branch you intend to release.
**Every command must exit 0.** Stop on the first failure.

```sh
# 1.1 Clean working tree — a dirty tree means uncommitted release state.
git status --porcelain        # MUST print nothing
git fetch --all --tags

# 1.2 Baseline CI is green on the branch (development for a normal release).
#     The exact prepared release SHA is pushed and watched in §4.0 before any
#     package is published.
gh run list --branch development --limit 1   # latest run conclusion == success

# 1.3 Quality gates (these are exactly what CI runs, plus the release-only ones).
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npm run check:engine          # Node SSR smoke: import-no-throw both formats, deterministic classes
npm run verify:pack           # every exports/main/module/types path exists; no empty tarball
npm run check:package         # publint + are-the-types-wrong (attw, esm-only profile)
npm run check:bundle          # Button fixture ≤ gzip budget; no highlight.js/marked/dropzone leakage

# 1.4 Release-gate scripts (CHANGELOG discipline + dependency-pin sync, HARD).
npm run release:check         # = check-changelog.mjs && check-pins.mjs (no --warn)

# 1.5 MCP corpus: build, schema-validate, and freshness-check.
npm run mcp:build             # regenerate mcp-data from src + sidecars
npm run mcp:schema:check      # schema + orphan-sidecar validation (validate.mjs)
npm run mcp:check             # freshness guard: committed corpus matches a fresh build

# 1.6 MCP server: build its dist and run its own selfcheck.
npm run mcp:server:build
npm run mcp:server:selfcheck  # MCP_SELFCHECK=1 — index ≥ 50, glossary > 0, no placeholder samples

# 1.7 create-valet-app end-to-end validation (NOT commented out anymore).
#     Packs the local library and injects that tarball into generated apps, so
#     a synchronized new minor is testable before it exists on npm.
npm run cva:validate:release
```

Notes on the gates:

- `release:check` runs `scripts/release/check-changelog.mjs` and
  `scripts/release/check-pins.mjs` in **hard** mode (no `--warn`). It fails
  until (a) `CHANGELOG.md` has a `## [<version>]` section for the version in
  `package.json` and the `## Unreleased` section is empty, and (b) `docs/` and
  every `packages/create-valet-app/templates/*/` pin `@archway/valet` at exactly
  the root version. On non-release branches CI runs `check-pins.mjs --warn`
  (informational); **release flips it hard** — that is this step.
- The `mcp-server` CI job and `mcp:server:selfcheck` resolve the committed
  `<pkg>/mcp-data` copy (true package root is the first bundled candidate;
  `shared.ts resolveBundledDir`).
- `cva:validate:release` packs the current local library and runs all 13
  scaffold scenarios against that tarball via the validation-only
  `CVA_VALIDATE_VALET_PACKAGE` override. Plain `cva:validate` still exercises the
  template's registry range and remains the scaffolder's `prepublishOnly`
  check after the library is published.

---

## 2. CHANGELOG discipline

The CHANGELOG is the source of truth for what each version shipped;
`check-changelog.mjs` enforces it at publish time.

1. Everything since the last release accumulates under `## Unreleased`.
2. At release, **rename `## Unreleased` to the version section** and add a fresh
   empty `## Unreleased` above it:

   ```md
   ## Unreleased

   ## [0.35.0] — 2026-06-DD

   ... (the content that was under Unreleased) ...
   ```

3. After the move, `npm run release:check` must pass with no `--warn`
   (`check-changelog` non-warn is mandatory). An empty section counts as only
   blank lines and `###` stubs.

---

## 3. Version bumps + pin updates

> ⚠️ **PRE-SYNC EVERYTHING ONCE, THEN PUBLISH PLAIN.** Bump **all four**
> packages to the same `$NEW` here in §3. At publish time (§4) use the **plain**
> commands — `npm publish` and `npm run mcp:server:publish` (no suffix). Do
> **NOT** run `npm version` / `mcp:server:publish:patch|minor|major` during
> §4: the packages are already at `$NEW`, so a second bump double-counts
> (0.35.0 → 0.36.0). This bit both `valet-mcp` and `create-valet-app` during
> the 0.35.x releases. The `:patch|:minor|:major` variants are only for a
> package versioning **independently** of the synchronized set.

Pin skew is a **hard** failure at release (`check-pins.mjs`): the three CVA
templates (`hybrid`/`js`/`ts`) must pin `@archway/valet` at `$NEW`. The docs
consume the repository root through `file:..`; keep that link and synchronize
its lockfile snapshot before the release gate. A stale docs lockfile breaks
`npm ci` even though no registry lookup is needed.

```sh
# 3.1 Bump ALL FOUR to the same version (no tag yet — we tag once at the end).
npm version <patch|minor|major> --no-git-tag-version
NEW=$(node -p "require('./package.json').version")
( cd packages/valet-mcp        && npm version "$NEW" --no-git-tag-version --allow-same-version )
( cd packages/create-valet-app && npm version "$NEW" --no-git-tag-version --allow-same-version )

# 3.2 Update every CVA template pin to ^$NEW, keep the docs dependency at
#     file:.., and synchronize the docs lockfile's linked-root snapshot.
#       packages/create-valet-app/templates/{hybrid,js,ts}/package.json
npm --prefix docs install

# 3.3 Move the CHANGELOG Unreleased section to [$NEW] (see §2), then:
npm run release:check   # changelog + pins; the docs-lockfile half is checked too
```

CVA templates also carry the `@fontsource` font deps and self-host theme config
(`injectRemote:false`, `mode:'system'`, `persistMode:true`); bumping the valet
pin is the moment to confirm the templates still install and
`cva:validate:release` passes (§1.7). The release variant is heavy (scaffolds +
installs + builds + `vite preview` for 13 scenarios); plain `cva:validate`
also runs inside `create-valet-app`'s `prepublishOnly` after valet is published.
If a `vite preview` step flakes, clear any stragglers with
`pkill -f "cva-validate.*vite preview"` and retry.

---

## 4. Publish order

Publish strictly in this order. The library is the source of truth that the MCP
data and the templates bake in, so it goes first; docs deploy last.

**All `npm publish` steps are [Ben] (or the CI release job once §0.3.3 lands).**

### 4.0 — Push the prepared release candidate and wait for its CI **[Ben]**

The version bumps, CHANGELOG move, regenerated corpus, and synchronized pins
must already be committed on `development`. Push that exact commit and require
its own CI run to pass before publishing anything:

```sh
git status --porcelain        # MUST print nothing
RELEASE_SHA=$(git rev-parse HEAD)
git push origin development

RUN_ID=
until [ -n "$RUN_ID" ]; do
  RUN_ID=$(gh run list --workflow CI --commit "$RELEASE_SHA" --limit 1 \
    --json databaseId --jq '.[0].databaseId // empty')
  [ -n "$RUN_ID" ] || sleep 5
done
gh run watch "$RUN_ID" --exit-status
```

Do not continue if the watched run is not successful.

### 4.1–4.4 — Publish and build

```sh
# 4.1 valet (library). prepack runs `npm run build`; prepublishOnly (when set
#     by the release integrator) re-runs the §1 gate. Publish from the root.
npm publish --access public

# 4.2 valet-mcp — PLAIN (already at $NEW per §3.1). The wrapper rebuilds
#     mcp-data (capturing the just-published valet version), schema-checks, and
#     freshness-checks via mcp:server:preflight before publishing. NOT :minor.
npm run mcp:server:publish

# 4.3 create-valet-app — PLAIN (already at $NEW). prepublishOnly runs
#     pack.test + cva:validate. Do NOT `npm version` here.
( cd packages/create-valet-app && npm publish --access public )

# 4.4 docs. Local pin + lockfile snapshot were committed in §3.2. Production
#     deploy runs on merge to `main` (Amplify), which runs `npm ci` in docs/.
npm --prefix docs run build
```

`mcp:server:publish` intentionally rebuilds the corpus and therefore refreshes
four volatile `builtAt` fields. After the MCP publish succeeds, inspect those
exact files:

```sh
git diff -- \
  mcp-data/_meta.json \
  mcp-data/glossary.json \
  packages/valet-mcp/mcp-data/_meta.json \
  packages/valet-mcp/mcp-data/glossary.json
```

If and only if the diff contains `builtAt` changes, restore those generated
timestamps to the already-tested release commit, then require a clean tree.
Do not restore or tag if any substantive corpus content changed:

```sh
git restore -- \
  mcp-data/_meta.json \
  mcp-data/glossary.json \
  packages/valet-mcp/mcp-data/_meta.json \
  packages/valet-mcp/mcp-data/glossary.json
git status --porcelain        # MUST print nothing
```

---

## 5. Tag and deploy **[Ben]**

```sh
# 5.1 Tag the exact CI-green release commit only after every package publish and
#     registry verification succeeds. Use an annotated release tag.
git status --porcelain        # MUST print nothing
git tag -a "v$NEW" -m "release: v$NEW"
git push origin "v$NEW"

# 5.2 Open a PR development → main; merging triggers the production docs build
#     (Amplify). main is branch-protected (§0.2) so CI must be green to merge.
gh pr create --base main --head development --title "release: v$NEW" --fill
```

---

## 6. Post-publish verification

```sh
# 6.1 The published library tarball is the per-module ESM build, not an empty 4-file pack.
npm view @archway/valet@$NEW version dist.tarball
npm pack @archway/valet@$NEW --dry-run     # lists dist/**.mjs, index.d.mts, styles.css

# 6.2 The MCP server installs and selfchecks from the registry.
npx -y @archway/valet-mcp@latest --help 2>/dev/null || true
MCP_SELFCHECK=1 npx -y @archway/valet-mcp@latest   # index ≥ 50, glossary > 0, versionParity true

# 6.3 The scaffolder produces a buildable app pinned at the new version.
npx -y @archway/create-valet-app@latest /tmp/valet-smoke --template ts --no-global-mcp

# 6.4 Docs site serves the new version (after the Amplify build from the main merge).
```

---

## 7. SECURITY.md supported row

After publishing a new **minor**, update the supported-versions table in
`SECURITY.md` so it tracks the latest published 0.x minor. The table is
maintained by hand (one row marked supported, the previous minor moved to
`:x:`). This step lives here, not in a `RELEASE_CHECKLIST` — it is part of every
minor release.

```md
| 0.35.x (latest published 0.x minor) | :white_check_mark: |
| < 0.35 | :x: |
```

Confirm PVR (§0.1) is enabled before this lands on `main`.

---

## 8. The 0.34.2 hotfix path (Q4(a))

Before the `0.35.0` overhaul minor, a small **`0.34.2`** hotfix resets the
publish baseline. It carries the six `development` commits stranded since
`0.34.1` plus two cherry-picks from the overhaul branch. The
`## 0.34.2 (planned hotfix — unpublished)` section of `CHANGELOG.md` is the
authoritative payload list — keep this runbook and that section in sync.

**Stranded `development` commits** (`v0.34.1..0a31fee`, already on
`development`): the AppBar buttons/icon-button work (`31ee72c`, `d5fb059`,
`f48172b`, merged via PR #479), docs prop-pattern audit + lava-lamp shader
(`3f350f1`, `0a31fee`), and the MCP data regen (`fb07a02`).

**Cherry-pick candidates** from `feat/valet-overhaul` (also under `Unreleased`;
land them here if the hotfix ships first):

- **OVERLAY S1** — overlay focus trap: Tab no longer swallowed mid-dialog.
- **OVERLAY S2** — Select portal wrapper no longer blocks pointer events beneath
  the dropdown.

Procedure:

```sh
# 8.1 Branch off the current development tip (which already has the 6 commits).
git checkout development
git checkout -b fix/0.34.2-hotfix

# 8.2 Cherry-pick the two overlay fixes from the overhaul branch.
#     Identify the commits, then:
git cherry-pick <OVERLAY-S1-commit> <OVERLAY-S2-commit>

# 8.3 Move the CHANGELOG "0.34.2 (planned hotfix)" content into a real
#     "## [0.34.2] — <date>" section; bump and run the full §1 gate.
npm version patch --no-git-tag-version   # 0.34.1 -> 0.34.2
npm run release:check                    # changelog + pins green for 0.34.2
# ... run the rest of §1 ...

# 8.4 Publish (§4) and tag (§5). [Ben]
```

The overhaul then ships as `0.35.0` off `feat/valet-overhaul`, rebased on the
`0.34.2` baseline.
