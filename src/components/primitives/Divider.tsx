// ─────────────────────────────────────────────────────────────
// src/components/primitives/Divider.tsx  | valet
// theme-aware line separator with spacing ergonomics
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable, SpacingProps, Space, Sx } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';

export type DividerOrientation = 'horizontal' | 'vertical';

export interface DividerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'color' | 'style'>,
    Presettable,
    Pick<SpacingProps, 'pad' | 'compact'> {
  /** Orientation of the divider line. */
  orientation?: DividerOrientation;
  /** Explicit color; defaults to theme text colour against background. */
  lineColor?: string | undefined;
  /** Thickness of the line; number uses theme.stroke(n), string passes through. */
  thickness?: number | string;
  /** Length along the main axis; number ⇒ px, string passes through. */
  length?: number | string | undefined;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/* Wrapper provides spacing envelope; child renders the actual line.
   This prevents padding from inflating the visible thickness. */
const Wrap = styled('div')<{
  $pad: string;
  $orient: DividerOrientation;
  $len?: string;
}>`
  box-sizing: border-box;
  padding: ${({ $pad }) => $pad};
  display: block;
  ${({ $orient, $len }) => ($orient === 'vertical' && !$len ? 'align-self: stretch;' : '')}
`;

const Line = styled('div')<{
  $orient: DividerOrientation;
  $color: string;
  $thick: string;
  $len?: string;
}>`
  background: ${({ $color }) => $color};
  box-sizing: border-box;
  ${({ $orient, $thick, $len }) =>
    $orient === 'horizontal'
      ? `height: ${$thick}; width: ${$len ?? '100%'};`
      : `width: ${$thick}; height: ${$len ?? '100%'};`}
`;

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  lineColor,
  thickness = 2,
  length,
  pad: padProp,
  compact,
  preset: p,
  className,
  sx,
  ...rest
}) => {
  const { theme } = useTheme();

  // Default color uses divider token via CSS var, with a theme fallback.
  const color =
    lineColor ?? (`var(--valet-divider, ${theme.colors.divider ?? theme.colors.text})` as string);
  // Prefer the divider stroke CSS var so surfaces can coordinate line thickness.
  // If a number is provided, treat it as a multiplier of the base divider stroke.
  const thick = (() => {
    if (typeof thickness === 'number') {
      const base = `var(--valet-divider-stroke, ${theme.stroke(1)})` as string;
      return thickness === 1 ? base : (`calc(${base} * ${thickness})` as string);
    }
    return String(thickness);
  })();
  const len =
    length === undefined ? undefined : typeof length === 'number' ? `${length}px` : String(length);

  const pad = resolveSpace(padProp as Space | undefined, theme, compact, 0);
  const presetClass = p ? preset(p) : '';

  return (
    <Wrap
      $pad={pad}
      $orient={orientation}
      $len={len}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={sx}
    >
      <Line
        role='separator'
        aria-orientation={orientation}
        $orient={orientation}
        $color={color}
        $thick={thick}
        $len={len}
        {...rest}
      />
    </Wrap>
  );
};

export default Divider;
