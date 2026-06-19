// ─────────────────────────────────────────────────────────────
// src/components/primitives/WebGLCanvas.tsx  | valet
// WebGL2 canvas wrapper: DPI-aware, resizes to parent, RAF loop
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef, useState } from 'react';
import { preset } from '../../css/stylePresets';
import type { Presettable, Sx } from '../../types';

/** Minimal API a GL program should implement to be driven by WebGLCanvas. */
export type WebGLProgramLike = {
  /** Handle canvas resize in physical pixels and current DPR. */
  resize: (width: number, height: number, dpr: number) => void;
  /** Advance internal state by `dt` seconds at absolute time `t` seconds. */
  update: (dt: number, t: number) => void;
  /** Issue draw calls for the current frame. */
  render: () => void;
  /** Free any GL resources and event handlers. */
  dispose: () => void;
  /**
   * Optional: receive the absolute time `t` (seconds) each frame, in addition
   * to `update(dt, t)`. Convenience for programs that upload a `uTime` uniform
   * outside their physics step.
   */
  setTime?: (t: number) => void;
};

export interface WebGLCanvasProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'children'>,
    Presettable {
  /**
   * Create a program bound to the provided WebGL2 context and canvas. Called
   * ONCE when the context is acquired; its identity is ref-latched, so an inline
   * arrow does NOT rebuild the program on parent re-render. To force a rebuild,
   * change the element `key`. Return `null` to signal a build failure (routes to
   * `onError` / `fallback`).
   */
  create: (gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) => WebGLProgramLike | null;
  /** WebGL context attributes. Read ONCE at context creation (ref-latched). */
  contextAttributes?: WebGLContextAttributes;
  /** Clamp devicePixelRatio to avoid excessive fill-rate on hi-DPI screens. */
  dprMax?: number;
  /** Global time scaling applied to dt and absolute time t. */
  timeScale?: number;
  /** Optional clear color, defaults to transparent. Only sets clearColor, not clearing each frame. */
  clearColor?: readonly [number, number, number, number];
  /** If true, wrapper is absolutely positioned and fills its parent. */
  asBackground?: boolean;
  /**
   * Called if the WebGL2 context cannot be created (unsupported) or `create()`
   * returns null. The canvas otherwise dead-ends blank with no signal.
   */
  onError?: (err: unknown) => void;
  /** Rendered in place of the canvas when initialization fails (see `onError`). */
  fallback?: React.ReactNode;
  /** Inline styles for the wrapper (supports CSS variables via Sx). */
  sx?: Sx;
  /** Optional className for the inner canvas element. */
  canvasClassName?: string;
  /** Optional canvas style override. */
  canvasStyle?: React.CSSProperties;
}

const DEFAULT_CTX_ATTRS: WebGLContextAttributes = {
  antialias: false,
  alpha: true,
  preserveDrawingBuffer: false,
};

/* Stable default — an inline `[0, 0, 0, 0]` default would be a fresh
   array every render and (as an effect dep) tear down the GL program
   on every parent re-render. */
const DEFAULT_CLEAR_COLOR: readonly [number, number, number, number] = [0, 0, 0, 0];

/**
 * WebGLCanvas – A small, opinionated WebGL2 canvas host.
 * - Creates a WebGL2 context with provided attributes.
 * - Resizes the canvas to its parent using DPR-aware physical pixels.
 * - Drives a supplied program via requestAnimationFrame.
 * - Disposes cleanly on unmount (including an explicit context release).
 */
export const WebGLCanvas: React.FC<WebGLCanvasProps> = ({
  create,
  contextAttributes,
  dprMax = 2,
  timeScale = 1,
  clearColor = DEFAULT_CLEAR_COLOR,
  asBackground = false,
  onError,
  fallback,
  preset: p,
  sx,
  className,
  canvasClassName,
  canvasStyle,
  ...divProps
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [failed, setFailed] = useState(false);

  // Ref-latch the props the main effect must NOT re-subscribe on. `create` and
  // `contextAttributes` are read ONCE at context creation; an inline arrow/object
  // (a fresh identity every render) must not tear down + rebuild the GL pipeline
  // — the same identity-stability treatment already applied to timeScale/clearColor.
  const createRef = useRef(create);
  const ctxAttrsRef = useRef(contextAttributes);
  const onErrorRef = useRef(onError);
  const timeScaleRef = useRef(timeScale);
  useEffect(() => {
    createRef.current = create;
    ctxAttrsRef.current = contextAttributes;
    onErrorRef.current = onError;
    timeScaleRef.current = timeScale;
  });

  // The live context is held in a ref so colour changes apply in place.
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const [clearR, clearG, clearB, clearA] = clearColor;
  const clearColorRef = useRef<readonly [number, number, number, number]>(clearColor);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const attrs = { ...DEFAULT_CTX_ATTRS, ...(ctxAttrsRef.current ?? {}) };
    const gl = canvas.getContext('webgl2', attrs);
    if (!gl) {
      setFailed(true);
      onErrorRef.current?.(new Error('WebGLCanvas: WebGL2 is not supported in this browser.'));
      return;
    }

    const [r, g, b, a] = clearColorRef.current;
    gl.clearColor(r, g, b, a);

    const program = createRef.current(gl, canvas);
    if (!program) {
      // Surface the failure instead of dead-ending blank. We deliberately do NOT
      // loseContext() here (see the teardown note): getContext() on this canvas
      // returns the SAME context, so force-losing it would poison a remount/retry.
      setFailed(true);
      onErrorRef.current?.(
        new Error('WebGLCanvas: create() returned null (program build failed).'),
      );
      return;
    }
    // Publish the context only after a successful program build, so a failed
    // init never leaves glRef pointing at a live, undisposed context.
    glRef.current = gl;
    setFailed(false);

    const getDpr = () =>
      Math.min(typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1, dprMax);

    const resize = () => {
      const w = wrap.clientWidth | 0;
      const h = wrap.clientHeight | 0;
      if (w === 0 || h === 0) return;
      const dpr = getDpr();
      const pw = Math.max(1, Math.floor(w * dpr));
      const ph = Math.max(1, Math.floor(h * dpr));
      if (canvas.width !== pw) canvas.width = pw;
      if (canvas.height !== ph) canvas.height = ph;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
      program.resize(canvas.width, canvas.height, dpr);
    };

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    let raf = 0;
    let lastT = performance.now();
    const t0 = lastT;

    const loop = () => {
      // Stop driving the program against a dead context (driver reset / GPU loss).
      if (gl.isContextLost()) return;
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const scale = timeScaleRef.current;
      const dt = Math.min(0.05, (now - lastT) / 1000) * scale;
      lastT = now;
      const t = ((now - t0) / 1000) * scale;
      program.update(dt, t);
      program.setTime?.(t);
      program.render();
    };

    // Minimal context-loss handling: cancel the default (which would otherwise
    // make the context unrecoverable) and stop the loop. Full rebuild-on-restore
    // is deferred — the loop's isContextLost guard already prevents dead draws.
    const onContextLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
    };
    canvas.addEventListener('webglcontextlost', onContextLost);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      ro.disconnect();
      program.dispose();
      // NOTE: intentionally NO WEBGL_lose_context.loseContext() here. React reuses
      // the same <canvas> DOM node across StrictMode's dev double-invoke (and any
      // effect re-run), and getContext() returns the SAME context — force-losing
      // it poisons the next mount (shaders then compile against a dead context).
      // program.dispose() frees the program-owned GPU resources; the context
      // itself is reclaimed when the <canvas> is removed and GC'd.
      glRef.current = null;
    };
  }, [dprMax]);

  /* Apply clearColor changes in place (component scalars as deps), so a
     fresh array identity never rebuilds the GL program. Declared after
     the main effect so the context exists on mount. */
  useEffect(() => {
    clearColorRef.current = [clearR, clearG, clearB, clearA];
    glRef.current?.clearColor(clearR, clearG, clearB, clearA);
  }, [clearR, clearG, clearB, clearA]);

  const presetClasses = p ? preset(p) : '';

  return (
    <div
      ref={wrapRef}
      className={[presetClasses, className].filter(Boolean).join(' ')}
      aria-hidden
      style={{
        position: asBackground ? 'absolute' : undefined,
        inset: asBackground ? 0 : undefined,
        zIndex: asBackground ? 0 : undefined,
        pointerEvents: asBackground ? 'none' : undefined,
        ...sx,
      }}
      {...divProps}
      data-valet-component='WebGLCanvas'
    >
      {failed && fallback != null ? (
        fallback
      ) : (
        <canvas
          ref={canvasRef}
          className={canvasClassName}
          style={{ display: 'block', width: '100%', height: '100%', ...canvasStyle }}
        />
      )}
    </div>
  );
};

export default WebGLCanvas;
