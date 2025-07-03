// ─────────────────────────────────────────────────────────────
// src/components/Stack.tsx  | valet
// strict‑optional safe typings
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled }            from '../css/createStyled';
import { useTheme }   from '../system/themeStore';
import { preset }            from '../css/stylePresets';
import type { Presettable }  from '../types';

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export interface StackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
  direction?: 'row' | 'column';
  /** Number of spacing units or any CSS length. */
  spacing?: number | string | undefined;
  /** If `true`, children wrap when they run out of space. Defaults to
   *  `true` for `row`, `false` for `column`. */
  wrap?: boolean;
  /** Remove built-in margin and padding */
  compact?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Hoisted styled primitive                                  */
const StackContainer = styled('div')<{
  $dir: 'row' | 'column';
  $gap: string;
  $wrap: boolean;
  $pad: string;
}>`
  display: flex;
  flex-direction: ${({ $dir }) => $dir};
  gap: ${({ $gap }) => $gap};
  ${({ $wrap }) => ($wrap ? 'flex-wrap: wrap;' : '')}
  margin: ${({ $pad }) => $pad};
  & > * {
    margin: ${({ $pad }) => $pad};
  }
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
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
  if (spacing === undefined) {
    gap = '0';
  } else if (typeof spacing === 'number') {
    gap = theme.spacing(spacing);
  } else {
    gap = String(spacing);
  }

  /* Enable wrapping by default when laying out in a row */
  const shouldWrap = typeof wrap === 'boolean' ? wrap : direction === 'row';

  const presetClasses = p ? preset(p) : '';
  const pad = compact ? '0' : theme.spacing(1);

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
