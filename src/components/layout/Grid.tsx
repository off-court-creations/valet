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

/*───────────────────────────────────────────────────────────*/
export interface GridProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    Presettable,
    Pick<SpacingProps, 'gap' | 'pad' | 'compact'> {
  columns?: number;
  /** Auto switch to 1 column in portrait */
  adaptive?: boolean;
  /** Compact zeros both pad and gap */
  compact?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('div')<{ $cols: number; $gap: string; $pad: string }>`
  display: grid;
  /* Prevent content from dictating track min-size; allow wrapping */
  grid-template-columns: repeat(${({ $cols }) => $cols}, minmax(0, 1fr));
  gap: ${({ $gap }) => $gap};
  padding: ${({ $pad }) => $pad};
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;

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
  compact = false,
  adaptive = false,
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

  // Standardize default gap to 1 for consistency with Stack/Tabs
  const g = resolveSpace(gapProp as Space, theme, compact, 1);
  const pad = resolveSpace(padProp, theme, compact, 1);

  const presetClass = p ? preset(p) : '';

  return (
    <Root
      {...rest}
      $cols={effectiveCols}
      $gap={g}
      $pad={pad}
      style={sx}
      className={[presetClass, className].filter(Boolean).join(' ')}
    >
      {children}
    </Root>
  );
};

export default Grid;
