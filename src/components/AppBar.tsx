// ─────────────────────────────────────────────────────────────
// src/components/AppBar.tsx  | valet
// minimal top navigation bar
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
export interface AppBarProps
  extends React.HTMLAttributes<HTMLElement>,
    Presettable {
  position?: 'static' | 'fixed' | 'absolute' | 'sticky';
  background?: string;
  textColor?: string;
}

/*───────────────────────────────────────────────────────────*/
const Bar = styled('header')<{
  $pos: string;
  $bg: string;
  $text: string;
}>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  position: ${({ $pos }) => $pos};
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
`;

/*───────────────────────────────────────────────────────────*/
export const AppBar: React.FC<AppBarProps> = ({
  position = 'static',
  background,
  textColor,
  preset: p,
  className,
  style,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const bg = background ?? theme.colors.primary;
  const text = textColor ?? theme.colors.primaryText;
  const presetClass = p ? preset(p) : '';

  return (
    <Bar
      {...rest}
      $pos={position}
      $bg={bg}
      $text={text}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </Bar>
  );
};

export default AppBar;
