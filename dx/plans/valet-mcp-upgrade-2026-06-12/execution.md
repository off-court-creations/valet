# valet-mcp Upgrade — Execution Log

> Executing [`plan.md`](./plan.md) on `feat/valet-mcp-upgrade` (off
> `feat/valet-overhaul` @ `0f5ebce`). Driven by Claude (ultracode, Opus
> subagents). Status legend: ⬜ not started · 🛠️ in progress · ✅ done+verified
> · ⚠️ caveats · ⏸️ blocked.

## Master checklist

| Wave | Contents | Status |
| --- | --- | --- |
| 1 | Lane A extractor correctness (A1 getComment normalizer · A2 phantom filter · A3 call-site deprecation) ‖ Lane C zod→SDK bump · then B gate hardening + corpus regen | ✅ |
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

### Wave 1 — foundations — ✅

**Lane A (extractor):** `commentText()` normalizer flattens ts-morph's
`string|(string|JSDocNode)[]` via `compilerNode.text` + `{@link}` target
reconstruction (the slice's prescribed `getText()` accessor was wrong — agent
corrected it and documented why), applied at all FOUR JSDoc sites (the two
named + a third alias-path description map + the inherited-symbol path); bare
`catch{}` swallows narrowed so errors surface. **Result: 0 `[object Object]`
in the corpus; 11 deprecated props now flagged with replacements** (4 more than
the assessment's 7 — Switch.onChange, RadioGroup.spacing, Panel.normalizeRowHeight,
Pagination.onChange were also silently losing their flag). A2 phantom filter
(`unquoteName` dedupes the Drawer aria-label double-count; destructured-default
props only emit when public-type members → Drawer.anchorProp / Avatar.loading
gone). A3 call-site deprecation: parses `resolveDeprecatedProp`/`deprecateProp`
call sites into an authoritative `{component→{alias→{replacement}}}` map merged
into props (robust source that can't array-coerce). Regression fixtures fail on
pre-fix code.

**Lane C (currency):** zod → single deduped `3.25.76` (closes the zod/v4 hazard
— `npm ls zod` shows one version); SDK `^1.3.0`→tilde `~1.29.0`, **mechanical
bump, no escalation** (registerTool/registerResource style already modern);
build + selfcheck green, versionParity true. (`@cfworker/json-schema` is an
optional 1.29 peer only needed for JSON-schema input — we use zod raw shapes,
so intentionally absent, warning-clean.)

**Lane B (gate):** validate.mjs now FAILS on `[object Object]` descriptions,
on unexpected `type:'unknown'` public props (allow-list documented), and on a
known deprecated alias missing its flag — closing the "freshness ≠ correctness"
gap. Each gate bite-tested.

**Verification:** both reviewers **pass**. Gate: lint ✅ tsc ✅ **1241/1241**
✅ mcp:schema:check ✅ mcp:check ✅ check:examples ✅ valet-mcp build+selfcheck
✅. Acceptance-test half (a) achieved: get_component now marks selectable/rowKey
deprecated with replacement.

## Flags & issues
1. Branch bases on `feat/valet-overhaul` (NOT development) — all referenced
   assets (deprecate.ts, example-types.mjs, schema 1.7, 0.35.0 renames) exist
   only there. The overhaul itself is still unpublished/unmerged (Ben's
   hand-off list); this MCP work stacks on it.
