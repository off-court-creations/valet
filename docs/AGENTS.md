# AGENTS.md — valet-docs

Purpose: help agents work faster and better. This guide serves two audiences:

- Agent contributors building valet itself (library + docs).
- Agents using valet inside other projects.

It encodes project ethos, required workflows, and performance habits that keep AI work runs predictable, fast, and correct.

---

## 1) Core Principles

- Performance first: minimize bundle size, avoid unnecessary deps, prefer native APIs.
- Accessibility by default: prefer valet components over raw HTML to preserve a11y semantics.
- Predictability: small, targeted changes; strict TypeScript; explicit props; stable contracts.
- Opinionated UI: choose the simple, consistent pattern over ad‑hoc styling.
- AI‑forward integration: preserve semantics, state, and actions for downstream AI tooling.

---

## 2) Quickstart Checklists

### For valet contributors (this repo)

1) Environment
- Node LTS; repo already includes `node_modules` in CI/dev.
- No network installs mid‑run unless strictly necessary.

2) Install and link (first setup)
- `cd valet && npm install`
- `cd docs && npm install`

3) Dev loop (linked)
- Terminal A: `cd valet && npm link && npm run dev`
- Terminal B: `cd docs && npm link @archway/valet && npm run dev`

4) Pre-finish guards (run in this order when you changed code)
- From repo root: `npm run lint:fix`
- From repo root: `npm run build`
- From `docs/`: `npm run build`

If any step fails, fix and repeat until clean. Zero lint errors is required.

### For agents using valet in another project

1) Install: `npm i @archway/valet`
2) App bootstrap:
- Mount `BrowserRouter` in `main.tsx` and render `<App>` inside it.
- Import presets before render; call `useInitialTheme({ fonts }, [fontList])` once in `<App>`.
- Wrap each route in `<Surface>`; do not nest `<Surface>`.
3) Layout: prefer `<Stack>` and `<Panel>` for consistent spacing and responsiveness.
4) State + semantics: use `useTheme`, avoid hard‑coding colors; leverage `createFormStore` for forms.
5) Performance: lazy‑load routes with `React.lazy` + `Suspense`.

---

## 3) AI Work Run Performance Playbook

- Start with a plan: outline 2–5 concise steps with a single in‑progress step at any time.
- Read before you write: scan component and system files adjacent to your change; follow patterns.
- Patch surgically: minimize surface area and churn; avoid sweeping refactors as collateral.
- Keep types strict: explicit props, no implicit any; prefer `readonly` where applicable.
- Avoid new deps: prefer native APIs and internal utilities (`createStyled`, `stylePresets`).
- Measure complexity: keep branches shallow and predictable; prefer derived values over re‑state.
- Respect surfaces: never nest `<Surface>`; rely on its CSS vars and child registration.
- Render discipline: memoize where it matters; avoid prop churn; prefer stable callbacks.
- Lazy by default: code‑split routes and heavy widgets; don’t preload until needed.
- One theme init: call `useInitialTheme(...)` once; do not load fonts per render.
- Tables: default to height‑constrained scrolling; set `constrainHeight={false}` to opt out.

---

## 4) Required Coding Standards

- TypeScript + React 18 patterns; strict and explicit types.
- Minimal, focused props; no one‑letter names; prefer small composable components.
- File header comments are mandatory:

```tsx
// ─────────────────────────────────────────────────────────────
// src/components/Box.tsx  | valet
// patched for strict optional props
// ─────────────────────────────────────────────────────────────
```

Docs pages use `valet-docs` in the header and the path under `docs/src`:

```tsx
// ─────────────────────────────────────────────────────────────
// src/pages/Overview.tsx  | valet-docs
// docs page description
// ─────────────────────────────────────────────────────────────
```

- Accessibility: prefer valet primitives over raw tags to inherit a11y and theming.
- Styling: use `createStyled` and `stylePresets`; avoid ad‑hoc inline styles.
- State: use provided Zustand stores (`themeStore`, `createFormStore`) instead of custom global state.

---

## 5) Library Internals You Should Know

- `src/css/createStyled.ts`: lightweight CSS‑in‑JS; exports `styled` and `keyframes`.
- `src/css/stylePresets.ts`: `definePreset` and `preset` registry for reusable styles.
- `src/hooks/useGoogleFonts.ts`: load Google Fonts once per app.
- `src/system/themeStore.ts`: Zustand store for theme and mode.
- `src/system/createFormStore.ts`: factory for typed form state stores.

These shape how components express semantics, styles, and state. Reuse them.

---

## 6) Library Contributor Workflow (valet itself)

1) Scope the change
- What component/system is affected? What user‑visible behavior changes? Any breaking types?

2) Implement
- Keep updates localized; follow file header conventions; keep props typed and documented.

3) Validate
- `npm run lint:fix` (root) → fix all issues.
- `npm run build` (root) → verify the library builds.
- `cd docs && npm run build` → verify docs app builds with your changes.

4) Changelog
- Update `CHANGELOG.md` under `Unreleased`. If similar prior entry exists, revise it to include your changes.

5) Commit style
- Short, imperative messages prefixed by your agent tag:
  - `git commit -m "codex - clarify FormControl a11y mapping"`
  - `git commit -m "devstral - optimize Table row virtualization"`

---

## 7) Using valet In Your App (agents & teams)

- Theme bootstrap
  - Import global presets before app render.
  - Call `useInitialTheme({ fonts }, [fontList])` once in `<App>`.
- Layout discipline
  - Surface: wrap routes in `<Surface>`; do not nest.
  - Structure: use `<Stack>` and `<Panel>` for spacing and density.
- Inputs and forms
  - Create form stores with `createFormStore`. Use `FormControl` to provide the typed store context and handle submit via `onSubmitValues`. Individual field components render labels/errors and manage disabled state.
- Tables and lists
  - Use built‑in height constraints; prefer internal scroll to page scroll.
- AI widgets
  - `LLMChat` and `RichChat` prefer OpenAI‑style messages; keep height constraints explicit where needed.

---

## 8) Web Action Graph & Semantics

- Components register themselves via `createStyled`; surfaces track child dimensions.
- CSS variables exposed:
  - Surface: `--valet-screen-width`, `--valet-screen-height`.
  - Child elements: `--valet-el-width`, `--valet-el-height`.
- When authoring new components, ensure they auto‑register and expose sizing to preserve introspection.

---

## 9) Common Pitfalls

- Nesting `<Surface>`: disallowed; use one per route/page.
- Hard‑coding colors: use `useTheme`; reference tokens.
- Multiple theme inits: call `useInitialTheme` once.
- Over‑abstracting: keep API small and predictable; avoid premature generalization.
- Adding dependencies: prefer existing utilities and native capabilities.

---

## 10) Troubleshooting Build & Lint

- Lint fails
  - Run `npm run lint:fix` at repo root; address explicit errors.
  - Ensure header comments and explicit types are present.

- Library build fails
  - Check TS strictness and export surfaces; avoid circular imports.

- Docs build fails
  - Re‑link after local changes: `cd valet && npm link`, then `cd docs && npm link @archway/valet`.
  - Ensure you are importing presets before render and calling `useInitialTheme` once.

---

## 11) Contribution Values

- Small, high‑quality patches over large refactors.
- Tight feedback loop: plan → patch → lint/build → docs build → iterate.
- Keep the ethos: performance, accessibility, semantics, and minimalism.

If in doubt, optimize for clarity and predictable outcomes. Agents should consistently leave the codebase simpler than they found it.

---

## 12) Prefer Built‑In Props Over `sx`

Valet components intentionally expose semantic props that encode behavior, theming, and accessibility. Prefer these first‑class props instead of reaching for ad‑hoc styles in `sx` when they express the same intent.

Why this matters
- Semantics: props communicate purpose (e.g., centring content) rather than an incidental style.
- Theming + a11y: built‑ins cooperate with theme tokens, modes, and contrast rules.
- Consistency: components stay predictable across pages; fewer edge cases.
- Introspection: MCP data and docs reflect prop‑level behavior; agents rely on this.

Heuristics
- Choose API semantics first; use `sx` only for details that aren’t covered by the component API.
- If you catch yourself hand‑coding a common pattern, look for a prop or a preset.
- Prefer tokens (`theme.colors`, spacing units, presets) over raw CSS values.

Concrete examples
- Centring content inside a container
  - Do: `<Box centerContent>…</Box>`
  - Don’t: `<Box sx={{ textAlign: 'center' }}>…</Box>`
- Horizontal placement and width
  - Do: `<Box fullWidth alignX='center'>…</Box>`
  - Don’t: `<Box sx={{ width: '100%', margin: '0 auto' }}>…</Box>`
- Variant/visual affordances
  - Do: `<Panel variant='alt'>…</Panel>` (or `preset='glassHolder'`)
  - Don’t: `<Panel sx={{ background: 'transparent', outline: '1px solid …' }}>…</Panel>`

Principle in one line
- You shouldn’t use `sx` when a valet prop does the same thing better. Prefer the built‑in props.
