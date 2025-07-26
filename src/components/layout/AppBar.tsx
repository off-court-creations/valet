// ─────────────────────────────────────────────────────────────
// src/components/layout/AppBar.tsx  | valet
// minimal top navigation bar
// ─────────────────────────────────────────────────────────────
import React, { ReactElement } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';
import type { IconProps } from '../primitives/Icon';

/*───────────────────────────────────────────────────────────*/
export type AppBarToken = 'primary' | 'secondary' | 'tertiary';

export interface AppBarProps
  extends React.HTMLAttributes<HTMLElement>,
    Presettable {
  color?: AppBarToken | string;
  textColor?: AppBarToken | string;
  icon?: ReactElement<IconProps>;
  iconPlacement?: 'left' | 'right';
}

/*───────────────────────────────────────────────────────────*/
const Bar = styled('header')<{
  $bg: string;
  $text: string;
  $pad: string;
}>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  background: ${({ $bg }) => $bg};
  background-color: ${({ $bg }) => $bg};
  --valet-bg: ${({ $bg }) => $bg};
  --valet-text-color: ${({ $text }) => $text};
  will-change: transform;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  color: ${({ $text }) => $text};
  & > * {
    padding: ${({ $pad }) => $pad};
  }
`;

const LeftWrap = styled('div')<{ $gap: string }>`
  display: flex;
  align-items: center;
  gap: ${({ $gap }) => $gap};
`;

const RightWrap = styled('div')`
  margin-left: auto;
  display: flex;
  align-items: center;
`;

/*───────────────────────────────────────────────────────────*/
export const AppBar: React.FC<AppBarProps> = ({
  color,
  textColor,
  icon,
  iconPlacement = 'left',
  preset: p,
  className,
  style,
  children,
  ...rest
}) => {
  const { theme } = useTheme();

  const isToken = (v: any): v is AppBarToken =>
    v === 'primary' || v === 'secondary' || v === 'tertiary';

  const bg = color === undefined
    ? theme.colors.primary
    : isToken(color)
      ? theme.colors[color]
      : color;

  const text = textColor === undefined
    ? isToken(color)
      ? theme.colors[`${color}Text`]
      : theme.colors.text
    : isToken(textColor)
      ? theme.colors[`${textColor}Text`]
      : textColor;
  const presetClass = p ? preset(p) : '';
  const pad = theme.spacing(1);
  const gap = theme.spacing(2);

  const bar = (
    <Bar
      {...rest}
      $bg={bg}
      $text={text}
      $pad={pad}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={style}
    >
      <LeftWrap $gap={gap}>
        {iconPlacement === 'left' && icon}
        {children}
      </LeftWrap>
      {iconPlacement === 'right' && icon && <RightWrap>{icon}</RightWrap>}
    </Bar>
  );

  return bar;
};

export default AppBar;
