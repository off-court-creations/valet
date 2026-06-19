// ─────────────────────────────────────────────────────────────
// src/components/fields/TextField.tsx  | valet
// Controlled text input integrating with FormControl. 1.0 redo: the
// render/styled layer is rewritten; the control/event/a11y PLUMBING is kept
// byte-for-byte (it is correct and gate-pinned).
//
// REWRITTEN (visual/structural): width model (width:100% + min-inline-size:0 +
// a `width` prop; fullWidth → flex:1), colors via ONE computeIntentVars call
// (neutral border, border + focus ring both recolor on error) consistent with
// Button/Checkbox/Switch, a `size` scale, a real `required` affordance, the
// helperText/errorText split (neutral helper has no aria-live; the error message
// is a role='alert' region), composed caller onBlur/onKeyDown, a coarse-pointer
// ≥44px target on the input arm, a webkit-autofill fix, the dev accessible-name
// guard, and form-wide disabled/error from FormConfigCtx.
//
// PRESERVED (plumbing, ruling R9/R10): useFieldState (precedence prop > form >
// internal, latched at mount), classifyInputSource, the ChangeInfo phase/source
// trio, the controlled-prop selection, htmlFor/aria-describedby/aria-invalid.
// ─────────────────────────────────────────────────────────────
import React, {
  forwardRef,
  useId,
  ChangeEventHandler,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import { useFieldState } from '../../hooks/useControlledState';
import { useCompact } from '../../system/compactContext';
import { useFormConfig } from './FormControl';
import { computeIntentVars, makeMix } from '../../system/intentVars';
import { warnOnce } from '../../system/devErrors';
import type { Theme } from '../../system/themeStore';
import type { FieldBaseProps, Sx } from '../../types';
import type { ChangeInfo, InputSource, OnValueChange, OnValueCommit } from '../../system/events';

/*───────────────────────────────────────────────────────────────────────────*/
/* Prop contracts                                                            */

// `size` is intentionally omitted from the native attrs — the token `size`
// prop + `width` prop are the supported sizing path (native size/cols interact
// unpredictably with width:100%).
type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'style' | 'size'>;
type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'style' | 'size'>;

export type TextFieldSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
/** Visual variant. Only `outlined` is implemented for 1.0; `filled`/`underline`
 *  are declared for forward-compat and currently render as outlined. */
export type TextFieldVariant = 'outlined' | 'filled' | 'underline';

interface TextFieldOwn {
  /** Override input font. */
  fontFamily?: string;
  /** Field name is required for TextField to bind and identify the value. */
  name: string;
  /** Visual variant (only `outlined` implemented for 1.0). Default `outlined`. */
  variant?: TextFieldVariant;
  /** Size token. Default `md`. */
  size?: TextFieldSize;
  /** Explicit field width — number → px, or any CSS length. Overrides the
   *  default `width:100%`. */
  width?: number | string;
  /** Mark the field required (visible `*`, `aria-required`, native `required`). */
  required?: boolean;
  /** Validation message shown in the role='alert' region when `error` (or a
   *  matching FormControl error). Falls back to `helperText`. */
  errorText?: React.ReactNode;
}

export type TextFieldProps =
  | (FieldBaseProps &
      TextFieldOwn & {
        /** DOM-parity change event (raw React event). */
        onChange?: ChangeEventHandler<HTMLInputElement>;
        /** Canonical value change event (fires on each input). */
        onValueChange?: OnValueChange<string>;
        /** Commit event (on Enter or blur). */
        onValueCommit?: OnValueCommit<string>;
      } & InputProps & { as?: 'input' })
  | (FieldBaseProps &
      TextFieldOwn & {
        /** DOM-parity change event (raw React event). */
        onChange?: ChangeEventHandler<HTMLTextAreaElement>;
        /** Canonical value change event (fires on each input). */
        onValueChange?: OnValueChange<string>;
        /** Commit event (on blur). Enter inserts newline for textarea. */
        onValueCommit?: OnValueCommit<string>;
      } & TextareaProps & { as: 'textarea' });

/*───────────────────────────────────────────────────────────────────────────*/
/* Size map — font + padding + min-height (md ≈ the pre-1.0 look)            */
interface SizeTokens {
  font: string;
  padV: string;
  padH: string;
  minH: string;
}
const createSizeMap = (t: Theme): Record<TextFieldSize, SizeTokens> => ({
  xs: { font: '0.75rem', padV: t.spacing(0.5), padH: t.spacing(0.75), minH: '1.75rem' },
  sm: { font: '0.8125rem', padV: t.spacing(0.5), padH: t.spacing(1), minH: '2rem' },
  md: { font: '0.875rem', padV: t.spacing(1), padH: t.spacing(1), minH: '2.5rem' },
  lg: { font: '1rem', padV: t.spacing(1.25), padH: t.spacing(1.5), minH: '3rem' },
  xl: { font: '1.125rem', padV: t.spacing(1.5), padH: t.spacing(2), minH: '3.5rem' },
});

/*───────────────────────────────────────────────────────────────────────────*/
/* ChangeInfo.source classification (ruling R10) — PRESERVED verbatim        */

function classifyInputSource(native: Event): InputSource {
  if (typeof InputEvent !== 'undefined' && native instanceof InputEvent) {
    const inputType = native.inputType ?? '';
    if (inputType.startsWith('insertFromPaste') || inputType === 'insertFromDrop') {
      return 'clipboard';
    }
    return 'keyboard';
  }
  return 'programmatic';
}

/*───────────────────────────────────────────────────────────────────────────*/
/* Styled helpers — all theme/instance variation rides on inline CSS vars, so
   the control resolves to ONE cached class (input) + one (textarea).        */

const sharedFieldCSS = `
  box-sizing: border-box;
  width: 100%;
  min-inline-size: 0;
  padding: var(--vt-padV) var(--vt-padH);
  font-size: var(--vt-font);
  color: var(--valet-intent-fg);
  background: var(--vt-bg);
  border: var(--vt-border-w, 1px) solid var(--valet-intent-border);
  border-radius: var(--vt-radius, 6px);
  transition: border-color 120ms ease;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;

  @media (hover: hover) {
    &:not(:disabled):hover {
      border-color: var(--vt-hover-border);
    }
  }
  &:focus-visible {
    outline: var(--valet-focus-width, 2px) solid var(--valet-intent-focus);
    outline-offset: var(--valet-focus-offset, 2px);
  }
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  /* Autofill paints the field surface, NOT the intent accent. */
  &:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 1000px var(--vt-bg) inset;
    -webkit-text-fill-color: var(--vt-autofill-text);
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const FieldInput = styled('input')`
  ${sharedFieldCSS}
  /* Coarse-pointer comfort: floor the touch height at >=44px (24px compact),
     input arm only — a textarea's height is rows-driven. */
  @media (pointer: coarse) {
    min-height: max(var(--vt-minh, 2.5rem), var(--valet-tf-hit, 44px));
  }
`;

const FieldTextarea = styled('textarea')`
  ${sharedFieldCSS}
  resize: vertical;
`;

const Wrapper = styled('div')`
  display: flex;
  flex-direction: column;
  gap: var(--vt-gap, 0.25rem);
  width: var(--valet-tf-width, 100%);
  min-inline-size: 0;
  min-width: 0;
`;

const Label = styled('label')`
  font-size: 0.75rem;
  font-weight: 500;
`;

const Message = styled('span')`
  font-size: 0.75rem;
`;

/*───────────────────────────────────────────────────────────────────────────*/
/* Component                                                                 */

export const TextField = forwardRef<HTMLInputElement | HTMLTextAreaElement, TextFieldProps>(
  (props, ref) => {
    const {
      as = 'input',
      name,
      label,
      helperText,
      error = false,
      errorText,
      fullWidth = false,
      width,
      size = 'md',
      variant: _variant, // only outlined implemented; accepted for forward-compat
      required = false,
      fontFamily,
      preset: presetName,
      className,
      sx: sxProp,
      ...rawRest
    } = props as TextFieldProps & { sx?: Sx };
    void _variant;

    // Strip valet-managed keys + the composed handlers so they never leak onto
    // the DOM element via the rest-spread; the canonical event trio is read off
    // the destructured props directly (no `(props as unknown as …)` casts).
    const {
      onChange: externalOnChange,
      value: externalValue,
      defaultValue,
      onValueChange,
      onValueCommit,
      onBlur: callerOnBlur,
      onKeyDown: callerOnKeyDown,
      disabled: ownDisabled,
      readOnly: ownReadOnly,
      ...rest
    } = rawRest as Record<string, unknown> & {
      onChange?: ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
      value?: string;
      defaultValue?: string;
      onValueChange?: OnValueChange<string>;
      onValueCommit?: OnValueCommit<string>;
      onBlur?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
      onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
      disabled?: boolean;
      readOnly?: boolean;
    };

    const generatedId = useId();
    const { theme } = useTheme();
    const effectiveCompact = useCompact();
    const formConfig = useFormConfig();
    const prevRef = React.useRef<string | undefined>(externalValue ?? defaultValue);

    /* PRESERVED: single resolution of value/control/form binding (ruling R9). */
    const [current, setValue, meta] = useFieldState<string>({
      value: externalValue,
      defaultValue,
      fallback: '',
      name,
      component: 'TextField',
    });
    prevRef.current = prevRef.current ?? current;

    /* Form-wide config (own props win; form config is the fallback). */
    const effectiveDisabled = Boolean(ownDisabled) || formConfig.disabled;
    const configError = formConfig.errors[name];
    const effectiveError = error || configError != null;
    const errorMessage = effectiveError ? (errorText ?? configError ?? helperText) : undefined;

    /* ids + describedby (PRESERVED shape, extended with the error region). */
    const providedId = (rawRest as Record<string, unknown>).id as string | undefined;
    const inputId = providedId ?? generatedId;
    const helperId = helperText != null ? `${inputId}-help` : undefined;
    const errorId = effectiveError && errorMessage != null ? `${inputId}-error` : undefined;
    const describedByFromProps = (rawRest as Record<string, unknown>)['aria-describedby'] as
      | string
      | undefined;
    const activeMsgId = errorId ?? helperId;
    const ariaDescribedBy =
      [describedByFromProps, activeMsgId].filter(Boolean).join(' ') || undefined;

    /* dev accessible-name guard (mirrors Switch/Slider/Checkbox). */
    if (process.env.NODE_ENV !== 'production') {
      const hasName =
        label != null ||
        Boolean((rawRest as Record<string, unknown>)['aria-label']) ||
        Boolean((rawRest as Record<string, unknown>)['aria-labelledby']);
      if (!hasName) {
        warnOnce(
          `TextField:no-accessible-name:${inputId}`,
          'valet: TextField: provide an accessible name via the `label` prop, aria-label, or aria-labelledby (WCAG 4.1.2).',
        );
      }
    }

    /* Colours: ONE intent contract call (variant filled + explicit neutral
       border, exactly like Checkbox); border AND focus recolor on error. */
    const intentVars = computeIntentVars({
      bg: theme.colors.primary,
      fg: theme.colors.text,
      focus: effectiveError ? theme.colors.error : theme.colors.primary,
      disabledMixColor: theme.colors.background,
      variant: 'filled',
      border: effectiveError
        ? theme.colors.error
        : makeMix(theme.colors.background, theme.colors.text, 0.4),
    });

    const geom = createSizeMap(theme)[size] ?? createSizeMap(theme).md;

    const controlStyle = {
      ...intentVars,
      '--vt-font': geom.font,
      '--vt-padV': geom.padV,
      '--vt-padH': geom.padH,
      '--vt-minh': geom.minH,
      '--vt-bg': theme.colors.backgroundAlt,
      '--vt-border-w': theme.stroke(1),
      '--vt-radius': theme.radius(1),
      '--vt-hover-border': makeMix(theme.colors.background, theme.colors.text, 0.66),
      '--vt-autofill-text': theme.colors.text,
      '--valet-tf-hit': effectiveCompact ? '24px' : '44px',
      ...(fontFamily ? { fontFamily } : {}),
    } as React.CSSProperties;

    const widthCss = width != null ? (typeof width === 'number' ? `${width}px` : width) : undefined;
    const wrapperStyle = {
      '--vt-gap': theme.spacing(0.5),
      ...(widthCss ? { '--valet-tf-width': widthCss } : {}),
      ...(fullWidth ? { flex: 1 } : {}),
      ...(sxProp as object),
    } as React.CSSProperties;

    /* shared control attributes (both arms) */
    const controlA11y = {
      id: inputId,
      name,
      disabled: effectiveDisabled,
      readOnly: Boolean(ownReadOnly),
      required,
      'aria-invalid': effectiveError || undefined,
      'aria-required': required || undefined,
      'aria-describedby': ariaDescribedBy,
      'aria-errormessage': errorId,
      style: controlStyle,
    };

    const controlledProps = meta.isControlled
      ? { value: current }
      : defaultValue !== undefined
        ? { defaultValue }
        : {};

    let control: React.ReactNode;
    if (as === 'textarea') {
      const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
        const next = e.target.value;
        setValue(next);
        (externalOnChange as ChangeEventHandler<HTMLTextAreaElement> | undefined)?.(e);
        const info: ChangeInfo<string> = {
          previousValue: prevRef.current,
          phase: 'input',
          source: classifyInputSource(e.nativeEvent),
          event: e,
          name,
        };
        onValueChange?.(next, info);
        prevRef.current = next;
      };
      control = (
        <FieldTextarea
          {...(rest as Omit<TextareaProps, 'onChange' | 'value' | 'defaultValue'>)}
          {...controlA11y}
          {...controlledProps}
          ref={ref as React.Ref<HTMLTextAreaElement>}
          onChange={handleChange}
          onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
            callerOnBlur?.(e);
            const value = e.target.value;
            onValueCommit?.(value, {
              previousValue: prevRef.current,
              phase: 'commit',
              source: 'programmatic',
              event: e,
              name,
            });
            prevRef.current = value;
          }}
          onKeyDown={callerOnKeyDown as React.KeyboardEventHandler<HTMLTextAreaElement> | undefined}
        />
      );
    } else {
      const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
        const next = e.target.value;
        setValue(next);
        (externalOnChange as ChangeEventHandler<HTMLInputElement> | undefined)?.(e);
        const info: ChangeInfo<string> = {
          previousValue: prevRef.current,
          phase: 'input',
          source: classifyInputSource(e.nativeEvent),
          event: e,
          name,
        };
        onValueChange?.(next, info);
        prevRef.current = next;
      };
      control = (
        <FieldInput
          {...(rest as Omit<InputProps, 'onChange' | 'value' | 'defaultValue'>)}
          {...controlA11y}
          {...controlledProps}
          ref={ref as React.Ref<HTMLInputElement>}
          onChange={handleChange}
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            callerOnBlur?.(e);
            const value = e.target.value;
            onValueCommit?.(value, {
              previousValue: prevRef.current,
              phase: 'commit',
              source: 'programmatic',
              event: e,
              name,
            });
            prevRef.current = value;
          }}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            callerOnKeyDown?.(e);
            if (e.key === 'Enter') {
              const value = e.currentTarget.value;
              onValueCommit?.(value, {
                previousValue: prevRef.current,
                phase: 'commit',
                source: 'keyboard',
                event: e,
                name,
              });
              prevRef.current = value;
            }
          }}
        />
      );
    }

    return (
      <Wrapper
        data-valet-component='TextField'
        data-state={effectiveError ? 'invalid' : 'valid'}
        data-disabled={effectiveDisabled ? 'true' : 'false'}
        data-readonly={ownReadOnly ? 'true' : 'false'}
        className={[presetName ? preset(presetName) : '', className].filter(Boolean).join(' ')}
        style={wrapperStyle}
      >
        {label != null && (
          <Label
            htmlFor={inputId}
            style={{ color: makeMix(theme.colors.text, theme.colors.background, 0.25) }}
          >
            {label}
            {required && <span aria-hidden> *</span>}
          </Label>
        )}

        {control}

        {errorId ? (
          <Message
            id={errorId}
            role='alert'
            style={{ color: theme.colors.error }}
          >
            {errorMessage}
          </Message>
        ) : (
          helperText != null && (
            <Message
              id={helperId}
              style={{ color: makeMix(theme.colors.text, theme.colors.background, 0.33) }}
            >
              {helperText}
            </Message>
          )
        )}
      </Wrapper>
    );
  },
);

TextField.displayName = 'TextField';

export default TextField;
