// ─────────────────────────────────────────────────────────────
// src/components/layout/Box.tsx  | valet
// width modes: content-left (default), content-right, centered, full
// patch: ensure background/text overrides always apply (inline style when set)
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable, SpacingProps, Sx } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';
import {
  createPolymorphicComponent,
  type PolymorphicProps,
  type PolymorphicRef,
} from '../../system/polymorphic';

export interface BoxOwnProps extends Presettable, Pick<SpacingProps, 'pad' | 'compact'> {
  background?: string | undefined;
  textColor?: string | undefined;
  /** Center inner content (layout inside the box) */
  centerContent?: boolean;
  /** Stretch to 100% width of container when true */
  fullWidth?: boolean;
  /** Horizontal placement of the box when not fullWidth */
  alignX?: 'left' | 'right' | 'center';
  /** Inline styles (with CSS var support) */
  sx?: Sx;
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
  /* Allow parents (Grid adaptive) to relax height if needed */
  max-height: var(--valet-box-max-h, 100%);
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

const BoxImpl = <E extends React.ElementType = 'div'>(
  props: PolymorphicProps<E, BoxOwnProps>,
  ref: PolymorphicRef<E>,
) => {
  const {
    preset: p,
    className,
    background,
    textColor,
    centerContent,
    fullWidth = false,
    alignX,
    compact,
    pad: padProp,
    sx,
    ...rest
  } = props as unknown as BoxOwnProps & { as?: E } & Record<string, unknown>;
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

  const internalCenter = !!centerContent;
  const normalizedAlign: 'left' | 'right' | 'center' = (alignX ?? 'left') as
    | 'left'
    | 'right'
    | 'center';

  // Promote background/text overrides to inline style so they always win the cascade.
  // Never clobber an explicit style prop from the caller.
  const inlineStyle: React.CSSProperties & Record<string, string | number> = {
    ...(sx || {}),
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
      {...(rest as object)}
      ref={ref as unknown as React.Ref<HTMLDivElement>}
      data-valet-component='Box'
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

export const Box = createPolymorphicComponent<'div', BoxOwnProps>(BoxImpl);

export default Box;
