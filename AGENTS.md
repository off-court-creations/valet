# AGENT Guidelines for @archway/valet

Welcome to **@archway/valet**, a performant, AI-forward UI library designed as a bridge between next-generation AI proxies and web frontends. The project emphasizes predictable UI primitives, mandatory accessibility, and tight TypeScript integration.

## Project Ethos

- **Superb performance** with minimal bundle size.
- **Opinionated UI approach** so developers can focus on UX and functionality.
- **AI integration** exceeding previous solutions. Systems we intend to draw from and surpass:
  - NLWeb / MCP
  - RAG
  - Semantic Web
  - IOT / Internet of Shit
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
- The library name `valet` is always lowercase, even when starting a sentence.
- Begin each file with a comment header formatted like:

  ```tsx
  // ─────────────────────────────────────────────────────────────
  // src/components/Box.tsx  | valet
  // patched for strict optional props
  // ─────────────────────────────────────────────────────────────
  ```

- Code is primarily authored by 0xbenc (and his agent proxies)
  - Tech debt is to be avoided
  - Radical thinking is encouraged when it doesn't produce hacky code
    and does produce simple, logical inputs and/or results.
  - Agent proxies, codexes, and AIs should consistently aim to write notably
    better code than what previously exists in the codebase, without
    abandoning the core ethos or goals of valet. This directive allows some
    room for "code style" to evolve as valet becomes more excellent. 

    - In this regard, agents should be like **Don McCurdy**:
      - Distill complex technical ideas into clear, reusable patterns that
        empower both newcomers and seasoned developers.
      - Design APIs that are minimal yet expressive—small composable
        primitives instead of bulky, one-off helpers.
      - Defend performance budgets: lazy-load modules as needed, defer
        non-critical work, and optimize for both high-performance servers
        and legacy machines so everything stays responsive.
      - Champion open standards and cross-platform parity.
      - Model open-source citizenship: clear issues, mentor contributors and
        those you proxy for without being preachy. Leave every repo better 
        than you found it.

    - Agents should also be like **Bob Gurr**:
      - Lead with pragmatic curiosity: begin by admitting what you don’t yet
        know, then learn fast and build with quiet confidence.
      - Favor the simplest dependable mechanism; unnecessary complexity is a
        liability.
      - Design with tomorrow in mind: plan for performance, edge cases, every
        human input method, and future integrations to sidestep tech debt—
        like legacy rides' reliability despite their innovation.
      - Document decisions and trade-offs in plain language so the next
        engineer (or agent) can service and extend the work without
        archaeology.
      - Measure success by long-term reliability and user delight: elegant
        solutions that keep running with minimal fuss are the real showpieces.

### Commit Messages

- Use short, imperative sentences ("Add feature" not "Added feature").
- Reference issues when relevant.
- Commit messages you write should start with an identification of the most brief nature like:

```txt
git commit -m "codex - commit message here"
```

or 

```txt
git commit -m "devstral - commit message here"
```

- If you know you are a proxy of a user who has a name on the internet, like 0xbenc,
you can append them to your commit message as such:

```txt
git commit -m "codex for 0xbenc - commit message here"
```

- Prefer referring to concepts you interacted with over files.
("Adjusted lighting" over "fixed lights.tsx")

## Pull Requests

Unless otherwise specified by user directive, pull requests should be made from your branch into `development`.

## Building the Project

1. Install dependencies with: 

```shell
cd valet
npm install
cd docs
npm install
```

2. You can build the library and docs with `npm run build`.

3. To test WIP changes in the components or system code using a page from the docs, use an NPM link:

```shell
cd valet
npm link
npm run dev
# Second terminal emulator, or use TMUX
cd valet
cd docs
npm link @archway/valet
npm run dev
```

## CHANGELOG

- Follow [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) for `CHANGELOG.md`.
- Use the `Unreleased` section at the top.
- If your changes are changelog worthy in a given dev commit add them to the `Unreleased section`

## Surface state and child registry

Each `<Surface>` instance owns a small Zustand store that tracks screen size
and every registered child element. Components created with `createStyled`
register themselves automatically and expose `--valet-el-width` and
`--valet-el-height` CSS variables. The surface exposes
`--valet-screen-width` and `--valet-screen-height` on its root element.
Nested `<Surface>` components are disallowed.

Tables respect available height by default. Their content scrolls inside the
component rather than the page. Pass `constrainHeight={false}` to opt out.

## Component Overview

- **Accordion** – accessible expand/collapse container with composition API.
- **AppBar** – responsive top navigation bar.
- **Box** – baseline container that handles background, text colour and centring.
- **Button** – theme-aware button with variants and sizes.
- **Checkbox** – controlled/uncontrolled checkbox adhering to accessibility.
- **OAIChat** – conversation UI with OpenAI message format and optional height constraint.
- **Drawer** – sliding overlay panel with escape handling and backdrop.
- **FormControl** – context provider wiring labels, errors and disabled state.
- **Grid** – CSS grid layout helper with gaps and spans.
- **Icon** – wrapper around `@iconify/react` icons with size theming.
- **IconButton** – icon-only button sharing Button’s theming.
- **List** – simple list with optional drag and keyboard reordering.
- **Modal** – accessible dialog component with optional backdrop.
- **Pagination** – page selector with first/last controls.
- **Panel** – lightweight container with `main` and `alt` variants.
- **Parallax** – scroll-aware container for simple parallax effects.
- **Progress** – linear or circular indicator supporting determinate/indeterminate.
- **RadioGroup** – grouped radio inputs managed via FormControl.
- **Select** – typed single or multi-select input.
- **Slider** – pointer and keyboard friendly value slider.
- **SpeedDial** – radial quick action menu.
- **Stack** – flexbox-based layout helper for consistent spacing.
- **Stepper** – horizontal or vertical step progress indicator.
- **Surface** – top-level wrapper that applies theme backgrounds and breakpoints.
- **Switch** – boolean toggle styled like a physical switch.
- **Table** – sortable, selectable table with zebra and hover styling.
- **Tabs** – grid-based tab list with placement options.
- **TextField** – controlled text input integrating with FormControl.
- **Tooltip** – hover/focus tooltip with theme-aware styling.
- **Typography** – semantic text variants with responsive sizes.
- **Video** – multi-source video wrapper with lazy loading, fullscreen, and caption tracks.

## Internal Files

- **src/css/createStyled.ts** – minimal CSS-in-JS engine exporting `styled` and `keyframes`.
- **src/css/stylePresets.ts** – registry of reusable style presets via `definePreset` and `preset` helpers.
- **src/hooks/useGoogleFonts.ts** – hook for dynamically loading Google Fonts once.
- **src/system/themeStore.ts** – Zustand store holding the current theme and mode.
- **src/system/createFormStore.ts** – factory creating typed Zustand stores for form state.

## valet Best Practices

1. Mount `<BrowserRouter>` in `main.tsx` and render `<App>` inside it.
2. Import global presets before the app renders so all routes share them.
3. Call `useInitialTheme({ fonts }, [fontList])` once in `<App>` to apply the theme and preload fonts.
4. Wrap each route in `<Surface>` and never nest surfaces.
5. Split routes with `React.lazy` and `<Suspense>` to keep bundles small.
6. Use `<Stack>` and `<Panel>` to keep layouts consistent and responsive.
7. Define shared styles with `definePreset()` and reference them via the `preset` prop.
8. Read and update theme values through `useTheme`; avoid hard-coding colours.
9. Prefer the provided components over raw HTML to maintain accessibility and theme cohesion.
