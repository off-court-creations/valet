// ─────────────────────────────────────────────────────────────
// src/components/ProgressButton.tsx  | valet
// Button variant that swaps content for a spinner while async
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import Button, { type ButtonProps, type ButtonSize } from './Button';
import { Progress, type ProgressSize } from './Progress';

export interface ProgressButtonProps extends ButtonProps {
  /** Optional controlled progress value (0-100). */
  progress?: number;
  /** Spinner size override (defaults to button size). */
  progressSize?: ProgressSize;
  /** Spinner colour override (defaults to theme primary). */
  progressColor?: string;
  /** Async click handler. Returning a Promise shows progress until resolved. */
  onClick?: (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => void | Promise<void>;
}

/*───────────────────────────────────────────────────────────*/
const sizeMap: Record<ButtonSize, ProgressSize> = {
  sm: 'sm',
  md: 'md',
  lg: 'lg',
};

export const ProgressButton: React.FC<ProgressButtonProps> = ({
  progress,
  progressSize,
  progressColor,
  size = 'md',
  children,
  onClick,
  ...rest
}) => {
  const [busy, setBusy] = useState(false);

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = async (e) => {
    if (!onClick) return;
    const result = onClick(e);
    if (result && typeof (result as any).then === 'function') {
      try {
        setBusy(true);
        await result;
      } finally {
        setBusy(false);
      }
    }
  };

  const show = busy || progress !== undefined;
  const mode = progress !== undefined ? 'determinate' : 'indeterminate';
  const pSize = progressSize ?? sizeMap[size];

  return (
    <Button size={size} onClick={handleClick} {...rest}>
      {show ? (
        <Progress
          variant="circular"
          mode={mode}
          value={progress}
          size={pSize}
          color={progressColor}
        />
      ) : (
        children
      )}
    </Button>
  );
};

export default ProgressButton;
