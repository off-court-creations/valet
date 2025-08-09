// ─────────────────────────────────────────────────────────────
// src/components/layout/Box.tsx  | valet
// overhaul: internal scrollbars & boundary guards – 2025‑07‑17
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

export interface BoxProps extends React.ComponentProps<'div'>, Presettable {
  background?: string | undefined;
  textColor?: string | undefined;
  centered?: boolean;
  compact?: boolean;
}

const Base = styled('div')<{
  $bg?: string;
  $text?: string;
  $center?: boolean;
  $margin: string;
  $pad: string;
}>`
  box-sizing: border-box;

  /* Boundary & overflow guards */
  max-width: 100%;
  max-height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;

  display: ${({ $center }) => ($center ? 'flex' : 'block')};
  margin: ${({ $margin }) => $margin};
  & > * {
    padding: ${({ $pad }) => $pad};
  }

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
  compact,
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

  const pad = theme.spacing(1);
  const margin = compact ? '0' : pad;

  return (
    <Base
      {...rest}
      $bg={background}
      $text={resolvedText}
      $center={centered}
      $margin={margin}
      $pad={pad}
      style={style}
      className={[presetClass, className].filter(Boolean).join(' ')}
    />
  );
};

export default Box;
