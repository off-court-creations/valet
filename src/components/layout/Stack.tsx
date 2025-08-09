// ─────────────────────────────────────────────────────────────
// src/components/layout/Stack.tsx  | valet
// overhaul: internal scrollbars & boundary guards – 2025‑07‑17
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
  direction?: 'row' | 'column';
  /** Number of spacing units or any CSS length. */
  spacing?: number | string | undefined;
  /** If `true`, children wrap when they run out of space. Defaults to
   *  `true` for `row`, `false` for `column`. */
  wrap?: boolean;
  /** Remove built‑in margin and padding */
  compact?: boolean;
}

/*───────────────────────────────────────────────────────────*/
const StackContainer = styled('div')<{
  $dir: 'row' | 'column';
  $gap: string;
  $wrap: boolean;
  $margin: string;
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

  margin: ${({ $margin }) => $margin};
  & > * {
    margin: ${({ $pad }) => $pad};
  }
`;

/*───────────────────────────────────────────────────────────*/
export const Stack: React.FC<StackProps> = ({
  direction = 'column',
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

  /* Resolve number → theme spacing */
  let gap: string;
  let gapInput: number | string | undefined = spacing;
  if (gapInput === undefined) {
    gapInput = compact ? 0 : 1;
  }
  gap =
    typeof gapInput === 'number' ? theme.spacing(gapInput) : String(gapInput);

  /* Enable wrapping by default for rows */
  const shouldWrap = typeof wrap === 'boolean' ? wrap : direction === 'row';

  const presetClasses = p ? preset(p) : '';
  const pad = theme.spacing(1);
  const margin = compact ? '0' : pad;

  return (
    <StackContainer
      {...rest}
      $dir={direction}
      $gap={gap}
      $wrap={shouldWrap}
      $margin={margin}
      $pad={pad}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </StackContainer>
  );
};

export default Stack;
