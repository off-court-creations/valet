# valet-mcp Upgrade — Execution Log

> Executing [`plan.md`](./plan.md) on `feat/valet-mcp-upgrade` (off
> `feat/valet-overhaul` @ `0f5ebce`). Driven by Claude (ultracode, Opus
> subagents). Status legend: ⬜ not started · 🛠️ in progress · ✅ done+verified
> · ⚠️ caveats · ⏸️ blocked.

## Master checklist

| Wave | Contents | Status |
| --- | --- | --- |
| 1 | Lane A extractor correctness (A1 getComment normalizer · A2 phantom filter · A3 call-site deprecation) ‖ Lane C zod→SDK bump · then B gate hardening + corpus regen | ✅ |
| 2 | D1 validate_jsx (headline) · D2 structuredContent/outputSchema · D3 isError · D4 deprecation-aware output · D5 cwd parity fix | ✅ |
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

### Wave 2 — server DX — ✅

**Lane 1 (output contract):** D5 cwd-parity fix (version resolved from
bundled `_meta.json` / module graph, never `process.cwd()` — parity now
correct under any host cwd, proven from `/tmp`); D3 `isError:true` on genuine
lookup misses (get_component/get_examples/define_term) while empty SEARCH
stays a non-error empty list (14-tool audit); D2 `outputSchema` +
`structuredContent` on get_component/search_props/list_components (Zod shapes
from ValetComponentDoc); D4 deprecation surfaced in both text and structured
output (consumes Wave-1 flags) — search_props no longer presents an alias as
canonical. 13-test in-memory Client↔server round-trip.

**Lane 2 (validate_jsx — the headline, NO escalation):** new
`src/validate/typecheck.ts` (ports example-types machinery, parameterized for
the valet module specifier; layered resolver: package-exports →
package-entry → repo-dist → repo-src) + `src/tools/validateJsx.ts`. Warm
~51ms/call (cold 1.24s), well under budget. Catches invented props, wrong
literal unions, AND deprecated aliases against the **shipped** types —
14-test suite + the four plan cases. typescript moved devDep→dep;
`@archway/valet` added as an **optionalDependency `^0.35.0`** (degrades to
`isError` when valet absent, works in-repo via the workspace, self-contained
once 0.35.0 publishes — does NOT poison the tarball).

**Integrator + reviews:** integrator caught a real D2 bug — passing
`outputSchema: Schema.shape` dropped `.passthrough()`, so the SDK rejected the
corpus's extra fields at every get_component call; fixed by passing the schema
instance. Review 1 caught a **ship-blocker** (the original `file:../..` valet
dep poisoned the published tarball → broke install) → fixer switched to the
optionalDependency. Orchestrator then fixed two `checkJs` gaps the scoped runs
missed (the new `.mjs` test needed JSDoc types) + the prettier auto-fixes.
**Full gate:** lint ✅ tsc ✅ **1268/1268** ✅ build ✅ check:engine ✅
check:examples ✅ mcp:check ✅ valet-mcp build+selfcheck (versionParity true,
15 tools) ✅. **Acceptance test COMPLETE:** get_component flags
selectable/rowKey deprecated→replacement AND validate_jsx rejects them.

**Note for Ben (informational):** validate_jsx's optionalDependency resolves a
real valet only once `@archway/valet@0.35.0` is published (latest is 0.34.1).
Until then it works in-repo (workspace) and degrades to a clean `isError` in a
published install; the other 14 tools are fully functional regardless.

## Flags & issues
1. Branch bases on `feat/valet-overhaul` (NOT development) — all referenced
   assets (deprecate.ts, example-types.mjs, schema 1.7, 0.35.0 renames) exist
   only there. The overhaul itself is still unpublished/unmerged (Ben's
   hand-off list); this MCP work stacks on it.
