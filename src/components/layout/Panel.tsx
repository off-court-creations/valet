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
import type { Presettable, SpacingProps, Sx } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';

export type PanelVariant = 'main' | 'alt';

export interface PanelProps
  extends Omit<React.ComponentProps<'div'>, 'style'>,
    Presettable,
    Pick<SpacingProps, 'pad' | 'compact'> {
  variant?: PanelVariant;
  fullWidth?: boolean;
  /** Explicit background override */
  background?: string | undefined;
  /** Centre contents & propagate intent via CSS var */
  centerContent?: boolean;
  /** Horizontal placement of the panel when not fullWidth */
  alignX?: 'left' | 'right' | 'center' | 'centered';
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
  $outline?: string;
  $strokeW: string;
  $bg?: string;
  $text?: string;
  $pad: string;
}>`
  box-sizing: border-box;
  vertical-align: top;

  display: ${({ $center, $full }) => ($center ? 'flex' : $full ? 'block' : 'inline-block')};
  width: ${({ $full }) => ($full ? '100%' : 'auto')};
  align-self: ${({ $full }) => ($full ? 'stretch' : 'flex-start')};
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

  ${({ $center }) =>
    $center &&
    `
      justify-content: center;
      align-items: center;
    `}

  /* Background handling ------------------------------------- */
  ${({ $variant, $bg }) =>
    $bg &&
    `
      background: ${$variant === 'main' ? $bg : 'transparent'};
      --valet-bg: ${$bg};
    `}

  /* Variant “alt” gets outline ------------------------------ */
  ${({ $variant, $outline, $strokeW }) =>
    $variant === 'alt' && $outline ? `border: ${$strokeW} solid ${$outline};` : ''}

  ${({ $text }) =>
    $text &&
    `
      color: ${$text};
      --valet-text-color: ${$text};
    `}

  ${({ $center }) => $center !== undefined && `--valet-centered: ${$center ? '1' : '0'};`}
`;

export const Panel: React.FC<PanelProps> = ({
  variant = 'main',
  fullWidth = false,
  centerContent,
  alignX,
  preset: p,
  className,
  sx,
  background,
  compact,
  pad: padProp,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const hasBgProp = typeof background === 'string';
  const hasPresetBg = p ? presetHas(p, 'background') : false;

  /* Resolve background */
  const bg: string | undefined = hasBgProp
    ? background!
    : !hasPresetBg && variant === 'main'
      ? theme.colors.backgroundAlt
      : undefined;

  /* Derive legible text colour */
  let textColour: string | undefined;
  if (bg) {
    textColour =
      bg === theme.colors.primary
        ? theme.colors.primaryText
        : bg === theme.colors.secondary
          ? theme.colors.secondaryText
          : bg === theme.colors.tertiary
            ? theme.colors.tertiaryText
            : bg === theme.colors.backgroundAlt
              ? theme.colors.primaryText
              : theme.colors.text;
  }

  const pad = resolveSpace(padProp, theme, compact, 1);
  const presetClasses = p ? preset(p) : '';

  // Normalize alignX with Box semantics, keep 'centered' as alias for 'center'.
  const normalizedAlign: 'left' | 'right' | 'center' = (() => {
    const raw = (alignX ?? 'left') as 'left' | 'right' | 'center' | 'centered';
    return raw === 'centered' ? 'center' : (raw as 'left' | 'right' | 'center');
  })();

  return (
    <Base
      {...rest}
      $variant={variant}
      $full={fullWidth}
      $center={centerContent}
      $alignX={normalizedAlign}
      $outline={theme.colors.backgroundAlt}
      $strokeW={theme.stroke(1)}
      $bg={bg}
      $text={textColour}
      $pad={pad}
      style={sx}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      {children}
    </Base>
  );
};

export default Panel;
