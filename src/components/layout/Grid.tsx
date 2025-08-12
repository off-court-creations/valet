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
import type { Presettable } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';

/*───────────────────────────────────────────────────────────*/
export interface GridProps extends React.HTMLAttributes<HTMLDivElement>, Presettable {
  columns?: number;
  /** Inter-child spacing in units or CSS length. */
  gap?: number | string;
  /** Container inner padding in units or CSS length. */
  pad?: number | string;
  /** Auto switch to 1 column in portrait */
  adaptive?: boolean;
  /** Compact zeros both pad and gap */
  compact?: boolean;
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('div')<{ $cols: number; $gap: string; $pad: string }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols}, 1fr);
  gap: ${({ $gap }) => $gap};
  padding: ${({ $pad }) => $pad};
`;

/*───────────────────────────────────────────────────────────*/
export const Grid: React.FC<GridProps> = ({
  columns = 2,
  gap: gapProp = 2,
  pad: padProp,
  compact = false,
  adaptive = false,
  preset: p,
  style,
  className,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const { width, height } = useSurface((s) => ({ width: s.width, height: s.height }), shallow);

  const portrait = height > width;
  const effectiveCols = adaptive && portrait ? 1 : columns;

  const g = resolveSpace(gapProp, theme, compact, 2);
  const pad = resolveSpace(padProp, theme, compact, 1);

  const presetClass = p ? preset(p) : '';

  return (
    <Root
      {...rest}
      $cols={effectiveCols}
      $gap={g}
      $pad={pad}
      style={style}
      className={[presetClass, className].filter(Boolean).join(' ')}
    >
      {children}
    </Root>
  );
};

export default Grid;
