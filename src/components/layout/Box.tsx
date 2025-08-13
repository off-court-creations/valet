// ─────────────────────────────────────────────────────────────
// src/components/layout/Box.tsx  | valet
// width modes: content-left (default), content-right, centered, full
// patch: ensure background/text overrides always apply (inline style when set)
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable, SpacingProps } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';

export interface BoxProps
  extends React.ComponentProps<'div'>,
    Presettable,
    Pick<SpacingProps, 'pad' | 'compact'> {
  background?: string | undefined;
  textColor?: string | undefined;
  /** Center inner content (layout inside the box) */
  centerContent?: boolean;
  /** Stretch to 100% width of container when true */
  fullWidth?: boolean;
  /** Horizontal placement of the box when not fullWidth */
  alignX?: 'left' | 'right' | 'center' | 'centered';
  /** Deprecated: old prop name retained for BC */
  centered?: boolean;
}

const Base = styled('div')<{
  $bg?: string;
  $text?: string;
  $centerContent?: boolean;
  $full?: boolean;
  $alignX: 'left' | 'right' | 'center';
  $pad: string;
}>`
  box-sizing: border-box;
  vertical-align: top;

  /* Sizing and layout */
  display: ${({ $centerContent }) => ($centerContent ? 'flex' : 'block')};
  width: ${({ $full }) => ($full ? '100%' : 'max-content')};
  align-self: ${({ $full }) => ($full ? 'stretch' : 'flex-start')};
  /* Anchor when in content mode: occupy intrinsic width and push to edge */
  margin-left: ${({ $full, $alignX }) =>
    $full ? '0' : $alignX === 'right' ? 'auto' : $alignX === 'center' ? 'auto' : '0'};
  margin-right: ${({ $full, $alignX }) =>
    $full ? '0' : $alignX === 'left' ? 'auto' : $alignX === 'center' ? 'auto' : '0'};

  /* Boundary guards */
  max-width: 100%;
  max-height: 100%;
  min-width: 0;
  min-height: 0;

  padding: ${({ $pad }) => $pad};

  ${({ $centerContent }) =>
    $centerContent &&
    `
      justify-content: center;
      align-items: center;
    `}

  ${({ $bg }) => $bg && `background: ${$bg}; --valet-bg: ${$bg};`}  
  ${({ $text }) => $text && `color: ${$text}; --valet-text-color: ${$text};`}
  ${({ $centerContent }) =>
    $centerContent !== undefined && `--valet-centered: ${$centerContent ? '1' : '0'};`}
`;

export const Box: React.FC<BoxProps> = ({
  preset: p,
  className,
  background,
  textColor,
  centerContent,
  fullWidth = false,
  alignX,
  centered, // deprecated alias
  compact,
  pad: padProp,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const presetClass = p ? preset(p) : '';

  let resolvedText = textColor;
  if (!resolvedText && background) {
    resolvedText =
      background === theme.colors.primary
        ? theme.colors.primaryText
        : background === theme.colors.secondary
          ? theme.colors.secondaryText
          : background === theme.colors.tertiary
            ? theme.colors.tertiaryText
            : undefined;
  }

  const pad = resolveSpace(padProp, theme, compact, 1);

  // Back-compat + normalization
  const internalCenter = centerContent ?? centered ?? false;
  const normalizedAlign: 'left' | 'right' | 'center' = (() => {
    const raw = (alignX ?? 'left') as 'left' | 'right' | 'center' | 'centered';
    if (raw === 'centered') return 'center';
    return (raw as 'left' | 'right' | 'center') || 'left';
  })();

  // Promote background/text overrides to inline style so they always win the cascade.
  // Never clobber an explicit style prop from the caller.
  const inlineStyle: React.CSSProperties & Record<string, string | number> = {
    ...(style || {}),
  };

  if (background && inlineStyle.background == null) {
    inlineStyle.background = background;
    // Expose as CSS var for children that key off --valet-bg
    (inlineStyle as Record<string, string | number>)['--valet-bg'] = background;
  }
  if (resolvedText && inlineStyle.color == null) {
    inlineStyle.color = resolvedText;
    (inlineStyle as Record<string, string | number>)['--valet-text-color'] = resolvedText;
  }

  return (
    <Base
      {...rest}
      $bg={background}
      $text={resolvedText}
      $centerContent={internalCenter}
      $full={!!fullWidth}
      $alignX={normalizedAlign}
      $pad={pad}
      style={inlineStyle}
      className={[presetClass, className].filter(Boolean).join(' ')}
    />
  );
};

export default Box;
