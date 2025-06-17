// ─────────────────────────────────────────────────────────────────────────────
// src/components/Select.tsx | valet
// Fully-typed, FormControl-aware <Select/> (single + multiple).
// © 2025 Off-Court Creations – MIT licence
// ─────────────────────────────────────────────────────────────────────────────
import React, {
    forwardRef,
    useCallback,
    useId,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
  }                               from 'react';
  import { styled }               from '../css/createStyled';
  import { useTheme }             from '../system/themeStore';
  import { preset }               from '../css/stylePresets';
  import { useForm }              from './FormControl';
  import type { Presettable }     from '../types';
  import type { Theme }           from '../system/themeStore';
  
  type Primitive = string | number;
  
  /*───────────────────────────────────────────────────────────*/
  /* Public props                                              */
  export interface SelectProps
    extends Omit<
        React.HTMLAttributes<HTMLDivElement>,
        'onChange' | 'defaultValue' | 'children'
      >,
      Presettable {
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
    /** Size token */
    size?: 'sm' | 'md' | 'lg';
    disabled?: boolean;
    /** Field name for FormControl binding. */
    name?: string;
    /** Option nodes (see Select.Option). */
    children: React.ReactNode;
  }
  
  export interface OptionProps
    extends React.LiHTMLAttributes<HTMLLIElement> {
    value: Primitive;
    disabled?: boolean;
  }
  
  /*───────────────────────────────────────────────────────────*/
  /* Size tokens                                               */
  const geom = (t: Theme) => ({
    sm: { h: 30, pad: 8,  font: '0.75rem'  },
    md: { h: 38, pad: 10, font: '0.875rem' },
    lg: { h: 46, pad: 12, font: '1rem'     },
  }) as const;
  
  /*───────────────────────────────────────────────────────────*/
  /* Styled primitives                                         */
  const Trigger = styled('button')<{
    $h: number;
    $pad: number;
    $bg: string;
    $text: string;
    $primary: string;
  }>`
    all: unset;
    box-sizing: border-box;
    width: 100%;
    height: ${({ $h }) => $h}px;
    padding: 0 ${({ $pad }) => $pad}px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  
    border: 1px solid var(--valet-border,#ffffff22);
    border-radius: 6px;
    background: var(--valet-bg, ${({ $bg }) => $bg});
    color: var(--valet-text, ${({ $text }) => $text});
    cursor: pointer;
    transition: border-color .15s;
  
    &:hover:not([disabled]) { border-color: ${({ $primary }) => $primary}; }
    &:focus-visible         { outline:2px solid ${({ $primary }) => $primary};
                               outline-offset:2px; }
    &[disabled]             { opacity:.45; cursor:not-allowed; }
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
    $w: number; $top: number; $left: number; $bg: string;
  }>`
    position: absolute;
    width: ${({ $w }) => $w}px;
    max-height: 260px;
    top: ${({ $top }) => $top}px;
    left: ${({ $left }) => $left}px;
    margin: 0;
    padding: 4px 0;
    list-style: none;
    border-radius: 6px;
    background: ${({ $bg }) => $bg};
    box-shadow: 0 8px 24px #00000040;
    overflow-y: auto;
  `;
  
  const Item = styled('li')<{
    $pad: number; $active?: boolean; $disabled?: boolean; $primary: string;
  }>`
    padding: 6px ${({ $pad }) => $pad}px;
    cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
    opacity:${({ $disabled }) => ($disabled ? .45 : 1)};
    background:${({ $active,$primary }) => $active ? $primary+'22' : 'transparent'};
  
    &:hover:not([data-disabled='true']) {
      background: ${({ $primary }) => $primary+'33'};
    }
  `;
  
  /*───────────────────────────────────────────────────────────*/
  /* Helpers                                                   */
  const eq    = (a: any, b: any) => String(a) === String(b);
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
      style,
      ...divRest
    } = props;
  
    /* theme + geometry --------------------------------------- */
    const { theme }       = useTheme();
    const g               = geom(theme)[size];
    const textCol         = theme.colors.text;
    const bg              = theme.colors.surface;
    const bgElev          = theme.colors.surfaceElevated ?? theme.colors.backgroundAlt ?? bg;
    const primary         = theme.colors.primary;
  
    /* optional FormControl hook ------------------------------ */
    let form: ReturnType<typeof useForm<any>> | null = null;
    try { form = useForm<any>(); } catch {}
  
    /* value management --------------------------------------- */
    const formVal = form && name ? form.values[name] : undefined;
    const controlled = formVal !== undefined || valueProp !== undefined;
  
    const [self, setSelf] = useState(initialValue);
    const cur = controlled
      ? (formVal !== undefined ? formVal : valueProp!)
      : self;
  
    /* commit helper ------------------------------------------ */
    const commit = useCallback(
      (next: Primitive | Primitive[]) => {
        if (!controlled) setSelf(next);
        if (form && name) form.setField(name as any, next);
        onChange?.(next);
      },
      [controlled, form, name, onChange],
    );
  
    /* open state & position ---------------------------------- */
    const [open, setOpen] = useState(false);
    const trigRef         = useRef<HTMLButtonElement>(null);
    const menuRef         = useRef<HTMLUListElement>(null);
    const [pos, setPos]   = useState({ w: 0, top: 0, left: 0 });
  
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
          menuRef.current   && !menuRef.current.contains(e.target as Node) &&
          !trigRef.current?.contains(e.target as Node)
        ) setOpen(false);
      };
      const onEsc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
      document.addEventListener('mousedown', onDoc);
      document.addEventListener('keydown',   onEsc);
      return () => { document.removeEventListener('mousedown', onDoc);
                     document.removeEventListener('keydown',   onEsc); };
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
        do { n = (n + dir + opts.length) % opts.length; }
        while (opts[n].props.disabled);
        return n;
      });
    };
  
    /* helpers ------------------------------------------------ */
    const isSel = (v: Primitive) =>
      multiple ? array(cur ?? []).some((x) => eq(x, v)) : eq(cur, v);
  
    const toggle = (v: Primitive) => {
      if (multiple) {
        const arr = array(cur ?? []);
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
        return opts
          .filter((o) => array(cur).some((v) => eq(v, o.props.value)))
          .map((o) => o.props.children)
          .join(', ');
      }
      const found = opts.find((o) => eq(o.props.value, cur));
      return found ? found.props.children : placeholder;
    }, [cur, multiple, opts, placeholder]);
  
    /* aria linking ------------------------------------------ */
    const listId = useId();
  
    /* preset classes merge ----------------------------------- */
    const presetCls = presetKey ? preset(presetKey) : '';
    const mergedCls =
      [presetCls, className].filter(Boolean).join(' ') || undefined;
  
    /*──────────────────────────────────────────────────────────*/
    return (
      <div
        {...divRest}
        ref={ref}
        className={mergedCls}
        style={{ ...style, position: 'relative', display: 'inline-block' }}
      >
        {/* Trigger */}
        <Trigger
          ref={trigRef}
          $h={g.h}
          $pad={g.pad}
          $bg={bg}
          $text={textCol}
          $primary={primary}
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-controls={listId}
          aria-expanded={open}
          disabled={disabled}
          onClick={() => { if (disabled) return;
                           setOpen((o) => !o); calcPos(); }}
          onKeyDown={(e) => {
            if (disabled) return;
            if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); calcPos(); move( 1); }
            if (e.key === 'ArrowUp')   { e.preventDefault(); setOpen(true); calcPos(); move(-1); }
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault(); setOpen((o) => !o); calcPos();
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
              role="listbox"
              id={listId}
            >
              {opts.map((o, i) => {
                const sel = isSel(o.props.value);
                return (
                  <Item
                    key={o.props.value}
                    role="option"
                    aria-selected={sel}
                    data-disabled={o.props.disabled}
                    $pad={g.pad}
                    $active={i === active}
                    $disabled={o.props.disabled}
                    $primary={primary}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => !o.props.disabled && toggle(o.props.value)}
                  >
                    {multiple && (
                      <input
                        type="checkbox"
                        readOnly
                        checked={sel}
                        style={{ marginRight: 6 }}
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
  
const Forward = forwardRef<HTMLDivElement, SelectProps>(Inner) as unknown as
  React.ForwardRefExoticComponent<SelectProps &
    React.RefAttributes<HTMLDivElement>> & { Option: typeof Option };

Forward.displayName = 'Select';
Forward.Option      = Option;

export const Select = Forward;

export default Forward;