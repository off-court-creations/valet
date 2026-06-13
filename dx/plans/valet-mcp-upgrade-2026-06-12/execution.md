# valet-mcp Upgrade — Execution Log

> Executing [`plan.md`](./plan.md) on `feat/valet-mcp-upgrade` (off
> `feat/valet-overhaul` @ `0f5ebce`). Driven by Claude (ultracode, Opus
> subagents). Status legend: ⬜ not started · 🛠️ in progress · ✅ done+verified
> · ⚠️ caveats · ⏸️ blocked.

## Master checklist

| Wave | Contents | Status |
| --- | --- | --- |
| 1 | Lane A extractor correctness (A1 getComment normalizer · A2 phantom filter · A3 call-site deprecation) ‖ Lane C zod→SDK bump · then B gate hardening + corpus regen | ⬜ |
| 2 | D1 validate_jsx (headline) · D2 structuredContent/outputSchema · D3 isError · D4 deprecation-aware output · D5 cwd parity fix | ⬜ |
| 3 | E1 Select examples · E2 wording fixes · E3 docs/AGENTS/README/CHANGELOG + final regen | ⬜ |

## Provisional rulings (assessment §Decisions, reversible)
SDK minor tilde-bump (no major exists) · validate_jsx is the headline ·
tools-only (no resources/prompts churn) · relationship graph SKIPPED this
effort. Escalate only on: SDK bump forcing a breaking rewrite, or validate_jsx
against shipped types needing a heavy new dep.

## Acceptance test (whole effort)
Feed `<Table selectable='multi' rowKey='id'>`: (a) get_component marks
selectable/rowKey deprecated + replacement; (b) validate_jsx flags them.

## Wave log
(appended as waves execute)

## Flags & issues
1. Branch bases on `feat/valet-overhaul` (NOT development) — all referenced
   assets (deprecate.ts, example-types.mjs, schema 1.7, 0.35.0 renames) exist
   only there. The overhaul itself is still unpublished/unmerged (Ben's
   hand-off list); this MCP work stacks on it.
