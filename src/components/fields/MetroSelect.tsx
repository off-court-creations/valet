// ─────────────────────────────────────────────────────────────
// src/components/fields/MetroSelect.tsx | valet
// windows 8 start screen style grid select
// patch: add valet-esque hover tint on options – 2025‑08‑12
// patch: support multiple selection via `multiple` prop – 2025‑08‑12
// patch: sync --valet-text-color with Option color – 2025‑08‑19
// patch: keyboard + ARIA listbox, FormControl binding, size tokens – 2025‑10‑29
// ─────────────────────────────────────────────────────────────
/* eslint-disable react/prop-types */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
} from 'react';
import Stack from '../layout/Stack';
import Panel from '../layout/Panel';
import { Icon } from '../primitives/Icon';
import { Typography } from '../primitives/Typography';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { toHex, toRgb, mix } from '../../helpers/color';
import type { FieldBaseProps, Presettable, Sx } from '../../types';
import { styled } from '../../css/createStyled';
import { useOptionalForm } from './FormControl';

export type Primitive = string | number;

interface MetroCtx {
  value: Primitive | Primitive[] | null;
  setValue: (v: Primitive) => void;
  multiple: boolean;
  disabled: boolean;
}

const MetroCtx = createContext<MetroCtx | null>(null);
const useMetro = () => {
  const ctx = useContext(MetroCtx);
  if (!ctx) throw new Error('MetroSelect.Option must be inside MetroSelect');
  return ctx;
};

export interface MetroSelectProps
  extends Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'onChange' | 'value' | 'defaultValue' | 'style'
    >,
    FieldBaseProps {
  value?: Primitive | Primitive[];
  defaultValue?: Primitive | Primitive[];
  gap?: number | string;
  multiple?: boolean;
  /** Visual size of the tiles; token or explicit CSS size. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
  /** Disable the entire control. */
  disabled?: boolean;
  onChange?: (v: Primitive | Primitive[]) => void;
  children: React.ReactNode;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

export interface MetroOptionProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    Presettable {
  value: Primitive;
  icon: string | React.ReactElement;
  label: React.ReactNode;
  disabled?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

const HoverWrap = styled('div')<{
  $hoverBg: string;
  $hoverSelBg: string;
  $disabled: boolean;
  $selected: boolean;
  $kbdActive?: boolean;
}>`
  position: relative;
  display: inline-block;
  /* Ensure the wrapper does not interfere with layout sizing */
  vertical-align: top;

  .valet-hover-bg {
    position: absolute;
    inset: 0;
    background: transparent;
    pointer-events: none;
    transition: background 120ms ease;
    z-index: 0;
  }

  /* Only apply hover on devices that actually support it */
  @media (hover: hover) {
    &:hover .valet-hover-bg {
      ${({ $disabled, $selected, $hoverBg, $hoverSelBg }) =>
        $disabled ? '' : `background: ${$selected ? $hoverSelBg : $hoverBg};`}
    }
  }

  /* Keyboard navigation should mirror hover tint on the active tile */
  ${({ $kbdActive, $disabled, $selected, $hoverBg, $hoverSelBg }) =>
    $kbdActive && !$disabled
      ? `.valet-hover-bg { background: ${$selected ? $hoverSelBg : $hoverBg}; }`
      : ''}
`;

export const Option: React.FC<MetroOptionProps> = ({
  value,
  icon,
  label,
  disabled = false,
  preset: p,
  sx,
  className,
  ...rest
}) => {
  const { theme, mode } = useTheme();
  const { value: sel, setValue, disabled: allDisabled } = useMetro();

  const selected = Array.isArray(sel)
    ? sel.findIndex((x) => String(x) === String(value)) !== -1
    : sel !== null && String(sel) === String(value);

  const presetCls = p ? preset(p) : '';

  const disabledColor = useMemo(
    () => toHex(mix(toRgb(theme.colors.text), toRgb(mode === 'dark' ? '#000' : '#fff'), 0.4)),
    [theme, mode],
  );

  /* Shared valet hover tone: primary mixed into background */
  const hoverBg = useMemo(
    () => toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.background), 0.25)),
    [theme],
  );
  // For selected tiles, nudge primary toward text similarly to DateSelector
  const hoverSelBg = useMemo(
    () => toHex(mix(toRgb(theme.colors.primary), toRgb(theme.colors.text), 0.3)),
    [theme],
  );

  const innerStyle: React.CSSProperties = {
    paddingTop: theme.spacing(3),
    paddingBottom: theme.spacing(3),
    paddingLeft: theme.spacing(1),
    paddingRight: theme.spacing(1),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    height: '100%',
    width: '100%',
    position: 'relative',
    zIndex: 1, // keep content above hover layer
  };

  // Whether this option is the keyboard-active one (for hover tint mirroring)
  const kbdActive = Boolean(
    (rest as unknown as { ['data-active']?: boolean | string })['data-active'],
  );

  return (
    <HoverWrap
      $hoverBg={hoverBg}
      $hoverSelBg={hoverSelBg}
      $disabled={!!disabled || allDisabled}
      $selected={selected && !disabled}
      $kbdActive={kbdActive}
      className={[presetCls, className].filter(Boolean).join(' ')}
    >
      {/**
       * Ensure Typography inside the option tracks the same color as icons.
       * We do this by setting --valet-text-color in lockstep with the computed color.
       */}
      <Panel
        {...rest}
        variant='alt'
        compact
        onClick={() => !disabled && !allDisabled && setValue(value)}
        sx={{
          width: 'var(--valet-metro-tile-w, 6rem)',
          height: 'var(--valet-metro-tile-h, 6rem)',
          overflow: 'hidden',
          position: 'relative', // anchor hover layer
          cursor: disabled || allDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderColor:
            selected && !disabled ? theme.colors.primary : disabled ? disabledColor : undefined,
          background: selected && !disabled ? theme.colors.primary : undefined,
          // Compute text color for icons and labels; keep Typography in sync via CSS var.
          color: disabled ? disabledColor : selected ? theme.colors.primaryText : undefined,
          ['--valet-text-color' as const]:
            (disabled ? disabledColor : selected ? theme.colors.primaryText : undefined) ??
            'currentColor',
          opacity: disabled || allDisabled ? 0.45 : 1,
          transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
          // Visible keyboard focus ring on the active tile (set by parent via data-active)
          outline: ((rest as unknown as { ['data-active']?: boolean | string })['data-active']
            ? `${theme.stroke(2)} solid ${theme.colors.primary}`
            : undefined) as unknown as string,
          outlineOffset: ((rest as unknown as { ['data-active']?: boolean | string })['data-active']
            ? theme.stroke(2)
            : undefined) as unknown as string,
          ...sx,
        }}
      >
        <div className='valet-hover-bg' />
        <div style={innerStyle}>
          {typeof icon === 'string' ? (
            <Icon
              icon={icon}
              size={'var(--valet-metro-icon-size, 1.75rem)'}
            />
          ) : (
            <Icon size={'var(--valet-metro-icon-size, 1.75rem)'}>{icon}</Icon>
          )}
          <Typography
            variant='h6'
            centered
            noSelect
            fontSize={'var(--valet-metro-font-size, 0.875rem)'}
          >
            {label}
          </Typography>
        </div>
      </Panel>
    </HoverWrap>
  );
};
Option.displayName = 'MetroSelect.Option';

export interface MetroSelectComponent extends React.FC<MetroSelectProps> {
  Option: React.FC<MetroOptionProps>;
}

export const MetroSelect: MetroSelectComponent = ({
  value: valueProp,
  defaultValue,
  gap = 0,
  onChange,
  multiple = false,
  size = 'md',
  disabled = false,
  name,
  label,
  helperText,
  preset: p,
  className,
  sx,
  children,
  ...rest
}) => {
  const form = useOptionalForm<Record<string, unknown>>();
  const formVal =
    form && name ? (form.values[name] as Primitive | Primitive[] | undefined) : undefined;
  const controlled = formVal !== undefined || valueProp !== undefined;
  const [self, setSelf] = useState<Primitive | Primitive[] | null>(defaultValue ?? null);

  const val = controlled
    ? ((formVal !== undefined ? formVal : (valueProp as Primitive | Primitive[] | null)) ?? null)
    : self;

  const setValue = useCallback(
    (v: Primitive) => {
      if (disabled) return;
      if (multiple) {
        const current = Array.isArray(val) ? val : [];
        const idx = current.findIndex((x) => String(x) === String(v));
        const next = idx === -1 ? [...current, v] : current.filter((_, i) => i !== idx);
        if (!controlled) setSelf(next);
        if (form && name) form.setField(name as keyof Record<string, unknown>, next as unknown);
        onChange?.(next);
      } else {
        if (!controlled) setSelf(v);
        if (form && name) form.setField(name as keyof Record<string, unknown>, v as unknown);
        onChange?.(v);
      }
    },
    [controlled, disabled, form, multiple, name, onChange, val],
  );

  const presetCls = p ? preset(p) : '';

  const ctx = useMemo<MetroCtx>(
    () => ({ value: val ?? null, setValue, multiple, disabled }),
    [val, setValue, multiple, disabled],
  );

  // ----- Geometry: tokens → CSS variables ---------------------------------
  const sizeMap = useMemo(
    () => () => ({
      xs: { tile: '4rem', icon: '1.25rem', font: '0.75rem' },
      sm: { tile: '5rem', icon: '1.5rem', font: '0.8rem' },
      md: { tile: '6rem', icon: '1.75rem', font: '0.875rem' },
      lg: { tile: '7rem', icon: '2rem', font: '1rem' },
      xl: { tile: '8rem', icon: '2.25rem', font: '1.125rem' },
    }),
    [],
  );

  const { theme } = useTheme();
  const tokens = sizeMap();

  let tileW: string;
  let tileH: string;
  let iconSz: string;
  let fontSz: string;

  if (typeof size === 'number') {
    const s = `${size}px`;
    tileW = s;
    tileH = s;
    iconSz = `calc(${s} * 0.45)`;
    fontSz = '0.875rem';
  } else if (tokens[size as keyof typeof tokens]) {
    const g = tokens[size as keyof typeof tokens] as { tile: string; icon: string; font: string };
    tileW = g.tile;
    tileH = g.tile;
    iconSz = g.icon;
    fontSz = g.font;
  } else {
    const s = size as string;
    tileW = s;
    tileH = s;
    iconSz = `calc(${s} * 0.45)`;
    fontSz = '0.875rem';
  }

  // ----- Flatten options to compute a11y and keyboard nav ------------------
  const rawOpts = useMemo(
    () =>
      React.Children.toArray(children).filter(
        (n) =>
          React.isValidElement<MetroOptionProps>(n) &&
          // identify MetroSelect.Option elements (by displayName)
          ((n as React.ReactElement).type as { displayName?: string })?.displayName ===
            'MetroSelect.Option',
      ) as React.ReactElement<MetroOptionProps>[],
    [children],
  );

  // Active index for roving focus
  const [active, setActive] = useState(0);
  // Only show the visual active outline after keyboard use
  const [showActive, setShowActive] = useState(false);

  // Ensure active starts on a selected option or first enabled
  useEffect(() => {
    const findFirstEnabled = () => rawOpts.findIndex((o) => !o.props.disabled);
    let initial = 0;
    if (Array.isArray(val)) {
      const arr = val as Primitive[];
      const idx = rawOpts.findIndex(
        (o) => !o.props.disabled && arr.some((x) => String(x) === String(o.props.value)),
      );
      initial = idx >= 0 ? idx : findFirstEnabled();
    } else if (val != null) {
      const idx = rawOpts.findIndex(
        (o) => !o.props.disabled && String(o.props.value) === String(val as Primitive),
      );
      initial = idx >= 0 ? idx : findFirstEnabled();
    } else {
      initial = findFirstEnabled();
    }
    if (initial < 0) initial = 0;
    setActive(initial);
  }, [rawOpts, val]);

  // Keyboard navigation helpers
  const move = useCallback(
    (dir: 1 | -1) => {
      if (!rawOpts.length) return;
      setActive((i) => {
        let n = i;
        for (let c = 0; c < rawOpts.length; c++) {
          n = (n + dir + rawOpts.length) % rawOpts.length;
          if (!rawOpts[n].props.disabled) break;
        }
        return n;
      });
    },
    [rawOpts],
  );

  const isSel = useCallback(
    (v: Primitive) =>
      multiple
        ? (Array.isArray(val) ? (val as Primitive[]) : []).some((x) => String(x) === String(v))
        : val != null && String(val as Primitive) === String(v),
    [multiple, val],
  );

  // a11y ids
  const listId = useId();
  const optIds = useMemo(() => rawOpts.map((_, i) => `${listId}-opt-${i}`), [rawOpts, listId]);

  // Visible label / helper text wiring
  const labelId = label ? `${listId}-label` : undefined;
  const helpId = helperText ? `${listId}-help` : undefined;

  return (
    <MetroCtx.Provider value={ctx}>
      {/* Optional visible label above */}
      {label && (
        <div
          id={labelId}
          style={{
            fontSize: '0.875rem',
            color: theme.colors.text,
            marginBottom: theme.spacing(0.5),
          }}
        >
          {label}
        </div>
      )}
      <Stack
        direction='row'
        wrap
        compact
        gap={gap}
        role='listbox'
        aria-multiselectable={multiple || undefined}
        aria-disabled={disabled || undefined}
        aria-activedescendant={optIds[active]}
        aria-labelledby={labelId}
        aria-describedby={helpId}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (disabled) return;
          const { key } = e as React.KeyboardEvent<HTMLDivElement>;
          // Mark that the user is navigating via keyboard so the outline can appear
          if (
            key === 'ArrowRight' ||
            key === 'ArrowDown' ||
            key === 'ArrowLeft' ||
            key === 'ArrowUp' ||
            key === 'Home' ||
            key === 'End'
          )
            setShowActive(true);
          if (key === 'ArrowRight' || key === 'ArrowDown') {
            e.preventDefault();
            move(1);
          } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
            e.preventDefault();
            move(-1);
          } else if (key === 'Home') {
            e.preventDefault();
            const first = rawOpts.findIndex((o) => !o.props.disabled);
            if (first >= 0) setActive(first);
          } else if (key === 'End') {
            e.preventDefault();
            for (let i = rawOpts.length - 1; i >= 0; i--) {
              if (!rawOpts[i].props.disabled) {
                setActive(i);
                break;
              }
            }
          } else if (key === 'Enter' || key === ' ') {
            e.preventDefault();
            setShowActive(true);
            const opt = rawOpts[active];
            if (!opt || opt.props.disabled) return;
            setValue(opt.props.value);
          }
        }}
        onBlur={() => setShowActive(false)}
        {...rest}
        sx={{
          // Provide geometry via CSS vars for children
          ['--valet-metro-tile-w' as const]: tileW,
          ['--valet-metro-tile-h' as const]: tileH,
          ['--valet-metro-icon-size' as const]: iconSz,
          ['--valet-metro-font-size' as const]: fontSz,
          ...sx,
        }}
        className={[presetCls, className].filter(Boolean).join(' ')}
      >
        {rawOpts.map((el, i) =>
          React.cloneElement(el, {
            id: optIds[i],
            role: 'option',
            'aria-selected': isSel(el.props.value),
            'aria-disabled': el.props.disabled || disabled || undefined,
            'data-active': (showActive && i === active) || undefined,
            onMouseEnter: () => setActive(i),
          } as Partial<MetroOptionProps> & { id: string }),
        )}
      </Stack>
      {helperText && (
        <div
          id={helpId}
          style={{
            fontSize: '0.75rem',
            color: theme.colors.text + 'AA',
            marginTop: theme.spacing(0.5),
          }}
          aria-live='polite'
        >
          {helperText}
        </div>
      )}
    </MetroCtx.Provider>
  );
};

MetroSelect.displayName = 'MetroSelect';
MetroSelect.Option = Option;

export default MetroSelect;
