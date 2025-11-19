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
import { Button, type ButtonVariant } from '../fields/Button';

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

export interface AppBarProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'style' | 'title'>,
    Presettable {
  /** Semantic color intent; maps to theme tokens */
  intent?: Intent;
  /** Explicit color override (theme token name or CSS color) */
  color?: string;
  /** Optional explicit text color override */
  textColor?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  /** Optional brand/logo node, typically an SVG */
  logo?: React.ReactNode;
  /** Optional primary title to the right of the logo */
  title?: React.ReactNode;
  /** Spacing between logo and title */
  logoGap?: Space;
  pad?: Space;
  /** Whether the bar is fixed to the viewport (and offsets content). Defaults to true. */
  fixed?: boolean;
  /** Force portal behavior. Defaults to following `fixed` (true when fixed). */
  portal?: boolean;
  /** Optional navigation buttons; rendered inline for page-level navigation */
  navigation?: AppBarNavigationItem[];
  /** Where navigation buttons live; auto centers when both sides are populated */
  navigationAlign?: 'left' | 'center' | 'right' | 'auto';
  /** ARIA label for the navigation group */
  navigationLabel?: string;
  /** Gap between navigation buttons */
  navigationGap?: Space;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

export interface AppBarNavigationItem {
  id?: string;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  /** Provide when using icon-only buttons for accessible name. Falls back to label text. */
  ariaLabel?: string;
  /** Force icon-only rendering (no label). */
  iconOnly?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  active?: boolean;
  intent?: Intent;
  variant?: ButtonVariant;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
}

/*───────────────────────────────────────────────────────────*/
const Bar = styled('header')<{
  $text: string;
  $pad: string;
  $pos: 'fixed' | 'relative' | 'sticky';
}>`
  box-sizing: border-box;
  display: flex;
  align-items: center;
  padding: ${({ $pad }) => $pad};
  position: ${({ $pos }) => $pos};
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
  min-width: 0;
`;

const BrandWrap = styled('div')<{ $gap: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ $gap }) => $gap};
  min-width: 0;
`;

const RightWrap = styled('div')<{ $gap: string; $push: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ $gap }) => $gap};
  margin-left: ${({ $push }) => ($push ? 'auto' : '0')};
  min-width: 0;
`;

const NavWrap = styled('nav')<{
  $justify: 'flex-start' | 'center' | 'flex-end';
  $gap: string;
  $push: boolean;
  $grow: boolean;
}>`
  display: flex;
  align-items: center;
  justify-content: ${({ $justify }) => $justify};
  gap: ${({ $gap }) => $gap};
  flex: ${({ $grow }) => ($grow ? '1 1 auto' : '0 0 auto')};
  min-width: 0;
  margin-left: ${({ $push }) => ($push ? 'auto' : '0')};
`;

/*───────────────────────────────────────────────────────────*/
export const AppBar: React.FC<AppBarProps> = ({
  intent,
  color,
  textColor,
  left,
  right,
  logo,
  title,
  logoGap,
  pad: padProp,
  fixed = true,
  portal,
  preset: p,
  className,
  navigation,
  navigationAlign = 'auto',
  navigationLabel,
  navigationGap,
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
    if (equals(base, theme.colors.primary)) return theme.colors.primaryText;
    if (equals(base, theme.colors.secondary)) return theme.colors.secondaryText;
    if (equals(base, theme.colors.tertiary)) return theme.colors.tertiaryText;
    if (equals(base, theme.colors.error)) return theme.colors.errorText;
    return theme.colors.text;
  })();

  const bg = base;
  const text = derivedText;
  const presetClass = p ? preset(p) : '';
  // Standardize numeric mapping via resolveSpace; retain two-value default
  const padSingle = resolveSpace(padProp, theme, false, 1);
  const pad = padProp === undefined ? `${theme.spacing(1)} ${theme.spacing(2)}` : padSingle;
  const gap = theme.spacing(2);
  const navGap = resolveSpace(navigationGap ?? 2, theme, false, 2);
  const logoTitleGap = resolveSpace(logoGap, theme, false, 1);

  useLayoutEffect(() => {
    const node = ref.current;
    const surfEl = element;
    if (!node || !surfEl) return;
    if (!fixed) return; // inline bars shouldn't offset the Surface

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
  }, [element, id, registerChild, unregisterChild, fixed]);

  const brand =
    logo || title ? (
      <BrandWrap $gap={logoTitleGap}>
        {logo}
        {title}
      </BrandWrap>
    ) : null;
  const leftContent = (
    <>
      {brand}
      {left ?? children}
    </>
  );
  const hasNav = Boolean(navigation && navigation.length > 0);
  const computedNavAlign = (() => {
    if (navigationAlign !== 'auto') return navigationAlign;
    return 'right';
  })();
  const navJustify: 'flex-start' | 'center' | 'flex-end' =
    computedNavAlign === 'left'
      ? 'flex-start'
      : computedNavAlign === 'right'
        ? 'flex-end'
        : 'center';
  const navPush = computedNavAlign === 'right';
  const navGrow = computedNavAlign === 'center';
  const resolveNavColor = (itemVariant: ButtonVariant, itemIntent?: Intent) => {
    const intentColor = fromIntent(itemIntent);
    if (intentColor) return intentColor;
    // Plain/outlined buttons need contrast vs the bar background.
    if (itemVariant === 'plain' || itemVariant === 'outlined') {
      return text;
    }
    return base;
  };

  const bar = (
    <Bar
      ref={ref}
      {...rest}
      data-valet-component='AppBar'
      $text={text}
      $pad={pad}
      $pos={fixed ? 'fixed' : 'relative'}
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
          '--valet-intent-bg-hover': base + 'F0',
          '--valet-intent-bg-active': base + 'E0',
          '--valet-intent-fg-disabled': theme.colors.text + '88',
          ...sx,
        } as React.CSSProperties
      }
    >
      <BarBg $bg={bg} />
      <LeftWrap $gap={gap}>{leftContent}</LeftWrap>
      {hasNav && (
        <NavWrap
          $justify={navJustify}
          $gap={navGap}
          $push={navPush}
          $grow={navGrow}
          aria-label={navigationLabel}
        >
          {navigation!.map((item, idx) => {
            const key = item.id ?? (typeof item.label === 'string' ? item.label : idx);
            const navVariant: ButtonVariant = item.variant ?? (item.active ? 'outlined' : 'plain');
            const colorForNav = resolveNavColor(navVariant, item.intent);
            const asTag = item.href ? ('a' as const) : undefined;
            const iconOnly = item.iconOnly || (!item.label && !!item.icon);
            const buttonLabel =
              item.ariaLabel ?? (typeof item.label === 'string' ? item.label : undefined);
            const navSize = iconOnly ? 'md' : 'sm';
            return (
              <Button
                key={key}
                as={asTag}
                href={item.href}
                target={item.target}
                rel={item.rel}
                intent={item.intent}
                color={colorForNav}
                variant={navVariant}
                size={navSize}
                disabled={item.disabled}
                onClick={item.onClick}
                aria-label={buttonLabel}
                title={buttonLabel}
                sx={{
                  '--valet-intent-bg': colorForNav,
                  '--valet-intent-fg': navVariant === 'filled' ? text : colorForNav,
                  '--valet-intent-border': colorForNav,
                  borderRadius: theme.radius(999),
                  whiteSpace: 'nowrap',
                  boxShadow:
                    navVariant === 'filled' ? `0 0 0 1px ${text}33` : `0 0 0 1px ${colorForNav}33`,
                  ...(iconOnly
                    ? {
                        minWidth: theme.spacing(3.5),
                        width: theme.spacing(3.5),
                        padding: theme.spacing(0.5),
                        justifyContent: 'center',
                        fontSize: '1.25rem',
                        lineHeight: 1.1,
                      }
                    : null),
                  ...(item.active && navVariant !== 'filled'
                    ? { background: `${colorForNav}16` }
                    : null),
                }}
              >
                {item.icon}
                {item.icon && item.label && !iconOnly ? (
                  <span style={{ display: 'inline-block', width: theme.spacing(0.5) }} />
                ) : null}
                {!iconOnly && item.label}
              </Button>
            );
          })}
        </NavWrap>
      )}
      {right && (
        <RightWrap
          $gap={gap}
          $push={!hasNav}
        >
          {right}
        </RightWrap>
      )}
    </Bar>
  );

  /* Avoiding fixed-in-fixed bug on older Safari by portaling to body when fixed; inline otherwise */
  const shouldPortal = typeof portal === 'boolean' ? portal : fixed;
  return shouldPortal ? createPortal(bar, document.body) : bar;
};

export default AppBar;
