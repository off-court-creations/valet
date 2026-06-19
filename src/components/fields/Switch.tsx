// ─────────────────────────────────────────────────────────────
// src/components/fields/Switch.tsx | valet
// Theme-aware, accessible boolean <Switch /> component
// – Un / controlled, FormControl-aware, preset-friendly
// ─────────────────────────────────────────────────────────────
import React, { forwardRef, useCallback, useId, MouseEventHandler } from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useFieldState } from '../../hooks/useControlledState';
import { useCompact } from '../../system/compactContext';
import { useFormConfig } from './FormControl';
import { warnOnce } from '../../system/devErrors';
import type { FieldBaseProps } from '../../types';
import type { ChangeInfo, InputSource, OnValueChange, OnValueCommit } from '../../system/events';

/*───────────────────────────────────────────────────────────*/
/* ChangeInfo.source classification (ruling R10)             */

/**
 * Classify the real activation source of a `<button role="switch">` click.
 *
 * Browsers synthesize a `click` event when a focused button is activated via
 * the keyboard (Space or Enter); that synthetic click carries `detail === 0`
 * (no associated mouse presses), whereas a genuine pointer click reports
 * `detail >= 1`. The old code hardcoded `'pointer'` for every toggle. We map
 * `detail === 0` ⇒ `'keyboard'` and `detail >= 1` ⇒ `'pointer'`.
 */
function classifyClickSource(e: React.MouseEvent<HTMLButtonElement>): InputSource {
  return e.detail === 0 ? 'keyboard' : 'pointer';
}

/*───────────────────────────────────────────────────────────*/
/* Size map helper                                           */
type SwitchSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface SizeTokens {
  trackW: number;
  trackH: number;
  thumb: number;
  offset: number;
}

const createSizeMap = (): Record<SwitchSize, SizeTokens> => ({
  xs: { trackW: 28, trackH: 16, thumb: 12, offset: 12 },
  sm: { trackW: 32, trackH: 18, thumb: 14, offset: 14 },
  md: { trackW: 44, trackH: 24, thumb: 20, offset: 20 },
  lg: { trackW: 56, trackH: 30, thumb: 26, offset: 26 },
  xl: { trackW: 72, trackH: 38, thumb: 32, offset: 32 },
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

  /* Mobile chrome kit — no blue tap flash, no iOS callout, no text selection */
  -webkit-tap-highlight-color: transparent;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  touch-action: manipulation;

  /* Coarse-pointer (touch) hit target — expand to >=44px (24px under compact)
     WITHOUT changing the visual track; fine-pointer (desktop) is untouched.
     Logical centering (inset:0; margin:auto) keeps the RTL gate green. */
  @media (pointer: coarse) {
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      margin: auto;
      width: max(100%, var(--valet-switch-hit, 44px));
      height: max(100%, var(--valet-switch-hit, 44px));
    }
  }

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
  /* rtl: physical-by-design — thumb off-position origin paired with the
     positive-px translate slide below; mirroring the slide direction needs
     a negated $offset (interactive-RTL drag/slide math is a logged deferral). */
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
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'style' | 'name'>,
    FieldBaseProps {
  /** Controlled checked state. */
  checked?: boolean;
  /** Default state for uncontrolled usage. */
  defaultChecked?: boolean;
  /** Canonical value change event (fires on each toggle). */
  onValueChange?: OnValueChange<boolean>;
  /** Commit event (same moment for toggles). */
  onValueCommit?: OnValueCommit<boolean>;
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
      onValueChange,
      onValueCommit,
      name,
      size = 'md',
      disabled = false,
      // API-TYPES S6 (stage A): destructure the FieldBaseProps cluster BEFORE the
      // rest-spread so label/helperText/error/fullWidth stop leaking onto the
      // <button> Track as invalid DOM attributes. `error` drives aria-invalid;
      // `label`/`helperText` are now rendered + wired as the accessible name /
      // description (WCAG 4.1.2). FieldShell rendering of fullWidth is Phase 2 / Q10.
      label,
      helperText,
      error,
      fullWidth: _fullWidth,
      preset: p,
      className,
      sx,
      ...btnProps
    },
    ref,
  ) => {
    void _fullWidth;
    /* ----- theme + geometry -------------------------------- */
    const { theme } = useTheme();
    const geom = createSizeMap()[size];
    const effectiveCompact = useCompact();

    /* Form-wide config (own props win; the form config is the fallback). */
    const formConfig = useFormConfig();
    const effectiveDisabled = disabled || formConfig.disabled;
    const effectiveError = Boolean(error) || (name != null && formConfig.errors[name] != null);

    /* ----- value resolution (shared hook, ruling R9) ------- */
    /* Single resolution of checked/control/form binding via the shared hook:
       precedence prop > form > internal, latched at mount; an unseeded form
       key renders `defaultChecked` as controlled with a one-time dev warn and
       never writes on mount. This replaces the old hand-rolled guard where
       `Boolean(form.values[name])` coerced a missing key to `false`, ignoring
       `defaultChecked` and rendering the switch unchecked. */
    const [checked, setValue] = useFieldState<boolean>({
      value: checkedProp,
      defaultValue: defaultChecked ?? false,
      fallback: false,
      name,
      component: 'Switch',
    });

    /* ----- event handler ----------------------------------- */
    const handleToggle: MouseEventHandler<HTMLButtonElement> = useCallback(
      (e) => {
        if (effectiveDisabled) return;
        const next = !checked;

        /* update internal/form state via the hook's single precedence rule */
        setValue(next);
        /* fire events */
        const info: ChangeInfo<boolean> = {
          previousValue: checked,
          phase: 'input',
          // Honest activation source (ruling R10): keyboard (synthetic
          // detail-0 click) vs a genuine pointer press (detail >= 1).
          source: classifyClickSource(e),
          event: e,
          name,
        };
        onValueChange?.(next, info);
        onValueCommit?.(next, { ...info, phase: 'commit' });
        /* propagate native click */
        btnProps.onClick?.(e);
      },
      [checked, effectiveDisabled, name, onValueChange, onValueCommit, setValue, btnProps],
    );

    /* ----- preset → className ------------------------------ */
    const presetClasses = p ? preset(p) : '';

    /* ----- accessibility attrs ----------------------------- */
    const switchId = useId();
    // WCAG 4.1.2 (Name, Role, Value): wire the visible `label` as the button's
    // accessible name and `helperText` as its description. RadioGroup uses the
    // same id-association pattern.
    const labelId = label != null ? `${switchId}-label` : undefined;
    const helpId = helperText != null ? `${switchId}-help` : undefined;

    // Dev-time accessible-name guard (mirrors IconButton.tsx): warn ONCE if the
    // switch would render with no accessible name from ANY source. External
    // labelling via aria-label/aria-labelledby is valid and silences the warn.
    if (process.env.NODE_ENV !== 'production') {
      const hasName =
        label != null ||
        Boolean((btnProps as Record<string, unknown>)['aria-label']) ||
        Boolean((btnProps as Record<string, unknown>)['aria-labelledby']);
      if (!hasName) {
        warnOnce(
          `Switch:no-accessible-name:${switchId}`,
          'valet: Switch: provide an accessible name via the `label` prop, aria-label, or aria-labelledby (WCAG 4.1.2).',
        );
      }
    }

    const track = (
      <Track
        {...btnProps}
        ref={ref}
        type='button'
        role='switch'
        data-valet-component='Switch'
        id={switchId}
        aria-checked={checked}
        aria-invalid={effectiveError || undefined}
        aria-disabled={effectiveDisabled || undefined}
        aria-labelledby={labelId}
        aria-describedby={helpId}
        data-state={checked ? 'checked' : 'unchecked'}
        data-disabled={effectiveDisabled ? 'true' : 'false'}
        disabled={effectiveDisabled}
        onClick={handleToggle}
        onContextMenu={(e: React.MouseEvent) => e.preventDefault()}
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
            '--valet-switch-hit': effectiveCompact ? '24px' : '44px',
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

    // When neither label nor helperText is supplied, render the bare <Track>
    // exactly as before — no wrapper, no structural change. The button keeps
    // ref/btnProps/className/sx/style so existing consumers/tests are unaffected.
    if (label == null && helperText == null) return track;

    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: theme.spacing(0.5),
        }}
      >
        {track}
        {(label != null || helperText != null) && (
          <span style={{ display: 'inline-flex', flexDirection: 'column' }}>
            {label != null && (
              <span
                id={labelId}
                style={{ fontSize: '0.875rem', color: theme.colors.text }}
              >
                {label}
              </span>
            )}
            {helperText != null && (
              <span
                id={helpId}
                style={{ fontSize: '0.75rem', color: theme.colors.text + 'AA' }}
                aria-live='polite'
              >
                {helperText}
              </span>
            )}
          </span>
        )}
      </span>
    );
  },
);

Switch.displayName = 'Switch';

export default Switch;
