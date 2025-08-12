// ─────────────────────────────────────────────────────────────
// src/components/layout/Stack.tsx  | valet
// overhaul: spacing refactor (container pad + gap, compact) – 2025-08-12
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface StackProps extends React.HTMLAttributes<HTMLDivElement>, Presettable {
  direction?: 'row' | 'column';
  /** Inter-child spacing in units or CSS length (container-owned). */
  gap?: number | string | undefined;
  /** Container inner padding in units or CSS length. */
  pad?: number | string | undefined;
  /** Deprecated alias for gap. */
  spacing?: number | string | undefined;
  /** If `true`, children wrap when they run out of space. Defaults to
   *  `true` for `row`, `false` for `column`. */
  wrap?: boolean;
  /** Compact mode removes both gap and padding. */
  compact?: boolean;
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
  max-height: 100%;
  min-width: 0;
  min-height: 0;

  /* No horizontal scrolling, vertical allowed */
  overflow-x: hidden;
  overflow-y: auto;

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
  spacing,
  wrap,
  compact,
  preset: p,
  className,
  children,
  style,
  ...rest
}) => {
  const { theme } = useTheme();

  /* Resolve number → theme spacing; compact overrides to zero */
  const effectiveGapInput: number | string | undefined = gapProp ?? spacing;
  const gap = compact
    ? '0'
    : typeof effectiveGapInput === 'number'
      ? theme.spacing(effectiveGapInput)
      : effectiveGapInput !== undefined
        ? String(effectiveGapInput)
        : theme.spacing(1);

  /* Enable wrapping by default for rows */
  const shouldWrap = typeof wrap === 'boolean' ? wrap : direction === 'row';

  const presetClasses = p ? preset(p) : '';
  const pad = compact
    ? '0'
    : typeof padProp === 'number'
      ? theme.spacing(padProp)
      : padProp !== undefined
        ? String(padProp)
        : theme.spacing(1);

  return (
    <StackContainer
      {...rest}
      $dir={direction}
      $gap={gap}
      $wrap={shouldWrap}
      $pad={pad}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </StackContainer>
  );
};

export default Stack;
