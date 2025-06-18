// ─────────────────────────────────────────────────────────────────────────────
// src/components/Table.tsx | valet
// Minimal yet resilient Table – fool‑proof zebra striping & hover + fancy
// sort‑column indicator that mirrors <Tabs> styling.
// Heavily optimised colour helpers 💨
// ─────────────────────────────────────────────────────────────────────────────
import React, { useMemo, useState } from 'react';
import { styled }                 from '../css/createStyled';
import { useTheme }               from '../system/themeStore';
import { preset }                 from '../css/stylePresets';
import type { Presettable }       from '../types';

/*───────────────────────────────────────────────────────────*/
/* Ultra‑fast colour helpers                                 */
type RGB = { r:number; g:number; b:number };

// Hex ➜ RGB with bit‑trickery + memoisation
const rgbCache = new Map<string, RGB>();
const toRgb = (hex:string):RGB => {
  if (rgbCache.has(hex)) return rgbCache.get(hex)!;
  let s = hex.charAt(0)==='#' ? hex.slice(1) : hex;
  if (s.length===3) s = s.replace(/./g,ch=>ch+ch);            // #abc ⇒ aabbcc

  let rgb:RGB;
  if (s.length===6 && !/[^a-f\d]/i.test(s)) {
    const n = parseInt(s,16);
    rgb = { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  } else {
    rgb = { r:0, g:0, b:0 };                                  // defensive fallback
  }
  rgbCache.set(hex,rgb);
  return rgb;
};

// Blend two colours (clamped weight) – uses bit‑floor for perf
const mix = (a:RGB, b:RGB, w:number):RGB => {
  const t = w<=0 ? 0 : w>=1 ? 1 : w;                          // clamp once
  return {
    r: ((a.r*(1-t)+b.r*t)+0.5)|0,                             // |0 floors, +0.5 ≈ round
    g: ((a.g*(1-t)+b.g*t)+0.5)|0,
    b: ((a.b*(1-t)+b.b*t)+0.5)|0,
  };
};

// RGB ➜ hex (#rrggbb) in a branch‑free single op
const toHex = ({r,g,b}:RGB) => '#'+(((1<<24)|(r<<16)|(g<<8)|b).toString(16).slice(1));

// Memoised zebra‑stripe colour (90% bg + 10% txt)
const stripeCache = new Map<string,string>();
const stripe = (bg:string, txt:string):string => {
  const key = bg+'|'+txt;
  if (stripeCache.has(key)) return stripeCache.get(key)!;
  const val = toHex(mix(toRgb(bg),toRgb(txt),0.1));
  stripeCache.set(key,val);
  return val;
};

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

const Th = styled('th')<{
  $align:'left'|'center'|'right';
  $sortable:boolean;
  $active:boolean;
  $primary:string;
}>`
  text-align:${({$align})=>$align};
  ${({$sortable})=>$sortable&&'cursor:pointer; user-select:none;'}
  color: inherit; /* text colour never changes – underline conveys state */
  position: relative;

  &:hover {
    ${({$sortable})=>$sortable&&'filter:brightness(0.9);'}
  }

  &::after {
    content: '';
    position: absolute;
    left: 0; right: 0; bottom: -1px;
    height: 4px; /* doubled */
    background: ${({$primary,$active})=>$active?$primary:'transparent'};
    transition: background 150ms ease;
  }
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
