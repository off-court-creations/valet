// ─────────────────────────────────────────────────────────────
// src/components/Table.tsx  | valet
// Row-hover highlight fixed and now more saturated hover colour.
// ─────────────────────────────────────────────────────────────
import React, {
  useMemo,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useId,
} from 'react';
import { styled }                 from '../css/createStyled';
import { useTheme }               from '../system/themeStore';
import { useSurface }             from '../system/surfaceStore';
import { preset }                 from '../css/stylePresets';
import { Checkbox }               from './Checkbox';
import { stripe, toRgb, mix, toHex } from '../helpers/color';
import type { Presettable }       from '../types';

/*───────────────────────────────────────────────────────────*/
/* Column definition                                          */
export interface TableColumn<T> {
  header   : React.ReactNode;
  accessor?: keyof T | ((row:T)=>unknown);
  render?  : (row:T,idx:number)=>React.ReactNode;
  align?   : 'left'|'center'|'right';
  sortable?: boolean | ((a:T,b:T)=>number);
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
  dividers?: boolean;
  selectable?: 'single' | 'multi' | undefined;
  initialSort?: { index:number; desc?:boolean };
  onSortChange?: (index:number, desc:boolean)=>void;
  onSelectionChange?: (selected:T[])=>void;
  constrainHeight?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                          */
const Wrapper = styled('div')`
  width:100%;
  display:block;
`;
const Root = styled('table')<{
  $striped:boolean; $hover:boolean; $lines:boolean;
  $border:string; $stripe:string; $hoverBg:string;
}>`
  width:100%;
  border-collapse:collapse;
  border:1px solid ${({$border})=>$border};

  th,td{
    padding:0.5rem 0.75rem;
    text-align:left;
    border-bottom:1px solid ${({$border})=>$border};
    transition: background 120ms ease;
  }

  /* Zebra stripes */
  ${({$striped,$stripe})=>$striped&&`
    tbody tr:nth-of-type(odd) td{background:${$stripe};}
  `}

  /* Row hover (functional even without stripes) */
  ${({$hover,$hoverBg})=>$hover&&`
    tbody tr:hover,
    tbody tr:hover > td{
      background:${$hoverBg};
    }
  `}

  /* Column dividers */
  ${({$lines,$border})=>$lines&&`
    th:not(:last-child),
    td:not(:last-child){
      border-right:1px solid ${$border};
    }
  `}
`;

const Th = styled('th')<{
  $align:'left'|'center'|'right'; $sortable:boolean;
  $active:boolean; $primary:string;
}>`
  text-align:${({$align})=>$align};
  ${({$sortable})=>$sortable&&'cursor:pointer; user-select:none;'}
  position:relative;

  &:hover { ${({$sortable})=>$sortable&&'filter:brightness(0.9);'} }

  &::after{
    content:'';
    position:absolute;
    left:0; right:0; bottom:-1px;
    height:4px;
    background:${({$primary,$active})=>$active?$primary:'transparent'};
    transition:background 150ms ease;
  }
`;

const Td = styled('td')<{ $align:'left'|'center'|'right' }>`
  text-align:${({$align})=>$align};
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                  */
export function Table<T extends object>({
  data,
  columns,
  striped=true,
  hoverable=false,
  dividers=true,
  selectable,
  initialSort,
  onSortChange,
  onSelectionChange,
  constrainHeight = true,
  preset:p,
  className,
  style,
  ...rest
}:TableProps<T>) {
  const { theme } = useTheme();
  const surface = useSurface();
  const wrapRef = useRef<HTMLDivElement>(null);
  const uniqueId = useId();
  const [maxHeight, setMaxHeight] = useState<number>();
  const [shouldConstrain, setShouldConstrain] = useState(false);
  const constraintRef = useRef(false);

  const calcCutoff = () => {
    if (typeof document === 'undefined') return 32;
    const fs = parseFloat(
      getComputedStyle(document.documentElement).fontSize,
    );
    return (isNaN(fs) ? 16 : fs) * 2;
  };

  const update = () => {
    const node = wrapRef.current;
    const surfEl = surface.element;
    if (!node || !surfEl) return;
    const rect = node.getBoundingClientRect();
    const surfRect = surfEl.getBoundingClientRect();
    const top = rect.top - surfRect.top + surfEl.scrollTop;
    const mb = parseFloat(getComputedStyle(node).marginBottom) || 0;
    const available = Math.floor(surface.height - top - mb);
    const cutoff = calcCutoff();

    const next = available >= cutoff;
    if (next) {
      if (!constraintRef.current) {
        surfEl.scrollTop = 0;
        surfEl.scrollLeft = 0;
      }
      constraintRef.current = true;
      setShouldConstrain(true);
      setMaxHeight(Math.max(0, available));
    } else {
      constraintRef.current = false;
      setShouldConstrain(false);
      setMaxHeight(undefined);
    }
  };

  useEffect(() => {
    if (!constrainHeight) {
      constraintRef.current = false;
      setShouldConstrain(false);
      setMaxHeight(undefined);
    } else {
      // fresh measurement will determine constraint state
      constraintRef.current = false;
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
    };
  }, [constrainHeight, surface.element]);

  useLayoutEffect(() => {
    if (!constrainHeight || !wrapRef.current || !surface.element) return;
    update();
  }, [constrainHeight, surface.height, surface.element]);

  /* sort state */
  const [sort,setSort] =
    useState<{index:number;desc:boolean}|null>(
      initialSort ? {index:initialSort.index,desc:!!initialSort.desc} : null);

  /* row selection (reference-safe) */
  const [selected,setSelected] = useState<Set<T>>(new Set());

  /* keep selection in sync with external data replacement */
  useEffect(()=>{
    setSelected(prev=>{
      const next = new Set(Array.from(prev).filter(r=>data.includes(r)));
      onSelectionChange?.(Array.from(next));
      return next;
    });
  },[data]);

  /* colours */
  const stripeColor = stripe(theme.colors.background, theme.colors.text);
  // Hover colour mixed at 25 % primary → background for extra saturation
  const hoverBg     = toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.25));

  /* sort toggle */
  const toggleSort = (idx:number)=>{
    setSort(prev=>{
      const next = !prev||prev.index!==idx
        ? {index:idx,desc:false}
        : {index:idx,desc:!prev.desc};
      onSortChange?.(next.index,next.desc);
      return next;
    });
  };

  /* selection toggle */
  const toggleSelect = (row:T, checked:boolean)=>{
    setSelected(prev=>{
      const next = new Set(prev);
      if(selectable==='single') next.clear();
      checked ? next.add(row) : next.delete(row);
      onSelectionChange?.(Array.from(next));
      return next;
    });
  };

  /* sorted data */
  const sorted = useMemo(()=>{
    if(!sort) return data;
    const col = columns[sort.index];
    if(!col||!col.sortable) return data;

    const cmp: (a:T,b:T)=>number =
      typeof col.sortable==='function'
        ? col.sortable
        : (a:T,b:T)=>{
            const getter =
              typeof col.accessor==='function'
                ? col.accessor
                : (row:T)=>row[col.accessor as keyof T];
            const va = getter(a) as any;
            const vb = getter(b) as any;
            return va>vb?1:va<vb?-1:0;
          };

    const arr = [...data].sort(cmp);
    return sort.desc ? arr.reverse() : arr;
  },[data,columns,sort]);

  const cls = [p?preset(p):'',className].filter(Boolean).join(' ')||undefined;

  /*─────────────────────────────────────────────────────────*/
  return (
    <Wrapper
      ref={wrapRef}
      style={
        shouldConstrain
          ? { overflow: 'auto', maxHeight }
          : undefined
      }
    >
    <Root
      {...rest}
      $striped={striped}
      $hover={hoverable}
      $lines={dividers}
      $border={theme.colors.backgroundAlt}
      $stripe={stripeColor}
      $hoverBg={hoverBg}
      className={cls}
      style={style}
    >
      <thead>
        <tr>
          {selectable && (
            <Th
              $align="center"
              $sortable={false}
              $active={false}
              $primary={theme.colors.primary}
              style={{width:48}}
            />
          )}
          {columns.map((c,i)=>(
            <Th
              key={i}
              $align={c.align??'left'}
              $sortable={!!c.sortable}
              $active={sort?.index===i}
              $primary={theme.colors.primary}
              onClick={c.sortable ? ()=>toggleSort(i) : undefined}
            >
              {c.header}
              {sort?.index===i && (sort.desc ? ' ▼' : ' ▲')}
            </Th>
          ))}
        </tr>
      </thead>

      <tbody>
        {sorted.map((row,rIdx)=>(
          <tr key={rIdx}>
            {selectable && (
              <Td $align="center">
                <Checkbox
                  name={`sel-${rIdx}`}
                  size="sm"
                  checked={selected.has(row)}
                  onChange={(chk)=>toggleSelect(row,chk)}
                  aria-label={`Select row ${rIdx+1}`}
                />
              </Td>
            )}

            {columns.map((c,cIdx)=>{
              const getter =
                typeof c.accessor==='function'
                  ? c.accessor
                  : (item:T)=>item[c.accessor as keyof T];

              const content = c.render
                ? c.render(row,rIdx)
                : c.accessor!==undefined
                  ? (getter(row) as React.ReactNode)
                  : null;

              return (
                <Td key={cIdx} $align={c.align??'left'}>
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
