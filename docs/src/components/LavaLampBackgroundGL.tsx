// ─────────────────────────────────────────────────────────────
// src/components/LavaLampBackgroundGL.tsx  | valet-docs
// Hero background – WebGL2 full‑screen lava lamp metaballs
// Renamed from SpinningPyramidGL → MetaballsHeroGL → LavaLampBackgroundGL for clarity
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';

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
    if (!gl) {
      return; // WebGL2 unavailable → no background
    }

    // Small typed helpers
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

    // Full‑screen triangle shaders
    const vsSrc = `#version 300 es\n\
precision highp float;\n\
layout (location = 0) in vec2 aPos;\n\
out vec2 vUV;\n\
void main(){\n\
  vUV = aPos * 0.5 + 0.5;\n\
  gl_Position = vec4(aPos, 0.0, 1.0);\n\
}`;

    // A carefully tuned lava lamp shader:
    // - Metaball field (inverse-square) with soft threshold
    // - Surface normal from screen‑space gradient
    // - Fiery ramp + subsurface hue shift
    // - Interior flow via FBM noise warping
    // - Rim light, specular, vignette, filmic tonemap
    const fsSrc = `#version 300 es\n\
precision highp float;\n\
out vec4 outColor;\n\
in vec2 vUV;\n\
uniform vec2 uResolution;\n\
uniform float uTime;\n\
uniform int uCount;\n\
// Packed into float arrays for WebGL ES compatibility\n\
uniform vec2 uCenters[64];\n\
uniform float uRadii[64];\n\
// Utility: hash and value noise\n\
float hash11(float p){\n\
  p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p);\n\
}\n\
float hash21(vec2 p){\n\
  vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z);\n\
}\n\
float noise(vec2 p){\n\
  vec2 i = floor(p); vec2 f = fract(p);\n\
  float a = hash21(i + vec2(0,0));\n\
  float b = hash21(i + vec2(1,0));\n\
  float c = hash21(i + vec2(0,1));\n\
  float d = hash21(i + vec2(1,1));\n\
  vec2 u = f*f*(3.0-2.0*f);\n\
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);\n\
}\n\
float fbm(vec2 p){\n\
  float s = 0.0; float a = 0.5; mat2 m = mat2(1.6, -1.2, 1.2, 1.6);\n\
  for(int i=0;i<5;i++){ s += a * noise(p); p = m * p; a *= 0.5; }\n\
  return s;\n\
}\n\
// Color ramp for molten wax\n\
vec3 lavaRamp(float t){\n\
  // t in [0,1] – deep purple -> crimson -> orange -> yellow\n\
  vec3 c1 = vec3(0.05, 0.01, 0.08);\n\
  vec3 c2 = vec3(0.18, 0.00, 0.18);\n\
  vec3 c3 = vec3(0.78, 0.16, 0.05);\n\
  vec3 c4 = vec3(1.05, 0.74, 0.18);\n\
  vec3 c5 = vec3(1.12, 0.52, 0.08);\n\
  float k1 = smoothstep(0.04, 0.32, t);\n\
  float k2 = smoothstep(0.28, 0.66, t);\n\
  float k3 = smoothstep(0.58, 0.94, t);\n\
  float k4 = smoothstep(0.74, 0.98, t);\n\
  vec3 c = mix(c1, c2, k1);\n\
  c = mix(c, c3, k2);\n\
  c = mix(c, c4, k3);\n\
  c = mix(c, c5, k4 * 0.65);\n\
  return c;\n\
}\n\
// Compute metaball field using saturated Gaussian union (no center peaks)\n\
float field(vec2 p, out float edge){\n\
  float sumK = 0.0;\n\
  for(int i=0;i<64;i++){\n\
    if(i>=uCount) break;\n\
    vec2 c = uCenters[i]; float r = uRadii[i];\n\
    // Per-blob anisotropy (break radial symmetry)\n\
    vec2 d = p - c;\n\
    float ang = noise(c * 3.173 + vec2(uTime * 0.15)) * 6.2831853;\n\
    float cs = cos(ang), sn = sin(ang);\n\
    mat2 R = mat2(cs, -sn, sn, cs);\n\
    vec2 a = R * d;\n\
    float stretch = mix(0.6, 1.4, noise(c * 4.7 + vec2(uTime * 0.12)));\n\
    a *= vec2(1.0, stretch);\n\
    float dist2 = dot(a,a);\n\
    float sigma = r*r*1.6 + 1e-6;\n\
    float k = exp(-dist2 / sigma);\n\
    sumK += k;\n\
  }\n\
  // Saturated union: flat cores, smooth merges, bounded to [0,1)\n\
  float v = 1.0 - exp(-sumK);\n\
  edge = sumK;\n\
  return v;\n\
}\n\
// ACES tone map
vec3 aces(vec3 x){\n\
  const float a=2.51; const float b=0.03; const float c=2.43; const float d=0.59; const float e=0.14;\n\
  return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);\n\
}\n\
void main(){\n\
  vec2 res = uResolution;\n\
  // Centered square space so blob centers span full background\n\
  vec2 uv = ((vUV * res) - 0.5 * res) / min(res.x, res.y);\n\
  // Coarse warp to break symmetry and add nebula wobble\n\
  vec2 uvw = uv + 0.04 * vec2(noise(uv * 1.35 + vec2(0.0, uTime * 0.035)),\n\
                               noise(uv * 1.35 + vec2(uTime * 0.028, 0.0)));\n\
  // Background gradient (cool glass)\n\
  float bgV = smoothstep(-0.9, 0.9, uv.y) * 0.7;\n\
  vec3 bg = mix(vec3(0.03,0.02,0.06), vec3(0.06,0.05,0.10), bgV);\n\
  // Metaball field and thresholding
  float edge; float f = field(uvw, edge);\n\
  // Interior flow using FBM warp - advect by time
  vec2 flowUV = uvw * 0.8 + vec2(0.0, uTime * 0.006);\n\
  float flow = fbm(flowUV + vec2(f*0.2));\n\
  float iso = 0.45; // iso threshold for saturated Gaussian field\n\
  float band = smoothstep(iso - 0.02, iso + 0.02, f); // soft edge\n\
  // Surface normal from screen‑space derivatives of f
  float fx = dFdx(f); float fy = dFdy(f);\n\
  vec3 N = normalize(vec3(-fx, -fy, 0.55)); // flatter normal → fewer dome highlights\n\
  // Lighting
  vec3 L = normalize(vec3(0.6, 0.5, 0.6));\n\
  vec3 V = normalize(vec3(0.0, 0.0, 1.0));\n\
  // Wrap diffuse (half‑Lambert) avoids hard center lobes
  float diff = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);\n\
  // Rim light accentuates silhouette
  float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.0);
  
  // Broad, very soft specular to keep waxy, avoid "egg top"
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), 8.0) * 0.18;\n\
  // Base color from ramp – saturated mapping removes center peaks
  float t = smoothstep(iso - 0.02, 0.98, f);\n\
  // Center plateau (high‑performance, no neighbor blur)
  float g = length(vec2(fx, fy));
  float centerMask = 1.0 - smoothstep(0.020, 0.25, g); // wider & stronger interior detection
  float plateau = 0.62; // flatter cores
  float tPlateau = mix(t, min(t, plateau), centerMask);
  vec3 base = lavaRamp(tPlateau);
  float hotMask = smoothstep(0.72, 0.95, tPlateau);
  float hotNoise = clamp(fbm(flowUV * 1.4 + vec2(uTime * 0.05, -uTime * 0.03)), 0.0, 1.0);
  vec3 hotA = vec3(1.10, 0.46, 0.10);
  vec3 hotB = vec3(1.02, 0.82, 0.32);
  vec3 hotBlend = mix(hotA, hotB, hotNoise);
  base = mix(base, hotBlend, hotMask * 0.38);
  // Suppress interior flow strongly inside cores
  base += (0.22 * (1.0 - 0.85 * centerMask)) * (flow - 0.5) * vec3(0.9, 0.35, 0.1);
  // Thin translucent veil inside cores to soften residual contrast
  float grain = noise(uvw * 1.25 + vec2(uTime * 0.02, -uTime * 0.015));
  vec3 veilCol = vec3(0.96, 0.42, 0.18);
  vec3 veil = veilCol * (0.04 + 0.02 * grain) * (centerMask * 0.5);
  base = mix(base, base * (1.0 - 0.06 * centerMask) + veil, 0.55 * centerMask);
  // Local field smoothing only for deep cores (low gradient), modest taps
  float px2 = 2.0 / min(res.x, res.y);
  float cStrong = smoothstep(0.6, 1.0, centerMask);
  if (cStrong > 0.0) {
    float eA; float fA = field(uvw + vec2( px2,  0.0), eA);
    float eB; float fB = field(uvw + vec2(-px2,  0.0), eB);
    float eC; float fC = field(uvw + vec2( 0.0,  px2), eC);
    float eD; float fD = field(uvw + vec2( 0.0, -px2), eD);
    float fAvg = (f + fA + fB + fC + fD) / 5.0;
    float tAvg = smoothstep(iso - 0.02, 0.98, fAvg);
    vec3 baseAvg = lavaRamp(min(tAvg, plateau));
    base = mix(base, baseAvg, 0.85 * cStrong);
  }
  // Subsurface scattering approximation
  float thickness = clamp((f - iso) * 2.0, 0.0, 1.0); // 0 at edge → 1 deep
  float thinness = pow(1.0 - thickness, 1.4);         // strongest near edge
  float back = pow(clamp(dot(-L, N) * 0.5 + 0.5, 0.0, 1.0), 2.0);
  vec3 sssCol = vec3(1.0, 0.45, 0.20);
  vec3 sss = sssCol * thinness * (0.55 + 0.45*back);

  // Core override: use noise‑based normals and ambient weighting inside centers
  float centerG = length(vec2(fx, fy));
  float centerStrong = 1.0 - smoothstep(0.030, 0.200, centerG);
  float epsS = 1.5 / min(res.x, res.y);
  float n1 = fbm(flowUV + vec2(epsS, 0.0));
  float n2 = fbm(flowUV - vec2(epsS, 0.0));
  float n3 = fbm(flowUV + vec2(0.0, epsS));
  float n4 = fbm(flowUV - vec2(0.0, epsS));
  vec2 gradN = vec2(n1 - n2, n3 - n4);
  vec3 Ncore = normalize(vec3(-gradN.x, -gradN.y, 0.25));
  float diffCore = clamp(0.55 + 0.25 * dot(Ncore, L), 0.50, 0.80);
  float tCore = min(t, 0.82);
  vec3 coreCol = mix(base, lavaRamp(tCore), 0.85);
  vec3 litCore = coreCol * (0.62 + 0.20 * diffCore);

  // Combine lights
  spec *= (1.0 - 1.00 * centerMask); // suppress any central spec completely
  sss  *= (1.0 - 0.35 * centerMask); // avoid over-bright core
  rim *= (1.0 - 0.60 * centerStrong);
  vec3 lit = base * (0.55 + 0.75*diff) + sss * 0.85 + spec*vec3(1.0,0.82,0.65) + rim*vec3(0.9,0.25,0.35)*0.28;
  lit = mix(lit, litCore, centerStrong);
  // Edge bloom
  float glow = smoothstep(iso, iso+0.25, f) * 0.7;
  // Composite metaballs over background
  vec3 col = mix(bg, lit, band);
  col += glow * vec3(0.8, 0.2, 0.1);
  // Vignette
  vec2 q = vUV - 0.5; float vig = 1.0 - dot(q,q) * 1.3; col *= clamp(vig, 0.0, 1.0);
  // Tone map
  col = aces(col);
  outColor = vec4(col, 1.0);
}`;

    const vs = compile(gl.VERTEX_SHADER, vsSrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
    if (!vs || !fs) return;
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('Program link error', gl.getProgramInfoLog(prog));
      return;
    }

    // Full‑screen triangle setup
    const vao = gl.createVertexArray()!;
    const vbo = gl.createBuffer()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    // Single triangle covering the screen
    const tri = new Float32Array([-1, -1, 3, -1, -1, 3]);
    gl.bufferData(gl.ARRAY_BUFFER, tri, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 2 * 4, 0);
    gl.bindVertexArray(null);

    // Uniform locations
    const uResolution = gl.getUniformLocation(prog, 'uResolution');
    const uTime = gl.getUniformLocation(prog, 'uTime');
    const uCount = gl.getUniformLocation(prog, 'uCount');
    const uCenters = gl.getUniformLocation(prog, 'uCenters');
    const uRadii = gl.getUniformLocation(prog, 'uRadii');

    // Physics: blob state
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
    };

    const MAX = 5;
    const blobs: Blob[] = [];

    // Precompute near-uniform seed positions (Vogel/Fibonacci disc)
    // Ensures blobs start far apart and evenly distributed
    const golden = Math.PI * (3 - Math.sqrt(5)); // ~2.399963
    const seedPositions: { x: number; y: number }[] = Array.from({ length: MAX }, (_, i) => {
      // Radius in [0..1], push outward for more spread
      const rUnit = Math.sqrt((i + 0.5) / MAX);
      const r = 1.2 * rUnit; // wider initial separation, still within bounds
      const a = i * golden;
      return { x: r * Math.cos(a), y: r * Math.sin(a) };
    });

    // Seeded PRNG for stable sessions
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return (seed & 0xfffffff) / 0xfffffff;
    };

    // Initialize a blob with optional target position, drifting via convection
    const spawnBlob = (id: number, near?: { x: number; y: number; r?: number }) => {
      const baseR = 0.3 + rand() * 0.08; // smaller average radius
      const x = near ? near.x + (rand() - 0.5) * 0.02 : (rand() - 0.5) * 1.6;
      const y = near ? near.y + (rand() - 0.5) * 0.02 : (rand() - 0.5) * 1.6;
      const s = 0.03 + rand() * 0.03; // slower base speed
      const vx = (rand() - 0.5) * s * 0.12;
      const vy = (0.01 + rand() * 0.015) * s; // gentler upward bias
      const r0 = near?.r ?? baseR;
      return { x, y, vx, vy, r: r0, active: true, heat: rand(), id, baseR: r0, age: 0 } as Blob;
    };

    // Seed blobs at well-spaced positions for a clean start
    for (let i = 0; i < MAX; i++) {
      const p = seedPositions[i]!;
      blobs.push(spawnBlob(i, { x: p.x, y: p.y }));
    }

    const centersArr = new Float32Array(64 * 2);
    const radiiArr = new Float32Array(64);

    // Resize handling
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const w = wrap.clientWidth | 0;
      const h = wrap.clientHeight | 0;
      if (w === 0 || h === 0) return;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    // Physics update
    const sqBound = 0.95; // square bounds in shader uv space
    const tickPhysics = (dt: number, t: number) => {
      // Heat cycles cause slow breathing in radius
      for (let i = 0; i < MAX; i++) {
        const b = blobs[i]!;
        if (!b.active) continue;
        b.age += dt;
        const heatTarget = 0.5 + 0.5 * Math.sin(0.4 * t + b.id * 1.7);
        b.heat += (heatTarget - b.heat) * Math.min(1, dt * 0.5);
        // Prefer each blob's own base radius; allow gentle breathing
        let targetR = b.baseR * (0.95 + 0.12 * b.heat);
        // During initial 5s, never shrink — only allow growth
        if (b.age < 5 && targetR < b.r) targetR = b.r;
        b.r += (targetR - b.r) * Math.min(1, dt * 0.5);

        // Meander + large-scale convection to fill whole background
        const fx = Math.sin(t * (0.6 + (b.id % 5) * 0.17) + b.id * 2.1) * 0.006;
        const fy = Math.cos(t * (0.5 + (b.id % 7) * 0.13) + b.id * 1.3) * 0.003;
        const swirlX = Math.sin(b.y * 2.1 + t * 0.3) * 0.006;
        const swirlY = Math.cos(b.x * 1.7 - t * 0.22) * 0.004;
        b.vx += (fx + swirlX) * dt;
        b.vy += (fy + swirlY + 0.03) * dt; // gentler buoyancy

        // Damping
        b.vx *= Math.pow(0.965, dt * 60);
        b.vy *= Math.pow(0.965, dt * 60);
        // extra horizontal damping to deter spin
        b.vx *= Math.pow(0.95, dt * 60);

        // Cap speed to avoid fast center rotation when not colliding
        const maxSpeed = 0.03;
        const sp = Math.hypot(b.vx, b.vy);
        if (sp > maxSpeed) {
          const k = maxSpeed / sp;
          b.vx *= k;
          b.vy *= k;
        }

        // Integrate
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        // Soft boundary reflect with slight energy loss
        const k = 0.92;
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

      // Pairwise collisions and gentle merges
      for (let i = 0; i < MAX; i++) {
        const A = blobs[i]!;
        if (!A.active) continue;
        for (let j = i + 1; j < MAX; j++) {
          const B = blobs[j]!;
          if (!B.active) continue;
          const dx = B.x - A.x;
          const dy = B.y - A.y;
          const dist2 = dx * dx + dy * dy;
          const rsum = A.r + B.r;
          if (dist2 < rsum * rsum) {
            const dist = Math.max(1e-4, Math.sqrt(dist2));
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = rsum - dist;
            const push = overlap * 0.5;
            A.x -= nx * push;
            A.y -= ny * push;
            B.x += nx * push;
            B.y += ny * push;
            // Exchange some velocity along normal (inelastic)
            const va = A.vx * nx + A.vy * ny;
            const vb = B.vx * nx + B.vy * ny;
            const p = (vb - va) * 0.15; // further reduce spin impart on collision
            A.vx += nx * p;
            A.vy += ny * p;
            B.vx -= nx * p;
            B.vy -= ny * p;

            // Probabilistic merge: if strong overlap and similar size, fold B into A
            if (overlap > 0.5 * Math.min(A.r, B.r) && (i + j + (Math.floor(t) % 7)) % 5 === 0) {
              const massA = A.r * A.r;
              const massB = B.r * B.r;
              const mass = massA + massB;
              const newR = Math.sqrt(mass);
              A.r = Math.min(newR, 0.28);
              A.baseR = A.r; // update resting radius after merge
              // momentum‑like average
              A.vx = (A.vx * massA + B.vx * massB) / Math.max(1e-4, mass);
              A.vy = (A.vy * massA + B.vy * massB) / Math.max(1e-4, mass);
              // deactivate B then respawn far away later
              B.active = false;
              // schedule respawn after short delay by shrinking radius
              B.r = 0.0;
              // later in recycle pass
            }
          }
        }
      }

      // Occasionally split a hot blob into two
      if ((Math.floor(t * 0.33) + 17) % 5 === 0) {
        // find a large active blob and an inactive slot
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
        if (big !== -1 && slot !== -1 && blobs[big]!.r > 0.14) {
          const b = blobs[big]!;
          const childR = b.r * 0.65;
          // Split mass conservation-ish
          b.r = b.r * 0.75;
          const nx = Math.sin(t + b.id) * 0.5;
          const ny = Math.cos(t * 0.9 + b.id * 1.3) * 0.5;
          const off = 0.02 + rand() * 0.03;
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
          };
        }
      }

      // Recycle inactive blobs occasionally at the bottom
      for (let i = 0; i < MAX; i++) {
        const b = blobs[i]!;
        if (!b.active && rand() < 0.02) {
          blobs[i]! = spawnBlob(i, { x: (rand() - 0.5) * 0.8, y: -0.9, r: 0.08 + rand() * 0.05 });
        }
      }
    };

    // Render loop
    let raf = 0;
    let lastT = performance.now();
    const start = lastT;
    const render = () => {
      raf = requestAnimationFrame(render);
      const now = performance.now();
      // Global time scaling to slow overall motion without changing character
      const TIME_SCALE = 0.6; // 60% of prior speed
      const dt = Math.min(0.05, (now - lastT) / 1000) * TIME_SCALE;
      lastT = now;
      const t = ((now - start) / 1000) * TIME_SCALE;

      // Update physics
      tickPhysics(dt, t);

      // Upload uniforms
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.uniform2f(uResolution, canvas.width, canvas.height);
      gl.uniform1f(uTime, t);

      // Pack active blob data (square space coordinates already)
      let count = 0;
      for (let i = 0; i < MAX && count < 64; i++) {
        const b = blobs[i]!;
        if (!b.active) continue;
        centersArr[count * 2 + 0] = b.x;
        centersArr[count * 2 + 1] = b.y;
        radiiArr[count] = b.r;
        count++;
      }
      gl.uniform1i(uCount, count);
      gl.uniform2fv(uCenters, centersArr);
      gl.uniform1fv(uRadii, radiiArr);

      // Draw
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      gl.useProgram(null);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
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
