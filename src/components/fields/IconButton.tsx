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
import {
  createPolymorphicComponent,
  type PolymorphicProps,
  type PolymorphicRef,
} from '../../system/polymorphic';
import { toRgb, mix, toHex } from '../../helpers/color';

/*───────────────────────────────────────────────────────────*/
/* Public API                                                */
export type IconButtonVariant = 'filled' | 'outlined' | 'plain';
export type IconButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type Intent =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | (string & {});

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'style'>,
    Presettable {
  variant?: IconButtonVariant;
  size?: IconButtonSize | number | string;
  icon?: string;
  svg?: string | ReactElement<SVGProps<SVGSVGElement>>;
  intent?: Intent;
  /** Explicit color override (theme token or CSS color). */
  color?: string;
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
  $bg: string; // resolved color
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

  border: ${({ $variant, $bg, $strokeW }) =>
    $variant === 'outlined' ? `${$strokeW} solid ${$bg}` : 'none'};

  background: ${({ $variant, $bg }) => ($variant === 'filled' ? $bg : 'transparent')};

  color: ${({ $variant, $bg, $btnText }) => ($variant === 'filled' ? $btnText : $bg)};

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
      $variant === 'filled'
        ? 'filter: brightness(1.25);'
        : `background: ${$variant === 'outlined' ? $bg + '22' : 'transparent'}; color: ${$btnText};`}
  }

  /* Keyboard focus should mirror hover visuals for discoverability */
  &:focus-visible:not(:disabled) {
    ${({ $variant, $bg, $btnText }) =>
      $variant === 'filled'
        ? 'filter: brightness(1.25);'
        : `background: ${$variant === 'outlined' ? $bg + '22' : 'transparent'}; color: ${$btnText};`}
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
const IconButtonImpl = <E extends React.ElementType = 'button'>(
  props: PolymorphicProps<E, IconButtonProps>,
  ref: PolymorphicRef<E>,
) => {
  const {
    variant = 'filled',
    size = 'md',
    icon,
    svg,
    intent,
    color,
    preset: p,
    className,
    sx,
    ...rest
  } = props as IconButtonProps & { as?: E } & Record<string, unknown>;
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

  const resolveToken = (v?: string): string | undefined => {
    if (!v) return undefined;
    const val = (theme.colors as Record<string, string>)[v as string];
    return typeof val === 'string' ? val : v;
  };
  const intentToColor = (i?: Intent): string | undefined => {
    if (!i) return undefined;
    const val = (theme.colors as Record<string, string>)[String(i)];
    return typeof val === 'string' ? val : undefined;
  };
  const bg = resolveToken(color) ?? intentToColor(intent) ?? theme.colors.primary;
  const equals = (a?: string, b?: string) => (a || '').toUpperCase() === (b || '').toUpperCase();
  const buttonTextFor = (bgHex: string) => {
    if (equals(bgHex, theme.colors.primary)) return theme.colors.primaryButtonText;
    if (equals(bgHex, theme.colors.secondary)) return theme.colors.secondaryButtonText;
    if (equals(bgHex, theme.colors.tertiary)) return theme.colors.tertiaryButtonText;
    // Fallbacks for arbitrary backgrounds: use general text token
    return theme.colors.text;
  };
  const btnText = buttonTextFor(bg);

  const ripple = variant === 'filled' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.1)';

  const presetClasses = p ? preset(p) : '';

  const geomStyle: React.CSSProperties = {
    width: diam,
    height: diam,
    minWidth: diam,
    minHeight: diam,
    borderRadius: '50%',
  };

  // Intent CSS variables contract
  const makeMix = (a: string, b: string, w: number) => toHex(mix(toRgb(a), toRgb(b), w));
  const intentBg = bg;
  const intentFg = variant === 'filled' ? btnText : bg;
  const intentBorder = variant === 'outlined' ? bg : intentBg;
  const intentFocus = theme.colors.primary;
  const intentBgHover = variant === 'filled' ? makeMix(bg, btnText, 0.15) : 'transparent';
  const intentBgActive = variant === 'filled' ? makeMix(bg, btnText, 0.25) : 'transparent';
  const intentFgDisabled = makeMix(intentFg, theme.colors.background, 0.5);

  const asTag = (props as unknown as { as?: React.ElementType }).as as unknown as
    | string
    | undefined;
  const elementProps: Record<string, unknown> = { ...rest };
  const roleProps: Record<string, unknown> = {};
  if (asTag === 'a') delete (elementProps as Record<string, unknown>)['type'];
  const interactiveFallback = asTag && asTag !== 'button' && asTag !== 'a';
  if (interactiveFallback) {
    roleProps['role'] = (rest as Record<string, unknown>)['role'] ?? 'button';
    roleProps['tabIndex'] = (rest as Record<string, unknown>)['tabIndex'] ?? 0;
    const orig = (rest as Record<string, unknown>)['onKeyDown'] as
      | React.KeyboardEventHandler
      | undefined;
    roleProps['onKeyDown'] = ((e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        (e.currentTarget as HTMLElement).click();
      }
      orig?.(e);
    }) as React.KeyboardEventHandler;
  }
  // Default to type="button" for native buttons when no type is provided
  if (asTag !== 'a' && (elementProps as Record<string, unknown>)['type'] == null) {
    (elementProps as Record<string, unknown>)['type'] = 'button';
  }

  if (process.env.NODE_ENV !== 'production') {
    // Dev-time a11y: icon-only controls must have an accessible name
    const hasAriaLabel = Boolean((elementProps as Record<string, unknown>)['aria-label']);
    const hasLabelledBy = Boolean((elementProps as Record<string, unknown>)['aria-labelledby']);
    const hasTitle = Boolean((elementProps as Record<string, unknown>)['title']);
    if (!hasAriaLabel && !hasLabelledBy && !hasTitle) {
      console.warn(
        'IconButton: provide an accessible name via aria-label, aria-labelledby, or title.',
      );
    }
    const providedRole = (rest as Record<string, unknown>)['role'] as string | undefined;
    if (asTag === 'a' && (rest as Record<string, unknown>)['href'] && providedRole === 'button') {
      console.warn(
        'IconButton: role="button" on <a href> contradicts native link semantics. Remove the role.',
      );
    }
    if ((!asTag || asTag === 'button') && providedRole === 'link') {
      console.warn('IconButton: role="link" on <button> contradicts native button semantics.');
    }
  }
  return (
    <Skin
      {...elementProps}
      {...roleProps}
      ref={ref as unknown as React.Ref<HTMLButtonElement>}
      data-valet-component='IconButton'
      data-disabled={(rest as Record<string, unknown>)['disabled'] ? 'true' : 'false'}
      data-state={(rest as Record<string, unknown>)['disabled'] ? 'disabled' : 'enabled'}
      onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
      $variant={variant}
      $bg={bg}
      $text={theme.colors.text}
      $btnText={btnText}
      $ripple={ripple}
      $strokeW={theme.stroke(1)}
      style={
        {
          ...geomStyle,
          '--valet-intent-bg': intentBg,
          '--valet-intent-fg': intentFg,
          '--valet-intent-border': intentBorder,
          '--valet-intent-focus': intentFocus,
          '--valet-intent-bg-hover': intentBgHover,
          '--valet-intent-bg-active': intentBgActive,
          '--valet-intent-fg-disabled': intentFgDisabled,
          ...sx,
        } as React.CSSProperties
      }
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      <Icon
        icon={icon}
        svg={svg}
        size={iconSz}
        color={variant === 'filled' ? btnText : bg}
        aria-hidden={(elementProps as Record<string, unknown>)['aria-label'] ? undefined : true}
      />
    </Skin>
  );
};

export const IconButton = createPolymorphicComponent<'button', IconButtonProps>(IconButtonImpl);

export default IconButton;
