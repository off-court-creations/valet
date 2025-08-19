// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// src/components/layout/Stack.tsx  | valet
// overhaul: spacing refactor (container pad + gap, compact) – 2025-08-12
// patched: overflow/max-height via CSS vars to cooperate with Grid adaptive on iOS
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable, SpacingProps, Sx } from '../../types';
import { resolveSpace } from '../../utils/resolveSpace';

/*───────────────────────────────────────────────────────────*/
export interface StackProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    Presettable,
    SpacingProps {
  direction?: 'row' | 'column';
  /** If `true`, children wrap when they run out of space. Defaults to
   *  `true` for `row`, `false` for `column`. */
  wrap?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
const StackContainer = styled('div')<{
  $dir: 'row' | 'column';
  $gap: string;
  $wrap: boolean;
  $pad: string;
}>`
  display: flex;
  flex-direction: ${({ $dir }) => $dir};
  align-items: ${({ $dir }) => ($dir === 'row' ? 'center' : 'stretch')};
  gap: ${({ $gap }) => $gap};
  ${({ $wrap }) => ($wrap ? 'flex-wrap: wrap;' : '')};

  /* Boundary guards */
  max-width: 100%;
  /* Allow parents (Grid in adaptive portrait) to relax height */
  max-height: var(--valet-stack-max-h, 100%);
  min-width: 0;
  min-height: 0;

  /* No horizontal scrolling, vertical allowed */
  overflow-x: hidden;
  /* Allow parents to opt out of inner scroll when stacking */
  overflow-y: var(--valet-stack-ov-y, auto);

  /* Hide native scrollbars where supported */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE & Edge */
  &::-webkit-scrollbar {
    display: none;
  }

  box-sizing: border-box;
  padding: ${({ $pad }) => $pad};
`;

/*───────────────────────────────────────────────────────────*/
export const Stack: React.FC<StackProps> = ({
  direction = 'column',
  gap: gapProp,
  pad: padProp,
  wrap,
  compact,
  preset: p,
  className,
  children,
  sx,
  ...rest
}) => {
  const { theme } = useTheme();

  const gap = resolveSpace(gapProp, theme, compact, 1);

  /* Enable wrapping by default for rows */
  const shouldWrap = typeof wrap === 'boolean' ? wrap : direction === 'row';

  const presetClasses = p ? preset(p) : '';
  const pad = resolveSpace(padProp, theme, compact, 1);

  return (
    <StackContainer
      {...rest}
      $dir={direction}
      $gap={gap}
      $wrap={shouldWrap}
      $pad={pad}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      style={sx}
    >
      {children}
    </StackContainer>
  );
};

export default Stack;
