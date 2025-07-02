// ─────────────────────────────────────────────────────────────
// src/components/Box.tsx  | valet
// patched for strict optional props
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────────*/
/* Public props                                                  */
export interface BoxProps
  extends React.ComponentProps<'div'>,
    Presettable {
  /** Explicit background override */
  background?: string | undefined;
  /** Explicit text-colour override */
  textColor?: string | undefined;
  /** Centre contents & propagate intent via CSS var */
  centered?: boolean;
}

/*───────────────────────────────────────────────────────────────*/
/* Styled primitive                                              */
const Base = styled('div')<{
  $bg?: string;
  $text?: string;
  $center?: boolean;
  $margin: string;
  $pad: string;
}>`
  box-sizing: border-box;
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

  /* Only set when an override is supplied -------------------- */
  ${({ $bg })   => $bg   && `background: ${$bg}; --valet-bg: ${$bg};`}
  ${({ $text }) => $text && `color: ${$text}; --valet-text-color: ${$text};`}

  /* Propagate centred intent ---------------------------------- */
  ${({ $center }) =>
    $center !== undefined && `--valet-centered: ${$center ? '1' : '0'};`}
`;

/*───────────────────────────────────────────────────────────────*/
/* Component                                                     */
export const Box: React.FC<BoxProps> = ({
  preset: p,
  className,
  background,
  textColor,
  centered,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const presetClass = p ? preset(p) : '';

  /* Derive an accessible text colour when only bg is supplied */
  let resolvedText = textColor;
  if (!resolvedText && background) {
    resolvedText =
      background === theme.colors.primary
        ? theme.colors.primaryText
        : background === theme.colors.secondary
        ? theme.colors.secondaryText
        : background === theme.colors.tertiary
        ? theme.colors.tertiaryText
        : undefined; // defer to cascade / presets
  }

  const gap = theme.spacing(1);

  return (
    <Base
      {...rest}
      $bg={background}
      $text={resolvedText}
      $center={centered}
      $margin={gap}
      $pad={gap}
      style={style}
      className={[presetClass, className].filter(Boolean).join(' ')}
    />
  );
};

export default Box;
