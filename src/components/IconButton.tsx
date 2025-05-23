// ─────────────────────────────────────────────────────────────
// src/components/IconButton.tsx
// ─────────────────────────────────────────────────────────────
import React, { ReactElement }  from 'react';
import { styled }               from '../css/createStyled';
import { useTheme }             from '../system/themeStore';
import type { Theme }           from '../system/themeStore';
import { preset }               from '../css/stylePresets';
import type { Presettable }     from '../types';
import { Icon }                 from './Icon';

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */
export type IconButtonVariant = 'contained' | 'outlined';
export type IconButtonSize    = 'sm' | 'md' | 'lg';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Presettable {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  icon?: string;
  svg?: string | ReactElement<SVGSVGElement>;
  iconColor?: string;
}

/*───────────────────────────────────────────────────────────*/
/* Geometry map                                              */
const geom = (t: Theme) => ({
  sm: { d: '2.25rem', icon: '1rem'   },
  md: { d: '2.75rem', icon: '1.25rem'},
  lg: { d: '3.25rem', icon: '1.5rem' },
} as const);

/*───────────────────────────────────────────────────────────*/
/* Styled “skin” – colours, hover, ripple, **not** size      */
const Skin = styled('button')<{
  $variant: IconButtonVariant;
  $primary: string;
  $text: string;
  $primaryText: string;
  $ripple: string;
}>`
  /* layout already locked in inline style – keep only cosmetics here */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;

  border: ${({ $variant, $text }) =>
    $variant === 'outlined' ? `1px solid ${$text}` : 'none'};

  background: ${({ $variant, $primary }) =>
    $variant === 'contained' ? $primary : 'transparent'};

  color: ${({ $variant, $text, $primaryText }) =>
    $variant === 'contained' ? $primaryText : $text};

  cursor: pointer;
  transition:
    background 0.2s ease,
    color      0.2s ease,
    filter     0.2s ease,
    transform  0.1s ease;

  user-select: none;

  &:hover:not(:disabled) {
    ${({ $variant, $primary, $primaryText }) =>
      $variant === 'contained'
        ? 'filter: brightness(1.25);'
        : `
          background: ${$primary};
          color: ${$primaryText};
        `}
  }

  &:active:not(:disabled)   { transform: scale(0.94); }
  &:disabled                { opacity: 0.5; cursor: default; }

  /* ripple -------------------------------------------------------------- */
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ $ripple }) => $ripple};
    border-radius: 50%;
    opacity: 0;
    transform: scale(0.8);
    pointer-events: none;
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  &:active:not(:disabled)::after { opacity: 1; transform: scale(1); }
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const IconButton: React.FC<IconButtonProps> = ({
  variant   = 'contained',
  size      = 'md',
  icon,
  svg,
  iconColor,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const { d: diam, icon: iconSz } = geom(theme)[size];

  const ripple =
    variant === 'contained'
      ? 'rgba(255,255,255,0.25)'
      : 'rgba(0,0,0,0.1)';

  const presetClasses = p ? preset(p) : '';

  /* Inline geometry => guaranteed before paint */
  const geomStyle: React.CSSProperties = {
    width      : diam,
    height     : diam,
    minWidth   : diam,
    minHeight  : diam,
    borderRadius: '50%',              // never see a square
  };

  return (
    <Skin
      type="button"
      {...rest}
      $variant={variant}
      $primary={theme.colors.primary}
      $text={theme.colors.text}
      $primaryText={theme.colors.primaryText}
      $ripple={ripple}
      style={{ ...geomStyle, ...style }}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      <Icon
        icon={icon}
        svg={svg}
        size={iconSz}
        color={iconColor}
        aria-hidden={rest['aria-label'] ? undefined : true}
      />
    </Skin>
  );
};

export default IconButton;
