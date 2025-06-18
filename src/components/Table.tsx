// ─────────────────────────────────────────────────────────────────────────────
// src/components/Table.tsx | valet
// Minimal yet resilient Table – fool‑proof zebra striping & hover.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { styled }                 from '../css/createStyled';
import { useTheme }               from '../system/themeStore';
import { preset }                 from '../css/stylePresets';
import type { Presettable }       from '../types';

/*───────────────────────────────────────────────────────────*/
/* Utility helpers                                           */
const HEX_RE = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;
const toRgb  = (h: string) => {
  const m = HEX_RE.exec(h);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r:0,g:0,b:0 };
};
const mix = (a:{r:number,g:number,b:number}, b:{r:number,g:number,b:number}, w:number) => ({
  r: Math.round(a.r*(1-w)+b.r*w),
  g: Math.round(a.g*(1-w)+b.g*w),
  b: Math.round(a.b*(1-w)+b.b*w),
});
const toHex = (c:{r:number,g:number,b:number}) => `#${[c.r,c.g,c.b].map(x=>x.toString(16).padStart(2,'0')).join('')}`;
const stripe = (bg:string, txt:string) => toHex(mix(toRgb(bg), toRgb(txt), 0.1));

/*───────────────────────────────────────────────────────────*/
/* Column definition                                          */
export interface TableColumn<T> {
  header   : React.ReactNode;
  accessor?: keyof T | ((row: T) => unknown);
  render?  : (row: T, idx: number) => React.ReactNode;
  align?   : 'left' | 'center' | 'right';
  sortable?: boolean | ((a:T,b:T)=>number);
}

/*───────────────────────────────────────────────────────────*/
/* Public props                                               */
export interface TableProps<T> extends Omit<React.TableHTMLAttributes<HTMLTableElement>, 'children'>, Presettable {
  data: T[];
  columns: TableColumn<T>[];
  striped?: boolean;
  hoverable?: boolean;
  initialSort?: { index:number; desc?:boolean };
  onSortChange?: (index:number, desc:boolean)=>void;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                          */
const Root = styled('table')<{
  $striped:boolean; $hover:boolean; $border:string; $stripe:string; $hoverBg:string;
}>`
  width:100%;
  border-collapse:collapse;
  border:1px solid ${({$border})=>$border};

  th,td{padding:0.5rem 0.75rem; text-align:left; border-bottom:1px solid ${({$border})=>$border};}

  ${({$striped,$stripe})=>$striped&&`tbody tr:nth-of-type(odd) td{background:${$stripe};}`}
  ${({$hover,$hoverBg})=>$hover&&`tbody tr:hover td{background:${$hoverBg};}`}
`;

const Th = styled('th')<{ $align:'left'|'center'|'right'; $sortable:boolean; $active:boolean; $primary:string;}>`
  text-align:${({$align})=>$align};
  ${({$sortable})=>$sortable&&'cursor:pointer; user-select:none;'}
  color:${({$active,$primary})=>$active?$primary:'inherit'};
  &:hover{${({$sortable,$primary})=>$sortable&&`color:${$primary};`}}
`;

const Td = styled('td')<{ $align:'left'|'center'|'right' }>`
  text-align:${({$align})=>$align};
`;

/*───────────────────────────────────────────────────────────*/
/* Component                                                  */
export function Table<T>({
  data,
  columns,
  striped=false,
  hoverable=false,
  initialSort,
  onSortChange,
  preset:p,
  className,
  style,
  ...rest
}:TableProps<T>){
  const { theme } = useTheme();
  const [sort,setSort] = useState<{index:number;desc:boolean}|null>( initialSort ? {index:initialSort.index,desc:!!initialSort.desc}:null );

  const stripeColor = stripe(theme.colors.background, theme.colors.text);
  const hoverBg     = `${theme.colors.primary}22`;

  const toggleSort = (idx:number)=>{
    setSort(prev=>{
      const next = !prev||prev.index!==idx ? {index:idx,desc:false}:{index:idx,desc:!prev.desc};
      onSortChange?.(next.index,next.desc);
      return next;
    });
  };

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

  return(
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
      <thead>
        <tr>
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
        {sorted.map((row,rIdx)=>(
          <tr key={rIdx}>
            {columns.map((c,cIdx)=>{
              const getter = typeof c.accessor==='function'?c.accessor:(item:T)=>item[c.accessor as keyof T];
              const content = c.render?c.render(row,rIdx):c.accessor? (getter(row) as React.ReactNode):null;
              return(
                <Td key={cIdx} $align={c.align??'left'}>
                  {content}
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
