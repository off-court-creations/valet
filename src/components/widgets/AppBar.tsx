// ─────────────────────────────────────────────────────────────
// src/components/widgets/AppBar.tsx  | valet
// minimal top navigation bar
// ─────────────────────────────────────────────────────────────
import React, { useLayoutEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { useSurface } from '../../system/surfaceStore';
import { shallow } from 'zustand/shallow';
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
  const { element, registerChild, unregisterChild } = useSurface(
    s => ({
      element: s.element,
      registerChild: s.registerChild,
      unregisterChild: s.unregisterChild,
    }),
    shallow,
  );
  const ref = useRef<HTMLElement>(null);
  const id = useId();

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

  useLayoutEffect(() => {
    const node = ref.current;
    const surfEl = element;
    if (!node || !surfEl) return;
    const prev = (surfEl.style as any).marginTop;
    const update = (m: { height: number }) => {
      (surfEl.style as any).marginTop = `${m.height}px`;
    };
    registerChild(id, node, update);
    return () => {
      unregisterChild(id);
      (surfEl.style as any).marginTop = prev;
    };
  }, [element]);

  const bar = (
    <Bar
      ref={ref}
      {...rest}
      $bg={bg}
      $text={text}
      $gap={gap}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </Bar>
  );

  return createPortal(bar, element || document.body);
};

export default AppBar;
