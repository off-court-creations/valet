// ─────────────────────────────────────────────────────────────
// src/components/fields/TextField.tsx  | valet
// controlled text input integrating with FormControl; add fontFamily prop
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
import { useOptionalForm } from './FormControl';
import type { Theme } from '../../system/themeStore';
import type { FieldBaseProps } from '../../types';
import type { ChangeInfo, OnValueChange, OnValueCommit } from '../../system/events';

/*───────────────────────────────────────────────────────────────────────────*/
/* Prop contracts                                                            */

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'name' | 'style'>;
type TextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'name' | 'style'>;

export type TextFieldProps =
  | ((FieldBaseProps & {
      /** Override input font */
      fontFamily?: string;
      /** Field name is required for TextField to bind and identify the value. */
      name: string;
      /** DOM-parity change event (raw React event). */
      onChange?: ChangeEventHandler<HTMLInputElement>;
      /** Canonical value change event (fires on each input). */
      onValueChange?: OnValueChange<string>;
      /** Commit event (on Enter or blur). */
      onValueCommit?: OnValueCommit<string>;
    }) &
      InputProps & { as?: 'input' })
  | ((FieldBaseProps & {
      /** Override input font */
      fontFamily?: string;
      /** Field name is required for TextField to bind and identify the value. */
      name: string;
      /** DOM-parity change event (raw React event). */
      onChange?: ChangeEventHandler<HTMLTextAreaElement>;
      /** Canonical value change event (fires on each input). */
      onValueChange?: OnValueChange<string>;
      /** Commit event (on blur). Enter inserts newline for textarea. */
      onValueCommit?: OnValueCommit<string>;
    }) &
      TextareaProps & { as: 'textarea' });

/*───────────────────────────────────────────────────────────────────────────*/
/* Shared styled helpers                                                     */

/* Add string index signature to satisfy styled<...> constraint */
interface StyledFieldProps {
  [key: string]: unknown;
  theme: Theme;
  $error?: boolean;
}

const sharedFieldCSS = ({ theme, $error }: StyledFieldProps) => `
  padding: ${theme.spacing(1)} ${theme.spacing(1)};
  border: ${theme.stroke(1)} solid ${($error ? theme.colors.error : theme.colors.text) + '44'};
  border-radius: ${theme.radius(1)};
  background: ${theme.colors.background};
  color: ${theme.colors.text};
  font-size: 0.875rem;
  width: 100%;
  &:focus-visible {
    outline: var(--valet-focus-width, 2px) solid ${theme.colors.primary};
    outline-offset: var(--valet-focus-offset, 2px);
  }
`;

const FieldInput = styled('input')<StyledFieldProps>`
  ${sharedFieldCSS}
`;

const FieldTextarea = styled('textarea')<StyledFieldProps>`
  ${sharedFieldCSS}
  resize: vertical;
`;

const Wrapper = styled('div')<{ theme: Theme }>`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing(1)};
`;

const Label = styled('label')<{ theme: Theme }>`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.text};
`;

const Helper = styled('span')<{ theme: Theme; $error?: boolean }>`
  font-size: 0.75rem;
  color: ${({ theme, $error }) => ($error ? theme.colors.error : theme.colors.text) + 'AA'};
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
      fullWidth = false,
      fontFamily,
      preset: presetName,
      className,
      sx: sxProp,
      ...rawRest
    } = props;

    // Keys we manage/control
    const { onChange: externalOnChange, value: externalValue, defaultValue, ...rest } = rawRest;

    const generatedId = useId();
    const { theme } = useTheme();
    const prevRef = React.useRef<string | undefined>(
      (props as unknown as { defaultValue?: unknown }).defaultValue as string | undefined,
    );

    /** Optional FormControl wiring */
    const form = useOptionalForm<Record<string, unknown>>();

    const presetClasses = presetName ? preset(presetName) : '';
    const wrapperStyle = fullWidth ? { flex: 1, width: '100%', ...sxProp } : sxProp;

    // Respect a provided id; otherwise use a stable generated one
    const providedId = (rawRest as Record<string, unknown>)?.id as string | undefined;
    const inputId = providedId ?? generatedId;

    // Helper linkage: create an id for helper text when present
    const helperId = helperText ? `${inputId}-help` : undefined;
    const describedByFromProps = (rawRest as Record<string, unknown>)['aria-describedby'] as
      | string
      | undefined;
    const ariaDescribedBy = [describedByFromProps, helperId].filter(Boolean).join(' ') || undefined;

    // Reflect disabled/readOnly on root for theming/automation selectors
    const rawDisabled = Boolean((rawRest as Record<string, unknown>)['disabled']);
    const rawReadOnly = Boolean((rawRest as Record<string, unknown>)['readOnly']);

    // Controlled/uncontrolled guard --------------------------------------
    const initialCtl = React.useRef<boolean | undefined>(undefined);
    const isControlled = externalValue !== undefined || Boolean(form && name);
    React.useEffect(() => {
      if (process.env.NODE_ENV === 'production') return;
      if (initialCtl.current === undefined) initialCtl.current = isControlled;
      else if (initialCtl.current !== isControlled) {
        console.error(
          'TextField: component switched from %s to %s after mount. This is not supported.',
          initialCtl.current ? 'controlled' : 'uncontrolled',
          isControlled ? 'controlled' : 'uncontrolled',
        );
      }
    }, [isControlled]);

    return (
      <Wrapper
        theme={theme}
        data-valet-component='TextField'
        data-state={error ? 'invalid' : 'valid'}
        data-disabled={rawDisabled ? 'true' : 'false'}
        data-readonly={rawReadOnly ? 'true' : 'false'}
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={wrapperStyle}
      >
        {label && (
          <Label
            theme={theme}
            htmlFor={inputId}
          >
            {label}
          </Label>
        )}

        {as === 'textarea'
          ? (() => {
              const onChangeTextarea = externalOnChange as
                | ChangeEventHandler<HTMLTextAreaElement>
                | undefined;

              const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
                if (form && name)
                  form.setField(name as keyof Record<string, unknown>, e.target.value);
                onChangeTextarea?.(e);
                const info: ChangeInfo<string> = {
                  previousValue: prevRef.current,
                  phase: 'input',
                  source:
                    e.nativeEvent instanceof KeyboardEvent
                      ? 'keyboard'
                      : e.nativeEvent instanceof InputEvent &&
                          (e.nativeEvent as InputEvent).inputType?.includes('insertFromPaste')
                        ? 'clipboard'
                        : 'programmatic',
                  event: e,
                  name,
                };
                (props as unknown as { onValueChange?: OnValueChange<string> }).onValueChange?.(
                  e.target.value,
                  info,
                );
                prevRef.current = e.target.value;
              };

              const value = (
                form ? (form.values[name] as TextareaProps['value'] | undefined) : externalValue
              ) as TextareaProps['value'] | undefined;

              return (
                <FieldTextarea
                  id={inputId}
                  name={name}
                  ref={ref as React.Ref<HTMLTextAreaElement>}
                  theme={theme}
                  $error={error}
                  {...(rest as Omit<TextareaProps, 'onChange' | 'value' | 'defaultValue'>)}
                  {...(value !== undefined
                    ? { value }
                    : defaultValue !== undefined
                      ? { defaultValue: defaultValue as TextareaProps['defaultValue'] }
                      : {})}
                  onChange={handleChange}
                  aria-invalid={error || undefined}
                  aria-describedby={ariaDescribedBy}
                  aria-errormessage={error && helperId ? helperId : undefined}
                  style={fontFamily ? { fontFamily } : undefined}
                  onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => {
                    const commitInfo: ChangeInfo<string> = {
                      previousValue: prevRef.current,
                      phase: 'commit',
                      source: 'programmatic',
                      event: e,
                      name,
                    };
                    (props as unknown as { onValueCommit?: OnValueCommit<string> }).onValueCommit?.(
                      (e.target as HTMLTextAreaElement).value,
                      commitInfo,
                    );
                    prevRef.current = (e.target as HTMLTextAreaElement).value;
                  }}
                />
              );
            })()
          : (() => {
              const onChangeInput = externalOnChange as
                | ChangeEventHandler<HTMLInputElement>
                | undefined;

              const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
                if (form && name)
                  form.setField(name as keyof Record<string, unknown>, e.target.value);
                onChangeInput?.(e);
                const info: ChangeInfo<string> = {
                  previousValue: prevRef.current,
                  phase: 'input',
                  source:
                    e.nativeEvent instanceof KeyboardEvent
                      ? 'keyboard'
                      : e.nativeEvent instanceof InputEvent &&
                          (e.nativeEvent as InputEvent).inputType?.includes('insertFromPaste')
                        ? 'clipboard'
                        : 'programmatic',
                  event: e,
                  name,
                };
                (props as unknown as { onValueChange?: OnValueChange<string> }).onValueChange?.(
                  e.target.value,
                  info,
                );
                prevRef.current = e.target.value;
              };

              const value = (
                form ? (form.values[name] as InputProps['value'] | undefined) : externalValue
              ) as InputProps['value'] | undefined;

              return (
                <FieldInput
                  id={inputId}
                  name={name}
                  ref={ref as React.Ref<HTMLInputElement>}
                  theme={theme}
                  $error={error}
                  {...(rest as Omit<InputProps, 'onChange' | 'value' | 'defaultValue'>)}
                  {...(value !== undefined
                    ? { value }
                    : defaultValue !== undefined
                      ? { defaultValue: defaultValue as InputProps['defaultValue'] }
                      : {})}
                  onChange={handleChange}
                  aria-invalid={error || undefined}
                  aria-describedby={ariaDescribedBy}
                  aria-errormessage={error && helperId ? helperId : undefined}
                  style={fontFamily ? { fontFamily } : undefined}
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    const commitInfo: ChangeInfo<string> = {
                      previousValue: prevRef.current,
                      phase: 'commit',
                      source: 'programmatic',
                      event: e,
                      name,
                    };
                    (props as unknown as { onValueCommit?: OnValueCommit<string> }).onValueCommit?.(
                      (e.target as HTMLInputElement).value,
                      commitInfo,
                    );
                    prevRef.current = (e.target as HTMLInputElement).value;
                  }}
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      const value = (e.currentTarget as HTMLInputElement).value;
                      const commitInfo: ChangeInfo<string> = {
                        previousValue: prevRef.current,
                        phase: 'commit',
                        source: 'keyboard',
                        event: e,
                        name,
                      };
                      (
                        props as unknown as { onValueCommit?: OnValueCommit<string> }
                      ).onValueCommit?.(value, commitInfo);
                      prevRef.current = value;
                    }
                  }}
                />
              );
            })()}

        {helperText && (
          <Helper
            id={helperId}
            theme={theme}
            $error={error}
            aria-live='polite'
          >
            {helperText}
          </Helper>
        )}
      </Wrapper>
    );
  },
);

TextField.displayName = 'TextField';

export default TextField;
