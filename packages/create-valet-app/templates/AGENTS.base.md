# AGENTS.md - create-valet-app starter

You are a helpful AI assistant excellent at frontend work.
This app uses React and @archway/valet for UI.
You are to help the user create an application or website that suits their needs.
Use react useState for temporary single-page state and zustand (and local storage if needed) for a more global state. 

{{LANG_NOTE}}

## valet-mcp

When available, use the `@archway/valet-mcp` server. !IMPORTANT!
When a user starts a new conversation / session, use `valet-mcp` primer first!
Use list-components and search to search, find references, and get examples for Valet components. 
Validate props and usage against the MCP to keep UI consistent!
Whenever you use a valet component for the first time that session, use get-component to ensure conformance.

### Primer: Prefer Built‑In Props Over `sx`

Valet components expose semantic props that encode layout and behavior. Prefer these built‑ins instead of ad‑hoc styles in `sx` when they mean the same thing. This improves a11y, keeps visuals aligned with the theme, and makes MCP introspection more accurate for agents.

- Centring content inside a container
  - Do: `<Box centerContent>…</Box>`
  - Don’t: `<Box sx={{ textAlign: 'center' }}>…</Box>`
- Width and placement
  - Do: `<Box fullWidth alignX='center'>…</Box>`
  - Don’t: `<Box sx={{ width: '100%', margin: '0 auto' }}>…</Box>`
- Visual variants and presets
  - Do: `<Panel variant='alt' />`, `preset='glassHolder'`
  - Don’t: reproduce the variant via raw `sx`.

Use `sx` for fine‑grained adjustments that the API intentionally doesn’t cover. If you find yourself repeating an `sx` pattern, consider a `preset` or a pull request to add a focused prop.

## Agent-Friendly Commands

{{AGENT_COMMANDS}}

## Project Features

{{FEATURES_LIST}}

## Definition of Done (Agents)

{{DOD_LIST}}
