// ─────────────────────────────────────────────────────────────
// src/components/layout/Stack.tsx  | valet
// One-dimensional flex container. 1.0 improve (additive): responsive
// props (compile to @media in the styled rule — no JS, no <Surface>),
// align/justify tokens, per-axis gapX/gapY, divider interleaving, a
// `grow` flex factor, public `scroll` modes, and polymorphic `as`.
// Plus named sugar: HStack / VStack / Center / Cluster / Spacer.
//
// Deliberately NON-breaking: every existing prop keeps its name, default,
// and behavior. `direction`/`gap`/`pad`/`align`/`justify`/`gapX`/`gapY` are
// type-WIDENED to Responsive (a superset of the scalar), `wrap` stays scalar,
// and the row→center / column→stretch align default + the --valet-stack-ov-y
// overflow contract are preserved verbatim.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable, SpacingProps, Space, Sx, Responsive } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';
import { responsive } from '../../utils/responsive';
import { densityScale } from '../../system/densityScale';
import { CompactCtx, useCompact } from '../../system/compactContext';
import { warnOnce } from '../../system/devErrors';
import {
  createPolymorphicComponent,
  type PolymorphicComponent,
  type PolymorphicProps,
  type PolymorphicRef,
} from '../../system/polymorphic';

/*───────────────────────────────────────────────────────────*/
export type StackDirection = 'row' | 'column' | 'row-reverse' | 'column-reverse';
export type StackAlign = 'start' | 'center' | 'end' | 'stretch' | 'baseline';
export type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
/** Overflow/scroll behavior. `auto-y` (default) is the legacy behavior. */
export type StackScroll = 'auto-y' | 'x' | 'both' | 'visible';

/** align/justify token → CSS value. Enumerable, so bounded rule cardinality. */
const ALIGN_ITEMS: Record<StackAlign, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
  baseline: 'baseline',
};
const JUSTIFY_CONTENT: Record<StackJustify, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

const BP_KEYS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
/** The base (smallest-breakpoint) value of a Responsive — used for the
 *  direction-derived align default and the wrap default. */
function baseValue<T>(v: Responsive<T> | undefined): T | undefined {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'object' && !Array.isArray(v)) {
    const m = v as Record<string, T>;
    for (const k of BP_KEYS) if (m[k] !== undefined) return m[k];
    return undefined;
  }
  return v;
}

/** overflow declarations for each scroll mode. `auto-y` preserves the legacy
 *  `--valet-stack-ov-y` hook that Grid's single-column relax writes to. */
function scrollCss(mode: StackScroll): string {
  switch (mode) {
    case 'x':
      return 'overflow-x: auto; overflow-y: hidden;';
    case 'both':
      return 'overflow-x: auto; overflow-y: var(--valet-stack-ov-y, auto);';
    case 'visible':
      return 'overflow-x: visible; overflow-y: visible;';
    case 'auto-y':
    default:
      return 'overflow-x: hidden; overflow-y: var(--valet-stack-ov-y, auto);';
  }
}

/** Interleave `divider` between children (n-1 dividers, correct edges). Flat
 *  children only; a Fragment child counts as one node. */
function interleaveDivider(children: React.ReactNode, divider: React.ReactNode): React.ReactNode {
  const items = React.Children.toArray(children);
  if (items.length <= 1) return items;
  const out: React.ReactNode[] = [];
  items.forEach((child, i) => {
    if (i > 0) {
      const key = `valet-stack-divider-${i}`;
      out.push(
        React.isValidElement(divider) ? (
          React.cloneElement(divider, { key })
        ) : (
          <React.Fragment key={key}>{divider}</React.Fragment>
        ),
      );
    }
    out.push(child);
  });
  return out;
}

/*───────────────────────────────────────────────────────────*/
export interface StackOwnProps extends Presettable, Pick<SpacingProps, 'compact' | 'density'> {
  /** Flex axis. Default `'column'`. Responsive. */
  direction?: Responsive<StackDirection>;
  /** Wrap children when they overflow the main axis. Default: `true` for rows,
   *  `false` for columns. Scalar (not responsive). */
  wrap?: boolean;
  /** Inter-child gap as units or CSS length. Default 1 unit. Responsive. */
  gap?: Responsive<Space>;
  /** Column-axis gap; overrides `gap` horizontally. Responsive. */
  gapX?: Responsive<Space>;
  /** Row-axis gap; overrides `gap` vertically. Responsive. */
  gapY?: Responsive<Space>;
  /** Container padding as units or CSS length. Default 1 unit. Responsive. */
  pad?: Responsive<Space>;
  /** Cross-axis item alignment (`align-items`). Defaults to the direction's
   *  natural alignment: row → `center`, column → `stretch`. Responsive. */
  align?: Responsive<StackAlign>;
  /** Main-axis distribution (`justify-content`). Unset by default. Responsive. */
  justify?: Responsive<StackJustify>;
  /** Horizontal placement of the whole stack when it is not full width
   *  (auto-margin anchor — distinct from `align`, which positions children). */
  alignX?: 'left' | 'center' | 'right';
  /** Node interleaved BETWEEN children (e.g. a `<Divider/>`). For a row stack,
   *  pass a vertically-oriented divider. */
  divider?: React.ReactNode;
  /** Overflow behavior. `'auto-y'` (default) keeps the legacy vertical-scroll. */
  scroll?: StackScroll;
  /** Grow factor when the stack is itself a flex child. `true` → 1. */
  grow?: boolean | number;
  /** Inline styles (with CSS var support). */
  sx?: Sx;
  /** Override the machine-readable component marker (sugar/composites self-identify). */
  'data-valet-component'?: string;
}

export type StackProps<E extends React.ElementType = 'div'> = PolymorphicProps<E, StackOwnProps>;

/*───────────────────────────────────────────────────────────*/
const StackContainer = styled('div')<{
  $direction: string;
  $align: string;
  $justify: string;
  $gap: string;
  $pad: string;
  $wrap: boolean;
  $alignX: 'left' | 'center' | 'right';
  $scroll: string;
  $grow: string;
}>`
  display: flex;
  ${({ $direction }) => $direction}
  ${({ $align }) => $align}
  ${({ $justify }) => $justify}
  ${({ $gap }) => $gap}
  ${({ $wrap }) => ($wrap ? 'flex-wrap: wrap;' : '')}
  ${({ $grow }) => $grow}

  /* Optional anchoring similar to Box/Panel */
  ${({ $alignX }) =>
    $alignX !== 'left'
      ? `
    width: max-content;
    ${$alignX === 'right' ? 'margin-inline-start:auto;' : 'margin-inline-start:auto; margin-inline-end:auto;'}
  `
      : ''}

  /* Boundary guards */
  max-width: 100%;
  /* Allow parents (Grid in adaptive portrait) to relax height */
  max-height: var(--valet-stack-max-h, 100%);
  min-width: 0;
  min-height: 0;

  ${({ $scroll }) => $scroll}

  /* Hide native scrollbars where supported */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE & Edge */
  &::-webkit-scrollbar {
    display: none;
  }

  box-sizing: border-box;
  ${({ $pad }) => $pad}
`;

/*───────────────────────────────────────────────────────────*/
const StackImpl = <E extends React.ElementType = 'div'>(
  props: PolymorphicProps<E, StackOwnProps>,
  ref: PolymorphicRef<E>,
) => {
  const {
    preset: p,
    className,
    style,
    direction,
    wrap,
    gap,
    gapX,
    gapY,
    pad,
    align,
    justify,
    alignX = 'left',
    divider,
    scroll = 'auto-y',
    grow,
    compact,
    density,
    sx,
    children,
    'data-valet-component': marker = 'Stack',
    ...rest
  } = props as unknown as StackOwnProps & { as?: E } & {
    style?: React.CSSProperties;
    children?: React.ReactNode;
  } & Record<string, unknown>;

  const { theme } = useTheme();
  const effectiveCompact = useCompact(compact);

  const baseDir = (baseValue(direction) ?? 'column') as StackDirection;
  const isRow = baseDir === 'row' || baseDir === 'row-reverse';

  /* direction — responsive; defaults to column. */
  const directionCss = responsive(direction, theme, (d) => `flex-direction:${d};`, 'column');

  /* align-items — explicit `align` wins; otherwise mirror the direction's
     natural default (row→center / column→stretch) per breakpoint so existing
     output is byte-preserved. */
  const alignCss =
    align !== undefined
      ? responsive(
          align,
          theme,
          (a) => `align-items:${ALIGN_ITEMS[a]};`,
          (isRow ? 'center' : 'stretch') as StackAlign,
        )
      : responsive(
          direction,
          theme,
          (d) => `align-items:${d === 'row' || d === 'row-reverse' ? 'center' : 'stretch'};`,
          'column',
        );

  /* justify-content — unset by default. */
  const justifyCss =
    justify === undefined
      ? ''
      : responsive(justify, theme, (j) => `justify-content:${JUSTIFY_CONTENT[j]};`);

  /* gap (+ per-axis overrides) — all flow through resolveSpace, so compact
     still zeros and density still rescales. gapX/gapY override gap on their axis. */
  const gapCss =
    responsive(gap, theme, (g) => `gap:${resolveSpace(g, theme, effectiveCompact)};`, 1) +
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

  const shouldWrap = typeof wrap === 'boolean' ? wrap : isRow;
  const growCss = grow ? `flex-grow:${grow === true ? 1 : grow};` : '';

  const presetClasses = p ? preset(p) : '';

  /* V1: density scales the subtree via --valet-space (centralized mapping) */
  const spaceScale = density != null ? densityScale(density) : undefined;
  const spaceVar = spaceScale != null ? `calc(${theme.spacingUnit} * ${spaceScale})` : undefined;
  const inlineStyle: (React.CSSProperties & Record<string, string | number>) | undefined =
    spaceVar || style || sx
      ? {
          ...(style as object),
          ...(sx as object),
          ...(spaceVar ? { '--valet-space': spaceVar } : {}),
        }
      : undefined;

  if (process.env.NODE_ENV !== 'production' && divider != null && divider !== false) {
    const asTag = (rest as { as?: unknown }).as;
    if (asTag === 'ul' || asTag === 'ol') {
      warnOnce(
        'valet-stack-divider-list',
        `valet: <Stack as="${asTag}"> with a \`divider\` interleaves non-<li> nodes ` +
          'between items, producing invalid list markup. Drop the divider, or render ' +
          'the list without Stack and place separators yourself.',
      );
    }
  }

  const content =
    divider != null && divider !== false ? interleaveDivider(children, divider) : children;

  return (
    <StackContainer
      {...(rest as object)}
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      data-valet-component={marker}
      $direction={directionCss}
      $align={alignCss}
      $justify={justifyCss}
      $gap={gapCss}
      $pad={padCss}
      $wrap={shouldWrap}
      $alignX={alignX}
      $scroll={scrollCss(scroll)}
      $grow={growCss}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      style={inlineStyle}
    >
      <CompactCtx.Provider value={effectiveCompact}>{content}</CompactCtx.Provider>
    </StackContainer>
  );
};

export const Stack = createPolymorphicComponent<'div', StackOwnProps>(StackImpl);

/*───────────────────────────────────────────────────────────*/
/* Named sugar — thin wrappers over Stack. `fixed` props are the variant's
   identity (win over caller props); `defaults` are overridable. Each
   self-identifies via its own data-valet-component marker. */
function makeVariant(
  name: string,
  fixed: Partial<StackOwnProps>,
  defaults?: Partial<StackOwnProps>,
): PolymorphicComponent<'div', StackOwnProps> {
  const Variant = createPolymorphicComponent<'div', StackOwnProps>((props, ref) =>
    React.createElement(Stack as React.ElementType, {
      ref,
      'data-valet-component': name,
      ...defaults,
      ...(props as object),
      ...fixed,
    }),
  );
  (Variant as { displayName?: string }).displayName = name;
  return Variant;
}

/** Horizontal stack (`direction='row'`; align defaults to `center`). */
export const HStack = makeVariant('HStack', {
  direction: 'row',
}) as unknown as PolymorphicComponent<'div', Omit<StackOwnProps, 'direction'>>;
/** Vertical stack (`direction='column'`). */
export const VStack = makeVariant('VStack', {
  direction: 'column',
}) as unknown as PolymorphicComponent<'div', Omit<StackOwnProps, 'direction'>>;
/** Centers its children on both axes (overridable `align`/`justify`). */
export const Center = makeVariant('Center', {}, { align: 'center', justify: 'center' });
/** Wrapping row with a consistent gap — tags, chips, button clusters. */
export const Cluster = makeVariant(
  'Cluster',
  { direction: 'row' },
  { wrap: true, align: 'center' },
) as unknown as PolymorphicComponent<'div', Omit<StackOwnProps, 'direction'>>;

/*───────────────────────────────────────────────────────────*/
export interface SpacerProps {
  /** Grow factor; how much free space this filler absorbs. Default 1. */
  grow?: number;
  className?: string;
  style?: React.CSSProperties;
}
/** A flexible spacer that pushes siblings apart inside a Stack (any direction). */
export const Spacer: React.FC<SpacerProps> = ({ grow = 1, className, style }) => (
  <div
    aria-hidden
    data-valet-component='Spacer'
    className={className}
    style={{ flex: `${grow} 1 0%`, minWidth: 0, minHeight: 0, ...style }}
  />
);

export default Stack;
