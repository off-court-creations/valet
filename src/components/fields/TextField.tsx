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
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────────────────────*/
/* Prop contracts                                                            */

type InputProps = InputHTMLAttributes<HTMLInputElement>;
type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

interface FieldCommon extends Presettable {
  name: string;
  label?: string;
  helperText?: string;
  error?: boolean;
  /** Stretch the wrapper to fill available width */
  fullWidth?: boolean;
  /** Override input font */
  fontFamily?: string;
}

export type TextFieldProps =
  | (FieldCommon & InputProps & { as?: 'input'; rows?: never })
  | (FieldCommon & TextareaProps & { as: 'textarea' });

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
  border: ${theme.stroke(1)} solid ${($error ? theme.colors.secondary : theme.colors.text) + '44'};
  border-radius: ${theme.radius(1)};
  background: ${theme.colors.background};
  color: ${theme.colors.text};
  font-size: 0.875rem;
  width: 100%;
  &:focus {
    outline: ${theme.stroke(2)} solid ${theme.colors.primary};
    outline-offset: ${theme.stroke(1)};
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
  color: ${({ theme, $error }) => ($error ? theme.colors.secondary : theme.colors.text) + 'AA'};
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
      rows,
      style: styleProp,
      ...rawRest
    } = props;

    // Keys we manage/control
    const { onChange: externalOnChange, value: externalValue, defaultValue, ...rest } = rawRest;

    const id = useId();
    const { theme } = useTheme();

    /** Optional FormControl wiring */
    const form = useOptionalForm<Record<string, unknown>>();

    const presetClasses = presetName ? preset(presetName) : '';
    const wrapperStyle = fullWidth ? { flex: 1, width: '100%', ...styleProp } : styleProp;

    return (
      <Wrapper
        theme={theme}
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={wrapperStyle}
      >
        {label && (
          <Label
            theme={theme}
            htmlFor={id}
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
              };

              const value = (
                form ? (form.values[name] as TextareaProps['value'] | undefined) : externalValue
              ) as TextareaProps['value'] | undefined;

              return (
                <FieldTextarea
                  id={id}
                  name={name}
                  ref={ref as React.Ref<HTMLTextAreaElement>}
                  theme={theme}
                  $error={error}
                  rows={rows}
                  {...(rest as Omit<TextareaProps, 'onChange' | 'value' | 'defaultValue'>)}
                  value={value}
                  defaultValue={defaultValue as TextareaProps['defaultValue']}
                  onChange={handleChange}
                  style={fontFamily ? { fontFamily } : undefined}
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
              };

              const value = (
                form ? (form.values[name] as InputProps['value'] | undefined) : externalValue
              ) as InputProps['value'] | undefined;

              return (
                <FieldInput
                  id={id}
                  name={name}
                  ref={ref as React.Ref<HTMLInputElement>}
                  theme={theme}
                  $error={error}
                  {...(rest as Omit<InputProps, 'onChange' | 'value' | 'defaultValue'>)}
                  value={value}
                  defaultValue={defaultValue as InputProps['defaultValue']}
                  onChange={handleChange}
                  style={fontFamily ? { fontFamily } : undefined}
                />
              );
            })()}

        {helperText && (
          <Helper
            theme={theme}
            $error={error}
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
