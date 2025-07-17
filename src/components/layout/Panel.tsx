// ─────────────────────────────────────────────────────────────
// src/components/layout/Panel.tsx  | valet
// strict‑optional safe typings
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled }            from '../../css/createStyled';
import { useTheme }          from '../../system/themeStore';
import { preset }            from '../../css/stylePresets';
import type { Presettable }  from '../../types';

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
  /** Centre contents & propagate intent via CSS var */
  centered?: boolean;
  /** Remove built-in margin and padding */
  compact?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitive                                          */
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
  width        : ${({ $full }) => ($full ? '100%'  : 'auto')};
  align-self   : ${({ $full }) => ($full ? 'stretch' : 'flex-start')};
  margin       :
    ${({ $margin, $full }) => ($full ? `${$margin} 0` : $margin)};
  & > * {
    padding: ${({ $pad }) => $pad};
  }

  ${({ $center }) =>
    $center &&
    `
      justify-content: center;
      align-items: center;
    `}

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

  ${({ $center }) =>
    $center !== undefined && `--valet-centered: ${$center ? '1' : '0'};`}
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Panel: React.FC<PanelProps> = ({
  variant   = 'main',
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
  const pad = theme.spacing(1);
  const margin = compact ? '0' : pad;

  return (
    <Base
      {...rest}
      data-full-width={fullWidth || undefined}
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
