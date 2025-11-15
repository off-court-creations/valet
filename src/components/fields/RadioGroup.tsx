// ─────────────────────────────────────────────────────────────
// src/components/fields/RadioGroup.tsx | valet
// Theme-aware radio groups with keyboard nav & refined spacing
// • Disabled state now mirrors Accordion / Checkbox colour recipe
// • Inner (radio–label) gap tight; vertical option gap = theme.spacing(1.5)
// ─────────────────────────────────────────────────────────────
import React, {
  ReactNode,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
  createContext,
} from 'react';
import { styled } from '../../css/createStyled';
import { preset } from '../../css/stylePresets';
import { useTheme } from '../../system/themeStore';
import { toRgb, mix, toHex } from '../../helpers/color';
import type { Theme } from '../../system/themeStore';
import type { FieldBaseProps, Presettable, Sx } from '../../types';
import type { ChangeInfo, OnValueChange, OnValueCommit } from '../../system/events';
import { useOptionalForm } from './FormControl';

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
  if (!ctx) throw new Error('Radio must be used within a <RadioGroup>.');
  return ctx;
};

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
  input[type='radio']:focus-visible + [data-indicator] {
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
  /** Gap between options */
  spacing?: number | string;
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
  spacing,
  onChange,
  onValueChange,
  onValueCommit,
  error = false,
  preset: p,
  sx,
  className,
  label,
  helperText,
  children,
  ...rest
}) => {
  const { theme } = useTheme();
  const id = useId();
  const name = nameProp ?? `radio-group-${id}`;
  const controlled = valueProp !== undefined;
  // Controlled/uncontrolled guard (dev-only)
  const initialCtl = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (initialCtl.current === undefined) initialCtl.current = controlled;
    else if (initialCtl.current !== controlled) {
      console.error(
        'RadioGroup: component switched from %s to %s after mount. This is not supported.',
        initialCtl.current ? 'controlled' : 'uncontrolled',
        controlled ? 'controlled' : 'uncontrolled',
      );
    }
  }, [controlled]);

  // Optional FormControl integration
  const form = useOptionalForm<Record<string, unknown>>();

  /* Controlled/uncontrolled wiring ------------------------------------- */
  const [selfVal, setSelfVal] = useState<string | null>(defaultValue ?? null);
  const setValue = useCallback(
    (v: string, e?: React.ChangeEvent<HTMLInputElement>) => {
      const previous = controlled ? (valueProp ?? null) : selfVal;
      if (!controlled) setSelfVal(v);
      // Form store binding
      if (form && nameProp) {
        form.setField(nameProp as keyof Record<string, unknown>, v);
      }
      // Fire DOM-parity event
      if (e) onChange?.(e);
      // Fire event trio (same moment for radios)
      const src: ChangeInfo<string>['source'] = e
        ? e.nativeEvent instanceof KeyboardEvent
          ? 'keyboard'
          : e.nativeEvent instanceof MouseEvent || e.nativeEvent instanceof PointerEvent
            ? 'pointer'
            : 'programmatic'
        : 'programmatic';
      const base: ChangeInfo<string> = {
        previousValue: previous ?? undefined,
        phase: 'commit',
        source: src,
        event: e,
        name: nameProp,
      };
      onValueChange?.(v, { ...base, phase: 'input' });
      onValueCommit?.(v, base);
    },
    [controlled, form, nameProp, onChange, onValueChange, onValueCommit, selfVal, valueProp],
  );

  const ctxVal = useMemo<RadioCtx>(
    () => ({
      value: controlled ? (valueProp ?? null) : selfVal,
      setValue,
      name,
      size,
    }),
    [controlled, valueProp, selfVal, name, size, setValue],
  );

  /* Gap between radio items ------------------------------------------- */
  let gapCss: string;
  if (spacing === undefined) {
    gapCss = row ? theme.spacing(1) : theme.spacing(1.5);
  } else if (typeof spacing === 'number') {
    gapCss = theme.spacing(spacing);
  } else {
    gapCss = String(spacing);
  }

  /* Keyboard navigation (roving radio) -------------------------------- */
  const ref = useRef<HTMLDivElement>(null);
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
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
