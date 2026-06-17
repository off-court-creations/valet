# Stack & Grid — Improve / Rewrite / Overhaul Evaluation (2026-06-17)

> Output of an adversarial multi-agent evaluation (16 agents: 4 recon → 4 design
> stances → red-team each → 3 comparative judges → synthesis). Goal: make Stack &
> Grid genuinely more intuitive **and** more powerful than MUI Stack/Grid and
> shadcn/Tailwind layout. Companion to [`verification-order.md`](verification-order.md);
> Stack/Grid are mid Tier-2 of the 1.0 re-test pass and currently `experimental`.

## Verdict

| Component | Verdict | One-line |
| --- | --- | --- |
| **Stack** | **IMPROVE** (additive) | Keep every prop name + default byte-identical; add `align`/`justify`/`gapX`/`gapY`/`divider`/responsive/`as` + `HStack`/`VStack`. ~95% of call sites compile unchanged. |
| **Grid** | **REWRITE** | Move from `repeat(N,minmax(0,1fr))` equal-columns to real `display:grid`: `minColWidth` auto-fit, responsive `columns`, `GridItem` placement, Surface-decoupled. |

**The decision that wins both:** responsive props compile to CSS `@media` rules
**inside the `styled()` template** (the engine already ships this in ~13 components),
**not** JS resolved off `surfaceStore.breakpoint`. This is SSR-stable, needs no
`<Surface>`, has zero first-paint reflow, and avoids the scalar→object crash-cliff
that sank the other three proposals (a one-char edit `gap={1}`→`gap={{xs,md}}` would
otherwise make Stack throw without a Surface).

**Hard rule for both:** never interpolate unbounded strings (`minColWidth` px,
templates, areas) into rule text — route them through inline CSS vars (`var(--…)`),
to respect the engine's 256 immortal-rule cardinality tripwire (`createStyled.ts`).

### Why not a bigger hammer

- **Stack improve, not rewrite:** all four red teams convicted the rewrite label —
  the spacing engine (`resolveSpace`/`--valet-space`), compact/density cascade, and
  styled-rule structure are all preserved, so `cssRules` tests keep passing. The only
  things that *looked* like a rewrite were proposed **default flips** (`wrap`→false,
  `overflow`→visible, `pad`→0) and `alignX` removal — policy choices, not architecture.
  We take the additive core and **refuse the flips** (they're unforced 1.0
  visual-regression risk across ~175 sites; one proposal's own "behavior-preserving
  codemod" re-added `wrap` to 175 sites, proving the flip buys only churn).
- **Grid rewrite, not improve:** moving to real `display:grid` changes the child
  contract (`GridItem` placement, `equalize` beyond Panel) and the track-resolution
  core; decoupling from Surface restructures how it mounts. The "improve" proposal
  relied on a `try/catch`-the-thrown-hook trick that is **verifiably broken**
  (`useSurface` throws via `useContext` with no sentinel, `surfaceStore.ts:184-194`).
- **Not overhaul:** the shared `useLayoutScaffold` extraction (de-dupe Stack/Grid/
  Box/Panel boilerplate) is sound but is an **internal** cleanup that can land
  independently and incrementally. Coupling it to the public-API change multiplies
  blast radius on Box/Panel for no user-facing win.

## Proposed Stack API (improve — additive props + polymorphic `as`; NO default flips)

`Responsive<T> = T | Partial<Record<Breakpoint, T>>`, `Breakpoint = 'xs'|'sm'|'md'|'lg'|'xl'`
(the **real** store keys — no `base`). Scalar → one flat declaration; map → base + one
`@media (min-width: theme.breakpoints[bp])` block per key, **into the styled rule**.
No JS resolution, no `useSurface`, SSR-stable. New export in `src/types.ts`.

Stack becomes polymorphic via the existing `createPolymorphicComponent<'div', StackOwnProps>`
(already used by Box, `Box.tsx:159`). This is a deliberate `forwardRef` contract change
(Stack is `React.FC` today) — flag it as a break, not "additive".

```ts
export interface StackOwnProps extends Presettable, SpacingProps {
  // ── UNCHANGED name + default + behavior (type-widened to Responsive, a superset) ──
  direction?: Responsive<'row'|'column'|'row-reverse'|'column-reverse'>; // default 'column'
  wrap?: boolean;                        // default UNCHANGED: direction==='row' (keep scalar)
  gap?: Responsive<Space>;               // default unit 1
  pad?: Responsive<Space>;               // default unit 1 (do NOT flip to 0)
  alignX?: 'left'|'center'|'right';      // KEPT: whole-stack auto-margin anchor (≠ align)
  compact?: boolean;                     // unchanged (CompactCtx cascade)
  density?: 'tight'|'standard'|'comfortable'; // unchanged (--valet-space reseed)
  preset?: string|string[]; sx?: Sx; className?: string;

  // ── NEW (additive, proven demand) ──
  align?: Responsive<'start'|'center'|'end'|'stretch'|'baseline'>; // align-items;
        // default = today's hardcode: row→center, column→stretch (via $align ?? hardcode)
  justify?: Responsive<'start'|'center'|'end'|'between'|'around'|'evenly'>; // justify-content
  gapX?: Responsive<Space>;              // column-gap (overrides gap on its axis)
  gapY?: Responsive<Space>;              // row-gap
  divider?: React.ReactNode;             // interleaved BETWEEN children (n-1); orientation auto-flips
  scroll?: 'auto-y'|'x'|'both'|'visible';// public name for --valet-stack-ov-y; default 'auto-y' (unchanged)
  as?: React.ElementType;                // polymorphic root, default 'div'
}
export type StackProps<E extends React.ElementType='div'> = PolymorphicProps<E, StackOwnProps>;

export const HStack; // direction='row', align defaults 'center'  (157:3 row:column ratio justifies it)
export const VStack; // direction='column'
```

Key behaviors: `align`/`justify` map to flex tokens baked into the cached class
(bounded cardinality), **erasing the 92 verified `sx={{alignItems:'center'}}` blocks**.
The `align` default MUST emit byte-identical CSS for the no-`align` case (`$align ?? ($dir==='row'?'center':'stretch')`) — pin with an exact-string `cssRules` test.
`gapX`/`gapY` → `column-gap`/`row-gap` through `resolveSpace` (compact still zeros,
density still rescales). `divider` via `React.Children.toArray().filter(Boolean)` (flat
children only; dev-warn `divider`+`as='ul'`). Restrict `Responsive<>` to proven-demand
props (`direction`/`gap`/`align`/`gapX`/`gapY`/`justify`); keep `wrap` scalar.

```tsx
// SIMPLE — existing code compiles, emits identical CSS
<Stack gap={1}><A/><B/></Stack>
<HStack gap={1}><Avatar/><Typography>Ben</Typography></HStack>   // zero-prop centered row

// Toolbar that needed the {alignItems,flexWrap,justifyContent} triad:
<Stack direction='row' align='center' justify='between' wrap gap={1}>…</Stack>

// POWERFUL — responsive direction, ZERO Surface dependency, correct on first SSR paint:
<Stack direction={{ xs:'column', md:'row' }} gap={{ xs:1, md:2 }} align='center'>…</Stack>
```

## Proposed Grid API (rewrite — real CSS Grid, @media responsive, Surface-decoupled)

```ts
export interface GridOwnProps extends Presettable, Pick<SpacingProps,'gap'|'pad'|'compact'|'density'> {
  columns?: Responsive<number>;          // default 2 → repeat(N, minmax(0,1fr)); now accepts a bp map
  gap?: Responsive<Space>;               // default unit 2 (role default unchanged)
  pad?: Responsive<Space>;               // default unit 1
  compact?: boolean; density?: 'tight'|'standard'|'comfortable'; // de-dupe redundant double-decl

  // ── NEW headline ──
  minColWidth?: number|string;           // auto-fit: repeat(auto-{fit|fill}, minmax(min(<w>,100%),1fr))
        // IGNORES columns. PURE CSS, no Surface, no breakpoints. number→px.
        // ROUTED THROUGH inline var --valet-grid-min — never interpolated into rule text.
  autoFlow?: 'fit'|'fill';               // auto-fit (collapse empty tracks, default) vs auto-fill (stable N-up)
  gapX?: Responsive<Space>; gapY?: Responsive<Space>;
  align?: Responsive<'start'|'center'|'end'|'stretch'>;        // align-items, default 'stretch'
  justifyItems?: Responsive<'start'|'center'|'end'|'stretch'>; // default 'stretch'
  equalize?: boolean;                    // RENAMED from normalizeRowHeights (hard rename); default true;
        // broadened beyond Panel via a public --valet-cell-stretch contract (Box/Card read it)
  as?: React.ElementType;                // default 'div'
  // adaptive REMOVED (hard rename): keyed off Surface aspect-ratio (wrong signal);
  // replaced by responsive columns + minColWidth (breakpoint-free).
}
export interface GridItemOwnProps extends Presettable {
  span?: Responsive<number>;             // grid-column: span N (small enumerable ints → safe in rule text)
  rowSpan?: Responsive<number>;          // grid-row: span N
  colStart?: Responsive<number>;         // grid-column-start
  as?: React.ElementType; sx?: Sx; preset?: string|string[]; className?: string;
}
```

Key behaviors: **Surface decoupling via `@media` + context-peek, never try/catch** —
responsive props compile to `@media`, so Grid needs no `useSurface` for the responsive
case; where breakpoint-aware JS is still wanted, read `useContext(SurfaceCtx)` and fall
back to base when null (the exact pattern at `createStyled.ts:207`). Track priority:
`minColWidth` (auto-fit) > `columns` (@media steps). `minColWidth`/`gap`/`equalize` still
flow through `resolveSpace`/`--valet-space`. `GridItem` carries spans on the child;
bare children stay valid 1×1; dev-warn span-like props on a non-`GridItem` child.
**Deferred to a demand-gated wave** (zero verified repo demand): `areas`,
`templateColumns`, `templateRows`, `flow` — and when built, route arbitrary strings
through inline vars.

```tsx
<Grid columns={3} gap={2}>{cards}</Grid>                              // SIMPLE — unchanged
<Grid minColWidth={220} gap={2}>{cards.map(c=><Panel…/>)}</Grid>      // HEADLINE — auto-fit, no breakpoints, no Surface
<Grid columns={{ xs:1, sm:2, lg:4 }} gap={2}>{cards}</Grid>          // responsive columns, SSR-stable @media
<Grid columns={12} gap={1}>                                          // per-item span, responsive
  <GridItem span={{ xs:12, md:8 }}><Editor/></GridItem>
  <GridItem span={{ xs:12, md:4 }}><Preview/></GridItem>
</Grid>
```

## How it beats the competition

**vs MUI:** gap-only spacing (no margin footgun, no `useFlexGap`) + `gapX`/`gapY`;
responsive → pure CSS `@media` (SSR-correct, zero reflow); **real** `display:grid` with
`GridItem` span/rowSpan/colStart + `minColWidth` auto-fit (MUI's "Grid" is flexbox and
can't do row-span/areas without raw CSS); `minColWidth={220}` vs a `size={{xs,md}}` object
on every child; **one stable API** — no `GridLegacy`/`Grid2`/`size` migration tax (MUI
shipped two breaking Grid rewrites); smart `align` default keeps the simple case zero-config.

**vs shadcn/Tailwind:** semantic, greppable, lintable primitives (shadcn ships no layout
component); spacing is token + density + compact aware (a `density='tight'`/`compact`
ancestor rescales the whole subtree — Tailwind's `gap-4` is a frozen literal);
`minColWidth={220}` vs the hostile `grid-cols-[repeat(auto-fit,minmax(220px,1fr))]`;
responsive `direction={{xs,md}}` as cheap as `md:flex-row` but type-checked;
`HStack` defaults `align='center'` (shorter than `<div className='flex items-center gap-2'>`);
`GridItem span` is responsive + type-enforced.

## Phased plan (each wave shippable; preserves the both-gates stable rule)

0. **Infra, non-breaking:** add `Responsive<T>` to `src/types.ts` + a compile helper
   emitting base + one `@media` block per breakpoint key into the `styled()` template
   (reads `theme.breakpoints`; `xs:0` emits no media). `cssRules` test for scalar vs map.
   Nothing consumes it yet; stays green.
1. **Stack improve (additive, zero migration):** `align`/`justify`/`gapX`/`gapY`/`divider`;
   widen `direction`/`gap`/`align`/`gapX`/`gapY` to `Responsive` (NOT `wrap`); `align` via
   `$align ?? hardcode` + byte-identical `cssRules` test; convert to
   `createPolymorphicComponent` for `as` (call out the `forwardRef` change); add
   `HStack`/`VStack`; promote `scroll` (keep default). **No default flips; keep `alignX`.**
2. **Grid rewrite core (the value):** real `display:grid`; `minColWidth` auto-fit (via
   `--valet-grid-min`) + `autoFlow`; responsive `columns` via `@media`; remove `adaptive`
   (codemod `adaptive`+`columns={N}` → `columns={{xs:1,md:N}}`); rename
   `normalizeRowHeights`→`equalize` (broaden beyond Panel via `--valet-cell-stretch`,
   include Box/Card edits here); de-dupe density/compact; add `gapX`/`gapY`/`align`/
   `justifyItems`; remove mandatory `useSurface`; drop `SurfaceCtx` wrapper from scalar tests.
3. **GridItem + doc sweep:** ship `GridItem` (span/rowSpan/colStart) with a dev-warn for
   span props on non-`GridItem` children; migrate the ~110 doc `sx`-flex blocks to
   `align`/`justify`/`HStack`; steer docs to `minColWidth`/responsive `columns`.
4. **Deferred, demand-gated:** named `areas`/`templateColumns`/`templateRows`/`flow` —
   only if Ben's visual pass surfaces need; route all arbitrary strings through inline vars.
- **Parallel/independent (optional):** extract `useLayoutScaffold` across
  Stack/Grid/Box/Panel — pure internal refactor, not coupled to the API waves.

## Risks

- `align` default-expression change MUST emit byte-identical CSS for the no-`align` case
  or `cssRules` snapshots drift → dedicated exact-string test before merge.
- `React.FC`→`createPolymorphicComponent` is a `forwardRef` contract change — treat as a
  deliberate documented break in Wave 1, not additive.
- Responsive-map `@media` mints one immortal cached class per distinct breakpoint-map;
  bounded for enumerable values, but binding a map to **continuous slider state** (a
  GridDemo/ThemeEngine playground) could approach the 256 tripwire → restrict
  `Responsive<>` to proven-demand props, monitor `warnOnce`, document the caveat.
- `minColWidth` number=px is an intentional inconsistency with `gap`/`pad` (number=unit)
  → route through `--valet-grid-min`, prefer `'220px'` in docs.
- `equalize` broadening edits Box AND Card (`--valet-cell-stretch`) → scope explicitly in
  Wave 2, don't smuggle it in.
- `divider` breaks on Fragment children; `divider`+`as='ul'` → invalid HTML → toArray +
  dev-warn + document flat-children requirement.
- `autoFlow='fit'` collapses empty tracks (partial last row stretches) — surprise vs
  stable N-up; document loudly; reconsider whether `'fill'` should be the default.
- Removing `adaptive` + renaming `normalizeRowHeights` are breaking (sanctioned by
  `experimental` status) — need a codemod + repo sweep (~18 `adaptive` sites, ~0
  `normalizeRowHeights`); Ben's visual pass is the backstop for the columns-keyed-off-
  breakpoint vs old-portrait-aspect-ratio trigger difference.

## Open questions for Ben

1. **`alignX`:** keep (whole-stack auto-margin block-centering, still used on Tabs/Panel)
   or hard-rename/remove per the "hard renames only" policy? It's near-dead on Stack and a
   confusion trap next to the new `align`. *Recommendation: keep but document the
   distinction sharply.*
2. **`autoFlow` default:** `'fit'` (matches Chakra/Mantine; last row stretches) vs `'fill'`
   (stable N-up)? Needs your visual judgment on the most-expected card-grid behavior.
3. **Doc sweep (~110 `sx`-flex blocks):** mandatory in Wave 3 (proves the ergonomics in
   valet's own docs) or opportunistic (less churn)?
4. **Sugar scope:** `HStack`/`VStack` only, or also `Center`/`Cluster`/`Spacer`? Real demand
   exists (92 `alignItems:center` + toolbar push-apart). *Recommendation: HStack/VStack in
   Wave 1; defer the rest to a demand-gated fast-follow.*
5. **`grow` prop / `Spacer`:** without one, toolbars still drop to `sx={{flexGrow:1}}` — the
   exact escape we claim to eliminate. Wave 1 or fast-follow?
6. **`useLayoutScaffold`:** in scope for 1.0 at all, or strictly a later internal cleanup
   (it touches Box/Panel)? *Recommendation: decouple from the API waves entirely.*

## Appendix — panel results

Proposal scores (red-team, 0-10): clean-slate-dx **7**, conservative-improve **6.5**,
responsive-power **6**, unify-layout **6**.

Judge verdicts (Stack / Grid): **DX** improve / rewrite · **POWER** improve / rewrite ·
**FIT-RISK** improve / improve. Consensus: Stack improve (3/3), Grid rewrite (2/3) — the
synthesis took rewrite on the strength of the real-`display:grid` capability gain, with
FIT-RISK's "improve" honored by making the rewrite Surface-decoupled and `@media`-based
(its actual objection was the JS-resolution reflow, which this design avoids).
