// ─────────────────────────────────────────────────────────────
// src/components/Starfield.tsx  | valet-docs
// High‑performance hyperspace starfield (light‑speed effect)
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { styled, useTheme } from '@archway/valet';

type StarfieldProps = {
  /** Approx star density per megapixel */
  density?: number;
  /** Base speed in pixels per second at mid‑depth */
  speed?: number;
  /** 0..1, higher = longer streaks */
  streak?: number;
  /** Optional tint; defaults adapt to theme */
  color?: string;
  /** Opacity of the whole layer */
  opacity?: number;
  /** If true, reduces motion significantly */
  reduceMotion?: boolean;
  /** Center transparency radius start (0..0.5 of min dimension) */
  centerZero?: number;
  /** Radius where mask reaches full opacity (>= centerZero) */
  centerFull?: number;
  /** Opacity at mid ring (0..1), controls visibility away from center */
  midOpacity?: number;
  /** Opacity at outer edge (0..1), keeps edges subtle */
  outerOpacity?: number;
  /** Anchor an element’s visual center as the warp origin */
  anchorRef?: RefObject<HTMLElement | null>;
  /** If true and anchorRef provided, hide until anchor measured */
  holdUntilAnchor?: boolean;
  /** Delay before first render (ms), then fade in */
  startDelayMs?: number;
  /** Fade-in duration (ms) for canvas opacity */
  fadeMs?: number;
  /** Simulation speed multiplier while hidden (pre-spread) */
  preSimBoost?: number;
  /** Fraction of min(width,height) used as inner radius for spread check (0..0.5) */
  revealRadiusFrac?: number;
  /** Minimum fraction of stars that must be beyond inner radius to reveal (0..1) */
  minRevealSpreadRatio?: number;
  /** Minimum spawn radius (as fraction of min dimension) while hidden */
  hiddenSpawnMinRadiusFrac?: number;
};

const Layer = styled('div')`
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
`;

/**
 * Hyperspace starfield using a single Canvas2D layer.
 * - DevicePixelRatio aware
 * - Recycles particles; avoids allocations in render loop
 * - Respects prefers-reduced-motion (via prop)
 */
export default function Starfield({
  density = 130, // stars per megapixel
  speed = 160, // px/sec base (very slow)
  streak = 0.65,
  color,
  opacity = 0.6,
  reduceMotion,
  centerZero = 0.1,
  centerFull = 0.58,
  midOpacity = 0.4,
  outerOpacity = 0.18,
  anchorRef,
  holdUntilAnchor,
  startDelayMs = 1000,
  fadeMs = 450,
  preSimBoost = 12.0,
  revealRadiusFrac = 0.42,
  minRevealSpreadRatio = 0.6,
  hiddenSpawnMinRadiusFrac,
}: StarfieldProps) {
  const { mode } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const stopRef = useRef(false);
  const [isReady, setIsReady] = useState<boolean>(() => !anchorRef);
  const [visible, setVisible] = useState<boolean>(false);
  const readyAtRef = useRef<number | null>(null);

  // Choose default color by theme
  const strokeStyle = useMemo(() => {
    if (color) return color;
    return mode === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
  }, [mode, color]);

  // Auto-detect prefers-reduced-motion if prop not provided
  const reduce = useMemo(() => {
    if (typeof reduceMotion === 'boolean') return reduceMotion;
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, [reduceMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const C = canvas as HTMLCanvasElement;
    const CTX = ctx as CanvasRenderingContext2D;

    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    let width = 0;
    let height = 0;
    let centerX = 0;
    let centerY = 0;
    let maskGradient: CanvasGradient | null = null;

    type Star = {
      x: number; // screen x
      y: number; // screen y
      z: number; // depth 0..1 (near→far)
      vx: number; // normalized velocity vector x
      vy: number; // normalized velocity vector y
      sp: number; // speed multiplier per star
      len: number; // streak factor per star
      hue: number; // slight hue tilt (for chroma)
    };
    const stars: Star[] = [];

    const rnd = (min: number, max: number) => min + Math.random() * (max - min);

    function updateCenter() {
      if (anchorRef?.current) {
        const aRect = anchorRef.current.getBoundingClientRect();
        const cRect = C.getBoundingClientRect();
        const ax = aRect.left + aRect.width / 2 - cRect.left;
        const ay = aRect.top + aRect.height / 2 - cRect.top;
        centerX = ax * dpr;
        centerY = ay * dpr;
        if (aRect.width > 0 && aRect.height > 0) {
          if (!isReady) setIsReady(true);
          if (readyAtRef.current == null) readyAtRef.current = performance.now();
        }
        return;
      }
      centerX = width / 2;
      centerY = height / 2;
    }

    function resize() {
      const rect = C.getBoundingClientRect();
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      width = Math.floor(rect.width * dpr);
      height = Math.floor(rect.height * dpr);
      C.width = width;
      C.height = height;
      C.style.width = `${Math.floor(rect.width)}px`;
      C.style.height = `${Math.floor(rect.height)}px`;
      updateCenter();

      const mp = (width * height) / 1_000_000; // megapixels
      const target = Math.max(60, Math.floor(mp * density));
      if (stars.length < target) {
        while (stars.length < target) stars.push(makeStar(!visible));
      } else if (stars.length > target) {
        stars.length = target;
      }

      // Recompute center transparency mask
      const dim = Math.min(width, height);
      const r0 = Math.max(0, dim * centerZero);
      const r1 = Math.max(r0 + 1, dim * centerFull);
      maskGradient = CTX.createRadialGradient(centerX, centerY, r0, centerX, centerY, r1);
      maskGradient.addColorStop(0.0, 'rgba(255,255,255,0)'); // fully transparent at center
      maskGradient.addColorStop(0.55, `rgba(255,255,255,${midOpacity})`); // modest mid ring
      maskGradient.addColorStop(1.0, `rgba(255,255,255,${outerOpacity})`); // subtle at edges
    }

    function makeStar(hiddenPhase = false): Star {
      // Spawn near center for hyperspace pull; slight angle bias
      const angle = rnd(0, Math.PI * 2);
      const minDim = Math.min(width, height);
      const minFrac = hiddenPhase ? (hiddenSpawnMinRadiusFrac ?? revealRadiusFrac) : 0.1;
      const rBase = minFrac * minDim;
      // Spawn between [minFrac .. 0.55] of minDim, biased toward minFrac
      const rJitter = Math.pow(Math.random(), 1.8) * (0.55 * minDim - rBase);
      const rad = rBase + rJitter;
      const x = centerX + Math.cos(angle) * rad;
      const y = centerY + Math.sin(angle) * rad;
      const dx = x - centerX;
      const dy = y - centerY;
      const mag = Math.max(0.0001, Math.hypot(dx, dy));
      const vx = dx / mag;
      const vy = dy / mag;
      return {
        x,
        y,
        z: rnd(0.08, 1),
        vx,
        vy,
        sp: rnd(0.75, 1.4),
        len: rnd(0.5, 1.0),
        hue: rnd(-8, 8),
      };
    }

    function respawn(i: number, hiddenPhase = false) {
      stars[i] = makeStar(hiddenPhase);
    }

    let last = performance.now();
    function tick(now: number) {
      if (stopRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
      const dt = Math.min(50, now - last) / 1000; // clamp delta
      last = now;

      // Determine if we should hide drawing (but still simulate)
      const shouldHold = ((holdUntilAnchor ?? Boolean(anchorRef)) && !isReady) || !visible;

      if (!shouldHold) {
        // Fade frame (motion blur) for smooth streaks
        CTX.globalCompositeOperation = 'source-over';
        CTX.fillStyle = mode === 'dark' ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.18)';
        CTX.fillRect(0, 0, width, height);
        CTX.globalCompositeOperation = 'lighter';
      }

      // Track coverage + spread during simulation
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      let beyond = 0;
      const total = stars.length;
      const rThresh = Math.min(width, height) * revealRadiusFrac;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i]!;
        // Depth-based speed; nearer stars move faster and are longer
        const depth = (1 - s.z) * (reduce ? 0.35 : 1);
        const scale = shouldHold ? preSimBoost : 1;
        const pxPerSec = speed * (0.4 + depth) * s.sp * scale;
        const dtSim = dt * scale;
        const dx = s.vx * pxPerSec * dt;
        const dy = s.vy * pxPerSec * dt;

        // previous position for streak
        const lx = s.x - dx * (2.5 * streak * s.len);
        const ly = s.y - dy * (2.5 * streak * s.len);

        // Update position
        s.x += dx;
        s.y += dy;
        // Gradually pull depth forward (simulate warp tunnel)
        s.z = Math.max(0, s.z - dtSim * 0.25);

        // Update coverage extents
        if (s.x < minX) minX = s.x;
        if (s.x > maxX) maxX = s.x;
        if (s.y < minY) minY = s.y;
        if (s.y > maxY) maxY = s.y;

        // Spread beyond inner radius
        const dxc = s.x - centerX;
        const dyc = s.y - centerY;
        const rr = Math.hypot(dxc, dyc);
        if (rr >= rThresh) beyond++;

        if (!shouldHold) {
          // Color per star: subtle hue shift + alpha by depth
          const alpha = 0.25 + 0.6 * (1 - s.z);
          if (color) {
            CTX.strokeStyle = strokeStyle;
          } else {
            const base = mode === 'dark' ? 255 : 0;
            const r = base;
            const g = base;
            const b = base;
            CTX.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          }
          CTX.lineWidth = Math.max(0.6, (1 - s.z) * 2.2);
          CTX.beginPath();
          CTX.moveTo(lx, ly);
          CTX.lineTo(s.x, s.y);
          CTX.stroke();
        }

        // Respawn if outside bounds with margin
        const margin = 40 * dpr;
        if (s.x < -margin || s.x > width + margin || s.y < -margin || s.y > height + margin) {
          respawn(i, shouldHold);
        }
      }

      if (!shouldHold && maskGradient) {
        // Apply center fade mask
        CTX.globalCompositeOperation = 'destination-in';
        CTX.fillStyle = maskGradient as unknown as CanvasPattern | string;
        CTX.fillRect(0, 0, width, height);
      }

      // Reveal only after edges are reached, spread satisfied, AND minimum delay elapsed
      if (!visible && isReady && readyAtRef.current != null) {
        const elapsed = now - readyAtRef.current;
        const margin = Math.min(width, height) * 0.04;
        const hasLeft = minX <= margin;
        const hasTop = minY <= margin;
        const hasRight = maxX >= width - margin;
        const hasBottom = maxY >= height - margin;
        const coverageOk = hasLeft && hasTop && hasRight && hasBottom;
        const spreadOk =
          total > 0 && beyond / total >= Math.min(1, Math.max(0, minRevealSpreadRatio));
        if (coverageOk && spreadOk && elapsed >= startDelayMs) setVisible(true);
      }
    }

    function onVisibility() {
      const hidden = document.hidden;
      if (hidden) {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else {
        last = performance.now();
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    const ro = new ResizeObserver(resize);
    ro.observe(C);
    let aro: ResizeObserver | null = null;
    if (anchorRef?.current) {
      aro = new ResizeObserver(() => {
        updateCenter();
        const dim = Math.min(width, height);
        const r0 = Math.max(0, dim * centerZero);
        const r1 = Math.max(r0 + 1, dim * centerFull);
        maskGradient = CTX.createRadialGradient(centerX, centerY, r0, centerX, centerY, r1);
        maskGradient.addColorStop(0.0, 'rgba(255,255,255,0)');
        maskGradient.addColorStop(0.55, `rgba(255,255,255,${midOpacity})`);
        maskGradient.addColorStop(1.0, `rgba(255,255,255,${outerOpacity})`);
      });
      aro.observe(anchorRef.current);
    }
    resize();
    stopRef.current = false;
    last = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stopRef.current = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      if (aro) aro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [
    density,
    speed,
    streak,
    strokeStyle,
    mode,
    reduce,
    color,
    centerZero,
    centerFull,
    midOpacity,
    outerOpacity,
    anchorRef,
    isReady,
    holdUntilAnchor,
    visible,
    preSimBoost,
    startDelayMs,
    revealRadiusFrac,
    minRevealSpreadRatio,
    hiddenSpawnMinRadiusFrac,
  ]);

  return (
    <Layer aria-hidden>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          opacity: visible ? opacity : 0,
          transition: `opacity ${fadeMs}ms ease-out`,
        }}
      />
    </Layer>
  );
}
