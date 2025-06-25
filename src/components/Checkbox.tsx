// ─────────────────────────────────────────────────────────────────────────────
// src/components/Checkbox.tsx | valet
// Theme-aware, accessible Checkbox – consistent outline, no blue flash,
// greyed-out disabled styling (Accordion-style).
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  forwardRef,
  useCallback,
  useId,
  useState,
  ChangeEvent,
  ReactNode,
} from 'react';
import { styled }         from '../css/createStyled';
import { useTheme }       from '../system/themeStore';
import { preset }         from '../css/stylePresets';
import { useForm }        from './FormControl';
import { toRgb, mix, toHex } from '../helpers/color';
import type { Theme }     from '../system/themeStore';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────────────────────*/
/* Public prop contracts                                                    */
export type CheckboxSize = 'sm' | 'md' | 'lg';

export interface CheckboxProps
  extends Omit<
      React.InputHTMLAttributes<HTMLInputElement>,
      'type' | 'size' | 'onChange' | 'value' | 'defaultValue'
    >,
    Presettable {
  checked?: boolean;
  defaultChecked?: boolean;
  name: string;
  label?: ReactNode;
  size?: CheckboxSize;
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
}

/*───────────────────────────────────────────────────────────────────────────*/
/* Size map helper                                                          */
const createSizeMap = (t: Theme) => ({
  sm : { box: '16px', tick: '10px', gap: t.spacing.sm },
  md : { box: '20px', tick: '12px', gap: t.spacing.md },
  lg : { box: '24px', tick: '14px', gap: t.spacing.lg },
} as const);

/*───────────────────────────────────────────────────────────────────────────*/
/* Styled primitives                                                        */
const Wrapper = styled('label')<{
  $disabled: boolean;
  $disabledColor: string;
}>`
  display: inline-flex;
  align-items: center;
  gap: var(--checkbox-gap);
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
  color: ${({ $disabled, $disabledColor }) =>
    $disabled ? $disabledColor : 'inherit'};

  /* Prevent blue flash on mobile */
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
`;

const HiddenInput = styled('input')`
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
`;

interface BoxProps {
  $size: string;
  $checked: boolean;
  $text: string;
  $disabled: boolean;
  $disabledColor: string;
  $checkUri: string;
}

const Box = styled('span')<BoxProps>`
  position: relative;
  display: inline-block;
  width:  ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  min-width: ${({ $size }) => $size};
  border-radius: 4px;
  box-sizing: border-box;

  /* Outline always visible, greyed when disabled */
  border: 2px solid
    ${({ $disabled, $disabledColor, $text }) =>
      $disabled ? $disabledColor : $text};

  /* Fill grey when checked */
  background: ${({ $checked, $disabledColor }) =>
    $checked ? $disabledColor : 'transparent'};

  transition: background 120ms ease, border-color 120ms ease;

  /* Remove tap highlight */
  -webkit-tap-highlight-color: transparent;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    display: block;
    width: ${({ $size }) => `calc(${$size} - 4px)`};
    height: ${({ $size }) => `calc(${$size} - 4px)`};
    margin: auto;
    opacity: ${({ $checked }) => ($checked ? 1 : 0)};
    transform: ${({ $checked }) => ($checked ? 'scale(1)' : 'scale(0.85)')};
    background: ${({ $checkUri }) => `${$checkUri} center/contain no-repeat`};
    transition: opacity 120ms ease, transform 120ms ease;
    /* Fade tick when disabled */
    filter: ${({ $disabled }) => ($disabled ? 'grayscale(1)' : 'none')};
  }
`;

/*───────────────────────────────────────────────────────────────────────────*/
/* Component                                                                */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      name,
      checked: checkedProp,
      defaultChecked,
      label,
      size = 'md',
      disabled = false,
      onChange,
      preset: presetKey,
      className,
      style,
      children,
      ...inputRest
    },
    ref,
  ) => {
    /* Theme & sizing ---------------------------------------------------- */
    const { theme, mode } = useTheme();
    const SZ              = createSizeMap(theme)[size];

    /* Disabled colour (same recipe as Accordion) ------------------------ */
    const disabledColor = toHex(
      mix(
        toRgb(theme.colors.text),
        toRgb(mode === 'dark' ? '#000' : '#fff'),
        0.4,
      ),
    );

    const tickUri = `url("data:image/svg+xml,${encodeURIComponent(
      `<svg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='${theme.colors.primary}' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>`
    )}")`;

    /* Optional FormControl binding -------------------------------------- */
    let form: ReturnType<typeof useForm<any>> | null = null;
    try { form = useForm<any>(); } catch {}

    /* Controlled vs uncontrolled logic ---------------------------------- */
    const controlled   = checkedProp !== undefined;
    const formBound    = Boolean(form);
    const initialState =
      controlled         ? checkedProp! :
      formBound          ? Boolean(form!.values[name]) :
      Boolean(defaultChecked);

    const [internal, setInternal] = useState(initialState);

    const currentChecked =
      controlled ? checkedProp! :
      formBound  ? Boolean(form!.values[name]) :
      internal;

    /* Event handler – updates state, FormStore, and user callback -------- */
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const next = e.target.checked;
        if (!controlled && !formBound) setInternal(next);
        form?.setField(name as any, next);
        onChange?.(next, e);
      },
      [controlled, formBound, form, name, onChange],
    );

    /* Unique id for accessibility --------------------------------------- */
    const id = useId();

    /* preset → className merge ------------------------------------------ */
    const presetCls = presetKey ? preset(presetKey) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    /*─────────────────────────────────────────────────────────────────────*/
    return (
      <Wrapper
        htmlFor={id}
        style={{ '--checkbox-gap': SZ.gap, ...style } as React.CSSProperties}
        className={mergedCls}
        $disabled={disabled}
        $disabledColor={disabledColor}
      >
        <HiddenInput
          {...inputRest}
          id={id}
          ref={ref}
          name={name}
          type="checkbox"
          disabled={disabled}
          checked={currentChecked}
          onChange={handleChange}
        />
        <Box
          $size={SZ.box}
          $checked={currentChecked}
          $text={theme.colors.text}
          $disabled={disabled}
          $disabledColor={disabledColor}
          $checkUri={tickUri}
          aria-hidden
        />
        {label ?? children}
      </Wrapper>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export default Checkbox;
