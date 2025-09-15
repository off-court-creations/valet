# MCP Enhancements One-Shot Execution Plan

This guide is the single source of truth for implementing two complementary valet MCP tools without additional product input:

1. `valet__search_best_practices`: searchable access to component best-practice guidance.
2. `valet__list_synonyms`: first-class exposure of the synonym map already powering slug resolution.

Follow the sections sequentially. Each subsection covers **why**, **what**, and the precise actions to land clean code without surprises.

---

## 0. Pre-flight

- Ensure repo setup matches project docs: Node ≥ 20, dependencies installed (`npm install` in `valet` and `docs`).
- Verify MCP data is current before you start: `npm run mcp:build`. Detailed changes rely on the latest `mcp-data/` snapshot.
- Review existing tools under `packages/valet-mcp/src/tools/` plus shared helpers in `packages/valet-mcp/src/tools/shared.ts`.
- Confirm `mcp-data/component_synonyms.json` exists; if not, rebuild via `npm run mcp:build`.

---

## 1. Add `valet__search_best_practices`

### 1.1 Purpose Recap

Agents need to answer prompts like “What’s the recommended focus pattern for overlays?” without fetching every component doc. The new tool returns targeted snippets from `bestPractices` arrays across components.

### 1.2 Data Expectations

- Every component JSON already includes `"bestPractices": string[]` (see `mcp-data/components/...`).
- Some components have empty arrays; skip them to keep payloads lean.
- Each hit should expose: component name, slug, optional category/status, matched best-practice text, and minimal match context.

### 1.3 File Layout

1. Create `packages/valet-mcp/src/tools/searchBestPractices.ts` with the standard header comment:
   ```tsx
   // ─────────────────────────────────────────────────────────────
   // packages/valet-mcp/src/tools/searchBestPractices.ts  | valet-mcp
   // Tool: valet__search_best_practices – search best-practice guidance
   // ─────────────────────────────────────────────────────────────
   ```
2. Mirror the structure of `searchProps.ts` / `searchCssVars.ts` for parameter parsing and response building.

### 1.4 API Contract

- Tool name: `valet__search_best_practices`.
- Params (`z` schema):
  - `query: z.string().min(1)` – primary search text.
  - `limit?: z.number().int().positive().max(100)` – default 20.
  - `category?: z.string()` – optional exact match against index categories.
  - `status?: z.union([z.string(), z.array(z.string())])` – reuse semantics from `search_components`.
- Response: JSON array of sorted results. Each result should include at minimum:
  ```json
  {
    "name": "Panel",
    "slug": "components/layout/panel",
    "category": "layout",
    "status": "stable",
    "bestPractice": "Use Panel to group related content and provide visual separation.",
    "matchScore": 11,
    "matchType": "text",
    "index": 0
  }
  ```
  - `matchType` is optional but helps debugging (`text`, `token`, `alias`, `category`).
  - `index` is the 0-based position of the practice in the component doc, enabling callers to link back to `get_component` payloads.

### 1.5 Implementation Steps

1. Import helpers: `getIndex`, `getComponentBySlug`, `simpleSearch` (and synonym utilities from §2 if you expose them globally).
2. Derive candidate components:
   - Start with `getIndex()`.
   - Apply category filter up front.
   - Normalize `status` into a lowercase `Set`, matching the logic in `searchComponents.ts`. Consider extracting a `normalizeStatusFilter` helper in `shared.ts` so both tools share it.
3. Search strategy per component:
   - Load the full doc via `getComponentBySlug` (cache in `Map` keyed by slug to avoid duplicate reads).
   - Ignore docs without a populated `bestPractices` array.
   - Lowercase the query and split into unique tokens (`/[A-Za-z0-9]+/` with length ≥2) for scoring.
   - For each best-practice string:
     - Lowercase once for comparisons.
     - Compute score: +5 if the raw string contains the full query; +3 per matched token; +2 if `simpleSearch` score for the component is positive; +2 if synonyms tie the query to the component (see §2.4); +1 if category matches the query string exactly.
     - Track `matchType` flags based on which criteria fired.
     - Push results that score >0, including original text and metadata.
4. After iterating components, sort results by `matchScore` desc, `name` asc, then `index` asc.
5. Slice to `limit` and respond with `JSON.stringify(results)`.
6. Register the tool inside `packages/valet-mcp/src/index.ts` alongside the other `registerSearch*` calls.

### 1.6 Validation

- Run `npm run mcp:server:selfcheck` (no regressions expected).
- Smoke-test through your MCP client or CLI harness:
  ```json
  {"command":"valet__search_best_practices","args":{"query":"outline"}}
  ```
  Verify output includes relevant panel/tab guidance.
- Confirm `category` and `status` filters by querying `{ "query": "focus", "category": "widgets" }` and `{ "query": "theme", "status": "stable" }`.
- Stress test limit enforcement (e.g., `limit: 5`).

---

## 2. Add `valet__list_synonyms`

### 2.1 Purpose Recap

Agents currently guess which aliases resolve to canonical names. `resolveSlug` already loads a synonym map (from file or fallback); expose that map so AIs can normalize vocabulary before issuing targeted requests.

### 2.2 API Contract

- Tool name: `valet__list_synonyms`.
- Params: none.
- Response shape:
  ```json
  {
    "source": "file",
    "pairs": [
      { "alias": "dropdown", "targets": ["Select"] },
      { "alias": "metroselect", "targets": ["MetroSelect"] }
    ]
  }
  ```
  - `source` enumerations: `"file"`, `"fallback"`, or `"merged"` (file overlays fallback but fallback entries still included for transparency).
  - `pairs` sorted alphabetically by alias, each `targets` array deduplicated and sorted.

### 2.3 Shared Helper Adjustments

1. In `shared.ts`, promote `loadSynonyms` to an exported function returning `{ map: SynonymsMap, source: 'file' | 'fallback' | 'merged' }`.
2. Merge logic:
   - Start from fallback map (current literal object).
   - If `component_synonyms.json` exists, read it and merge.
   - When merging, treat aliases case-insensitively (`alias.toLowerCase()`), replace fallback entries when the file defines the same alias, and trim whitespace.
3. Cache the result using a module-level variable to avoid repeated disk reads across requests. Provide a `clearSynonymCache()` helper if hot reloads matter (optional).
4. Update `resolveSlug` to consume the exported helper instead of its own local copy. Adjust the existing references accordingly.

### 2.4 Tool Implementation

1. Create `packages/valet-mcp/src/tools/listSynonyms.ts` with the standard header comment.
2. Register `server.tool('valet__list_synonyms', async () => { ... })`.
3. Inside the handler:
   - Call the exported helper to fetch `{ map, source }`.
   - Convert to an array of `{ alias, targets }` sorted by alias.
   - Ensure each `targets` list is unique and sorted lexicographically.
   - Return `JSON.stringify({ source, pairs })`.
4. Add the registration to `packages/valet-mcp/src/index.ts` (right after other list/search tools for discoverability).

### 2.5 Validation

- Manual call:
  ```json
  {"command":"valet__list_synonyms"}
  ```
  Confirm familiar aliases (`dropdown`, `navbar`, `toast`) appear with expected targets.
- Temporarily rename `mcp-data/component_synonyms.json` to simulate fallback-only mode; ensure `source` flips to `"fallback"` and output still contains hard-coded defaults. Restore the file afterwards.
- If you add caching, verify multiple calls return identical data and do not re-read the file (log or breakpoint during development only).

---

## 3. Wiring & Consistency Tasks

1. Update `packages/valet-mcp/src/index.ts` to register both new tools. Keep call order coherent (list/search groups together).
2. If you extracted helpers (status filter normalization, synonym cache), document them with concise comments describing intent.
3. Confirm TypeScript picks up new exports without circular dependencies. Run `npm run lint:fix` after code changes.
4. When satisfied, rebuild: `npm run build` (root) then `cd docs && npm run build && cd ..`.
5. Rebuild MCP data if necessary (`npm run mcp:build`) and rerun `npm run mcp:server:selfcheck`.

---

## 4. Documentation & Changelog

- Update `CHANGELOG.md` under `Unreleased` to mention the new tools (one bullet covering both is fine).
- Amend any MCP tooling docs (`docs/src/pages/concepts/MCP.tsx`) to add concise descriptions and usage snippets for the two tools.
- If there is a README or docs table enumerating MCP endpoints, insert rows for the new commands.

---

## 5. Post-flight Checklist

- [ ] `valet__search_best_practices` returns sorted matches, enforces limit, and respects category/status filters.
- [ ] New shared helpers (status normalization, synonym loader) are reused where appropriate.
- [ ] `valet__list_synonyms` returns deterministic JSON with `source` + sorted alias pairs in both file and fallback scenarios.
- [ ] Lint, builds, `npm run mcp:server:selfcheck` all succeed.
- [ ] Docs/CHANGELOG updated.
- [ ] Spot-check existing tools (`valet__search_components`, `valet__get_component`) to ensure no regressions.

Hand this guide to any implementer—they can land both MCP enhancements end-to-end without further clarification.
