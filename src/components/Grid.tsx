// ─────────────────────────────────────────────────────────────
// src/components/Grid.tsx  | valet
// simple css grid container
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../css/createStyled';
import { preset } from '../css/stylePresets';
import { useTheme } from '../system/themeStore';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
export interface GridProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
  columns?: number;
  gap?: number | string;
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('div')<{ $cols: number; $gap: string }>`
  display: grid;
  grid-template-columns: repeat(${({ $cols }) => $cols}, 1fr);
  gap: ${({ $gap }) => $gap};
`;

/*───────────────────────────────────────────────────────────*/
export const Grid: React.FC<GridProps> = ({
  columns = 2,
  gap = 2,
  preset: p,
  style,
  className,
  children,
  ...rest
}) => {
  const { theme } = useTheme();

  let g: string;
  if (typeof gap === 'number') {
    g = theme.spacing(gap);
  } else {
    g = String(gap);
  }

  const presetClass = p ? preset(p) : '';

  return (
    <Root
      {...rest}
      $cols={columns}
      $gap={g}
      style={style}
      className={[presetClass, className].filter(Boolean).join(' ')}
    >
      {children}
    </Root>
  );
};

export default Grid;
