# valet SSR Excellence – 1.0 Deliverables & Guide

This guide defines the 1.0 SSR contract for valet: SSR‑safe by default, optimized first paint (no FOIT), clean hydration, Edge/streaming‑ready, and a minimal RSC‑friendly primitives subset. It includes concrete deliverables, implementation steps, and validation.

---

## 1.0 Goals (Definition of Done)

- No server crashes: never touch `document`/`window` during server render.
- Deterministic class names across server and client; no hydration drift.
- Predictable client CSS injection order; zero duplicate rules.
- Readable text paints immediately (no FOIT) with `display=swap` defaults.
- Portals (Modal, Tooltip, Drawer, etc.) inherit the Surface’s font variables post‑hydration.
- Edge/Streaming ready (ESM, no Node‑only APIs).
- Minimal RSC‑friendly primitives subset available at 1.0.

Deliverables are detailed below and all are required for 1.0.

---

## Styled Engine (createStyled) – SSR Safety (1.0)

The `createStyled` utility powers valet’s CSS injection and hashing. For 1.0 it MUST:

1) Avoid `document` at module scope
- Do not create a `<style>` tag or access `document.head` during module evaluation.
- Defer style element creation to the first client render.

2) Deterministic hashing
- Hash only the normalized CSS text to derive the class name. The same input must yield the same class on server and client.
- Avoid environment‑dependent inputs (e.g., random IDs, timestamps).

3) Client‑only injection
- On the client, maintain a single global stylesheet and insert new rules once per unique normalized block.
- On the server, inject nothing — compute class names for markup only. Hydration reuses the same classes and the client injects any missing rules.

4) Ordered and stable injection
- Append rules to the global sheet in declaration order; avoid re‑insertion.
- Keep a Set/Map of injected IDs to guard against duplicates during suspense/hydration replays.

5) Transient props filtering
- Props prefixed with `$` must never reach the DOM. Filter them out before element creation so SSR output matches the client.

---

## Hooks: Effects and Insertion (1.0)

- Use `useInsertionEffect` (or `useLayoutEffect`) for client‑only DOM insertions (style/tag creation). React suppresses layout effects on the server.
- Avoid conditional hook order discrepancies. If a hook is client‑only, gate it with an early environment check, not conditional rendering.

Example approach:

```tsx
// Pseudocode inside createStyled’s component body
const isClient = typeof document !== 'undefined';
useInsertionEffect(() => {
  if (!isClient) return;
  ensureGlobalSheet();
  if (!injected.has(ruleId)) sheet.insertRule(css);
}, [isClient, ruleId, css]);
```

---

## Fonts and SSR (1.0)

### Default behavior (no FOIT)
- Use `display=swap` by default. Let system fallbacks render first; swap when webfonts are ready.
- Do not gate content rendering on font status by default. Reserve gating for special flows only via `blockUntilFonts`.

### Critical font path
- Provide an SSR utility to emit preconnect + preload tags for essential weights/styles:
  - `<link rel="preconnect" href="https://fonts.googleapis.com">`
  - `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`
  - `<link rel="preload" as="style" href="...css2?family=Family:wght@...&display=swap" crossorigin>`
- Keep the essential set small (e.g., heading/body 400/600). Load enhanced ranges on the client.

### Client loader
- Normalize request keys (family, provider, `wght` range(s), `ital` matrix, `opsz`, `subsets`, `display`, `text`). Coalesce in‑flight requests.
- Never insert duplicate `<link>` elements; clean up when options materially change.

### CLS and metrics
- For local fonts, expose optional metrics overrides: `ascent-override`, `descent-override`, `line-gap-override`, `size-adjust`.
- Tokenize `font-size-adjust` per role (heading/body/mono) to keep fallback x‑height consistent pre‑swap.

---

## Surface and Portals (1.0)

Surfaces expose font families and typography tokens via CSS variables. Portalled UI renders outside the Surface DOM, so mirror variables post‑hydration.

### Required helper

```
inheritSurfaceFontVars(portalRoot: HTMLElement, surfaceRoot?: HTMLElement)
```

- Locate the active Surface root (via context store) when `surfaceRoot` is not provided.
- Copy these variables to `portalRoot.style`:
  - `--valet-font-heading`, `--valet-font-body`, `--valet-font-mono`, `--valet-font-button`
  - Any typography runtime vars: `--valet-font-weight`, `--valet-font-tracking`, `--valet-font-leading`
- Call on mount of Modal, Tooltip, Drawer, Snackbar, SpeedDial, AppBar; re‑apply if theme changes.

Server note: this helper is a client‑only concern; it’s a no‑op during SSR.

---

## Content Gating Policy (1.0)

- Default: do not gate. Surfaces render immediately with system fallbacks.
- Opt‑in: `<Surface blockUntilFonts>` may show a transient overlay if an experience requires it.
- This preserves fast FCP while allowing explicit experiences to use a gate.

---

## Theme Variables on SSR (1.0)

- Apply theme colors and typography fallbacks as inline styles or root CSS variables on the Surface container (`style={ { '--valet-font-body': '...', color: '...' } }`).
- This ensures server output matches initial client render prior to any dynamic font loading.

---

## Framework Notes (1.0)

### Next.js / RSC
- Avoid `document`/`window` in server components. Wrap any client‑only logic in a client component boundary ("use client").
- Ensure `createStyled` runs inside client components for DOM insertion; hashing may run anywhere as it’s pure.
- Provide `ThemeScript` and a cookie‑driven `data-theme` on `<html>` to avoid theme flash.

### Node versions
- Node ≥ 18 (target 20+) is required. Ensure `process.env` checks are not used to branch hashing logic.

---

## RSC Strategy (1.0)

Explicit contract for Next.js App Router and other RSC-capable stacks:

- Two modes of RSC compatibility:
  - Pure RSC: components render deterministic markup with only classes/CSS variables and no hooks/effects. Examples: Divider, TypographyLite, Box/Stack/Grid variants without measurement.
  - RSC Shell + Client Island: a server component renders structure/ARIA and stable markup; a small `'use client'` leaf handles behavior (events, portals, measurement). Props remain serializable; visuals rely on CSS variables.

- 1.0 deliverable: every component in valet is usable in RSC apps via one of the two modes above.
  - Publish a minimal pure subset under `@archway/valet/primitives` (server components).
  - For interactive widgets, expose an RSC shell export that composes a small client subcomponent under `@archway/valet/react`.
  - Only label a component “client-only” when no meaningful server shell exists (rare).

This ensures all components participate in RSC pages with clean hydration and minimal client code.

---

## Common Pitfalls and Fixes (1.0)

- Pitfall: touching `document` at module scope in `createStyled`. Fix: lazy initialize the stylesheet inside a client‑only effect.
- Pitfall: random suffixes in class names. Fix: class names must be hash‑only of normalized CSS.
- Pitfall: gating content on font readiness by default. Fix: swap defaults to no‑gate; keep `blockUntilFonts` opt‑in.
- Pitfall: portal typography mismatch. Fix: mirror Surface font vars to portal root on mount.

---

## 1.0 Migration Checklist

- [ ] Prep: package `exports` include `./styles.css`, `./primitives`, `./react`, `./ssr`; ESM-first with `sideEffects: false`.
- [ ] Prep: scaffolds exist (`src/ssr/ThemeScript.tsx`, `src/ssr/getFontLinkHints.ts`, `src/ssr/inheritSurfaceFontVars.ts`, root `styles.css`).
- [ ] Prep: DOM audit complete; no top‑level `document`/`window`; client‑only effects gate DOM usage (notably `createStyled`, `fontLoader`).
- [ ] `createStyled` guarded for SSR; no top‑level DOM access.
- [ ] Deterministic class hashing verified in SSR + hydration.
- [ ] Surface default shows content immediately; `blockUntilFonts` documented as opt‑in.
- [ ] Font loader uses `display=swap` and normalized keys; no duplicate links.
- [ ] Optional SSR preconnect/preloads for essentials documented and (optionally) implemented.
- [ ] Portals adopt `inheritSurfaceFontVars`.
- [ ] Optional `font-size-adjust` tokens available for fallbacks.

RSC & tokens for 1.0:
- [ ] Publish `@archway/valet/styles.css` declaring core tokens as CSS variables (colors, spacing, radius, stroke, motion, initial font fallbacks).
- [ ] Provide `@archway/valet/ThemeScript` and framework recipes (Next/Remix) to set `data-theme` before hydration.
- [ ] Ship a minimal RSC‑friendly primitives subset under `@archway/valet/primitives` (no hooks/effects): `Divider`, `TypographyLite` (no measurements), `Box`, `Stack`, `Grid`.
- [ ] Interactive components live under `@archway/valet/react` and are `'use client'`.
- [ ] For every interactive component, add an RSC shell export that renders stable structure/ARIA and composes a minimal client island for behavior.

---

## Testing & Validation (1.0)

- Server render a page that uses multiple styled components and Typography. Confirm:
  - No server errors; HTML contains stable class names.
  - Hydration completes without warnings about mismatched markup or style ordering.
- Load on a throttled 3G profile:
  - FCP is not blocked by font loading.
  - CLS from font swap is near‑zero.
- Verify portals visually inherit fonts/styles on open (Modal, Tooltip, Drawer).

---

## Code Snippets & Recipes (1.0)

### ThemeScript

Use this client script to set `data-theme` on `<html>` before hydration and avoid theme flash. Place it in `<head>` as early as possible.

```tsx
// src/ssr/ThemeScript.tsx
export function ThemeScript() {
  return (
    <script
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(()=>{try{var d=document.documentElement;var t=localStorage.getItem('valet-theme');if(!t&&'matchMedia'in window){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}if(t){d.dataset.theme=t;}}catch(e){}})();`,
      }}
    />
  );
}
```

Next.js App Router usage (server component):

```tsx
// app/layout.tsx
import '@archway/valet/styles.css';
import { ThemeScript } from '@archway/valet/ssr';
import { cookies } from 'next/headers';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const cookie = cookies().get('valet-theme')?.value;
  const resolved = cookie ?? 'light';
  return (
    <html lang="en" data-theme={resolved} suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body>{children}</body>
    </html>
  );
}
```

Remix usage (root document):

```tsx
// root.tsx
import stylesHref from '@archway/valet/styles.css?url';
import { ThemeScript } from '@archway/valet/ssr';

export const links = () => [
  { rel: 'stylesheet', href: stylesHref },
];

export default function App() {
  const theme = useLoaderData<typeof loader>().theme; // from cookie
  return (
    <html lang="en" data-theme={theme} suppressHydrationWarning>
      <head><ThemeScript /></head>
      <body><Outlet /></body>
    </html>
  );
}
```

### Font link hints (SSR)

Generate preconnect/preload `<link>`s for an essential font set.

```ts
// src/ssr/getFontLinkHints.ts
type FontHint = { rel: 'preconnect'|'preload'; href: string; as?: 'style'|'font'; crossOrigin?: 'anonymous' };

type EssentialFont = {
  family: string; // e.g., 'Inter'
  weights: number[] | [number, number];
  ital?: boolean;
  subsets?: string[]; // e.g., ['latin','latin-ext']
  display?: 'swap'|'optional'|'fallback';
};

export function getFontLinkHints(fonts: EssentialFont[]): FontHint[] {
  if (!fonts.length) return [];
  const families = fonts.map((f) => {
    const fam = f.family.trim().replace(/\s+/g, '+');
    const w = Array.isArray(f.weights)
      ? Array.isArray(f.weights) && (f.weights as number[]).length
        ? `:wght@${(f.weights as number[]).join(';')}`
        : ''
      : `:wght@${(f.weights as [number, number])[0]}..${(f.weights as [number, number])[1]}`;
    const ital = f.ital ? ';ital@0;1' : '';
    return `family=${fam}${ital || w}`;
  });
  const params = [families.join('&')];
  const subsets = Array.from(
    new Set(fonts.flatMap((f) => f.subsets ?? [])),
  );
  if (subsets.length) params.push(`subset=${subsets.join(',')}`);
  const display = fonts.find((f) => f.display)?.display ?? 'swap';
  params.push(`display=${display}`);
  const href = `https://fonts.googleapis.com/css2?${params.join('&')}`;
  return [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
    { rel: 'preload', href, as: 'style', crossOrigin: 'anonymous' },
  ];
}
```

### Portal font vars mirroring

```ts
// src/ssr/inheritSurfaceFontVars.ts
export function inheritSurfaceFontVars(portalRoot: HTMLElement, surfaceRoot?: HTMLElement) {
  try {
    const root = surfaceRoot ?? document.querySelector<HTMLElement>('[data-valet-surface="root"]') ?? document.body;
    if (!root || !portalRoot) return;
    const cs = getComputedStyle(root);
    const names = Array.from(cs)
      .filter((n) => n.startsWith('--valet-font-') || n.startsWith('--valet-font-') || n.startsWith('--valet-text-'));
    for (const n of names) {
      portalRoot.style.setProperty(n, cs.getPropertyValue(n));
    }
  } catch (e) {
    // no-op: client only
  }
}
```

Call on mount of Modal/Tooltip/Drawer/Snackbar/SpeedDial/AppBar; reapply on theme change.

### Tokens stylesheet skeleton

```css
/* @archway/valet/styles.css */
:root {
  /* Colors */
  --valet-bg: #ffffff;
  --valet-text-color: #0a0a0a;
  --valet-primary: #608066;
  --valet-primaryText: #f7f7f7;

  /* Spacing / geometry */
  --valet-space: 0.5rem; /* base unit */
  --valet-radius: calc(var(--valet-space) * 0.75);
  --valet-stroke: calc(var(--valet-space) * 0.125);

  /* Motion */
  --valet-motion-xshort: 100ms;
  --valet-ease-standard: cubic-bezier(0.2,0.7,0.1,1);

  /* Font families (fallbacks only; webfonts swap in later) */
  --valet-font-heading: 'system-ui', sans-serif;
  --valet-font-body: 'system-ui', sans-serif;
  --valet-font-mono: 'ui-monospace', monospace;
  --valet-font-button: 'system-ui', sans-serif;
}

[data-theme="dark"] {
  --valet-bg: #222222;
  --valet-text-color: #f7f7f7;
}

@media (prefers-reduced-motion: reduce) {
  :root { --valet-motion-xshort: 0ms; }
}
```

Import this file once in your app’s root. Components should reference variables, not hard-coded values.

---

## Packaging & Build Contract (1.0)

- ESM-first: publish ESM with appropriate `exports` and `types`. Avoid Node built-ins.
- `package.json` recommendations:

```json
{
  "type": "module",
  "sideEffects": false,
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./styles.css": "./styles.css",
    "./primitives": {
      "types": "./dist/primitives.d.ts",
      "import": "./dist/primitives.js"
    },
    "./react": {
      "types": "./dist/react.d.ts",
      "import": "./dist/react.js"
    },
    "./ssr": {
      "types": "./dist/ssr.d.ts",
      "import": "./dist/ssr.js"
    }
  },
  "engines": { "node": ">=18" }
}
```

Ensure tree-shaking by avoiding side effects in entry modules.

---

## Serializable Props for RSC (1.0)

- Only pass JSON-serializable props across server→client boundaries.
- Avoid functions, class instances, DOM nodes, Symbols.
- For rich content, prefer plain strings, arrays/objects of primitives, or pre-rendered static children.
- Keep client islands’ props minimal; rely on CSS variables and ARIA for structure and semantics.

## Implementation Plan (1.0)

0) Prep (scaffolds, exports, audits)
- Package exports: add explicit entries for `./styles.css`, `./primitives`, `./react`, and `./ssr` as described in Packaging & Build. Keep ESM‑first, `sideEffects: false`, and Node ≥ 18 engines.
- Scaffolds: create empty modules so integrators can wire imports early:
  - `src/ssr/ThemeScript.tsx`
  - `src/ssr/getFontLinkHints.ts`
  - `src/ssr/inheritSurfaceFontVars.ts`
  - `styles.css` (root) with initial tokens skeleton
- RSC split: confirm initial pure server subset (`Divider`, `TypographyLite` (no measurements), `Box`, `Stack`, `Grid`) and keep interactive widgets under `@archway/valet/react`.
- DOM audit: grep for top‑level `document`/`window`/`useLayoutEffect` and gate all DOM access to client paths. Priorities: `src/css/createStyled.ts` and `src/helpers/fontLoader.ts`.

1) Styled engine SSR fix
- Move `document`/`style` creation into a client‑only initializer invoked from `useInsertionEffect` the first time a styled component mounts.
- Keep a global registry of injected rules keyed by normalized CSS hash.
- Ensure hash function’s inputs are normalized CSS only.

2) Surface defaults
- Remove default font gating; add `blockUntilFonts?: boolean` (default false) to `<Surface>` with current overlay behavior.
- Keep color and font family CSS vars on Surface root to ensure correct first paint.

3) Fonts
- Implement normalized font request keys + in‑flight coalescing in the loader.
- Add SSR helper `getFontLinkHints(config)` to generate preconnect/preload `<link>` tags for essential weights; document usage in Next/Remix.
- Keep `display=swap`; enable `subsets`/`text=` when provided.

4) Tokens CSS
- Publish `@archway/valet/styles.css` with CSS variables for theme tokens (colors, spacing, radius, stroke, motion) and sensible font fallbacks.
- Ensure components resolve to variables where possible to reduce runtime style churn and FOUC.

5) ThemeScript + cookies
- Add `ThemeScript` component to set `data-theme` as early as possible.
- Provide docs/snippets for Next/Remix to set `data-theme` from cookies in the server HTML and include `ThemeScript` before hydration.

6) Portals alignment
- Implement `inheritSurfaceFontVars(portalRoot, surfaceRoot?)` and call from Modal/Tooltip/Drawer/Snackbar/SpeedDial/AppBar on mount and when theme changes.

7) RSC‑friendly primitives
- Create `@archway/valet/primitives` export with hook‑free components relying purely on className/CSS vars.
- Document usage in server components; keep interactive components under `@archway/valet/react`.

8) RSC shells for interactive components
- For each interactive component (Modal, Tooltip, Drawer, Tabs, etc.), add a server wrapper that renders deterministic markup and imports a leaf client subcomponent for behavior/portals.
- Ensure props are serializable; keep the client island small; rely on CSS vars for visuals.

9) Tests & CI
- Add SSR render smoke test and hydration test to CI.
- Add perf tests (Lighthouse CI) for FCP/CLS on throttled profiles.
- Visual tests for portals inheriting Surface fonts.
