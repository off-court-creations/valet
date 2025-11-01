// ─────────────────────────────────────────────────────────────
// src/components/fields/Select.tsx | valet
// Fully-typed, FormControl-aware <Select/> (single + multiple).
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────
import React, {
  forwardRef,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  useLayoutEffect,
  useEffect,
} from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useOptionalForm } from './FormControl';
import { Checkbox } from './Checkbox';
import type { FieldBaseProps } from '../../types';
import type { Theme } from '../../system/themeStore';

type Primitive = string | number;

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export type SelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SelectProps
  extends Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'onChange' | 'defaultValue' | 'children' | 'style'
    >,
    FieldBaseProps {
  /** Controlled value (single) or array (multiple). */
  value?: Primitive | Primitive[];
  /** Uncontrolled initial value. */
  initialValue?: Primitive | Primitive[];
  /** Callback fired whenever selection changes. */
  onChange?: (v: Primitive | Primitive[]) => void;
  /** Multiple-selection mode. */
  multiple?: boolean;
  /** Placeholder when nothing selected. */
  placeholder?: string;
  /** Size token or custom measurement */
  size?: SelectSize | number | string;
  disabled?: boolean;
  /** Option nodes (see Select.Option). */
  children: React.ReactNode;
}

export interface OptionProps extends React.LiHTMLAttributes<HTMLLIElement> {
  value: Primitive;
  disabled?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Size tokens                                               */
const geom = (t: Theme) =>
  ({
    xs: { h: '1.5rem', pad: t.spacing(0.75), font: '0.625rem' },
    sm: { h: '1.875rem', pad: t.spacing(1), font: '0.75rem' },
    md: { h: '2.375rem', pad: t.spacing(1.25), font: '0.875rem' },
    lg: { h: '2.875rem', pad: t.spacing(1.5), font: '1rem' },
    xl: { h: '3.375rem', pad: t.spacing(1.75), font: '1.125rem' },
  }) as const;

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Trigger = styled('button')<{
  $h: string;
  $pad: string;
  $bg: string;
  $text: string;
  $primary: string;
  $radius: string;
  $outlineW: string;
  $outlineOffset: string;
}>`
  all: unset;
  box-sizing: border-box;
  width: 100%;
  height: ${({ $h }) => $h};
  padding: 0 ${({ $pad }) => $pad};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;

  border: 1px solid var(--valet-border, #ffffff22);
  border-radius: ${({ $radius }) => $radius};
  background: var(--valet-bg, ${({ $bg }) => $bg});
  color: var(--valet-text-color, ${({ $text }) => $text});
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover:not([disabled]) {
    border-color: ${({ $primary }) => $primary};
  }
  &:focus-visible {
    outline: ${({ $outlineW }) => $outlineW} solid ${({ $primary }) => $primary};
    outline-offset: ${({ $outlineOffset }) => $outlineOffset};
  }
  &[disabled] {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const Caret = styled('span')`
  border: solid currentColor;
  border-width: 0 1px 1px 0;
  padding: 3px;
  transform: rotate(45deg);
`;

const PortalWrap = styled('div')`
  position: fixed;
  inset: 0;
  z-index: 9999;
`;

const Menu = styled('ul')<{
  $w: number;
  $top: number;
  $left: number;
  $bg: string;
  $radius: string;
  $padY: string;
}>`
  position: absolute;
  min-width: ${({ $w }) => $w}px;
  width: max-content;
  max-width: min(100vw - 2rem, 360px);
  max-height: 260px;
  top: ${({ $top }) => $top}px;
  left: ${({ $left }) => $left}px;
  margin: 0;
  padding: ${({ $padY }) => `${$padY} 0`};
  list-style: none;
  border-radius: ${({ $radius }) => $radius};
  background: ${({ $bg }) => $bg};
  box-shadow: 0 8px 24px #00000040;
  overflow-y: auto;
  overflow-x: hidden;
`;

const Item = styled('li')<{
  $pad: string;
  $padY: string;
  $active?: boolean;
  $disabled?: boolean;
  $primary: string;
}>`
  padding: ${({ $padY, $pad }) => `${$padY} ${$pad}`};
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
  background: ${({ $active, $primary }) => ($active ? $primary + '22' : 'transparent')};

  &:hover:not([data-disabled='true']) {
    background: ${({ $primary }) => $primary + '33'};
  }
`;

/*───────────────────────────────────────────────────────────*/
/* Helpers                                                   */
const eq = (a: Primitive, b: Primitive) => String(a) === String(b);
const array = <T,>(v: T | T[]) => (Array.isArray(v) ? v : [v]);

/*───────────────────────────────────────────────────────────*/
/* JSX helper component                                      */
export const Option: React.FC<OptionProps> = ({ children }) => <>{children}</>;
Option.displayName = 'Select.Option';

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
const Inner = (props: SelectProps, ref: React.Ref<HTMLDivElement>) => {
  const {
    value: valueProp,
    initialValue,
    onChange,
    multiple = false,
    placeholder = 'Select…',
    size = 'md',
    disabled = false,
    name,
    children,
    preset: presetKey,
    className,
    sx,
    ...divRest
  } = props;

  /* theme + geometry --------------------------------------- */
  const { theme } = useTheme();
  const map = geom(theme);

  let g: { h: string; pad: string; font: string };

  if (typeof size === 'number') {
    const h = `${size}px`;
    g = { h, pad: `${size * 0.26}px`, font: `calc(${h} * 0.35)` };
  } else if (map[size as SelectSize]) {
    g = map[size as SelectSize];
  } else {
    const h = size;
    g = { h, pad: `calc(${size} * 0.26)`, font: `calc(${size} * 0.35)` };
  }

  // Text on backgroundAlt should be off-white for contrast in all modes.
  const textCol = theme.colors.primaryText;
  // Use backgroundAlt for control backgrounds; avoid non-existent `surface` tokens
  const bg = theme.colors.backgroundAlt;
  const bgElev = theme.colors.backgroundAlt;
  const primary = theme.colors.primary;

  /* optional FormControl hook ------------------------------ */
  const form = useOptionalForm<Record<string, unknown>>();

  /* value management --------------------------------------- */
  const formVal =
    form && name ? (form.values[name] as Primitive | Primitive[] | undefined) : undefined;
  const controlled = formVal !== undefined || valueProp !== undefined;

  const [self, setSelf] = useState<Primitive | Primitive[] | undefined>(initialValue);
  const cur = controlled ? (formVal !== undefined ? formVal : valueProp!) : self;

  /* commit helper ------------------------------------------ */
  const commit = useCallback(
    (next: Primitive | Primitive[]) => {
      if (!controlled) setSelf(next);
      if (form && name) form.setField(name as keyof Record<string, unknown>, next as unknown);
      onChange?.(next);
    },
    [controlled, form, name, onChange],
  );

  /* open state & position ---------------------------------- */
  const [open, setOpen] = useState(false);
  const trigRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ w: 0, top: 0, left: 0 });

  const calcPos = () => {
    if (!trigRef.current) return;
    const r = trigRef.current.getBoundingClientRect();
    setPos({ w: r.width, top: r.bottom + 4, left: r.left });
  };

  /* close on click-away / Esc ------------------------------ */
  React.useLayoutEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !trigRef.current?.contains(e.target as Node)
      )
        setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  /* flatten options ---------------------------------------- */
  const opts = useMemo(
    () =>
      React.Children.toArray(children).filter(
        (n) =>
          React.isValidElement<OptionProps>(n) &&
          (n as React.ReactElement<OptionProps>).props.value !== undefined,
      ) as React.ReactElement<OptionProps>[],
    [children],
  );

  /* active index for keyboard nav -------------------------- */
  const [active, setActive] = useState(0);
  const move = (dir: 1 | -1) => {
    setActive((i) => {
      let n = i;
      if (opts.length === 0) return 0;
      do {
        n = (n + dir + opts.length) % opts.length;
      } while (opts[n].props.disabled);
      return n;
    });
  };

  /* helpers ------------------------------------------------ */
  const isSel = (v: Primitive) =>
    multiple ? (array(cur ?? []) as Primitive[]).some((x) => eq(x, v)) : eq(cur as Primitive, v);

  const toggle = (v: Primitive) => {
    if (multiple) {
      const arr = array(cur ?? []) as Primitive[];
      const exists = arr.some((x) => eq(x, v));
      commit(exists ? arr.filter((x) => !eq(x, v)) : [...arr, v]);
    } else {
      commit(v);
      setOpen(false);
    }
  };

  const label = useMemo(() => {
    if (cur == null || (Array.isArray(cur) && !cur.length)) return placeholder;

    if (multiple) {
      return (
        opts
          .filter((o) => array(cur as Primitive[]).some((v) => eq(v, o.props.value)))
          .map((o) => o.props.children) as unknown as string[]
      ).join(', ');
    }
    const found = opts.find((o) => eq(o.props.value, cur as Primitive));
    return found ? (found.props.children as unknown as string) : placeholder;
  }, [cur, multiple, opts, placeholder]);

  /* aria linking ------------------------------------------ */
  const listId = useId();
  const optIds = useMemo(() => opts.map((_, i) => `${listId}-opt-${i}`), [opts, listId]);

  // Ensure focused option is visible as user navigates
  useEffect(() => {
    if (!open) return;
    const el = document.getElementById(optIds[active]);
    if (!el || !menuRef.current) return;
    const parent = menuRef.current;
    const pr = parent.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    if (er.top < pr.top || er.bottom > pr.bottom) el.scrollIntoView({ block: 'nearest' });
  }, [active, open, optIds]);

  // Focus the listbox when opened and set active to the current selection (or first enabled)
  useLayoutEffect(() => {
    if (!open) return;
    // Determine initial active index
    let initial = 0;
    if (multiple) {
      const arr = array(cur ?? []) as Primitive[];
      const idx = opts.findIndex((o) => arr.some((v) => eq(v, o.props.value)) && !o.props.disabled);
      initial = idx >= 0 ? idx : opts.findIndex((o) => !o.props.disabled);
    } else {
      const idx = opts.findIndex((o) => eq(o.props.value, cur as Primitive) && !o.props.disabled);
      initial = idx >= 0 ? idx : opts.findIndex((o) => !o.props.disabled);
    }
    if (initial < 0) initial = 0;
    setActive(initial);
    // Focus the listbox
    menuRef.current?.focus();
  }, [open, opts, multiple, cur]);

  /* preset classes merge ----------------------------------- */
  const presetCls = presetKey ? preset(presetKey) : '';
  const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

  /*──────────────────────────────────────────────────────────*/
  return (
    <div
      {...divRest}
      ref={ref}
      className={mergedCls}
      style={{ ...sx, position: 'relative', display: 'inline-block' }}
    >
      {/* Trigger */}
      <Trigger
        ref={trigRef}
        $h={g.h}
        $pad={g.pad}
        $bg={bg}
        $text={textCol}
        $primary={primary}
        $radius={theme.radius(1)}
        $outlineW={theme.stroke(2)}
        $outlineOffset={theme.stroke(2)}
        type='button'
        role='combobox'
        aria-haspopup='listbox'
        aria-controls={listId}
        aria-expanded={open}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
          calcPos();
        }}
        onKeyDown={(e: React.KeyboardEvent<HTMLButtonElement>) => {
          if (disabled) return;
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setOpen(true);
            calcPos();
            move(1);
          }
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            setOpen(true);
            calcPos();
            move(-1);
          }
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            setOpen((o) => !o);
            calcPos();
          }
        }}
      >
        <span style={{ fontSize: g.font, flex: 1 }}>{label}</span>
        <Caret />
      </Trigger>

      {/* Menu */}
      {open && (
        <PortalWrap>
          <Menu
            ref={menuRef}
            $w={pos.w}
            $top={pos.top}
            $left={pos.left}
            $bg={bgElev}
            $radius={theme.radius(1)}
            $padY={theme.spacing(0.5)}
            role='listbox'
            id={listId}
            aria-multiselectable={multiple || undefined}
            aria-activedescendant={optIds[active]}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLUListElement>) => {
              const { key } = e;
              if (key === 'Escape') {
                setOpen(false);
                trigRef.current?.focus();
                return;
              }
              if (key === 'Tab') {
                // Close and allow default tab navigation
                setOpen(false);
                return;
              }
              if (key === 'ArrowDown') {
                e.preventDefault();
                move(1);
                return;
              }
              if (key === 'ArrowUp') {
                e.preventDefault();
                move(-1);
                return;
              }
              if (key === 'Home') {
                e.preventDefault();
                const first = opts.findIndex((o) => !o.props.disabled);
                if (first >= 0) setActive(first);
                return;
              }
              if (key === 'End') {
                e.preventDefault();
                for (let i = opts.length - 1; i >= 0; i--) {
                  if (!opts[i].props.disabled) {
                    setActive(i);
                    break;
                  }
                }
                return;
              }
              if (key === 'Enter' || key === ' ') {
                e.preventDefault();
                const o = opts[active];
                if (!o || o.props.disabled) return;
                const val = o.props.value;
                toggle(val);
                if (!multiple) {
                  // Close for single-select and return focus to trigger
                  setOpen(false);
                  trigRef.current?.focus();
                }
              }
            }}
          >
            {opts.map((o, i) => {
              const sel = isSel(o.props.value);
              return (
                <Item
                  id={optIds[i]}
                  key={o.props.value}
                  role='option'
                  aria-selected={sel}
                  data-disabled={o.props.disabled}
                  $pad={g.pad}
                  $padY={theme.spacing(0.75)}
                  $active={i === active}
                  $disabled={o.props.disabled}
                  $primary={primary}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => !o.props.disabled && toggle(o.props.value)}
                >
                  {multiple && (
                    <Checkbox
                      // Visual-only indicator; prevent form binding and submission
                      bindForm={false}
                      // Controlled mirror of selection state
                      checked={sel}
                      // Small footprint and spacing to match prior layout
                      size='sm'
                      sx={{ marginRight: theme.spacing(0.75) }}
                      aria-hidden
                      tabIndex={-1}
                    />
                  )}
                  {o.props.children}
                </Item>
              );
            })}
          </Menu>
        </PortalWrap>
      )}
    </div>
  );
};

const Forward = forwardRef<HTMLDivElement, SelectProps>(
  Inner,
) as unknown as React.ForwardRefExoticComponent<
  SelectProps & React.RefAttributes<HTMLDivElement>
> & { Option: typeof Option };

Forward.displayName = 'Select';
Forward.Option = Option;

export const Select = Forward;

export default Forward;
