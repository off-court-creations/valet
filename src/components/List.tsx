// ─────────────────────────────────────────────────────────────
// src/components/List.tsx | valet
// Draggable list component – striped rows, hover highlight, customisable
// title + subtitle rendering. Supports drag-and-drop reordering.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { styled }                 from '../css/createStyled';
import { useTheme }               from '../system/themeStore';
import { preset }                 from '../css/stylePresets';
import { Typography }             from './Typography';
import type { Presettable }       from '../types';
import { stripe, hoverColor } from '../utilities/colors';

export interface ListProps<T> extends Omit<React.HTMLAttributes<HTMLUListElement>, 'children'>, Presettable {
  data: T[];
  getTitle: (item: T) => React.ReactNode;
  getSubtitle?: (item: T) => React.ReactNode;
  striped?: boolean;
  hoverable?: boolean;
  onReorder?: (items: T[]) => void;
}

const Root = styled('ul')<{
  $striped: boolean;
  $hover: boolean;
  $border: string;
  $stripe: string;
  $hoverBg: string;
}>`
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid ${({ $border }) => $border};

  li {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid ${({ $border }) => $border};
    cursor: grab;
    user-select: none;
  }

  li:last-child {
    border-bottom: none;
  }

  ${({ $striped, $stripe }) =>
    $striped && `li:nth-of-type(odd){background:${$stripe};}`}
  ${({ $hover, $hoverBg }) =>
    $hover && `li:hover{background:${$hoverBg};}`}
`;

export function List<T>({
  data,
  getTitle,
  getSubtitle,
  striped = false,
  hoverable = false,
  onReorder,
  preset: p,
  className,
  style,
  ...rest
}: ListProps<T>) {
  const { theme } = useTheme();
  const [items, setItems] = useState<T[]>(data);
  const dragIdx = useRef<number | null>(null);

  useEffect(() => {
    setItems(data);
  }, [data]);

  const stripeColor = stripe(theme.colors.background, theme.colors.text);
  const hoverBg = hoverColor(
    theme.colors.background,
    theme.colors.primary,
    striped,
    theme.colors.text,
  );

  function handleDragStart(idx: number) {
    return () => {
      dragIdx.current = idx;
    };
  }

  function handleDragOver(idx: number) {
    return (e: React.DragEvent<HTMLLIElement>) => {
      e.preventDefault();
      const from = dragIdx.current;
      if (from === null || from === idx) return;
      setItems((prev) => {
        const arr = [...prev];
        const [moved] = arr.splice(from, 1);
        arr.splice(idx, 0, moved);
        dragIdx.current = idx;
        return arr;
      });
    };
  }

  function handleDragEnd() {
    if (dragIdx.current !== null) {
      onReorder?.(items);
    }
    dragIdx.current = null;
  }

  const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ') || undefined;

  return (
    <Root
      {...rest}
      $striped={striped}
      $hover={hoverable}
      $border={theme.colors.backgroundAlt}
      $stripe={stripeColor}
      $hoverBg={hoverBg}
      style={style}
      className={cls}
    >
      {items.map((item, idx) => (
        <li
          key={idx}
          draggable
          onDragStart={handleDragStart(idx)}
          onDragOver={handleDragOver(idx)}
          onDragEnd={handleDragEnd}
          style={{ cursor: 'grab' }}
        >
          <Typography variant="body" bold>
            {getTitle(item)}
          </Typography>
          {getSubtitle && (
            <Typography variant="subtitle">
              {getSubtitle(item)}
            </Typography>
          )}
        </li>
      ))}
    </Root>
  );
}

export default List;
