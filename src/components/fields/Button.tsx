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

/*───────────────────────────────────────────────────────────*/
export type ButtonVariant = 'contained' | 'outlined';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonToken = 'primary' | 'secondary' | 'tertiary';

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'>,
    Presettable {
  color?: ButtonToken | string;
  textColor?: ButtonToken | string;
  variant?: ButtonVariant;
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
  $outline: string;
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
  border: ${({ $variant, $outline, $strokeW }) =>
    $variant === 'outlined' ? `${$strokeW} solid ${$outline}` : 'none'};

  background: ${({ $variant, $bg }) => ($variant === 'contained' ? $bg : 'transparent')};

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
        $variant === 'contained'
          ? 'filter: brightness(1.25);'
          : `
            background: ${$bg};
            color: ${$hoverLabel};
            --valet-text-color: ${$hoverLabel};
          `}
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
export const Button: React.FC<ButtonProps> = ({
  variant = 'contained',
  size = 'md',
  color,
  textColor,
  fullWidth = false,
  preset: p,
  className,
  children,
  sx,
  ...rest
}) => {
  const { theme, mode } = useTheme();
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

  const isToken = (v: unknown): v is ButtonToken =>
    typeof v === 'string' && (v === 'primary' || v === 'secondary' || v === 'tertiary');

  // Also allow direct theme color key names, e.g. 'primaryButtonText'.
  const resolveThemeColor = (key: string | undefined): string | undefined => {
    if (!key) return undefined;
    const colors = theme.colors as Record<string, string>;
    return colors[key] || undefined;
  };

  const paletteToken: ButtonToken | null =
    color === undefined ? 'primary' : isToken(color) ? color : null;

  // If `color` is a hex matching a theme token, infer the palette token so
  // the correct *ButtonText can be chosen by default.
  const inferTokenFromBg = (): ButtonToken | null => {
    const bgStr = (typeof color === 'string' ? (color as string) : '')?.toUpperCase?.() ?? '';
    const eq = (hex: string) => (hex || '').toUpperCase() === bgStr;
    if (eq(theme.colors.primary)) return 'primary';
    if (eq(theme.colors.secondary)) return 'secondary';
    if (eq(theme.colors.tertiary)) return 'tertiary';
    return null;
  };
  const paletteFromHex = paletteToken || inferTokenFromBg();

  const bg = paletteFromHex
    ? theme.colors[paletteFromHex]
    : color
      ? isToken(color)
        ? theme.colors[color]
        : color
      : theme.colors.primary;

  const outlineNeutral = mode === 'dark' ? '#eee' : '#111';

  // Resolve text color: support palette tokens ('primary' → primaryButtonText),
  // and direct theme color keys ('primaryButtonText').
  const resolveText = (v: ButtonToken | string) => {
    if (isToken(v)) return theme.colors[`${v}ButtonText`];
    const fromTheme = resolveThemeColor(v);
    return fromTheme ?? (v as string);
  };

  let labelColor: string;

  if (variant === 'outlined') {
    labelColor = textColor ? resolveText(textColor) : outlineNeutral;
  } else {
    labelColor = textColor
      ? resolveText(textColor)
      : paletteFromHex
        ? theme.colors[`${paletteFromHex}ButtonText`]
        : theme.colors.text;
  }

  const hoverLabel =
    variant === 'outlined'
      ? textColor
        ? resolveText(textColor)
        : paletteFromHex
          ? theme.colors[`${paletteFromHex}ButtonText`]
          : '#fff'
      : labelColor;

  const ripple =
    variant === 'contained'
      ? 'rgba(255,255,255,0.25)'
      : paletteToken
        ? `${theme.colors[paletteToken]}33`
        : 'rgba(0,0,0,0.1)';

  const presetClasses = p ? preset(p) : '';

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

  return (
    <Root
      {...rest}
      style={{ '--valet-text-color': labelColor, ...(sx as object) } as React.CSSProperties}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      $variant={variant}
      $height={height}
      $padRule={padRule}
      $font={font}
      $minW={minW}
      $bg={bg}
      $label={labelColor}
      $hoverLabel={hoverLabel}
      $outline={outlineNeutral}
      $strokeW={theme.stroke(1)}
      $radius={theme.radius(1)}
      $ripple={ripple}
      $full={fullWidth}
    >
      {content}
    </Root>
  );
};

export default Button;
