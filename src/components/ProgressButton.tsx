// ─────────────────────────────────────────────────────────────
// src/components/ProgressButton.tsx  | valet
// button with built-in progress indicator
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import { Progress } from './Progress';
import { Button, type ButtonProps, type ButtonSize } from './Button';

export interface ProgressButtonProps extends ButtonProps {
  /** Async action executed on click before normal onClick */
  action?: () => Promise<unknown>;
  /** 0-100 value for determinate progress */
  progress?: number;
}

export const ProgressButton: React.FC<ProgressButtonProps> = ({
  action,
  progress,
  children,
  onClick,
  size = 'md',
  disabled,
  ...rest
}) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (progress !== undefined && progress >= 100) setLoading(false);
  }, [progress]);

  const handleClick = async (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
  ) => {
    if (loading) return;
    if (action) {
      e.preventDefault();
      try {
        setLoading(true);
        await action();
      } finally {
        setLoading(false);
        onClick?.(e);
      }
      return;
    }
    const res = onClick?.(e);
    if (res && typeof (res as any).then === 'function') {
      try {
        setLoading(true);
        await res;
      } finally {
        setLoading(false);
      }
    }
  };

  const mode = progress === undefined ? 'indeterminate' : 'determinate';
  const map: Record<ButtonSize, ButtonSize> = { sm: 'sm', md: 'md', lg: 'lg' };

  return (
    <Button
      {...rest}
      size={size}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading ? (
        <Progress
          variant="circular"
          mode={mode}
          value={progress}
          size={map[size]}
          color="currentColor"
        />
      ) : (
        children
      )}
    </Button>
  );
};

export default ProgressButton;
