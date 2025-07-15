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
  useId,
  useMemo,
  useRef,
  useState,
  KeyboardEvent,
  createContext,
} from 'react';
import { styled }           from '../../css/createStyled';
import { preset }           from '../../css/stylePresets';
import { useTheme }         from '../../system/themeStore';
import { toRgb, mix, toHex } from '../../helpers/color';
import type { Theme }       from '../../system/themeStore';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Context                                                   */
export type RadioSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface RadioCtx {
  value   : string | null;
  setValue: (v: string) => void;
  name    : string;
  size    : RadioSize | number | string;
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
  xs: { indicator: '0.75rem', dot: 'calc(0.75rem * 0.6)', gapInner: t.spacing(0.75) },
  sm: { indicator: '1rem',    dot: 'calc(1rem * 0.6)',    gapInner: t.spacing(0.75) },
  md: { indicator: '1.25rem', dot: 'calc(1.25rem * 0.6)', gapInner: t.spacing(0.75) },
  lg: { indicator: '1.5rem',  dot: 'calc(1.5rem * 0.6)',  gapInner: t.spacing(1)    },
  xl: { indicator: '1.75rem', dot: 'calc(1.75rem * 0.6)', gapInner: t.spacing(1)    },
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
  size?         : RadioSize | number | string;
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
  size?   : RadioSize | number | string;
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
    const map     = createSizeMap(theme);

    let SZ: { indicator: string; dot: string; gapInner: string };

    if (typeof token === 'number') {
      const ind = `${token}px`;
      SZ = {
        indicator: ind,
        dot      : `calc(${ind} * 0.6)`,
        gapInner : theme.spacing(0.75),
      };
    } else if (map[token as RadioSize]) {
      SZ = map[token as RadioSize];
    } else {
      const ind = token as string;
      SZ = {
        indicator: ind,
        dot      : `calc(${ind} * 0.6)`,
        gapInner : theme.spacing(0.75),
      };
    }
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
