// ─────────────────────────────────────────────────────────────
// src/components/Surface.tsx  | valet
// top-level wrapper that applies theme backgrounds and breakpoints
// ─────────────────────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
} from 'react';
import { Breakpoint, useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';
import {
  createSurfaceStore,
  SurfaceStore,
} from '../system/createSurfaceStore';

/** Surface Context definition */
export type SurfaceContext = SurfaceStore;

const SurfaceCtx = createContext<ReturnType<typeof createSurfaceStore> | null>(null);

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
  const { theme } = useTheme();
  const presetClasses = p ? preset(p) : '';

  const storeRef = useRef<ReturnType<typeof createSurfaceStore>>();
  if (!storeRef.current) storeRef.current = createSurfaceStore();
  const store = storeRef.current;

  /* subscribe to store to trigger rerender when metrics change */
  store();

  const bpFor = (w: number): Breakpoint =>
    (Object.entries(theme.breakpoints) as [Breakpoint, number][]).reduce<Breakpoint>(
      (acc, [key, min]) => (w >= min ? key : acc), 'xs'
    );

  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      store.getState().setSize(
        width,
        height,
        bpFor(width),
        node.scrollHeight > node.clientHeight ||
          node.scrollWidth > node.clientWidth,
      );
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [theme.breakpoints]);

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
        overflow: 'auto',
      }
    : { width: '100%', height: 'auto', position: 'relative' };

  store();

  return (
    <SurfaceCtx.Provider value={store}>
      <div
        ref={ref}
        className={[presetClasses, className].filter(Boolean).join(' ')}
        style={{
          ...layoutStyles, // first apply layout rules
          ...defaults,     // then explicitly apply default colors (critical fix)
          ...cssVars,      // then fonts and other variables
          ...style,        // finally allow external overrides
        }}
        {...props}
      >
        {children}
      </div>
    </SurfaceCtx.Provider>
  );
};

export default Surface;

export const useSurface = () => {
  const store = useContext(SurfaceCtx);
  if (!store)
    throw new Error('useSurface must be used within a <Surface> component');
  return store();
};

export const useSurfaceStore = () => {
  const store = useContext(SurfaceCtx);
  if (!store)
    throw new Error('useSurfaceStore must be used within a <Surface> component');
  return store;
};

export const useMaybeSurfaceStore = () => {
  return useContext(SurfaceCtx);
};
