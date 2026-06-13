# valet-mcp — State & Direction (assessment, 2026-06-12)

## TL;DR
(1) **The "lies about args" problem is ~95% fixed but not closed**: the gross omission/required-prop bugs are gone, yet a JSDoc `{@link}` array-coercion bug still serves 7 deprecated props as canonical (no flag, no description) and corrupts 5 prop descriptions to `[object Object]`, plus 2 phantom props. (2) **The corpus IS up to date with 0.35.0** — the freshness guard rebuilds in-memory and matches the commit byte-for-byte, and this session's renames (selectionMode, onPageChange, expanded, gap) are all present and correct. (3) **The core is stale but not broken** — modern `registerTool`/`registerResource` API, but the SDK is pinned `^1.3.0`/installed 1.17.4 vs latest 1.29.0 (~12 minors, same major), and the protocol negotiates 2025-06-18 vs stable 2025-11-25. (4) **Yes, worth a conceptual nudge** — the server is a prose-vending machine; the single highest-leverage change is to make it *adversarial to wrong code* by exposing valet's own type-checker as a `validate_jsx` tool.

## 1. Is it still lying?
Verdict: **mostly honest, with a contained class of confidently-wrong residuals.** Surface-area is ~95% accurate. Across the 10 components diffed (Box, Table, Select, Button, TextField, Drawer, Tabs, Avatar, DateSelector, Pagination) plus Accordion/Grid/List spot-checks, all three gates pass: `mcp:check` ✓ (64 files, 58 components, fresh), `mcp:schema:check` ✓, `check:examples` ✓ (83 examples type-check).

**Fixed:** required-prop detection (TextField.name, Table data/columns, Pagination.count all correctly required), polymorphic `as` present (Box/Button/TextField), no empty `actions` field, 56 placeholder summaries replaced, misattached Radio/RadioGroup sidecars corrected.

**Residual lies — all from one root cause** (ts-morph `getComment()` returns an array when a JSDoc comment contains an inline `{@link}`, and `.trim()` throws into a bare `catch{}`, dropping the whole JSDoc):
- **Deprecated served as canonical (HIGH):** 7 of ~10 deprecated props carry **no** `deprecated:true` and **no** description — Table.selectable/rowKey, Accordion.open/defaultOpen/onOpenChange, List.selectable/getKey. Corpus has 3 flagged vs 7+ that should be. An agent will present `selectable='multi'`/`rowKey` as first-class API. **This is the maintainer's exact "lies about args" problem, still live for collection components.**
- **`[object Object]` descriptions (HIGH):** 5 props across Tabs, Table, Icon, LLMChat — including Table.onSelectionChange, the exact contract an agent needs for a selectable table.
- **Phantom props (MEDIUM):** Drawer.anchorProp and Avatar.loading (both `type:'unknown'`) don't exist in the public type; the extractor invents a public prop for any destructured-param-with-default.
- **Drawer aria double-count (LOW):** `'aria-label'` (quoted) and `aria-label` (unquoted) both listed.

Why the gates missed it: **freshness proves consistency, not correctness** — the extractor deterministically reproduces the bugs, so a rebuild matches the commit; schema 1.7 permits `type:'unknown'` and `[object Object]` strings.

## 2. Is the corpus up to date with 0.35.0?
**Yes — genuinely fresh, not stale.** `mcp-data/_meta.json`: version 0.35.0, schemaVersion 1.7, versionParity true; root package.json = 0.35.0. `mcp:check` rebuilds in-memory and diffs green; `selfcheck` exits 0 (58 components, 13 glossary, no placeholders). All session renames verified present and correct: selectionMode/getItemKey (Table), onPageChange (Pagination), expanded/onExpandedChange (Accordion), gap + normalizeRowHeights (Grid). The only "currency" issues are the *content* defects in §1, not staleness against the API.

Minor curated-content gaps (not drift): Select serves **zero examples** despite being the trickiest composition; Button best-practice says `variant='contained'` (an MUI term, not a valet `ButtonVariant`); no discoverable theming/`useTheme`/dark-mode path; Option vs Select.Option listed as two near-identical index entries.

## 3. Is the core out of date?
**Stale, not broken.** The API *style* is already modern and correct — `registerTool` with full annotations (readOnlyHint/idempotentHint/openWorldHint, 14/14), `registerResource` + `ResourceTemplate` with working slug completion. The deltas:
- **SDK version:** pinned `^1.3.0`, installed/lockfile **1.17.4** (2025-08-22), npm latest **1.29.0** (2026-03-30). ~12 minors behind, same major; v2 is pre-alpha. The caret means a fresh `npm install` floats the SDK — **not reproducible**.
- **Protocol revision:** installed SDK negotiates up to **2025-06-18**; stable spec is **2025-11-25** (2026-07-28 is an RC). Soft gap — clients negotiate down.
- **Functional features left on the table (the real story):** **zero tools** declare `outputSchema`/`structuredContent` and nothing uses `resource_link` — *even though 1.17.4 already supports all three*. So being behind on the SDK is **not** what's blocking better agent behavior.
- **Other:** errors returned as JSON-text success payloads, never `isError` — clients can't distinguish "tool failed" from "succeeded empty." `check_version_parity` reads `process.cwd()`, which is the host's cwd under Claude Desktop/Codex, silently returning `missing-data`. Prompts capability unused (`prompts/list` → Method not found).

**Upgrade hazard (HIGH):** SDK 1.17.5+ pivoted internals to `zod/v4`; valet pins `zod ^3.23.8`. A bump to 1.29 requires aligning zod to **>=3.25** with a single resolved version in the tree, or the build breaks. Sequence zod first.

## 4. Should it be rethought?
**Yes — one conceptual move dominates.** The server is descriptive: it hands an agent stringified JSON and trusts it to write correct code, with no closed loop. It cannot catch the open-ended failure mode — *invented* props, wrong literal unions, deprecated aliases — because it can only describe what it enumerated, and §1 shows the enumeration itself can be confidently wrong.

**Strongest single idea: expose valet's type-checker as a `validate_jsx` tool.** `scripts/checks/example-types.mjs` already exports `runCheck({entries:[{sidecar,id,code}]})` (designed for exactly this — injecting a block without touching disk), synthesizes a `.tsx`, runs tsc, and returns structured per-block diagnostics. A 15th tool takes a snippet, feeds it through, and returns the diagnostics. The agent writes `<Table selectable='multi' rowKey='id'>`, calls `validate_jsx`, gets back "selectable does not exist / rowKey is deprecated," and self-corrects **before** emitting code. This is the only mechanism that catches inventions the corpus structurally cannot. Open engineering question: it must run against the *shipped* types from the installed package, not assume a repo checkout.

Second-strongest: **derive deprecation truth from `resolveDeprecatedProp(component, canonical, deprecated)` call sites, not JSDoc.** This is a function-argument 3-tuple that cannot array-coerce or throw, and `deprecate.ts` already carries the migration string. `ValetComponentDoc.props[].deprecated` already types as `true | {reason?, replacement?}` (shared.ts:40) — schema is ready. Strictly more robust than just fixing the `getComment()` normalizer (which you should *also* do for descriptions).

## Recommendations

### Tier 1 — correctness & currency hygiene (small, high-confidence, clear wins)
| What | Built from | Effort | Risk |
|---|---|---|---|
| Normalize `getComment()` arrays (map parts to `getText?.()`/`.text`, join) — recovers the 5 corrupted descriptions AND the lost @deprecated flags in one change | extract-ts.mjs:442-446, 521-525, the `.trim()` at 529/451 | **S** | Low — localized, no schema change |
| Filter phantom props: at extract-ts.mjs:723, skip standard DOM attrs / only emit when name is in the resolved interface symbol set | extract-ts.mjs:723 (`type:'unknown'` is a 100% tell) | **S** | Low |
| Add 3 content gates: hard-fail on any `type==='unknown'`, on any description containing `[object Object]`, and a deprecation cross-check (every `resolveDeprecatedProp` old-name appears flagged) | scripts/mcp/validate.mjs + existing CI gates | **S** | Near-zero — converts this bug class into a permanent build failure |
| Dedup quoted/unquoted aria props | propSet logic | **S** | Trivial |
| Bump SDK to ~1.29.0 (tilde, not caret) + align zod >=3.25 to a single resolved version, then re-run selfcheck | package.json pins | **M** | **Medium — zod v4 pivot is the one thing likely to break the build; sequence zod first** |
| Fix `check_version_parity` cwd fragility (accept optional `projectDir` or env root) | src/tools/checkVersionParity.ts | **S** | Low |

### Tier 2 — DX wins (clear wins, higher leverage)
| What | Built from | Effort | Risk |
|---|---|---|---|
| **`validate_jsx` tool (the headline)** — closed-loop self-correction against live 0.35.0 types | `runCheck({entries})` already exported & parameterized; barrelExports resolves live types | **M** | Low-med — tsc latency per call; **must run against shipped types, not a repo checkout** |
| Deprecation-aware responses: derive alias→canonical from `resolveDeprecatedProp` call sites; emit `deprecated:{replacement}` + migration string | deprecate.ts 3-tuple signature; 7 known call sites; schema field already exists | **M** | Low — additive, deterministic |
| Emit `structuredContent` + `outputSchema` (start get_component / search_props / list_components) | SDK 1.17.4 validates it; Zod shapes + ValetComponentDoc already exist | **M** | Low — zero version cost |
| Return `isError:true` on genuine "not found" failures | src/tools/getComponent.ts etc. | **S** | Low |
| Fill curated gaps: Select examples, fix `variant='contained'` wording, surface Button `type='submit'` | sidecar .meta.json files | **S** | Low |

### Tier 3 — conceptual (speculative — adopt only with guardrails)
| What | Built from | Effort | Risk |
|---|---|---|---|
| Code-derived composition graph (Select requires Select.Option; Tabs.Tab/Panel inside Tabs; Table in Panel; Surface at root) | literal displayNames + runtime errors in src | **M** | **Speculative — scope creep: partial coverage reads as authoritative and misleads. Build ONLY as deterministic extraction with per-edge provenance + a coverage gate.** validate_jsx already enforces most nesting at the type level, shrinking marginal value |
| Synthetic Theming doc entry (useTheme/useInitialTheme + runnable dark-mode toggle, example-gated) | glossary 'theme' stub; primer | **S-M** | Speculative — safer than a prompt; must be example-gated or it drifts |
| 2-3 MCP scaffold prompts (themed form, table-with-selection, app shell) | PRIMER_TEXT | **M** | **Speculative — prompts are static templates that go stale exactly like the 56 placeholder summaries did. Do AFTER validate_jsx so a scaffold can tell the agent to validate its output** |

## Decisions for Ben
1. **SDK major upgrade — no major exists; do the minor bump as hygiene, not as the fix.** Decision is really *when*, and whether to accept the zod >=3.25 alignment as a prerequisite chore. Pin tilde for reproducibility.
2. **Is `validate_jsx` the headline? — recommended yes.** It is the only recommendation that catches what the corpus structurally cannot. Everything else makes the static description better; this makes wrong code fail. Fork: accept the "run against shipped types" engineering work, or defer.
3. **Tools-only vs add resources/prompts — stay tools-only for now.** The 14-tool *set* is right; don't reshuffle. Add `validate_jsx` + structuredContent. Treat prompts as a later, post-validate_jsx item, not now.
4. **How far to take the relationship graph — minimal or skip.** If built, demand deterministic extraction + per-edge provenance + a coverage gate, or it becomes the next confidently-wrong artifact. Given validate_jsx enforces nesting at the type level, this is the most deferrable item.

## What NOT to do
- **Don't treat the SDK bump as the answer to any of the 4 questions.** The API style is already modern; 1.17.4 already supports structuredContent/outputSchema/resource_link. Being 12 minors behind is not what's blocking better agent behavior. Bump it as a contained chore.
- **Don't adopt elicitation, sampling, or async Tasks (spec 2025-11-25).** Wrong server shape: stdio, read-only, no-auth, fast-returning. No user to prompt, no model to call back, no long-running ops.
- **Don't rip out the 61 eagerly-registered per-component resources** in favor of the ResourceTemplate alone. Harmless at 58 components; churn for a cosmetic list-length win.
- **Don't re-architect the 14-tool surface.** The problem was never the shape — it was that every tool returns prose and none lets the agent check its work.
- **Don't prioritize `resource_link` payload-slimming yet.** Defensible token-cost idea, but it complicates the consumer contract before the correctness loop exists. Revisit only if payload size is *measured* to be a real problem.
- **Don't add SSE transport** (deprecated, removed in v2). Stdio-only is correct.
