# Reusable Docs Structure – Overview and Next Steps

This document captures the current reusable documentation architecture in the valet repo, what it enables, and where to go next. It is based on the present code in `docs/` and `mcp-data/` and reflects observed patterns and gaps.

## Summary

- A meta‑driven, component docs template standardizes pages into 5 tabs: Usage, Best Practices, Playground, Examples, Reference.
- Live TSX examples render in the browser via `@babel/standalone`, with automatic scope detection for imported valet components.
- Reference tables (Props, CSS Vars, Events) are driven from `mcp-data/` and hidden when no data exists.
- Sidecar JSON files (co‑located with components) provide curated best practices and runnable examples that feed docs and MCP.
- Many pages are already migrated to the new template (e.g., Box, Panel, Grid, Surface, Tabs, Stack, Icon, Image, Divider, Avatar, Typography, Video). For the up‑to‑date list, see `docs/COMPONENTS_DOCS_TEMPLATE_CHECKLIST.md`.

## Key Building Blocks (files and roles)

- `docs/src/components/ComponentMetaPage.tsx`
  - Meta‑driven docs template rendered as Tabs: Usage → Best Practices → Playground → Examples → Reference.
  - Accepts `slug` or `name` (for MCP lookup), an optional `meta` (sidecar), plus `usage`/`playground` as arbitrary nodes.

- Live examples
  - `docs/src/components/LiveCodePreview.tsx`: runs TSX at runtime via `@babel/standalone`.
    - Detects used components (including dot‑notation, e.g., `Select.Option`) and hydrates scope from `@archway/valet`.
    - Renders preview alongside a `CodeBlock`; shows readable error messages when compilation/execution fails.
  - `docs/src/types/babel-standalone.d.ts`: minimal typings for `@babel/standalone` so Vite/TS builds are happy.

- Reference section and MCP integration
  - `docs/src/components/ReferenceSection.tsx`: unified renderer for Props, CSS Vars, Events. Each section hides automatically if empty.
  - `docs/src/components/PropsTable.tsx`, `CssVarsTable.tsx`, `EventsTable.tsx`: read `mcp-data/components/*.json` via `import.meta.glob`.
    - Slug inference rule when JSON lacks `slug`: filename `components_fields_button` → slug `components/fields/button`.
  - `docs/src/utils/mcpDocs.ts`: shared helpers `getComponentDoc`, `hasProps`, `hasCssVars`, `hasEvents` with a single slug‑indexed cache.

- Sidecar meta and curated content
  - `src/components/**/<Name>.meta.json`: co‑located component sidecar JSONs
    - Examples: `src/components/layout/Box.meta.json`, `src/components/layout/Panel.meta.json`.
  - `docs/src/utils/sidecar.ts`: normalization helpers
    - `getBestPractices(meta)`: returns a trimmed non‑empty string list.
    - `getExamples(meta)`: validates and normalizes examples, with default `id` and `lang='tsx'`.
  - `docs/src/components/CuratedExamples.tsx`: renders examples via `LiveCodePreview`, returns `null` when no examples.
  - `docs/src/components/BestPractices.tsx`: renders a simple list, returns `null` when empty.

- Navigation and layout cohesion
  - `docs/src/components/NavDrawer.tsx`: central, grouped nav tree for Getting Started, Concepts, Components (Layout/Primitives/Fields/Widgets), Examples. Persists expanded state in `localStorage` (`navExpanded`).
  - `docs/src/components/PageHero.tsx`: consistent page hero with gradient background, radius, optional subtitle + divider.

- Pages migrated to the template (examples)
  - `docs/src/pages/components/layout/BoxDemo.tsx`
  - `docs/src/pages/components/layout/Panel.tsx`
  - `docs/src/pages/components/layout/GridDemo.tsx`
  - `docs/src/pages/components/layout/Surface.tsx`
  - `docs/src/pages/components/layout/TabsDemo.tsx`
  - `docs/src/pages/components/layout/StackDemo.tsx`
  - `docs/src/pages/components/primitives/IconDemoPage.tsx`
  - `docs/src/pages/components/primitives/ImageDemo.tsx`
  - `docs/src/pages/components/primitives/DividerDemo.tsx`
  - `docs/src/pages/components/primitives/AvatarDemo.tsx`
  - `docs/src/pages/components/primitives/TypographyDemoPage.tsx`
  - `docs/src/pages/components/primitives/VideoDemo.tsx`
  - `docs/src/pages/components/primitives/SkeletonDemo.tsx`
  - `docs/src/pages/components/field/IteratorDemo.tsx`
  - `docs/src/pages/components/field/IconButtonDemoPage.tsx`
  - `docs/src/pages/components/field/DateSelectorDemo.tsx`
  - `docs/src/pages/components/widgets/ChipDemo.tsx`
  - Full status: `docs/COMPONENTS_DOCS_TEMPLATE_CHECKLIST.md`

- Broad adoption of shared reference/curation (not full template yet)
  - Many pages already use `ReferenceSection` with correct MCP slugs (e.g., `components/widgets/table`, `components/primitives/icon`, `components/fields/checkbox`, etc.).
  - Many pages already pipe sidecar data into `CuratedExamples` and `BestPractices` (primitives, fields, widgets).
  - Typography integrates `ReferenceSection` and best practices but remains bespoke; it’s a good next migration candidate.

- Docs app plumbing
  - `docs/src/App.tsx` sets up routes with `React.lazy` + `Suspense` and includes the migrated pages.
  - `docs/package.json` includes `@babel/standalone` for `LiveCodePreview`, and uses React 19 + Vite 6 + RRD 7.

## Observations and Details

- Reference tables gracefully noop: if a component lacks props/cssVars/events in `mcp-data`, the corresponding section is omitted.
- Live example scope hydration is conservative and resilient:
  - Detects upper‑case tags and compound tags (e.g., `Select.Option`) to include the right names from the `@archway/valet` namespace.
  - Always adds `Box`, `Stack`, and `Typography` to smooth over simple examples.
  - Errors are captured and shown in the UI; no console flooding.
- Slug derivation logic is consistent across Props/CSS/Events and MCP helpers: filename underscores → slashes.
- Page header comments adhere to the `valet-docs` style; minor path inconsistencies exist in some headers (see “Gaps”).

## Gaps / Inconsistencies

- Migration coverage
  - Many top‑traffic pages use the new `ComponentMetaPage` template end‑to‑end. Remaining legacy pages are tracked in `docs/COMPONENTS_DOCS_TEMPLATE_CHECKLIST.md`.
- Sidecar coverage
  - Not all components have sidecar JSONs with curated `docs.bestPractices` and runnable `examples`. Where sidecars are thin or missing, Examples/Best Practices tabs render nothing.
- Header path comments
  - `docs/src/components/PageHero.tsx` and `docs/src/components/NavDrawer.tsx` header comments show `// src/components/...` instead of `// docs/src/components/...`.
- Example runtime limits
  - `LiveCodePreview` executes code via `new Function` (Babel output), which is browser‑only and unsuitable for SSR; this is fine for the docs app, but worth noting.
  - Scope detection is heuristic; very complex dynamic imports or external libraries in examples are not supported (by design, for predictability and safety).
- Data freshness
  - `mcp-data/` must be rebuilt after component or docs updates for the Reference tab to remain accurate.

## Recommended Next Steps

1. Complete migration to `ComponentMetaPage`
   - Convert remaining component pages to the 5‑tab template to eliminate bespoke tab layouts and reduce duplication. Track progress in `docs/COMPONENTS_DOCS_TEMPLATE_CHECKLIST.md`.

2. Ensure sidecar parity across components
   - Add or enrich `<Name>.meta.json` files for all components with:
     - `docs.bestPractices`: short, actionable bullets.
     - `examples[]`: focused, runnable TSX snippets that work with `LiveCodePreview`.

3. Keep MCP data in sync
   - After changes to components or docs, run: `npm run mcp:build`.
   - Optional: use `npm run mcp:watch` during active work to auto‑refresh `mcp-data/`.

4. Tighten header comment consistency
   - Fix path text in component headers so all `valet-docs` files reflect `docs/src/...`.

5. Consider small DX enhancements
   - Add a light error boundary/warning panel around `LiveCodePreview` to show compilation/runtime hints (without inflating complexity).
   - Document the example authoring guidelines (e.g., use theme tokens, avoid imports, prefer short snippets, rely on provided scope).

6. Optional: auto‑generate nav groups
   - Explore deriving portions of the nav from MCP `index.json` to reduce menu drift, while keeping curated ordering in code.

## How to Add a New Component Page (template flow)

1. Create or update the component’s sidecar at `src/components/.../<Name>.meta.json` with best practices and examples.
2. Ensure `mcp-data/` is current: `npm run mcp:build`.
3. Create a docs page that uses `ComponentMetaPage`, passing:
   - `title`, `subtitle`, and `slug` (e.g., `components/widgets/tooltip`).
   - `meta` imported from the sidecar JSON.
   - `usage` and `playground` nodes.
4. Add a route in `docs/src/App.tsx` and a nav item in `docs/src/components/NavDrawer.tsx`.

## Maintenance Commands

- Rebuild MCP data: `npm run mcp:build`
- Docs dev: `cd docs && npm install && npm run dev`
- Link local library into docs: `npm run link:docs` (from repo root)

## Impact

- Predictable, accessible documentation across all components with minimal bespoke UI per page.
- Lower maintenance cost via centralized Reference rendering and curated Examples/Best Practices.
- Better AI/agent support through consistent sidecar + MCP data that feed both docs and tools.

_Last updated: generated from repo state on current branch._
