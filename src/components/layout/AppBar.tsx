// ─────────────────────────────────────────────────────────────
// src/components/layout/AppBar.tsx  | valet
// left/right parking slots
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
  left?: React.ReactNode;
  right?: React.ReactNode;
}

/*───────────────────────────────────────────────────────────*/
const Bar = styled('header')<{ $text: string; $pad: string }>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: 0.5rem 1rem;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  color: ${({ $text }) => $text};
  & > * {
    padding: ${({ $pad }) => $pad};
  }
`;

const BarBg = styled('div')<{ $bg: string }>`
  position: absolute;
  inset: 0;
  background: ${({ $bg }) => $bg};
  pointer-events: none;
  z-index: -1;
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
  left,
  right,
  preset: p,
  className,
  style,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const { element, registerChild, unregisterChild } = useSurface(
    (s) => ({
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

  const bg =
    color === undefined
      ? theme.colors.primary
      : isToken(color)
        ? theme.colors[color]
        : color;

  const text =
    textColor === undefined
      ? isToken(color)
        ? theme.colors[`${color}Text`]
        : theme.colors.text
      : isToken(textColor)
        ? theme.colors[`${textColor}Text`]
        : textColor;
  const presetClass = p ? preset(p) : '';
  const pad = theme.spacing(1);
  const gap = theme.spacing(2);

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
      $text={text}
      $pad={pad}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={
        {
          '--valet-bg': bg,
          '--valet-text-color': text,
          background: bg,
          color: text,
          ...style,
        } as React.CSSProperties
      }
    >
      <BarBg $bg={bg} />
      <LeftWrap $gap={gap}>{left ?? children}</LeftWrap>
      {right && <RightWrap>{right}</RightWrap>}
    </Bar>
  );

  /* Avoiding fixed-in-fixed bug on older Safari by portaling to body */
  return createPortal(bar, document.body);
};

export default AppBar;
