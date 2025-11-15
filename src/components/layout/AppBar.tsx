// ─────────────────────────────────────────────────────────────
// src/components/layout/AppBar.tsx  | valet
// spacing refactor: controlled pad; remove child padding – 2025‑08‑12
// ─────────────────────────────────────────────────────────────
import React, { useLayoutEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { useSurface } from '../../system/surfaceStore';
import { shallow } from 'zustand/shallow';
import { preset } from '../../css/stylePresets';
import { inheritSurfaceFontVars } from '../../system/inheritSurfaceFontVars';
import type { Presettable, Space, Sx } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';

/*───────────────────────────────────────────────────────────*/
export type AppBarToken = 'primary' | 'secondary' | 'tertiary';
type Intent =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | (string & {});

export interface AppBarProps extends Omit<React.HTMLAttributes<HTMLElement>, 'style'>, Presettable {
  /** Visual variant: filled | outlined | plain */
  variant?: 'filled' | 'outlined' | 'plain';
  /** Semantic color intent; maps to theme tokens */
  intent?: Intent;
  /** Explicit color override (theme token name or CSS color) */
  color?: string;
  /** Optional explicit text color override */
  textColor?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  pad?: Space;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
const Bar = styled('header')<{ $text: string; $pad: string }>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: ${({ $pad }) => $pad};
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10000;
  color: ${({ $text }) => $text};
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
  variant = 'filled',
  intent,
  color,
  textColor,
  left,
  right,
  pad: padProp,
  preset: p,
  className,
  sx,
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

  const resolveToken = (v?: string): string | undefined => {
    if (!v) return undefined;
    const colors = theme.colors as Record<string, string>;
    return colors[v] || v;
  };
  const fromIntent = (i?: Intent): string | undefined => {
    if (!i) return undefined;
    const colors = theme.colors as Record<string, string>;
    return colors[String(i)];
  };
  const equals = (a?: string, b?: string) => (a || '').toUpperCase() === (b || '').toUpperCase();

  const base = resolveToken(color) || fromIntent(intent) || theme.colors.primary;
  const derivedText = (() => {
    if (textColor) return resolveToken(textColor) || textColor;
    if (variant === 'filled') {
      if (equals(base, theme.colors.primary)) return theme.colors.primaryText;
      if (equals(base, theme.colors.secondary)) return theme.colors.secondaryText;
      if (equals(base, theme.colors.tertiary)) return theme.colors.tertiaryText;
      if (equals(base, theme.colors.error)) return theme.colors.errorText;
      return theme.colors.text;
    }
    // outlined/plain → treat base as emphasis colour; text defaults to theme text
    return theme.colors.text;
  })();

  const bg = variant === 'filled' ? base : 'transparent';
  const text = derivedText;
  const presetClass = p ? preset(p) : '';
  // Standardize numeric mapping via resolveSpace; retain two-value default
  const padSingle = resolveSpace(padProp, theme, false, 1);
  const pad = padProp === undefined ? `${theme.spacing(1)} ${theme.spacing(2)}` : padSingle;
  const gap = theme.spacing(2);

  useLayoutEffect(() => {
    const node = ref.current;
    const surfEl = element;
    if (!node || !surfEl) return;

    // Mirror Surface font/typography vars into the portalled bar element
    inheritSurfaceFontVars(node);

    const surfaceEl = surfEl as HTMLElement;
    const prev = surfaceEl.style.marginTop;

    const update = (m: { height: number }) => {
      surfaceEl.style.marginTop = `${m.height}px`;
    };

    registerChild(id, node, update);
    return () => {
      unregisterChild(id);
      surfaceEl.style.marginTop = prev;
    };
  }, [element, id, registerChild, unregisterChild]);

  const bar = (
    <Bar
      ref={ref}
      {...rest}
      data-valet-component='AppBar'
      $text={text}
      $pad={pad}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={
        {
          '--valet-bg': bg,
          '--valet-text-color': text,
          background: bg,
          color: text,
          '--valet-intent-bg': base,
          '--valet-intent-fg': text,
          '--valet-intent-border': base,
          '--valet-intent-focus': theme.colors.primary,
          '--valet-intent-bg-hover': variant === 'filled' ? base + 'F0' : 'transparent',
          '--valet-intent-bg-active': variant === 'filled' ? base + 'E0' : 'transparent',
          '--valet-intent-fg-disabled': theme.colors.text + '88',
          ...sx,
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
