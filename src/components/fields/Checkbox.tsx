// ─────────────────────────────────────────────────────────────────────────────
// src/components/fields/Checkbox.tsx | valet
// Theme-aware, accessible Checkbox – consistent outline, no blue flash,
// greyed-out disabled styling (Accordion-style).
// ─────────────────────────────────────────────────────────────────────────────
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  ChangeEvent,
} from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useOptionalForm } from './FormControl';
import { toRgb, mix, toHex } from '../../helpers/color';
import type { Theme } from '../../system/themeStore';
import type { FieldBaseProps } from '../../types';
import type { ChangeInfo, OnValueChange, OnValueCommit } from '../../system/events';

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
  theme: Theme;
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

  /* Visible focus ring on the visual box when input is focused */
  input[type='checkbox']:focus-visible + [data-indicator] {
    outline: ${({ theme }) => theme.stroke(2)} solid ${({ theme }) => theme.colors.primary};
    outline-offset: ${({ theme }) => theme.stroke(1)};
  }
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
  $indeterminate: boolean;
  $primary: string;
  $outline: string;
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
    ${({ $disabled, $disabledColor, $outline }) => ($disabled ? $disabledColor : $outline)};

  /* Fill when checked or indeterminate, swap to disabled colour if disabled */
  background: ${({ $checked, $indeterminate, $disabled, $primary, $disabledColor }) =>
    $checked || $indeterminate ? ($disabled ? $disabledColor : $primary) : 'transparent'};

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
    opacity: ${({ $checked, $indeterminate }) => ($checked || $indeterminate ? 1 : 0)};
    transform: ${({ $checked, $indeterminate }) =>
      $checked || $indeterminate ? 'scale(1)' : 'scale(0.85)'};
    background: ${({ $indeterminate }) =>
        $indeterminate
          ? "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round'%3E%3Cline x1='6' y1='12' x2='18' y2='12' /%3E%3C/svg%3E\")"
          : "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg' fill='none' stroke='%23fff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='20 6 9 17 4 12'/%3E%3C/svg%3E\")"}
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
      bindForm = true,
      checked: checkedProp,
      defaultChecked,
      indeterminate = false,
      label,
      size = 'md',
      disabled = false,
      error,
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
    // Controlled/uncontrolled guard (dev-only)
    const initialCtl = React.useRef<boolean | undefined>(undefined);
    React.useEffect(() => {
      if (process.env.NODE_ENV === 'production') return;
      if (initialCtl.current === undefined) initialCtl.current = controlled;
      else if (initialCtl.current !== controlled) {
        console.error(
          'Checkbox: component switched from %s to %s after mount. This is not supported.',
          initialCtl.current ? 'controlled' : 'uncontrolled',
          controlled ? 'controlled' : 'uncontrolled',
        );
      }
    }, [controlled]);
    const formBound = Boolean(form) && bindForm && Boolean(name);
    const initialState = controlled
      ? checkedProp!
      : formBound
        ? Boolean(form!.values[name as keyof Record<string, unknown>])
        : Boolean(defaultChecked);

    const [internal, setInternal] = useState(initialState);

    const currentChecked = controlled
      ? checkedProp!
      : formBound
        ? Boolean(form!.values[name as keyof Record<string, unknown>])
        : internal;

    /* Event handler – updates state, FormStore, and user callback -------- */
    const handleChange = useCallback(
      (e: ChangeEvent<HTMLInputElement>) => {
        const prev = currentChecked;
        const next = e.target.checked;
        if (!controlled && !formBound) setInternal(next);
        if (form && formBound && name)
          form.setField(name as keyof Record<string, unknown>, next as unknown);

        // Fire DOM-parity event
        onChange?.(e);
        const src: ChangeInfo<boolean>['source'] =
          e.nativeEvent instanceof KeyboardEvent
            ? 'keyboard'
            : e.nativeEvent instanceof MouseEvent || e.nativeEvent instanceof PointerEvent
              ? 'pointer'
              : 'programmatic';
        const info: ChangeInfo<boolean> = {
          previousValue: prev,
          phase: 'input',
          source: src,
          event: e,
          name,
        };
        onValueChange?.(next, info);
        onValueCommit?.(next, { ...info, phase: 'commit' });
      },
      [controlled, formBound, form, name, onChange, onValueChange, onValueCommit, currentChecked],
    );

    /* Manage native indeterminate property ------------------------------- */
    const innerRef = useRef<HTMLInputElement | null>(null);
    const setRefs = (node: HTMLInputElement | null) => {
      innerRef.current = node;
      if (typeof ref === 'function') ref(node);
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
    };
    useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = !!indeterminate;
    }, [indeterminate]);

    /* Unique id for accessibility --------------------------------------- */
    const reactId = useId();
    const id = idProp ?? reactId;

    /* preset → className merge ------------------------------------------ */
    const presetCls = presetKey ? preset(presetKey) : '';
    const mergedCls = [presetCls, className].filter(Boolean).join(' ') || undefined;

    /*─────────────────────────────────────────────────────────────────────*/
    return (
      <Wrapper
        theme={theme}
        htmlFor={id}
        data-valet-component='Checkbox'
        data-state={currentChecked ? 'checked' : 'unchecked'}
        data-disabled={disabled ? 'true' : 'false'}
        style={{ '--checkbox-gap': SZ.gap, ...sx } as React.CSSProperties}
        className={mergedCls}
        $disabled={disabled}
        $disabledColor={disabledColor}
      >
        <HiddenInput
          {...inputRest}
          id={id}
          ref={setRefs}
          {...(bindForm && name ? { name } : {})}
          type='checkbox'
          disabled={disabled}
          checked={currentChecked}
          onChange={handleChange}
          aria-invalid={error || undefined}
          aria-checked={indeterminate ? 'mixed' : currentChecked}
        />
        <Box
          $size={SZ.box}
          $checked={currentChecked}
          $indeterminate={!!indeterminate}
          $primary={theme.colors.primary}
          $outline={theme.colors.divider}
          $disabled={disabled}
          $disabledColor={disabledColor}
          data-indicator
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
