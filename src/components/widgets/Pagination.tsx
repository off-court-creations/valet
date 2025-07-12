// ─────────────────────────────────────────────────────────────
// src/components/widgets/Pagination.tsx  | valet
// Tab-style pagination with thick underline for active page
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export interface PaginationProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'onChange'>,
    Presettable {
  /** Total number of pages (≥ 1). */
  count: number;
  /** Currently-selected page (1-based). */
  page?: number;
  /** Called with **new page** when user clicks. */
  onChange?: (page: number) => void;
}

/*───────────────────────────────────────────────────────────*/
/* Layout wrapper                                            */
const Root = styled('nav')<{ $text: string }>`
  display: flex;
  gap: 0.5rem;

  button {
    background: none;
    border: none;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    color: ${({ $text }) => $text};
    font: inherit;
    line-height: 1;
  }

  button:disabled {
    opacity: 0.4;
    cursor: default;
  }
`;

/*───────────────────────────────────────────────────────────*/
/* Tab-style page trigger                                    */
const PageBtn = styled('button')<{
  $active: boolean;
  $primary: string;
  $text: string;
}>`
  position: relative;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  color: ${({ $active, $primary, $text }) =>
    $active ? $primary : $text};

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -0.3rem;       /* hugs text baseline */
    height: 0.25rem;       /* thicker than normal underline */
    border-radius: 2px 2px 0 0;
    background: ${({ $active, $primary }) =>
      $active ? $primary : 'transparent'};
    transition: background 150ms ease;
  }
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
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
  const pages = Array.from({ length: count }, (_, i) => i + 1);

  /* preset → utility class merge */
  const presetClass = p ? preset(p) : '';
  const mergedClass = [presetClass, className]
    .filter(Boolean)
    .join(' ') || undefined;

  const nav = (p: number) => () => onChange?.(p);

  return (
    <Root
      {...rest}
      aria-label="pagination"
      $text={theme.colors.text}
      className={mergedClass}
      style={style}
    >
      {/* Prev/Next – simple text buttons (no underline) */}
      <button
        onClick={nav(Math.max(1, page - 1))}
        disabled={page === 1}
      >
        Prev
      </button>

      {/* Page numbers – tab-style with underline */}
      {pages.map((n) => (
        <PageBtn
          key={n}
          onClick={nav(n)}
          $active={n === page}
          $primary={theme.colors.primary}
          $text={theme.colors.text}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </PageBtn>
      ))}

      <button
        onClick={nav(Math.min(count, page + 1))}
        disabled={page === count}
      >
        Next
      </button>
    </Root>
  );
};

export default Pagination;
