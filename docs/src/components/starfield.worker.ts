// ─────────────────────────────────────────────────────────────
// src/components/starfield.worker.ts  | valet-docs
// OffscreenCanvas worker: hyperspace starfield renderer
// ─────────────────────────────────────────────────────────────

// Types for messages between main thread and worker
type InitMsg = {
  type: 'init';
  canvas: OffscreenCanvas;
  config: Config;
};

type ResizeMsg = {
  type: 'resize';
  widthCSS: number;
  heightCSS: number;
  dpr: number;
  centerXCSS: number;
  centerYCSS: number;
};

type ControlMsg = { type: 'pause' | 'resume' };
type ReadyMsg = { type: 'ready'; isReady: boolean };
type UpdateConfigMsg = { type: 'config'; config: Partial<Config> };

type InMsg = InitMsg | ResizeMsg | ControlMsg | ReadyMsg | UpdateConfigMsg;

// Outgoing events sent to main thread
type VisibleMsg = { type: 'visible'; at: number };
type PerfMsg = { type: 'perf'; fps: number; at: number };

type Config = {
  density: number;
  speed: number;
  streak: number;
  color?: string;
  centerZero: number;
  centerFull: number;
  midOpacity: number;
  outerOpacity: number;
  holdUntilAnchor?: boolean;
  startDelayMs: number;
  fadeMs: number;
  preSimBoost: number;
  revealRadiusFrac: number;
  minRevealSpreadRatio: number;
  hiddenSpawnMinRadiusFrac?: number;
  reduceMotion?: boolean;
};

let C: OffscreenCanvas | null = null;
let CTX: OffscreenCanvasRenderingContext2D | null = null;
let running = false;
let paused = false;

let conf: Config = {
  density: 120,
  speed: 160,
  streak: 0.65,
  centerZero: 0.1,
  centerFull: 0.58,
  midOpacity: 0.4,
  outerOpacity: 0.18,
  holdUntilAnchor: false,
  startDelayMs: 1000,
  fadeMs: 450,
  preSimBoost: 12.0,
  revealRadiusFrac: 0.42,
  minRevealSpreadRatio: 0.6,
  reduceMotion: false,
};

let width = 0;
let height = 0;
let dpr = 1;
let centerX = 0;
let centerY = 0;
let maskGradient: CanvasGradient | null = null;
let isReady = true;
let visible = false;
// visibleAt kept local only; no external readers needed
let readyAt: number | null = null;

type Star = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  sp: number;
  len: number;
  phase: number;
};
const stars: Star[] = [];

const rnd = (min: number, max: number) => min + Math.random() * (max - min);

// Post message helper without relying on worker lib typings
const post = (m: VisibleMsg | PerfMsg) => {
  (self as unknown as { postMessage: (msg: unknown) => void }).postMessage(m);
};

function makeStar(hiddenPhase = false): Star {
  const angle = rnd(0, Math.PI * 2);
  const minDim = Math.min(width, height);
  const minFrac = hiddenPhase ? (conf.hiddenSpawnMinRadiusFrac ?? conf.revealRadiusFrac) : 0.1;
  const rBase = minFrac * minDim;
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
    phase: Math.random(),
  };
}

function respawn(i: number, hiddenPhase = false) {
  stars[i] = makeStar(hiddenPhase);
}

function updateMask() {
  if (!CTX) return;
  const dim = Math.min(width, height);
  const r0 = Math.max(0, dim * conf.centerZero);
  const r1 = Math.max(r0 + 1, dim * conf.centerFull);
  maskGradient = CTX.createRadialGradient(centerX, centerY, r0, centerX, centerY, r1);
  maskGradient.addColorStop(0.0, 'rgba(255,255,255,0)');
  maskGradient.addColorStop(0.55, `rgba(255,255,255,${conf.midOpacity})`);
  maskGradient.addColorStop(1.0, `rgba(255,255,255,${conf.outerOpacity})`);
}

function onResize(msg: ResizeMsg) {
  width = Math.max(1, Math.floor(msg.widthCSS * msg.dpr));
  height = Math.max(1, Math.floor(msg.heightCSS * msg.dpr));
  dpr = msg.dpr;
  centerX = msg.centerXCSS * msg.dpr;
  centerY = msg.centerYCSS * msg.dpr;
  if (!C || !CTX) return;
  C.width = width;
  C.height = height;
  updateMask();
  // Adjust star count to density
  const mp = (width * height) / 1_000_000; // megapixels
  const target = Math.max(60, Math.floor(mp * conf.density));
  if (stars.length < target) {
    while (stars.length < target) stars.push(makeStar(!visible));
  } else if (stars.length > target) {
    stars.length = target;
  }
}

// Draw batching (fixed color path)
const USE_BATCH = true;
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

let last = 0;
let fpsEma = 60;
let lastPerfPost = 0;

function loop() {
  if (!running || paused || !CTX) return;
  const now = performance.now();
  const dt = Math.min(50, now - last) / 1000;
  last = now;
  // Update FPS EMA
  const instFps = dt > 0 ? 1 / dt : 60;
  fpsEma = fpsEma * 0.9 + instFps * 0.1;
  const shouldHold = (Boolean(conf.holdUntilAnchor) && !isReady) || !visible;

  if (!shouldHold) {
    CTX.globalCompositeOperation = 'source-over';
    CTX.fillStyle = 'rgba(0,0,0,0.28)';
    CTX.fillRect(0, 0, width, height);
  }

  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;
  let beyond = 0;
  const trackSpread = !visible;
  const total = trackSpread ? stars.length : 0;
  const rThresh = trackSpread ? Math.min(width, height) * conf.revealRadiusFrac : 0;

  // Reset batched segments
  if (USE_BATCH && !shouldHold) {
    for (let wi = 0; wi < W_BINS; wi++)
      for (let ai = 0; ai < A_BINS; ai++) segs[wi]![ai]!.length = 0;
  }

  const color = conf.color || 'rgba(255,255,255,0.85)';

  for (let i = 0; i < stars.length; i++) {
    const s = stars[i]!;
    const depth = (1 - s.z) * (conf.reduceMotion ? 0.35 : 1);
    const scale = shouldHold ? conf.preSimBoost : 1;
    const pxPerSec = conf.speed * (0.4 + depth) * s.sp * scale;
    const dtSim = dt * scale;
    const dx = s.vx * pxPerSec * dt;
    const dy = s.vy * pxPerSec * dt;

    const k = 2.5 * conf.streak * s.len;
    const lx = s.x - dx * k;
    const ly = s.y - dy * k;

    s.x += dx;
    s.y += dy;
    s.z = Math.max(0, s.z - dtSim * 0.25);

    if (s.x < minX) minX = s.x;
    if (s.x > maxX) maxX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.y > maxY) maxY = s.y;

    if (trackSpread) {
      const dxc = s.x - centerX;
      const dyc = s.y - centerY;
      if (Math.hypot(dxc, dyc) >= rThresh) beyond++;
    }

    if (!shouldHold) {
      const alpha = 0.25 + 0.6 * (1 - s.z);
      // Batch by width and alpha (fixed color only)
      const minW = 0.6;
      const maxW = 2.2;
      const widthQ = Math.max(minW, (1 - s.z) * maxW);
      let wi = Math.floor(((widthQ - minW) / (maxW - minW)) * W_BINS);
      if (wi < 0) wi = 0;
      if (wi >= W_BINS) wi = W_BINS - 1;
      let ai = Math.floor(((alpha - 0.25) / 0.6) * A_BINS);
      if (ai < 0) ai = 0;
      if (ai >= A_BINS) ai = A_BINS - 1;
      segs[wi]![ai]!.push(lx, ly, s.x, s.y);
    }

    // Respawn if outside bounds with margin
    const margin = 40 * dpr;
    if (s.x < -margin || s.x > width + margin || s.y < -margin || s.y > height + margin) {
      respawn(i, shouldHold);
    }
  }

  // Flush batches
  if (!shouldHold) {
    CTX.strokeStyle = color;
    for (let wi = 0; wi < W_BINS; wi++) {
      CTX.lineCap = 'round';
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
    CTX.globalCompositeOperation = 'destination-in';
    CTX.fillStyle = maskGradient as unknown as CanvasPattern | string;
    CTX.fillRect(0, 0, width, height);
  }

  if (!visible && isReady && readyAt != null) {
    const elapsed = now - readyAt;
    const margin = Math.min(width, height) * 0.04;
    const hasLeft = minX <= margin;
    const hasTop = minY <= margin;
    const hasRight = maxX >= width - margin;
    const hasBottom = maxY >= height - margin;
    const coverageOk = hasLeft && hasTop && hasRight && hasBottom;
    const spreadOk =
      total > 0 && beyond / total >= Math.min(1, Math.max(0, conf.minRevealSpreadRatio));
    if (coverageOk && spreadOk && elapsed >= conf.startDelayMs) {
      visible = true;
      post({ type: 'visible', at: now });
    }
  }

  // Periodically report perf
  if (now - lastPerfPost > 500) {
    lastPerfPost = now;
    post({ type: 'perf', fps: fpsEma, at: now });
  }

  // Use a timer as rAF is unavailable in workers in many browsers
  setTimeout(loop, 16);
}

function start() {
  if (running || !C || !CTX) return;
  running = true;
  last = performance.now();
  setTimeout(loop, 16);
}

// stop() not required; worker is terminated externally

// eslint-disable-next-line no-restricted-globals
self.onmessage = (ev: MessageEvent<InMsg>) => {
  const msg = ev.data;
  switch (msg.type) {
    case 'init': {
      C = msg.canvas;
      CTX = C.getContext('2d');
      if (!CTX) return;
      CTX.lineCap = 'round';
      (CTX as unknown as { imageSmoothingEnabled?: boolean }).imageSmoothingEnabled = false;
      conf = { ...conf, ...msg.config };
      isReady = !conf.holdUntilAnchor;
      if (isReady && readyAt == null) readyAt = performance.now();
      start();
      break;
    }
    case 'resize': {
      onResize(msg);
      break;
    }
    case 'pause': {
      paused = true;
      break;
    }
    case 'resume': {
      paused = false;
      // resume immediately
      if (running) setTimeout(loop, 16);
      break;
    }
    case 'ready': {
      isReady = msg.isReady;
      if (isReady && readyAt == null) readyAt = performance.now();
      break;
    }
    case 'config': {
      conf = { ...conf, ...msg.config };
      updateMask();
      break;
    }
    default:
      break;
  }
};
