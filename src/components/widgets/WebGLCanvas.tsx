// ─────────────────────────────────────────────────────────────
// src/components/widgets/WebGLCanvas.tsx  | valet
// WebGL2 canvas wrapper: DPI-aware, resizes to parent, RAF loop
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
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
};

export interface WebGLCanvasProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style' | 'children'>,
    Presettable {
  /** Create a program bound to the provided WebGL2 context and canvas. */
  create: (gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) => WebGLProgramLike | null;
  /** WebGL context attributes. */
  contextAttributes?: WebGLContextAttributes;
  /** Clamp devicePixelRatio to avoid excessive fill-rate on hi-DPI screens. */
  dprMax?: number;
  /** Global time scaling applied to dt and absolute time t. */
  timeScale?: number;
  /** Optional clear color, defaults to transparent. Only sets clearColor, not clearing each frame. */
  clearColor?: readonly [number, number, number, number];
  /** If true, wrapper is absolutely positioned and fills its parent. */
  asBackground?: boolean;
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

/**
 * WebGLCanvas – A small, opinionated WebGL2 canvas host.
 * - Creates a WebGL2 context with provided attributes.
 * - Resizes the canvas to its parent using DPR-aware physical pixels.
 * - Drives a supplied program via requestAnimationFrame.
 * - Disposes cleanly on unmount.
 */
export const WebGLCanvas: React.FC<WebGLCanvasProps> = ({
  create,
  contextAttributes,
  dprMax = 2,
  timeScale = 1,
  clearColor = [0, 0, 0, 0],
  asBackground = false,
  preset: p,
  sx,
  className,
  canvasClassName,
  canvasStyle,
  ...divProps
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Keep latest timeScale without re-subscribing effect.
  const timeScaleRef = useRef(timeScale);
  useEffect(() => {
    timeScaleRef.current = timeScale;
  }, [timeScale]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const attrs = { ...DEFAULT_CTX_ATTRS, ...(contextAttributes ?? {}) };
    const gl = canvas.getContext('webgl2', attrs);
    if (!gl) return;

    gl.clearColor(clearColor[0], clearColor[1], clearColor[2], clearColor[3]);

    const program = create(gl, canvas);
    if (!program) return;

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
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const scale = timeScaleRef.current;
      const dt = Math.min(0.05, (now - lastT) / 1000) * scale;
      lastT = now;
      const t = ((now - t0) / 1000) * scale;
      program.update(dt, t);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (program as any)._setTime?.(t);
      program.render();
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      program.dispose();
    };
  }, [create, dprMax, contextAttributes, clearColor]);

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
    >
      <canvas
        ref={canvasRef}
        className={canvasClassName}
        style={{ display: 'block', width: '100%', height: '100%', ...canvasStyle }}
      />
    </div>
  );
};

export default WebGLCanvas;
