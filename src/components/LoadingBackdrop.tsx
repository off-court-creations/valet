// ─────────────────────────────────────────────────────────────
// src/components/LoadingBackdrop.tsx | valet
// simple theme-aware loading overlay
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { useTheme } from '../system/themeStore';
import { Progress } from './Progress';

export const LoadingBackdrop: React.FC = () => {
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
      }}
    >
      <Progress variant="circular" mode="indeterminate" />
    </div>
  );
};

export default LoadingBackdrop;
