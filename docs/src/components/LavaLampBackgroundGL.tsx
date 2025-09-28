// ─────────────────────────────────────────────────────────────
// src/components/LavaLampBackgroundGL.tsx  | valet-docs
// Hero background – WebGL2 full‑screen lava lamp metaballs
// Splits generic WebGL canvas orchestration from lava-lamp program logic.
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';
import { createLavaLampProgram, type GLProgram } from '../shaders/lava-lamp/LavaLampProgram';
import { LavaLampParams } from '../shaders/lava-lamp/lavaLampParams';

type Props = {
  style?: React.CSSProperties;
  className?: string;
};

export default function LavaLampBackgroundGL({ style, className }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: true,
      preserveDrawingBuffer: false,
    });
    if (!gl) return; // WebGL2 unavailable → no background
    // Ensure transparent clear for compositing with page background
    gl.clearColor(0, 0, 0, 0);

    const program: GLProgram | null = createLavaLampProgram(gl, canvas);
    if (!program) return;

    const dprMax = LavaLampParams.runtime.dprMax;
    const dpr = Math.min(window.devicePixelRatio || 1, dprMax);
    const resize = () => {
      const w = wrap.clientWidth | 0;
      const h = wrap.clientHeight | 0;
      if (w === 0 || h === 0) return;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
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
    const start = lastT;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const now = performance.now();
      const TIME_SCALE = LavaLampParams.runtime.timeScale;
      const dt = Math.min(0.05, (now - lastT) / 1000) * TIME_SCALE;
      lastT = now;
      const t = ((now - start) / 1000) * TIME_SCALE;
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
  }, []);

  return (
    <div
      ref={wrapRef}
      className={className}
      aria-hidden
      style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', ...style }}
    >
      <canvas
        ref={canvasRef}
        style={{ display: 'block', width: '100%', height: '100%' }}
      />
    </div>
  );
}
