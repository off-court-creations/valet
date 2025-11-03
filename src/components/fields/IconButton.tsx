// ─────────────────────────────────────────────────────────────
// src/components/fields/IconButton.tsx  | valet
// strict‑optional clean build
// ─────────────────────────────────────────────────────────────
import React, { ReactElement, SVGProps } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable, Sx } from '../../types';
import { Icon } from '../primitives/Icon';

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */
export type IconButtonVariant = 'contained' | 'outlined';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'>,
    Presettable {
  variant?: IconButtonVariant;
  size?: IconButtonSize | number | string;
  icon?: string;
  svg?: string | ReactElement<SVGProps<SVGSVGElement>>;
  /**
   * Foreground colour override for the glyph.
   * @default Derived from the resolved background token (e.g., primary → primaryButtonText)
   */
  iconColor?: string | undefined;
  /**
   * Background colour token or CSS colour for the button surface.
   * Accepts theme colour tokens ('primary' | 'secondary' | 'tertiary') or any CSS colour.
   * For `contained`, it is used as the fill. For `outlined`, it applies on hover/focus
   * alongside the matching button text token for the glyph colour.
   */
  background?: string | undefined;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Geometry map                                              */
type Geometry = { d: string; icon: string };
const geom: () => Record<IconButtonSize, Geometry> = () => ({
  xs: { d: '1.5rem', icon: '0.75rem' },
  sm: { d: '2rem', icon: '1rem' },
  md: { d: '3rem', icon: '1.5rem' },
  lg: { d: '4rem', icon: '2rem' },
  xl: { d: '5rem', icon: '2.5rem' },
});

/*───────────────────────────────────────────────────────────*/
/* Styled “skin” – colours, hover, ripple, **not** size      */
const Skin = styled('button')<{
  $variant: IconButtonVariant;
  $bg: string; // background token (contained, or outlined:hover)
  $text: string; // base text colour
  $btnText: string; // button text token (e.g., primaryButtonText)
  $ripple: string;
  $strokeW: string;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;

  border: ${({ $variant, $text, $strokeW }) =>
    $variant === 'outlined' ? `${$strokeW} solid ${$text}` : 'none'};

  background: ${({ $variant, $bg }) => ($variant === 'contained' ? $bg : 'transparent')};

  color: ${({ $variant, $text, $btnText }) => ($variant === 'contained' ? $btnText : $text)};

  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    filter 0.2s ease,
    transform 0.1s ease;

  /* Prevent iOS text selection / callout on long-press */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &:hover:not(:disabled) {
    ${({ $variant, $bg, $btnText }) =>
      $variant === 'contained'
        ? 'filter: brightness(1.25);'
        : `
          background: ${$bg};
          color: ${$btnText};
        `}
  }

  /* Keyboard focus should mirror hover visuals for discoverability */
  &:focus-visible:not(:disabled) {
    ${({ $variant, $bg, $btnText }) =>
      $variant === 'contained'
        ? 'filter: brightness(1.25);'
        : `
          background: ${$bg};
          color: ${$btnText};
        `}
  }

  &:active:not(:disabled) {
    transform: scale(0.94);
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }

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
/* Component                                                 */
export const IconButton: React.FC<IconButtonProps> = ({
  variant = 'contained',
  size = 'md',
  icon,
  svg,
  iconColor,
  background,
  preset: p,
  className,
  sx,
  ...rest
}) => {
  const { theme } = useTheme();
  const sizes = geom();

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

  // Resolve color tokens (accept token names like 'primary')
  const resolveToken = (v?: string): string | undefined => {
    if (!v) return undefined;
    const val = (theme.colors as Record<string, string>)[v as string];
    return typeof val === 'string' ? val : v;
  };

  const bg = resolveToken(background) ?? theme.colors.primary;
  const equals = (a?: string, b?: string) =>
    (a || '').toUpperCase() === (b || '').toUpperCase();
  const buttonTextFor = (bgHex: string) => {
    if (equals(bgHex, theme.colors.primary)) return theme.colors.primaryButtonText;
    if (equals(bgHex, theme.colors.secondary)) return theme.colors.secondaryButtonText;
    if (equals(bgHex, theme.colors.tertiary)) return theme.colors.tertiaryButtonText;
    // Fallbacks for arbitrary backgrounds: use general text token
    return theme.colors.text;
  };
  const btnText = buttonTextFor(bg);

  const ripple = variant === 'contained' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)';

  const presetClasses = p ? preset(p) : '';

  const geomStyle: React.CSSProperties = {
    width: diam,
    height: diam,
    minWidth: diam,
    minHeight: diam,
    borderRadius: '50%',
  };

  return (
    <Skin
      type='button'
      {...rest}
      onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
      $variant={variant}
      $bg={bg}
      $text={theme.colors.text}
      $btnText={btnText}
      $ripple={ripple}
      $strokeW={theme.stroke(1)}
      style={{ ...geomStyle, ...sx }}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      <Icon
        icon={icon}
        svg={svg}
        size={iconSz}
        color={resolveToken(iconColor)}
        aria-hidden={rest['aria-label'] ? undefined : true}
      />
    </Skin>
  );
};

export default IconButton;
