// ─────────────────────────────────────────────────────────────
// src/components/layout/Grid.tsx  | valet
// Two-dimensional CSS-grid container. 1.0 rewrite (first-class):
//   • real `display:grid` (was repeat(N,minmax(0,1fr)) equal-columns only)
//   • `minColWidth` auto-fit/fill card grids — pure CSS, no breakpoints,
//     routed through the --valet-grid-min inline var (immortal-rule safe)
//   • responsive `columns`/`gap`/`pad`/`gapX`/`gapY`/`align`/`justifyItems`
//     compile to @media in the styled rule — no JS, NO <Surface> dependency
//   • `GridItem` for per-cell placement (span/rowSpan/colStart), responsive
//   • `equalize` (renamed from normalizeRowHeights) fills children to their cell
//   • polymorphic `as`
//
// The old `adaptive` (collapsed to 1 column off the Surface aspect-ratio — a
// wrong signal) is GONE; use responsive `columns` or `minColWidth` instead.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';
import type { Presettable, SpacingProps, Space, Sx, Responsive } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';
import { responsive } from '../../utils/responsive';
import { densityScale } from '../../system/densityScale';
import { CompactCtx, useCompact } from '../../system/compactContext';
import {
  createPolymorphicComponent,
  type PolymorphicProps,
  type PolymorphicRef,
} from '../../system/polymorphic';

/*───────────────────────────────────────────────────────────*/
/** Grid box-alignment keyword (CSS grid uses bare start/end, not flex-start). */
export type GridAlign = 'start' | 'center' | 'end' | 'stretch';

const BP_KEYS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
/** The base (smallest-breakpoint) value of a Responsive — used for the
 *  single-column relax decision. */
function baseValue<T>(v: Responsive<T> | undefined): T | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'object' && !Array.isArray(v)) {
    const m = v as Record<string, T>;
    for (const k of BP_KEYS) if (m[k] !== undefined) return m[k];
    return undefined;
  }
  return v;
}

/*───────────────────────────────────────────────────────────*/
export interface GridOwnProps extends Presettable, Pick<SpacingProps, 'compact' | 'density'> {
  /** Equal-width column count → `repeat(N, minmax(0,1fr))`. Default 2. Responsive.
   *  Ignored when `minColWidth` is set. */
  columns?: Responsive<number>;
  /** Inter-cell gap as units or CSS length. Default 2 units (card-grid gutter). Responsive. */
  gap?: Responsive<Space>;
  /** Column-axis gap; overrides `gap` horizontally. Responsive. */
  gapX?: Responsive<Space>;
  /** Row-axis gap; overrides `gap` vertically. Responsive. */
  gapY?: Responsive<Space>;
  /** Container padding as units or CSS length. Default 1 unit. Responsive. */
  pad?: Responsive<Space>;
  /**
   * Auto-responsive track width: lay out as many equal columns as fit, each at
   * least this wide — `repeat(auto-{fit|fill}, minmax(min(<minColWidth>,100%),1fr))`.
   * Pure CSS, no breakpoints, no Surface. **Overrides `columns`.** A number is px.
   */
  minColWidth?: number | string;
  /** With `minColWidth`: `'fill'` (default) keeps a stable column count (empty
   *  trailing tracks); `'fit'` collapses empty tracks so the last row stretches. */
  autoFlow?: 'fit' | 'fill';
  /** Cross-axis (block) alignment of items in their cell (`align-items`). Default `stretch`. Responsive. */
  align?: Responsive<GridAlign>;
  /** Inline-axis alignment of items in their cell (`justify-items`). Default `stretch`. Responsive. */
  justifyItems?: Responsive<GridAlign>;
  /** Stretch children to fill their cell (width + height) so a grid of cards is
   *  uniform without per-card `fullWidth`. Default `true`. (Renamed from
   *  `normalizeRowHeights`.) */
  equalize?: boolean;
  /** Inline styles (with CSS var support). */
  sx?: Sx;
  /** Override the machine-readable component marker (composites self-identify). */
  'data-valet-component'?: string;
}

export type GridProps<E extends React.ElementType = 'div'> = PolymorphicProps<E, GridOwnProps>;

/*───────────────────────────────────────────────────────────*/
const Root = styled('div')<{
  $template: string;
  $gap: string;
  $pad: string;
  $align: string;
  $justify: string;
  $equalize: string;
  $relax: string;
}>`
  display: grid;
  ${({ $template }) => $template}
  ${({ $gap }) => $gap}
  ${({ $pad }) => $pad}
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;

  ${({ $align }) => $align}
  ${({ $justify }) => $justify}

  /* Equalize: ask children (Panel/Box/Card) to fill their cell in both axes via
     CSS vars. --valet-panel-width equalizes widths; --valet-panel-align-self
     equalizes heights; --valet-cell-stretch is the generic opt-in. Non-consuming
     children ignore the vars; standalone Panels (no Grid) keep their default. */
  ${({ $equalize }) => $equalize}

  /* When the grid is a single column, relax child overflow/height so content
     stacks naturally and the page scrolls instead of nesting scrollers (iOS). */
  ${({ $relax }) => $relax}
`;

/*───────────────────────────────────────────────────────────*/
const GridImpl = <E extends React.ElementType = 'div'>(
  props: PolymorphicProps<E, GridOwnProps>,
  ref: PolymorphicRef<E>,
) => {
  const {
    preset: p,
    className,
    style,
    columns,
    gap,
    gapX,
    gapY,
    pad,
    minColWidth,
    autoFlow = 'fill',
    align,
    justifyItems,
    equalize = true,
    compact,
    density,
    sx,
    children,
    'data-valet-component': marker = 'Grid',
    ...rest
  } = props as unknown as GridOwnProps & { as?: E } & {
    style?: React.CSSProperties;
    children?: React.ReactNode;
  } & Record<string, unknown>;

  const { theme } = useTheme();
  const effectiveCompact = useCompact(compact);

  /* Track resolution: minColWidth (auto-fit/fill, breakpoint-free) takes
     priority over responsive columns. minColWidth rides an inline var so the
     px/length never enters immortal rule text. */
  const usingAuto = minColWidth != null;
  const minVar =
    minColWidth == null
      ? undefined
      : typeof minColWidth === 'number'
        ? `${minColWidth}px`
        : minColWidth;
  const templateCss = usingAuto
    ? `grid-template-columns: repeat(auto-${autoFlow === 'fit' ? 'fit' : 'fill'}, minmax(min(var(--valet-grid-min, 16rem), 100%), 1fr));`
    : responsive(columns, theme, (n) => `grid-template-columns: repeat(${n}, minmax(0, 1fr));`, 2);

  const gapCss =
    responsive(gap, theme, (g) => `gap:${resolveSpace(g, theme, effectiveCompact)};`, 2) +
    (gapX !== undefined
      ? responsive(gapX, theme, (g) => `column-gap:${resolveSpace(g, theme, effectiveCompact)};`)
      : '') +
    (gapY !== undefined
      ? responsive(gapY, theme, (g) => `row-gap:${resolveSpace(g, theme, effectiveCompact)};`)
      : '');

  const padCss = responsive(
    pad,
    theme,
    (pv) => `padding:${resolveSpace(pv, theme, effectiveCompact)};`,
    1,
  );

  const alignCss = responsive(align, theme, (a) => `align-items:${a};`, 'stretch');
  const justifyCss = responsive(justifyItems, theme, (j) => `justify-items:${j};`, 'stretch');

  const equalizeCss = equalize
    ? '& > * { --valet-panel-width: 100%; --valet-panel-align-self: stretch; --valet-cell-stretch: 1; }'
    : '';

  // Single-column relax only for an explicit (non-responsive base) single column.
  const baseCols = usingAuto ? undefined : (baseValue(columns) ?? 2);
  const relaxCss =
    baseCols === 1
      ? '& > * { --valet-panel-ov-y: visible; --valet-panel-max-h: none; --valet-stack-ov-y: visible; --valet-stack-max-h: none; --valet-box-max-h: none; }'
      : '';

  const presetClass = p ? preset(p) : '';

  const spaceScale = density != null ? densityScale(density) : undefined;
  const spaceVar = spaceScale != null ? `calc(${theme.spacingUnit} * ${spaceScale})` : undefined;
  const inlineStyle: (React.CSSProperties & Record<string, string | number>) | undefined =
    minVar || spaceVar || style || sx
      ? {
          ...(style as object),
          ...(sx as object),
          ...(minVar ? { '--valet-grid-min': minVar } : {}),
          ...(spaceVar ? { '--valet-space': spaceVar } : {}),
        }
      : undefined;

  return (
    <Root
      {...(rest as object)}
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      data-valet-component={marker}
      $template={templateCss}
      $gap={gapCss}
      $pad={padCss}
      $align={alignCss}
      $justify={justifyCss}
      $equalize={equalizeCss}
      $relax={relaxCss}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={inlineStyle}
    >
      <CompactCtx.Provider value={effectiveCompact}>{children}</CompactCtx.Provider>
    </Root>
  );
};

export const Grid = createPolymorphicComponent<'div', GridOwnProps>(GridImpl);

/*───────────────────────────────────────────────────────────*/
export interface GridItemOwnProps extends Presettable {
  /** Column span — `grid-column: span N`. Responsive. */
  span?: Responsive<number>;
  /** Row span — `grid-row: span N`. Responsive. */
  rowSpan?: Responsive<number>;
  /** 1-based column line to start at — `grid-column-start`. Responsive. */
  colStart?: Responsive<number>;
  /** Inline styles (with CSS var support). */
  sx?: Sx;
  /** Override the machine-readable component marker. */
  'data-valet-component'?: string;
}

export type GridItemProps<E extends React.ElementType = 'div'> = PolymorphicProps<
  E,
  GridItemOwnProps
>;

const GridItemRoot = styled('div')<{ $placement: string }>`
  min-width: 0;
  min-height: 0;
  ${({ $placement }) => $placement}
`;

const GridItemImpl = <E extends React.ElementType = 'div'>(
  props: PolymorphicProps<E, GridItemOwnProps>,
  ref: PolymorphicRef<E>,
) => {
  const {
    preset: p,
    className,
    style,
    span,
    rowSpan,
    colStart,
    sx,
    children,
    'data-valet-component': marker = 'GridItem',
    ...rest
  } = props as unknown as GridItemOwnProps & { as?: E } & {
    style?: React.CSSProperties;
    children?: React.ReactNode;
  } & Record<string, unknown>;

  const { theme } = useTheme();

  // span/rowSpan/colStart are small enumerable ints → safe in rule text.
  const placement =
    (span !== undefined ? responsive(span, theme, (n) => `grid-column: span ${n};`) : '') +
    (rowSpan !== undefined ? responsive(rowSpan, theme, (n) => `grid-row: span ${n};`) : '') +
    (colStart !== undefined ? responsive(colStart, theme, (n) => `grid-column-start: ${n};`) : '');

  const presetClass = p ? preset(p) : '';
  const inlineStyle = style || sx ? { ...(style as object), ...(sx as object) } : undefined;

  return (
    <GridItemRoot
      {...(rest as object)}
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      data-valet-component={marker}
      $placement={placement}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={inlineStyle}
    >
      {children}
    </GridItemRoot>
  );
};

export const GridItem = createPolymorphicComponent<'div', GridItemOwnProps>(GridItemImpl);

export default Grid;
