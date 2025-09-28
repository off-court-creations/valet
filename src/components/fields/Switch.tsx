// ─────────────────────────────────────────────────────────────
// src/components/fields/Switch.tsx | valet
// Theme-aware, accessible boolean <Switch /> component
// – Un / controlled, FormControl-aware, preset-friendly
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useCallback, useId, useState, MouseEventHandler } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useOptionalForm } from './FormControl';
import type { Presettable, Sx } from '../../types';

/*───────────────────────────────────────────────────────────*/
/* Size map helper                                           */
type SwitchSize = 'sm' | 'md' | 'lg';

interface SizeTokens {
  trackW: number;
  trackH: number;
  thumb: number;
  offset: number;
}

const createSizeMap = (): Record<SwitchSize, SizeTokens> => ({
  sm: { trackW: 32, trackH: 18, thumb: 14, offset: 14 }, // 32-18 = 14
  md: { trackW: 44, trackH: 24, thumb: 20, offset: 20 }, // 44-24 = 20
  lg: { trackW: 56, trackH: 30, thumb: 26, offset: 26 }, // 56-30 = 26
});

/*───────────────────────────────────────────────────────────*/
/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
const Track = styled('button')<{
  $checked: boolean;
  $w: number;
  $h: number;
  $primary: string;
  $dur: string;
  $ease: string;
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
  transition: background ${({ $dur }) => $dur} ${({ $ease }) => $ease};

  &:focus-visible {
    outline: var(--valet-switch-outline, 2px) solid ${({ $primary }) => $primary};
    outline-offset: var(--valet-switch-offset, 2px);
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
  $dur: string;
  $ease: string;
}>`
  position: absolute;
  top: 50%;
  left: var(--valet-switch-pad, 2px); /* gutter */
  transform: translate(${({ $checked, $offset }) => ($checked ? `${$offset}px` : '0')}, -50%);
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.45);
  transition: transform ${({ $dur }) => $dur} ${({ $ease }) => $ease};
  pointer-events: none; /* retain click on Track */
`;

/*───────────────────────────────────────────────────────────*/
/* Public props                                              */
export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'style'>,
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
  /** Inline styles (with CSS var support) */
  sx?: Sx;
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
      sx,
      ...btnProps
    },
    ref,
  ) => {
    /* ----- theme + geometry -------------------------------- */
    const { theme } = useTheme();
    const geom = createSizeMap()[size];

    /* ----- optional FormControl binding -------------------- */
    const form = useOptionalForm();

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
        if (name && form) form.setField(name as keyof Record<string, unknown>, next as unknown);
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
        type='button'
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
        $dur={theme.motion.duration.short}
        $ease={theme.motion.easing.standard}
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={
          {
            '--valet-switch-outline': theme.stroke(2),
            '--valet-switch-offset': theme.stroke(2),
            '--valet-switch-pad': theme.stroke(2),
            ...sx,
          } as React.CSSProperties
        }
      >
        <Thumb
          $checked={checked}
          $size={geom.thumb}
          $offset={geom.offset}
          $dur={theme.motion.duration.short}
          $ease={theme.motion.easing.standard}
        />
      </Track>
    );
  },
);

Switch.displayName = 'Switch';

export default Switch;
