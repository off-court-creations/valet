// ─────────────────────────────────────────────────────────────
// src/components/Panel.tsx  | valet
// strict‑optional safe typings
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled }            from '../css/createStyled';
import { useTheme }          from '../system/themeStore';
import { preset }            from '../css/stylePresets';
import type { Presettable }  from '../types';

/*───────────────────────────────────────────────────────────*/
/* Public types                                              */
export type PanelVariant = 'main' | 'alt';

export interface PanelProps
  extends React.ComponentProps<'div'>,
    Presettable {
  variant?: PanelVariant;
  fullWidth?: boolean;
  /** Explicit background override */
  background?: string | undefined;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitive                                          */
const Base = styled('div')<{
  $variant: PanelVariant;
  $full?: boolean;
  $outline?: string;
  $bg?: string;
  $text?: string;
}>`
  box-sizing: border-box;
  vertical-align: top;

  display      : ${({ $full }) => ($full ? 'block' : 'inline-block')};
  width        : ${({ $full }) => ($full ? '100%'  : 'auto')};
  align-self   : ${({ $full }) => ($full ? 'stretch' : 'flex-start')};

  /* Only emit a background when we’ve actually been given one */
  ${({ $variant, $bg }) =>
    $bg &&
    `
      background: ${$variant === 'main' ? $bg : 'transparent'};
      --valet-bg: ${$bg};
    `}

  /* Variant “alt” gets a 1‑px outline */
  ${({ $variant, $outline }) =>
    $variant === 'alt' && $outline ? `border: 1px solid ${$outline};` : ''}

  ${({ $text }) =>
    $text &&
    `
      color: ${$text};
      --valet-text-color: ${$text};
    `}
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Panel: React.FC<PanelProps> = ({
  variant   = 'main',
  fullWidth = false,
  preset: p,
  className,
  style,
  background,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const hasPreset  = Boolean(p);
  const hasBgProp  = typeof background === 'string';

  /**
   * Decide what (if anything) to pass down as `$bg`.
   * – If caller passed `background`, honour it.
   * – Else, if *no* preset is applied and variant === 'main',
   *   fall back to theme.colors.backgroundAlt.
   * – Otherwise leave undefined so presets can paint freely.
   */
  const bg: string | undefined =
    hasBgProp
      ? background!
      : !hasPreset && variant === 'main'
        ? theme.colors.backgroundAlt
        : undefined;

  /* Only choose an explicit text colour when we also chose a bg */
  let textColour: string | undefined;
  if (bg) {
    textColour =
      bg === theme.colors.primary   ? theme.colors.primaryText   :
      bg === theme.colors.secondary ? theme.colors.secondaryText :
      bg === theme.colors.tertiary  ? theme.colors.tertiaryText  :
      theme.colors.text;
  }

  const presetClasses = p ? preset(p) : '';

  return (
    <Base
      {...rest}
      $variant={variant}
      $full={fullWidth}
      $outline={theme.colors.backgroundAlt}
      $bg={bg}
      $text={textColour}
      style={style}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      {children}
    </Base>
  );
};

export default Panel;
