// ─────────────────────────────────────────────────────────────
// src/components/fields/IconButton.tsx  | valet
// strict‑optional clean build
// ─────────────────────────────────────────────────────────────
import React, { ReactElement, SVGProps } from 'react';
import { styled }              from '../../css/createStyled';
import { useTheme }            from '../../system/themeStore';
import type { Theme }          from '../../system/themeStore';
import { preset }              from '../../css/stylePresets';
import type { Presettable }    from '../../types';
import { Icon }                from '../primitives/Icon';

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */
export type IconButtonVariant = 'contained' | 'outlined';
export type IconButtonSize    = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    Presettable {
  variant?: IconButtonVariant;
  size?: IconButtonSize | number | string;
  icon?: string;
  svg?: string | ReactElement<SVGProps<SVGSVGElement>>;
  /** Colour override for the glyph */
  iconColor?: string | undefined;
}

/*───────────────────────────────────────────────────────────*/
/* Geometry map                                              */
type Geometry = { d: string; icon: string };
const geom: (t: Theme) => Record<IconButtonSize, Geometry> = () => ({
  xs: { d: '1.5rem', icon: '0.75rem' },
  sm: { d: '2rem', icon: '1rem'   },
  md: { d: '3rem', icon: '1.5rem'},
  lg: { d: '4rem', icon: '2rem' },
  xl: { d: '5rem', icon: '2.5rem' },
});

/*───────────────────────────────────────────────────────────*/
/* Styled “skin” – colours, hover, ripple, **not** size      */
const Skin = styled('button')<{
  $variant: IconButtonVariant;
  $primary: string;
  $text: string;
  $primaryText: string;
  $ripple: string;
}>`
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
  variant = 'contained',
  size    = 'md',
  icon,
  svg,
  iconColor,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const sizes = geom(theme);

  let diam: string;
  let iconSz: string;

  if (typeof size === 'number') {
    diam = `${size}px`;
    iconSz = `calc(${diam} * 0.45)`;
  } else if (sizes[size as IconButtonSize]) {
    ({ d: diam, icon: iconSz } = sizes[size as IconButtonSize]);
  } else {
    diam = size;
    iconSz = `calc(${diam} * 0.45)`;
  }

  const ripple =
    variant === 'contained'
      ? 'rgba(255,255,255,0.25)'
      : 'rgba(0,0,0,0.1)';

  const presetClasses = p ? preset(p) : '';

  const geomStyle: React.CSSProperties = {
    width       : diam,
    height      : diam,
    minWidth    : diam,
    minHeight   : diam,
    borderRadius: '50%',
  };

  return (
    <Skin
      type="button"
      {...rest}
      onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
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