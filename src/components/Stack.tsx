// ─────────────────────────────────────────────────────────────────────────────
// src/components/Stack.tsx
// valet <Stack /> – hoisted styled component (no focus drop)
// ─────────────────────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../css/createStyled';
import { useTheme, Theme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
  direction?: 'row' | 'column';
  spacing?: keyof Theme['spacing'] | string;
  /** If `true`, children wrap onto new lines/columns when they run out
   *  of space.  Defaults to `true` for `row`, `false` for `column`. */
  wrap?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Hoisted styled primitive                                  */
const StackContainer = styled('div')<{
  $dir: 'row' | 'column';
  $gap: string;
  $wrap: boolean;
}>`
  display: flex;
  flex-direction: ${({ $dir }) => $dir};
  gap: ${({ $gap }) => $gap};
  ${({ $wrap }) => ($wrap ? 'flex-wrap: wrap;' : '')}
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Stack: React.FC<StackProps> = ({
  direction = 'column',
  spacing   = '0',
  wrap,
  preset: p,
  className,
  children,
  ...rest
}) => {
  const { theme } = useTheme();

  /* Resolve theme spacing token → actual CSS length */
  const gap =
    typeof spacing === 'string' && spacing in theme.spacing
      ? theme.spacing[spacing as keyof Theme['spacing']]
      : String(spacing);

  /* Enable wrapping by default when laying out in a row */
  const shouldWrap =
    typeof wrap === 'boolean' ? wrap : direction === 'row';

  const presetClasses = p ? preset(p) : '';

  return (
    <StackContainer
      {...rest}
      $dir={direction}
      $gap={gap}
      $wrap={shouldWrap}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      {children}
    </StackContainer>
  );
};

export default Stack;
