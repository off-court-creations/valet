# valet Typography 1.0 – Excellence & Performance Plan

This document outlines an end‑to‑end plan to make valet’s typography world‑class for the 1.0 release: performance‑first, variable‑font‑native, stable, and delightful. It’s organized as goals → tokens → loader → components → performance → i18n → validation → docs/rollout.

Update (adjusted after repo audit; all critical items ship in 1.0):

- Remove any default font‑loading gate (FOIT) so content paints immediately with system fallbacks; add `blockUntilFonts?: boolean` as an opt‑in on `<Surface>` to keep current gating behavior when needed.
- Introduce a robust loader with normalized request keys and in‑flight coalescing; support subsets, `text=`, and matrix/range axes for Google Fonts v2.
- Extend tokens and Typography props with fluid sizing, tracking/leading, weight/aliases, and optical sizing (opsz).
- Add a shared helper to mirror font CSS vars into portalled UI (Modal, Tooltip, Snackbar, SpeedDial, Drawer, AppBar).
- Publish a core tokens stylesheet `@archway/valet/styles.css` (colors, spacing, radius, stroke, motion, initial font fallbacks) to minimize FOUC and improve first paint.

---

## Goals & Success Criteria

- Performance
  - No FOIT by default: content is visible immediately with system fallbacks.
  - First readable text paints with system fallbacks in < 1s on 3G.
  - Default `display=swap`; allow `optional|fallback` via options or heuristics.
  - Max 1–2 font files render‑blocking; others progressively load.
  - No visible layout shift from webfont swap (CLS ≈ 0 from fonts).
- Design quality
  - Full weight range (100–900) and italics across variants.
  - Optional optical sizing (opsz) where fonts support it.
  - Fluid scaling (clamp) and breakpoint tokens for precise control.
- Global support
  - Subsets (latin/latin‑ext/cyrillic/etc.) and fallback stacks per script.
  - RTL and complex‑script correctness.
- DX
  - Simple token‑driven API; typed weights/axes; safe defaults; clear migration.
  - Backward compatible with a clear migration path.

Acceptance: perf baselines met, design fidelity retained, API typed and stable.

---

## Token Model (Theme)

- Typing
  - Make `typography` keys a typed union matching Variant (`'h1'|'h2'|'h3'|'h4'|'h5'|'h6'|'body'|'subtitle'|'button'`) rather than loose `Record<string,...>`.
  - Keep all new tokens optional to avoid visual regressions.
- Sizes
  - Keep `typography[variant][breakpoint]` for deterministic sizes.
  - Add optional `typographyFluid[variant] = { min: rem, max: rem, vwFrom: px, vwTo: px }` which compiles to `clamp()`; falls back to breakpoint sizes when absent.
  - Provide optional `lineHeight[variant]` (unitless) and `letterSpacing[variant]` (em/px) tokens with sensible defaults.
- Weights
  - Add `weights[variant]` as either discrete `[300,400,500,600,700]` or range `{ min: 300, max: 800 }`.
  - Provide `weightAliases = { regular: 400, medium: 500, semibold: 600, bold: 700 }`.
- Fonts
  - Evolve `Theme['fonts']` to accept variable configs (backward‑compatible):
    - `FontRef = string | { family: string; provider?: 'google'|'local'; axes?: { wght?: number[]|[min,max]; ital?: boolean; opsz?: [min,max]|number }; subsets?: string[] }`.
  - Preserve backward‑compat: plain string works and is the default shape in the store.
- Defaults
  - Add `fontOpticalSizing: 'auto' | 'none'` token (maps to CSS `font-optical-sizing`).
  - Optional OpenType feature presets (ligatures, contextual alternates) as tokenized switches.
 - CSS variable names
   - Components should emit and/or consume the following typography variables for stable style caching:
     - `--valet-font-weight` (numeric 100..900)
     - `--valet-font-tracking` (letter-spacing length)
     - `--valet-font-leading` (unitless line-height)
   - Tokens stylesheet (`@archway/valet/styles.css`) must define sensible fallbacks for:
     - `--valet-font-heading`, `--valet-font-body`, `--valet-font-mono`, `--valet-font-button`
     - `--valet-text-color`, `--valet-bg`

Acceptance: types compile; defaults match current render; no breaking UI changes; existing themes work without providing new tokens.

Acceptance: types compile; defaults match current render; no breaking UI changes.

---

## Variable Font & Axes Support

- Axis policy
  - Primary: `wght` (100–900). Optional: `ital` boolean. Optional: `opsz`.
  - Prefer native `font-weight` for wght; use `font-variation-settings` only for axes without native CSS props (e.g., opsz) or fonts requiring explicit ranges.
- Axis mapping
  - Each Typography variant maps to a default weight; `italic` handled via style/axis; `opsz` set to `font-size` or `font-optical-sizing: auto` when supported.
- Fallbacks
  - Provide standard fallback stacks per role with metrics proximity:
    - Body: `system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Noto Sans, Apple Color Emoji, Segoe UI Emoji`.
    - Headings: body fallback with first family swapped.
    - Mono: `ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace`.
- CSS variables
  - Add `--valet-font-weight`, `--valet-font-tracking`, `--valet-font-leading` for runtime overrides.
  - Future‑friendly: additional axes can be plumbed via `font-variation-settings` without expanding class names.

Acceptance: any weight 100–900 renders correctly; italics/opsz behave; steady baselines.

---

## Font Loader & API

- Google Fonts v2 URL generation
  - Support discrete and ranged weights:
    - `:wght@200;400;700` or `:wght@100..900`.
  - `ital` matrix when enabled: `ital,wght@0,400;1,400;0,700;1,700`.
  - Subsets via `&subset=latin,latin-ext` and optional `&text=` for per‑page targeting.
  - Default `display=swap`; allow `optional|fallback` via options.
- Local variable fonts
  - Support `@font-face` creation with `font-weight: 100 900`, `font-style: normal italic`.
  - Optional metrics overrides: `ascent-override`, `descent-override`, `line-gap-override`, `size-adjust`.
  - Extended `CustomFont`:
    ```ts
    type CustomFont = {
      name: string;
      src: string;
      weight?: [number, number] | number[];
      style?: 'normal' | 'italic' | 'auto';
      metrics?: { ascent?: string; descent?: string; lineGap?: string; sizeAdjust?: string };
      format?: 'woff2'|'woff'|'ttf'|'otf';
    }
    ```
- Loading strategy
  - Essential vs Enhanced:
    - Essential: body + heading, narrow weight set (e.g., 400, 600), minimal ital.
    - Enhanced: full ranges, mono, decorative; lazy load post‑paint or on first use (IntersectionObserver of first Typography using that family/weight).
- API surface
  - `useInitialTheme(patch, extras, loaderOptions)` and `useGoogleFonts(extras, loaderOptions)` where:
    ```ts
    type LoaderOptions = {
      weights?: number[] | [number, number];
      ital?: boolean;
      opsz?: boolean | [number, number];
      subsets?: string[];
      display?: 'swap' | 'optional' | 'fallback';
      preload?: boolean;
      strategy?: 'all' | 'essential-first';
      text?: string; // optional text-targeted loading
      locale?: string; // used to derive default subsets
    }
  ```
- Caching & de‑duplication
  - Normalize request keys including `{ family, provider, wght:[...]|[min,max], ital, opsz, subsets:[...], display, text }`.
  - Track in‑flight promises keyed by the normalized request; coalesce concurrent loads; no duplicate `<link>`s.
  - Clean up on unmount or change.
  - Dedupe across both `useInitialTheme` and `useGoogleFonts` using the same key function.

Acceptance: URLs correctly express axes/subsets; essential/enhanced strategy reduces initial transfer; no duplicate loads.

---

## Fallbacks, Metrics & Stability

- CLS prevention
  - Prefer Google‑served CSS where possible (includes tuned metrics).
  - For local fonts, allow `metrics` in `CustomFont` to provide browser‑level overrides to match fallback metrics.
- Fallback stacks
  - Encode fallback stacks in Surface CSS vars:
    - `--valet-font-*-fallback` for `heading|body|mono|button`.
- font-size-adjust
  - Optional token to tune x‑height for fallback stacks: `font-size-adjust` when webfont not ready.
- Display behavior
  - Default `display=swap`; allow `optional` on slow networks (configurable, or UA‑aware heuristic).
  - Surface must not block content by default; provide an opt‑in `blockUntilFonts` for special experiences (keeps overlay/backdrop pattern behind a flag).

Acceptance: no measurable CLS from font swap; stable baseline across webfont states.

---

## Typography Component & Presets

- Props
  - `weight?: number | 'regular'|'medium'|'semibold'|'bold'` (100–900 enforced).
  - `italic?: boolean`.
  - `optical?: 'auto' | number` (→ `font-optical-sizing` or opsz axis where applicable).
  - `tracking?: number | 'tight'|'normal'|'loose'` → tokenized letter‑spacing.
  - `leading?: number | 'tight'|'normal'|'loose'` → tokenized line‑height.
  - `fluid?: boolean` to switch to clamp sizes; keep `fontSize` override.
  - Keep `family` and `fontFamily` (document `family` + weight/italic as preferred).
- Implementation
  - Use CSS vars for weight/tracking/leading to keep template strings stable and maximize style cache hits.
  - Auto‑map `optical='auto'` to `font-optical-sizing: auto`; set opsz axis explicitly when desired.
  - Prefer tokenized `line-height` over hardcoded values in components; audit existing usages (e.g., places using `font:` where `font-size:` is intended) and correct.
  - Presets
  - Add ready‑made presets (e.g., `headline-tight`, `subtitle-airy`, `code-block`) for consistent typography bundles.
 - Dev ergonomics
   - In dev builds, warn when deprecated `fontFamily` conflicts with `family/weight/italic`.
   - Clamp out‑of‑range `weight` values to [100..900] and warn in dev.

Acceptance: flexible axis control without class explosion; fluid sizing available; defaults align with existing renders.

---

## Portals & Surface Alignment

- Provide `inheritSurfaceFontVars(el: HTMLElement, root?: HTMLElement)` helper that mirrors the Surface’s `--valet-font-*` and typography‑related CSS variables onto any portal root.
- Apply to all portalled widgets (Modal, Tooltip, Snackbar, SpeedDial, Drawer) and remove duplicate per‑component copies.

Acceptance: portalled content always matches the host Surface typography.

---

## Internationalization & Subsets

- Locale‑aware subsets
  - Accept `locale` and `subsets` in loader options; derive default subsets based on locale.
- Multi‑script fallbacks
  - Per‑script fallbacks where relevant (e.g., CJK stacks) exposed via CSS vars for role families.
- RTL / complex scripts
  - Ensure Typography and layout components are direction‑safe; document usage of `dir` and script fallbacks.

Acceptance: correct glyph coverage; minimal extra payload for non‑target scripts.

---

## Styling & First Paint

- Tokens stylesheet
  - Publish `@archway/valet/styles.css` and have components consume tokens via CSS variables to reduce injection churn and avoid FOUC.
 - Content visibility
  - No content visibility gating; use `display=swap` fallbacks and tuned metrics for stability and fast first paint.

---

## Validation & Benchmarks (1.0)

- Unit tests
  - Google URL builder (weights, ital matrix, ranges, subsets, display, text) with golden snapshots.
  - Loader request key normalization, de‑duplication, and in‑flight coalescing; cleanup behaviors.
  - Typography prop parsing and token mapping; CSS var emissions; fluid clamp output.
- Visual regression
  - Playwright: typography variants, weights, italics, fluid sizes, portals; min/max width layouts.
- Performance
  - Lighthouse and WebPageTest on 3G: FCP, CLS, font transfer bytes, request count.
  - Verify “no FOIT”: content readable before webfonts; measure time to enhanced weights.
- Bundle budget
  - Ensure minimal runtime additions; no new heavy deps.
- Tokens CSS
  - Importing `@archway/valet/styles.css` must result in correct first paint colors/spacing and font fallbacks without flash.

Acceptance: tests pass; perf metrics improved or maintained; bundle size in check.

---

## Docs & Migration (1.0)

- Docs
  - “Typography 1.0” guide: tokens (fluid vs breakpoint), variable fonts, weight/italic, optical sizing, tracking/leading.
  - “Fonts & Performance” best practices: essential vs enhanced, subsets, metrics overrides, fallbacks.
  - Interactive demo: weight slider (100–900), ital toggle, fluid clamp visualization, opsz on/off.
- Migration
  - Backward compatible by default. Deprecate `fontFamily` in docs in favor of `family` + `weight/italic` but keep support.
  - Changelog notes and examples; warn on conflicting old/new props via dev‑time checks if feasible.
  - Note the removal of default font‑gating: explain swap behavior and opt‑in `blockUntilFonts`.
  - Include a short guide on first‑paint best practices with the tokens stylesheet and font‑loader options.

Acceptance: clear guidance; demos showcase excellence and performance; migration is easy.

---

## Implementation Outline (Incremental PRs for 1.0)

0) Publish `@archway/valet/styles.css` tokens and wire components to rely on tokens for first paint.
1) Remove default FOIT: ungate Surface content by default; add `blockUntilFonts?: boolean` opt‑in; keep backdrop logic but default off.
1) Token model expansion (sizes/line‑height/tracking/weights/optical), no behavior change when tokens absent.
2) Google URL builder + loader options; default to `display=swap`; add request‑key normalization and in‑flight coalescing.
3) Typography API additions (`weight`, `tracking`, `leading`, `fluid`, `optical`) with conservative defaults and CSS vars.
4) Portal font var mirroring util; apply across Modal/Tooltip/Snackbar/SpeedDial/Drawer and remove custom copies.
5) Local variable font support + optional metrics overrides (`size-adjust`, ascent/descent/line-gap overrides).
6) Essential/enhanced loading strategy; locale‑aware subsets; optional `font-size-adjust` token for fallback tuning.
7) Tests, visual baselines, perf scripts; tune based on results; audit components for `font:` vs `font-size:` mistakes and fix.
8) Docs + demos + migration notes, plus framework recipes as needed.

---

## Stretch Goals (Post‑1.0 Considerations)

- Per‑component on‑demand weight loading (code‑split font CSS via dynamic link).
- Text rendering heuristics (platform‑aware smoothing toggles) exposed as presets, not defaults.
- Automatic `opsz` mapping tables per font for higher fidelity across size ranges.

---

## Acceptance Summary

- No font‑related CLS; readable text fast; essential fonts minimal.
- Full axis control (wght/ital/opsz) with a simple, typed API.
- Stable, cache‑friendly styled engine output; portals typographically consistent.
- Strong docs, tests, and a smooth migration path.
