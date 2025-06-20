// ─────────────────────────────────────────────────────────────
// src/components/Table.tsx  | valet
// strict‑optional compatible
// ─────────────────────────────────────────────────────────────
import React, { useMemo, useState, useEffect } from 'react';
import { styled }                 from '../css/createStyled';
import { useTheme }               from '../system/themeStore';
import { preset }                 from '../css/stylePresets';
import { Checkbox }               from './Checkbox';
import type { Presettable }       from '../types';
import { stripe }                 from '../utilities/colors';

/*───────────────────────────────────────────────────────────*/
/* Column definition                                          */
export interface TableColumn<T> {
  header   : React.ReactNode;
  /** field to pull from row or custom getter */
  accessor?: keyof T | ((row:T)=>unknown);
  /** optional custom renderer overrides accessor */
  render?  : (row:T,idx:number)=>React.ReactNode;
  align?   : 'left'|'center'|'right';
  /** `true` (simple > / < compare) or custom comparator  */
  sortable?: boolean | ((a:T,b:T)=>number);
}

/*───────────────────────────────────────────────────────────*/
/* Public props                                               */
export interface TableProps<T> extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'>, Presettable {
  data: T[];
  columns: TableColumn<T>[];
  striped?: boolean;
  hoverable?: boolean;
  dividers?: boolean;                       // vertical lines between cols
  /** row‑selection mode */
  selectable?: 'single' | 'multi' | undefined;
  initialSort?: { index:number; desc?:boolean };
  onSortChange?: (index:number, desc:boolean)=>void;
  onSelectionChange?: (selected:T[])=>void;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                          */
const Root = styled('table')<{ $striped:boolean; $hover:boolean; $lines:boolean; $border:string;  $stripe:string; $hoverBg:string; }>`
  width:100%;
  border-collapse:collapse;
  border:1px solid ${({$border})=>$border};

  th,td{
    padding:0.5rem 0.75rem;
    text-align:left;
    border-bottom:1px solid ${({$border})=>$border};
  }

  ${({$striped,$stripe})=>$striped&&`tbody tr:nth-of-type(odd) td{background:${$stripe};}`}
  ${({$hover,$hoverBg})=>$hover&&`tbody tr:hover td{background:${$hoverBg};}`}
  ${({$lines,$border})=>$lines&&`th:not(:last-child),td:not(:last-child){border-right:1px solid ${$border};}`}
`;

const Th = styled('th')<{ $align:'left'|'center'|'right'; $sortable:boolean; $active:boolean; $primary:string; }>`
  text-align:${({$align})=>$align};
  ${({$sortable})=>$sortable&&'cursor:pointer; user-select:none;'}
  color: inherit;
  position: relative;

  &:hover { ${({$sortable})=>$sortable&&'filter:brightness(0.9);'} }

  &::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: -1px;
    height: 4px;
    background: ${({$primary,$active})=>$active?$primary:'transparent'};
    transition: background 150ms ease;
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
  striped=false,
  hoverable=false,
  dividers=false,
  selectable,
  initialSort,
  onSortChange,
  onSelectionChange,
  preset:p,
  className,
  style,
  ...rest
}:TableProps<T>){
  const { theme } = useTheme();

  /* sort state */
  const [sort,setSort] = useState<{index:number;desc:boolean}|null>( initialSort ? {index:initialSort.index,desc:!!initialSort.desc}:null );
  /* row selection stored by reference so order change doesn't break mapping */
  const [selected,setSelected] = useState<Set<T>>(new Set());

  /* Keep selection in sync with external data replacement */
  useEffect(()=>{
    setSelected(prev=>{
      const next = new Set(Array.from(prev).filter(r=>data.includes(r)));
      if(onSelectionChange) onSelectionChange(Array.from(next));
      return next;
    });
  },[data]);

  /* colour helpers */
  const stripeColor = stripe(theme.colors.background, theme.colors.text);
  const hoverBg     = `${theme.colors.primary}22`;

  /* sorting toggle */
  const toggleSort = (idx:number)=>{
    setSort(prev=>{
      const next = !prev||prev.index!==idx ? {index:idx,desc:false}:{index:idx,desc:!prev.desc};
      onSortChange?.(next.index,next.desc);
      return next;
    });
  };

  /* selection toggle */
  const toggleSelect = (row:T, checked:boolean)=>{
    setSelected(prev=>{
      const next = new Set(prev);
      if(selectable==='single') next.clear();
      if(checked) next.add(row); else next.delete(row);
      onSelectionChange?.(Array.from(next));
      return next;
    });
  };

  /* sorted data */
  const sorted = useMemo(()=>{
    if(!sort) return data;
    const col = columns[sort.index];
    if(!col||!col.sortable) return data;

    const cmp: (a:T,b:T)=>number = typeof col.sortable==='function'?col.sortable:(a:T,b:T)=>{
      const getter = typeof col.accessor==='function'?col.accessor:(row:T)=>row[col.accessor as keyof T];
      const va = getter(a) as any; const vb = getter(b) as any;
      return va>vb?1:va<vb?-1:0;
    };

    const arr = [...data].sort(cmp);
    return sort.desc?arr.reverse():arr;
  },[data,columns,sort]);

  const cls = [p?preset(p):'',className].filter(Boolean).join(' ')||undefined;

  /* Render -------------------------------------------------------------- */
  return (
    <Root
      {...rest}
      $striped={striped}
      $hover={hoverable}
      $lines={dividers}
      $border={theme.colors.backgroundAlt}
      $stripe={stripeColor}
      $hoverBg={hoverBg}
      style={style}
      className={cls}
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
            <Th key={i}
              $align={c.align??'left'}
              $sortable={!!c.sortable}
              $active={sort?.index===i}
              $primary={theme.colors.primary}
              onClick={c.sortable?()=>toggleSort(i):undefined}
            >
              {c.header}
              {sort?.index===i&&(sort.desc?' ▼':' ▲')}
            </Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sorted.map((row,rIdx)=>{
          return (
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
                const getter = typeof c.accessor==='function'?c.accessor:(item:T)=>item[c.accessor as keyof T];
                const content = c.render?c.render(row,rIdx):c.accessor!==undefined? (getter(row) as React.ReactNode):null;
                return (
                  <Td key={cIdx} $align={c.align??'left'}>
                    {content}
                  </Td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </Root>
  );
}

export default Table;
