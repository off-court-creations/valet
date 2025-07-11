// ─────────────────────────────────────────────────────────────
// src/components/ProgressButton.tsx | valet
// Button with built-in loading state via <Progress/>
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import Button, { type ButtonProps, type ButtonSize } from './Button';
import { Progress } from './Progress';
import type { ProgressMode, ProgressSize } from './Progress';

export interface ProgressButtonProps extends ButtonProps {
  /** Controlled loading state. If undefined, state is derived from async onClick */
  loading?: boolean;
  /** Progress mode; defaults to "indeterminate" */
  progressMode?: ProgressMode;
  /** Progress value for determinate mode */
  value?: number;
  /** Explicit progress size override */
  progressSize?: ProgressSize;
}

const sizeMap: Record<ButtonSize, ProgressSize> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

export const ProgressButton: React.FC<ProgressButtonProps> = ({
  loading,
  progressMode = 'indeterminate',
  value = 0,
  progressSize,
  onClick,
  size = 'md',
  disabled,
  children,
  ...rest
}) => {
  const [selfLoading, setSelfLoading] = useState(false);

  const isLoading = loading ?? selfLoading;

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    const result = onClick?.(e);
    if (loading === undefined && result && typeof (result as any).then === 'function') {
      setSelfLoading(true);
      (result as Promise<unknown>).finally(() => setSelfLoading(false));
    }
  };

  const pSize = progressSize ?? sizeMap[size];

  return (
    <Button
      {...rest}
      size={size}
      disabled={disabled || isLoading}
      onClick={handleClick}
    >
      {isLoading ? (
        <Progress
          variant="circular"
          mode={progressMode}
          value={value}
          size={pSize}
          color="currentColor"
        />
      ) : (
        children
      )}
    </Button>
  );
};

export default ProgressButton;
