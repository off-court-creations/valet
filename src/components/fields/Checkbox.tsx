// ─────────────────────────────────────────────────────────────────────────────
// src/components/fields/Checkbox.tsx | valet
// Theme-aware, accessible Checkbox – consistent outline, no blue flash,
// greyed-out disabled styling (Accordion-style).
// ─────────────────────────────────────────────────────────────────────────────
import React, { forwardRef, useCallback, useId, useState, ChangeEvent, ReactNode } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useOptionalForm } from './FormControl';
import { toRgb, mix, toHex } from '../../helpers/color';
import type { Theme } from '../../system/themeStore';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────────────────────*/
/* Public prop contracts                                                    */
export type CheckboxSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

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
  size?: CheckboxSize | number | string;
  onChange?: (checked: boolean, event: ChangeEvent<HTMLInputElement>) => void;
}

/*───────────────────────────────────────────────────────────────────────────*/
/* Size map helper                                                          */
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
const Wrapper = styled('label')<{
  $disabled: boolean;
  $disabledColor: string;
}>`
  display: inline-flex;
  align-items: center;
  gap: var(--checkbox-gap);
  cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
  user-select: none;
  color: ${({ $disabled, $disabledColor }) => ($disabled ? $disabledColor : 'inherit')};

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

/* Note: This local props type is used in styled<...>. To satisfy createStyled’s
   generic constraint (P extends Record<string, unknown>), we add a string
   index signature. This is type-safe because all specific properties are
   subtypes of `unknown`. */
interface BoxProps {
  [key: string]: unknown;
  $size: string;
  $checked: boolean;
  $primary: string;
  $text: string;
  $disabled: boolean;
  $disabledColor: string;
}

const Box = styled('span')<BoxProps>`
  position: relative;
  display: inline-block;
  width: ${({ $size }) => $size};
  height: ${({ $size }) => $size};
  min-width: ${({ $size }) => $size};
  border-radius: var(--valet-checkbox-radius, 4px);
  box-sizing: border-box;

  /* Outline always visible, greyed when disabled */
  border: var(--valet-checkbox-stroke, 2px) solid
    ${({ $disabled, $disabledColor, $text }) => ($disabled ? $disabledColor : $text)};

  /* Fill when checked, swap to disabled colour if disabled */
  background: ${({ $checked, $disabled, $primary, $disabledColor }) =>
    $checked ? ($disabled ? $disabledColor : $primary) : 'transparent'};

  transition:
    background 120ms ease,
    border-color 120ms ease;

  /* Remove tap highlight */
  -webkit-tap-highlight-color: transparent;

  @media (hover: hover) {
    &:hover {
      ${({ $disabled }) => ($disabled ? '' : 'filter: brightness(1.25);')}
    }
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    display: block;
    width: ${({ $size }) => `calc(${$size} - var(--valet-checkbox-inset, 4px))`};
    height: ${({ $size }) => `calc(${$size} - var(--valet-checkbox-inset, 4px))`};
    margin: auto;
    opacity: ${({ $checked }) => ($checked ? 1 : 0)};
    transform: ${({ $checked }) => ($checked ? 'scale(1)' : 'scale(0.85)')};
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 24 24' " + "xmlns='http://www.w3.org/2000/svg' " + "fill='none' stroke='%23fff' stroke-width='3' " + "stroke-linecap='round' stroke-linejoin='round'%3E" + "%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E")
      center/contain no-repeat;
    transition:
      opacity 120ms ease,
      transform 120ms ease;
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
    const map = createSizeMap(theme);

    let SZ: { box: string; tick: string; gap: string };

    if (typeof size === 'number') {
      const box = `${size}px`;
      SZ = { box, tick: `calc(${box} * 0.6)`, gap: theme.spacing(1) };
    } else if (map[size as CheckboxSize]) {
      SZ = map[size as CheckboxSize];
    } else {
      SZ = { box: size, tick: `calc(${size} * 0.6)`, gap: theme.spacing(1) };
    }

    /* Disabled colour (same recipe as Accordion) ------------------------ */
    const disabledColor = toHex(
      mix(toRgb(theme.colors.text), toRgb(mode === 'dark' ? '#000' : '#fff'), 0.4),
    );

    /* Optional FormControl binding -------------------------------------- */
    const form = useOptionalForm<Record<string, unknown>>();

    /* Controlled vs uncontrolled logic ---------------------------------- */
    const controlled = checkedProp !== undefined;
    const formBound = Boolean(form);
    const initialState = controlled
      ? checkedProp!
      : formBound
        ? Boolean(form!.values[name])
        : Boolean(defaultChecked);

    const [internal, setInternal] = useState(initialState);

    const currentChecked = controlled
      ? checkedProp!
      : formBound
        ? Boolean(form!.values[name])
        : internal;

    /* Event handler – updates state, FormStore, and user callback -------- */
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const next = e.target.checked;
        if (!controlled && !formBound) setInternal(next);
        if (form && name) form.setField(name as keyof Record<string, unknown>, next as unknown);
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
          type='checkbox'
          disabled={disabled}
          checked={currentChecked}
          onChange={handleChange}
        />
        <Box
          $size={SZ.box}
          $checked={currentChecked}
          $primary={theme.colors.secondary}
          $text={theme.colors.text}
          $disabled={disabled}
          $disabledColor={disabledColor}
          style={
            {
              '--valet-checkbox-radius': theme.radius(1),
              '--valet-checkbox-stroke': theme.stroke(2),
              '--valet-checkbox-inset': `calc(${theme.stroke(2)} * 2)`,
            } as React.CSSProperties
          }
          aria-hidden
        />
        {label ?? children}
      </Wrapper>
    );
  },
);
Checkbox.displayName = 'Checkbox';

export default Checkbox;
