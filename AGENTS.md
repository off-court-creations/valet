# AGENT Guidelines for @archway/valet

Welcome to **@archway/valet**, a performant, AI-forward UI library designed as a bridge between next-generation AI proxies and web frontends. The project emphasizes predictable UI primitives, mandatory accessibility, and tight TypeScript integration.

## Project Ethos
- **Superb performance** with minimal bundle size.
- **Opinionated UI approach** so developers can focus on UX.
- **AI integration** exceeding previous solutions.
- **Accessibility** and inclusive design baked into every component.

## Core Features & AI Goals
- **Next-gen design language** with advanced runtime theming.
- **Semantic Interface Layer** for component-level metadata and AI-driven behavior.
- **Context Bridge for State** built on Zustand and typed JSON schemas.
- **Web Action Graph** capturing interactions for introspection and adaptation.
- **Integrated AI-centric architecture** that unifies semantics, state, and actions.

## Coding Standards
- Code is written in **TypeScript**. Keep types strict and explicit.
- Follow modern React (v18+) patterns.
- Keep dependencies minimal and prefer native APIs when possible.
- Begin each file with a comment header formatted like:
  ```
  // ─────────────────────────────────────────────────────────────
  // src/components/Box.tsx  | valet
  // patched for strict optional props
  // ─────────────────────────────────────────────────────────────
  ```

### Commit Messages
- Use short, imperative sentences ("Add feature" not "Added feature").
- Reference issues when relevant.

## Building the Project
1. Install dependencies with `npm install`.
2. Build the library with `npm run build`.
3. For development, use `npm run dev` to start a watch build.

## Contributions
- Issues and pull requests are welcome. Standard GitHub workflow applies.
- Please open an issue before large changes to discuss alignment with the project goals.

## Component Overview
- **Accordion** – accessible expand/collapse container with composition API.
- **Box** – baseline container that handles background, text colour and centring.
- **Button** – theme-aware button with variants and sizes.
- **Checkbox** – controlled/uncontrolled checkbox adhering to accessibility.
- **Drawer** – sliding overlay panel with escape handling and backdrop.
- **FormControl** – context provider wiring labels, errors and disabled state.
- **Icon** – wrapper around `@iconify/react` icons with size theming.
- **IconButton** – icon-only button sharing Button’s theming.
- **List** – simple list with optional drag and keyboard reordering.
- **Modal** – accessible dialog component with optional backdrop.
- **Panel** – lightweight container with `main` and `alt` variants.
- **Parallax** – scroll-aware container for simple parallax effects.
- **Progress** – linear or circular indicator supporting determinate/indeterminate.
- **RadioGroup** – grouped radio inputs managed via FormControl.
- **Select** – typed single or multi-select input.
- **Slider** – pointer and keyboard friendly value slider.
- **Stack** – flexbox-based layout helper for consistent spacing.
- **Surface** – top-level wrapper that applies theme backgrounds and breakpoints.
- **Switch** – boolean toggle styled like a physical switch.
- **Table** – sortable, selectable table with zebra and hover styling.
- **Tabs** – grid-based tab list with placement options.
- **TextField** – controlled text input integrating with FormControl.
- **Tooltip** – hover/focus tooltip with theme-aware styling.
- **Typography** – semantic text variants with responsive sizes.

## Internal Files
- **src/css/createStyled.ts** – minimal CSS-in-JS engine exporting `styled` and `keyframes`.
- **src/css/stylePresets.ts** – registry of reusable style presets via `definePreset` and `preset` helpers.
- **src/hooks/useGoogleFonts.ts** – hook for dynamically loading Google Fonts once.
- **src/system/themeStore.ts** – Zustand store holding the current theme and mode.
- **src/system/createFormStore.ts** – factory creating typed Zustand stores for form state.

## Valet Best Practices
1. Wrap your application in `<Surface>` at the highest level so theme colours and breakpoints propagate correctly.
2. Call `useGoogleFonts()` during initial render to load fonts defined in the theme.
3. Use `<Stack>` and `<Panel>` to keep layouts consistent and responsive.
4. Define shared styles with `definePreset()` and reference them via the `preset` prop.
5. Read and update theme values through `useTheme`; avoid hard-coding colours.
6. Prefer the provided components over raw HTML to maintain accessibility and theme cohesion.
