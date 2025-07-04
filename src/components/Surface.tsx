// ─────────────────────────────────────────────────────────────
// src/components/Surface.tsx  | valet
// top-level wrapper that applies theme backgrounds and breakpoints
// ─────────────────────────────────────────────────────────────
import React, { useContext, useEffect, useRef, useState } from 'react';
import { Breakpoint, useTheme } from '../system/themeStore';
import { useFonts } from '../system/fontStore';
import LoadingBackdrop from './LoadingBackdrop';
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
}

export const Surface: React.FC<SurfaceProps> = ({
  children,
  style,
  preset: p,
  className,
  fullscreen = true,
  ...props
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const parent = useContext(SurfaceCtx);
  if (parent) throw new Error('Nested <Surface> components are not allowed');

  const storeRef = useRef<ReturnType<typeof createSurfaceStore>>();
  if (!storeRef.current) storeRef.current = createSurfaceStore();
  const useStore = storeRef.current;
  const { theme } = useTheme();
  const fontsReady = useFonts((s) => s.ready);
  const [showBackdrop, setShowBackdrop] = useState(!fontsReady);
  const [fade, setFade] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const presetClasses = p ? preset(p) : '';

  const { width, height, hasScrollbar } = useStore((s) => ({
    width: s.width,
    height: s.height,
    hasScrollbar: s.hasScrollbar,
  }));

  const bpFor = (w: number): Breakpoint =>
    (Object.entries(theme.breakpoints) as [Breakpoint, number][]).reduce<Breakpoint>(
      (acc, [key, min]) => (w >= min ? key : acc), 'xs'
    );

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    useStore.setState((s) => ({ ...s, element: node }));
    const measure = () => {
      const rect = node.getBoundingClientRect();
      const vOverflow = node.scrollHeight - node.clientHeight;
      const hOverflow = node.scrollWidth - node.clientWidth;
      useStore.setState((s) => ({
        ...s,
        width: rect.width,
        height: Math.round(rect.height),
        hasScrollbar: vOverflow > 3 || hOverflow > 3,
        breakpoint: bpFor(rect.width),
      }));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(node);
    measure();
    return () => ro.disconnect();
  }, [theme.breakpoints, useStore]);

  useEffect(() => {
    if (!fontsReady) {
      setShowBackdrop(true);
      setFade(false);
      setShowSpinner(false);
      return;
    }
    setFade(true);
    const t = setTimeout(() => setShowBackdrop(false), 200);
    setShowSpinner(false);
    return () => clearTimeout(t);
  }, [fontsReady]);

  useEffect(() => {
    if (fontsReady) {
      setShowSpinner(false);
      return;
    }
    const t = setTimeout(() => {
      if (!useFonts.getState().ready) setShowSpinner(true);
    }, 1250);
    return () => clearTimeout(t);
  }, [fontsReady]);

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
        overflow: hasScrollbar ? 'auto' : 'hidden',
      }
    : { width: '100%', height: 'auto', position: 'relative' };
  const gap = theme.spacing(1);

  return (
    <SurfaceCtx.Provider value={useStore}>
      <div
        ref={ref}
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={{
          ...layoutStyles, // first apply layout rules
          ...defaults,     // then explicitly apply default colors (critical fix)
          ...cssVars,      // then fonts and other variables
          '--valet-screen-width': `${width}px`,
          '--valet-screen-height': `${Math.round(height)}px`,
          ...style,        // finally allow external overrides
        } as any}
        {...props}
      >
        {showBackdrop && (
          <LoadingBackdrop fading={fade} showSpinner={showSpinner} />
        )}
        <div style={{ visibility: fontsReady ? 'visible' : 'hidden', padding: gap }}>{children}</div>
      </div>
    </SurfaceCtx.Provider>
  );
};

export default Surface;

export { useSurfaceState as useSurface };
