// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// src/components/layout/List.tsx | valet
// Zebra stripes, smart hover, invisible drag image,
// and persistent drag highlight.
// patch: add linear kinetic padding for drag state – 2025‑08‑12
// patch: single‑selection support with optional enable flag – 2025‑08‑12
// patch: mobile/touch drag reorder via Pointer Events with scroll lock – 2025‑08‑13
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
  /** Allow drag-and-drop reordering (default: true). */
  reorderable?: boolean;
  /** Enable single selection when true. Default: false (preserves current behavior). */
  selectable?: boolean;
  /** Controlled selected item (by reference). */
  selected?: T | null;
  /** Uncontrolled initial selection. */
  defaultSelected?: T | null;
  /** Fired when selection changes (click or drag-select). */
  onSelectionChange?: (item: T, index: number) => void;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitive                                          */
const Root = styled('ul')<{
  $striped: boolean;
  $hover: boolean;
  $border: string;
  $strokeW: string;
  $stripe: string;
  $hoverBg: string;
  $reorderable: boolean;
  $selectedBg: string;
  $padV: string;
  $padH: string;
  $dragging: boolean;
}>`
  list-style: none;
  margin: 0;
  padding: 0;
  border: ${({ $strokeW }) => $strokeW} solid ${({ $border }) => $border};
  /* Disable page panning while reordering on touch */
  touch-action: ${({ $dragging }) => ($dragging ? 'none' : 'auto')};
  overscroll-behavior: contain;

  li {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    /* base padding, animates linearly when dragging */
    padding: ${({ $padV, $padH }) => `${$padV} ${$padH}`};
    border-bottom: ${({ $strokeW }) => $strokeW} solid ${({ $border }) => $border};
    cursor: ${({ $reorderable }) => ($reorderable ? 'grab' : 'default')};
    user-select: none;
    transition:
      background 120ms ease,
      padding 120ms linear;
    background-clip: padding-box; /* avoid overlap seams under borders */
    position: relative; /* create a stable painting context */
    isolation: isolate; /* ensure uniform compositing */
    will-change: transform; /* hint for FLIP animations */
    -webkit-user-drag: none; /* prevent iOS element ghost dragging */
  }
  li:last-child {
    border-bottom: none;
  }

  /* Zebra stripes */
  ${({ $striped, $stripe }) => $striped && `li:nth-of-type(odd){background:${$stripe};}`}

  /* Hover highlight (opt-in, disabled while dragging) */
  ${({ $hover, $hoverBg, $dragging }) =>
    $hover && !$dragging &&
    `
      li:hover { background:${$hoverBg}; }
    `}

  /* Drag highlight (always on while dragging, regardless of hoverable) */
  ${({ $hoverBg }) => `li[data-dragging="true"] { background:${$hoverBg}; }`}

  /* Selected row persistent highlight */
  li[aria-selected="true"] { background: ${({ $selectedBg }) => $selectedBg}; }

  /* Kinetic padding on dragged row */
  li[data-dragging='true'] {
    /* subtle vertical expansion to indicate movement */
    padding-top: calc(${({ $padV }) => $padV} * 1.12);
    padding-bottom: calc(${({ $padV }) => $padV} * 1.12);
    /* ensure the active touch target cannot pan the page */
    touch-action: none;
    cursor: grabbing;
  }
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
  reorderable = true,
  selectable = false,
  selected: selectedProp,
  defaultSelected = null,
  onSelectionChange,
  preset: p,
  className,
  style,
  ...rest
}: ListProps<T>) {
  const { theme } = useTheme();

  /* Colours */
  const stripeColor = stripe(theme.colors.background, theme.colors.text);
  const hoverBg = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.25));
  const selectedBg = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.3));

  /* Determine whether hover is enabled */
  const enableHover = hoverable !== undefined ? hoverable : !striped;

  /* State */
  const [items, setItems] = useState<T[]>(data);
  const rootRef = useRef<HTMLUListElement>(null);
  const dragFrom = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const bodyOverflowPrev = useRef<string | null>(null);
  const bodyTouchActionPrev = useRef<string | null>(null);
  // stable keys for items to ensure DOM persistence across reorders (for FLIP)
  const keyMap = useRef(new WeakMap<object, number>());
  const keySeq = useRef(0);
  const keyOf = (item: T, idx: number): React.Key => {
    if (item && typeof item === 'object') {
      const map = keyMap.current;
      const existing = map.get(item as unknown as object);
      if (existing !== undefined) return existing;
      const next = ++keySeq.current;
      map.set(item as unknown as object, next);
      return next;
    }
    // fallback for primitives
    return `p-${String(item)}-${idx}`;
  };
  const controlled = selectedProp !== undefined;
  const [selfSelected, setSelfSelected] = useState<T | null>(defaultSelected);
  const selected = (controlled ? selectedProp! : selfSelected) ?? null;

  useEffect(() => setItems(data), [data]);

  /* Handlers -------------------------------------------------------------- */
  // Pointer-based drag for touch/pen (mobile). Mouse continues to use HTML5 DnD.
  const calcInsertIndex = (clientY: number): number => {
    const list = rootRef.current;
    if (!list) return dragFrom.current ?? 0;
    const nodes: HTMLElement[] = Array.from(list.children) as HTMLElement[];
    for (let i = 0; i < nodes.length; i++) {
      const rect = nodes[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (clientY < mid) return i;
    }
    return nodes.length;
  };

  const runFlip = (firstRects: Map<HTMLElement, DOMRect>) => {
    requestAnimationFrame(() => {
      const list2 = rootRef.current;
      if (!list2) return;
      const nextNodes: HTMLElement[] = Array.from(list2.children) as HTMLElement[];
      nextNodes.forEach((n) => {
        const a = firstRects.get(n);
        if (!a) return;
        const b = n.getBoundingClientRect();
        const dy = a.top - b.top;
        if (dy) {
          n.style.transform = `translateY(${dy}px)`;
          n.style.transition = 'transform 0s';
          void n.offsetHeight; // reflow
          n.style.transition = 'transform 120ms ease';
          n.style.transform = 'translateY(0)';
          const cleanup = () => {
            n.style.transition = '';
            n.style.transform = '';
            n.removeEventListener('transitionend', cleanup);
          };
          n.addEventListener('transitionend', cleanup);
        }
      });
    });
  };

  const startPointerDrag = (idx: number, e: React.PointerEvent<HTMLLIElement>) => {
    dragFrom.current = idx;
    setDragIdx(idx);
    pointerIdRef.current = e.pointerId;
    // Lock body scroll for the duration of a touch drag
    bodyOverflowPrev.current = document.body.style.overflow || '';
    bodyTouchActionPrev.current = (document.body.style as any).touchAction || '';
    document.body.style.overflow = 'hidden';
    (document.body.style as any).touchAction = 'none';
    // selection sync (mirror dragStart)
    if (selectable) {
      const item = items[idx];
      if (item !== selected) {
        if (!controlled) setSelfSelected(item);
        onSelectionChange?.(item, idx);
      }
    }

    const onMove = (ev: PointerEvent) => {
      if (ev.pointerId !== pointerIdRef.current) return;
      ev.preventDefault();
      const from = dragFrom.current;
      if (from === null) return;

      // Snapshot pre-layout for FLIP
      const list = rootRef.current;
      const nodes: HTMLElement[] = list ? (Array.from(list.children) as HTMLElement[]) : [];
      const first = new Map<HTMLElement, DOMRect>();
      nodes.forEach((n) => first.set(n, n.getBoundingClientRect()));

      const targetIndex = calcInsertIndex(ev.clientY);
      let insertIndex = targetIndex;
      if (targetIndex > from) insertIndex = targetIndex - 1;
      if (insertIndex === from) return;

      setItems((prev) => {
        const arr = [...prev];
        const [moved] = arr.splice(from, 1);
        const clamped = Math.max(0, Math.min(arr.length, insertIndex));
        arr.splice(clamped, 0, moved);
        dragFrom.current = clamped;
        return arr;
      });
      setDragIdx(dragFrom.current);
      runFlip(first);
    };

    const touchBlocker = (tev: TouchEvent) => {
      tev.preventDefault();
    };

    const finish = () => {
      window.removeEventListener('pointermove', onMove as any, false as any);
      window.removeEventListener('pointerup', finish as any, false as any);
      window.removeEventListener('pointercancel', finish as any, false as any);
      window.removeEventListener('touchmove', touchBlocker as any, false as any);
      // Restore body scroll state
      if (bodyOverflowPrev.current !== null) document.body.style.overflow = bodyOverflowPrev.current;
      if (bodyTouchActionPrev.current !== null)
        (document.body.style as any).touchAction = bodyTouchActionPrev.current;
      pointerIdRef.current = null;
      handleDragEnd();
    };

    window.addEventListener('pointermove', onMove, { passive: false } as AddEventListenerOptions);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('touchmove', touchBlocker, { passive: false } as AddEventListenerOptions);
  };
  const handleDragStart = (idx: number) => (e: React.DragEvent<HTMLLIElement>) => {
    dragFrom.current = idx;
    setDragIdx(idx);
    e.dataTransfer.setDragImage(EMPTY_IMG, 0, 0); // hide ghost
    e.dataTransfer.effectAllowed = 'move';
    // If selection is enabled and a different item is dragged, update selection
    if (selectable) {
      const item = items[idx];
      if (item !== selected) {
        if (!controlled) setSelfSelected(item);
        onSelectionChange?.(item, idx);
      }
    }
  };

  const handleDragOver = (idx: number) => (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    const from = dragFrom.current;
    if (from === null) return;

    const targetEl = e.currentTarget as HTMLLIElement;
    const rect = targetEl.getBoundingClientRect();
    const halfway = rect.top + rect.height / 2;
    const after = e.clientY > halfway; // cursor is past the midpoint

    // Compute intended insertion index based on cursor half
    const targetIndex = idx + (after ? 1 : 0);
    // Determine insertion index in the array AFTER removal of 'from'
    let insertIndex = targetIndex;
    if (targetIndex > from) insertIndex = targetIndex - 1;

    if (insertIndex === from) return; // no-op

    // Snapshot pre-layout for FLIP
    const list = rootRef.current;
    const nodes: HTMLElement[] = list ? (Array.from(list.children) as HTMLElement[]) : [];
    const first = new Map<HTMLElement, DOMRect>();
    nodes.forEach((n) => first.set(n, n.getBoundingClientRect()));

    setItems((prev) => {
      const arr = [...prev];
      const [moved] = arr.splice(from, 1);
      const clamped = Math.max(0, Math.min(arr.length, insertIndex));
      arr.splice(clamped, 0, moved);
      dragFrom.current = clamped;
      return arr;
    });
    setDragIdx(dragFrom.current);

    // Run FLIP after DOM updates
    requestAnimationFrame(() => {
      const list2 = rootRef.current;
      if (!list2) return;
      const nextNodes: HTMLElement[] = Array.from(list2.children) as HTMLElement[];
      nextNodes.forEach((n) => {
        const a = first.get(n);
        if (!a) return;
        const b = n.getBoundingClientRect();
        const dy = a.top - b.top;
        if (dy) {
          n.style.transform = `translateY(${dy}px)`;
          n.style.transition = 'transform 0s';
          // force reflow
          void n.offsetHeight;
          n.style.transition = 'transform 120ms ease';
          n.style.transform = 'translateY(0)';
          const cleanup = () => {
            n.style.transition = '';
            n.style.transform = '';
            n.removeEventListener('transitionend', cleanup);
          };
          n.addEventListener('transitionend', cleanup);
        }
      });
    });
  };

  const handleDragEnd = () => {
    if (dragFrom.current !== null) onReorder?.(items);
    dragFrom.current = null;
    setDragIdx(null);
  };

  const handleClick = (idx: number) => () => {
    if (!selectable) return;
    const item = items[idx];
    if (item === selected) return;
    if (!controlled) setSelfSelected(item);
    onSelectionChange?.(item, idx);
  };
  const handlePointerDown = (idx: number) => (e: React.PointerEvent<HTMLLIElement>) => {
    if (!reorderable) return;
    // Only engage custom path for touch/pen to avoid conflicting with HTML5 DnD on mouse
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      startPointerDrag(idx, e);
    }
  };

  /* Class merge */
  const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ') || undefined;

  /*─────────────────────────────────────────────────────────*/
  return (
    <Root
      {...rest}
      ref={rootRef}
      $striped={striped}
      $hover={enableHover}
      $dragging={dragIdx !== null}
      $border={theme.colors.backgroundAlt}
      $strokeW={theme.stroke(1)}
      $stripe={stripeColor}
      $hoverBg={hoverBg}
      $reorderable={reorderable}
      $selectedBg={selectedBg}
      $padV={theme.spacing(2)}
      $padH={theme.spacing(3)}
      className={cls}
      style={style}
      role={selectable ? 'listbox' : 'list'}
    >
      {items.map((item, idx) => (
        <li
          key={keyOf(item, idx)}
          draggable={reorderable || undefined}
          data-dragging={dragIdx === idx || undefined}
          aria-selected={selectable && item === selected ? true : undefined}
          onPointerDown={handlePointerDown(idx)}
          onDragStart={reorderable ? handleDragStart(idx) : undefined}
          onDragOver={reorderable ? handleDragOver(idx) : undefined}
          onDragEnd={reorderable ? handleDragEnd : undefined}
          onClick={handleClick(idx)}
          role={selectable ? 'option' : undefined}
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
