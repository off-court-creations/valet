// ─────────────────────────────────────────────────────────────
// src/components/widgets/LoadingBackdrop.tsx | valet
// simple theme-aware loading overlay
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { useTheme } from '../../system/themeStore';
import { Progress } from './Progress';

export interface LoadingBackdropProps {
  fading?: boolean;
  showSpinner?: boolean;
}

export const LoadingBackdrop: React.FC<LoadingBackdropProps> = ({
  fading,
  showSpinner,
}) => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: theme.colors.background,
        color: theme.colors.text,
        zIndex: 9999,
        transition: 'opacity 200ms ease',
        opacity: fading ? 0 : 1,
      }}
    >
      <div
        style={{
          transition: 'opacity 200ms ease',
          opacity: showSpinner ? 1 : 0,
        }}
      >
        <Progress variant="circular" mode="indeterminate" />
      </div>
    </div>
  );
};

export default LoadingBackdrop;
