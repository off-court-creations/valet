// ─────────────────────────────────────────────────────────────
// src/shaders/lava-lamp/lavaLampParams.ts  | valet-docs
// Centralized, well‑documented parameters for the lava‑lamp renderer.
//
// How to tune safely
// - Prefer small, incremental changes and test at multiple DPIs and sizes.
// - Keep values smooth/continuous where possible (avoid hard discontinuities).
// - When in doubt, bias toward calmer motion and softer ramps.
//
// Parameter groups
// - runtime: frame scaling and device limits used by the React wrapper.
// - program: CPU‑side physics and orchestration (flow, pulses, damping…).
// - shader: visual look of the blobs (ramps, thresholds, lighting…).
//
// Notes
// - All values reflect the current tuned look. Changing them will alter
//   visuals; consider saving presets when exploring.
// - Colors are linear-ish for stylistic control; final tone mapping is ACES.
// ─────────────────────────────────────────────────────────────

export const LavaLampParams = {
  // Frame timing and device constraints used by the WebGL canvas wrapper.
  runtime: {
    // Scales world time to slow overall motion without changing character.
    timeScale: 0.6,
    // Clamp device pixel ratio to avoid excessive fill‑rate on hi‑DPI screens.
    dprMax: 2,
  },

  // CPU‑side simulation and orchestration (LavaLampProgram.ts)
  program: {
    // Population and world bounds (square space mapping used in shader)
    maxBlobs: 5,
    squareBound: 0.95,
    // Deterministic session seed (change to vary default motion patterns)
    seed: 2100,

    // Initial placement tries to keep blobs apart to reduce early jitter.
    initialScatter: {
      minInitialSpacing: 0.58,
      minSpacingFloor: 0.28,
      maxPlacementAttempts: 48,
      // Spawn properties
      baseRadius: { min: 0.3, jitter: 0.08 },
      areaExtent: 1.6, // initial x/y extent in square space
      baseSpeed: { min: 0.03, jitter: 0.03 },
      jitterScale: 0.08,
    },

    // Background flow field composing gentle forces.
    flow: {
      // Inward edge pressure (pulls from edges back toward center)
      edgePull: { start: 0.68, end: 0.98, radialIn: 0.04, xScale: 2.0, yScale: 1.0 },
      // Horizontal compression near vertical sides
      edgeCompression: {
        start: 0.55,
        end: 0.95,
        horizEaseX: 0.6,
        horizEaseY: 0.4,
        strength: 0.045,
      },
      // Moving drain/swirl attractor (position and strength vary over time)
      drain: {
        x: { amp: 0.14, freq: 0.12, bias: 0.06 },
        y: { base: -0.18, amp: 0.08, freq: 0.1, idPhase: 0.35 },
        swirlEnvelope: { base: 0.02, gain: 0.03, start: 0.1, end: 0.9 },
        swirlPulse: { base: 0.65, gain: 0.35, freq: 0.45, idPhase: 1.7 },
      },
      // Small eddies + slight rightward/up bias to avoid static equilibria
      eddies: {
        seedFreq: 1.8,
        xFreq: 3.1,
        yFreq: 2.6,
        strength: 0.0065,
        bias: { vx: 0.0015, vy: 0.001 },
      },
    },

    // Long‑range pulse that periodically reshapes overall configuration.
    pulses: {
      initialDelay: { base: 20, jitter: 40 },
      interval: { base: 30, jitter: 30 },
      pairAttract: { base: 1.25, jitter: 1.75, pullNumerator: 0.035, pullDenominatorBias: 0.22 },
      crowdRepel: {
        weightNumerator: 0.034,
        weightDenominatorBias: 0.14,
        swirlFreq: 0.45,
        pairScaleMin: 0.85,
        pairScaleJitter: 0.3,
        jitter: 0.0025,
      },
    },

    // Gentle bias toward an off‑center target to keep motion scenic.
    bias: {
      targetX: 0.0,
      targetY: -0.34,
      baseBias: 0.0045,
      distanceFalloff: 0.55,
      centerMix: { min: 0.6, max: 1.0 },
    },

    // Damping and limits
    damping: { main: 0.965, extraX: 0.95 }, // per‑frame exponent base (raised to dt*60)
    maxSpeed: 0.03,
    boundaryElasticity: 0.92, // 1 = perfectly elastic, <1 loses energy

    // Center residency accumulation (reduces spins by blending outward pressure)
    centerResidency: {
      proximityRamp: { start: 0.18, end: 0.42 },
      accumulate: { base: 0.35, gain: 1.35, clamp: 9.0 },
      decayBase: 0.9,
      decayFactor: 3.0,
      rampScale: 6.75,
    },

    // Collisions and merges
    collisions: {
      shove: 0.08, // push along contact normal proportional to overlap
      impulse: 0.15, // inelastic impulse scalar along normal
      gravity: { base: 0.018, boostThreshold: 0.34, boost: 5.0 },
    },
    merging: {
      overlapRatio: 0.5, // threshold vs min(radius)
      radiusClamp: 0.28, // cap merged radius
    },
    splitting: {
      // Pseudo‑periodic split opportunity; keeps population lively
      periodFreq: 0.33,
      phase: 17,
      mod: 5,
      thresholdRadius: 0.14,
      childRatio: 0.65,
      parentShrink: 0.75,
      offset: { base: 0.02, jitter: 0.03 },
    },
    recycle: { probability: 0.02, spawnY: -0.9, radius: { min: 0.08, jitter: 0.05 }, spanX: 0.8 },
  },

  // GPU‑side appearance (LavaLampBackgroundGL.frag)
  shader: {
    // Solid background color (linear 0..1). Example: #363636 ≈ 0.212
    bgColor: [0.212, 0.212, 0.212] as const,
    // Field threshold and edge band softness
    iso: 0.45,
    band: 0.02,
    // Surface normal shaping (flatter Z reduces dome‑like speculars)
    normalZ: 0.55,
    // Lighting controls
    lightDir: [0.6, 0.5, 0.6] as const,
    specular: { power: 8.0, intensity: 0.18 },
    rim: { power: 2.0 },

    // Color ramp across the field (deep → hot)
    ramp: {
      c1: [0.05, 0.01, 0.08] as const,
      c2: [0.18, 0.0, 0.18] as const,
      c3: [0.78, 0.16, 0.05] as const,
      c4: [1.05, 0.74, 0.18] as const,
      c5: [1.12, 0.52, 0.08] as const,
      k1: { start: 0.04, end: 0.32 },
      k2: { start: 0.24, end: 0.66 },
      k3: { start: 0.5, end: 0.94 },
      k4: { start: 0.62, end: 0.98 },
      mix5: 0.65,
    },

    // Core flattening and center detection
    center: {
      plateau: 0.62,
      mask: { start: 0.02, end: 0.25 },
      strong: { start: 0.03, end: 0.2 },
      localSmooth: { pxScale: 2.0, cStrong: { start: 0.6, end: 1.0 }, blend: 0.85 },
    },

    // Hot interior blend and tint from flow
    hot: {
      mask: { start: 0.72, end: 0.95 },
      strength: 0.38,
      a: [1.1, 0.46, 0.1] as const,
      b: [1.02, 0.82, 0.32] as const,
    },
    flowTint: {
      color: [0.9, 0.35, 0.1] as const,
      gain: 0.22,
      centerSuppression: 0.85,
    },

    // Thin translucent veil to soften deep cores
    veil: {
      color: [0.96, 0.42, 0.18] as const,
      gainBase: 0.04,
      gainNoise: 0.02,
      maskScale: 0.5,
      baseDesaturate: 0.06,
      mix: 0.55,
    },

    // Edge bloom and vignette
    glow: { width: 0.25, gain: 0.7, color: [0.8, 0.2, 0.1] as const },
    vignette: { k: 1.3 },
  },
} as const;

export type LavaLampParamsType = typeof LavaLampParams;
