# valet-mcp Upgrade — Tier 1 + Tier 2 Plan

> **Status:** approved by Ben (goal: "execute tier 1 and 2 exhaustively and
> excellently"). Branch: `feat/valet-mcp-upgrade` (off `feat/valet-overhaul`
> @ `0f5ebce` — needs the overhaul's deprecate.ts, example-types.mjs, schema
> 1.7, and the 0.35.0 renames). Grounded in
> [`assessment.md`](./assessment.md). Companion: [`execution.md`](./execution.md).

## North Star

The MCP stops lying (the residual deprecated-served-as-canonical +
`[object Object]` class is dead and **gated** so it can't return), and gains
a closed correctness loop: an agent can `validate_jsx` its generated valet
code against the real 0.35.0 types and self-correct before emitting. Tool
output becomes structured + deprecation-aware; the SDK/zod are current and
reproducibly pinned.

## Core insights

1. **One root-cause bug produces all the residual lies.** `getComment()` /
   `tag.getComment()` return `(string|JSDocLink)[]` when a prop's JSDoc has an
   inline `{@link}`; the code calls `.trim()`/`.join()` on that → descriptions
   become `[object Object]` and a throw in the tag loop (bare `catch {}`)
   abandons `@deprecated` detection. One normalizer helper fixes descriptions
   AND the 7 lost deprecation flags at both sites (extract-ts.mjs:442–446 /
   518–532).
2. **Freshness ≠ correctness.** The extractor reproduces its own bugs
   deterministically, so `mcp:check` (rebuild-and-diff) stays green over wrong
   data, and schema 1.7 permits `[object Object]` strings and `type:'unknown'`.
   The gate must assert content correctness, not just consistency.
3. **Deprecation truth is safer from call sites than JSDoc.**
   `resolveDeprecatedProp(component, canonicalName, canonical, deprecatedName,
   deprecated)` (deprecate.ts) is a function-argument tuple that cannot
   array-coerce; deriving alias→canonical from those call sites is strictly
   more robust than (and complements) the JSDoc `@deprecated` fix.
4. **The server already supports what it doesn't use.** SDK 1.17.4 has
   `structuredContent`/`outputSchema`/`resource_link`; the bottleneck is not
   the version. `validate_jsx` is the one capability the corpus structurally
   cannot replace.
5. **`validate_jsx` must check against SHIPPED types, not a repo checkout.**
   `example-types.mjs`'s `runCheck({entries})` resolves valet from
   `../../../src`; the tool must instead resolve `@archway/valet`'s published
   `.d.mts` so it works for a consumer who only has the installed package.

## Workstreams & slices

### A. Extractor correctness (scripts/mcp — sole-writer lane, serial)
- **A1 — getComment normalizer.** New `commentText(c)` helper flattening
  `string | (string|JSDocLink)[]` via `getText?.()`/`.text` on link parts;
  apply at both description maps and both tag-comment reads
  (extract-ts.mjs:442–446, 449–451, 518–525, 528–532). Recovers 5 corrupted
  descriptions + the 7 lost `@deprecated` flags. Remove the bare-`catch{}`
  swallow or narrow it.
- **A2 — phantom-prop filter.** At the destructured-param-with-default path
  (~:723), only emit a prop when it is a member of the public props type (or a
  known DOM passthrough); drop `Drawer.anchorProp`, `Avatar.loading`. Also
  de-dupe the quoted/unquoted `aria-label` double-count.
- **A3 — call-site deprecation derivation.** Parse `resolveDeprecatedProp(...)`
  + `deprecateProp(...)` call sites (deprecate.ts consumers) to build an
  authoritative `{component, prop} -> {deprecated:true, replacement, reason}`
  map; merge into props so `deprecated` is set from code, not just JSDoc.
  Emit the schema's `deprecated: true | {reason?, replacement?}` shape
  (shared.ts:40 already types it).

### B. Gate hardening (scripts/mcp/validate.mjs — after A, written to pass on fixed data)
- **B1 — content-correctness gates.** Reject any prop `description` equal to
  or containing `[object Object]`; reject `type:'unknown'` for a public prop
  unless allow-listed; assert every prop whose name matches a known
  deprecated alias (from the A3 map) carries `deprecated`. Clear messages.
  Wire into `mcp:schema:check`. Bite-test each.

### C. Server: SDK + zod currency (packages/valet-mcp — parallel to A/B, disjoint)
- **C1 — zod alignment first.** Move zod to a single resolved `>=3.25.x`
  (the version SDK 1.29 expects via zod/v4 export path); verify the tree has
  one zod.
- **C2 — SDK bump** to a tilde-pinned `~1.29.x` (reproducible, no caret
  float); adapt any changed `registerTool`/server API; `build` + `selfcheck`
  green; protocol negotiation unchanged-or-better.

### D. Server: DX (packages/valet-mcp — after C, on the bumped SDK)
- **D1 — `validate_jsx` tool (headline).** New tool: input `{ code, deps? }`;
  resolves valet types from the **installed `@archway/valet`** (`.d.mts`),
  synthesizes a TSX module (reuse `example-types.mjs` machinery, parameterized
  for an external valet root), runs tsc, returns structured diagnostics
  (line/col/message/code) + `isError` semantics on real failure. Annotated
  `readOnlyHint:true, openWorldHint:false`. Document the shipped-types
  resolution + the latency characteristic.
- **D2 — structuredContent + outputSchema** for `get_component`,
  `search_props`, `list_components` (start set); Zod output shapes from the
  existing `ValetComponentDoc`.
- **D3 — isError on genuine failures** across the tools (not-found returns
  `isError:true`, not a success-empty payload).
- **D4 — deprecation-aware tool output:** surface `deprecated`/`replacement`
  in `get_component`/`search_props` responses (consumes A3's corpus flags).
- **D5 — fix `check_version_parity` cwd bug:** resolve the package root from
  `import.meta.url`/the resolved valet module, not `process.cwd()`.

### E. Curated gaps + docs (sidecars + docs — after A/B so they pass the new gates)
- **E1 — Select examples** (3+, covering Select.Option composition + controlled
  value) + any other zero-example components flagged.
- **E2 — wording fixes:** Button best-practice `variant='contained'` →
  a real `ButtonVariant`; surface Button `type='submit'`.
- **E3 — docs/AGENTS/README/CHANGELOG:** document `validate_jsx`, structured
  output, deprecation-awareness; AGENTS.md MCP section + docs MCP.tsx page
  reflect the new tool; CHANGELOG entry.

## Waves (file-race-aware)

- **Wave 1 — foundations (parallel):** Lane A (extractor correctness, serial
  A1→A2→A3) ‖ Lane C (zod→SDK bump, serial C1→C2). Barrier. Orchestrator
  regenerates corpus + lands Lane B gate hardening + full gate.
- **Wave 2 — server DX (on bumped SDK + fixed corpus):** D1 validate_jsx
  (own files) ‖ D2/D3/D4/D5 (serialize the shared index.ts/shared.ts edits,
  parallelize per-tool). Adversarial review incl. a real client/tsc probe.
- **Wave 3 — curated + docs (one writer per file):** E1/E2 sidecars (pass
  check:examples + the new gate) → E3 docs/registrar. Final corpus regen.

## Verification & DoD

Per slice: regression test (node tests for extractor/gate; the server tools
get unit tests + a stdio round-trip where feasible); `npm run lint`,
`typecheck`, `npm test`, `build`, `check:engine`, `check:examples`,
`mcp:schema:check`, `mcp:check`, valet-mcp `build`+`selfcheck` all green.
`validate_jsx` proven against shipped types (a fixture consuming the packed
tarball or the installed package, not the repo src). mcp-data regenerated only
at wave end. **The acceptance test for the whole effort:** feed the MCP a
known-wrong snippet (`<Table selectable='multi' rowKey='id'>`) and confirm
(a) `get_component` now marks `selectable`/`rowKey` deprecated with the
replacement, and (b) `validate_jsx` flags them.

## Decisions for Ben (escalate only)

Adopting the assessment's recommendations as provisional rulings (reversible):
SDK = minor tilde-bump (no major exists); `validate_jsx` IS the headline;
stay tools-only (no resources/prompts churn); relationship graph = SKIP this
effort (validate_jsx subsumes nesting enforcement). Escalate only if: the SDK
bump forces a breaking server rewrite, or `validate_jsx` against shipped types
proves infeasible without a heavy new dependency.
