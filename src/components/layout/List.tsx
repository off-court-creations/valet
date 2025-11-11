// ─────────────────────────────────────────────────────────────
// src/components/layout/List.tsx  | valet
// Simplified, accessible list with optional selection and reorder
// Ground‑up rewrite for clarity and predictable behavior
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { Typography } from '../primitives/Typography';
import { stripe, toRgb, mix, toHex } from '../../helpers/color';
import type { Presettable, Sx } from '../../types';

/* Props */
export interface ListProps<T>
  extends Omit<React.HTMLAttributes<HTMLUListElement>, 'children' | 'style'>,
    Presettable {
  data: T[];
  getTitle: (item: T) => React.ReactNode;
  getSubtitle?: (item: T) => React.ReactNode;
  striped?: boolean;
  /** If `undefined`, non-striped lists hover by default. */
  hoverable?: boolean;
  /** Allow drag-and-drop style reordering via pointer (default: true) */
  reorderable?: boolean;
  onReorder?: (items: T[]) => void;
  /** Enable single selection when true. */
  selectable?: boolean;
  /**
   * Focus behavior for rows.
   * - `auto` (default): non-selectable lists keep rows out of the tab order; selectable lists use roving focus (one row has `tabIndex=0`, rest `-1`).
   * - `row`: every row is tabbable (`tabIndex=0`). Opt-in only; not recommended for long lists.
   * - `none`: rows are not in the tab order (`tabIndex=-1`), allowing programmatic focus only.
   */
  focusMode?: 'auto' | 'row' | 'none';
  /** Controlled selected item (by reference). */
  selected?: T | null;
  /** Uncontrolled initial selection. */
  defaultSelected?: T | null;
  /** Fired when selection changes. */
  onSelectionChange?: (item: T, index: number) => void;
  /** Provide stable keys for items (defaults to index). */
  getKey?: (item: T, index: number) => React.Key;
  /** Rendered when `data.length === 0`. */
  emptyPlaceholder?: React.ReactNode;
  /** Inline styles (with CSS var support). */
  sx?: Sx;
}

const Root = styled('ul')<{
  $striped: boolean;
  $hover: boolean;
  $border: string;
  $strokeW: string;
  $stripe: string;
  $hoverBg: string;
  $selectedBg: string;
  $padV: string;
  $padH: string;
  $reorderable: boolean;
  $dragging: boolean;
  $dragDur: string;
  $dragEase: string;
  $accent: string;
  $accentText: string;
}>`
  list-style: none;
  margin: 0;
  padding: 0;
  border: ${({ $strokeW }) => $strokeW} solid ${({ $border }) => $border};
  /* Improve touch responsiveness without killing scroll by default */
  touch-action: manipulation;

  & > li {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: ${({ $padV, $padH }) => `${$padV} ${$padH}`};
    border-bottom: ${({ $strokeW }) => $strokeW} solid ${({ $border }) => $border};
    cursor: ${({ $reorderable }) => ($reorderable ? 'grab' : 'default')};
    user-select: none;
    transition: background ${({ $dragDur }) => $dragDur} ${({ $dragEase }) => $dragEase};
    -webkit-user-drag: none;
    position: relative;
    -webkit-tap-highlight-color: transparent;
    /* Ensure touch pointer events are delivered for reordering on mobile */
    touch-action: ${({ $reorderable }) => ($reorderable ? 'none' : 'auto')};
  }
  & > li:last-child {
    border-bottom: none;
  }

  ${({ $striped, $stripe }) => $striped && `& > li:nth-of-type(odd){background:${$stripe};}`}
  ${({ $hover, $hoverBg, $dragging, $accent, $accentText }) =>
    $hover &&
    !$dragging &&
    `& > li:hover { background:${$hoverBg}; color:${$accentText}; --valet-bg:${$accent}; --valet-text-color:${$accentText}; }`}
  & > li[aria-selected="true"] {
    background: ${({ $selectedBg }) => $selectedBg};
    color: ${({ $accentText }) => $accentText};
    --valet-bg: ${({ $accent }) => $accent};
    --valet-text-color: ${({ $accentText }) => $accentText};
  }

  /* While dragging: globally prevent text selection inside the list (Safari fix) */
  ${({ $dragging }) =>
    $dragging &&
    `
      -webkit-user-select: none;
      user-select: none;
      * { -webkit-user-select: none; user-select: none; }
    `}

  /* Dragged row visual feedback */
  & > li[data-dragging='true'] {
    background: ${({ $hoverBg }) => $hoverBg};
    cursor: grabbing;
    transform: translateZ(0) scale(1.01);
    transition:
      background ${({ $dragDur }) => $dragDur} ${({ $dragEase }) => $dragEase},
      transform ${({ $dragDur }) => $dragDur} ${({ $dragEase }) => $dragEase};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    /* Ensure page doesn't pan during active drag on touch devices */
    touch-action: none;
    /* Ensure text flips to on-primary for contrast on tinted hover bg */
    color: ${({ $accentText }) => $accentText};
    --valet-bg: ${({ $accent }) => $accent};
    --valet-text-color: ${({ $accentText }) => $accentText};
  }

  /* Insertion indicator */
  & > li::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 0px;
    background: transparent;
    transition:
      height ${({ $dragDur }) => $dragDur} ${({ $dragEase }) => $dragEase},
      background ${({ $dragDur }) => $dragDur} ${({ $dragEase }) => $dragEase};
  }
  & > li[data-insert-before='true']::before {
    height: 2px;
    background: ${({ $accent }) => $accent};
  }
  & > li:last-child[data-insert-after-last='true'] {
    box-shadow: inset 0 -2px 0 0 ${({ $accent }) => $accent};
  }
  @media (prefers-reduced-motion: reduce) {
    & > li {
      transition: none !important;
    }
    & > li::before {
      transition: none !important;
    }
    & > li[data-dragging='true'] {
      transform: none !important;
      box-shadow: none !important;
    }
  }
  /* While dragging: disable gestures globally for the list */
  ${({ $dragging }) => $dragging && 'touch-action: none; -webkit-touch-callout: none;'}
`;

export function List<T>({
  data,
  getTitle,
  getSubtitle,
  striped = false,
  hoverable,
  reorderable = true,
  onReorder,
  selectable = false,
  focusMode = 'auto',
  selected: selectedProp,
  defaultSelected = null,
  onSelectionChange,
  getKey,
  emptyPlaceholder,
  preset: p,
  className,
  sx,
  ...rest
}: ListProps<T>) {
  const { theme } = useTheme();
  const stripeColor = stripe(theme.colors.background, theme.colors.text);
  const hoverBg = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.2));
  const selectedBg = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.28));
  const enableHover = hoverable !== undefined ? hoverable : !striped;

  // Local state
  const [items, setItems] = useState<T[]>(data);
  useEffect(() => setItems(data), [data]);

  const controlled = selectedProp !== undefined;
  const [selfSelected, setSelfSelected] = useState<T | null>(defaultSelected);
  const selected = (controlled ? selectedProp! : selfSelected) ?? null;

  // Roving focus index for keyboard nav when selectable
  const [focusIdx, setFocusIdx] = useState<number>(0);
  useEffect(() => {
    if (!items.length) return;
    if (selected) {
      const idx = items.indexOf(selected);
      if (idx >= 0) setFocusIdx(idx);
      else setFocusIdx(0);
    } else {
      setFocusIdx(0);
    }
  }, [items, selected]);

  // Pointer-based reorder (simple, unified for mouse/touch/pen)
  const rootRef = useRef<HTMLUListElement>(null);
  const draggingIdx = useRef<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [insertIdx, setInsertIdx] = useState<number | null>(null);
  const startY = useRef<number>(0);
  const moved = useRef<boolean>(false);
  const suppressClickRef = useRef<boolean>(false);
  const touchActiveRef = useRef<boolean>(false);

  const keyFor = (item: T, idx: number) => (getKey ? getKey(item, idx) : idx);

  const calcInsertIndex = (clientY: number): number => {
    const list = rootRef.current;
    if (!list) return 0;
    const nodes = Array.from(list.children) as HTMLElement[];
    for (let i = 0; i < nodes.length; i++) {
      const r = nodes[i].getBoundingClientRect();
      const mid = r.top + r.height / 2;
      if (clientY < mid) return i;
    }
    return nodes.length;
  };

  const beginReorder = (idx: number, e: React.PointerEvent<HTMLLIElement>) => {
    if (!reorderable) return;
    if (draggingIdx.current != null) return; // prevent double-start from touch + pointer
    // Prevent Safari text selection from initiating on pointer down
    try {
      e.preventDefault();
    } catch {
      /* no-op */
    }
    draggingIdx.current = idx;
    setDragIdx(idx);
    moved.current = false;
    startY.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLLIElement>) => {
    if (!reorderable) return;
    const from = draggingIdx.current;
    if (from == null) return;
    // Suppress selection / default scrolling behavior while dragging
    try {
      e.preventDefault();
    } catch {
      /* no-op */
    }
    if (!moved.current && Math.abs(e.clientY - startY.current) < 6) return;
    moved.current = true;
    suppressClickRef.current = true;
    const targetIndex = calcInsertIndex(e.clientY);
    let insertIndex = targetIndex;
    if (targetIndex > from) insertIndex = targetIndex - 1;
    if (insertIndex === from) return;
    // Snapshot pre-layout for FLIP
    const list = rootRef.current;
    const nodes: HTMLElement[] = list ? (Array.from(list.children) as HTMLElement[]) : [];
    const first = new Map<HTMLElement, DOMRect>();
    nodes.forEach((n) => first.set(n, n.getBoundingClientRect()));

    setItems((prev) => {
      const arr = [...prev];
      const [m] = arr.splice(from, 1);
      const clamped = Math.max(0, Math.min(arr.length, insertIndex));
      arr.splice(clamped, 0, m);
      draggingIdx.current = clamped;
      setDragIdx(clamped);
      setInsertIdx(insertIndex);
      return arr;
    });
    // FLIP animation using theme motion tokens
    requestAnimationFrame(() => {
      const list2 = rootRef.current;
      if (!list2) return;
      const flipDur = theme.motion.duration.short;
      const flipEase = theme.motion.easing.standard;
      const nextNodes: HTMLElement[] = Array.from(list2.children) as HTMLElement[];
      nextNodes.forEach((n) => {
        const a = first.get(n);
        if (!a) return;
        const b = n.getBoundingClientRect();
        const dy = a.top - b.top;
        if (dy) {
          n.style.transform = `translateY(${dy}px)`;
          n.style.transition = 'transform 0s';
          void n.offsetHeight;
          n.style.transition = `transform ${flipDur} ${flipEase}`;
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
  const startTouchDrag = (idx: number, e: React.TouchEvent<HTMLLIElement>) => {
    if (!reorderable) return;
    if (draggingIdx.current != null) return;
    touchActiveRef.current = true;
    try {
      e.preventDefault();
    } catch {
      /* no-op */
    }
    draggingIdx.current = idx;
    setDragIdx(idx);
    moved.current = false;
    const y = e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0;
    startY.current = y;
    const onMove = (tev: TouchEvent) => {
      if (draggingIdx.current == null) return;
      const ty = tev.touches[0]?.clientY ?? tev.changedTouches[0]?.clientY ?? 0;
      try {
        tev.preventDefault();
      } catch {
        /* no-op */
      }
      if (!moved.current && Math.abs(ty - startY.current) < 6) return;
      moved.current = true;
      suppressClickRef.current = true;
      const from = draggingIdx.current!;
      const targetIndex = calcInsertIndex(ty);
      let insertIndex = targetIndex;
      if (targetIndex > from) insertIndex = targetIndex - 1;
      if (insertIndex === from) return;

      // FLIP snapshot
      const list = rootRef.current;
      const nodes: HTMLElement[] = list ? (Array.from(list.children) as HTMLElement[]) : [];
      const first = new Map<HTMLElement, DOMRect>();
      nodes.forEach((n) => first.set(n, n.getBoundingClientRect()));

      setItems((prev) => {
        const arr = [...prev];
        const [m] = arr.splice(from, 1);
        const clamped = Math.max(0, Math.min(arr.length, insertIndex));
        arr.splice(clamped, 0, m);
        draggingIdx.current = clamped;
        setDragIdx(clamped);
        setInsertIdx(insertIndex);
        return arr;
      });

      // FLIP animate
      requestAnimationFrame(() => {
        const list2 = rootRef.current;
        if (!list2) return;
        const flipDur = theme.motion.duration.short;
        const flipEase = theme.motion.easing.standard;
        const nextNodes: HTMLElement[] = Array.from(list2.children) as HTMLElement[];
        nextNodes.forEach((n) => {
          const a = first.get(n);
          if (!a) return;
          const b = n.getBoundingClientRect();
          const dy = a.top - b.top;
          if (dy) {
            n.style.transform = `translateY(${dy}px)`;
            n.style.transition = 'transform 0s';
            void n.offsetHeight;
            n.style.transition = `transform ${flipDur} ${flipEase}`;
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
    const finish = () => {
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', finish);
      window.removeEventListener('touchcancel', finish);
      touchActiveRef.current = false;
      endPointer();
    };
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', finish, { passive: false });
    window.addEventListener('touchcancel', finish, { passive: false });
  };
  // During touch drag, block global touchmove to prevent page pan (iOS/Android)
  useEffect(() => {
    if (dragIdx == null) return;
    const prevent = (ev: TouchEvent) => {
      try {
        ev.preventDefault();
      } catch {
        /* no-op */
      }
    };
    window.addEventListener('touchmove', prevent, { passive: false });
    return () => {
      window.removeEventListener('touchmove', prevent);
    };
  }, [dragIdx]);
  const endPointer = () => {
    const from = draggingIdx.current;
    draggingIdx.current = null;
    setDragIdx(null);
    setInsertIdx(null);
    if (moved.current && from != null) {
      moved.current = false;
      onReorder?.(items);
    }
    // Allow the pointer-up triggered click to be ignored once after drag
    setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const selectIndex = (idx: number) => {
    if (!selectable) return;
    const item = items[idx];
    if (!item || item === selected) return;
    if (!controlled) setSelfSelected(item);
    onSelectionChange?.(item, idx);
    setFocusIdx(idx);
  };

  const onItemKeyDown = (idx: number) => (e: React.KeyboardEvent<HTMLLIElement>) => {
    if (!selectable) return;
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault();
      const next = Math.min(items.length - 1, idx + 1);
      setFocusIdx(next);
      (rootRef.current?.children[next] as HTMLElement | undefined)?.focus();
    } else if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault();
      const prev = Math.max(0, idx - 1);
      setFocusIdx(prev);
      (rootRef.current?.children[prev] as HTMLElement | undefined)?.focus();
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      selectIndex(idx);
    }
    if (reorderable && (e.altKey || e.metaKey)) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (idx > 0) {
          setItems((prev) => {
            const arr = [...prev];
            const tmp = arr[idx - 1];
            arr[idx - 1] = arr[idx];
            arr[idx] = tmp;
            onReorder?.(arr);
            return arr;
          });
          const to = Math.max(0, idx - 1);
          setFocusIdx(to);
          (rootRef.current?.children[to] as HTMLElement | undefined)?.focus();
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (idx < items.length - 1) {
          setItems((prev) => {
            const arr = [...prev];
            const tmp = arr[idx + 1];
            arr[idx + 1] = arr[idx];
            arr[idx] = tmp;
            onReorder?.(arr);
            return arr;
          });
          const to = Math.min(items.length - 1, idx + 1);
          setFocusIdx(to);
          (rootRef.current?.children[to] as HTMLElement | undefined)?.focus();
        }
      }
    }
  };

  const cls = useMemo(
    () => [p ? preset(p) : '', className].filter(Boolean).join(' ') || undefined,
    [p, className],
  );

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
      $selectedBg={selectedBg}
      $padV={theme.spacing(2)}
      $padH={theme.spacing(3)}
      $reorderable={reorderable}
      $dragDur={theme.motion.duration.short}
      $dragEase={theme.motion.easing.standard}
      $accent={theme.colors.primary}
      $accentText={theme.colors.primaryText}
      className={cls}
      style={sx}
      role={selectable ? 'listbox' : 'list'}
      aria-multiselectable={undefined}
    >
      {items.length === 0 && (
        <li tabIndex={-1}>
          {emptyPlaceholder ?? (
            <Typography
              variant='subtitle'
              sx={{ opacity: 0.7 }}
            >
              No items
            </Typography>
          )}
        </li>
      )}

      {items.map((item, idx) => {
        const isSelected = selectable && item === selected;
        const isFocused = selectable ? focusIdx === idx : false;
        const insertBefore = insertIdx === idx;
        const insertAfterLast = insertIdx === items.length && idx === items.length - 1;
        // Compute row tabIndex per focus mode
        let rowTabIndex: number | undefined;
        if (focusMode === 'row') {
          rowTabIndex = 0;
        } else if (focusMode === 'none') {
          rowTabIndex = -1;
        } else {
          // auto
          rowTabIndex = selectable ? (isFocused ? 0 : -1) : undefined;
        }
        return (
          <li
            key={keyFor(item, idx)}
            role={selectable ? 'option' : undefined}
            aria-selected={isSelected || undefined}
            tabIndex={rowTabIndex}
            onTouchStartCapture={(te) => startTouchDrag(idx, te)}
            onClick={() => {
              if (suppressClickRef.current) return;
              selectIndex(idx);
            }}
            onKeyDown={onItemKeyDown(idx)}
            onPointerDown={(e) => beginReorder(idx, e)}
            onPointerMove={onPointerMove}
            onPointerUp={endPointer}
            onPointerCancel={endPointer}
            data-dragging={dragIdx === idx || undefined}
            data-insert-before={insertBefore || undefined}
            data-insert-after-last={insertAfterLast || undefined}
          >
            <Typography
              variant='body'
              bold
            >
              {getTitle(item)}
            </Typography>
            {getSubtitle && <Typography variant='subtitle'>{getSubtitle(item)}</Typography>}
          </li>
        );
      })}
    </Root>
  );
}

export default List;
