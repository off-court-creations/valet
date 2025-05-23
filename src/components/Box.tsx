// ─────────────────────────────────────────────────────────────
// src/components/Box.tsx
// valet Box – now respects background / color coming from presets
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
  background?: string;
  /** Explicit text-colour override */
  textColor?: string;
}

/*───────────────────────────────────────────────────────────────*/
/* Styled primitive                                              */
const Base = styled('div')<{
  $bg?: string;
  $text?: string;
}>`
  box-sizing: border-box;
  display: block;

  /* Only set when an override is supplied */
  ${({ $bg })   => $bg   && `background: ${$bg}; --valet-bg: ${$bg};`}
  ${({ $text }) => $text && `color: ${$text}; --valet-text-color: ${$text};`}
`;

/*───────────────────────────────────────────────────────────────*/
/* Component                                                     */
export const Box: React.FC<BoxProps> = ({
  preset: p,
  className,
  background,
  textColor,
  style,
  ...rest
}) => {
  const { theme }   = useTheme();
  const presetClass  = p ? preset(p) : '';

  /* Resolve text colour only when caller gives us a cue         */
  let resolvedText: string | undefined = textColor;

  if (!resolvedText && background) {
    resolvedText =
      background === theme.colors.primary   ? theme.colors.primaryText   :
      background === theme.colors.secondary ? theme.colors.secondaryText :
      background === theme.colors.tertiary  ? theme.colors.tertiaryText  :
      undefined; // let preset / cascade decide
  }

  return (
    <Base
      {...rest}
      $bg={background}
      $text={resolvedText}
      style={style}
      className={[presetClass, className].filter(Boolean).join(' ')}
    />
  );
};

export default Box;
