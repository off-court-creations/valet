# CVA Upgrade Strategy and Research Notes

This document captures the current state of create-valet-app (CVA), the upgrade requirements we discussed, and a proposed roadmap for introducing version-aware migrations. It is intended for DX contributors guiding CVA forward.

## 1. Current CVA Capabilities (Research Digest)

- **Scaffolding scope**: CVA (package `@archway/create-valet-app`) generates React 19 + Vite 6 projects with TypeScript, JavaScript, or Hybrid templates. Feature toggles cover React Router, Zustand, minimal mode, path alias swaps, optional React Three Fiber scenes, and valet MCP documentation.
- **Version selection**: Generated apps pin `@archway/valet` to the CLI’s target minor (e.g., `^0.31.0`). Additional dependencies align with that template snapshot; there is no awareness of newer template revisions after generation.
- **Code layout**: Templates live under `packages/create-valet-app/templates/<template>`. Feature toggles mutate files post-copy (router removal, minimal content, alias rewrites, etc.). Zustand store, presets, and pages provide representative usage of valet primitives.
- **Validation harness**: `packages/create-valet-app/scripts/validate.mjs` exercises multiple generation scenarios, verifying lint/typecheck/build/preview success and checking feature-specific outputs.
- **MCP integration**: When scaffolded with MCP enabled, CVA writes AGENTS.md / CLAUDE.md guidance, attempts to install `@archway/valet-mcp` globally, and can append a valet entry to `~/.codex/config.toml`.
- **Documentation hooks**: Docs in `docs/src/pages/getting-started/Quickstart.tsx` reference CVA scaffolds and the structure of generated projects. CHANGELOG references CVA template bumps.
- **Missing piece**: No tooling exists for upgrading an already scaffolded app to a newer template/library minor. Consumers must manually diff templates or follow release notes.

## 2. Upgrade Objectives

1. **Version Awareness**
   - Track the originating CVA version and selected features inside generated apps.
   - Expose a way for projects to detect available upgrades from the CLI.

2. **Deterministic Migrations**
   - Generate plans that reconcile template deltas, dependency bumps, and valet-breaking changes.
   - Preserve local edits or clearly flag conflicts (no silent data loss).

3. **DX Consistency**
   - Keep valet releases, MCP metadata, and CVA upgrade scripts in lockstep.
   - Support interactive and non-interactive flows (CSI/CI usage, dry runs, scripting).

## 3. Proposed Architecture

- **Scaffold Metadata**
  - Embed a `.cva/state.json` (or similar) capturing: `cvaVersion`, template type, feature toggles, applied migrations.
  - Mirror key data in `package.json` (e.g., `cva` field) for quick detection by tooling.

- **Upgrade Manifest**
  - Extend the CLI package with structured manifests describing available target versions, dependency ranges, included migrations, and release notes.
  - Each manifest entry references migration modules living under `packages/create-valet-app/migrations/<from>-to-<to>/`.

- **CLI Enhancements**
  - Add `cva upgrade` command supporting:
    - `--check` (list available upgrades),
    - `--plan` (show upcoming changes),
    - `--apply` (run migrations),
    - `--dry-run` (simulate file edits and dependency changes),
    - `--from` override for manual jumps.
  - Provide `--yes`/`--no-interactive` for CI and agent flows.

- **Migration Execution**
  - Migrations composed of:
    - Dependency plan (bump `@archway/valet`, React, TS, etc.).
    - File transforms (AST-aware codemods keyed to templates, optional toggles).
    - Manual follow-up instructions emitted in an upgrade log.
  - Apply with backups (`.cva/backups/<timestamp>`) and log outcomes (`.cva/upgrade-log.md`).

- **Conflict Handling**
  - Detect modified sections via simple heuristics (hashing) or AST comparisons.
  - On conflict, write `.rej`/`.conflicted` files and summarize required manual work.

- **Post-Upgrade Verification**
  - Encourage or automate lint/typecheck/build runs (e.g., `npm run upgrade:verify` alias).
  - Integrate optional preview check similar to current validation harness.

## 4. Migration Workflow for Generated Apps

- **Dependency Strategy**
  - Default to bumping within the same minor range as the target release.
  - Respect feature toggles: skip router/zustand dependencies when absent; ensure R3F deps remain aligned.

- **Template Diffs**
  - Use codemods rather than blind file replacement so local customizations survive (e.g., AST transforms for imports, route structures, preset definitions).
  - Minimal template migrations should not reintroduce removed pages.
  - Path-alias rewrites must respect custom tokens recorded in metadata.

- **State Synchronization**
  - Migration modules update `.cva/state.json` with new version metadata.
  - Optionally emit hints for future migrations (e.g., when new features become available).

- **Developer Experience**
  - Present human-readable plan summaries (dependency changes, files touched, scripts to run).
  - Provide guidance paragraphs for manual tasks (e.g., adoption of new valet APIs).
  - Offer rollback instructions (reference backups) if the upgrade fails midstream.

## 5. Implementation Roadmap

1. **Phase 1 – Foundations**
   - Define metadata schema and emit it during scaffolding.
   - Introduce upgrade manifest format and CLI plumbing for `upgrade --check`.
   - Update docs/CHANGELOG to announce upcoming upgrade tooling.

2. **Phase 2 – Migration Engine**
   - Build dependency planner abstraction (handles `npm`, `pnpm`, `yarn`, `bun`).
   - Author file transform runner using AST-friendly utilities; integrate conflict reporting.
   - Implement `--plan` and `--dry-run`.

3. **Phase 3 – First Migration (1.0.x → 1.1.x)**
   - Write migration modules for each template variant and major feature combination.
   - Add automated tests to `scripts/validate.mjs` that scaffold older versions, upgrade them, and rerun lint/typecheck/build/preview.

4. **Phase 4 – Documentation + MCP**
   - Document upgrade flows in dx docs, AGENTS/CLAUDE templates, and public Quickstart guides.
   - Expose upgrade availability through MCP metadata (so agents can prompt users about updates).
   - Ship staged release, ensuring valet core, CVA, and docs land together.

## 6. Complexity Assessment

The roadmap is appropriately scoped:

- It is precise enough to start implementation without guesswork (clear phases, metadata design, CLI UX).
- It avoids premature deep dives into codemod minutiae until we prototype the inaugural migration.
- Future refinements will follow real-world edge cases uncovered when authoring 1.0.x → 1.1.x migrations (e.g., handling heavily customized apps).

We should reassess complexity after the first migration is built—particularly around AST tooling robustness and conflict resolution UX—but the current plan balances ambition with actionable steps.
