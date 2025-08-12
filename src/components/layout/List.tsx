// ─────────────────────────────────────────────────────────────
// src/components/widgets/List.tsx | valet
// Zebra stripes, smart hover, invisible drag image,
// and persistent drag highlight.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { Typography } from '../primitives/Typography';
import { stripe, toRgb, mix, toHex } from '../../helpers/color';
import type { Presettable } from '../../types';

/* 1 × 1 transparent GIF to suppress the default drag preview */
const EMPTY_IMG = (() => {
  const img = new Image();
  img.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
  return img;
})();

/*───────────────────────────────────────────────────────────*/
/* Props                                                     */
export interface ListProps<T>
  extends Omit<React.HTMLAttributes<HTMLUListElement>, 'children'>,
    Presettable {
  data: T[];
  getTitle: (item: T) => React.ReactNode;
  getSubtitle?: (item: T) => React.ReactNode;
  striped?: boolean;
  /** If `undefined`, non-striped lists hover by default. */
  hoverable?: boolean;
  onReorder?: (items: T[]) => void;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitive                                          */
const Root = styled('ul')<{
  $striped: boolean;
  $hover: boolean;
  $border: string;
  $stripe: string;
  $hoverBg: string;
  $padV: string;
  $padH: string;
}>`
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid ${({ $border }) => $border};

  li {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: ${({ $padV, $padH }) => `${$padV} ${$padH}`};
    border-bottom: 1px solid ${({ $border }) => $border};
    cursor: grab;
    user-select: none;
    transition: background 120ms ease;
  }
  li:last-child {
    border-bottom: none;
  }

  /* Zebra stripes */
  ${({ $striped, $stripe }) => $striped && `li:nth-of-type(odd){background:${$stripe};}`}

  /* Hover + drag highlight (row AND its cells) */
  ${({ $hover, $hoverBg }) =>
    $hover &&
    `
      li:hover,
      li:hover > *,
      li[data-dragging="true"],
      li[data-dragging="true"] > * {
        background:${$hoverBg};
      }
    `}
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export function List<T>({
  data,
  getTitle,
  getSubtitle,
  striped = false,
  hoverable,
  onReorder,
  preset: p,
  className,
  style,
  ...rest
}: ListProps<T>) {
  const { theme } = useTheme();

  /* Colours */
  const stripeColor = stripe(theme.colors.background, theme.colors.text);
  const hoverBg = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.25));

  /* Determine whether hover is enabled */
  const enableHover = hoverable !== undefined ? hoverable : !striped;

  /* State */
  const [items, setItems] = useState<T[]>(data);
  const dragFrom = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => setItems(data), [data]);

  /* Handlers -------------------------------------------------------------- */
  const handleDragStart = (idx: number) => (e: React.DragEvent<HTMLLIElement>) => {
    dragFrom.current = idx;
    setDragIdx(idx);
    e.dataTransfer.setDragImage(EMPTY_IMG, 0, 0); // hide ghost
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    const from = dragFrom.current;
    if (from === null || from === idx) return;

    setItems((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      arr.splice(idx, 0, moved);
      dragFrom.current = idx;
      return arr;
    });
    setDragIdx(idx); // keep highlight on moved row
  };

  const handleDragEnd = () => {
    if (dragFrom.current !== null) onReorder?.(items);
    dragFrom.current = null;
    setDragIdx(null);
  };

  /* Class merge */
  const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ') || undefined;

  /*─────────────────────────────────────────────────────────*/
  return (
    <Root
      {...rest}
      $striped={striped}
      $hover={enableHover}
      $border={theme.colors.backgroundAlt}
      $stripe={stripeColor}
      $hoverBg={hoverBg}
      $padV={theme.spacing(2)}
      $padH={theme.spacing(3)}
      className={cls}
      style={style}
    >
      {items.map((item, idx) => (
        <li
          key={idx}
          draggable
          data-dragging={dragIdx === idx || undefined}
          onDragStart={handleDragStart(idx)}
          onDragOver={handleDragOver(idx)}
          onDragEnd={handleDragEnd}
        >
          <Typography
            variant='body'
            bold
          >
            {getTitle(item)}
          </Typography>
          {getSubtitle && <Typography variant='subtitle'>{getSubtitle(item)}</Typography>}
        </li>
      ))}
    </Root>
  );
}

export default List;
