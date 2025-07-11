// ─────────────────────────────────────────────────────────────
// src/components/RadioGroup.tsx | valet
// Theme-aware radio groups with keyboard nav & refined spacing
// • Disabled state now mirrors Accordion / Checkbox colour recipe
// • Inner (radio–label) gap tight; vertical option gap = theme.spacing(1.5)
// ─────────────────────────────────────────────────────────────
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
import { styled }           from '../css/createStyled';
import { preset }           from '../css/stylePresets';
import { useTheme }         from '../system/themeStore';
import { toRgb, mix, toHex } from '../helpers/color';
import type { Theme }       from '../system/themeStore';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
/* Context                                                   */
type RadioSize = 'sm' | 'md' | 'lg';

interface RadioCtx {
  value   : string | null;
  setValue: (v: string) => void;
  name    : string;
  size    : RadioSize;
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
  sm: { indicator: '16px', dot: '10px', gapInner: t.spacing(0.75) },
  md: { indicator: '20px', dot: '12px', gapInner: t.spacing(0.75) },
  lg: { indicator: '24px', dot: '14px', gapInner: t.spacing(1) },
});

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const RootBase = styled('div')`
  display: flex; /* direction + gap inline */
`;

const OptionLabel = styled('label')<{
  $disabled: boolean;
  $disabledColor: string;
}>`
  display: inline-flex;
  align-items: center;
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
  color: ${({ $disabled, $disabledColor }) =>
    $disabled ? $disabledColor : 'inherit'};

  /* Mobile tap highlight suppression */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
`;

const HiddenInput = styled('input')`
  position: absolute;
  opacity : 0;
  width   : 0;
  height  : 0;
  pointer-events: none;
`;

/*───────────────────────────────────────────────────────────*/
/* Public prop contracts                                     */
export interface RadioGroupProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'>,
    Presettable {
  value?        : string;
  defaultValue? : string;
  name?         : string;
  row?          : boolean;
  size?         : RadioSize;
  /** Gap between options */
  spacing?      : number | string;
  onChange?     : (val: string) => void;
  children      : ReactNode;
}

export interface RadioProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'type' | 'size' | 'onChange'
    >,
    Presettable {
  value   : string;
  label?  : string;
  size?   : RadioSize;
  children?: ReactNode;
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
  preset: p,
  style,
  className,
  children,
  ...rest
}) => {
  const { theme }  = useTheme();
  const id         = useId();
  const name       = nameProp ?? `radio-group-${id}`;
  const controlled = valueProp !== undefined;

  /* Controlled/uncontrolled wiring ------------------------------------- */
  const [selfVal, setSelfVal] = useState<string | null>(defaultValue ?? null);
  const setValue = useCallback(
    (v: string) => {
      if (!controlled) setSelfVal(v);
      onChange?.(v);
    },
    [controlled, onChange],
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
    if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key))
      return;
    e.preventDefault();

    const radios = ref.current?.querySelectorAll<HTMLInputElement>(
      'input[type="radio"]:not([disabled])',
    );
    if (!radios?.length) return;

    const idx  = Array.from(radios).findIndex((r) => r === document.activeElement);
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1;
    const next = (idx + step + radios.length) % radios.length;
    radios[next]?.focus();
    radios[next]?.click();
  };

  /* preset → className ------------------------------------------------- */
  const presetCls = p ? preset(p) : '';
  const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

  return (
    <RadioGroupCtx.Provider value={ctxVal}>
      <RootBase
        {...rest}
        ref={ref}
        role="radiogroup"
        onKeyDown={onKey}
        className={mergedCls}
        style={{
          flexDirection: row ? 'row' : 'column',
          alignItems   : row ? 'center' : 'flex-start',
          gap          : gapCss,
          ...style,
        }}
      >
        {children}
      </RootBase>
    </RadioGroupCtx.Provider>
  );
};

/*───────────────────────────────────────────────────────────*/
/* Indicator helper                                          */
interface IndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  checked      : boolean;
  outerSize    : string;
  dotSize      : string;
  primary      : string;
  disabled     : boolean;
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
      aria-hidden
      style={{
        width        : outerSize,
        height       : outerSize,
        minWidth     : outerSize,
        borderRadius : '50%',
        border       : `2px solid ${ring}`,
        display      : 'inline-flex',
        alignItems   : 'center',
        justifyContent: 'center',
        transition   : 'box-shadow 120ms',
        backgroundColor: checked ? ring : undefined,
        boxShadow    : checked
          ? `inset 0 0 0 ${parseInt(outerSize, 10) / 2}px ${ring}`
          : undefined,
      }}
    >
      {checked && (
        <span
          style={{
            width           : dotSize,
            height          : dotSize,
            borderRadius    : '50%',
            backgroundColor : '#fff',
            filter          : disabled ? 'grayscale(1)' : 'none',
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
      style,
      className,
      ...inputRest
    },
    ref,
  ) => {
    /* Theme + sizing ---------------------------------------------------- */
    const { theme, mode } = useTheme();
    const { value: sel, setValue, name, size: groupSize } = useRadioGroup();

    const token   = sizeProp ?? groupSize;
    const SZ      = createSizeMap(theme)[token];
    const checked = sel === value;

    /* Disabled colour (Accordion recipe) ------------------------------- */
    const disabledColor = toHex(
      mix(
        toRgb(theme.colors.text),
        toRgb(mode === 'dark' ? '#000' : '#fff'),
        0.4,
      ),
    );

    const onChange = () => !disabled && setValue(value);

    /* preset → className ---------------------------------------------- */
    const presetCls = p ? preset(p) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    /*───────────────────────────────────────────────────────────────────*/
    return (
      <OptionLabel
        className={mergedCls}
        style={{ gap: SZ.gapInner, ...style }}
        $disabled={disabled}
        $disabledColor={disabledColor}
      >
        <HiddenInput
          {...inputRest}
          ref={ref}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={onChange}
        />
        <Indicator
          checked       ={checked}
          outerSize     ={SZ.indicator}
          dotSize       ={SZ.dot}
          primary       ={theme.colors.primary}
          disabled      ={disabled}
          disabledColor ={disabledColor}
        />
        {label ?? children}
      </OptionLabel>
    );
  },
);
Radio.displayName = 'Radio';
