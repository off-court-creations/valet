// ─────────────────────────────────────────────────────────────
// src/components/fields/Iterator.tsx | valet
// numeric stepper with plus/minus buttons and scroll wheel support
//
// FIELDS S9 (rulings R9/R10): value/form/internal resolution delegated to the
// shared `useFieldState` hook (precedence prop > form > internal, latched at
// mount, no mount-time store writes). ChangeInfo.source is now classified
// honestly per interaction path (wheel ⇒ 'wheel', +/- buttons & Arrow keys ⇒
// the caller-supplied source, Page/Home/End/Enter keys ⇒ 'keyboard', typing
// commit & blur ⇒ 'keyboard') instead of the old hardcoded 'programmatic'.
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useState, useEffect, useId, useRef, useCallback } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { IconButton, type IconButtonVariant } from './IconButton';
import { useFieldState } from '../../hooks/useControlledState';
import { useCompact } from '../../system/compactContext';
import { useFormConfig } from './FormControl';
import { warnOnce } from '../../system/devErrors';
import { useComponentStrings } from '../../system/locale';
import type { DeepPartialStrings, ValetStrings } from '../../system/locale';
import type { FieldBaseProps } from '../../types';
import type { ChangeInfo, InputSource, OnValueChange, OnValueCommit } from '../../system/events';
import type { Theme } from '../../system/themeStore';

/*───────────────────────────────────────────────────────────*/
export interface IteratorProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'style' | 'name'>,
    FieldBaseProps {
  value?: number;
  defaultValue?: number;
  /** Canonical value change event (fires on each mutation). */
  onValueChange?: OnValueChange<number>;
  /** Commit event (buttons, wheel, keyboard final, or blur). */
  onValueCommit?: OnValueCommit<number>;
  min?: number;
  max?: number;
  step?: number;
  /**
   * When true, committing also happens while typing for any parsable number.
   * Defaults to false to avoid interrupting intermediate states like "1." or "-".
   */
  commitOnChange?: boolean;
  /**
   * If true, coerces committed values to align to `step` from the origin (min if provided, else 0).
   */
  roundToStep?: boolean;
  /**
   * Control mouse wheel behavior: off | focus | hover (default: focus)
   *  - off: disable wheel-based stepping
   *  - focus: only step when the field has focus
   *  - hover: step while hovered (prevents page scroll while over the input)
   */
  wheelBehavior?: 'off' | 'focus' | 'hover';
  /** Control width of the numeric field (token or CSS length). */
  width?: number | string;
  /** Visual style for the −/+ stepper buttons. Defaults to `'outlined'`. */
  buttonVariant?: IconButtonVariant;
  /**
   * Instance-level overrides for this component's i18n strings. Wins over the
   * `ValetLocaleProvider` value, which in turn wins over the built-in English
   * defaults (A11Y S8 resolution contract; see `src/system/locale.tsx`).
   */
  labels?: DeepPartialStrings<ValetStrings['iterator']>;
}

/*───────────────────────────────────────────────────────────*/
const Wrapper = styled('div')<{ theme: Theme }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(0.75)};
`;

const Field = styled('input')<{ theme: Theme; $w: string }>`
  padding: ${({ theme }) => theme.spacing(0.5)};
  border: ${({ theme }) => theme.stroke(1)} solid ${({ theme }) => theme.colors.text + '44'};
  border-radius: ${({ theme }) => theme.radius(1)};
  background: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  font-size: 0.875rem;
  text-align: center;
  width: ${({ $w }) => $w};
  overscroll-behavior: contain;
  -moz-appearance: textfield;

  /* Mobile chrome kit — no blue tap flash, treat as a tap target. */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Coarse-pointer (touch) hit floor — the numeric box is the touch surface;
     grow it to >=44px tall (40px under compact) without touching desktop. */
  @media (pointer: coarse) {
    min-height: var(--valet-iter-hit, 44px);
  }
  &:focus-visible {
    outline: var(--valet-focus-width, 2px) solid
      var(--valet-focus-ring-color, ${({ theme }) => theme.colors.primary});
    outline-offset: var(--valet-focus-offset, 2px);
  }
  &[disabled] {
    color: ${({ theme }) => theme.colors.text + '66'};
    border-color: ${({ theme }) => theme.colors.text + '22'};
    cursor: not-allowed;
  }
`;

/*───────────────────────────────────────────────────────────*/
export const Iterator = forwardRef<HTMLInputElement, IteratorProps>(
  (
    {
      value: valueProp,
      defaultValue,
      onValueChange,
      onValueCommit,
      name,
      min,
      max,
      step = 1,
      commitOnChange = false,
      roundToStep = false,
      wheelBehavior = 'focus',
      width = '3.5rem',
      buttonVariant = 'outlined',
      disabled: ownDisabled = false,
      readOnly = false,
      // API-TYPES S6 (stage A): destructure the FieldBaseProps cluster BEFORE the
      // rest-spread so label/helperText/error/fullWidth stop leaking onto the
      // <input> as invalid DOM attributes. `error` drives aria-invalid; `label`
      // /`helperText` are now rendered + wired as the input's accessible name
      // (native <label htmlFor>) / description (aria-describedby). FieldShell
      // rendering of fullWidth is Phase 2 / Q10.
      label,
      helperText,
      error: ownError,
      fullWidth: _fullWidth,
      preset: p,
      className,
      labels,
      sx,
      ...rest
    },
    ref,
  ) => {
    void _fullWidth;
    const { theme } = useTheme();
    const t = useComponentStrings('iterator', labels);
    const effectiveCompact = useCompact();

    /* Form-wide config (own props win; the form config is the fallback). The
       FormConfig layer is additive and separate from the value binding below. */
    const formConfig = useFormConfig();
    const effectiveDisabled = ownDisabled || formConfig.disabled;
    const effectiveError = Boolean(ownError) || (name != null && formConfig.errors[name] != null);

    // WCAG 4.1.2 (Name, Role, Value): a native <label htmlFor> provides the
    // accessible name; helperText is associated via aria-describedby.
    const reactId = useId();
    const inputId = `${reactId}-input`;
    const labelId = label != null ? `${reactId}-label` : undefined;
    const helpId = helperText != null ? `${reactId}-help` : undefined;

    // Dev-time accessible-name guard (mirrors IconButton.tsx): warn ONCE if the
    // number input would render with no accessible name from ANY source.
    // External labelling via aria-label/aria-labelledby is valid (silences it).
    if (process.env.NODE_ENV !== 'production') {
      const hasName =
        label != null ||
        Boolean((rest as Record<string, unknown>)['aria-label']) ||
        Boolean((rest as Record<string, unknown>)['aria-labelledby']);
      if (!hasName) {
        warnOnce(
          `Iterator:no-accessible-name:${reactId}`,
          'valet: Iterator: provide an accessible name via the `label` prop, aria-label, or aria-labelledby (WCAG 4.1.2).',
        );
      }
    }

    const localRef = useRef<HTMLInputElement | null>(null);
    const setRef = useCallback(
      (node: HTMLInputElement | null) => {
        localRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref],
    );

    /**
     * Single resolution of value/control/form binding (ruling R9). Precedence
     * is prop > form > internal, latched at mount; an unseeded form key renders
     * `defaultValue ?? 0` as controlled and never writes on mount. The setter
     * writes through to the store whenever live-bound; the hook itself decides
     * whether `setValue` updates internal state.
     */
    const [current, setValue] = useFieldState<number>({
      value: valueProp,
      defaultValue,
      fallback: 0,
      name,
      component: 'Iterator',
    });
    const [text, setText] = useState(String(current));

    useEffect(() => {
      setText(String(current));
    }, [current]);

    const alignToStep = useCallback(
      (val: number) => {
        if (!roundToStep || !step || step <= 0) return val;
        const origin = min ?? 0;
        const delta = val - origin;
        const snapped = Math.round(delta / step) * step + origin;
        return snapped;
      },
      [min, roundToStep, step],
    );

    const clamp = useCallback(
      (val: number) => {
        let v = val;
        if (min !== undefined && v < min) v = min;
        if (max !== undefined && v > max) v = max;
        return v;
      },
      [min, max],
    );

    // `source` is supplied explicitly by each interaction path (ruling R10);
    // the old code hardcoded 'programmatic' for every change, including real
    // user typing, wheel stepping and button presses.
    const commit = useCallback(
      (
        next: number,
        phase: 'input' | 'commit' = 'commit',
        source: InputSource = 'programmatic',
      ) => {
        const v = alignToStep(clamp(next));
        // Updates internal state (uncontrolled) and/or writes through to the
        // form store (live-bound) via the hook's single precedence rule.
        setValue(v);
        const info: ChangeInfo<number> = {
          previousValue: current,
          phase,
          source,
          name,
        };
        onValueChange?.(v, { ...info, phase: 'input' });
        if (phase === 'commit') onValueCommit?.(v, { ...info, phase: 'commit' });
        setText(String(v));
      },
      [alignToStep, clamp, setValue, name, onValueChange, onValueCommit, current],
    );

    const handleInput: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      const val = e.target.value;
      setText(val);
      const num = parseFloat(val);
      if (commitOnChange && !Number.isNaN(num)) commit(num, 'input', 'keyboard');
    };

    const handleBlur: React.FocusEventHandler<HTMLInputElement> = () => {
      const num = parseFloat(text);
      if (Number.isNaN(num)) setText(String(current));
      else commit(num, 'commit', 'keyboard');
    };

    const stepBy = useCallback(
      (dir: number, source: InputSource = 'pointer') => {
        commit(current + dir * step, 'commit', source);
      },
      [commit, current, step],
    );

    const handleWheel = useCallback(
      (e: WheelEvent) => {
        if (effectiveDisabled || readOnly) return;
        if (wheelBehavior === 'off') return;
        if (wheelBehavior === 'focus' && localRef.current !== document.activeElement) return;
        e.preventDefault();
        e.stopPropagation();
        stepBy(e.deltaY < 0 ? 1 : -1, 'wheel');
      },
      [effectiveDisabled, readOnly, stepBy, wheelBehavior],
    );

    useEffect(() => {
      const node = localRef.current;
      if (!node) return;
      node.addEventListener('wheel', handleWheel, { passive: false });
      return () => node.removeEventListener('wheel', handleWheel);
    }, [handleWheel]);

    const cls = [p ? preset(p) : '', className].filter(Boolean).join(' ') || undefined;

    const w = typeof width === 'number' ? `${width}px` : width;

    const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
      if (effectiveDisabled || readOnly) return;
      const key = e.key;
      const big = Math.max(step * 10, step);
      if (key === 'ArrowUp') {
        e.preventDefault();
        stepBy(1, 'keyboard');
      } else if (key === 'ArrowDown') {
        e.preventDefault();
        stepBy(-1, 'keyboard');
      } else if (key === 'PageUp') {
        e.preventDefault();
        commit(current + big, 'commit', 'keyboard');
      } else if (key === 'PageDown') {
        e.preventDefault();
        commit(current - big, 'commit', 'keyboard');
      } else if (key === 'Home' && min !== undefined) {
        e.preventDefault();
        commit(min, 'commit', 'keyboard');
      } else if (key === 'End' && max !== undefined) {
        e.preventDefault();
        commit(max, 'commit', 'keyboard');
      } else if (key === 'Enter') {
        const num = parseFloat(text);
        if (!Number.isNaN(num)) commit(num, 'commit', 'keyboard');
        else setText(String(current));
      } else if (key === 'Escape') {
        setText(String(current));
      }
    };

    const decDisabled = effectiveDisabled || readOnly || (min !== undefined && current <= min);
    const incDisabled = effectiveDisabled || readOnly || (max !== undefined && current >= max);

    const controls = (
      <Wrapper
        theme={theme}
        data-valet-component='Iterator'
        data-disabled={effectiveDisabled ? 'true' : 'false'}
        data-readonly={readOnly ? 'true' : 'false'}
        data-state={effectiveDisabled ? 'disabled' : readOnly ? 'readonly' : 'enabled'}
        className={cls}
        style={
          { '--valet-iter-hit': effectiveCompact ? '24px' : '44px', ...sx } as React.CSSProperties
        }
      >
        <IconButton
          size='xs'
          variant={buttonVariant}
          icon='mdi:minus-thick'
          onClick={() => stepBy(-1)}
          disabled={decDisabled}
          aria-label={t.decrement}
        />
        <Field
          {...rest}
          ref={setRef}
          id={inputId}
          type='number'
          inputMode='numeric'
          theme={theme}
          $w={w}
          name={name}
          min={min}
          max={max}
          step={step}
          value={text}
          onChange={handleInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={effectiveDisabled}
          readOnly={readOnly}
          aria-invalid={effectiveError || undefined}
          aria-describedby={helpId}
        />
        <IconButton
          size='xs'
          variant={buttonVariant}
          icon='mdi:plus-thick'
          onClick={() => stepBy(1)}
          disabled={incDisabled}
          aria-label={t.increment}
        />
      </Wrapper>
    );

    // When neither label nor helperText is supplied, render the bare inline-flex
    // <Wrapper> exactly as before — no wrapper, no structural change.
    if (label == null && helperText == null) return controls;

    // The native <label htmlFor={inputId}> provides the input's accessible name;
    // helperText is associated via aria-describedby. Both live in an outer column
    // around the existing controls so layout/ref/spread stay untouched.
    return (
      <div style={{ display: 'inline-flex', flexDirection: 'column' }}>
        {label != null && (
          <label
            id={labelId}
            htmlFor={inputId}
            style={{
              fontSize: '0.875rem',
              color: theme.colors.text,
              marginBottom: theme.spacing(0.5),
            }}
          >
            {label}
          </label>
        )}
        {controls}
        {helperText != null && (
          <span
            id={helpId}
            style={{
              fontSize: '0.75rem',
              color: theme.colors.text + 'AA',
              marginTop: theme.spacing(0.5),
            }}
            aria-live='polite'
          >
            {helperText}
          </span>
        )}
      </div>
    );
  },
);

Iterator.displayName = 'Iterator';

export default Iterator;
