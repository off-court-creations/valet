// ─────────────────────────────────────────────────────────────
// src/components/Surface.tsx  | valet
// top-level wrapper that applies theme backgrounds and breakpoints
// ─────────────────────────────────────────────────────────────
import React, { useContext, useEffect, useRef } from 'react';
import { Breakpoint, useTheme } from '../system/themeStore';
import {
  createSurfaceStore,
  SurfaceCtx,
  useSurface as useSurfaceState,
} from '../system/surfaceStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/** Surface Props definition */
export interface SurfaceProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Presettable {
  fullscreen?: boolean;
  scrollBox?: boolean;
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  style,
  preset: p,
  className,
  fullscreen = true,
  scrollBox = false,
  ...props
}) => {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const parent = useContext(SurfaceCtx);
  if (parent) throw new Error('Nested <Surface> components are not allowed');

  const storeRef = useRef<ReturnType<typeof createSurfaceStore>>();
  if (!storeRef.current) storeRef.current = createSurfaceStore();
  const useStore = storeRef.current;
  const { theme } = useTheme();
  const presetClasses = p ? preset(p) : '';

  const { width, height } = useStore((s) => ({ width: s.width, height: s.height }));

  const bpFor = (w: number): Breakpoint =>
    (Object.entries(theme.breakpoints) as [Breakpoint, number][]).reduce<Breakpoint>(
      (acc, [key, min]) => (w >= min ? key : acc), 'xs'
    );

  useEffect(() => {
    const outer = outerRef.current;
    const inner = scrollBox ? innerRef.current : outerRef.current;
    if (!outer || !inner) return;
    useStore.setState((s) => ({ ...s, element: inner }));
    const measure = () => {
      const rect = outer.getBoundingClientRect();
      useStore.setState((s) => ({
        ...s,
        width: rect.width,
        height: rect.height,
        hasScrollbar:
          inner.scrollHeight > inner.clientHeight ||
          inner.scrollWidth > inner.clientWidth,
        breakpoint: bpFor(rect.width),
      }));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    measure();
    return () => ro.disconnect();
  }, [theme.breakpoints, useStore, scrollBox]);

  /* Restore defaults explicitly (critical fix) */
  const defaults: React.CSSProperties = {
    background: theme.colors.background, // ← FIXED explicitly
    color: theme.colors.text,            // ← FIXED explicitly
  };

  /* Fonts and other CSS Variables (fully preserved) */
  const cssVars: React.CSSProperties = {
    '--valet-bg': theme.colors.background,
    '--valet-text-color': theme.colors.text,
    '--valet-font-heading': theme.fonts.heading,
    '--valet-font-body': theme.fonts.body,
    '--valet-font-mono': theme.fonts.mono,
  } as any;

  const layoutStyles: React.CSSProperties = fullscreen
    ? {
        position: 'fixed',
        inset: 0,
        paddingTop: 'env(safe-area-inset-top)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        overflow: scrollBox ? 'hidden' : 'auto',
      }
    : { width: '100%', height: 'auto', position: 'relative', overflow: scrollBox ? 'hidden' : undefined };

  return (
    <SurfaceCtx.Provider value={useStore}>
      <div
        ref={outerRef}
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={{
          ...layoutStyles, // first apply layout rules
          ...defaults,     // then explicitly apply default colors (critical fix)
          ...cssVars,      // then fonts and other variables
          '--valet-screen-width': `${width}px`,
          '--valet-screen-height': `${height}px`,
          ...style,        // finally allow external overrides
        } as any}
        {...props}
      >
        {scrollBox ? (
          <div
            ref={innerRef}
            style={{ width: '100%', height: '100%', overflow: 'auto' }}
          >
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </SurfaceCtx.Provider>
  );
};

export default Surface;

export { useSurfaceState as useSurface };
