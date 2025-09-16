// ─────────────────────────────────────────────────────────────
// src/components/Starfield.tsx  | valet-docs
// High‑performance hyperspace starfield (light‑speed effect)
// ─────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';

type CanvasWithTransfer = HTMLCanvasElement & {
  transferControlToOffscreen: () => OffscreenCanvas;
  __offscreenTaken?: boolean;
};
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
  const { mode, theme } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const didReadySentRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const stopRef = useRef(false);
  const [isReady, setIsReady] = useState<boolean>(() => !anchorRef);
  const [visible, setVisible] = useState<boolean>(false);
  const [suppressed, setSuppressed] = useState<boolean>(false);
  const suppressedRef = useRef<boolean>(false);
  useEffect(() => {
    suppressedRef.current = suppressed;
  }, [suppressed]);
  const visibleAtRef = useRef<number | null>(null);
  const readyAtRef = useRef<number | null>(null);
  const badAccumRef = useRef<number>(0);
  const lastPerfAtRef = useRef<number>(0);

  // Choose default color by theme
  const strokeStyle = useMemo(() => {
    if (color) return color;
    return mode === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)';
  }, [mode, color]);

  // Build a theme-aligned, colorful palette (exclude greys)
  const palette = useMemo(() => {
    const base = [
      theme.colors['primary'], // Euro Blue
      theme.colors['secondary'], // Cool Blue
      theme.colors['error'], // Orange
      theme.colors['tertiary'], // Ice Blue (light accent)
    ]
      .filter(Boolean)
      .map((c) => String(c).trim().toLowerCase());
    // De-dup
    const uniq: string[] = [];
    for (const c of base) if (!uniq.includes(c)) uniq.push(c);
    // Weight colorful accents higher: primary, secondary, error
    const weight = (c: string) => (c === String(theme.colors['tertiary']).toLowerCase() ? 1 : 2);
    const pool: string[] = [];
    for (const c of uniq) for (let i = 0; i < weight(c); i++) pool.push(c);
    return pool.length ? pool : uniq;
  }, [theme.colors]);

  // Auto-detect prefers-reduced-motion if prop not provided
  const reduce = useMemo(() => {
    if (typeof reduceMotion === 'boolean') return reduceMotion;
    if (typeof window !== 'undefined' && 'matchMedia' in window) {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    return false;
  }, [reduceMotion]);

  // Worker path: OffscreenCanvas render when supported (initialize once)
  const workerInitRef = useRef(false);
  useEffect(() => {
    if (workerInitRef.current) return;
    workerInitRef.current = true;
    const canvas = canvasRef.current;
    const supports =
      typeof window !== 'undefined' &&
      typeof Worker !== 'undefined' &&
      'OffscreenCanvas' in window &&
      !!canvas?.transferControlToOffscreen;
    if (!supports) return;

    const C = canvas as CanvasWithTransfer;
    // Guard against double-transfer (e.g., dev StrictMode or effect re-runs)
    if (C.__offscreenTaken) return;
    const off = C.transferControlToOffscreen();
    C.__offscreenTaken = true;
    // Vite worker import pattern
    const worker = new Worker(new URL('./starfield.worker.ts', import.meta.url), {
      type: 'module',
    });
    workerRef.current = worker;

    // DPR control (cap for perf)
    const MAX_DPR = 1.5;
    const getDpr = () => Math.max(1, Math.min(MAX_DPR, window.devicePixelRatio || 1));

    // initial ready
    setIsReady(!holdUntilAnchor && !anchorRef);
    if (!anchorRef || !holdUntilAnchor) readyAtRef.current = performance.now();

    const initConfig = {
      density,
      speed,
      streak,
      color: color ?? strokeStyle,
      centerZero,
      centerFull,
      midOpacity,
      outerOpacity,
      holdUntilAnchor: Boolean(anchorRef && holdUntilAnchor),
      startDelayMs,
      fadeMs,
      preSimBoost,
      revealRadiusFrac,
      minRevealSpreadRatio,
      hiddenSpawnMinRadiusFrac,
      reduceMotion: reduce,
    };
    worker.postMessage({ type: 'init', canvas: off, config: initConfig }, [
      off as unknown as Transferable,
    ]);

    function pushResize() {
      const rect = C.getBoundingClientRect();
      const dpr = getDpr();
      // CSS size is retained by the main thread element style
      C.style.width = `${Math.floor(rect.width)}px`;
      C.style.height = `${Math.floor(rect.height)}px`;

      let cx = rect.width / 2;
      let cy = rect.height / 2;
      if (anchorRef?.current) {
        const aRect = anchorRef.current.getBoundingClientRect();
        cx = aRect.left + aRect.width / 2 - rect.left;
        cy = aRect.top + aRect.height / 2 - rect.top;
        if (!didReadySentRef.current && holdUntilAnchor && aRect.width > 0 && aRect.height > 0) {
          didReadySentRef.current = true;
          setIsReady(true);
          if (readyAtRef.current == null) readyAtRef.current = performance.now();
          worker.postMessage({ type: 'ready', isReady: true });
        }
      }
      worker.postMessage({
        type: 'resize',
        widthCSS: rect.width,
        heightCSS: rect.height,
        dpr,
        centerXCSS: cx,
        centerYCSS: cy,
      });
    }

    const ro = new ResizeObserver(pushResize);
    ro.observe(C);
    let aro: ResizeObserver | null = null;
    if (anchorRef?.current) {
      aro = new ResizeObserver(pushResize);
      aro.observe(anchorRef.current);
    }
    pushResize();

    function onVisibility() {
      const hidden = document.hidden;
      worker.postMessage({ type: hidden ? 'pause' : 'resume' });
    }
    document.addEventListener('visibilitychange', onVisibility);

    worker.onmessage = (
      ev: MessageEvent<{ type: 'visible'; at: number } | { type: 'perf'; fps: number; at: number }>,
    ) => {
      const msg = ev.data;
      if (msg?.type === 'visible') {
        visibleAtRef.current = msg.at;
        setVisible(true);
        return;
      }
      if (msg?.type === 'perf') {
        const now = msg.at || performance.now();
        const prev = lastPerfAtRef.current || now;
        const dt = Math.max(0, now - prev);
        lastPerfAtRef.current = now;
        const fps = msg.fps;
        const BAD_FPS = 45;
        const BAD_MS = 1000;
        if (fps < BAD_FPS) {
          badAccumRef.current += dt;
          if (badAccumRef.current >= BAD_MS && !suppressedRef.current) {
            setSuppressed(true);
            setVisible(false);
            try {
              worker.postMessage({ type: 'pause' });
            } catch {
              /* noop */
            }
          }
        } else {
          badAccumRef.current = 0;
        }
      }
    };

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();
      if (aro) aro.disconnect();
      try {
        worker.terminate();
      } catch {
        /* noop */
      }
      workerRef.current = null;
    };
    // Intentionally mount-once; config updates are pushed by a separate effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push config changes to worker without re-initializing
  useEffect(() => {
    const worker = workerRef.current;
    if (!worker) return;
    const cfg = {
      density,
      speed,
      streak,
      color: color ?? strokeStyle,
      centerZero,
      centerFull,
      midOpacity,
      outerOpacity,
      holdUntilAnchor: Boolean(anchorRef && holdUntilAnchor),
      startDelayMs,
      fadeMs,
      preSimBoost,
      revealRadiusFrac,
      minRevealSpreadRatio,
      hiddenSpawnMinRadiusFrac,
      reduceMotion: reduce,
    };
    try {
      worker.postMessage({ type: 'config', config: cfg });
    } catch {
      /* noop */
    }
  }, [
    density,
    speed,
    streak,
    color,
    strokeStyle,
    centerZero,
    centerFull,
    midOpacity,
    outerOpacity,
    anchorRef,
    holdUntilAnchor,
    startDelayMs,
    fadeMs,
    preSimBoost,
    revealRadiusFrac,
    minRevealSpreadRatio,
    hiddenSpawnMinRadiusFrac,
    reduce,
  ]);

  // Fallback: main-thread renderer (existing implementation)
  useEffect(() => {
    const supports =
      typeof window !== 'undefined' &&
      typeof Worker !== 'undefined' &&
      'OffscreenCanvas' in window &&
      !!canvasRef.current?.transferControlToOffscreen;
    if (supports) return; // worker path handles rendering
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const C = canvas as HTMLCanvasElement;
    const CTX = ctx as CanvasRenderingContext2D;
    CTX.lineCap = 'round';
    // Minor perf: avoid costly image smoothing (not needed for lines)
    CTX.imageSmoothingEnabled = false as unknown as boolean;

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
      // color cycling between two palette colors
      c0: number; // index into palette
      c1: number; // index into palette (!= c0 when possible)
      phase: number; // 0..1
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
      // Cap DPR slightly below 2 for perf on low-end GPUs; visually indistinguishable
      const MAX_DPR = 1.5;
      dpr = Math.max(1, Math.min(MAX_DPR, window.devicePixelRatio || 1));
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
      // pick two palette colors; if not enough colors, we fallback at draw time
      const pLen = palette.length;
      const i0 = pLen ? Math.floor(Math.random() * pLen) : -1;
      let i1 = pLen ? Math.floor(Math.random() * pLen) : -1;
      if (pLen && i1 === i0) i1 = (i0 + 1) % pLen;

      return {
        x,
        y,
        z: rnd(0.08, 1),
        vx,
        vy,
        sp: rnd(0.75, 1.4),
        len: rnd(0.5, 1.0),
        c0: i0,
        c1: i1,
        phase: Math.random(),
      };
    }

    function respawn(i: number, hiddenPhase = false) {
      stars[i] = makeStar(hiddenPhase);
    }

    let last = performance.now();
    // When using a fixed color, batch segments into width/alpha bins
    const USE_BATCH = Boolean(color);
    const W_BINS = 6;
    const A_BINS = 6;
    const binWidths: number[] = Array.from({ length: W_BINS }, (_, i) => {
      const minW = 0.6;
      const maxW = 2.2;
      const t = (i + 0.5) / W_BINS;
      return minW + (maxW - minW) * t;
    });
    const binAlphas: number[] = Array.from({ length: A_BINS }, (_, i) => {
      const base = 0.25;
      const span = 0.6;
      const t = (i + 0.5) / A_BINS;
      return base + span * t;
    });
    const segs: number[][][] = Array.from({ length: W_BINS }, () =>
      Array.from({ length: A_BINS }, () => [] as number[]),
    );

    // FPS suppression in fallback path
    let fpsEma = 60;
    let badAccum = 0;
    const BAD_FPS = 45;
    const BAD_MS = 1000;

    function tick(now: number) {
      if (stopRef.current) return;
      rafRef.current = requestAnimationFrame(tick);
      const dt = Math.min(50, now - last) / 1000; // clamp delta
      last = now;
      const instFps = dt > 0 ? 1 / dt : 60;
      fpsEma = fpsEma * 0.9 + instFps * 0.1;
      if (fpsEma < BAD_FPS) {
        badAccum += dt * 1000;
        if (badAccum >= BAD_MS && !suppressedRef.current) {
          setSuppressed(true);
          setVisible(false);
          stopRef.current = true;
          return;
        }
      } else {
        badAccum = 0;
      }

      // Determine if we should hide drawing (but still simulate)
      const shouldHold = ((holdUntilAnchor ?? Boolean(anchorRef)) && !isReady) || !visible;

      if (!shouldHold) {
        // Fade frame (motion blur) for smooth streaks; draw with normal compositing
        CTX.globalCompositeOperation = 'source-over';
        CTX.fillStyle = mode === 'dark' ? 'rgba(0,0,0,0.28)' : 'rgba(255,255,255,0.18)';
        CTX.fillRect(0, 0, width, height);
        // keep 'source-over' to avoid color shifts (no additive blending)
      }

      // Track coverage + spread during simulation until visible; skip after reveal
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;
      let beyond = 0;
      const total = visible ? 0 : stars.length;
      const rThresh = visible ? 0 : Math.min(width, height) * revealRadiusFrac;

      // If using a fixed color, set stroke style once per frame
      if (!shouldHold && color) {
        CTX.strokeStyle = strokeStyle;
      }

      // Reset segment bins if batching
      if (USE_BATCH && !shouldHold) {
        for (let wi = 0; wi < W_BINS; wi++) {
          for (let ai = 0; ai < A_BINS; ai++) segs[wi]![ai]!.length = 0;
        }
      }

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
        const k = 2.5 * streak * s.len;
        const lx = s.x - dx * k;
        const ly = s.y - dy * k;

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

        // Spread beyond inner radius (only while hidden)
        if (!visible) {
          const dxc = s.x - centerX;
          const dyc = s.y - centerY;
          const rr = Math.hypot(dxc, dyc);
          if (rr >= rThresh) beyond++;
        }

        if (!shouldHold) {
          // Color per star: lerp between theme palette colors; alpha by depth
          const alpha = 0.25 + 0.6 * (1 - s.z);
          if (color && USE_BATCH) {
            // Quantize width and alpha to reduce stroke() calls dramatically
            const minW = 0.6;
            const maxW = 2.2;
            const width = Math.max(minW, (1 - s.z) * maxW);
            let wi = Math.floor(((width - minW) / (maxW - minW)) * W_BINS);
            if (wi < 0) wi = 0;
            if (wi >= W_BINS) wi = W_BINS - 1;
            let ai = Math.floor(((alpha - 0.25) / 0.6) * A_BINS);
            if (ai < 0) ai = 0;
            if (ai >= A_BINS) ai = A_BINS - 1;
            const arr = segs[wi]![ai]!;
            arr.push(lx, ly, s.x, s.y);
          } else if (palette.length >= 1) {
            const t = (now * 0.00015 + s.phase) % 1;

            // Bias early frames to start with orange (theme.error) and transition toward theme blue
            const errHex = String(theme.colors['error'] || '').toLowerCase();
            const priHex = String(theme.colors['primary'] || '').toLowerCase();
            const secHex = String(theme.colors['secondary'] || '').toLowerCase();
            const terHex = String(theme.colors['tertiary'] || '').toLowerCase();
            const errIdx = palette.indexOf(errHex);
            const priIdx = palette.indexOf(priHex);
            const secIdx = palette.indexOf(secHex);
            const terIdx = palette.indexOf(terHex);
            const bluePool = [priIdx, secIdx, terIdx].filter((i) => i >= 0);

            const sinceVisible = visibleAtRef.current == null ? null : now - visibleAtRef.current;
            // Keep orange visible through fade-in; minimum 2.2s
            const biasMs = Math.max((typeof fadeMs === 'number' ? fadeMs : 0) + 1500, 2200);
            const favorOrange = sinceVisible != null && sinceVisible < biasMs && errIdx >= 0;

            let idx0: number;
            let idx1: number;
            if (favorOrange) {
              // Orange -> Theme Blue (primary preferred) to avoid greenish blends
              idx0 = errIdx;
              idx1 =
                priIdx >= 0 ? priIdx : bluePool.length ? bluePool[0]! : errIdx >= 0 ? errIdx : 0;
            } else if (bluePool.length >= 1) {
              // After the intro, cycle only within blue family to avoid green
              idx0 = bluePool[Math.floor((s.phase * 997) % bluePool.length)]!;
              // pick a different blue if available
              if (bluePool.length > 1) {
                const next =
                  (bluePool.indexOf(idx0) + 1 + Math.floor((s.phase * 991) % bluePool.length)) %
                  bluePool.length;
                idx1 = bluePool[next]!;
              } else {
                idx1 = idx0;
              }
            } else {
              // Fallback to star-assigned palette indices
              idx0 = s.c0 >= 0 ? s.c0 : 0;
              idx1 = palette.length > 1 && s.c1 >= 0 ? s.c1 : (idx0 + 1) % palette.length;
            }

            const aHex = palette[idx0]!;
            const bHex = palette[idx1]!;
            const aR = parseInt(aHex.slice(1, 3), 16);
            const aG = parseInt(aHex.slice(3, 5), 16);
            const aB = parseInt(aHex.slice(5, 7), 16);
            const bR = parseInt(bHex.slice(1, 3), 16);
            const bG = parseInt(bHex.slice(3, 5), 16);
            const bB = parseInt(bHex.slice(5, 7), 16);
            const r = Math.round(aR + (bR - aR) * t);
            const g = Math.round(aG + (bG - aG) * t);
            const b = Math.round(aB + (bB - aB) * t);
            CTX.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
          } else {
            const base = mode === 'dark' ? 255 : 0;
            CTX.strokeStyle = `rgba(${base},${base},${base},${alpha})`;
          }
          if (!USE_BATCH || !color) {
            CTX.lineWidth = Math.max(0.6, (1 - s.z) * 2.2);
            CTX.beginPath();
            CTX.moveTo(lx, ly);
            CTX.lineTo(s.x, s.y);
            CTX.stroke();
          }
        }

        // Respawn if outside bounds with margin
        const margin = 40 * dpr;
        if (s.x < -margin || s.x > width + margin || s.y < -margin || s.y > height + margin) {
          respawn(i, shouldHold);
        }
      }

      // Flush batched segments when using fixed color
      if (!shouldHold && USE_BATCH && color) {
        CTX.strokeStyle = strokeStyle;
        for (let wi = 0; wi < W_BINS; wi++) {
          CTX.lineWidth = binWidths[wi]!;
          for (let ai = 0; ai < A_BINS; ai++) {
            const arr = segs[wi]![ai]!;
            if (arr.length === 0) continue;
            CTX.globalAlpha = binAlphas[ai]!;
            CTX.beginPath();
            for (let j = 0; j < arr.length; j += 4) {
              CTX.moveTo(arr[j]!, arr[j + 1]!);
              CTX.lineTo(arr[j + 2]!, arr[j + 3]!);
            }
            CTX.stroke();
          }
        }
        CTX.globalAlpha = 1;
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
        if (coverageOk && spreadOk && elapsed >= startDelayMs) {
          visibleAtRef.current = now;
          setVisible(true);
        }
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
    theme.colors,
    reduce,
    color,
    palette,
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
    fadeMs,
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
          display: suppressed ? 'none' : 'block',
          opacity: visible ? opacity : 0,
          transition: `opacity ${fadeMs}ms ease-out`,
        }}
      />
    </Layer>
  );
}
