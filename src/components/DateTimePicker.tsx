// ─────────────────────────────────────────────────────────────
// src/components/DateTimePicker.tsx | valet
// accessible date/time picker with optional FormControl binding
// ─────────────────────────────────────────────────────────────
import React, {
  forwardRef,
  useId,
  useState,
  InputHTMLAttributes,
  ChangeEventHandler,
} from 'react';
import { styled } from '../css/createStyled';
import { useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import { useForm } from './FormControl';
import type { Theme } from '../system/themeStore';
import type { Presettable } from '../types';

/*───────────────────────────────────────────────────────────*/
/* Props                                                      */
export interface DateTimePickerProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type' | 'value' | 'defaultValue'>,
    Presettable {
  /** Controlled ISO value */
  value?: string;
  /** Uncontrolled default ISO value */
  defaultValue?: string;
  /** Fired whenever value changes */
  onChange?: (value: string) => void;
  /** Mode of the picker */
  mode?: 'date' | 'time' | 'datetime';
  /** Field name for FormControl binding */
  name?: string;
  /** Optional label */
  label?: string;
  /** Helper text beneath the field */
  helperText?: string;
  /** Error state styling */
  error?: boolean;
}

/*───────────────────────────────────────────────────────────*/
/* Styled primitives                                         */
interface StyledFieldProps { theme: Theme; $error?: boolean; }

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

const Input = styled('input')<StyledFieldProps>`
  ${sharedFieldCSS}
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

/*───────────────────────────────────────────────────────────*/
/* Component                                                 */
export const DateTimePicker = forwardRef<HTMLInputElement, DateTimePickerProps>(
  (props, ref) => {
    const {
      mode = 'date',
      name,
      label,
      helperText,
      error = false,
      preset: presetName,
      className,
      onChange: userChange,
      value: valueProp,
      defaultValue = '',
      ...rest
    } = props;

    const id = useId();
    const { theme } = useTheme();

    /* optional FormControl binding */
    let form: ReturnType<typeof useForm<any>> | null = null;
    try { form = useForm<any>(); } catch {}

    const formVal = form && name ? form.values[name] : undefined;
    const controlled = formVal !== undefined || valueProp !== undefined;

    const [self, setSelf] = useState(defaultValue);
    const current = controlled ? (formVal !== undefined ? formVal : valueProp!) : self;

    const handleChange: ChangeEventHandler<HTMLInputElement> = (e) => {
      const v = e.target.value;
      if (!controlled) setSelf(v);
      form?.setField(name as any, v);
      userChange?.(v);
    };

    const presetCls = presetName ? preset(presetName) : '';
    const inputType = mode === 'datetime' ? 'datetime-local' : mode;

    return (
      <Wrapper theme={theme} className={[presetCls, className].filter(Boolean).join(' ')}>
        {label && (
          <Label theme={theme} htmlFor={id}>
            {label}
          </Label>
        )}
        <Input
          {...rest}
          id={id}
          ref={ref}
          name={name}
          type={inputType}
          theme={theme}
          $error={error}
          value={current}
          onChange={handleChange}
        />
        {helperText && (
          <Helper theme={theme} $error={error}>
            {helperText}
          </Helper>
        )}
      </Wrapper>
    );
  }
);

DateTimePicker.displayName = 'DateTimePicker';

export default DateTimePicker;
