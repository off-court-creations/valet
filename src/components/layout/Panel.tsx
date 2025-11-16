// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// src/components/layout/Panel.tsx  | valet
// spacing refactor: container pad + compact – 2025‑08‑12
// patched: overflow/max-height via CSS vars for adaptive Grid behavior
// patched: support alignX like Box; rename centered→centerContent – 2025‑08‑20
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset, presetHas } from '../../css/stylePresets';
import { toRgb, mix, toHex } from '../../helpers/color';
//
import type { Presettable, SpacingProps, Sx } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';

export type PanelVariant = 'filled' | 'outlined' | 'plain';
type Intent =
  | 'default'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | (string & {});

export interface PanelProps
  extends Omit<React.ComponentProps<'div'>, 'style'>,
    Presettable,
    Pick<SpacingProps, 'pad' | 'compact' | 'density'> {
  /** Visual variant: filled | outlined | plain */
  variant?: PanelVariant;
  /** Semantic color intent; maps to theme tokens */
  intent?: Intent;
  /** Explicit color override (theme token name or CSS color) */
  color?: string | undefined;
  fullWidth?: boolean;
  /** Centre contents & propagate intent via CSS var */
  centerContent?: boolean;
  /** Horizontal placement of the panel when not fullWidth */
  alignX?: 'left' | 'right' | 'center';
  /**
   * Opt out of row height normalization (when a parent Grid enables it).
   * Defaults to true (normalize). Set to false to keep intrinsic heights.
   */
  normalizeRowHeight?: boolean;
}

/** Inline styles (with CSS var support) */
export interface PanelProps {
  sx?: Sx;
}

const Base = styled('div')<{
  $variant: PanelVariant;
  $full?: boolean;
  $center?: boolean;
  $alignX: 'left' | 'right' | 'center';
  $strokeW: string;
  $bg?: string;
  $text?: string;
  $border?: string;
  $pad: string;
  $noNormalize?: boolean;
}>`
  box-sizing: border-box;
  vertical-align: top;

  display: ${({ $center, $full }) => ($center ? 'flex' : $full ? 'block' : 'inline-block')};
  width: ${({ $full }) => ($full ? '100%' : 'auto')};
  /* Panels cooperate with Grid via CSS var to equalize row heights */
  align-self: var(--valet-panel-align-self, ${({ $full }) => ($full ? 'stretch' : 'flex-start')});
  /* Anchor when not full width */
  margin-left: ${({ $full, $alignX }) =>
    $full ? '0' : $alignX === 'right' ? 'auto' : $alignX === 'center' ? 'auto' : '0'};
  margin-right: ${({ $full, $alignX }) =>
    $full ? '0' : $alignX === 'left' ? 'auto' : $alignX === 'center' ? 'auto' : '0'};

  /* Boundary guards */
  max-width: 100%;
  /* Use CSS var so parents (e.g., Grid adaptive stack) can relax it */
  max-height: var(--valet-panel-max-h, 100%);
  min-width: 0;
  min-height: 0;

  /* Prevent horizontal scrolling */
  overflow-x: hidden;
  /* Use CSS var so parents can opt out of inner scroll on stack */
  overflow-y: var(--valet-panel-ov-y, auto);
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE & Edge */
  &::-webkit-scrollbar {
    display: none;
  }

  padding: ${({ $pad }) => $pad};

  /* Allow per-Panel opt-out by overriding the CSS var locally */
  ${({ $noNormalize }) => ($noNormalize ? `--valet-panel-align-self: flex-start;` : '')}

  ${({ $center }) =>
    $center &&
    `
      justify-content: center;
      align-items: center;
    `}

  /* Background / variant handling --------------------------- */
  ${({ $variant, $bg, $border, $strokeW }) => {
    if ($variant === 'filled') {
      return $bg ? `background: ${$bg}; --valet-bg: ${$bg};` : '';
    }
    if ($variant === 'outlined') {
      return $border ? `background: transparent; border: ${$strokeW} solid ${$border};` : '';
    }
    return 'background: transparent;';
  }}

  ${({ $text }) =>
    $text &&
    `
      color: ${$text};
      --valet-text-color: ${$text};
    `}

  ${({ $center }) => $center !== undefined && `--valet-centered: ${$center ? '1' : '0'};`}
`;

export const Panel: React.FC<PanelProps> = ({
  variant = 'filled',
  fullWidth = false,
  centerContent,
  alignX,
  normalizeRowHeight = true,
  preset: p,
  className,
  sx,
  color,
  intent,
  compact,
  pad: padProp,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const hasPresetBg = p ? presetHas(p, 'background') : false;

  // Resolve color override / intent into a background or border color
  const resolveToken = (v?: string): string | undefined => {
    if (!v) return undefined;
    const colors = theme.colors as Record<string, string>;
    return colors[v] || v;
  };
  const fromIntent = (i?: Intent): string | undefined => {
    if (!i) return undefined;
    const colors = theme.colors as Record<string, string>;
    return colors[String(i)];
  };
  const resolved = resolveToken(color) || fromIntent(intent);
  const bg: string | undefined =
    variant === 'filled'
      ? resolved || (!hasPresetBg ? theme.colors.backgroundAlt : undefined)
      : undefined;
  const borderColor: string | undefined =
    variant === 'outlined' ? resolved || theme.colors.divider : undefined;
  // Derive legible text colour for filled variant
  let textColour: string | undefined;
  if (variant === 'filled' && bg) {
    const eq = (x?: string, y?: string) => (x || '').toUpperCase() === (y || '').toUpperCase();
    if (eq(bg, theme.colors.primary)) textColour = theme.colors.primaryText;
    else if (eq(bg, theme.colors.secondary)) textColour = theme.colors.secondaryText;
    else if (eq(bg, theme.colors.tertiary)) textColour = theme.colors.tertiaryText;
    else if (eq(bg, theme.colors.error)) textColour = theme.colors.errorText;
    else if (eq(bg, theme.colors.backgroundAlt)) textColour = theme.colors.text;
    else textColour = theme.colors.text;
  }

  const compactEffective =
    compact || (rest as unknown as { density?: string }).density === 'compact';
  const pad = resolveSpace(padProp, theme, compactEffective, 1);
  const presetClasses = p ? preset(p) : '';

  // Normalize alignX with Box semantics
  const normalizedAlign: 'left' | 'right' | 'center' = (alignX ?? 'left') as
    | 'left'
    | 'right'
    | 'center';

  return (
    <Base
      {...rest}
      data-valet-component='Panel'
      $variant={variant}
      $full={fullWidth}
      $center={centerContent}
      $alignX={normalizedAlign}
      $strokeW={theme.stroke(1)}
      $bg={bg}
      $text={textColour}
      $border={borderColor}
      $pad={pad}
      $noNormalize={!normalizeRowHeight}
      style={
        {
          '--valet-intent-bg': bg ?? 'transparent',
          '--valet-intent-fg': textColour ?? theme.colors.text,
          '--valet-intent-border': borderColor ?? theme.colors.divider,
          '--valet-intent-focus': theme.colors.primary,
          '--valet-intent-bg-hover': bg
            ? toHex(mix(toRgb(bg), toRgb(textColour ?? theme.colors.text), 0.12))
            : 'transparent',
          '--valet-intent-bg-active': bg
            ? toHex(mix(toRgb(bg), toRgb(textColour ?? theme.colors.text), 0.2))
            : 'transparent',
          '--valet-intent-fg-disabled': toHex(
            mix(toRgb(textColour ?? theme.colors.text), toRgb(theme.colors.background), 0.5),
          ),
          ...(sx as object),
        } as React.CSSProperties
      }
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      {children}
    </Base>
  );
};

export default Panel;
