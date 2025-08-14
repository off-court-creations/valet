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

## NPM Scripts and Agent Testing Behavior

Before finishing your task, if you made changes to the code, ensure the following in order:

- You are in an environment where the valet docs have been `npm link @archway/valet` linked to the local
valet 
- no linting issues after running `npm run lint:fix`
  - if there are linting issues rinse and repeat until it's fixed
- valet will successfully build `npm run build`
  - if it wont rinse and repeat until it's fixed
- valet docs will successfully build `npm run build`
  - if it wont rinse and repeat until it's fixed

^ IMPORTANT ^

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

  - For docs pages, use the docs marker:

  ```tsx
  // ─────────────────────────────────────────────────────────────
  // src/pages/Overview.tsx  | valet-docs
  // docs page description
  // ─────────────────────────────────────────────────────────────
  ```

  The part after `|` is a short product marker: use `valet` for the library source and `valet-docs` for files under `docs/src`.

- Code is primarily authored by 0xbenc (and his agent proxies)
  - Tech debt is to be avoided
  - Radical thinking is encouraged when it doesn't produce hacky code
    and does produce simple, logical inputs and/or results.
  - Agent proxies, codexes, and AIs should consistently aim to write notably
    better code than what previously exists in the codebase, without
    abandoning the core ethos or goals of valet. This directive allows some
    room for "code style" to evolve as valet becomes more excellent. 

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

- Prefer referring to concepts you interacted with over files.
("Adjusted lighting" over "fixed lights.tsx")

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
- If there are already comments related to the same concept or component, you can preferably
re-edit the last `Unreleased` change of that nature to be more descriptive to all changes

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

### Primitives

- **Avatar** – Gravatar wrapper with custom image support.
- **Divider** – theme‑aware separator; horizontal/vertical with precise thickness, colour, length, spacing.
- **Icon** – wrapper around `@iconify/react` icons with size theming.
- **Image** – responsive image with lazy loading.
- **Progress** – linear or circular indicator supporting determinate/indeterminate.
- **Skeleton** – adaptive loading placeholder (text/rect/circle), auto‑hides on content load.
- **Typography** – semantic text variants with responsive sizes.
- **Video** – multi‑source video with lazy loading, fullscreen, and captions.

### Fields

- **Button** – theme‑aware button with variants and sizes.
- **Checkbox** – controlled/uncontrolled checkbox adhering to accessibility.
- **DateSelector** – date picker with optional range mode.
- **FormControl** – context provider wiring labels, errors, and disabled state.
- **IconButton** – icon‑only button sharing Button theming.
- **Iterator** – numeric stepper input.
- **MetroSelect** – segmented switch for discrete choices.
- **RadioGroup** – grouped radio inputs managed via FormControl.
- **Select** – typed single or multi‑select input.
- **Slider** – pointer and keyboard‑friendly value slider.
- **Switch** – boolean toggle styled like a physical switch.
- **TextField** – controlled text input integrating with FormControl.

### Layout

- **Accordion** – accessible expand/collapse container with composition API.
- **AppBar** – responsive top navigation bar.
- **Box** – baseline container handling background, text colour, and centring.
- **Drawer** – sliding overlay panel with escape handling and backdrop.
- **Grid** – CSS grid layout helper with gaps and spans.
- **List** – simple list with optional drag/keyboard reordering.
- **Modal** – accessible dialog component with optional backdrop.
- **Panel** – lightweight container with `main` and `alt` variants.
- **Stack** – flexbox‑based layout helper for consistent spacing.
- **Surface** – top‑level wrapper applying theme backgrounds and breakpoints.
- **Tabs** – grid‑based tab list with placement options.

### Widgets

- **CodeBlock** – syntax‑highlighted code with copy button and snackbar feedback.
- **Dropzone** – file drag‑and‑drop area with previews.
- **KeyModal** – overlay for capturing API keys.
- **LLMChat** – conversation UI with OpenAI message format; optional height constraint.
- **LoadingBackdrop** – fullscreen loading overlay for async operations.
- **Markdown** – render Markdown text with valet primitives.
- **Pagination** – page selector with first/last controls.
- **Parallax** – scroll‑aware container for simple parallax effects.
- **RichChat** – embeddable chat that supports custom JSX messages.
- **Snackbar** – transient message bar with stacking.
- **SpeedDial** – radial quick action menu.
- **Stepper** – horizontal or vertical step progress indicator.
- **Table** – sortable, selectable table with zebra and hover styling.
- **Tooltip** – hover/focus tooltip with theme‑aware styling.
- **Tree** – nested list with collapsible branches.

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
