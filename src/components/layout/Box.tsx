// ─────────────────────────────────────────────────────────────
// src/components/layout/Box.tsx  | valet
// optional fullWidth; default inline sizing
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
  centered?: boolean;
  /** Stretch to 100% width of container when true */
  fullWidth?: boolean;
}

const Base = styled('div')<{
  $bg?: string;
  $text?: string;
  $center?: boolean;
  $full?: boolean;
  $pad: string;
}>`
  box-sizing: border-box;
  vertical-align: top;

  /* Sizing and layout */
  display: ${({ $center, $full }) => ($center ? 'flex' : $full ? 'block' : 'inline-block')};
  width: ${({ $full }) => ($full ? '100%' : 'auto')};
  align-self: ${({ $full }) => ($full ? 'stretch' : 'flex-start')};

  /* Boundary guards */
  max-width: 100%;
  max-height: 100%;
  min-width: 0;
  min-height: 0;

  padding: ${({ $pad }) => $pad};

  ${({ $center }) =>
    $center &&
    `
      justify-content: center;
      align-items: center;
    `}

  ${({ $bg }) => $bg && `background: ${$bg}; --valet-bg: ${$bg};`}  
  ${({ $text }) => $text && `color: ${$text}; --valet-text-color: ${$text};`}
  ${({ $center }) => $center !== undefined && `--valet-centered: ${$center ? '1' : '0'};`}
`;

export const Box: React.FC<BoxProps> = ({
  preset: p,
  className,
  background,
  textColor,
  centered,
  fullWidth = false,
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

  return (
    <Base
      {...rest}
      $bg={background}
      $text={resolvedText}
      $center={centered}
      $full={fullWidth}
      $pad={pad}
      style={style}
      className={[presetClass, className].filter(Boolean).join(' ')}
    />
  );
};

export default Box;
