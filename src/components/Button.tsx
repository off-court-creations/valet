// ─────────────────────────────────────────────────────────────
// src/components/Button.tsx  | valet
// theme-aware button with variants and sizes
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import type { Theme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
export type ButtonVariant = 'contained' | 'outlined';
export type ButtonSize    = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Presettable {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Stretch to container width when true */
  fullWidth?: boolean;
}

/* Size map -------------------------------------------------*/
const createSizeMap = (theme: Theme) => ({
  sm: { padV: theme.spacing.sm, padH: theme.spacing.md, font: '0.75rem',  height: '2rem'  },
  md: { padV: theme.spacing.sm, padH: theme.spacing.lg, font: '0.875rem', height: '2.5rem'},
  lg: { padV: theme.spacing.md, padH: theme.spacing.lg, font: '1rem',     height: '3rem'  },
} as const);

/* Styled base ---------------------------------------------*/
const BaseBtn = styled('button')<{
  $variant: ButtonVariant;
  $height: string;
  $padRule: string;
  $font: string;
  $minW: string;
  $primary: string;
  $themeText: string;
  $primaryText: string;
  $ripple: string;
  $fullWidth?: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;

  position: relative;
  overflow: hidden;

  height: ${({ $height }) => $height};
  min-width: ${({ $minW }) => $minW};
  padding: ${({ $padRule }) => $padRule};
  box-sizing: border-box;

  /* Prevent flex-column stretch unless fullWidth requested */
  align-self: ${({ $fullWidth }) => ($fullWidth ? 'stretch' : 'flex-start')};
  width: ${({ $fullWidth }) => ($fullWidth ? '100%' : 'auto')};

  border-radius: 4px;
  border: ${({ $variant }) =>
    $variant === 'outlined' ? '1px solid var(--valet-text-color, currentColor)' : 'none'};

  background: ${({ $variant, $primary }) =>
    $variant === 'contained' ? $primary : 'transparent'};

  color: ${({ $variant, $themeText }) =>
    $variant === 'contained'
      ? $themeText
      : 'var(--valet-text-color, ' + $themeText + ')'};

  font-size: ${({ $font }) => $font};
  font-weight: 600;
  cursor: pointer;

  transition: background 0.2s ease, color 0.2s ease,
    filter 0.2s ease, transform 0.1s ease;

  user-select: none;
  -webkit-user-select: none;
  -ms-user-select: none;

  &:hover:not(:disabled) {
    ${({ $variant, $primary, $primaryText }) =>
      $variant === 'contained'
        ? 'filter: brightness(1.25);'
        : `
          background: ${$primary};
          color: ${$primaryText};
        `}
  }

  &:active:not(:disabled) { transform: scale(0.96); }
  &:disabled { opacity: 0.5; cursor: default; }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ $ripple }) => $ripple};
    border-radius: inherit;
    opacity: 0;
    transform: scale(0.95);
    pointer-events: none;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }

  /* Ripple now suppressed on disabled buttons */
  &:active:not(:disabled)::after { opacity: 1; transform: scale(1); }
`;

/* Component -----------------------------------------------*/
export const Button: React.FC<ButtonProps> = ({
  variant = 'contained',
  size = 'md',
  fullWidth = false,
  preset: p,
  className,
  children,
  ...props
}) => {
  const { theme } = useTheme();
  const { padV, padH, font, height } = createSizeMap(theme)[size];

  const padRule =
    variant === 'outlined'
      ? `calc(${padV} - 1px) calc(${padH} - 1px)`
      : `${padV} ${padH}`;

  const minW = `calc(${height} * 2)`;
  const rippleColor =
    variant === 'contained'
      ? 'rgba(255,255,255,0.25)'
      : 'rgba(0,0,0,0.1)';

  const presetClasses = p ? preset(p) : '';

  return (
    <BaseBtn
      type="button"
      {...props}
      $variant={variant}
      $height={height}
      $padRule={padRule}
      $font={font}
      $minW={minW}
      $primary={theme.colors.primary}
      $themeText={theme.colors.text}
      $primaryText={theme.colors.primaryText}
      $ripple={rippleColor}
      $fullWidth={fullWidth}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      {children}
    </BaseBtn>
  );
};

export default Button;
