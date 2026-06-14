// ─────────────────────────────────────────────────────────────
// src/components/fields/RadioGroup.tsx | valet
// Theme-aware radio groups with keyboard nav & refined spacing
// • Disabled state now mirrors Accordion / Checkbox colour recipe
// • Inner (radio–label) gap tight; vertical option gap = theme.spacing(1.5)
//
// FIELDS S8 (rulings R9/R10): value/form/internal resolution delegated to the
// shared `useFieldState` hook (precedence prop > form > internal, latched at
// mount, no mount-time store writes). THE AUTHORIZED FLIP (audit
// RadioGroup.tsx:189–191): the form binding was previously WRITE-ONLY — it
// called `form.setField` on change but never READ `form.values`, so a seeded
// initial value and `form.reset()` did not affect the rendered selection,
// unlike every other field. It now reads through the hook, so seeded keys drive
// the initial selection and a store reset is reflected. ChangeInfo.source is
// classified honestly: a real pointer click on a radio reports 'pointer';
// keyboard activation (arrow roving, Home/End, Space/Enter — which fire a
// synthetic click with `detail === 0`) reports 'keyboard', instead of the old
// `instanceof KeyboardEvent` check (radio `change` events carry a MouseEvent,
// never a KeyboardEvent, so the old check always fell through to 'programmatic').
// ─────────────────────────────────────────────────────────────
import React, {
  ReactNode,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  createContext,
} from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';
import { toRgb, mix, toHex } from '../../helpers/color';
import type { Theme } from '../../system/themeStore';
import type { FieldBaseProps, Presettable, Space, Sx } from '../../types';
import type { ChangeInfo, InputSource, OnValueChange, OnValueCommit } from '../../system/events';
import { valetError } from '../../system/devErrors';
import { useFieldState } from '../../hooks/useControlledState';

/*───────────────────────────────────────────────────────────*/
/* Context                                                   */
export type RadioSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface RadioCtx {
  value: string | null;
  setValue: (v: string, e?: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  size: RadioSize | number | string;
}

const RadioGroupCtx = createContext<RadioCtx | null>(null);
const useRadioGroup = () => {
  const ctx = useContext(RadioGroupCtx);
  if (!ctx)
    throw valetError(
      'RadioGroup',
      '<Radio> must be used within a <RadioGroup> — it reads its name, value and size from group context. Wrap your radios in <RadioGroup>.',
      'radio-demo',
    );
  return ctx;
};

/*───────────────────────────────────────────────────────────*/
/* ChangeInfo.source classification (ruling R10)             */

/**
 * Classify the real selection source of a radio `change` event.
 *
 * A radio's `change` is delivered through a synthesized `click`: a genuine
 * pointer click reports `detail >= 1`, whereas keyboard activation — Space,
 * Enter, and the roving arrow/Home/End navigation that calls `radio.click()`
 * programmatically — produces a `click` with `detail === 0` (no associated
 * mouse presses). The old code tested `e.nativeEvent instanceof KeyboardEvent`,
 * but a radio `change` never carries a KeyboardEvent, so every user selection
 * fell through to `'programmatic'`. We map a `MouseEvent` with `detail === 0`
 * ⇒ `'keyboard'`, `detail >= 1` ⇒ `'pointer'`, and any non-`MouseEvent` native
 * event ⇒ `'programmatic'`.
 */
function classifyChangeSource(native: Event | undefined): InputSource {
  if (typeof MouseEvent !== 'undefined' && native instanceof MouseEvent) {
    return native.detail === 0 ? 'keyboard' : 'pointer';
  }
  return 'programmatic';
}

/*───────────────────────────────────────────────────────────*/
/* Size map helper                                           */
const createSizeMap = (t: Theme) => ({
  xs: {
    indicator: '0.75rem',
    dot: 'calc(0.75rem * 0.6)',
    gapInner: t.spacing(0.75),
  },
  sm: { indicator: '1rem', dot: 'calc(1rem * 0.6)', gapInner: t.spacing(0.75) },
  md: {
    indicator: '1.25rem',
    dot: 'calc(1.25rem * 0.6)',
    gapInner: t.spacing(0.75),
  },
  lg: {
    indicator: '1.5rem',
    dot: 'calc(1.5rem * 0.6)',
    gapInner: t.spacing(1),
  },
  xl: {
    indicator: '1.75rem',
    dot: 'calc(1.75rem * 0.6)',
    gapInner: t.spacing(1),
  },
});

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const RootBase = styled('div')`
  display: flex; /* direction + gap inline */
`;

const OptionLabel = styled('label')<{
  theme: Theme;
  $disabled: boolean;
  $disabledColor: string;
}>`
  display: inline-flex;
  align-items: center;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
  color: ${({ $disabled, $disabledColor }) => ($disabled ? $disabledColor : 'inherit')};

  /* Mobile tap highlight suppression */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  /* Focus ring on the visual indicator when the hidden input is focused */
  & input[type='radio']:focus-visible + [data-indicator] {
    outline: ${({ theme }) => theme.stroke(2)} solid ${({ theme }) => theme.colors.primary};
    outline-offset: ${({ theme }) => theme.stroke(1)};
  }
`;

const HiddenInput = styled('input')`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
  pointer-events: none;
`;

/*───────────────────────────────────────────────────────────*/
/* Public prop contracts                                     */
export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange' | 'style'>,
    FieldBaseProps {
  value?: string;
  defaultValue?: string;
  row?: boolean;
  size?: RadioSize | number | string;
  /** Gap between options as spacing units or a CSS length. */
  gap?: Space;
  /** DOM-parity change event (raw input event). */
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  /** Canonical value change event (fires on selection). */
  onValueChange?: OnValueChange<string>;
  /** Commit event (fires same moment for radios). */
  onValueCommit?: OnValueCommit<string>;
  children: ReactNode;
}

export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange' | 'style'>,
    Presettable {
  value: string;
  label?: string;
  size?: RadioSize | number | string;
  children?: ReactNode;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

/*───────────────────────────────────────────────────────────*/
/* <RadioGroup />                                            */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  value: valueProp,
  defaultValue,
  name: nameProp,
  row = false,
  size = 'md',
  gap: gapProp,
  onChange,
  onValueChange,
  onValueCommit,
  error = false,
  // API-TYPES S6 (stage A): destructure the remaining FieldBaseProps member
  // BEFORE the rest-spread so `fullWidth` stops leaking onto the root <div>
  // (role=radiogroup) as an invalid DOM attribute. FieldShell rendering of
  // fullWidth is Phase 2 / Q10.
  fullWidth: _fullWidth,
  preset: p,
  sx,
  className,
  label,
  helperText,
  children,
  ...rest
}) => {
  void _fullWidth;
  const { theme } = useTheme();
  const id = useId();
  const name = nameProp ?? `radio-group-${id}`;

  /* Controlled/uncontrolled + form wiring (ruling R9) ------------------- */
  /**
   * Single resolution of value/control/form binding. Precedence is
   * prop > form > internal, latched at mount; an unseeded form key renders
   * `defaultValue ?? ''` as controlled and never writes on mount.
   *
   * THE AUTHORIZED FLIP (audit :189–191): the form layer is now READ as well as
   * written. Before this slice the binding was write-only — `form.setField` was
   * called on change but `form.values` was never read — so a seeded initial
   * value and `form.reset()` had no effect on the rendered selection. The hook
   * reads through the store, restoring parity with every other field. The form
   * key is `nameProp` only (an auto-generated `name` is never a store key), so a
   * RadioGroup without an explicit `name` keeps its purely internal behaviour.
   *
   * `''` is the hook's empty value; the context exposes the historical
   * `string | null` contract, mapping empty ⇒ `null` ("nothing selected").
   * Option values are non-empty strings, so `checked = sel === value` is
   * unaffected by the choice of empty sentinel.
   */
  const [rawVal, setFieldValue] = useFieldState<string>({
    value: valueProp,
    defaultValue,
    fallback: '',
    name: nameProp,
    component: 'RadioGroup',
  });
  const selectedValue = rawVal === '' ? null : rawVal;

  const setValue = useCallback(
    (v: string, e?: React.ChangeEvent<HTMLInputElement>) => {
      const previous = selectedValue;
      // Updates internal state (uncontrolled) and/or writes through to the form
      // store (live-bound) per the hook's single precedence rule.
      setFieldValue(v);
      // Fire DOM-parity event
      if (e) onChange?.(e);
      // Fire event trio (same moment for radios)
      const base: ChangeInfo<string> = {
        previousValue: previous ?? undefined,
        phase: 'commit',
        source: classifyChangeSource(e?.nativeEvent),
        event: e,
        name: nameProp,
      };
      onValueChange?.(v, { ...base, phase: 'input' });
      onValueCommit?.(v, base);
    },
    [selectedValue, setFieldValue, nameProp, onChange, onValueChange, onValueCommit],
  );

  const ctxVal = useMemo<RadioCtx>(
    () => ({
      value: selectedValue,
      setValue,
      name,
      size,
    }),
    [selectedValue, name, size, setValue],
  );

  /* Gap between radio items ------------------------------------------- */
  const gap = gapProp;
  let gapCss: string;
  if (gap === undefined) {
    gapCss = row ? theme.spacing(1) : theme.spacing(1.5);
  } else if (typeof gap === 'number') {
    gapCss = theme.spacing(gap);
  } else {
    gapCss = String(gap);
  }

  /* Keyboard navigation (roving radio) -------------------------------- */
  const ref = useRef<HTMLDivElement>(null);
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const key = e.key;
    const isArrow =
      key === 'ArrowRight' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowUp';
    const isHomeEnd = key === 'Home' || key === 'End';
    if (!isArrow && !isHomeEnd) return;
    e.preventDefault();

    const radios = ref.current?.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]:not([disabled])',
    );
    if (!radios?.length) return;

    const idx = Array.from(radios).findIndex((r) => r === document.activeElement);

    if (isHomeEnd) {
      const target = key === 'Home' ? 0 : radios.length - 1;
      radios[target]?.focus();
      radios[target]?.click();
      return;
    }

    // Horizontal arrows advance; vertical arrows depend on orientation
    const forward = key === 'ArrowRight' || key === 'ArrowDown';
    const step = forward ? 1 : -1;
    const next = (idx + step + radios.length) % radios.length;
    radios[next]?.focus();
    radios[next]?.click();
  };

  /* preset → className ------------------------------------------------- */
  const presetCls = p ? preset(p) : '';
  const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

  // a11y: connect optional visible label + helper to the group via ARIA
  const labelId = label ? `${id}-label` : undefined;
  const helpId = helperText ? `${id}-help` : undefined;

  return (
    <RadioGroupCtx.Provider value={ctxVal}>
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
      <RootBase
        {...rest}
        ref={ref}
        data-valet-component='RadioGroup'
        data-state={error ? 'invalid' : 'valid'}
        role='radiogroup'
        aria-invalid={error || undefined}
        aria-labelledby={labelId}
        aria-describedby={helpId}
        aria-orientation={row ? 'horizontal' : 'vertical'}
        onKeyDown={onKey}
        className={mergedCls}
        style={{
          flexDirection: row ? 'row' : 'column',
          alignItems: row ? 'center' : 'flex-start',
          gap: gapCss,
          ...sx,
        }}
      >
        {children}
      </RootBase>
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
    </RadioGroupCtx.Provider>
  );
};

/*───────────────────────────────────────────────────────────*/
/* Indicator helper                                          */
interface IndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  checked: boolean;
  outerSize: string;
  dotSize: string;
  primary: string;
  disabled: boolean;
  disabledColor: string;
}

const Indicator: React.FC<IndicatorProps> = ({
  checked,
  outerSize,
  dotSize,
  primary,
  disabled,
  disabledColor,
  ...rest
}) => {
  const ring = disabled ? disabledColor : primary;

  return (
    <span
      {...rest}
      data-indicator
      aria-hidden
      style={{
        width: outerSize,
        height: outerSize,
        minWidth: outerSize,
        borderRadius: '50%',
        border: `2px solid ${ring}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'outline 120ms',
        backgroundColor: checked ? ring : undefined,
      }}
    >
      {checked && (
        <span
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: '#fff',
            filter: disabled ? 'grayscale(1)' : 'none',
          }}
        />
      )}
    </span>
  );
};

/*───────────────────────────────────────────────────────────*/
/* <Radio />                                                 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      value,
      label,
      size: sizeProp,
      disabled = false,
      preset: p,
      children,
      sx,
      className,
      ...inputRest
    },
    ref,
  ) => {
    /* Theme + sizing ---------------------------------------------------- */
    const { theme, mode } = useTheme();
    const { value: sel, setValue, name, size: groupSize } = useRadioGroup();

    const token = sizeProp ?? groupSize;
    const map = createSizeMap(theme);

    let SZ: { indicator: string; dot: string; gapInner: string };

    if (typeof token === 'number') {
      const ind = `${token}px`;
      SZ = {
        indicator: ind,
        dot: `calc(${ind} * 0.6)`,
        gapInner: theme.spacing(0.75),
      };
    } else if (map[token as RadioSize]) {
      SZ = map[token as RadioSize];
    } else {
      const ind = token as string;
      SZ = {
        indicator: ind,
        dot: `calc(${ind} * 0.6)`,
        gapInner: theme.spacing(0.75),
      };
    }
    const checked = sel === value;

    /* Disabled colour (Accordion recipe) ------------------------------- */
    const disabledColor = toHex(
      mix(toRgb(theme.colors.text), toRgb(mode === 'dark' ? '#000' : '#fff'), 0.4),
    );

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => !disabled && setValue(value, e);

    /* preset → className ---------------------------------------------- */
    const presetCls = p ? preset(p) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    /*───────────────────────────────────────────────────────────────────*/
    return (
      <OptionLabel
        theme={theme}
        className={mergedCls}
        style={{ gap: SZ.gapInner, ...sx }}
        $disabled={disabled}
        $disabledColor={disabledColor}
        data-valet-component='Radio'
        data-state={checked ? 'selected' : 'unselected'}
        data-disabled={disabled ? 'true' : 'false'}
        data-checked={checked ? 'true' : 'false'}
      >
        <HiddenInput
          {...inputRest}
          ref={ref}
          type='radio'
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
        />
        <Indicator
          checked={checked}
          outerSize={SZ.indicator}
          dotSize={SZ.dot}
          primary={theme.colors.primary}
          disabled={disabled}
          disabledColor={disabledColor}
        />
        {label ?? children}
      </OptionLabel>
    );
  },
);
Radio.displayName = 'Radio';
