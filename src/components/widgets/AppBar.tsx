// ─────────────────────────────────────────────────────────────
// src/components/widgets/AppBar.tsx  | valet
// minimal top navigation bar
// ─────────────────────────────────────────────────────────────
import React, { useLayoutEffect, useRef } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { useSurface } from '../../system/surfaceStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
export type AppBarToken = 'primary' | 'secondary' | 'tertiary';

export interface AppBarProps
  extends React.HTMLAttributes<HTMLElement>,
    Presettable {
  color?: AppBarToken | string;
  textColor?: AppBarToken | string;
}

/*───────────────────────────────────────────────────────────*/
const Bar = styled('header')<{
  $bg: string;
  $text: string;
  $gap: string;
}>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: ${({ $gap }) => $gap};
  padding: 0.5rem 1rem;
  & > * {
    padding: ${({ $gap }) => $gap};
  }
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  background: ${({ $bg }) => $bg};
  color: ${({ $text }) => $text};
`;

/*───────────────────────────────────────────────────────────*/
export const AppBar: React.FC<AppBarProps> = ({
  color,
  textColor,
  preset: p,
  className,
  style,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const element = useSurface(s => s.element);
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const surf = element;
    const bar = ref.current;
    if (!surf || !bar) return;
    const prev = surf.style.marginTop;
    const apply = () => {
      surf.style.marginTop = `${bar.getBoundingClientRect().height}px`;
    };
    const ro = new ResizeObserver(apply);
    ro.observe(bar);
    apply();
    return () => {
      ro.disconnect();
      surf.style.marginTop = prev;
    };
  }, [element]);

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
  const gap = theme.spacing(1);

  return (
    <Bar
      {...rest}
      ref={ref}
      $bg={bg}
      $text={text}
      $gap={gap}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </Bar>
  );
};

export default AppBar;
