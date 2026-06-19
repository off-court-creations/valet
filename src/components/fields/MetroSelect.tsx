// ─────────────────────────────────────────────────────────────
// src/components/fields/MetroSelect.tsx | valet
// windows 8 start screen style grid select
// patch: add valet-esque hover tint on options – 2025‑08‑12
// patch: support multiple selection via `multiple` prop – 2025‑08‑12
// patch: sync --valet-text-color with Option color – 2025‑08‑19
// patch: keyboard + ARIA listbox, FormControl binding, size tokens – 2025‑10‑29
//
// FIELDS S8 (rulings R9/R10): value/form/internal resolution delegated to the
// shared `useFieldState` hook (precedence prop > form > internal, latched at
// mount, no mount-time store writes). This replaces the old hand-rolled guard
// whose `controlled = formVal !== undefined || valueProp !== undefined`
// predicate let form-presence override an explicit `value` prop and recomputed
// the mode every render. ChangeInfo.source is classified honestly: a tile
// chosen by pointer click reports 'pointer', one chosen via keyboard
// (Enter/Space) reports 'keyboard', instead of the old hardcoded 'programmatic'.
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
import { Icon } from '../primitives/Icon';
import { Typography } from '../primitives/Typography';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { makeMix } from '../../system/intentVars';
import type { FieldBaseProps, Presettable, Space, SpacingProps, Sx } from '../../types';
import type { ChangeInfo, InputSource, OnValueChange, OnValueCommit } from '../../system/events';
import { styled } from '../../css/createStyled';
import { CompactCtx, useCompact } from '../../system/compactContext';
import { useFormConfig } from './FormControl';
import { valetError } from '../../system/devErrors';
import { useFieldState } from '../../hooks/useControlledState';

export type Primitive = string | number;

interface MetroCtx {
  value: Primitive | Primitive[] | null;
  setValue: (v: Primitive, src: InputSource) => void;
  multiple: boolean;
  /** Field-level disable (own prop merged with FormControl config). */
  disabled: boolean;
  /** Shared intent-contract tile colours (resolved once on the field root). */
  colors: {
    /** Selected tile fill (intent accent, error-recoloured). */
    accent: string;
    /** Text/icon on a selected (or coloured) tile — the on-accent fg. */
    selectedFg: string;
    /** Resting fill for a tile with NO per-option `color` (solid neutral block). */
    neutralBg: string;
    /** Resting fg on a neutral tile. */
    neutralFg: string;
    /** Resting fg on a per-option-coloured tile (on-colour text). */
    coloredFg: string;
    /** Disabled text/border tone. */
    disabled: string;
  };
}

const MetroCtx = createContext<MetroCtx | null>(null);
const useMetro = () => {
  const ctx = useContext(MetroCtx);
  if (!ctx)
    throw valetError(
      'MetroSelect',
      '<MetroSelect.Option> must be inside <MetroSelect> — options read selection state from its context. Move the option under a <MetroSelect> parent.',
      'metroselect-demo',
    );
  return ctx;
};

export interface MetroSelectProps
  extends Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'onChange' | 'value' | 'defaultValue' | 'style'
    >,
    FieldBaseProps,
    Pick<SpacingProps, 'compact'> {
  value?: Primitive | Primitive[];
  defaultValue?: Primitive | Primitive[];
  /** Inter-tile spacing as units or CSS length. */
  gap?: Space;
  multiple?: boolean;
  /** Visual size of the tiles; token or explicit CSS size. */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string;
  /** Disable the entire control. */
  disabled?: boolean;
  onValueChange?: OnValueChange<Primitive | Primitive[]>;
  onValueCommit?: OnValueCommit<Primitive | Primitive[]>;
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
  /** Flat resting fill for this tile (theme token name or CSS colour). Enables
   *  the multi-colour Metro mosaic; omitted → a neutral tile. */
  color?: string;
  /** Render a wide 2×1 tile (spans two columns + the gutter, same height). */
  wide?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/* The snapped Metro grid: fixed tile modules packed from the start with ONE
   small uniform gutter, never stretched. `perspective` enables the per-tile
   3D press tilt. The coarse floor is on the TRACK (not just the child) so a
   small tile size still yields a >=44px module. */
const Grid = styled('div')`
  display: grid;
  grid-template-columns: repeat(auto-fill, var(--valet-metro-tile-w, 6rem));
  grid-auto-rows: var(--valet-metro-tile-h, 6rem);
  gap: var(--valet-metro-gap, 0.5rem);
  justify-content: start;
  perspective: 800px;

  @media (pointer: coarse) {
    grid-template-columns: repeat(
      auto-fill,
      max(var(--valet-metro-tile-w, 6rem), var(--valet-metro-hit, 44px))
    );
    grid-auto-rows: max(var(--valet-metro-tile-h, 6rem), var(--valet-metro-hit, 44px));
  }
`;

/* One flat, sharp-cornered Metro tile — the grid cell AND the clickable surface.
   Solid fill at rest, no border/shadow/gradient, square corners. Selection adds
   an inset keyline (non-colour cue). Press tilts toward the pressed point. */
const Tile = styled('div')<{
  $fill: string;
  $fg: string;
  $selected: boolean;
  $disabled: boolean;
  $kbdActive: boolean;
  $pad: string;
}>`
  position: relative;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  padding: ${({ $pad }) => $pad};
  border: none;
  border-radius: 0;
  background: ${({ $fill }) => $fill};
  color: ${({ $fg }) => $fg};
  --valet-text-color: ${({ $fg }) => $fg};
  overflow: hidden;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  opacity: ${({ $disabled }) => ($disabled ? 0.45 : 1)};
  user-select: none;
  -webkit-user-select: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  backface-visibility: hidden;
  transition:
    filter 120ms ease,
    box-shadow 120ms ease,
    transform var(--valet-metro-press-dur, 120ms) var(--valet-metro-press-ease, ease);

  /* Selected: inset accent keyline so selection is not colour-only (a11y). */
  ${({ $selected, $fg }) => ($selected ? `box-shadow: inset 0 0 0 2px ${$fg}66;` : '')}

  @media (hover: hover) {
    &:hover {
      filter: brightness(1.08);
    }
  }
  ${({ $kbdActive }) => ($kbdActive ? 'filter: brightness(1.08);' : '')}

  &[data-active] {
    outline: 2px solid var(--valet-focus-ring-color, currentColor);
    outline-offset: 2px;
    z-index: 1;
  }

  /* Signature Metro press tilt — leans toward the pressed point, springs back.
     Continuous tilt values ride on inline vars (createStyled cardinality rule). */
  @media (prefers-reduced-motion: no-preference) {
    &[data-pressed] {
      transform: perspective(800px) rotateY(calc(var(--valet-metro-tilt-x, 0) * 8deg))
        rotateX(calc(var(--valet-metro-tilt-y, 0) * -8deg)) scale(0.965);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    &[data-pressed] {
      filter: brightness(0.9);
    }
  }
`;

export const Option: React.FC<MetroOptionProps> = ({
  value,
  icon,
  label,
  disabled = false,
  color,
  wide = false,
  preset: p,
  sx,
  className,
  ...rest
}) => {
  const { theme } = useTheme();
  const { value: sel, setValue, disabled: allDisabled, colors } = useMetro();

  const selected = Array.isArray(sel)
    ? sel.findIndex((x) => String(x) === String(value)) !== -1
    : sel !== null && String(sel) === String(value);

  const effDisabled = !!disabled || allDisabled;
  const presetCls = p ? preset(p) : '';

  /* Flat fills: a per-option `color` (or a neutral block) at REST; the intent
     accent + on-accent fg when selected; disabled keeps the resting fill + dims. */
  const restFill = color ?? colors.neutralBg;
  const restFg = color ? colors.coloredFg : colors.neutralFg;
  const fill = selected && !effDisabled ? colors.accent : restFill;
  const fg = effDisabled ? colors.disabled : selected ? colors.selectedFg : restFg;

  // Keyboard-active mirror (the parent injects data-active via cloneElement).
  const kbdActive = Boolean((rest as { ['data-active']?: unknown })['data-active']);

  /* Press tilt — computed ONCE on pointer-down from the press point (Metro
     tilts on press and settles on release; it does not follow the finger). */
  const [press, setPress] = useState<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (effDisabled) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width || !r.height) return;
    setPress({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
  };
  const clearPress = () => setPress(null);

  return (
    <Tile
      {...rest}
      $fill={fill}
      $fg={fg}
      $selected={selected && !effDisabled}
      $disabled={effDisabled}
      $kbdActive={kbdActive}
      $pad={theme.spacing(1)}
      data-pressed={press ? '' : undefined}
      onClick={() => !effDisabled && setValue(value, 'pointer')}
      onPointerDown={onPointerDown}
      onPointerUp={clearPress}
      onPointerLeave={clearPress}
      onPointerCancel={clearPress}
      className={[presetCls, className].filter(Boolean).join(' ')}
      style={
        {
          gridColumn: wide ? 'span 2' : undefined,
          ['--valet-metro-tilt-x' as const]: press?.x ?? 0,
          ['--valet-metro-tilt-y' as const]: press?.y ?? 0,
          ...(sx as object),
        } as React.CSSProperties
      }
    >
      <span
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          minHeight: 0,
        }}
      >
        {typeof icon === 'string' ? (
          <Icon
            icon={icon}
            size={'var(--valet-metro-icon-size, 1.75rem)'}
          />
        ) : (
          <Icon size={'var(--valet-metro-icon-size, 1.75rem)'}>{icon}</Icon>
        )}
      </span>
      <Typography
        variant='body'
        noSelect
        fontSize={'var(--valet-metro-font-size, 0.875rem)'}
        sx={{ width: '100%', textAlign: 'left', fontWeight: 300 }}
      >
        {label}
      </Typography>
    </Tile>
  );
};
Option.displayName = 'MetroSelect.Option';

export interface MetroSelectComponent extends React.FC<MetroSelectProps> {
  Option: React.FC<MetroOptionProps>;
}

export const MetroSelect: MetroSelectComponent = ({
  value: valueProp,
  defaultValue,
  gap,
  onValueChange,
  onValueCommit,
  multiple = false,
  size = 'md',
  disabled = false,
  name,
  label,
  helperText,
  // API-TYPES S6 (stage A): destructure the remaining FieldBaseProps members
  // BEFORE the rest-spread so error/fullWidth stop leaking onto the root
  // <div> (role=listbox) as invalid DOM attributes. `error` is wired to
  // aria-invalid below; `fullWidth` rendering is Phase 2 / Q10.
  error,
  fullWidth: _fullWidth,
  compact,
  preset: p,
  className,
  sx,
  children,
  ...rest
}) => {
  void _fullWidth;
  const effectiveCompact = useCompact(compact);
  /* Metro tiles sit in a TIGHT snapped grid — a small uniform gutter, not the
     loose default. Author `gap` still overrides; omitted → 8px (4px compact). */
  const effectiveGap = gap ?? (effectiveCompact ? 0.5 : 1);

  /* Form-wide config (own props win; the form config is the fallback). The
     FormConfig layer is additive + separate from the useFieldState store
     binding below. */
  const formConfig = useFormConfig();
  const effectiveDisabled = disabled || formConfig.disabled;
  const effectiveError = Boolean(error) || (name != null && formConfig.errors[name] != null);
  /**
   * Single resolution of value/control/form binding (ruling R9). Precedence is
   * prop > form > internal, latched at mount; an unseeded form key renders
   * `defaultValue ?? null` as controlled and never writes on mount. `null` is
   * the empty value (nothing selected). The setter writes through to the store
   * whenever live-bound. This replaces the old hand-rolled guard where
   * form-presence could override an explicit `value` prop.
   */
  const [valRaw, setFieldValue] = useFieldState<Primitive | Primitive[] | null>({
    value: valueProp,
    defaultValue,
    fallback: null,
    name,
    component: 'MetroSelect',
  });
  const val = valRaw;

  const setValue = useCallback(
    (v: Primitive, src: InputSource) => {
      if (effectiveDisabled) return;
      const infoBase: ChangeInfo<Primitive | Primitive[]> = {
        previousValue: val ?? (multiple ? [] : null),
        phase: 'commit',
        source: src,
        name,
      } as ChangeInfo<Primitive | Primitive[]>;
      if (multiple) {
        const current = Array.isArray(val) ? val : [];
        const idx = current.findIndex((x) => String(x) === String(v));
        const next = idx === -1 ? [...current, v] : current.filter((_, i) => i !== idx);
        setFieldValue(next);
        onValueChange?.(next, { ...infoBase, phase: 'input' });
        onValueCommit?.(next, infoBase);
      } else {
        setFieldValue(v);
        onValueChange?.(v, { ...infoBase, phase: 'input' });
        onValueCommit?.(v, infoBase);
      }
    },
    [effectiveDisabled, multiple, name, onValueChange, onValueCommit, setFieldValue, val],
  );

  const presetCls = p ? preset(p) : '';

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

  /* Colours — shared intent contract (matches Select/Checkbox). Selected tiles
     paint with the intent bg (primary) and the text-on-primary token
     (primaryText, never a hard white); hover tints are subtle primary mixes via
     makeMix (unselected hover is lighter than the selected fill). Disabled tone
     mixes text toward the page background. The `error` state recolours the
     selected fill (and its keyline) to the error token. */
  const accent = effectiveError ? theme.colors.error : theme.colors.primary;
  const colors = useMemo(
    () => ({
      // Selected tile = the intent accent + on-accent text.
      accent,
      selectedFg: theme.colors.primaryText,
      // Resting tiles are SOLID blocks: a neutral surface when no per-option
      // colour is given (every tile filled at rest — Metro, not hollow cards).
      neutralBg: theme.colors.backgroundAlt,
      neutralFg: theme.colors.text,
      // On a per-option coloured (saturated) tile, use the on-accent text token.
      coloredFg: theme.colors.primaryText,
      // Disabled tone: text mixed toward the page background.
      disabled: makeMix(theme.colors.text, theme.colors.background, 0.4),
    }),
    [
      accent,
      theme.colors.primaryText,
      theme.colors.backgroundAlt,
      theme.colors.background,
      theme.colors.text,
    ],
  );

  const ctx = useMemo<MetroCtx>(
    () => ({ value: val ?? null, setValue, multiple, disabled: effectiveDisabled, colors }),
    [val, setValue, multiple, effectiveDisabled, colors],
  );

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

  // Tight Metro gutter as a CSS length for the grid `gap` var.
  const gapCss =
    typeof effectiveGap === 'number' ? theme.spacing(effectiveGap) : String(effectiveGap);

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
      <Grid
        data-valet-component='MetroSelect'
        data-disabled={effectiveDisabled ? 'true' : 'false'}
        data-state={effectiveDisabled ? 'disabled' : 'enabled'}
        role='listbox'
        aria-multiselectable={multiple || undefined}
        aria-invalid={effectiveError || undefined}
        aria-disabled={effectiveDisabled || undefined}
        aria-activedescendant={optIds[active]}
        aria-labelledby={labelId}
        aria-describedby={helpId}
        tabIndex={effectiveDisabled ? -1 : 0}
        onKeyDown={(e) => {
          if (effectiveDisabled) return;
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
            setValue(opt.props.value, 'keyboard');
          }
        }}
        onBlur={() => setShowActive(false)}
        {...(rest as React.HTMLAttributes<HTMLDivElement>)}
        style={
          {
            // Provide geometry via CSS vars for children
            ['--valet-metro-tile-w' as const]: tileW,
            ['--valet-metro-tile-h' as const]: tileH,
            ['--valet-metro-icon-size' as const]: iconSz,
            ['--valet-metro-font-size' as const]: fontSz,
            // Coarse-pointer tap-target floor for each tile (40px under compact).
            ['--valet-metro-hit' as const]: effectiveCompact ? '40px' : '44px',
            // Tight Metro gutter + press-tilt timing tokens.
            ['--valet-metro-gap' as const]: gapCss,
            ['--valet-metro-press-dur' as const]: theme.motion.duration.base,
            ['--valet-metro-press-ease' as const]: theme.motion.easing.standard,
            ...(sx as object),
          } as React.CSSProperties
        }
        className={[presetCls, className].filter(Boolean).join(' ')}
      >
        <CompactCtx.Provider value={effectiveCompact}>
          {rawOpts.map((el, i) =>
            React.cloneElement(el, {
              id: optIds[i],
              role: 'option',
              'aria-selected': isSel(el.props.value),
              'aria-disabled': el.props.disabled || effectiveDisabled || undefined,
              'data-active': (showActive && i === active) || undefined,
              onMouseEnter: () => setActive(i),
            } as Partial<MetroOptionProps> & { id: string }),
          )}
        </CompactCtx.Provider>
      </Grid>
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
