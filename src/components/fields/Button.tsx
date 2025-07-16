// ─────────────────────────────────────────────────────────────
// src/components/fields/Button.tsx | valet
// Theme-aware <Button /> – automatic Typography wrapping
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled }           from '../../css/createStyled';
import { useTheme }         from '../../system/themeStore';
import type { Theme }       from '../../system/themeStore';
import { preset }           from '../../css/stylePresets';
import { Typography }       from '../primitives/Typography';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
export type ButtonVariant = 'contained' | 'outlined';
export type ButtonSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonToken   = 'primary' | 'secondary' | 'tertiary';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Presettable {
  color?     : ButtonToken | string;
  textColor? : ButtonToken | string;
  variant?   : ButtonVariant;
  size?      : ButtonSize | number | string;
  fullWidth? : boolean;
}

/*───────────────────────────────────────────────────────────*/
const createSizeMap = (t: Theme) => ({
  xs: { padV: t.spacing(1), padH: t.spacing(1), font: '1rem', height: '1.5rem' },
  sm: { padV: t.spacing(1), padH: t.spacing(1), font: '1rem', height: '2rem'   },
  md: { padV: t.spacing(1), padH: t.spacing(1), font: '1rem', height: '2.5rem' },
  lg: { padV: t.spacing(1), padH: t.spacing(1), font: '1rem', height: '3rem'   },
  xl: { padV: t.spacing(1), padH: t.spacing(1), font: '1rem', height: '3.5rem' },
} as const);

/*───────────────────────────────────────────────────────────*/
const Root = styled('button')<{
  $variant    : ButtonVariant;
  $height     : string;
  $padRule    : string;
  $font       : string;
  $minW       : string;
  $bg         : string;
  $label      : string;
  $hoverLabel : string;
  $outline    : string;
  $ripple     : string;
  $full       : boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;

  height   : ${({ $height })  => $height};
  min-width: ${({ $minW })    => $minW};
  padding  : ${({ $padRule }) => $padRule};
  box-sizing: border-box;

  align-self: ${({ $full }) => ($full ? 'stretch' : 'flex-start')};
  width     : ${({ $full }) => ($full ? '100%'   : 'auto')};

  border-radius: 4px;
  border: ${({ $variant, $outline }) =>
    $variant === 'outlined' ? `1px solid ${$outline}` : 'none'};

  background: ${({ $variant, $bg }) =>
    $variant === 'contained' ? $bg : 'transparent'};

  color      : ${({ $label }) => $label};
  font-size  : ${({ $font }) => $font};
  font-weight: 600;
  line-height: 1;
  cursor     : pointer;
  transition :
    background 0.2s ease,
    color      0.2s ease,
    transform  0.1s ease,
    filter     0.2s ease;

  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;
  -webkit-touch-callout: none;

  @media (hover: hover) {
    &:hover:not(:disabled) {
      ${({ $variant, $bg, $hoverLabel }) =>
        $variant === 'contained'
          ? 'filter: brightness(1.25);'
          : `
            background: ${$bg};
            color: ${$hoverLabel};
          `}
    }
  }

  &:active:not(:disabled) { transform: scale(0.96); }
  &:disabled              { opacity: 0.5; cursor: default; }

  &::after {
    content : '';
    position: absolute;
    inset   : 0;
    background    : ${({ $ripple }) => $ripple};
    border-radius : inherit;
    transform     : scale(0.95);
    opacity       : 0;
    pointer-events: none;
    transition    : transform 0.3s ease, opacity 0.3s ease;
  }
  &:active:not(:disabled)::after {
    opacity: 1;
    transform: scale(1);
  }
`;

/*───────────────────────────────────────────────────────────*/
export const Button: React.FC<ButtonProps> = ({
  variant   = 'contained',
  size      = 'md',
  color,
  textColor,
  fullWidth = false,
  preset: p,
  className,
  children,
  ...rest
}) => {
  const { theme, mode } = useTheme();
  const map = createSizeMap(theme);
  let geom: { padV: string; padH: string; font: string; height: string };

  if (typeof size === 'number') {
    const h = `${size}px`;
    geom = { padV: theme.spacing(1), padH: theme.spacing(1), font: '1rem', height: h };
  } else if (map[size as ButtonSize]) {
    geom = map[size as ButtonSize];
  } else {
    geom = { padV: theme.spacing(1), padH: theme.spacing(1), font: '1rem', height: size as string };
  }

  const { padV, padH, font, height } = geom;

  const padRule =
    variant === 'outlined'
      ? `calc(${padV} - 1px) calc(${padH} - 1px)`
      : `${padV} ${padH}`;

  const minW = `calc(${height} * 2)`;

  const isToken = (v: any): v is ButtonToken =>
    v === 'primary' || v === 'secondary' || v === 'tertiary';

  const paletteToken: ButtonToken | null =
    color === undefined ? 'primary'
    : isToken(color)     ? color
    : null;

  const bg = paletteToken
    ? theme.colors[paletteToken]
    : color
      ? (isToken(color) ? theme.colors[color] : color)
      : theme.colors.primary;

  const outlineNeutral = mode === 'dark' ? '#eee' : '#111';

  const resolveText = (v: ButtonToken | string) =>
    isToken(v) ? theme.colors[`${v}Text`] : v;

  let labelColor: string;

  if (variant === 'outlined') {
    labelColor = textColor
      ? resolveText(textColor)
      : outlineNeutral;
  } else {
    labelColor = textColor
      ? resolveText(textColor)
      : paletteToken
        ? theme.colors[`${paletteToken}ButtonText`]
        : theme.colors.text;
  }

  const hoverLabel =
    variant === 'outlined'
      ? (textColor
          ? resolveText(textColor)
          : paletteToken
            ? theme.colors[`${paletteToken}ButtonText`]
            : '#fff')
      : labelColor;

  const ripple =
    variant === 'contained'
      ? 'rgba(255,255,255,0.25)'
      : paletteToken
        ? `${theme.colors[paletteToken]}33`
        : 'rgba(0,0,0,0.1)';

  const presetClasses = p ? preset(p) : '';

  const isPrimitive =
    typeof children === 'string' || typeof children === 'number';

  const content = isPrimitive ? (
    <Typography
      variant="button"
      bold
      fontSize={font}
      style={{ pointerEvents: 'none' }}
    >
      {children}
    </Typography>
  ) : (
    children
  );

  return (
    <Root
      {...rest}
      onContextMenu={(e) => e.preventDefault()}
      style={{ '--valet-text-color': labelColor } as React.CSSProperties}
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
      $ripple={ripple}
      $full={fullWidth}
    >
      {content}
    </Root>
  );
};

export default Button;
