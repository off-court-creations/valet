// ─────────────────────────────────────────────────────────────
// src/components/fields/Select.tsx | valet
// Fully-typed, FormControl-aware <Select/> (single + multiple).
// © 2025 Off-Court Creations – MIT licence
//
// FIELDS S8 (rulings R9/R10): value/form/internal resolution delegated to the
// shared `useFieldState` hook (precedence prop > form > internal, latched at
// mount, no mount-time store writes). This replaces the old hand-rolled guard
// whose `controlled = formVal !== undefined || valueProp !== undefined`
// predicate let form-presence override an explicit `value` prop and recomputed
// the mode every render. ChangeInfo.source is classified honestly: an option
// chosen by pointer click reports 'pointer', one chosen via keyboard
// (Enter/Space/arrow-activation) reports 'keyboard', instead of the old
// hardcoded 'programmatic'.
// Rebased on OVERLAY S6 (the real-portal migration, ruling R11).
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
import { createPortal } from 'react-dom';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { Checkbox } from './Checkbox';
import { getOverlayRoot, useOverlay } from '../../system/overlay';
import { inheritSurfaceFontVars } from '../../system/inheritSurfaceFontVars';
import { zVar } from '../../system/zIndex';
import { useFieldState } from '../../hooks/useControlledState';
import type { FieldBaseProps, Presettable, Sx } from '../../types';
import type { ChangeInfo, InputSource, OnValueChange, OnValueCommit } from '../../system/events';
import type { Theme } from '../../system/themeStore';

type Primitive = string | number;

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export type SelectSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface SelectProps
  extends Omit<
      React.ButtonHTMLAttributes<HTMLButtonElement>,
      'onChange' | 'defaultValue' | 'children' | 'style' | 'value'
    >,
    FieldBaseProps {
  /** Controlled value (single) or array (multiple). */
  value?: Primitive | Primitive[];
  /** Uncontrolled default value. */
  defaultValue?: Primitive | Primitive[];
  /** Canonical value change event (fires on selection). */
  onValueChange?: OnValueChange<Primitive | Primitive[]>;
  /** Commit event (fires on selection/confirm). */
  onValueCommit?: OnValueCommit<Primitive | Primitive[]>;
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

export interface OptionProps extends React.LiHTMLAttributes<HTMLLIElement>, Presettable {
  value: Primitive;
  disabled?: boolean;
  /** Inline styles (with CSS var support); merged over `style` (sx wins). */
  sx?: Sx;
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
  $border: string;
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

  border: 1px solid var(--valet-border, ${({ $border }) => $border});
  border-radius: ${({ $radius }) => $radius};
  background: var(--valet-bg, ${({ $bg }) => $bg});
  color: var(--valet-text-color, ${({ $text }) => $text});
  cursor: pointer;
  transition: border-color 0.15s;

  &:hover:not([disabled]) {
    border-color: ${({ $primary }) => $primary};
  }
  &:focus-visible {
    outline: ${({ $outlineW }) => $outlineW} solid
      var(--valet-focus-ring-color, ${({ $primary }) => $primary});
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

/* OVERLAY S6: the menu is now a REAL portal into #valet-overlay-root
   (see getOverlayRoot). It is `position: fixed`, anchored to the trigger's
   viewport rect — so it escapes any transform/overflow-clipping ancestor of
   the trigger, and outside-click/Escape route through the shared overlay
   stack (useOverlay) instead of hand-rolled document listeners. The
   Wave-0.3/OVERLAY-S2 fake full-viewport wrap div and its pointer-event
   passthrough insurance are deleted. */
const Menu = styled('ul')<{
  $w: number;
  $top: number;
  $left: number;
  $bg: string;
  $radius: string;
  $padY: string;
}>`
  position: fixed;
  min-width: ${({ $w }) => $w}px;
  width: max-content;
  max-width: min(100vw - 2rem, 360px);
  max-height: 260px;
  top: ${({ $top }) => $top}px;
  /* rtl: physical-by-design — fixed portal anchored to the trigger's measured getBoundingClientRect().left */
  left: ${({ $left }) => $left}px;
  margin: 0;
  padding: ${({ $padY }) => `${$padY} 0`};
  list-style: none;
  border-radius: ${({ $radius }) => $radius};
  background: ${({ $bg }) => $bg};
  box-shadow: 0 8px 24px #00000040;
  overflow-y: auto;
  overflow-x: hidden;
  /* Dropdown sits above modals/appbar on the shared z-scale. */
  z-index: ${zVar('dropdown')};
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
const Inner = (props: SelectProps, ref: React.Ref<HTMLButtonElement>) => {
  const {
    value: valueProp,
    defaultValue,
    onValueChange,
    onValueCommit,
    multiple = false,
    placeholder = 'Select…',
    size = 'md',
    disabled = false,
    name,
    children,
    preset: presetKey,
    className,
    sx,
    // API-TYPES S6 (stage A): destructure the FieldBaseProps cluster BEFORE the
    // rest-spread so label/helperText/error/fullWidth stop leaking onto the
    // <Trigger> button as invalid DOM attributes. FieldShell rendering is
    // Phase 2 / Q10 — only `error` is wired (aria-invalid below); the rest are
    // swallowed for now. `label` is aliased to avoid shadowing the internal
    // selected-option display text (const below); the swallowed members are
    // void-referenced so they neither leak nor trip no-unused-vars.
    label: _label,
    helperText: _helperText,
    error,
    fullWidth: _fullWidth,
    ...divRest
  } = props;
  void _label;
  void _helperText;
  void _fullWidth;

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
  const border = theme.colors.divider ?? 'rgba(255, 255, 255, 0.25)';

  /* value management --------------------------------------- */
  /**
   * Single resolution of value/control/form binding (ruling R9). Precedence is
   * prop > form > internal, latched at mount; an unseeded form key renders
   * `defaultValue ?? null` as controlled and never writes on mount. `null` is
   * the empty value (nothing selected) — it renders the placeholder. The setter
   * writes through to the store whenever live-bound. This replaces the old
   * hand-rolled guard where form-presence could override an explicit `value`.
   */
  const [curRaw, setValue] = useFieldState<Primitive | Primitive[] | null>({
    value: valueProp,
    defaultValue,
    fallback: null,
    name,
    component: 'Select',
  });
  const cur = curRaw ?? undefined;

  /* commit helper — `src` is the honest activation source (ruling R10). */
  const commit = useCallback(
    (next: Primitive | Primitive[], src: InputSource) => {
      setValue(next);
      const info: ChangeInfo<Primitive | Primitive[]> = {
        previousValue: cur,
        phase: 'commit',
        source: src,
        name,
      } as ChangeInfo<Primitive | Primitive[]>;
      onValueChange?.(next, { ...info, phase: 'input' });
      onValueCommit?.(next, info);
    },
    [setValue, name, onValueChange, onValueCommit, cur],
  );

  /* open state & position ---------------------------------- */
  const [open, setOpen] = useState(false);
  const trigRef = useRef<HTMLButtonElement>(null);
  const setTriggerRef = (node: HTMLButtonElement | null) => {
    trigRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref && typeof ref !== 'function') {
      (ref as React.MutableRefObject<HTMLButtonElement | null>).current = node;
    }
  };
  const menuRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ w: 0, top: 0, left: 0 });

  const calcPos = useCallback(() => {
    if (!trigRef.current) return;
    const r = trigRef.current.getBoundingClientRect();
    // Viewport coordinates — the menu is `position: fixed` in the portal.
    setPos({ w: r.width, top: r.bottom + 4, left: r.left });
  }, []);

  /* close helper: closes the menu and returns focus to the trigger ----- */
  const closeMenu = useCallback(() => {
    setOpen(false);
    trigRef.current?.focus();
  }, []);

  /* Shared overlay wiring (registry v2): outside-click + Escape dismissal
     route through the stack while open. Escape closes ONLY this menu — the
     top-most layer — so a Select opened inside a Modal no longer closes the
     Modal too (audit Select.tsx:286 / overlay.ts:169). No focus trap or inert
     background: the menu is a transient popup, not a dialog. onRequestClose
     resolves live at event time. */
  const overlayRef = useOverlay(open, () => ({
    anchors: [trigRef.current!].filter(Boolean) as HTMLElement[],
    onRequestClose: () => closeMenu(),
    trapFocus: false,
    restoreFocusOnClose: false,
    inertBackground: false,
    label: 'Select',
  }));

  /* Merge the overlay registration ref with the local menuRef. */
  const setMenuRef = useCallback(
    (node: HTMLUListElement | null) => {
      menuRef.current = node;
      overlayRef(node);
    },
    [overlayRef],
  );

  /* Reposition on scroll/resize while open; mirror Surface font/typography
     vars into the portalled menu (it lives outside the Surface subtree). */
  useLayoutEffect(() => {
    if (!open) return;
    if (menuRef.current) inheritSurfaceFontVars(menuRef.current);
    calcPos();
    window.addEventListener('scroll', calcPos, true);
    window.addEventListener('resize', calcPos);
    return () => {
      window.removeEventListener('scroll', calcPos, true);
      window.removeEventListener('resize', calcPos);
    };
  }, [open, calcPos]);

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

  const toggle = (v: Primitive, src: InputSource) => {
    if (multiple) {
      const arr = array(cur ?? []) as Primitive[];
      const exists = arr.some((x) => eq(x, v));
      commit(exists ? arr.filter((x) => !eq(x, v)) : [...arr, v], src);
    } else {
      commit(v, src);
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
  /* Resolved <li> ids: a caller-supplied `id` on a <Select.Option> wins,
     otherwise a generated `${listId}-opt-${i}`. Used for the rendered id,
     `aria-activedescendant`, and scroll-into-view so all three agree even when
     an Option forwards its own id (API-TYPES S7). */
  const optIds = useMemo(
    () => opts.map((o, i) => o.props.id ?? `${listId}-opt-${i}`),
    [opts, listId],
  );

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
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger */}
      <Trigger
        ref={setTriggerRef}
        data-valet-component='Select'
        data-state={open ? 'open' : 'closed'}
        data-disabled={disabled ? 'true' : 'false'}
        $h={g.h}
        $pad={g.pad}
        $bg={bg}
        $text={textCol}
        $primary={primary}
        $radius={theme.radius(1)}
        $outlineW={theme.stroke(2)}
        $outlineOffset={theme.stroke(2)}
        $border={border}
        type='button'
        role='combobox'
        aria-haspopup='listbox'
        aria-controls={listId}
        aria-expanded={open}
        aria-invalid={error || undefined}
        disabled={disabled}
        {...(divRest as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        className={mergedCls}
        style={sx as React.CSSProperties}
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

      {/* Menu — real portal into #valet-overlay-root (OVERLAY S6) */}
      {open &&
        createPortal(
          <Menu
            ref={setMenuRef}
            $w={pos.w}
            $top={pos.top}
            $left={pos.left}
            $bg={bgElev}
            $radius={theme.radius(1)}
            $padY={theme.spacing(0.5)}
            data-valet-component='SelectMenu'
            role='listbox'
            id={listId}
            aria-multiselectable={multiple || undefined}
            aria-activedescendant={optIds[active]}
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLUListElement>) => {
              const { key } = e;
              if (key === 'Escape') {
                // Stop the shared overlay stack from also seeing this Escape
                // (it would close-and-refocus a second time / reach an outer
                // layer). Close exactly this menu.
                e.stopPropagation();
                closeMenu();
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
                toggle(val, 'keyboard');
                if (!multiple) {
                  // Close for single-select and return focus to trigger
                  closeMenu();
                }
              }
            }}
          >
            {opts.map((o, i) => {
              const sel = isSel(o.props.value);
              /* API-TYPES S7: forward the <Select.Option>'s own props onto the
                 rendered <li>. Previously OptionProps (className/style/id/data-*)
                 were declared but ignored. We strip the marker-only props (value,
                 children) and the styling props handled explicitly (preset/sx/
                 style/className/id), then spread the remainder so arbitrary
                 LiHTMLAttributes (data-*, title, lang, onContextMenu, …) reach
                 the element. Internal listbox semantics (role/aria-selected/
                 data-state/data-disabled/handlers) are applied AFTER the spread
                 so they win on collision. */
              const {
                value: _optValue,
                children: optChildren,
                disabled: optDisabled,
                preset: optPreset,
                sx: optSx,
                style: optStyle,
                className: optClassName,
                // `id` is resolved through `optIds[i]` (caller id wins there);
                // drop it here so the explicit `id` below is authoritative.
                id: _optId,
                ...optRest
              } = o.props;
              void _optValue;
              void _optId;
              const optPresetCls = optPreset ? preset(optPreset) : '';
              const optCls = [optPresetCls, optClassName].filter(Boolean).join(' ') || undefined;
              return (
                <Item
                  {...optRest}
                  className={optCls}
                  // sx wins over caller `style` (uniform precedence, plan §3.11 S8).
                  style={{ ...optStyle, ...optSx } as React.CSSProperties}
                  // optIds[i] already resolves caller id ?? generated id.
                  id={optIds[i]}
                  key={o.props.value}
                  role='option'
                  aria-selected={sel}
                  data-state={sel ? 'selected' : 'unselected'}
                  data-disabled={optDisabled}
                  $pad={g.pad}
                  $padY={theme.spacing(0.75)}
                  $active={i === active}
                  $disabled={optDisabled}
                  $primary={primary}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => !optDisabled && toggle(o.props.value, 'pointer')}
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
                  {optChildren}
                </Item>
              );
            })}
          </Menu>,
          getOverlayRoot(),
        )}
    </div>
  );
};

const Forward = forwardRef<HTMLButtonElement, SelectProps>(
  Inner,
) as unknown as React.ForwardRefExoticComponent<
  SelectProps & React.RefAttributes<HTMLButtonElement>
> & { Option: typeof Option };

Forward.displayName = 'Select';
Forward.Option = Option;

export const Select = Forward;

export default Forward;
