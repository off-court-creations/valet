// ─────────────────────────────────────────────────────────────────────────────
// src/components/RadioGroup.tsx
// Theme-aware, accessible RadioGroup + Radio for valet (error-free version)
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  ReactNode,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
  createContext,
} from 'react';
import { styled } from '../css/createStyled';
import { preset } from '../css/stylePresets';
import { useTheme } from '../system/themeStore';
import type { Theme } from '../system/themeStore';
import type { Presettable } from '../types';

/* ──────────────────────────────────────────────────────────────────────────── */
/* Context / shared state                                                     */

type RadioSize = 'sm' | 'md' | 'lg';

interface RadioCtx {
  value: string | null;
  setValue: (v: string) => void;
  name: string;
  size: RadioSize;
}

const RadioGroupCtx = createContext<RadioCtx | null>(null);
const useRadioGroup = () => {
  const ctx = useContext(RadioGroupCtx);
  if (!ctx)
    throw new Error('Radio must be used inside a <RadioGroup> component.');
  return ctx;
};

/* ──────────────────────────────────────────────────────────────────────────── */
/* Size map helper                                                            */

const createSizeMap = (theme: Theme) => ({
  sm: { indicator: '16px', dot: '8px', font: theme.spacing.sm, gap: theme.spacing.sm },
  md: { indicator: '20px', dot: '10px', font: theme.spacing.md, gap: theme.spacing.md },
  lg: { indicator: '24px', dot: '12px', font: theme.spacing.lg, gap: theme.spacing.lg },
});

/* ──────────────────────────────────────────────────────────────────────────── */
/* Styled primitives                                                          */

const RootBase = styled('div')`
  display: flex;
`; // dynamic flexDirection / alignItems via inline style

const OptionLabel = styled('label')`
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
`;

const HiddenInput = styled('input')`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
`;

/* ──────────────────────────────────────────────────────────────────────────── */
/* Public prop types                                                          */

export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  value?: string;              // controlled
  defaultValue?: string;       // uncontrolled
  name?: string;
  row?: boolean;
  size?: RadioSize;
  onChange?: (val: string) => void;
  children: ReactNode;
}

export interface RadioProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'type' | 'size' | 'onChange'
    >,
    Presettable {
  value: string;
  label?: string;
  size?: RadioSize;
  children?: ReactNode;
}

/* ──────────────────────────────────────────────────────────────────────────── */
/* <RadioGroup />                                                             */

export const RadioGroup: React.FC<RadioGroupProps> = ({
  value: valueProp,
  defaultValue,
  name: nameProp,
  row = false,
  size = 'md',
  onChange,
  preset: presetKey,
  style,
  className,
  children,
  ...divProps
}) => {
  const id          = useId();
  const name        = nameProp ?? `radio-group-${id}`;
  const controlled  = valueProp !== undefined;

  const [uncontrolledValue, setUncontrolledValue] = useState<string | null>(
    defaultValue ?? null,
  );

  const setValue = useCallback(
    (v: string) => {
      if (!controlled) setUncontrolledValue(v);
      onChange?.(v);
    },
    [controlled, onChange],
  );

  const ctxValue: RadioCtx = useMemo(
    () => ({
      value: controlled ? (valueProp ?? null) : uncontrolledValue,
      setValue,
      name,
      size,
    }),
    [controlled, valueProp, uncontrolledValue, name, size, setValue],
  );

  /* Keyboard roving */
  const ref = useRef<HTMLDivElement>(null);
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key))
      return;
    e.preventDefault();

    const radios = ref.current?.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]:not([disabled])',
    );
    if (!radios?.length) return;

    const idx   = Array.from(radios).findIndex((r) => r === document.activeElement);
    const step  = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const next  = (idx + step + radios.length) % radios.length;
    radios[next]?.focus();
    radios[next]?.click();
  };

  /* preset -> className merge */
  const presetClass = presetKey ? preset(presetKey) : '';
  const mergedClass = [presetClass, className].filter(Boolean).join(' ') || undefined;

  return (
    <RadioGroupCtx.Provider value={ctxValue}>
      <RootBase
        {...divProps}
        ref={ref}
        role="radiogroup"
        onKeyDown={handleKeyDown}
        className={mergedClass}
        style={{
          flexDirection: row ? 'row' : 'column',
          alignItems: row ? 'center' : 'flex-start',
          ...style,
        }}
      >
        {children}
      </RootBase>
    </RadioGroupCtx.Provider>
  );
};

/* ──────────────────────────────────────────────────────────────────────────── */
/* Indicator helper component                                                 */

interface IndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  checked: boolean;
  indicatorSize: string;
  dotSize: string;
  primary: string;
}

const Indicator: React.FC<IndicatorProps> = ({
  checked,
  indicatorSize,
  dotSize,
  primary,
  ...spanProps
}) => (
  <span
    {...spanProps}
    aria-hidden
    style={{
      width: indicatorSize,
      height: indicatorSize,
      minWidth: indicatorSize,
      borderRadius: '50%',
      border: `2px solid ${primary}`,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'box-shadow 150ms',
      boxShadow: checked
        ? `inset 0 0 0 ${parseInt(indicatorSize, 10) / 2}px ${primary}`
        : undefined,
    }}
  >
    {checked && (
      <span
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: '50%',
          backgroundColor: '#fff',
        }}
      />
    )}
  </span>
);

/* ──────────────────────────────────────────────────────────────────────────── */
/* <Radio />                                                                  */

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      value,
      label,
      size: sizeProp,
      disabled = false,
      preset: presetKey,
      children,
      style,
      className,
      ...inputProps
    },
    ref,
  ) => {
    const { theme }            = useTheme();
    const { value: selected,
            setValue,
            name,
            size: groupSize }  = useRadioGroup();

    const sizeToken  = sizeProp ?? groupSize;
    const map        = createSizeMap(theme);
    const checked    = selected === value;
    const gap        = map[sizeToken].gap;

    const onChange   = () => !disabled && setValue(value);

    /* preset → className merge */
    const presetCls  = presetKey ? preset(presetKey) : '';
    const mergedCls  = [presetCls, className].filter(Boolean).join(' ') || undefined;

    return (
      <OptionLabel
        className={mergedCls}
        style={{ gap, ...style }}
      >
        <HiddenInput
          {...inputProps}
          ref={ref}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
        />
        <Indicator
          checked={checked}
          indicatorSize={map[sizeToken].indicator}
          dotSize={map[sizeToken].dot}
          primary={theme.colors.primary}
        />
        {label ?? children}
      </OptionLabel>
    );
  },
);
Radio.displayName = 'Radio';
