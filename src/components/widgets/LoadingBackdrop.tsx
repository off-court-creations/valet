// ─────────────────────────────────────────────────────────────
// src/components/widgets/LoadingBackdrop.tsx | valet
// simple theme-aware loading overlay
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { useTheme } from '../../system/themeStore';
import { Progress } from '../primitives/Progress';
import { preset } from '../../css/stylePresets';
import type { Presettable, Sx } from '../../types';

export interface LoadingBackdropProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'>,
    Presettable {
  fading?: boolean;
  showSpinner?: boolean;
  /** Inline styles (with CSS var support) */
  sx?: Sx;
}

export const LoadingBackdrop: React.FC<LoadingBackdropProps> = ({
  fading,
  showSpinner,
  className,
  preset: p,
  sx,
  ...rest
}) => {
  const { theme } = useTheme();
  const fadeMs = theme.motion.duration.base;
  const fadeEase = theme.motion.easing.standard;
  const presetCls = p ? preset(p) : '';

  return (
    <div
      {...rest}
      className={[presetCls, className].filter(Boolean).join(' ')}
      data-valet-component='LoadingBackdrop'
      data-state={fading ? 'closed' : 'open'}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `color-mix(in srgb, ${theme.colors.background} 92%, black)`,
        color: theme.colors.text,
        zIndex: 'var(--valet-zindex-modal, 1400)',
        transition: `opacity ${fadeMs} ${fadeEase}`,
        opacity: fading ? 0 : 1,
        pointerEvents: fading ? 'none' : 'auto',
        ...(sx || {}),
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
