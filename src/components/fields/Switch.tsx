// ─────────────────────────────────────────────────────────────
// src/components/fields/Switch.tsx | valet
// Theme-aware, accessible boolean <Switch /> component
// – Un / controlled, FormControl-aware, preset-friendly
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useCallback, useId, useState, MouseEventHandler } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useForm } from './FormControl';
import type { Theme } from '../../system/themeStore';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Size map helper                                           */
type SwitchSize = 'sm' | 'md' | 'lg';

interface SizeTokens {
  trackW: number;
  trackH: number;
  thumb: number;
  offset: number;
}

const createSizeMap = (_: Theme): Record<SwitchSize, SizeTokens> => ({
  sm: { trackW: 32, trackH: 18, thumb: 14, offset: 14 }, // 32-18 = 14
  md: { trackW: 44, trackH: 24, thumb: 20, offset: 20 }, // 44-24 = 20
  lg: { trackW: 56, trackH: 30, thumb: 26, offset: 26 }, // 56-30 = 26
});

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Track = styled('button')<{
  $checked: boolean;
  $w: number;
  $h: number;
  $primary: string;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  box-sizing: border-box;

  width: ${({ $w }) => $w}px;
  height: ${({ $h }) => $h}px;
  min-width: ${({ $w }) => $w}px;
  min-height: ${({ $h }) => $h}px;
  padding: 0;
  border: none;
  border-radius: 9999px;
  background: ${({ $checked, $primary }) => ($checked ? $primary : '#0003')};
  cursor: pointer;
  transition: background 150ms ease;

  &:focus-visible {
    outline: 2px solid ${({ $primary }) => $primary};
    outline-offset: 2px;
  }
  &:disabled {
    opacity: 0.5;
    cursor: default;
  }
`;

const Thumb = styled('span')<{
  $checked: boolean;
  $size: number;
  $offset: number;
}>`
  position: absolute;
  top: 50%;
  left: 2px; /* 2-px gutter */
  transform: translate(${({ $checked, $offset }) => ($checked ? `${$offset}px` : '0')}, -50%);
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  transition: transform 150ms ease;
  pointer-events: none; /* retain click on Track */
`;

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'>,
    Presettable {
  /** Controlled checked state. */
  checked?: boolean;
  /** Default state for uncontrolled usage. */
  defaultChecked?: boolean;
  /** Callback for state changes (fires for both modes). */
  onChange?: (checked: boolean) => void;
  /** Optional form field name (required to bind into FormControl). */
  name?: string;
  /** Visual size; defaults to `md`. */
  size?: SwitchSize;
}

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked: checkedProp,
      defaultChecked = false,
      onChange,
      name,
      size = 'md',
      disabled = false,
      preset: p,
      className,
      style,
      ...btnProps
    },
    ref,
  ) => {
    /* ----- theme + geometry -------------------------------- */
    const { theme } = useTheme();
    const geom = createSizeMap(theme)[size];

    /* ----- optional FormControl binding -------------------- */
    let form: ReturnType<typeof useForm<any>> | null = null;
    try {
      form = useForm<any>();
    } catch {}

    /* If we’re in a form and given `name`, prefer that as source of truth */
    const formChecked = form && name ? Boolean(form.values[name]) : undefined;

    const controlled = checkedProp !== undefined || formChecked !== undefined;
    const [self, setSelf] = useState(defaultChecked);
    const checked = controlled ? (formChecked !== undefined ? formChecked : !!checkedProp) : self;

    /* ----- event handler ----------------------------------- */
    const handleToggle: MouseEventHandler<HTMLButtonElement> = useCallback(
      (e) => {
        if (disabled) return;
        const next = !checked;

        /* update uncontrolled state */
        if (!controlled) setSelf(next);
        /* notify FormControl */
        form?.setField?.(name as any, next);
        /* fire user callback */
        onChange?.(next);
        /* propagate native click */
        btnProps.onClick?.(e);
      },
      [checked, controlled, disabled, form, name, onChange, btnProps],
    );

    /* ----- preset → className ------------------------------ */
    const presetClasses = p ? preset(p) : '';

    /* ----- accessibility attrs ----------------------------- */
    const switchId = useId();

    return (
      <Track
        {...btnProps}
        ref={ref}
        role='switch'
        id={switchId}
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        onClick={handleToggle}
        $checked={checked}
        $w={geom.trackW}
        $h={geom.trackH}
        $primary={theme.colors.primary}
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={style}
      >
        <Thumb
          $checked={checked}
          $size={geom.thumb}
          $offset={geom.offset}
        />
      </Track>
    );
  },
);

Switch.displayName = 'Switch';

export default Switch;
