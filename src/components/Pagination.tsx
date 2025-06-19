// ─────────────────────────────────────────────────────────────
// src/components/Pagination.tsx  | valet
// basic pagination control
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../css/createStyled';
import { preset } from '../css/stylePresets';
import { useTheme } from '../system/themeStore';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
export interface PaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'>,
    Presettable {
  count: number;
  page?: number;
  onChange?: (page: number) => void;
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('nav')<{ $color: string; $active: string }>`
  display: flex;
  gap: 0.5rem;
  a, button {
    background: none;
    border: none;
    padding: 0.25rem 0.5rem;
    cursor: pointer;
    color: ${({ $color }) => $color};
  }
  button.active {
    font-weight: 700;
    color: ${({ $active }) => $active};
  }
`;

/*───────────────────────────────────────────────────────────*/
export const Pagination: React.FC<PaginationProps> = ({
  count,
  page = 1,
  onChange,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const presetClass = p ? preset(p) : '';
  const pages = Array.from({ length: count }, (_, i) => i + 1);

  const handleClick = (p: number) => () => onChange?.(p);

  return (
    <Root
      {...rest}
      aria-label="pagination"
      $color={theme.colors.text}
      $active={theme.colors.primary}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={style}
    >
      <button onClick={handleClick(Math.max(1, page - 1))} disabled={page === 1}>Prev</button>
      {pages.map((pnum) => (
        <button
          key={pnum}
          onClick={handleClick(pnum)}
          className={pnum === page ? 'active' : undefined}
        >
          {pnum}
        </button>
      ))}
      <button onClick={handleClick(Math.min(count, page + 1))} disabled={page === count}>Next</button>
    </Root>
  );
};

export default Pagination;
