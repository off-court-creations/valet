// ─────────────────────────────────────────────────────────────
// src/components/Stack.tsx  | valet
// strict‑optional safe typings
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled }            from '../css/createStyled';
import { useTheme, Theme }   from '../system/themeStore';
import { preset }            from '../css/stylePresets';
import type { Presettable }  from '../types';

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
  direction?: 'row' | 'column';
  /** Accepts a theme spacing token or any CSS length. */
  spacing?: keyof Theme['spacing'] | string | undefined;
  /** If `true`, children wrap when they run out of space. Defaults to
   *  `true` for `row`, `false` for `column`. */
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
  spacing,
  wrap,
  preset: p,
  className,
  children,
  style,
  ...rest
}) => {
  const { theme } = useTheme();

  /* Resolve theme spacing token → actual CSS length */
  let gap: string;
  if (spacing === undefined) {
    gap = '0';
  } else if (typeof spacing === 'string' && spacing in theme.spacing) {
    gap = theme.spacing[spacing as keyof Theme['spacing']];
  } else {
    gap = String(spacing);
  }

  /* Enable wrapping by default when laying out in a row */
  const shouldWrap = typeof wrap === 'boolean' ? wrap : direction === 'row';

  const presetClasses = p ? preset(p) : '';

  return (
    <StackContainer
      {...rest}
      $dir={direction}
      $gap={gap}
      $wrap={shouldWrap}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      style={style}
    >
      {children}
    </StackContainer>
  );
};

export default Stack;
