// ─────────────────────────────────────────────────────────────
// servers/valet-mcp/src/primer.ts  | valet-mcp
// Opinionated primer content for agents. Returned by get_primer.
// ─────────────────────────────────────────────────────────────
export const PRIMER_TEXT = `
# valet Primer – Read Me First

valet is a performant, opinionated React UI library with:

- Performance: tiny CSS-in-JS runtime and predictable primitives.
- Opinionated patterns: consistent layout, spacing, and theming.
- AI-first introspection: MCP tools expose props, CSS vars, examples, and glossary.
- Mandatory accessibility: keyboard-first, clear roles, and labels.

Use this primer to steer your first actions and avoid common pitfalls.

## What To Do First

1) Call \`get_primer\` (this) to align on ethos and flows.
2) Explore components: \`list_components\`, then \`search_components { query }\`.
3) Inspect details: \`get_component { name|slug }\` and \`get_examples { name }\`.
4) Clarify terminology: \`get_glossary\` or \`define_term { word }\`.
5) Generate code that follows Best Practices from the component docs.

Tip: Prefer exact component names. If unsure, try synonyms in \`search_components\` (e.g., 'dropdown' → Select).

## Core Mental Model

- Surface: Each route renders a single \`<Surface>\` that owns screen state and CSS variables. Never nest surfaces.
- styled engine: \`styled\` and \`keyframes\` register elements and expose \`--valet-el-*\` CSS vars for size and layout.
- Presets: Define styles via \`definePreset()\` and use the \`preset\` prop for reuse and theme cohesion.
- Theme: Initialize once with \`useInitialTheme({ fonts }, [fontList])\`. Read/write via \`useTheme()\`; avoid hard-coded colors.
- Accessibility: Use provided components over raw HTML to get roles, labels, and keyboard behavior.
- Height-first tables: Tables constrain content height by default; set \`constrainHeight={false}\` to opt out.

## Agent Strategy for Excellence

- Start semantic: ask \`get_component\` before coding; read \`bestPractices\`, \`props\`, and \`cssVars\`.
- Choose minimal props: build with required props first (see \`minimalProps\` in examples), then add affordances.
- Layout with \`Stack\` and \`Panel\`: prefer these over ad-hoc divs; keep responsive gaps and alignments consistent.
- Keep bundles lean: split routes with \`React.lazy\` and wrap content in \`<Suspense>\`.
- Keyboard-first flows: ensure focus order and shortcuts where relevant (e.g., buttons, dialogs, lists, menus).
- Embrace presets: extract repeating styles into \`definePreset()\` and reference via \`preset\`.
- Respect Surface: never nest; register components inside the route-level Surface.

## Recommended Tooling Flow

1) \`search_components { query: "table zebra" }\` → choose component.
2) \`get_component { name: "Table" }\` → scan props, cssVars, bestPractices.
3) \`get_examples { name: "Table" }\` → adapt a runnable snippet.
4) If terms unclear → \`define_term { word: "Surface" }\`.
5) Implement code aligned with best practices and theme.

## Common Do / Don't

- Do wrap routes with \`<Surface>\`; Don't nest surfaces.
- Do use \`Stack/Grid\` for layout; Don't hand-roll flex everywhere.
- Do read \`bestPractices\` per component; Don't guess APIs.
- Do rely on theme and presets; Don't hard-code spacing/colors.
- Do provide keyboard paths; Don't rely on pointer-only interactions.

## MCP Notes

- Data sources resolve in this order: \`VALET_ROOT + VALET_MCP_DATA_DIR\` → \`VALET_MCP_DATA_DIR\` → nearest \`mcp-data\` from CWD → bundled → optional data package.
- If self-check returns \`components: 0\`: rebuild the data with \`npm run mcp:build\` in the valet repo.
- Node ≥ 18 (ideally 20+) recommended.

## Quick Example: New Page Layout

1) Wrap route with \`<Surface>\`.
2) Use \`<Stack>\` for column layout and gaps.
3) Group content in \`<Panel>\` with clear headings via \`Typography\`.
4) Prefer \`Select\`/\`RadioGroup\` over custom menus.
5) Wire feedback via \`Snackbar\` for transient messages.

With this flow, agents consistently generate accessible, themed, and predictable UI.
`;
