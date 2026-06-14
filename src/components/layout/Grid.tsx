// ─────────────────────────────────────────────────────────────
// src/components/layout/Grid.tsx  | valet
// spacing refactor: container pad + gap, compact – 2025-08-12
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';
import { useSurface } from '../../system/surfaceStore';
import { shallow } from 'zustand/shallow';
import type { Presettable, SpacingProps, Space, Sx } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';
import { CompactCtx, useCompact } from '../../system/compactContext';

/*───────────────────────────────────────────────────────────*/
export interface GridProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    Presettable,
    Pick<SpacingProps, 'gap' | 'pad' | 'compact' | 'density'> {
  columns?: number;
  /** Auto switch to 1 column in portrait */
  adaptive?: boolean;
  /** Density override; an independent spacing scale (never zeros) */
  density?: 'tight' | 'standard' | 'comfortable';
  /** Hard-zeros layout pad + gap and cascades to descendants (independent of density) */
  compact?: boolean;
  /**
   * Normalize child heights per row by stretching items to match
   * the tallest in that row. Effective only when 2+ columns are active
   * (i.e., adaptive is off, or on but not collapsed to 1 column).
   * Defaults to true; set false to opt out.
   */
  normalizeRowHeights?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('div')<{
  $cols: number;
  $gap: string;
  $pad: string;
  $normalize: boolean;
}>`
  display: grid;
  /* Prevent content from dictating track min-size; allow wrapping */
  grid-template-columns: repeat(${({ $cols }) => $cols}, minmax(0, 1fr));
  gap: ${({ $gap }) => $gap};
  padding: ${({ $pad }) => $pad};
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;

  /* Make intent explicit (browser default is stretch) */
  align-items: stretch;

  /* When normalizing row heights and in multi-column mode, ask
     Panels to stretch themselves via CSS var. Panels respect
     --valet-panel-align-self if provided. */
  ${({ $cols, $normalize }) =>
    $normalize && $cols > 1
      ? `
    & > * { --valet-panel-align-self: stretch; }
  `
      : ''}

  /* When collapsed to a single column (adaptive portrait),
     relax child overflow/height so content stacks naturally and
     the page scrolls instead of nested scrollers (older iOS fix). */
  ${({ $cols }) =>
    $cols === 1
      ? `
    & > * {
      --valet-panel-ov-y: visible;
      --valet-panel-max-h: none;
      --valet-stack-ov-y: visible;
      --valet-stack-max-h: none;
      --valet-box-max-h: none;
    }
  `
      : ''}
`;

/*───────────────────────────────────────────────────────────*/
export const Grid: React.FC<GridProps> = ({
  columns = 2,
  gap: gapProp,
  pad: padProp,
  compact,
  density,
  adaptive = false,
  normalizeRowHeights = true,
  preset: p,
  sx,
  className,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const { width, height } = useSurface((s) => ({ width: s.width, height: s.height }), shallow);

  const portrait = height > width;
  const effectiveCols = adaptive && portrait ? 1 : columns;

  const effectiveCompact = useCompact(compact);

  // Role-aware default (1.0, "beautiful by default"): a Grid lays out distinct
  // cards/regions, so its default gutter is 2 spacing units (~16px) — the
  // conventional card-grid gutter — not the 8px used for tight inline stacks.
  // Dense grids opt down with `gap={1}` / `density='tight'` / `compact`.
  const g = resolveSpace(gapProp as Space, theme, effectiveCompact, 2);
  const pad = resolveSpace(padProp, theme, effectiveCompact, 1);

  const densityScale =
    density === 'comfortable'
      ? 1.15
      : density === 'tight'
        ? 0.9
        : density === 'standard'
          ? 1.0
          : undefined;

  const presetClass = p ? preset(p) : '';

  return (
    <Root
      {...rest}
      data-valet-component='Grid'
      $cols={effectiveCols}
      $gap={g}
      $pad={pad}
      $normalize={Boolean(normalizeRowHeights)}
      style={
        densityScale != null
          ? { ...sx, '--valet-space': `calc(${theme.spacingUnit} * ${densityScale})` }
          : sx
      }
      className={[presetClass, className].filter(Boolean).join(' ')}
    >
      <CompactCtx.Provider value={effectiveCompact}>{children}</CompactCtx.Provider>
    </Root>
  );
};

export default Grid;
