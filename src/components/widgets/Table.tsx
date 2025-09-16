// ─────────────────────────────────────────────────────────────
// src/components/widgets/Table.tsx  | valet
// patch: self-narrowing and table-layout fixed to avoid right-edge clipping – 2025-07-18
// ─────────────────────────────────────────────────────────────
import React, {
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useId,
  useCallback,
} from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { useSurface } from '../../system/surfaceStore';
import { shallow } from 'zustand/shallow';
import { preset } from '../../css/stylePresets';
import { Checkbox } from '../fields/Checkbox';
import { stripe, toRgb, mix, toHex } from '../../helpers/color';
import type { Presettable, Sx } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Column definition                                          */
export interface TableColumn<T> {
  header: React.ReactNode;
  accessor?: keyof T | ((row: T) => unknown);
  render?: (row: T, idx: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean | ((a: T, b: T) => number);
}

/*───────────────────────────────────────────────────────────*/
/* Public props                                               */
export interface TableProps<T>
  extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children' | 'style'>,
    Presettable {
  data: T[];
  columns: TableColumn<T>[];
  striped?: boolean;
  hoverable?: boolean;
  dividers?: boolean;
  selectable?: 'single' | 'multi' | undefined;
  initialSort?: { index: number; desc?: boolean };
  onSortChange?: (index: number, desc: boolean) => void;
  onSelectionChange?: (selected: T[]) => void;
  constrainHeight?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                          */
const Wrapper = styled('div')<{ $pad: string }>`
  width: 100%;
  display: block;
  box-sizing: border-box;
  overflow-x: hidden; /* never allow horizontal scroll */
  padding-inline: ${({ $pad }) => $pad};
`;

const Root = styled('table')<{
  $striped: boolean;
  $hover: boolean;
  $lines: boolean;
  $border: string;
  $strokeW: string;
  $stripe: string;
  $hoverBg: string;
  $gutter: string;
  $padV: string;
  $padH: string;
  $textColor: string;
}>`
  /* leave a subtle gutter so right border never clips */
  width: calc(100% - ${({ $gutter }) => $gutter} * 2);
  max-width: 100%;
  margin-inline: auto;

  border-collapse: collapse;
  box-sizing: border-box;
  border: var(--valet-divider-stroke, ${({ $strokeW }) => $strokeW}) solid
    ${({ $border }) => $border};
  table-layout: fixed; /* prevents cells pushing past width */

  /* Ensure text color adapts to the surrounding surface */
  color: ${({ $textColor }) => $textColor};

  th,
  td {
    padding: ${({ $padV, $padH }) => `${$padV} ${$padH}`};
    text-align: left;
    border-bottom: var(--valet-divider-stroke, ${({ $strokeW }) => $strokeW}) solid
      ${({ $border }) => $border};
    transition: background 120ms ease;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  th code,
  td code {
    word-break: break-word;
    overflow-wrap: anywhere;
  }

  /* Zebra stripes */
  ${({ $striped, $stripe }) =>
    $striped
      ? `
    tbody tr:nth-of-type(odd) td { background: ${$stripe}; }
  `
      : ''}

  /* Row hover */
  ${({ $hover, $hoverBg }) =>
    $hover
      ? `
    tbody tr:hover,
    tbody tr:hover > td { background: ${$hoverBg}; }
  `
      : ''}

  /* Column dividers */
  ${({ $lines, $border, $strokeW }) =>
    $lines
      ? `
    th:not(:last-child), td:not(:last-child) { border-right: var(--valet-divider-stroke, ${$strokeW}) solid ${$border}; }
  `
      : ''}
`;

const Th = styled('th')<{
  $align: 'left' | 'center' | 'right';
  $sortable: boolean;
  $active: boolean;
  $primary: string;
}>`
  text-align: ${({ $align }) => $align};
  ${({ $sortable }) => ($sortable ? 'cursor: pointer; user-select: none;' : '')}
  position: relative;
  &:hover {
    ${({ $sortable }) => ($sortable ? 'filter: brightness(0.9);' : '')}
  }
  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: calc(-0.5 * var(--valet-underline-width, 1px));
    height: var(--valet-underline-width, 1px);
    background: ${({ $primary, $active }) => ($active ? $primary : 'transparent')};
    transition: background 150ms ease;
  }
`;

const Td = styled('td')<{ $align: 'left' | 'center' | 'right' }>`
  text-align: ${({ $align }) => $align};
`;

/*───────────────────────────────────────────────────────────*/
export function Table<T extends object>({
  data,
  columns,
  striped = true,
  hoverable = false,
  dividers = true,
  selectable,
  initialSort,
  onSortChange,
  onSelectionChange,
  constrainHeight = true,
  preset: p,
  className,
  sx,
  ...rest
}: TableProps<T>) {
  const { theme } = useTheme();
  const surface = useSurface(
    (s) => ({
      element: s.element,
      height: s.height,
      registerChild: s.registerChild,
      unregisterChild: s.unregisterChild,
    }),
    shallow,
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);
  const uniqueId = useId();

  const pad = theme.spacing(1);

  /* height-constraint internal state */
  const [maxHeight, setMaxHeight] = useState<number>();
  const [shouldConstrain, setShouldConstrain] = useState(false);
  const constraintRef = useRef(false);
  const bottomRef = useRef(0);
  const rafRef = useRef<number>(0);
  const prevHeightRef = useRef<number | undefined>(undefined);
  const prevConstrainedRef = useRef(false);

  /* size helpers */
  const calcCutoff = () => {
    if (typeof document === 'undefined') return 32;
    const fs = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return (isNaN(fs) ? 16 : fs) * 2;
  };

  /* measurement update (stable) */
  const runUpdate = useCallback(() => {
    const node = wrapRef.current;
    const surfEl = surface.element;
    if (!node || !surfEl) return;
    const sRect = surfEl.getBoundingClientRect();
    const nRect = node.getBoundingClientRect();
    const top = Math.round(nRect.top - sRect.top + surfEl.scrollTop);
    const dynBottom = Math.round(
      surfEl.scrollHeight - (nRect.bottom - sRect.top + surfEl.scrollTop),
    );
    if (!constraintRef.current) bottomRef.current = dynBottom;
    const available = Math.round(surface.height - top - bottomRef.current);
    const cutoff = calcCutoff();

    const shouldClamp = node.scrollHeight - available > 1 && available >= cutoff;

    if (shouldClamp) {
      if (!constraintRef.current) {
        surfEl.scrollTop = 0;
        surfEl.scrollLeft = 0;
      }
      constraintRef.current = true;
      if (!prevConstrainedRef.current) {
        prevConstrainedRef.current = true;
        setShouldConstrain(true);
      }
      const newHeight = Math.max(0, available);
      if (prevHeightRef.current !== newHeight) {
        prevHeightRef.current = newHeight;
        setMaxHeight(newHeight);
      }
    } else {
      constraintRef.current = false;
      bottomRef.current = dynBottom;
      if (prevConstrainedRef.current) {
        prevConstrainedRef.current = false;
        setShouldConstrain(false);
      }
      if (prevHeightRef.current !== undefined) {
        prevHeightRef.current = undefined;
        setMaxHeight(undefined);
      }
    }
  }, [surface]); // depend on the selected store slice as a whole

  const update = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(runUpdate);
  }, [runUpdate]);

  /* constrain toggles */
  useEffect(() => {
    if (!constrainHeight) {
      constraintRef.current = false;
      setShouldConstrain(false);
      setMaxHeight(undefined);
    } else {
      constraintRef.current = false; // next update decides
    }
  }, [constrainHeight]);

  useLayoutEffect(() => {
    if (!constrainHeight || !wrapRef.current || !surface.element) return;
    const node = wrapRef.current;
    surface.registerChild(uniqueId, node, update);
    const ro = new ResizeObserver(update);
    ro.observe(node);
    update();
    return () => {
      surface.unregisterChild(uniqueId);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [constrainHeight, surface, uniqueId, update]);

  useLayoutEffect(() => {
    if (!constrainHeight || !wrapRef.current || !surface.element) return;
    update();
  }, [constrainHeight, surface, update]);

  /* sort + selection state */
  const [sort, setSort] = useState<{ index: number; desc: boolean } | null>(
    initialSort ? { index: initialSort.index, desc: !!initialSort.desc } : null,
  );
  const [selected, setSelected] = useState<Set<T>>(new Set());

  useEffect(() => {
    setSelected((prev) => {
      const next = new Set(Array.from(prev).filter((r) => data.includes(r)));
      onSelectionChange?.(Array.from(next));
      return next;
    });
  }, [data, onSelectionChange]);

  /* colours */
  const stripeColor = stripe(theme.colors.background, theme.colors.text);
  const hoverBg = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.25));
  const [textColor, setTextColor] = useState<string>(theme.colors.text);

  // Auto-resolve legible text colour from the surface background.
  useLayoutEffect(() => {
    const node = tableRef.current;
    if (!node) return;
    try {
      const cs = getComputedStyle(node);
      const raw = cs.getPropertyValue('--valet-bg')?.trim();
      const bg = raw?.toUpperCase?.() ?? '';
      const eq = (hex: string) => (hex || '').toUpperCase() === bg;
      let next = theme.colors.text;
      if (eq(theme.colors.primary)) next = theme.colors.primaryText;
      else if (eq(theme.colors.secondary)) next = theme.colors.secondaryText;
      else if (eq(theme.colors.tertiary)) next = theme.colors.tertiaryText;
      else if (eq(theme.colors.backgroundAlt)) next = theme.colors.text;
      else next = theme.colors.text;
      setTextColor(next);
    } catch {
      setTextColor(theme.colors.text);
    }
  }, [theme.colors]);

  /* callbacks */
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

  const toggleSelect = (row: T, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (selectable === 'single') next.clear();

      if (checked) {
        next.add(row);
      } else {
        next.delete(row);
      }

      onSelectionChange?.(Array.from(next));
      return next;
    });
  };

  /* sorted data */
  const sorted = useMemo(() => {
    if (!sort) return data;
    const col = columns[sort.index];
    if (!col || !col.sortable) return data;

    const cmp: (a: T, b: T) => number =
      typeof col.sortable === 'function'
        ? col.sortable
        : (a: T, b: T) => {
            const getter =
              typeof col.accessor === 'function'
                ? col.accessor
                : (row: T) => row[col.accessor as keyof T];

            const va = getter(a) as unknown;
            const vb = getter(b) as unknown;

            // Numeric / Date / boolean / string-safe comparator
            const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
            const isDate = (v: unknown): v is Date =>
              v instanceof Date && !Number.isNaN(v.getTime());

            if (isNum(va) && isNum(vb)) return va - vb;
            if (isDate(va) && isDate(vb)) return va.getTime() - vb.getTime();
            if (typeof va === 'boolean' && typeof vb === 'boolean')
              return (va ? 1 : 0) - (vb ? 1 : 0);

            const sa = String(va ?? '');
            const sb = String(vb ?? '');
            return sa.localeCompare(sb);
          };

    const arr = [...data].sort(cmp);
    return sort.desc ? arr.reverse() : arr;
  }, [data, columns, sort]);

  /* class merge */
  const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ') || undefined;

  /*─────────────────────────────────────────────────────────*/
  return (
    <Wrapper
      ref={wrapRef}
      $pad={pad}
      style={shouldConstrain ? { overflow: 'auto', maxHeight } : undefined}
    >
      <Root
        {...rest}
        ref={tableRef}
        $striped={striped}
        $hover={hoverable}
        $lines={dividers}
        $border={theme.colors.backgroundAlt}
        $strokeW={theme.stroke(1)}
        $stripe={stripeColor}
        $hoverBg={hoverBg}
        $gutter={pad}
        $padV={theme.spacing(2)}
        $padH={theme.spacing(3)}
        $textColor={textColor}
        className={cls}
        style={
          {
            '--valet-table-underline': theme.stroke(4),
            ...(sx as object),
          } as React.CSSProperties
        }
      >
        <thead>
          <tr>
            {selectable ? (
              <Th
                $align='center'
                $sortable={false}
                $active={false}
                $primary={theme.colors.primary}
                style={{ width: theme.spacing(6) }}
              />
            ) : null}
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
                {sort?.index === i ? (sort.desc ? ' ▼' : ' ▲') : null}
              </Th>
            ))}
          </tr>
        </thead>

        <tbody>
          {sorted.map((row, rIdx) => (
            <tr key={rIdx}>
              {selectable ? (
                <Td $align='center'>
                  <Checkbox
                    name={`sel-${rIdx}`}
                    size='sm'
                    checked={selected.has(row)}
                    onChange={(chk) => toggleSelect(row, chk)}
                    aria-label={`Select row ${rIdx + 1}`}
                  />
                </Td>
              ) : null}

              {columns.map((c, cIdx) => {
                const getter =
                  typeof c.accessor === 'function'
                    ? c.accessor
                    : (item: T) => item[c.accessor as keyof T];
                const content = c.render
                  ? c.render(row, rIdx)
                  : c.accessor !== undefined
                    ? (getter(row) as React.ReactNode)
                    : null;

                return (
                  <Td
                    key={cIdx}
                    $align={c.align ?? 'left'}
                  >
                    {content}
                  </Td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Root>
    </Wrapper>
  );
}

export default Table;
