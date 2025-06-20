// ─────────────────────────────────────────────────────────────
// src/components/Button.tsx | valet
// Theme-aware <Button /> – refined outlined-token behaviour
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled }          from '../css/createStyled';
import { useTheme }        from '../system/themeStore';
import type { Theme }      from '../system/themeStore';
import { preset }          from '../css/stylePresets';
import type { Presettable }from '../types';

/*───────────────────────────────────────────────────────────*/
export type ButtonVariant = 'contained' | 'outlined';
export type ButtonSize    = 'sm' | 'md' | 'lg';
export type ButtonToken   = 'primary' | 'secondary' | 'tertiary';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Presettable {
  /** Background colour or token (affects hover for outlined) */
  color?     : ButtonToken | string;
  /** Idle label / outline colour                             */
  textColor? : ButtonToken | string;
  variant?   : ButtonVariant;
  size?      : ButtonSize;
  /** Stretch to container width                              */
  fullWidth? : boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Size map                                                  */
const createSizeMap = (theme: Theme) => ({
  sm: { padV: theme.spacing.sm, padH: theme.spacing.md, font: '0.75rem',  height: '2rem'  },
  md: { padV: theme.spacing.sm, padH: theme.spacing.lg, font: '0.875rem', height: '2.5rem'},
  lg: { padV: theme.spacing.md, padH: theme.spacing.lg, font: '1rem',     height: '3rem'  },
} as const);

/*───────────────────────────────────────────────────────────*/
/* Styled primitive                                          */
const Root = styled('button')<{
  $variant    : ButtonVariant;
  $height     : string;
  $padRule    : string;
  $font       : string;
  $minW       : string;
  $bg         : string;
  $label      : string;
  $hoverLabel : string;
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

  /* Stretch ------------------------------------------------*/
  align-self: ${({ $full }) => ($full ? 'stretch' : 'flex-start')};
  width     : ${({ $full }) => ($full ? '100%'   : 'auto')};

  /* Visuals ------------------------------------------------*/
  border-radius: 4px;
  border: ${({ $variant }) =>
    $variant === 'outlined' ? '1px solid currentColor' : 'none'};

  background: ${({ $variant, $bg }) =>
    $variant === 'contained' ? $bg : 'transparent'};

  color: ${({ $label }) => $label};

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

  /* Hover --------------------------------------------------*/
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

  /* Ripple -------------------------------------------------*/
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
/* Component                                                 */
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
  const { padV, padH, font, height } = createSizeMap(theme)[size];

  const padRule =
    variant === 'outlined'
      ? `calc(${padV} - 1px) calc(${padH} - 1px)`
      : `${padV} ${padH}`;

  const minW = `calc(${height} * 2)`;

  /* Helpers ------------------------------------------------*/
  const isToken = (v: any): v is ButtonToken =>
    v === 'primary' || v === 'secondary' || v === 'tertiary';

  /* ------------------------------------------------------- */
  /* Palette token resolution                                */
  /* – If colour isn’t specified, default to “primary”.       */
  /* ------------------------------------------------------- */
  const paletteToken: ButtonToken | null =
    color === undefined          ? 'primary'          :
    isToken(color)               ? color              :
                                   null;

  /* ------------------------------------------------------- */
  /* Background (contained or hover-fill for outlined)       */
  /* ------------------------------------------------------- */
  const bg = paletteToken
    ? theme.colors[paletteToken]
    : color
      ? (isToken(color) ? theme.colors[color] : color)
      : theme.colors.primary;

  /* ------------------------------------------------------- */
  /* Idle label / outline colour                             */
  /* ------------------------------------------------------- */
  let label: string;

  if (textColor) {
    /* Explicit override ----------------------------------- */
    label = isToken(textColor)
      ? theme.colors[`${textColor}Text`]
      : textColor;

  } else if (variant === 'outlined') {
    /* Outlined idle state --------------------------------- */
    if (color && isToken(color)) {
      /* Token supplied → stay neutral                       */
      label = mode === 'dark' ? '#eee' : '#111';
    } else if (color) {
      /* Custom hex → outline adopts that colour             */
      label = isToken(color) ? theme.colors[color] : color;
    } else {
      /* Default neutral                                     */
      label = mode === 'dark' ? '#eee' : '#111';
    }

  } else if (paletteToken) {
    /* Contained default label (contrast token text)         */
    label = theme.colors[`${paletteToken}ButtonText`];
  } else {
    label = theme.colors.text;
  }

  /* ------------------------------------------------------- */
  /* Hover label for outlined                                */
  /* ------------------------------------------------------- */
  const hoverLabel = variant === 'outlined' && paletteToken
    ? theme.colors[`${paletteToken}ButtonText`]
    : label;

  /* ------------------------------------------------------- */
  /* Ripple tint                                             */
  /* ------------------------------------------------------- */
  const ripple =
    variant === 'contained'
      ? 'rgba(255,255,255,0.25)'
      : paletteToken
          ? `${theme.colors[paletteToken]}33` // ~20 % alpha
          : 'rgba(0,0,0,0.1)';

  const presetClasses = p ? preset(p) : '';

  return (
    <Root
      {...rest}
      style={{ '--valet-text-color': label } as React.CSSProperties}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      $variant={variant}
      $height={height}
      $padRule={padRule}
      $font={font}
      $minW={minW}
      $bg={bg}
      $label={label}
      $hoverLabel={hoverLabel}
      $ripple={ripple}
      $full={fullWidth}
    >
      {children}
    </Root>
  );
};

export default Button;
