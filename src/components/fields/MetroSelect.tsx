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
import Stack from '../layout/Stack';
import Panel from '../layout/Panel';
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
    /** Selected tile fill + border (intent bg). */
    selectedBg: string;
    /** Text/icon on a selected tile (intent fg, never a hard white). */
    selectedFg: string;
    /** Hover tint for an UNselected tile (subtle primary mix). */
    hoverBg: string;
    /** Hover tint for a SELECTED tile (darker primary mix). */
    hoverSelBg: string;
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
  box-sizing: border-box;
  /* The wrapper owns the tile size and the inner clickable Panel fills it
     (width/height:100%), so the coarse floor below enlarges the ACTUAL tap
     target — not just an inert box around a smaller Panel. */
  width: var(--valet-metro-tile-w, 6rem);
  height: var(--valet-metro-tile-h, 6rem);

  /* Mobile chrome kit — suppress the blue tap flash + keep taps fast on the
     tile target. */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  /* Coarse-pointer (touch) comfort: each tile is a tap target — floor it at
     >=44px (40px under compact) via the root-provided --valet-metro-hit. Tiles
     are usually >=4rem already, but small/numeric sizes can drop below 44px. */
  @media (pointer: coarse) {
    min-width: var(--valet-metro-hit, 44px);
    min-height: var(--valet-metro-hit, 44px);
  }

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
  const { theme } = useTheme();
  const { value: sel, setValue, disabled: allDisabled, colors } = useMetro();

  const selected = Array.isArray(sel)
    ? sel.findIndex((x) => String(x) === String(value)) !== -1
    : sel !== null && String(sel) === String(value);

  const presetCls = p ? preset(p) : '';

  // Colours come from the field root's single intent-contract resolution
  // (computeIntentVars/makeMix) — no bespoke per-tile colour maths.
  const disabledColor = colors.disabled;
  const hoverBg = colors.hoverBg;
  const hoverSelBg = colors.hoverSelBg;

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
        variant='outlined'
        compact
        onClick={() => !disabled && !allDisabled && setValue(value, 'pointer')}
        sx={{
          // Fill the HoverWrap (which now owns the tile size + the coarse hit
          // floor) so the clickable surface is the floored ≥44px box on touch.
          width: '100%',
          height: '100%',
          // Coarse-pointer hit floor + chrome kit live on <HoverWrap> (a styled
          // component → real CSS rule); `sx` is inline-only and cannot carry a
          // @media block. The flat tap-highlight suppression is safe inline too.
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'manipulation',
          overflow: 'hidden',
          position: 'relative', // anchor hover layer
          cursor: disabled || allDisabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderColor:
            selected && !disabled ? colors.selectedBg : disabled ? disabledColor : undefined,
          background: selected && !disabled ? colors.selectedBg : undefined,
          // Compute text color for icons and labels; keep Typography in sync via CSS var.
          color: disabled ? disabledColor : selected ? colors.selectedFg : undefined,
          ['--valet-text-color' as const]:
            (disabled ? disabledColor : selected ? colors.selectedFg : undefined) ?? 'currentColor',
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
      selectedBg: accent,
      selectedFg: theme.colors.primaryText,
      // Unselected hover: subtle primary tint over the background (light wash).
      hoverBg: makeMix(theme.colors.background, accent, 0.16),
      // Selected hover: a touch darker than the selected fill (toward text).
      hoverSelBg: makeMix(accent, theme.colors.text, 0.3),
      // Disabled tone: text mixed toward the page background.
      disabled: makeMix(theme.colors.text, theme.colors.background, 0.4),
    }),
    [accent, theme.colors.primaryText, theme.colors.background, theme.colors.text],
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
        compact={effectiveCompact}
        gap={effectiveGap}
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
        {...rest}
        sx={{
          // Provide geometry via CSS vars for children
          ['--valet-metro-tile-w' as const]: tileW,
          ['--valet-metro-tile-h' as const]: tileH,
          ['--valet-metro-icon-size' as const]: iconSz,
          ['--valet-metro-font-size' as const]: fontSz,
          // Coarse-pointer tap-target floor for each tile (40px under compact).
          ['--valet-metro-hit' as const]: effectiveCompact ? '40px' : '44px',
          ...sx,
        }}
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
