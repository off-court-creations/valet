// ─────────────────────────────────────────────────────────────────────────────
// src/components/List.tsx | valet
// Draggable list component – striped rows, hover highlight, customisable
// title + subtitle rendering. Supports drag-and-drop reordering.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { styled }                 from '../css/createStyled';
import { useTheme }               from '../system/themeStore';
import { preset }                 from '../css/stylePresets';
import { Typography }             from './Typography';
import type { Presettable }       from '../types';

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
  const hoverBg = `${theme.colors.primary}22`;

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

function stripe(bg: string, txt: string): string {
  const a = toRgb(bg);
  const b = toRgb(txt);
  const mixed = mix(a, b, 0.1);
  return toHex(mixed);
}

interface RGB { r: number; g: number; b: number; }

const rgbCache = new Map<string, RGB>();
function toRgb(hex: string): RGB {
  if (rgbCache.has(hex)) return rgbCache.get(hex)!;
  let s = hex.charAt(0) === '#' ? hex.slice(1) : hex;
  if (s.length === 3) s = s.replace(/./g, (ch) => ch + ch);
  let rgb: RGB;
  if (s.length === 6 && !/[^a-f\d]/i.test(s)) {
    const n = parseInt(s, 16);
    rgb = { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  } else {
    rgb = { r: 0, g: 0, b: 0 };
  }
  rgbCache.set(hex, rgb);
  return rgb;
}

function mix(a: RGB, b: RGB, w: number): RGB {
  const t = w <= 0 ? 0 : w >= 1 ? 1 : w;
  return {
    r: ((a.r * (1 - t) + b.r * t) + 0.5) | 0,
    g: ((a.g * (1 - t) + b.g * t) + 0.5) | 0,
    b: ((a.b * (1 - t) + b.b * t) + 0.5) | 0,
  };
}

function toHex({ r, g, b }: RGB) {
  return '#' + (((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1));
}
