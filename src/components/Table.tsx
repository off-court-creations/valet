// src/components/Table.tsx | valet
// Minimal but featureful Table component
// © 2025 Off-Court Creations – MIT licence
import React, { useMemo, useState } from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
/* Column definition                                          */
export interface TableColumn<T> {
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => any);
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  /** Enable sorting; provide custom compare fn if needed. */
  sortable?: boolean | ((a: T, b: T) => number);
}

/*───────────────────────────────────────────────────────────*/
/* Public props                                               */
export interface TableProps<T>
  extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'>,
    Presettable {
  data: T[];
  columns: TableColumn<T>[];
  striped?: boolean;
  hoverable?: boolean;
  initialSort?: { index: number; desc?: boolean };
  onSortChange?: (index: number, desc: boolean) => void;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                          */
const Root = styled('table')<{
  $striped: boolean;
  $hover: boolean;
  $border: string;
  $alt: string;
}>`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid ${({ $border }) => $border};

  th, td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid ${({ $border }) => $border};
  }

  ${({ $striped, $alt }) =>
    $striped && `tbody tr:nth-of-type(odd){background:${$alt};}`}

  ${({ $hover }) => $hover && 'tbody tr:hover{background:#0001;}'}
`;

const Th = styled('th')<{
  $align: 'left' | 'center' | 'right';
  $sortable: boolean;
  $active: boolean;
  $primary: string;
}>`
  text-align: ${({ $align }) => $align};
  ${({ $sortable }) => $sortable && 'cursor:pointer; user-select:none;'}
  color: ${({ $active, $primary }) => ($active ? $primary : 'inherit')};
  &:hover { ${({ $sortable, $primary }) => $sortable && `color:${$primary};`} }
`;

const Td = styled('td')<{ $align: 'left' | 'center' | 'right' }>`
  text-align: ${({ $align }) => $align};
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                  */
export function Table<T>({
  data,
  columns,
  striped = false,
  hoverable = false,
  initialSort,
  onSortChange,
  preset: p,
  className,
  style,
  ...rest
}: TableProps<T>) {
  const { theme } = useTheme();
  const [sort, setSort] = useState<{ index: number; desc: boolean } | null>(
    initialSort ? { index: initialSort.index, desc: !!initialSort.desc } : null,
  );

  const toggleSort = (idx: number) => {
    setSort((prev) => {
      const next =
        !prev || prev.index !== idx
          ? { index: idx, desc: false }
          : { index: idx, desc: !prev.desc };
      onSortChange?.(next.index, next.desc);
      return next;
    });
  };

  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns[sort.index];
    if (!col || !col.sortable) return data;
    const cmp =
      typeof col.sortable === 'function'
        ? col.sortable
        : (a: T, b: T) => {
            const getVal = typeof col.accessor === 'function'
              ? col.accessor
              : (row: T) => row[col.accessor as keyof T];
            const va = getVal(a);
            const vb = getVal(b);
            return va > vb ? 1 : va < vb ? -1 : 0;
          };
    const arr = [...data].sort(cmp);
    return sort.desc ? arr.reverse() : arr;
  }, [data, columns, sort]);

  const presetClasses = p ? preset(p) : '';

  return (
    <Root
      {...rest}
      $striped={striped}
      $hover={hoverable}
      $border={theme.colors.backgroundAlt}
      $alt={theme.colors.backgroundAlt}
      style={style}
      className={[presetClasses, className].filter(Boolean).join(' ')}
    >
      <thead>
        <tr>
          {columns.map((c, i) => (
            <Th
              key={i}
              $align={c.align ?? 'left'}
              $sortable={!!c.sortable}
              $active={sort?.index === i}
              $primary={theme.colors.primary}
              onClick={c.sortable ? () => toggleSort(i) : undefined}
            >
              {c.header}
              {sort?.index === i && (sort.desc ? ' ▼' : ' ▲')}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row, rIdx) => (
          <tr key={rIdx}>
            {columns.map((c, cIdx) => {
              const getVal = typeof c.accessor === 'function'
                ? c.accessor
                : (item: T) => item[c.accessor as keyof T];
              const content = c.render
                ? c.render(row, rIdx)
                : c.accessor
                  ? getVal(row)
                  : null;
              return (
                <Td key={cIdx} $align={c.align ?? 'left'}>
                  {content as any}
                </Td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </Root>
  );
}

export default Table;
