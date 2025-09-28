// ─────────────────────────────────────────────────────────────
// src/shaders/lava-lamp/LavaLampProgram.ts  | valet-docs
// Lava-lamp GL Program (WebGL2): compiles/links shaders, sets up a full-screen
// triangle, manages uniforms/buffers, and advances a tiny blob physics system
// that the fragment shader visualizes as saturated Gaussian “metaballs”.
//
// High level
// - This module encapsulates the lava-lamp logic (CPU-side) and the GPU state.
// - A React wrapper owns the canvas/RAF/resize and drives this program via a
//   small GLProgram API (resize/update/render/dispose).
// - Blobs move in a centered square space to match the shader’s field space.
//   We upload centers/radii each frame; the shader shades and blends them.
//
// Design intent
// - Calm, molten motion with soft merges/splits and rich interior color.
// - Deterministic-but-alive behavior via a seeded PRNG and scheduled pulses.
// - Lightweight math/allocs to keep frame time small.
// ─────────────────────────────────────────────────────────────
import vsSrc from './lavaLamp.vert?raw';
import fsSrc from './lavaLamp.frag?raw';
import { LavaLampParams } from './lavaLampParams';

export type GLProgram = {
  resize: (width: number, height: number, dpr: number) => void;
  update: (dt: number, t: number) => void;
  render: () => void;
  dispose: () => void;
};

export function createLavaLampProgram(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
): GLProgram | null {
  // Compile & link -----------------------------------------------------------
  // GLSL ES 3.00 shaders are imported as raw strings. #version must be first.
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('Shader compile error', gl.getShaderInfoLog(s));
      gl.deleteShader(s);
      return null;
    }
    return s;
  };

  const vs = compile(gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error', gl.getProgramInfoLog(prog));
    return null;
  }

  // Full‑screen triangle setup ----------------------------------------------
  // A single oversized triangle covers the viewport and avoids interpolation
  // seams common with quads. The vertex shader maps clip-space to vUV.
  const vao = gl.createVertexArray()!;
  const vbo = gl.createBuffer()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  const tri = new Float32Array([-1, -1, 3, -1, -1, 3]);
  gl.bufferData(gl.ARRAY_BUFFER, tri, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2 * 4, 0);
  gl.bindVertexArray(null);

  // Uniform locations --------------------------------------------------------
  // Match fragment shader declarations. Set per-frame or on resize.
  const uResolution = gl.getUniformLocation(prog, 'uResolution');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uCount = gl.getUniformLocation(prog, 'uCount');
  const uCenters = gl.getUniformLocation(prog, 'uCenters');
  const uRadii = gl.getUniformLocation(prog, 'uRadii');
  const uRotRow0 = gl.getUniformLocation(prog, 'uRotRow0');
  const uRotRow1 = gl.getUniformLocation(prog, 'uRotRow1');
  const uInvSigma = gl.getUniformLocation(prog, 'uInvSigma');
  const uMinFalloff = gl.getUniformLocation(prog, 'uMinFalloff');
  const uCutThreshold = gl.getUniformLocation(prog, 'uCutThreshold');
  // Appearance uniforms (fragment shader tuning)
  const uBgColor = gl.getUniformLocation(prog, 'uBgColor');
  const uIso = gl.getUniformLocation(prog, 'uIso');
  const uBand = gl.getUniformLocation(prog, 'uBand');
  const uNormalZ = gl.getUniformLocation(prog, 'uNormalZ');
  const uLightDir = gl.getUniformLocation(prog, 'uLightDir');
  const uSpecPower = gl.getUniformLocation(prog, 'uSpecPower');
  const uSpecIntensity = gl.getUniformLocation(prog, 'uSpecIntensity');
  const uRimPower = gl.getUniformLocation(prog, 'uRimPower');
  const uRampC1 = gl.getUniformLocation(prog, 'uRampC1');
  const uRampC2 = gl.getUniformLocation(prog, 'uRampC2');
  const uRampC3 = gl.getUniformLocation(prog, 'uRampC3');
  const uRampC4 = gl.getUniformLocation(prog, 'uRampC4');
  const uRampC5 = gl.getUniformLocation(prog, 'uRampC5');
  const uRamp1Start = gl.getUniformLocation(prog, 'uRamp1Start');
  const uRamp1End = gl.getUniformLocation(prog, 'uRamp1End');
  const uRamp2Start = gl.getUniformLocation(prog, 'uRamp2Start');
  const uRamp2End = gl.getUniformLocation(prog, 'uRamp2End');
  const uRamp3Start = gl.getUniformLocation(prog, 'uRamp3Start');
  const uRamp3End = gl.getUniformLocation(prog, 'uRamp3End');
  const uRamp4Start = gl.getUniformLocation(prog, 'uRamp4Start');
  const uRamp4End = gl.getUniformLocation(prog, 'uRamp4End');
  const uRamp5Mix = gl.getUniformLocation(prog, 'uRamp5Mix');
  const uCenterMaskStart = gl.getUniformLocation(prog, 'uCenterMaskStart');
  const uCenterMaskEnd = gl.getUniformLocation(prog, 'uCenterMaskEnd');
  const uCenterStrongStart = gl.getUniformLocation(prog, 'uCenterStrongStart');
  const uCenterStrongEnd = gl.getUniformLocation(prog, 'uCenterStrongEnd');
  const uPlateau = gl.getUniformLocation(prog, 'uPlateau');
  const uCStrongStart = gl.getUniformLocation(prog, 'uCStrongStart');
  const uCStrongEnd = gl.getUniformLocation(prog, 'uCStrongEnd');
  const uLocalSmoothPx = gl.getUniformLocation(prog, 'uLocalSmoothPx');
  const uLocalSmoothBlend = gl.getUniformLocation(prog, 'uLocalSmoothBlend');
  const uHotMaskStart = gl.getUniformLocation(prog, 'uHotMaskStart');
  const uHotMaskEnd = gl.getUniformLocation(prog, 'uHotMaskEnd');
  const uHotBlendStrength = gl.getUniformLocation(prog, 'uHotBlendStrength');
  const uHotA = gl.getUniformLocation(prog, 'uHotA');
  const uHotB = gl.getUniformLocation(prog, 'uHotB');
  const uFlowTintColor = gl.getUniformLocation(prog, 'uFlowTintColor');
  const uFlowTintGain = gl.getUniformLocation(prog, 'uFlowTintGain');
  const uFlowCenterSuppress = gl.getUniformLocation(prog, 'uFlowCenterSuppress');
  const uVeilColor = gl.getUniformLocation(prog, 'uVeilColor');
  const uVeilGainBase = gl.getUniformLocation(prog, 'uVeilGainBase');
  const uVeilGainNoise = gl.getUniformLocation(prog, 'uVeilGainNoise');
  const uVeilMaskScale = gl.getUniformLocation(prog, 'uVeilMaskScale');
  const uBaseDesaturate = gl.getUniformLocation(prog, 'uBaseDesaturate');
  const uVeilMix = gl.getUniformLocation(prog, 'uVeilMix');
  const uGlowWidth = gl.getUniformLocation(prog, 'uGlowWidth');
  const uGlowGain = gl.getUniformLocation(prog, 'uGlowGain');
  const uGlowColor = gl.getUniformLocation(prog, 'uGlowColor');
  const uVignetteK = gl.getUniformLocation(prog, 'uVignetteK');

  // Helpers ------------------------------------------------------------------
  // Minimal numerics for physics; keep simple and predictable.
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  const smoothstep = (edge0: number, edge1: number, x: number) => {
    if (edge0 === edge1) return x < edge0 ? 0 : 1;
    const t = clamp01((x - edge0) / (edge1 - edge0));
    return t * t * (3 - 2 * t);
  };

  // Physics state ------------------------------------------------------------
  // Tiny soft-body system. The shader interprets each blob as a Gaussian
  // kernel and performs the saturated union + shading. Here we only evolve
  // positions/velocities/radii.
  type Blob = {
    x: number; // in square space [-s..s]
    y: number;
    vx: number;
    vy: number;
    r: number; // radius in square units
    active: boolean;
    heat: number; // 0..1 affects target radius
    id: number; // seed id
    baseR: number; // preferred resting radius
    age: number; // seconds since spawn
    centerTime: number; // seconds continuously spent near center
    centerAccumRate: number; // last accumulation strength for ramp tracking
  };

  const MAX = LavaLampParams.program.maxBlobs;
  const sqBound = LavaLampParams.program.squareBound; // shared square bounds in shader uv space
  const blobs: Blob[] = [];

  // Seeded PRNG for stable sessions -----------------------------------------
  // Provides stable session behavior with enough variation.
  let seed = LavaLampParams.program.seed;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return (seed & 0xfffffff) / 0xfffffff;
  };

  // Flow field ---------------------------------------------------------------
  // Smooth velocity field: inward pressure near edges, a moving drain-like
  // swirl attractor, tiny eddies, and a subtle bias to avoid stagnation.
  const flowField = (px: number, py: number, time: number, id: number) => {
    const dist = Math.hypot(px, py);
    const invDist = dist > 1e-5 ? 1 / dist : 0;
    const rNorm = dist > 0 ? clamp01(dist / sqBound) : 0;
    let vx = 0;
    let vy = 0;

    if (invDist > 0) {
      const dirX = px * invDist;
      const dirY = py * invDist;
      const ep = LavaLampParams.program.flow.edgePull;
      const edgePull = smoothstep(ep.start, ep.end, rNorm);
      const radialOut = 0.0;
      const radialIn = ep.radialIn * edgePull;
      const radialX = radialOut - radialIn * ep.xScale; // stronger inward force from left/right edges
      const radialY = radialOut - radialIn * ep.yScale;
      vx += dirX * radialX;
      vy += dirY * radialY;
    }

    const ec = LavaLampParams.program.flow.edgeCompression;
    const edgeCompression = smoothstep(ec.start, ec.end, Math.abs(px) / sqBound);
    if (edgeCompression > 0) {
      const signX = px >= 0 ? 1 : -1;
      const verticalEase = ec.horizEaseX + ec.horizEaseY * (1 - clamp01(Math.abs(py) / sqBound));
      vx -= signX * edgeCompression * verticalEase * ec.strength;
    }

    const d = LavaLampParams.program.flow.drain;
    const drainX = d.x.amp * Math.sin(time * d.x.freq) + d.x.bias;
    const drainY = d.y.base + d.y.amp * Math.cos(time * d.y.freq + id * d.y.idPhase);
    const dx = px - drainX;
    const dy = py - drainY;
    const drainDist = Math.hypot(dx, dy);
    if (drainDist > 1e-5) {
      const invDrain = 1 / drainDist;
      const tangentX = -dy * invDrain;
      const tangentY = dx * invDrain;
      const se = d.swirlEnvelope;
      const swirlEnvelope = se.base + se.gain * smoothstep(se.start, se.end, rNorm);
      const sp = d.swirlPulse;
      const swirlPulse = sp.base + sp.gain * Math.sin(time * sp.freq + id * sp.idPhase);
      vx += tangentX * swirlEnvelope * swirlPulse;
      vy += tangentY * swirlEnvelope * swirlPulse;
    }

    const e = LavaLampParams.program.flow.eddies;
    const eddySeed = Math.sin((px + py) * e.seedFreq + time * 0.55 + id * 0.45);
    const eddyX = Math.sin((py + time * 0.32) * e.xFreq + id * 0.9 + eddySeed * 0.6);
    const eddyY = Math.cos((px - time * 0.27) * e.yFreq + id * 1.3 - eddySeed * 0.4);
    vx += eddyX * e.strength;
    vy += eddyY * e.strength;

    vx += e.bias.vx;
    vy += e.bias.vy;

    return { x: vx, y: vy };
  };

  // Approximate saturated Gaussian field at a point (CPU-side proxy for shader field)
  // Matches fragment shader's union kernel roughly: sigma ~ r^2 * 1.6; v = 1 - exp(-sumK)
  // (Removed global-field helper; using pair-only field for connectivity)

  // Pair-only saturated field at the midpoint between two blobs
  const saturatedPairMidField = (A: Blob, B: Blob): number => {
    const mx = (A.x + B.x) * 0.5;
    const my = (A.y + B.y) * 0.5;
    const dxA = mx - A.x;
    const dyA = my - A.y;
    const dxB = mx - B.x;
    const dyB = my - B.y;
    const sigmaA = A.r * A.r * 1.6 + 1e-6;
    const sigmaB = B.r * B.r * 1.6 + 1e-6;
    const kA = Math.exp(-(dxA * dxA + dyA * dyA) / sigmaA);
    const kB = Math.exp(-(dxB * dxB + dyB * dyB) / sigmaB);
    const sumK = kA + kB;
    return 1 - Math.exp(-sumK);
  };

  // Spawn a blob near an optional location with small initial jitter.
  const spawnBlob = (id: number, near?: { x: number; y: number; r?: number }) => {
    const is = LavaLampParams.program.initialScatter;
    const baseR = is.baseRadius.min + rand() * is.baseRadius.jitter; // smaller average radius
    const x = near ? near.x + (rand() - 0.5) * 0.02 : (rand() - 0.5) * is.areaExtent;
    const y = near ? near.y + (rand() - 0.5) * 0.02 : (rand() - 0.5) * is.areaExtent;
    const s = is.baseSpeed.min + rand() * is.baseSpeed.jitter; // slower base speed
    const flow0 = flowField(x, y, 0, id);
    const jitterX = (rand() - 0.5) * s * is.jitterScale;
    const jitterY = (rand() - 0.5) * s * is.jitterScale;
    const vx = flow0.x * 0.6 + jitterX;
    const vy = flow0.y * 0.6 + jitterY;
    const r0 = near?.r ?? baseR;
    return {
      x,
      y,
      vx,
      vy,
      r: r0,
      active: true,
      heat: rand(),
      id,
      baseR: r0,
      age: 0,
      centerTime: 0,
      centerAccumRate: 0,
    } as Blob;
  };

  // Initial scatter ----------------------------------------------------------
  // Place blobs with a minimum spacing that relaxes across attempts to avoid
  // early overlaps and jittery resolving.
  const minInitialSpacing = LavaLampParams.program.initialScatter.minInitialSpacing;
  const minSpacingFloor = LavaLampParams.program.initialScatter.minSpacingFloor;
  const maxPlacementAttempts = LavaLampParams.program.initialScatter.maxPlacementAttempts;
  for (let i = 0; i < MAX; i++) {
    let placed: Blob | null = null;
    for (let attempt = 0; attempt < maxPlacementAttempts; attempt++) {
      const candidate = spawnBlob(i);
      const requiredSpacing = Math.max(minSpacingFloor, minInitialSpacing - attempt * 0.02);
      let tooClose = false;
      for (let k = 0; k < blobs.length; k++) {
        const existing = blobs[k]!;
        if (!existing.active) continue;
        const dist = Math.hypot(candidate.x - existing.x, candidate.y - existing.y);
        if (dist < requiredSpacing) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) {
        placed = candidate;
        break;
      }
    }
    if (!placed) {
      placed = spawnBlob(i);
    }
    blobs.push(placed);
  }

  const centersArr = new Float32Array(64 * 2);
  const radiiArr = new Float32Array(64);
  const rotRow0Arr = new Float32Array(64 * 2);
  const rotRow1Arr = new Float32Array(64 * 2);
  const invSigmaArr = new Float32Array(64);
  const minFalloffArr = new Float32Array(64);

  let currentTime = 0;

  const f32 = Math.fround;
  const fractf = (v: number) => f32(v - Math.floor(v));
  const sinf = (v: number) => f32(Math.sin(v));
  const cosf = (v: number) => f32(Math.cos(v));
  const ANGLE_SPACE_SCALE = f32(3.173);
  const STRETCH_SPACE_SCALE = f32(4.7);
  const ANGLE_TIME_SCALE = f32(0.15);
  const STRETCH_TIME_SCALE = f32(0.12);
  const TAU = f32(6.2831853);
  const STRETCH_MIN = f32(0.6);
  const STRETCH_MAX = f32(1.4);
  const SIGMA_SCALE = f32(1.6);
  const SIGMA_EPS = f32(1e-6);

  const hash21f = (x: number, y: number): number => {
    let px = fractf(f32(x * 0.1031));
    let py = fractf(f32(y * 0.1031));
    let pz = fractf(f32(x * 0.1031));
    const dot = f32(px * f32(py + 33.33) + py * f32(pz + 33.33) + pz * f32(px + 33.33));
    px = f32(px + dot);
    py = f32(py + dot);
    pz = f32(pz + dot);
    return fractf(f32((px + py) * pz));
  };

  const noise2d = (x: number, y: number): number => {
    const fx = f32(x);
    const fy = f32(y);
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const fracX = fractf(f32(fx - ix));
    const fracY = fractf(f32(fy - iy));
    const a = hash21f(f32(ix), f32(iy));
    const b = hash21f(f32(ix + 1), f32(iy));
    const c = hash21f(f32(ix), f32(iy + 1));
    const d = hash21f(f32(ix + 1), f32(iy + 1));
    const uX = f32(fracX * fracX * f32(3 - f32(2 * fracX)));
    const uY = f32(fracY * fracY * f32(3 - f32(2 * fracY)));
    const lerpAB = f32(a + (b - a) * uX);
    const lerpCD = f32(c + (d - c) * uX);
    return f32(lerpAB + (lerpCD - lerpAB) * uY);
  };

  const updateBlobFieldParams = (
    index: number,
    cx: number,
    cy: number,
    radius: number,
    time: number,
  ) => {
    const fx = f32(cx);
    const fy = f32(cy);
    const timeAngle = f32(time * ANGLE_TIME_SCALE);
    const timeStretch = f32(time * STRETCH_TIME_SCALE);
    const angleNoise = noise2d(
      f32(fx * ANGLE_SPACE_SCALE + timeAngle),
      f32(fy * ANGLE_SPACE_SCALE + timeAngle),
    );
    const stretchNoise = noise2d(
      f32(fx * STRETCH_SPACE_SCALE + timeStretch),
      f32(fy * STRETCH_SPACE_SCALE + timeStretch),
    );
    const angle = f32(angleNoise * TAU);
    const stretch = f32(STRETCH_MIN + (STRETCH_MAX - STRETCH_MIN) * stretchNoise);
    const cs = cosf(angle);
    const sn = sinf(angle);
    rotRow0Arr[index * 2 + 0] = cs;
    rotRow0Arr[index * 2 + 1] = f32(-sn);
    rotRow1Arr[index * 2 + 0] = f32(stretch * sn);
    rotRow1Arr[index * 2 + 1] = f32(stretch * cs);
    const r = f32(radius);
    const sigma = f32(r * r * SIGMA_SCALE + SIGMA_EPS);
    const invSigma = sigma > 0 ? f32(1 / sigma) : 0;
    invSigmaArr[index] = invSigma;
    const minScale = stretch < 1 ? stretch : 1;
    minFalloffArr[index] = f32(invSigma * minScale * minScale);
  };

  // Long-range pulse scheduler ----------------------------------------------
  // Periodically declump clusters and pair nearby solos with a short burst.
  type PulseBurst = {
    start: number;
    end: number; // main burst end
    tailEnd: number; // taper end
    tailGain: number; // taper strength scale
    fx: Float32Array; // per-blob force (x) applied as dv += fx[i] * env * dt
    fy: Float32Array; // per-blob force (y)
  };
  const pulseState: {
    nextTime: number;
    burst: PulseBurst | null;
    lastStart: number;
    lastEnd: number;
  } = {
    nextTime:
      LavaLampParams.program.pulses.initialDelay.base +
      rand() * LavaLampParams.program.pulses.initialDelay.jitter,
    burst: null,
    lastStart: -1,
    lastEnd: -1,
  };

  const schedulePulse = (now: number) => {
    pulseState.nextTime =
      now +
      LavaLampParams.program.pulses.interval.base +
      rand() * LavaLampParams.program.pulses.interval.jitter;
  };

  // Compute a burst: find clumps (size ≥ 3) to repel and solo pairs to attract.
  const startPulseBurst = (time: number) => {
    const activeIndices: number[] = [];
    for (let i = 0; i < MAX; i++) if (blobs[i]!.active) activeIndices.push(i);
    if (activeIndices.length === 0) {
      schedulePulse(time);
      return;
    }

    const fx = new Float32Array(MAX);
    const fy = new Float32Array(MAX);

    // Build adjacency by touching threshold
    const touchFactor = LavaLampParams.program.pulses.clump.touchFactor;
    const minClump = Math.max(3, LavaLampParams.program.pulses.clump.minSize);
    const adj: number[][] = [];
    const indexToActiveIdx = new Map<number, number>();
    for (let k = 0; k < activeIndices.length; k++) indexToActiveIdx.set(activeIndices[k]!, k);
    for (let k = 0; k < activeIndices.length; k++) adj[k] = [];
    for (let a = 0; a < activeIndices.length; a++) {
      for (let b = a + 1; b < activeIndices.length; b++) {
        const ia = activeIndices[a]!;
        const ib = activeIndices[b]!;
        const A = blobs[ia]!;
        const B = blobs[ib]!;
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const dist = Math.hypot(dx, dy);
        const rsum = A.r + B.r;
        const touch = dist < rsum * touchFactor;
        let connected = touch;
        if (!connected) {
          const cnf = LavaLampParams.program.pulses.clump.connectNearFactor ?? 1.1;
          const cna = LavaLampParams.program.pulses.clump.connectNearAdd ?? 0.02;
          const nearish = dist < rsum * cnf + cna;
          if (nearish) connected = true;
        }
        if (!connected) {
          const maxf = LavaLampParams.program.pulses.clump.connectMaxFactor ?? 1.45;
          const maxa = LavaLampParams.program.pulses.clump.connectMaxAdd ?? 0.05;
          if (dist < rsum * maxf + maxa) {
            const vPair = saturatedPairMidField(A, B);
            const iso = LavaLampParams.shader.iso;
            const isoFactor = LavaLampParams.program.pulses.clump.isoFactor ?? 0.8;
            if (vPair >= iso * isoFactor) connected = true;
          }
        }
        if (connected) {
          adj[a]!.push(b);
          adj[b]!.push(a);
        }
      }
    }

    // Connected components
    const compId = new Array(activeIndices.length).fill(-1);
    const components: number[][] = [];
    let cid = 0;
    for (let k = 0; k < activeIndices.length; k++) {
      if (compId[k] !== -1) continue;
      const queue = [k];
      compId[k] = cid;
      const comp: number[] = [];
      while (queue.length) {
        const q = queue.pop()!;
        comp.push(q);
        const neighbors = adj[q]!;
        for (let n = 0; n < neighbors.length; n++) {
          const nb = neighbors[n]!;
          if (compId[nb] === -1) {
            compId[nb] = cid;
            queue.push(nb);
          }
        }
      }
      components.push(comp);
      cid++;
    }

    // Identify clumps (size ≥ 3) and solos (size = 1)
    const clumps: number[][] = [];
    const solos: number[] = [];
    for (const comp of components) {
      if (comp.length >= minClump) clumps.push(comp);
      else if (comp.length === 1) solos.push(comp[0]!);
    }
    // Debug: pulse start
    // eslint-disable-next-line no-console
    console.log('[lava] pulse start', {
      t: Number(time.toFixed(2)),
      clumps: clumps.length,
      solos: solos.length,
    });

    // For clumps: repel outward from clump centroid
    const baseRepel = LavaLampParams.program.pulses.clump.repelStrength;
    const sizeGain = LavaLampParams.program.pulses.clump.sizeGain;
    const clumpCentroids: Array<{ x: number; y: number } | null> = new Array(
      components.length,
    ).fill(null);
    for (const comp of clumps) {
      // Weighted centroid by radius (stabilizes when sizes differ)
      let sumX = 0,
        sumY = 0,
        sumW = 0;
      for (const k of comp) {
        const i = activeIndices[k]!;
        const b = blobs[i]!;
        const w = Math.max(1e-4, b.r);
        sumX += b.x * w;
        sumY += b.y * w;
        sumW += w;
      }
      const cx = sumX / Math.max(1e-4, sumW);
      const cy = sumY / Math.max(1e-4, sumW);
      clumpCentroids[compId[comp[0]!]] = { x: cx, y: cy };
      const gain = baseRepel * (1 + sizeGain * Math.max(0, comp.length - minClump));
      for (const k of comp) {
        const i = activeIndices[k]!;
        const b = blobs[i]!;
        let dx = b.x - cx;
        let dy = b.y - cy;
        let d = Math.hypot(dx, dy);
        if (d < 1e-4) {
          // nearly centered → random small direction
          const a = rand() * Math.PI * 2;
          dx = Math.cos(a);
          dy = Math.sin(a);
          d = 1;
        }
        const nx = dx / d;
        const ny = dy / d;
        fx[i] = (fx[i] ?? 0) + nx * gain;
        fy[i] = (fy[i] ?? 0) + ny * gain;
      }
    }

    // Additional pairwise repulsion within each clump to avoid spin-only response
    const pairRepel = LavaLampParams.program.pulses.clump.pairRepelStrength;
    for (const comp of clumps) {
      for (let ai = 0; ai < comp.length; ai++) {
        for (let bi = ai + 1; bi < comp.length; bi++) {
          const ia = activeIndices[comp[ai]!]!;
          const ib = activeIndices[comp[bi]!]!;
          const A = blobs[ia]!;
          const B = blobs[ib]!;
          let dx = B.x - A.x;
          let dy = B.y - A.y;
          let dist = Math.hypot(dx, dy);
          if (dist < 1e-4) {
            dist = 1;
            const a = rand() * Math.PI * 2;
            dx = Math.cos(a);
            dy = Math.sin(a);
          }
          const rsum = Math.max(1e-4, A.r + B.r);
          const overlap = Math.max(0, rsum - dist);
          if (overlap <= 0) continue;
          const nx = dx / dist;
          const ny = dy / dist;
          const w = pairRepel * (overlap / rsum);
          fx[ia] = (fx[ia] ?? 0) - nx * w;
          fy[ia] = (fy[ia] ?? 0) - ny * w;
          fx[ib] = (fx[ib] ?? 0) + nx * w;
          fy[ib] = (fy[ib] ?? 0) + ny * w;
        }
      }
    }

    // For solos: greedy pair nearest solos within window and pull together
    const pairFactor = LavaLampParams.program.pulses.solo.pairFactor;
    const pairAdd = LavaLampParams.program.pulses.solo.pairAdd;
    const pullStrength = LavaLampParams.program.pulses.solo.pullStrength;
    const avoidR = LavaLampParams.program.pulses.solo.avoidClumpRadius;

    type SoloPair = { a: number; b: number; dist: number };
    const candidates: SoloPair[] = [];
    for (let ai = 0; ai < solos.length; ai++) {
      for (let bi = ai + 1; bi < solos.length; bi++) {
        const ia = activeIndices[solos[ai]!]!;
        const ib = activeIndices[solos[bi]!]!;
        const A = blobs[ia]!;
        const B = blobs[ib]!;
        const dx = B.x - A.x;
        const dy = B.y - A.y;
        const dist = Math.hypot(dx, dy);
        const near = dist < (A.r + B.r) * pairFactor + pairAdd;
        if (!near) continue;
        candidates.push({ a: ia, b: ib, dist });
      }
    }
    candidates.sort((p, q) => p.dist - q.dist);
    const used = new Set<number>();

    // Precompute clump centroids (for avoid radius checks)
    const clumpCenters: Array<{ x: number; y: number }> = [];
    for (const comp of clumps) {
      const head = comp[0]!;
      const id = compId[head]!;
      const c = clumpCentroids[id];
      if (c) clumpCenters.push(c);
    }

    for (const { a, b, dist } of candidates) {
      if (used.has(a) || used.has(b)) continue;
      // Avoid pulling a solo into a nearby clump if very close to one
      let nearClump = false;
      for (const c of clumpCenters) {
        if (Math.hypot(blobs[a]!.x - c.x, blobs[a]!.y - c.y) < avoidR) {
          nearClump = true;
          break;
        }
        if (Math.hypot(blobs[b]!.x - c.x, blobs[b]!.y - c.y) < avoidR) {
          nearClump = true;
          break;
        }
      }
      if (nearClump) continue;
      const A = blobs[a]!;
      const B = blobs[b]!;
      const dx = B.x - A.x;
      const dy = B.y - A.y;
      const d = Math.max(1e-4, dist);
      const nx = dx / d;
      const ny = dy / d;
      fx[a] = (fx[a] ?? 0) + nx * pullStrength;
      fy[a] = (fy[a] ?? 0) + ny * pullStrength;
      fx[b] = (fx[b] ?? 0) - nx * pullStrength;
      fy[b] = (fy[b] ?? 0) - ny * pullStrength;
      used.add(a);
      used.add(b);
    }

    const duration = Math.max(0.01, LavaLampParams.program.pulses.burst.duration);
    const tailDuration = Math.max(0, LavaLampParams.program.pulses.burst.tailDuration ?? 0);
    const tailGain = Math.max(0, LavaLampParams.program.pulses.burst.tailGain ?? 0);
    pulseState.burst = {
      start: time,
      end: time + duration,
      tailEnd: time + duration + tailDuration,
      tailGain,
      fx,
      fy,
    };
    pulseState.lastStart = time;
    schedulePulse(time);
  };

  // Public API ---------------------------------------------------------------
  // Resize/update/render/dispose are driven by the wrapper.
  const api: GLProgram = {
    resize: () => {
      // viewport managed by wrapper; no-op here for now
    },
    update: (dt: number, t: number) => {
      currentTime = t;
      // Timed pulse to avoid stagnation
      if (t >= pulseState.nextTime) {
        startPulseBurst(t);
      }
      // Safety: if pulse appears stuck (scheduler far ahead), re‑schedule
      const maxGap =
        LavaLampParams.program.pulses.interval.base +
        LavaLampParams.program.pulses.interval.jitter +
        (LavaLampParams.program.pulses.burst.duration || 0) +
        (LavaLampParams.program.pulses.burst.tailDuration || 0) +
        5;
      if (
        pulseState.lastStart >= 0 &&
        t - pulseState.lastStart > maxGap * 2 &&
        t < pulseState.nextTime &&
        !pulseState.burst
      ) {
        // eslint-disable-next-line no-console
        console.warn('[lava] pulse scheduler: reschedule safety', {
          t: Number(t.toFixed(2)),
          next: Number(pulseState.nextTime.toFixed(2)),
        });
        schedulePulse(t);
      }
      // Apply active pulse burst forces with a soft envelope over 0.2s
      if (pulseState.burst) {
        const { start, end, tailEnd, tailGain, fx, fy } = pulseState.burst;
        if (t < end) {
          const p = Math.max(0, Math.min(1, (t - start) / Math.max(1e-4, end - start)));
          // Smooth main envelope with explicit ease-in and lower amplitude
          const easePow = Math.max(1, LavaLampParams.program.pulses.burst.easeInPow ?? 1.0);
          const mainGain = Math.max(0, LavaLampParams.program.pulses.burst.mainGain ?? 1.0);
          const s = mainGain * Math.sin(Math.PI * p) * Math.pow(p, easePow);
          for (let i = 0; i < MAX; i++) {
            const b = blobs[i]!;
            if (!b.active) continue;
            if (fx[i] !== 0 || fy[i] !== 0) {
              b.vx += fx[i]! * s * dt;
              b.vy += fy[i]! * s * dt;
            }
          }
        } else if (t < tailEnd) {
          // Taper forces after main burst with a smooth ease-out
          const pt = Math.max(0, Math.min(1, (t - end) / Math.max(1e-4, tailEnd - end)));
          const s = tailGain * (1 - pt) * (1 - pt); // quadratic ease-out
          if (s > 0) {
            for (let i = 0; i < MAX; i++) {
              const b = blobs[i]!;
              if (!b.active) continue;
              if (fx[i] !== 0 || fy[i] !== 0) {
                b.vx += fx[i]! * s * dt;
                b.vy += fy[i]! * s * dt;
              }
            }
          }
        } else {
          // eslint-disable-next-line no-console
          console.log('[lava] pulse end', { t: Number(t.toFixed(2)) });
          pulseState.burst = null;
        }
      }

      // Heat/breathing and motion -------------------------------------------
      // Radius breathing via heat, position update via flow + bias + damping.
      // Track center residency to modulate outward pressure to reduce spins.
      for (let i = 0; i < MAX; i++) {
        const b = blobs[i]!;
        if (!b.active) continue;
        b.age += dt;
        const heatTarget = 0.5 + 0.5 * Math.sin(0.4 * t + b.id * 1.7);
        b.heat += (heatTarget - b.heat) * Math.min(1, dt * 0.5);
        let targetR = b.baseR * (0.95 + 0.12 * b.heat);
        if (b.age < 5 && targetR < b.r) targetR = b.r;
        b.r += (targetR - b.r) * Math.min(1, dt * 0.5);

        const distCenter = Math.hypot(b.x, b.y);
        const centerNorm = distCenter > 0 ? clamp01(distCenter / sqBound) : 0;
        const cr = LavaLampParams.program.centerResidency;
        const centerProximity =
          1 - smoothstep(cr.proximityRamp.start, cr.proximityRamp.end, centerNorm);
        if (centerProximity > 0) {
          const accumulation = cr.accumulate.base + centerProximity * cr.accumulate.gain;
          b.centerAccumRate = accumulation;
          b.centerTime = Math.min(cr.accumulate.clamp, b.centerTime + accumulation * dt);
        } else {
          const decayRate = Math.max(cr.decayBase, b.centerAccumRate * cr.decayFactor);
          b.centerTime = Math.max(0, b.centerTime - decayRate * dt);
          b.centerAccumRate = Math.max(0, b.centerAccumRate - decayRate * dt * 0.4);
        }
        const centerRamp = clamp01(b.centerTime / cr.rampScale);

        const wanderX = Math.sin(t * (0.6 + (b.id % 5) * 0.17) + b.id * 2.1) * 0.0035;
        const wanderY = Math.cos(t * (0.5 + (b.id % 7) * 0.13) + b.id * 1.3) * 0.0035;
        const flow = flowField(b.x, b.y, t, b.id);
        b.vx += (wanderX + flow.x) * dt;
        b.vy += (wanderY + flow.y) * dt;

        const targetX = LavaLampParams.program.bias.targetX;
        const targetY = LavaLampParams.program.bias.targetY;
        const dxBias = targetX - b.x;
        const dyBias = targetY - b.y;
        const distBias = Math.hypot(dxBias, dyBias) + 1e-4;
        const baseBias =
          LavaLampParams.program.bias.baseBias *
          clamp01(1.0 - distBias * LavaLampParams.program.bias.distanceFalloff);
        const biasStrength =
          baseBias *
          (LavaLampParams.program.bias.centerMix.min +
            (LavaLampParams.program.bias.centerMix.max -
              LavaLampParams.program.bias.centerMix.min) *
              centerRamp);
        b.vx += (dxBias / distBias) * biasStrength * dt;
        b.vy += (dyBias / distBias) * biasStrength * dt;

        b.vx *= Math.pow(LavaLampParams.program.damping.main, dt * 60);
        b.vy *= Math.pow(LavaLampParams.program.damping.main, dt * 60);
        b.vx *= Math.pow(LavaLampParams.program.damping.extraX, dt * 60);

        const br = pulseState.burst;
        const isBurst = !!br && t < (br.tailEnd ?? br.end);

        const maxSpeed =
          LavaLampParams.program.maxSpeed *
          (isBurst ? (LavaLampParams.program.pulses.burst.speedMultiplier ?? 1) : 1);
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > maxSpeed) {
          const k = maxSpeed / sp;
          b.vx *= k;
          b.vy *= k;
        }

        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // (offscreen force logic removed at user request)

        const k = LavaLampParams.program.boundaryElasticity;
        if (b.x < -sqBound) {
          b.x = -sqBound;
          b.vx = Math.abs(b.vx) * k;
        }
        if (b.x > sqBound) {
          b.x = sqBound;
          b.vx = -Math.abs(b.vx) * k;
        }
        if (b.y < -sqBound) {
          b.y = -sqBound;
          b.vy = Math.abs(b.vy) * k;
        }
        if (b.y > sqBound) {
          b.y = sqBound;
          b.vy = -Math.abs(b.vy) * k;
        }
      }

      // Pairwise collisions and gentle merges ------------------------------
      // Inelastic shove along contact normal; occasional mass merge with
      // area-ish conservation (r^2 ~ mass). Upper radius clamp prevents
      // runaway growth; momentum transferred proportionally.
      const collisionCounts = new Array(MAX).fill(0);
      const collisions: Array<{
        i: number;
        j: number;
        dx: number;
        dy: number;
        dist: number;
        rsum: number;
      }> = [];

      for (let i = 0; i < MAX; i++) {
        const A = blobs[i]!;
        if (!A.active) continue;
        for (let j = i + 1; j < MAX; j++) {
          const B = blobs[j]!;
          if (!B.active) continue;
          const dx = B.x - A.x;
          const dy = B.y - A.y;
          const rsum = A.r + B.r;
          const dist2 = dx * dx + dy * dy;
          if (dist2 < rsum * rsum) {
            const dist = Math.max(1e-4, Math.sqrt(dist2));
            collisionCounts[i]++;
            collisionCounts[j]++;
            collisions.push({ i, j, dx, dy, dist, rsum });
          }
        }
      }

      for (const { i, j, dx, dy, dist, rsum } of collisions) {
        const A = blobs[i]!;
        const B = blobs[j]!;
        if (!A.active || !B.active) continue;
        const nx = dx / dist;
        const ny = dy / dist;
        const overlap = rsum - dist;
        const shoveScale = pulseState.burst
          ? (LavaLampParams.program.pulses.burst.shoveScale ?? 1)
          : 1;
        const push = overlap * LavaLampParams.program.collisions.shove * shoveScale;
        A.x -= nx * push;
        A.y -= ny * push;
        B.x += nx * push;
        B.y += ny * push;

        const va = A.vx * nx + A.vy * ny;
        const vb = B.vx * nx + B.vy * ny;
        const p = (vb - va) * LavaLampParams.program.collisions.impulse;
        A.vx += nx * p;
        A.vy += ny * p;
        B.vx -= nx * p;
        B.vy -= ny * p;

        if (collisionCounts[i] === 1 && collisionCounts[j] === 1) {
          const contact = clamp01(overlap / Math.max(1e-4, rsum));
          let gravity = LavaLampParams.program.collisions.gravity.base * contact;
          if (pulseState.burst) {
            gravity *= LavaLampParams.program.pulses.burst.gravityScale ?? 1;
          }
          if (contact > LavaLampParams.program.collisions.gravity.boostThreshold) {
            gravity *= LavaLampParams.program.collisions.gravity.boost;
          }
          A.vx += nx * gravity;
          A.vy += ny * gravity;
          B.vx -= nx * gravity;
          B.vy -= ny * gravity;
        }

        const allowMergeDuringBurst = LavaLampParams.program.pulses.burst.allowMerge ?? true;
        if (
          overlap > LavaLampParams.program.merging.overlapRatio * Math.min(A.r, B.r) &&
          (i + j + (Math.floor(t) % 7)) % 5 === 0 &&
          (!pulseState.burst || allowMergeDuringBurst)
        ) {
          const massA = A.r * A.r;
          const massB = B.r * B.r;
          const mass = massA + massB;
          const newR = Math.sqrt(mass);
          A.r = Math.min(newR, LavaLampParams.program.merging.radiusClamp);
          A.baseR = A.r;
          A.vx = (A.vx * massA + B.vx * massB) / Math.max(1e-4, mass);
          A.vy = (A.vy * massA + B.vy * massB) / Math.max(1e-4, mass);
          B.active = false;
          B.r = 0.0;
          B.centerTime = 0;
          B.centerAccumRate = 0;
        }
      }

      // During pulse burst, enforce separation constraints within detected clumps
      if (pulseState.burst) {
        // Rebuild adjacency and components (mirrors startPulseBurst)
        const activeIdx: number[] = [];
        for (let i = 0; i < MAX; i++) if (blobs[i]!.active) activeIdx.push(i);
        const touchFactor = LavaLampParams.program.pulses.clump.touchFactor;
        const minClump = Math.max(3, LavaLampParams.program.pulses.clump.minSize);
        const adj: number[][] = [];
        for (let k = 0; k < activeIdx.length; k++) adj[k] = [];
        for (let a = 0; a < activeIdx.length; a++) {
          for (let b = a + 1; b < activeIdx.length; b++) {
            const ia = activeIdx[a]!;
            const ib = activeIdx[b]!;
            const A = blobs[ia]!;
            const B = blobs[ib]!;
            const dx = B.x - A.x;
            const dy = B.y - A.y;
            const dist = Math.hypot(dx, dy);
            const rsum = A.r + B.r;
            const touch = dist < rsum * touchFactor;
            let connected = touch;
            if (!connected) {
              const cnf = LavaLampParams.program.pulses.clump.connectNearFactor ?? 1.1;
              const cna = LavaLampParams.program.pulses.clump.connectNearAdd ?? 0.02;
              const nearish = dist < rsum * cnf + cna;
              if (nearish) connected = true;
            }
            if (!connected) {
              const maxf = LavaLampParams.program.pulses.clump.connectMaxFactor ?? 1.45;
              const maxa = LavaLampParams.program.pulses.clump.connectMaxAdd ?? 0.05;
              if (dist < rsum * maxf + maxa) {
                const vPair = saturatedPairMidField(A, B);
                const iso = LavaLampParams.shader.iso;
                const isoFactor = LavaLampParams.program.pulses.clump.isoFactor ?? 0.8;
                if (vPair >= iso * isoFactor) connected = true;
              }
            }
            if (connected) {
              adj[a]!.push(b);
              adj[b]!.push(a);
            }
          }
        }
        const compId = new Array(activeIdx.length).fill(-1);
        const comps: number[][] = [];
        let cc = 0;
        for (let k = 0; k < activeIdx.length; k++) {
          if (compId[k] !== -1) continue;
          const q: number[] = [k];
          compId[k] = cc;
          const comp: number[] = [];
          while (q.length) {
            const u = q.pop()!;
            comp.push(u);
            for (const v of adj[u]!) {
              if (compId[v] === -1) {
                compId[v] = cc;
                q.push(v);
              }
            }
          }
          comps.push(comp);
          cc++;
        }
        const sepFactor = LavaLampParams.program.pulses.clump.sepFactor;
        const iters = Math.max(1, LavaLampParams.program.pulses.clump.solverIters | 0);
        const brs = pulseState.burst!;
        // Smooth ramp to avoid visible jumps at pulse start
        const prog = Math.max(
          0,
          Math.min(
            1,
            (t - (brs?.start ?? t)) / Math.max(1e-4, (brs?.end ?? t + 1) - (brs?.start ?? t)),
          ),
        );
        const ramp = prog * prog; // ease-in
        const alpha = 0.25; // modest per-frame strength
        const maxStep = 0.006; // cap per-pair correction per iteration
        // Run a few iterations of position-based separation on large components
        for (const comp of comps) {
          if (comp.length < minClump) continue;
          for (let it = 0; it < iters; it++) {
            for (let ai = 0; ai < comp.length; ai++) {
              for (let bi = ai + 1; bi < comp.length; bi++) {
                const ia = activeIdx[comp[ai]!]!;
                const ib = activeIdx[comp[bi]!]!;
                const A = blobs[ia]!;
                const B = blobs[ib]!;
                let dx = B.x - A.x;
                let dy = B.y - A.y;
                let dist = Math.hypot(dx, dy);
                const desired = (A.r + B.r) * sepFactor;
                if (dist < 1e-5) {
                  dist = 1e-5;
                  const ang = rand() * Math.PI * 2;
                  dx = Math.cos(ang) * dist;
                  dy = Math.sin(ang) * dist;
                }
                if (dist < desired && ramp > 0) {
                  const nx = dx / dist;
                  const ny = dy / dist;
                  let delta = 0.5 * (desired - dist) * alpha * ramp;
                  if (delta > maxStep) delta = maxStep;
                  A.x -= nx * delta;
                  A.y -= ny * delta;
                  B.x += nx * delta;
                  B.y += ny * delta;
                  // Gentle normal velocity correction, also ramped
                  const vrel = (A.vx - B.vx) * nx + (A.vy - B.vy) * ny;
                  if (vrel < 0) {
                    const imp = -vrel * 0.25 * ramp;
                    A.vx += nx * imp;
                    A.vy += ny * imp;
                    B.vx -= nx * imp;
                    B.vy -= ny * imp;
                  }
                  // Bound clamp
                  A.x = Math.max(-sqBound, Math.min(sqBound, A.x));
                  A.y = Math.max(-sqBound, Math.min(sqBound, A.y));
                  B.x = Math.max(-sqBound, Math.min(sqBound, B.x));
                  B.y = Math.max(-sqBound, Math.min(sqBound, B.y));
                }
              }
            }
          }
        }
      }

      // Occasionally split a hot blob into two -----------------------------
      // Counterbalances merging and sustains visual variety.
      if (
        (Math.floor(t * LavaLampParams.program.splitting.periodFreq) +
          LavaLampParams.program.splitting.phase) %
          LavaLampParams.program.splitting.mod ===
        0
      ) {
        let big = -1,
          slot = -1,
          bigR = 0;
        for (let i = 0; i < MAX; i++) {
          const bi = blobs[i]!;
          if (bi.active && bi.r > bigR) {
            bigR = bi.r;
            big = i;
          }
          if (!bi.active && slot === -1) slot = i;
        }
        if (
          big !== -1 &&
          slot !== -1 &&
          blobs[big]!.r > LavaLampParams.program.splitting.thresholdRadius
        ) {
          const b = blobs[big]!;
          const childR = b.r * LavaLampParams.program.splitting.childRatio;
          b.r = b.r * LavaLampParams.program.splitting.parentShrink;
          const nx = Math.sin(t + b.id) * 0.5;
          const ny = Math.cos(t * 0.9 + b.id * 1.3) * 0.5;
          const off =
            LavaLampParams.program.splitting.offset.base +
            rand() * LavaLampParams.program.splitting.offset.jitter;
          blobs[slot]! = {
            x: b.x + nx * off,
            y: b.y + ny * off,
            vx: b.vx - ny * 0.02,
            vy: b.vy + nx * 0.02,
            r: childR,
            active: true,
            heat: Math.min(1, b.heat + 0.2),
            id: slot,
            baseR: childR,
            age: 0,
            centerTime: 0,
            centerAccumRate: 0,
          };
        }
      }

      // Recycle inactive blobs occasionally at the bottom ------------------
      // Keeps population from dwindling after many merges.
      for (let i = 0; i < MAX; i++) {
        const b = blobs[i]!;
        if (!b.active && rand() < LavaLampParams.program.recycle.probability) {
          blobs[i]! = spawnBlob(i, {
            x: (rand() - 0.5) * LavaLampParams.program.recycle.spanX,
            y: LavaLampParams.program.recycle.spawnY,
            r:
              LavaLampParams.program.recycle.radius.min +
              rand() * LavaLampParams.program.recycle.radius.jitter,
          });
        }
      }
    },
    render: () => {
      // Upload per-frame uniforms and draw full-screen triangle
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      // `uTime` is set by wrapper before render via update(t)
      // but we still set it here based on a derived time if needed.
      // The wrapper will set it explicitly for determinism.
      // gl.uniform1f(uTime, performance.now() * 0.001);

      // Pack active blob data (square space coordinates already)
      const time = currentTime;
      let count = 0;
      for (let i = 0; i < MAX && count < 64; i++) {
        const b = blobs[i]!;
        if (!b.active) continue;
        centersArr[count * 2 + 0] = f32(b.x);
        centersArr[count * 2 + 1] = f32(b.y);
        radiiArr[count] = f32(b.r);
        updateBlobFieldParams(count, b.x, b.y, b.r, time);
        count++;
      }
      gl.uniform1i(uCount, count);
      gl.uniform2fv(uCenters, centersArr);
      if (uRadii) gl.uniform1fv(uRadii, radiiArr);
      if (uRotRow0) gl.uniform2fv(uRotRow0, rotRow0Arr);
      if (uRotRow1) gl.uniform2fv(uRotRow1, rotRow1Arr);
      if (uInvSigma) gl.uniform1fv(uInvSigma, invSigmaArr);
      if (uMinFalloff) gl.uniform1fv(uMinFalloff, minFalloffArr);
      if (uCutThreshold) gl.uniform1f(uCutThreshold, LavaLampParams.shader.cutThreshold);

      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      gl.useProgram(null);
    },
    dispose: () => {
      // Release GPU resources
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    },
  };

  // Return wrapped program with uniform setter for time via closure
  // We expose a small shim to set `uTime` just-in-time in the wrapper for
  // deterministic timelines without exposing program internals.
  const setTime = (t: number) => {
    currentTime = t;
    gl.useProgram(prog);
    gl.uniform1f(uTime, t);
    gl.useProgram(null);
  };

  // Monkey-patch a tiny helper property on the object for the wrapper
  // Typescript: augmenting object with a symbol-less property is fine in JS usage.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (api as any)._setTime = setTime;

  // Apply static shader parameters once -------------------------------------
  const sp = LavaLampParams;
  gl.useProgram(prog);
  gl.uniform3f(uBgColor, sp.shader.bgColor[0], sp.shader.bgColor[1], sp.shader.bgColor[2]);
  gl.uniform1f(uIso, sp.shader.iso);
  gl.uniform1f(uBand, sp.shader.band);
  gl.uniform1f(uNormalZ, sp.shader.normalZ);
  gl.uniform3f(uLightDir, sp.shader.lightDir[0], sp.shader.lightDir[1], sp.shader.lightDir[2]);
  gl.uniform1f(uSpecPower, sp.shader.specular.power);
  gl.uniform1f(uSpecIntensity, sp.shader.specular.intensity);
  gl.uniform1f(uRimPower, sp.shader.rim.power);
  gl.uniform3f(uRampC1, sp.shader.ramp.c1[0], sp.shader.ramp.c1[1], sp.shader.ramp.c1[2]);
  gl.uniform3f(uRampC2, sp.shader.ramp.c2[0], sp.shader.ramp.c2[1], sp.shader.ramp.c2[2]);
  gl.uniform3f(uRampC3, sp.shader.ramp.c3[0], sp.shader.ramp.c3[1], sp.shader.ramp.c3[2]);
  gl.uniform3f(uRampC4, sp.shader.ramp.c4[0], sp.shader.ramp.c4[1], sp.shader.ramp.c4[2]);
  gl.uniform3f(uRampC5, sp.shader.ramp.c5[0], sp.shader.ramp.c5[1], sp.shader.ramp.c5[2]);
  gl.uniform1f(uRamp1Start, sp.shader.ramp.k1.start);
  gl.uniform1f(uRamp1End, sp.shader.ramp.k1.end);
  gl.uniform1f(uRamp2Start, sp.shader.ramp.k2.start);
  gl.uniform1f(uRamp2End, sp.shader.ramp.k2.end);
  gl.uniform1f(uRamp3Start, sp.shader.ramp.k3.start);
  gl.uniform1f(uRamp3End, sp.shader.ramp.k3.end);
  gl.uniform1f(uRamp4Start, sp.shader.ramp.k4.start);
  gl.uniform1f(uRamp4End, sp.shader.ramp.k4.end);
  gl.uniform1f(uRamp5Mix, sp.shader.ramp.mix5);
  gl.uniform1f(uCenterMaskStart, sp.shader.center.mask.start);
  gl.uniform1f(uCenterMaskEnd, sp.shader.center.mask.end);
  gl.uniform1f(uCenterStrongStart, sp.shader.center.strong.start);
  gl.uniform1f(uCenterStrongEnd, sp.shader.center.strong.end);
  gl.uniform1f(uPlateau, sp.shader.center.plateau);
  gl.uniform1f(uCStrongStart, sp.shader.center.localSmooth.cStrong.start);
  gl.uniform1f(uCStrongEnd, sp.shader.center.localSmooth.cStrong.end);
  gl.uniform1f(uLocalSmoothPx, sp.shader.center.localSmooth.pxScale);
  gl.uniform1f(uLocalSmoothBlend, sp.shader.center.localSmooth.blend);
  gl.uniform1f(uHotMaskStart, sp.shader.hot.mask.start);
  gl.uniform1f(uHotMaskEnd, sp.shader.hot.mask.end);
  gl.uniform1f(uHotBlendStrength, sp.shader.hot.strength);
  gl.uniform3f(uHotA, sp.shader.hot.a[0], sp.shader.hot.a[1], sp.shader.hot.a[2]);
  gl.uniform3f(uHotB, sp.shader.hot.b[0], sp.shader.hot.b[1], sp.shader.hot.b[2]);
  gl.uniform3f(
    uFlowTintColor,
    sp.shader.flowTint.color[0],
    sp.shader.flowTint.color[1],
    sp.shader.flowTint.color[2],
  );
  gl.uniform1f(uFlowTintGain, sp.shader.flowTint.gain);
  gl.uniform1f(uFlowCenterSuppress, sp.shader.flowTint.centerSuppression);
  gl.uniform3f(
    uVeilColor,
    sp.shader.veil.color[0],
    sp.shader.veil.color[1],
    sp.shader.veil.color[2],
  );
  gl.uniform1f(uVeilGainBase, sp.shader.veil.gainBase);
  gl.uniform1f(uVeilGainNoise, sp.shader.veil.gainNoise);
  gl.uniform1f(uVeilMaskScale, sp.shader.veil.maskScale);
  gl.uniform1f(uBaseDesaturate, sp.shader.veil.baseDesaturate);
  gl.uniform1f(uVeilMix, sp.shader.veil.mix);
  gl.uniform1f(uGlowWidth, sp.shader.glow.width);
  gl.uniform1f(uGlowGain, sp.shader.glow.gain);
  gl.uniform3f(
    uGlowColor,
    sp.shader.glow.color[0],
    sp.shader.glow.color[1],
    sp.shader.glow.color[2],
  );
  gl.uniform1f(uVignetteK, sp.shader.vignette.k);
  gl.useProgram(null);

  return api;
}
