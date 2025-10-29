// ─────────────────────────────────────────────────────────────
// src/components/widgets/LoadingBackdrop.tsx | valet
// simple theme-aware loading overlay
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { useTheme } from '../../system/themeStore';
import { Progress } from '../primitives/Progress';

export interface LoadingBackdropProps {
  fading?: boolean;
  showSpinner?: boolean;
}

export const LoadingBackdrop: React.FC<LoadingBackdropProps> = ({ fading, showSpinner }) => {
  const { theme } = useTheme();
  const fadeMs = theme.motion.duration.base;
  const fadeEase = theme.motion.easing.standard;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `color-mix(in srgb, ${theme.colors.background} 92%, black)`,
        color: theme.colors.text,
        zIndex: 'var(--valet-z-overlay, 9999)',
        transition: `opacity ${fadeMs} ${fadeEase}`,
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
      }}
      aria-hidden={!!fading}
    >
      <div
        style={{
          transition: `opacity ${fadeMs} ${fadeEase}`,
          opacity: showSpinner ? 1 : 0,
        }}
      >
        <Progress
          variant='circular'
          mode='indeterminate'
          aria-label='Loading'
        />
      </div>
    </div>
  );
};

export default LoadingBackdrop;
