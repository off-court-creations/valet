// ─────────────────────────────────────────────────────────────
// src/components/fields/Button.tsx | valet
// Theme-aware <Button /> – automatic Typography wrapping
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import type { Theme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { Typography } from '../primitives/Typography';
import type { Presettable, Sx } from '../../types';
import { toRgb, mix, toHex } from '../../helpers/color';
import {
  createPolymorphicComponent,
  type PolymorphicProps,
  type PolymorphicRef,
} from '../../system/polymorphic';

/*───────────────────────────────────────────────────────────*/
export type ButtonVariant = 'filled' | 'outlined' | 'plain';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Intent =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | (string & {});

export interface ButtonOwnProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'>,
    Presettable {
  /** Semantic color intent (maps to theme tokens). */
  intent?: Intent;
  /** Visual variant: filled | outlined | plain. */
  variant?: ButtonVariant;
  /** Explicit color override (any CSS color or theme token name). */
  color?: string;
  size?: ButtonSize | number | string;
  fullWidth?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
const createSizeMap = (t: Theme) =>
  ({
    xs: {
      padV: t.spacing(1),
      padH: t.spacing(1),
      font: '1rem',
      height: '1.5rem',
    },
    sm: {
      padV: t.spacing(1),
      padH: t.spacing(1),
      font: '1rem',
      height: '2rem',
    },
    md: {
      padV: t.spacing(1),
      padH: t.spacing(1),
      font: '1rem',
      height: '2.5rem',
    },
    lg: {
      padV: t.spacing(1),
      padH: t.spacing(1),
      font: '1rem',
      height: '3rem',
    },
    xl: {
      padV: t.spacing(1),
      padH: t.spacing(1),
      font: '1rem',
      height: '3.5rem',
    },
  }) as const;

/*───────────────────────────────────────────────────────────*/
const Root = styled('button')<{
  $variant: ButtonVariant;
  $height: string;
  $padRule: string;
  $font: string;
  $minW: string;
  $bg: string;
  $label: string;
  $hoverLabel: string;
  $strokeW: string;
  $radius: string;
  $ripple: string;
  $full: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  /* Expose button colors via CSS vars so children (Typography) inherit */
  --valet-bg: ${({ $bg }) => $bg};
  --valet-text-color: ${({ $label }) => $label};

  height: ${({ $height }) => $height};
  min-width: ${({ $minW }) => $minW};
  padding: ${({ $padRule }) => $padRule};
  box-sizing: border-box;

  align-self: ${({ $full }) => ($full ? 'stretch' : 'flex-start')};
  width: ${({ $full }) => ($full ? '100%' : 'auto')};

  border-radius: ${({ $radius }) => $radius};
  border: ${({ $variant, $strokeW, $bg }) =>
    $variant === 'outlined' ? `${$strokeW} solid ${$bg}` : 'none'};

  background: ${({ $variant, $bg }) => ($variant === 'filled' ? $bg : 'transparent')};

  color: ${({ $label }) => $label};
  font-size: ${({ $font }) => $font};
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    transform 0.1s ease,
    filter 0.2s ease;

  -webkit-tap-highlight-color: transparent;

  @media (hover: hover) {
    &:hover:not(:disabled) {
      ${({ $variant, $bg, $hoverLabel }) =>
        $variant === 'filled'
          ? 'filter: brightness(1.25);'
          : `background: ${$variant === 'outlined' ? $bg + '22' : 'transparent'}; color: ${$hoverLabel}; --valet-text-color: ${$hoverLabel};`}
    }
  }

  &:active:not(:disabled) {
    transform: scale(0.96);
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ $ripple }) => $ripple};
    border-radius: inherit;
    transform: scale(0.95);
    opacity: 0;
    pointer-events: none;
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
  }
  &:active:not(:disabled)::after {
    opacity: 1;
    transform: scale(1);
  }
`;

/*───────────────────────────────────────────────────────────*/
const ButtonImpl = <E extends React.ElementType = 'button'>(
  props: PolymorphicProps<E, ButtonOwnProps>,
  ref: PolymorphicRef<E>,
) => {
  const {
    variant = 'filled',
    size = 'md',
    color,
    intent,
    fullWidth = false,
    preset: p,
    className,
    children,
    sx,
    ...rest
  } = props as ButtonOwnProps & { as?: E } & Record<string, unknown>;
  const { theme } = useTheme();
  const map = createSizeMap(theme);
  let geom: { padV: string; padH: string; font: string; height: string };

  if (typeof size === 'number') {
    const h = `${size}px`;
    geom = {
      padV: theme.spacing(1),
      padH: theme.spacing(1),
      font: '1rem',
      height: h,
    };
  } else if (map[size as ButtonSize]) {
    geom = map[size as ButtonSize];
  } else {
    geom = {
      padV: theme.spacing(1),
      padH: theme.spacing(1),
      font: '1rem',
      height: size as string,
    };
  }

  const { padV, padH, font, height } = geom;

  const padRule =
    variant === 'outlined' ? `calc(${padV} - 1px) calc(${padH} - 1px)` : `${padV} ${padH}`;

  const minW = `calc(${height} * 2)`;

  // Map intent to theme color
  const intentToColor = (i?: Intent): string | undefined => {
    if (!i) return undefined;
    const colors = theme.colors as Record<string, string>;
    const key = String(i);
    return colors[key] || undefined;
  };
  const resolveToken = (v?: string): string | undefined => {
    if (!v) return undefined;
    const colors = theme.colors as Record<string, string>;
    return colors[v] || v;
  };
  const equals = (a?: string, b?: string) => (a || '').toUpperCase() === (b || '').toUpperCase();
  const buttonTextFor = (bgHex: string) => {
    if (equals(bgHex, theme.colors.primary)) return theme.colors.primaryButtonText;
    if (equals(bgHex, theme.colors.secondary)) return theme.colors.secondaryButtonText;
    if (equals(bgHex, theme.colors.tertiary)) return theme.colors.tertiaryButtonText;
    if (equals(bgHex, theme.colors.error)) return theme.colors.errorText;
    return theme.colors.text;
  };

  const resolvedBg = resolveToken(color) || intentToColor(intent) || theme.colors.primary;
  const labelColor = variant === 'filled' ? buttonTextFor(resolvedBg) : resolvedBg;
  const hoverLabel = labelColor;
  const ripple = variant === 'filled' ? 'rgba(255,255,255,0.25)' : `${resolvedBg}33`;

  const presetClasses = p ? preset(p) : '';

  // Intent CSS variables contract
  const makeMix = (a: string, b: string, w: number) => toHex(mix(toRgb(a), toRgb(b), w));
  const intentBg = resolvedBg;
  const intentFg = labelColor;
  const intentBorder =
    variant === 'outlined' ? resolvedBg : makeMix(resolvedBg, theme.colors.text, 0.25);
  const intentFocus = theme.colors.primary; // theme focus token
  const intentBgHover =
    variant === 'filled' ? makeMix(resolvedBg, labelColor, 0.15) : 'transparent';
  const intentBgActive =
    variant === 'filled' ? makeMix(resolvedBg, labelColor, 0.25) : 'transparent';
  const intentFgDisabled = makeMix(labelColor, theme.colors.background, 0.5);

  const childArray = React.Children.toArray(children);
  const grouped: React.ReactNode[] = [];
  let buffer = '';

  childArray.forEach((node, i) => {
    if (typeof node === 'string' || typeof node === 'number') {
      buffer += node;
    } else {
      if (buffer) {
        grouped.push(
          <Typography
            key={`text-${i}`}
            variant='button'
            bold
            fontSize={font}
            noSelect
          >
            {buffer}
          </Typography>,
        );
        buffer = '';
      }
      grouped.push(node);
    }
  });

  if (buffer) {
    grouped.push(
      <Typography
        key='text-final'
        variant='button'
        bold
        fontSize={font}
        noSelect
      >
        {buffer}
      </Typography>,
    );
  }

  const content = grouped;

  // Polymorphic semantics: ensure non-interactive roots behave as buttons
  const asTag = (props as unknown as { as?: React.ElementType }).as as unknown as
    | string
    | undefined;
  const interactiveFallback = asTag && asTag !== 'button' && asTag !== 'a';
  const roleProps: Record<string, unknown> = {};
  const elementProps: Record<string, unknown> = { ...(rest as Record<string, unknown>) };
  const origOnKeyDown = (rest as Record<string, unknown>)['onKeyDown'] as
    | React.KeyboardEventHandler
    | undefined;
  if (interactiveFallback) {
    roleProps.role = (rest as Record<string, unknown>)['role'] ?? 'button';
    roleProps.tabIndex = (rest as Record<string, unknown>)['tabIndex'] ?? 0;
    roleProps.onKeyDown = ((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        (e.currentTarget as HTMLElement).click();
      }
      origOnKeyDown?.(e);
    }) as React.KeyboardEventHandler;
  }
  // Default button type to avoid implicit form submission; omit type for anchors
  if (asTag === 'a') {
    delete (elementProps as Record<string, unknown>)['type'];
  } else if ((elementProps as Record<string, unknown>)['type'] == null) {
    (elementProps as Record<string, unknown>)['type'] = 'button';
  }
  if (process.env.NODE_ENV !== 'production') {
    if (asTag === 'a' && !(rest as Record<string, unknown>)['href']) {
      console.warn('Button: `as="a"` provided without `href`. Provide href or use a <button>.');
    }
    const providedRole = (rest as Record<string, unknown>)['role'] as string | undefined;
    if (asTag === 'a' && (rest as Record<string, unknown>)['href'] && providedRole === 'button') {
      console.warn(
        'Button: role="button" on <a href> contradicts native link semantics. Remove the role.',
      );
    }
    if ((!asTag || asTag === 'button') && providedRole === 'link') {
      console.warn('Button: role="link" on <button> contradicts native button semantics.');
    }
  }

  return (
    <Root
      {...(elementProps as object)}
      {...roleProps}
      ref={ref as unknown as React.Ref<HTMLButtonElement>}
      data-valet-component='Button'
      data-disabled={(rest as Record<string, unknown>)['disabled'] ? 'true' : 'false'}
      data-state={(rest as Record<string, unknown>)['disabled'] ? 'disabled' : 'enabled'}
      style={
        {
          '--valet-text-color': labelColor,
          '--valet-intent-bg': intentBg,
          '--valet-intent-fg': intentFg,
          '--valet-intent-border': intentBorder,
          '--valet-intent-focus': intentFocus,
          '--valet-intent-bg-hover': intentBgHover,
          '--valet-intent-bg-active': intentBgActive,
          '--valet-intent-fg-disabled': intentFgDisabled,
          ...(sx as object),
        } as React.CSSProperties
      }
      className={[presetClasses, className].filter(Boolean).join(' ')}
      $variant={variant}
      $height={height}
      $padRule={padRule}
      $font={font}
      $minW={minW}
      $bg={resolvedBg}
      $label={labelColor}
      $hoverLabel={hoverLabel}
      $strokeW={theme.stroke(1)}
      $radius={theme.radius(1)}
      $ripple={ripple}
      $full={fullWidth}
    >
      {content}
    </Root>
  );
};

export const Button = createPolymorphicComponent<'button', ButtonOwnProps>(ButtonImpl);

export default Button;
