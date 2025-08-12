// ─────────────────────────────────────────────────────────────
// src/components/widgets/Stepper.tsx  | valet
// minimal stepper component
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { styled } from '../../css/createStyled';
import { useTheme } from '../../system/themeStore';
import { preset } from '../../css/stylePresets';
import type { Presettable } from '../../types';

/*───────────────────────────────────────────────────────────*/
export interface StepperProps extends React.HTMLAttributes<HTMLDivElement>, Presettable {
  steps: React.ReactNode[];
  active?: number;
}

/*───────────────────────────────────────────────────────────*/
const Root = styled('div')<{ $primary: string }>`
  display: flex;
  gap: 0.5rem;
  counter-reset: step;
`;

const StepItem = styled('div')<{ $active: boolean; $primary: string }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  font-weight: ${({ $active }) => ($active ? 'bold' : 'normal')};
  color: inherit;

  &::before {
    counter-increment: step;
    content: counter(step);
    border: var(--valet-stepper-stroke, 1px) solid ${({ $primary }) => $primary};
    background: ${({ $active, $primary }) => ($active ? $primary : 'transparent')};
    color: ${({ $active }) => ($active ? '#fff' : 'inherit')};
    border-radius: var(--valet-stepper-radius, 9999px);
    width: 1.5rem;
    height: 1.5rem;
    line-height: 1.5rem;
    text-align: center;
  }
`;

/*───────────────────────────────────────────────────────────*/
export const Stepper: React.FC<StepperProps> = ({
  steps,
  active = 0,
  preset: p,
  className,
  style,
  ...rest
}) => {
  const { theme } = useTheme();
  const presetClass = p ? preset(p) : '';
  const primary = theme.colors.primary;

  return (
    <Root
      {...rest}
      $primary={primary}
      className={[presetClass, className].filter(Boolean).join(' ')}
      style={
        {
          '--valet-stepper-stroke': theme.stroke(1),
          '--valet-stepper-radius': theme.radius(999),
          ...(style as object),
        } as React.CSSProperties
      }
    >
      {steps.map((label, idx) => (
        <StepItem
          key={idx}
          $active={idx === active}
          $primary={primary}
        >
          {label}
        </StepItem>
      ))}
    </Root>
  );
};

export default Stepper;
