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
import { useForm } from './FormControl';
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

interface StyledFieldProps {
  theme: Theme;
  $error?: boolean;
}

const sharedFieldCSS = ({ theme, $error }: StyledFieldProps) => `
  padding: ${theme.spacing(1)} ${theme.spacing(1)};
  border: 1px solid ${($error ? theme.colors.secondary : theme.colors.text) + '44'};
  border-radius: 4px;
  background: ${theme.colors.background};
  color: ${theme.colors.text};
  font-size: 0.875rem;
  width: 100%;
  &:focus {
    outline: 2px solid ${theme.colors.primary};
    outline-offset: 1px;
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
  color: ${({ theme, $error }) =>
    ($error ? theme.colors.secondary : theme.colors.text) + 'AA'};
`;

/*───────────────────────────────────────────────────────────────────────────*/
/* Component                                                                 */

export const TextField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  TextFieldProps
>((props, ref) => {
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

  /* Strip props we manage so they don’t duplicate ----------------------- */
  const {
    onChange: externalOnChange,
    value: externalValue,
    defaultValue,
    ...rest
  } = rawRest as any;

  const id = useId();
  const { theme } = useTheme();

  /* Optional FormControl wiring ----------------------------------------- */
  let form: ReturnType<typeof useForm<any>> | null = null;
  try {
    form = useForm<any>();
  } catch {}

  const controlledValue =
    form ? form.values[name] ?? '' : externalValue;

  const setField = form ? form.setField : undefined;

  const handleChange: ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = (e) => {
    setField?.(name as any, e.target.value);
    externalOnChange?.(e); // call user’s handler if provided
  };

  const presetClasses = presetName ? preset(presetName) : '';

  const Element =
    as === 'textarea'
      ? (FieldTextarea as React.ComponentType<
          StyledFieldProps & TextareaProps
        >)
      : (FieldInput as React.ComponentType<StyledFieldProps & InputProps>);

  return (
    <Wrapper
      theme={theme}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      style={fullWidth ? { flex: 1, width: '100%', ...styleProp } : styleProp}
    >
      {label && (
        <Label theme={theme} htmlFor={id}>
          {label}
        </Label>
      )}

      <Element
        id={id}
        name={name}
        ref={ref as any}
        theme={theme}
        $error={error}
        rows={as === 'textarea' ? rows : undefined}
        /* Spread the remaining, de-duplicated props first */
        {...rest}
        /* Then our controlled bits so they win if overlaps exist */
        value={controlledValue}
        defaultValue={defaultValue}
        onChange={handleChange}
        style={fontFamily ? { fontFamily } : undefined}
      />

      {helperText && (
        <Helper theme={theme} $error={error}>
          {helperText}
        </Helper>
      )}
    </Wrapper>
  );
});

TextField.displayName = 'TextField';

export default TextField;
