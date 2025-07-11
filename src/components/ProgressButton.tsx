// ─────────────────────────────────────────────────────────────
// src/components/ProgressButton.tsx  | valet
// button with built-in progress indicator
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useState } from 'react';
import Button, { type ButtonProps, ButtonSize } from './Button';
import { Progress, type ProgressMode, type ProgressSize } from './Progress';

export interface ProgressButtonProps extends ButtonProps {
  loading?: boolean;
  mode?: ProgressMode;
  value?: number;
}

export const ProgressButton: React.FC<ProgressButtonProps> = ({
  loading: loadingProp,
  mode = 'indeterminate',
  value = 0,
  size = 'md',
  onClick,
  children,
  disabled,
  ...rest
}) => {
  const [internal, setInternal] = useState(false);
  const controlled = loadingProp !== undefined;
  const loading = controlled ? loadingProp : internal;

  useEffect(() => {
    if (controlled) setInternal(!!loadingProp);
  }, [loadingProp, controlled]);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const res = onClick?.(e);
    if (res && typeof (res as any).then === 'function') {
      if (!controlled) setInternal(true);
      try {
        await res;
      } finally {
        if (!controlled) setInternal(false);
      }
    }
  };

  const progressSize: ProgressSize = size as ProgressSize;

  return (
    <Button
      {...rest}
      size={size as ButtonSize}
      onClick={handleClick}
      disabled={loading || disabled}
    >
      {loading ? (
        <Progress variant="circular" mode={mode} value={value} size={progressSize} />
      ) : (
        children
      )}
    </Button>
  );
};

export default ProgressButton;
