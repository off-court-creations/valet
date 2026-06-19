// ─────────────────────────────────────────────────────────────────────────────
// src/components/fields/Checkbox.tsx | valet
// Theme-aware, accessible Checkbox — 1.0 redo (colors/mobile/sizing).
//
// Colors: every state is driven by ONE computeIntentVars call (the shared
// intent contract used by Button/IconButton), so checked fill, the glyph
// (intent-fg, never a hard white), the neutral unchecked border, hover, and
// the focus ring are all theme-consistent in BOTH light and dark. Disabled
// keeps its colors at opacity 0.5 (NOT the near-white fg-disabled token, which
// was invisible in light mode).
//
// Mobile: a real visually-hidden <input type=checkbox> (queryable for AT/forms)
// behind a styled box; the chrome kit (no tap-highlight / callout / selection)
// and a coarse-pointer-only >=44px hit expander (24px under compact) — desktop
// rhythm is untouched.
//
// Sizing: a proportional inline-SVG tick (box * 0.6, currentColor) — crisp at
// every size; no fixed pixel inset, no mask (jsdom-renderable).
//
// FIELDS S7 (rulings R9/R10): value/form/internal resolution stays delegated to
// `useFieldState` (precedence prop > form > internal, latched at mount). The
// `bindForm` veto is preserved. ChangeInfo.source is classified honestly.
// helperText is rendered OUTSIDE the <label> (so it never leaks into the
// accessible name) and associated via aria-describedby.
// ─────────────────────────────────────────────────────────────────────────────
import React, { forwardRef, useCallback, useEffect, useId, useRef, ChangeEvent } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useFieldState } from '../../hooks/useControlledState';
import { useCompact } from '../../system/compactContext';
import { useFormConfig } from './FormControl';
import { computeIntentVars, makeMix } from '../../system/intentVars';
import { warnOnce } from '../../system/devErrors';
import type { Theme } from '../../system/themeStore';
import type { FieldBaseProps } from '../../types';
import type { ChangeInfo, InputSource, OnValueChange, OnValueCommit } from '../../system/events';

/*───────────────────────────────────────────────────────────────────────────*/
/* ChangeInfo.source classification (ruling R10)                            */

/**
 * Classify the real toggle source of a checkbox `change` event. A `MouseEvent`
 * with `detail === 0` is a keyboard activation (Space/Enter), `detail >= 1` is
 * a pointer click, and any non-`MouseEvent` native event is programmatic.
 */
function classifyChangeSource(native: Event): InputSource {
  if (typeof MouseEvent !== 'undefined' && native instanceof MouseEvent) {
    return native.detail === 0 ? 'keyboard' : 'pointer';
  }
  return 'programmatic';
}

/*───────────────────────────────────────────────────────────────────────────*/
/* Public prop contracts                                                    */
export type CheckboxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface CheckboxProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'type' | 'size' | 'onChange' | 'value' | 'defaultValue' | 'style' | 'name'
    >,
    FieldBaseProps {
  /**
   * Field name used for FormControl binding and form submission. When `bindForm` is false,
   * `name` may be omitted and no form binding/submission occurs.
   */
  name?: string;
  /** Disable FormControl binding and omit name from submission. */
  bindForm?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  /** Visual size; token or CSS length. */
  size?: CheckboxSize | number | string;
  /** DOM-parity change event (raw React event). */
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  /** Canonical value change event (fires on each mutation). */
  onValueChange?: OnValueChange<boolean>;
  /** Commit event (fires at the same moment for toggles). */
  onValueCommit?: OnValueCommit<boolean>;
  /** Mixed (indeterminate) visual state for parent selections. */
  indeterminate?: boolean;
}

/*───────────────────────────────────────────────────────────────────────────*/
/* Size map helper — box edge + proportional tick (box * 0.6)               */
const createSizeMap = (t: Theme) =>
  ({
    xs: { box: '0.75rem', tick: 'calc(0.75rem * 0.6)', gap: t.spacing(1) },
    sm: { box: '1rem', tick: 'calc(1rem * 0.6)', gap: t.spacing(1) },
    md: { box: '1.25rem', tick: 'calc(1.25rem * 0.6)', gap: t.spacing(1) },
    lg: { box: '1.5rem', tick: 'calc(1.5rem * 0.6)', gap: t.spacing(1) },
    xl: { box: '1.75rem', tick: 'calc(1.75rem * 0.6)', gap: t.spacing(1) },
  }) as const;

/*───────────────────────────────────────────────────────────────────────────*/
/* Styled primitives                                                        */
interface WrapperProps {
  [key: string]: unknown;
  $disabled: boolean;
}
const Wrapper = styled('label')<WrapperProps>`
  display: inline-flex;
  align-items: center;
  gap: var(--checkbox-gap);
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};

  /* Mobile chrome kit — no blue flash, no iOS callout, no text selection */
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  /* Visible focus ring on the visual box when the input is keyboard-focused */
  & input[type='checkbox']:focus-visible + [data-indicator] {
    outline: var(--valet-checkbox-focus-w, 2px) solid var(--valet-intent-focus);
    outline-offset: var(--valet-checkbox-focus-off, 2px);
  }
`;

const HiddenInput = styled('input')`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
`;

/* Note: a string index signature satisfies createStyled's generic constraint
   (P extends Record<string, unknown>); all named members are subtypes of
   unknown, so it stays type-safe. */
interface BoxProps {
  [key: string]: unknown;
  $checked: boolean;
  $indeterminate: boolean;
  $disabled: boolean;
  $size: string;
  $tick: string;
}

const Box = styled('span')<BoxProps>`
  position: relative;
  display: grid;
  place-items: center;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  min-width: ${({ $size }) => $size};
  box-sizing: border-box;
  border-radius: var(--valet-checkbox-radius, 4px);

  /* Unchecked → neutral intent border; checked/indeterminate → intent fill. */
  border: var(--valet-checkbox-stroke, 2px) solid
    ${({ $checked, $indeterminate }) =>
      $checked || $indeterminate ? 'var(--valet-intent-bg)' : 'var(--valet-intent-border)'};
  background: ${({ $checked, $indeterminate }) =>
    $checked || $indeterminate ? 'var(--valet-intent-bg)' : 'transparent'};
  /* Glyph colour (currentColor on the svg) — readable on the fill, never white. */
  color: var(--valet-intent-fg);

  /* Disabled keeps its colours and just dims (the near-white fg-disabled token
     was invisible in light mode). */
  opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};

  transition:
    background 120ms ease,
    border-color 120ms ease;
  -webkit-tap-highlight-color: transparent;

  @media (hover: hover) {
    &:hover {
      ${({ $disabled, $checked, $indeterminate }) =>
        $disabled
          ? ''
          : $checked || $indeterminate
            ? 'background: var(--valet-intent-bg-active);'
            : 'border-color: var(--valet-intent-bg);'}
    }
  }

  /* Coarse-pointer (touch) hit target — expand to >=44px (24px under compact)
     WITHOUT changing the visual box; fine-pointer (desktop) is untouched. */
  @media (pointer: coarse) {
    &::before {
      content: '';
      position: absolute;
      /* Logical absolute-centering (no physical left/top): inset:0 + margin:auto
         centers the expander over the box even when larger than it. RTL-safe. */
      inset: 0;
      margin: auto;
      width: max(100%, var(--valet-cb-hit, 44px));
      height: max(100%, var(--valet-cb-hit, 44px));
    }
  }

  & > svg {
    width: ${({ $tick }) => $tick};
    height: ${({ $tick }) => $tick};
    pointer-events: none;
    opacity: ${({ $checked, $indeterminate }) => ($checked || $indeterminate ? 1 : 0)};
    transform: ${({ $checked, $indeterminate }) =>
      $checked || $indeterminate ? 'scale(1)' : 'scale(0.85)'};
    transition:
      opacity 120ms ease,
      transform 120ms ease;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
    & > svg {
      transition: none;
    }
  }
`;

/*───────────────────────────────────────────────────────────────────────────*/
/* Component                                                                */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      name,
      bindForm = true,
      checked: checkedProp,
      defaultChecked,
      indeterminate = false,
      label,
      helperText,
      size = 'md',
      disabled = false,
      error,
      // FieldShell rendering of fullWidth is Phase 2 / Q10; swallowed for now.
      fullWidth: _fullWidth,
      onChange,
      onValueChange,
      onValueCommit,
      preset: presetKey,
      className,
      sx,
      children,
      id: idProp,
      ...inputRest
    },
    ref,
  ) => {
    void _fullWidth;
    /* Theme & sizing ---------------------------------------------------- */
    const { theme } = useTheme();
    const map = createSizeMap(theme);
    const effectiveCompact = useCompact();

    /* Form-wide config (own props win; the form config is the fallback). */
    const formConfig = useFormConfig();
    const effectiveDisabled = disabled || formConfig.disabled;
    const effectiveError = Boolean(error) || (name != null && formConfig.errors[name] != null);

    let SZ: { box: string; tick: string; gap: string };
    if (typeof size === 'number') {
      const box = `${size}px`;
      SZ = { box, tick: `calc(${box} * 0.6)`, gap: theme.spacing(1) };
    } else if (map[size as CheckboxSize]) {
      SZ = map[size as CheckboxSize];
    } else {
      SZ = { box: size, tick: `calc(${size} * 0.6)`, gap: theme.spacing(1) };
    }

    /* Colours — one shared intent contract (matches Button/IconButton). The
       unchecked outline is an explicit NEUTRAL border (background↔text @ 0.4);
       the glyph is intent-fg (primaryButtonText), never a hard white. */
    const intentVars = computeIntentVars({
      bg: theme.colors.primary,
      fg: theme.colors.primaryButtonText,
      focus: theme.colors.primary,
      disabledMixColor: theme.colors.background,
      variant: 'filled',
      border: makeMix(theme.colors.background, theme.colors.text, 0.4),
    });

    /**
     * Single resolution of value/control/form binding (ruling R9). Precedence
     * prop > form > internal, latched at mount. `bindForm` false → `name:
     * undefined` skips the form layer; the DOM `name` is still emitted below.
     */
    const [currentChecked, setValue] = useFieldState<boolean>({
      value: checkedProp,
      defaultValue: defaultChecked ?? false,
      fallback: false,
      name: bindForm ? name : undefined,
      component: 'Checkbox',
    });

    /* Event handler – updates state, FormStore, and user callback -------- */
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const prev = currentChecked;
        const next = e.target.checked;
        setValue(next);

        onChange?.(e);
        const info: ChangeInfo<boolean> = {
          previousValue: prev,
          phase: 'input',
          source: classifyChangeSource(e.nativeEvent),
          event: e,
          name,
        };
        onValueChange?.(next, info);
        onValueCommit?.(next, { ...info, phase: 'commit' });
      },
      [name, onChange, onValueChange, onValueCommit, currentChecked, setValue],
    );

    /* Manage native indeterminate property (IDL exposes "mixed" to AT) ---- */
    const innerRef = useRef<HTMLInputElement | null>(null);
    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };
    useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = !!indeterminate;
    }, [indeterminate]);

    /* Unique ids for accessibility -------------------------------------- */
    const reactId = useId();
    const id = idProp ?? reactId;
    const helpId = helperText != null ? `${id}-help` : undefined;
    const labelContent = label ?? children;

    /* Dev-time accessible-name guard (mirrors Switch/IconButton): warn ONCE
       if the checkbox would render with no accessible name from any source. */
    if (process.env.NODE_ENV !== 'production') {
      const hasName =
        labelContent != null ||
        Boolean((inputRest as Record<string, unknown>)['aria-label']) ||
        Boolean((inputRest as Record<string, unknown>)['aria-labelledby']);
      if (!hasName) {
        warnOnce(
          `Checkbox:no-accessible-name:${id}`,
          'valet: Checkbox: provide an accessible name via the `label` prop, children, aria-label, or aria-labelledby (WCAG 4.1.2).',
        );
      }
    }

    /* aria-describedby: append our helperText id, preserving any caller value. */
    const describedBy =
      [(inputRest as Record<string, unknown>)['aria-describedby'] as string | undefined, helpId]
        .filter(Boolean)
        .join(' ') || undefined;

    /* preset → className merge ------------------------------------------ */
    const presetCls = presetKey ? preset(presetKey) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    /*─────────────────────────────────────────────────────────────────────*/
    const field = (
      <Wrapper
        htmlFor={id}
        data-valet-component='Checkbox'
        data-state={indeterminate ? 'indeterminate' : currentChecked ? 'checked' : 'unchecked'}
        data-disabled={effectiveDisabled ? 'true' : 'false'}
        style={{ '--checkbox-gap': SZ.gap, ...sx } as React.CSSProperties}
        className={mergedCls}
        $disabled={effectiveDisabled}
        onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
      >
        <HiddenInput
          {...inputRest}
          id={id}
          ref={setRefs}
          {...(bindForm && name ? { name } : {})}
          type='checkbox'
          disabled={effectiveDisabled}
          checked={currentChecked}
          onChange={handleChange}
          aria-invalid={effectiveError || undefined}
          aria-describedby={describedBy}
        />
        <Box
          data-indicator
          $size={SZ.box}
          $tick={SZ.tick}
          $checked={currentChecked}
          $indeterminate={!!indeterminate}
          $disabled={effectiveDisabled}
          style={
            {
              '--valet-checkbox-radius': theme.radius(1),
              '--valet-checkbox-stroke': theme.stroke(2),
              '--valet-checkbox-focus-w': theme.stroke(2),
              '--valet-checkbox-focus-off': theme.stroke(1),
              '--valet-cb-hit': effectiveCompact ? '24px' : '44px',
              ...intentVars,
            } as React.CSSProperties
          }
          aria-hidden
        >
          <svg
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth={3}
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden
          >
            {indeterminate ? (
              <line
                x1='6'
                y1='12'
                x2='18'
                y2='12'
              />
            ) : (
              <polyline points='20 6 9 17 4 12' />
            )}
          </svg>
        </Box>
        {labelContent}
      </Wrapper>
    );

    if (helperText == null) return field;

    /* helperText renders OUTSIDE the <label> (never part of the accessible
       name) and is associated to the input via aria-describedby. */
    return (
      <span style={{ display: 'inline-flex', flexDirection: 'column', gap: theme.spacing(0.5) }}>
        {field}
        <span
          id={helpId}
          aria-live='polite'
          style={{
            fontSize: '0.75rem',
            color: effectiveError ? theme.colors.error : theme.colors.text + 'AA',
            marginInlineStart: `calc(${SZ.box} + var(--checkbox-gap, ${SZ.gap}))`,
          }}
        >
          {helperText}
        </span>
      </span>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export default Checkbox;
