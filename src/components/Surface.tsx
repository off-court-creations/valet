// ─────────────────────────────────────────────────────────────
// src/components/Surface.tsx  | valet
// top-level wrapper that applies theme backgrounds and breakpoints
// ─────────────────────────────────────────────────────────────
import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from 'react';
import type { StoreApi, UseBoundStore } from 'zustand';
import { create } from 'zustand';
import { Breakpoint, useTheme } from '../system/themeStore';
import { preset } from '../css/stylePresets';
import type { Presettable } from '../types';

/** Surface store shape */
export interface SurfaceState {
  width: number;
  height: number;
  breakpoint: Breakpoint;
  hasScrollbar: boolean;
  children: Record<string, { width: number; height: number }>;
  registerChild: (id: string, size: { width: number; height: number }) => void;
  updateChild: (id: string, size: { width: number; height: number }) => void;
  unregisterChild: (id: string) => void;
}

const SurfaceCtx = createContext<UseBoundStore<StoreApi<SurfaceState>> | null>(null);

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
  if (parent) throw new Error('<Surface> cannot be nested');

  const { theme } = useTheme();
  const presetClasses = p ? preset(p) : '';

  /* Zustand store per Surface */
  const storeRef = useRef<UseBoundStore<StoreApi<SurfaceState>>>();
  if (!storeRef.current) {
    storeRef.current = create<SurfaceState>((set) => ({
      width: 0,
      height: 0,
      breakpoint: 'xs',
      hasScrollbar: false,
      children: {},
      registerChild: (id, size) =>
        set((s) => ({ children: { ...s.children, [id]: size } })),
      updateChild: (id, size) =>
        set((s) => ({ children: { ...s.children, [id]: size } })),
      unregisterChild: (id) =>
        set((s) => {
          const { [id]: _omit, ...rest } = s.children;
          return { children: rest };
        }),
    }));
  }
  const store = storeRef.current;

  const width = store((s) => s.width);
  const height = store((s) => s.height);
  const breakpoint = store((s) => s.breakpoint);
  const hasScrollbar = store((s) => s.hasScrollbar);

  const bpFor = (w: number): Breakpoint =>
    (Object.entries(theme.breakpoints) as [Breakpoint, number][]).reduce<Breakpoint>(
      (acc, [key, min]) => (w >= min ? key : acc),
      'xs'
    );

  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;

    const ro = new ResizeObserver(([entry]) => {
      const { width: w, height: h } = entry.contentRect;
      store.setState({
        width: w,
        height: h,
        hasScrollbar:
          node.scrollHeight > node.clientHeight ||
          node.scrollWidth > node.clientWidth,
        breakpoint: bpFor(w),
      });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, [theme.breakpoints, store]);

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
    '--valet-screen-width': `${width}px`,
    '--valet-screen-height': `${height}px`,
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
  const ctx = useContext(SurfaceCtx);
  if (!ctx)
    throw new Error('useSurface must be used within a <Surface> component');
  return ctx;
};
