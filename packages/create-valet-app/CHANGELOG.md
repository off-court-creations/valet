Changelog

All notable changes to this project are documented here.

0.31.0
- Align: Update CVA to target Valet and MCP 0.31.x minor.
- Change: Generated apps now depend on `@archway/valet@^0.31.0`.
- Change: Global MCP install aligns to 0.31.x by default.

0.30.15
- Added: Optional 3D (React Three Fiber) experience via `--three`/`--r3f` flag or interactive prompt. Installs `three`, `@react-three/fiber`, `@react-three/drei` and swaps Quickstart to a fullscreen `<Canvas>` with a spinning cube and Valet HUD overlay.
- Added: When `--three` is enabled on the hybrid template, the 3D Quickstart is generated as `.jsx` per the R3F Pages Policy (keep heavy R3F scenes in JSX; keep UI/logic typed TS).
- Added: Validation scenarios for `--three` (ts/js) and hybrid with MCP to ensure guidance includes the R3F Pages Policy.

0.30.4 — 2025-09-04
- Changed: Git repos initialize on `main` (no more `master` hints); falls back to branch rename when needed.
- Changed: Cleaner output — suppresses git and package manager noise so steps show as concise checklists.
- Changed: Global MCP install runs quietly; keeps scaffold output tidy.
- Changed: Banner renders as three lines with gradient:
 create → valet → app.
- Changed: Global MCP installer upgrades existing `@archway/valet-mcp` to latest patch within the same minor (x.Y.z → latest z).

0.30.3 — 2025-09-04
- Added: Git initialization enabled by default with `--no-git` opt-out.
- Added: Git identity checks; prompts to set local `user.name`/`user.email` when interactive; non-interactive runs skip initial commit with clear follow-ups.
- Added: Robust `.gitignore` for all templates and CLI fallback writer when absent.
- Changed: CLI help and README to document git defaults and behavior.
- Internal: Validation scenarios pass across templates and feature toggles.

0.30.2 — 2025-09-03
- Changed: Improved CLI visuals/banner styling.

0.30.1 — 2025-09-03
- Added: Valet MCP guidance generation (`AGENTS.md`), with interactive config helper.
 - Added: Generate `CLAUDE.md` alongside `AGENTS.md` with identical guidance.
- Changed: Adjusted install process to include optional MCP pieces.
- Internal: Packaging and version bump.

0.30.0 — 2025-09-03
- Initial release: scaffold React + Vite app with TypeScript default, plus JS and Hybrid templates.
- Features: Router/Zustand toggles, minimal mode, path alias, lint/format scripts, split TS configs, validation harness.
