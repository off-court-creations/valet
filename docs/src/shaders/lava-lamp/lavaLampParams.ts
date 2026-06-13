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
    timeScale: 0.8,
    // Clamp device pixel ratio to avoid excessive fill‑rate on hi‑DPI screens.
    dprMax: 2,
  },

  // CPU‑side simulation and orchestration (LavaLampProgram.ts)
  program: {
    // Population and world bounds (square space mapping used in shader)
    maxBlobs: 13,
    squareBound: 0.99,
    // Deterministic session seed (change to vary default motion patterns)
    seed: 123,

    // Initial placement tries to keep blobs apart to reduce early jitter.
    initialScatter: {
      minInitialSpacing: 0.4,
      minSpacingFloor: 0.28,
      maxPlacementAttempts: 48,
      // Spawn properties
      baseRadius: { min: 0.1, jitter: 0.2 },
      areaExtent: 1.6, // initial x/y extent in square space
      baseSpeed: { min: 0.02, jitter: 0.02 },
      jitterScale: 0.08,
    },

    // Background flow field composing gentle forces.
    flow: {
      // Inward edge pressure (pulls from edges back toward center)
      edgePull: { start: 0.68, end: 0.98, radialIn: 0.03, xScale: 2.0, yScale: 1.0 },
      // Horizontal compression near vertical sides
      edgeCompression: {
        start: 0.55,
        end: 0.95,
        horizEaseX: 0.6,
        horizEaseY: 0.4,
        strength: 0.032,
      },
      // Moving drain/swirl attractor (position and strength vary over time)
      drain: {
        x: { amp: 0.14, freq: 0.12, bias: 0.06 },
        y: { base: -0.18, amp: 0.08, freq: 0.1, idPhase: 0.35 },
        swirlEnvelope: { base: 0.016, gain: 0.022, start: 0.1, end: 0.9 },
        swirlPulse: { base: 0.6, gain: 0.3, freq: 0.45, idPhase: 1.7 },
      },
      // Small eddies + slight rightward/up bias to avoid static equilibria
      eddies: {
        seedFreq: 1.8,
        xFreq: 3.1,
        yFreq: 2.6,
        strength: 0.0048,
        bias: { vx: 0.0012, vy: 0.0008 },
      },
    },

    // Long‑range pulse that periodically declumps and pairs solos.
    pulses: {
      // For testing: immediate start, then every 15s with no jitter
      initialDelay: { base: 12, jitter: 6 },
      interval: { base: 32, jitter: 12 },
      // Longer burst so separation completes (per‑frame force, smooth envelope)
      burst: {
        duration: 2.4,
        tailDuration: 0.8,
        tailGain: 0.1,
        mainGain: 0.13,
        easeInPow: 2.0, // stronger ease-in (slower ramp-up)
        speedMultiplier: 3.5,
        shoveScale: 0.95,
        gravityScale: 0.0, // disable collision gravity during burst
        allowMerge: true,
      },
      // Clump busting (components of size ≥ 3)
      clump: {
        minSize: 3,
        touchFactor: 1.02, // consider touching if dist < (ri + rj) * touchFactor
        repelStrength: 1.2,
        sizeGain: 0.06,
        pairRepelStrength: 1.8,
        sepFactor: 1.05,
        solverIters: 3,
        // Broader connectivity detection so "caterpillar" chains count as clumps
        connectNearFactor: 1.1, // tighter near-connect
        connectNearAdd: 0.02,
        connectMaxFactor: 1.45, // cap bridge consideration distance
        connectMaxAdd: 0.05,
        isoFactor: 0.8, // consider connected if pair field at midpoint >= iso*isoFactor
      },
      // Solo pairing (greedy nearest matching)
      solo: {
        pairFactor: 1.25, // near if dist < (ri + rj) * pairFactor + pairAdd
        pairAdd: 0.04,
        pullStrength: 1.1,
        avoidClumpRadius: 0.35, // skip if too close to a clump centroid
      },
    },

    // Gentle bias toward an off‑center target to keep motion scenic.
    bias: {
      targetX: 0.0,
      targetY: -0.34,
      baseBias: 0.0035,
      distanceFalloff: 0.55,
      centerMix: { min: 0.6, max: 1.0 },
    },

    // Damping and limits
    damping: { main: 0.962, extraX: 0.95 }, // per‑frame exponent base (raised to dt*60)
    maxSpeed: 0.024,
    boundaryElasticity: 0.92, // 1 = perfectly elastic, <1 loses energy

    // Offscreen force logic removed per request

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

    // Volumetric shaping -----------------------------------------------------
    // These values work with the saturated Gaussian union in the fragment shader:
    // - `thicknessGain` maps the unsaturated energy (sumK) into a stable 0..1 “thickness”.
    // - `absorption` applies a Beer–Lambert-ish attenuation to warm and deepen cores.
    volume: {
      thicknessGain: 0.8,
      absorption: 0.35,
    },

    // Soft “lamp” emission from the bottom (adds believable depth without harsh spec)
    lamp: {
      pos: [0.0, -0.84] as const,
      radius: 1.05,
      gain: 0.55,
      color: [1.25, 0.62, 0.24] as const,
    },

    // Edge bloom + vignette --------------------------------------------------
    // Bloom is computed from a pixel-space distance proxy (fwidth-based), so this
    // is stable across DPIs and sizes.
    glow: { sigmaPx: 18, alpha: 0.18, chromaticPx: 1.15, color: [0.9, 0.22, 0.11] as const },

    // Thin shell highlight (glassy wax interface) ---------------------------
    shell: {
      sigmaPx: 1.75,
      intensity: 0.12,
      specular: { power: 72, intensity: 0.14 },
      color: [0.28, 0.42, 0.78] as const,
      iridescence: 0.14,
    },

    // Cool fill light (subtle cinematic depth) ------------------------------
    fill: {
      dir: [-0.55, 0.65, 0.75] as const,
      color: [0.28, 0.42, 0.75] as const,
      gain: 0.22,
    },

    vignette: { k: 1.3 },

    // Post -------------------------------------------------------------------
    post: {
      // Small, 8-bit-like dithering to reduce banding after compositing.
      dither: 0.75,
      // Body alpha cap (lets the hero background gradient show through subtly).
      alphaMax: 0.95,
      grade: { saturation: 1.08, contrast: 1.08 },
    },
    // Field evaluation cutoff controlling far-blob culling accuracy
    cutThreshold: 11.512925464970229, // ≈ -ln(1e-5)
  },
} as const;

export type LavaLampParamsType = typeof LavaLampParams;
