// ─────────────────────────────────────────────────────────────
// src/components/primitives/Typography.tsx | valet
// patch: force text wrapping; add noSelect prop – 2025‑07‑17
// ─────────────────────────────────────────────────────────────
import React from 'react';
import type { JSX } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { useSurface } from '../../system/surfaceStore';
import { shallow } from 'zustand/shallow';
import { preset } from '../../css/stylePresets';
import type { Presettable, Sx } from '../../types';
import type { Variant as VariantType, WeightAlias } from '../../types/typography';

export type Variant = VariantType;

export interface TypographyProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'style'>,
    Presettable {
  variant?: Variant;
  bold?: boolean; // deprecated in favor of `weight`
  italic?: boolean;
  weight?: number | WeightAlias;
  tracking?: number | 'tight' | 'normal' | 'loose';
  leading?: number | 'tight' | 'normal' | 'loose';
  optical?: 'auto' | number | 'none';
  fluid?: boolean;
  centered?: boolean;
  noSelect?: boolean;
  fontSize?: string;
  scale?: number;
  autoSize?: boolean;
  color?: string;
  /** Choose a theme font family */
  family?: 'heading' | 'body' | 'mono' | 'button';
  fontFamily?: string;
  /** Control whitespace handling for multi-line/code text */
  whitespace?: 'normal' | 'pre' | 'pre-wrap' | 'pre-line';
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

const mapping: Record<Variant, keyof JSX.IntrinsicElements> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  body: 'p',
  subtitle: 'span',
  button: 'span',
};

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  bold = false,
  italic = false,
  weight,
  tracking,
  leading,
  optical,
  fluid,
  fontSize,
  scale,
  autoSize = false,
  color,
  family,
  fontFamily,
  centered,
  noSelect = false,
  whitespace = 'normal',
  preset: p,
  className,
  sx,
  children,
  ...props
}) => {
  const Tag = mapping[variant];
  const { theme } = useTheme();
  const breakpoint = useSurface((s) => s.breakpoint, shallow);

  const defaultSize = theme.typography[variant].md;
  const fluidToken = theme.typographyFluid?.[variant];
  const fluidSize = (() => {
    if (!fluidToken) return null;
    const min = fluidToken.min;
    const max = fluidToken.max;
    const vwStart = fluidToken.vwFrom;
    const vwEnd = fluidToken.vwTo;
    // build clamp(min, calc(intercept + slope * vw), max)
    // slope = (max - min) / (vwEnd - vwStart). Parse assuming rem units are ok to calc together.
    const parseRem = (v: string) => {
      const m = v.trim().match(/([0-9]*\.?[0-9]+)rem/);
      return m ? parseFloat(m[1]) : NaN;
    };
    const minRem = parseRem(min);
    const maxRem = parseRem(max);
    if (!isFinite(minRem) || !isFinite(maxRem) || vwEnd === vwStart) return null;
    const slope = ((maxRem - minRem) / (vwEnd - vwStart)) * 100; // per vw
    const intercept = minRem - (slope / 100) * vwStart;
    const middle = `calc(${intercept.toFixed(4)}rem + ${slope.toFixed(4)}vw)`;
    return `clamp(${min}, ${middle}, ${max})`;
  })();

  let size = autoSize ? theme.typography[variant][breakpoint] : defaultSize;
  if (fluid && fluidToken && fluidSize) size = fluidSize;
  if (scale != null) size = `calc(${size} * ${scale})`;
  if (fontSize) size = fontSize;

  const presetClasses = p ? preset(p) : '';

  // Resolve font-weight: alias → number; explicit numeric prevails
  const aliasMap = theme.weightAliases ?? { regular: 400, medium: 500, semibold: 600, bold: 700 };
  const resolvedWeight = (() => {
    if (typeof weight === 'number') return Math.max(100, Math.min(900, Math.round(weight)));
    if (weight) return aliasMap[weight as WeightAlias] ?? 400;
    return bold ? 700 : 400;
  })();

  // Resolve letter-spacing (tracking)
  const impliedFamily: 'heading' | 'body' | 'mono' | 'button' =
    variant === 'button' ? 'button' : variant.startsWith('h') ? 'heading' : 'body';
  const effectiveFamily = (family as 'heading' | 'body' | 'mono' | 'button') || impliedFamily;

  const tokenTracking = theme.letterSpacing?.[variant];
  const familyTrackingRaw = theme.typographyFamilies?.[effectiveFamily]?.letterSpacing as
    | string
    | number
    | Partial<Record<Variant, string | number>>
    | undefined;
  const familyTrackingForVariant = (() => {
    if (familyTrackingRaw == null) return undefined;
    if (typeof familyTrackingRaw === 'number') return `${familyTrackingRaw}px`;
    if (typeof familyTrackingRaw === 'string') return familyTrackingRaw;
    const v = familyTrackingRaw[variant];
    if (v == null) return undefined;
    return typeof v === 'number' ? `${v}px` : v;
  })();
  const resolvedTracking = (() => {
    if (typeof tracking === 'number') return `${tracking}px`;
    if (tracking === 'tight') return '-0.01em';
    if (tracking === 'loose') return '0.02em';
    if (tracking === 'normal') return 'normal';
    const tokenValue =
      typeof tokenTracking === 'number' ? `${tokenTracking}px` : (tokenTracking as string | undefined);
    return tokenValue ?? familyTrackingForVariant ?? 'normal';
  })();

  // Resolve line-height (leading)
  const tokenLeading = theme.lineHeight?.[variant];
  const familyLeadingRaw = theme.typographyFamilies?.[effectiveFamily]?.lineHeight as
    | number
    | Partial<Record<Variant, number>>
    | undefined;
  const familyLeadingForVariant = (() => {
    if (familyLeadingRaw == null) return undefined;
    if (typeof familyLeadingRaw === 'number') return familyLeadingRaw;
    const v = familyLeadingRaw[variant];
    return v == null ? undefined : v;
  })();
  const resolvedLeading = (() => {
    if (typeof leading === 'number') return leading;
    if (leading === 'tight') return 1.2;
    if (leading === 'loose') return 1.6;
    if (leading === 'normal') return 1.4;
    return tokenLeading ?? familyLeadingForVariant ?? (variant === 'button' ? 1 : 1.4);
  })();

  const opticalSetting = (optical ?? theme.fontOpticalSizing ?? 'auto') as 'auto' | number | 'none';

  const Component = React.useMemo(
    () => styled(Tag)<{
      $variant: Variant;
      $color?: string;
      $fontFamily?: string;
      $family?: 'heading' | 'body' | 'mono' | 'button';
      $size: string;
      $bold: boolean; // retained for backwards compat in styles
      $italic: boolean;
      $center?: boolean;
      $noSelect: boolean;
      $ws: 'normal' | 'pre' | 'pre-wrap' | 'pre-line';
      $weight: number;
      $tracking: string;
      $leading: number;
      $optical: 'auto' | number | 'none';
    }>`
      margin: 0;
      color: ${({ $color }) => $color || 'var(--valet-text-color, inherit)'};
      font-size: ${({ $size }) => $size};
      /* Prefer CSS var to maximize style cache hits */
      --valet-font-weight: ${({ $weight, $bold }) => ($bold ? 700 : $weight)};
      --valet-font-tracking: ${({ $tracking }) => $tracking};
      --valet-font-leading: ${({ $leading }) => $leading};
      font-weight: var(--valet-font-weight);
      font-style: ${({ $italic }) => ($italic ? 'italic' : 'normal')};
      line-height: var(--valet-font-leading);
      letter-spacing: var(--valet-font-tracking);
      font-family: ${({ $fontFamily, $family, $variant }) =>
        $fontFamily ||
        ($family
          ? `var(--valet-font-${$family})`
          : `var(--valet-font-${
              $variant === 'button' ? 'button' : $variant.startsWith('h') ? 'heading' : 'body'
            })`)};
      ${({ $optical }) =>
        $optical === 'auto'
          ? 'font-optical-sizing: auto;'
          : $optical === 'none'
            ? 'font-optical-sizing: none;'
            : typeof $optical === 'number'
              ? `font-variation-settings: 'opsz' ${$optical};`
              : ''};
      ${({ $center }) =>
        $center &&
        `
            text-align: center;
            align-self: center;
            margin-inline: auto;
          `};
      ${({ $noSelect }) =>
        $noSelect &&
        `
            user-select: none;
            -webkit-user-select: none;
            -ms-user-select: none;
            -webkit-touch-callout: none;
          `};

      /* Newline & wrapping guards */
      white-space: ${({ $ws }) => $ws};
      overflow-wrap: anywhere;
      word-break: break-word;
      max-width: 100%;
    `,
    [Tag],
  );

  return (
    <Component
      {...props}
      $color={color}
      $fontFamily={fontFamily}
      $family={family}
      $variant={variant}
      $size={size}
      $bold={bold}
      $italic={italic}
      $center={centered}
      $noSelect={noSelect}
      $ws={whitespace}
      $weight={resolvedWeight}
      $tracking={resolvedTracking}
      $leading={resolvedLeading}
      $optical={opticalSetting}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      style={sx}
    >
      {children}
    </Component>
  );
};

export default Typography;
