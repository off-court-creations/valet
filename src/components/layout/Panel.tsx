// ─────────────────────────────────────────────────────────────
// src/components/layout/Panel.tsx  | valet
// overhaul: internal scrollbars & boundary guards – 2025‑07‑17
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

export type PanelVariant = 'main' | 'alt';

export interface PanelProps
  extends React.ComponentProps<'div'>,
    Presettable {
  variant?: PanelVariant;
  fullWidth?: boolean;
  /** Explicit background override */
  background?: string | undefined;
  /** Centre contents & propagate intent via CSS var */
  centered?: boolean;
  /** Remove built‑in margin and padding */
  compact?: boolean;
}

const Base = styled('div')<{
  $variant: PanelVariant;
  $full?: boolean;
  $center?: boolean;
  $outline?: string;
  $bg?: string;
  $text?: string;
  $margin: string;
  $pad: string;
}>`
  box-sizing: border-box;
  vertical-align: top;

  display      : ${({ $center, $full }) =>
    $center ? 'flex' : $full ? 'block' : 'inline-block'};
  width        : ${({ $full }) => ($full ? '100%' : 'auto')};
  align-self   : ${({ $full }) => ($full ? 'stretch' : 'flex-start')};

  /* Boundary guards */
  max-width  : 100%;
  max-height : 100%;
  min-width  : 0;
  min-height : 0;

  /* Prevent horizontal scrolling */
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE & Edge */
  &::-webkit-scrollbar { display: none; }

  margin       : ${({ $margin }) => $margin};
  & > * {
    padding: ${({ $pad }) => $pad};
  }

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
  ${({ $variant, $outline }) =>
    $variant === 'alt' && $outline ? `border: 1px solid ${$outline};` : ''}

  ${({ $text }) =>
    $text &&
    `
      color: ${$text};
      --valet-text-color: ${$text};
    `}

  ${({ $center }) =>
    $center !== undefined && `--valet-centered: ${$center ? '1' : '0'};`}
`;

export const Panel: React.FC<PanelProps> = ({
  variant = 'main',
  fullWidth = false,
  centered,
  preset: p,
  className,
  style,
  background,
  compact,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const hasBgProp = typeof background === 'string';

  /* Resolve background */
  const bg: string | undefined = hasBgProp
    ? background!
    : variant === 'main'
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
        : theme.colors.text;
  }

  const pad = theme.spacing(1);
  const margin = compact ? '0' : pad;
  const presetClasses = p ? preset(p) : '';

  return (
    <Base
      {...rest}
      $variant={variant}
      $full={fullWidth}
      $center={centered}
      $outline={theme.colors.backgroundAlt}
      $bg={bg}
      $text={textColour}
      $margin={margin}
      $pad={pad}
      style={style}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      {children}
    </Base>
  );
};

export default Panel;
