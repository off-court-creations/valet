#version 300 es
// ─────────────────────────────────────────────────────────────
// src/shaders/lava-lamp/lavaLamp.frag  | valet-docs
// Fragment shader (WebGL2 / GLSL ES 3.00)
//
// High level visual intent
// - Render a “lava lamp” background: smooth, merging blobs with warm interiors
//   over a cool glassy background.
// - Avoid harsh specular “egg tops” and blown centers typical of naive metaballs.
// - Use a saturated Gaussian union field that produces flat cores and smooth
//   blends, plus carefully tuned color ramps and soft lighting.
//
// Technical overview
// - Field: Sum of per‑blob Gaussians (with mild anisotropy), then saturated
//   via v = 1 - exp(-sumK). This bounds values to [0,1) and naturally flattens
//   centers as energy accumulates.
// - Surface: Threshold around an isosurface `iso`; compute screen‑space
//   gradient of the field (dFdx/dFdy) as a proxy for the normal.
// - Shading: Half‑Lambert (wrap diffuse), rim light, very soft specular,
//   plus a thin subsurface scattering approximation near silhouettes.
// - Color: A tuned ramp with thresholds chosen to mimic molten wax hues; a
//   “hot” blend modulated by FBM noise to avoid flat color bands.
// - Flow: FBM noise advects interior features slowly for organic motion.
// - Post: ACES filmic tone mapping and a light vignette.
//
// IMPORTANT: The `#version` directive must be the very first line of the file.
// ─────────────────────────────────────────────────────────────
precision highp float;

// Final RGBA color
out vec4 outColor;

// Interpolated screen‑space UV in [0,1]^2 from the vertex shader
in vec2 vUV;

// Viewport resolution (pixels), animation time (seconds), and active blob count
uniform vec2 uResolution;
uniform float uTime;
uniform int uCount;

// Per‑blob centers and radii (packed for ES compatibility)
// We upload at most 64 blobs; inactive slots are ignored in the loop.
uniform vec2 uCenters[64];
uniform float uRadii[64];

// Solid background color
uniform vec3 uBgColor;

// Appearance uniforms (tweakable via TS parameters)
uniform float uIso;           // field threshold
uniform float uBand;          // half-width for soft banding around iso
uniform float uNormalZ;       // Z component for reconstructed normal (flatter → fewer hotspots)
uniform vec3  uLightDir;      // primary light direction
uniform float uSpecPower;     // specular exponent
uniform float uSpecIntensity; // specular intensity multiplier
uniform float uRimPower;      // rim light exponent

// Color ramp controls (five-way blend with non-linear thresholds)
uniform vec3 uRampC1, uRampC2, uRampC3, uRampC4, uRampC5;
uniform float uRamp1Start, uRamp1End;
uniform float uRamp2Start, uRamp2End;
uniform float uRamp3Start, uRamp3End;
uniform float uRamp4Start, uRamp4End;
uniform float uRamp5Mix;

// Center handling and local smoothing
uniform float uCenterMaskStart, uCenterMaskEnd;
uniform float uCenterStrongStart, uCenterStrongEnd;
uniform float uPlateau;
uniform float uLocalSmoothPx; // pixel step factor for neighbor samples
uniform float uCStrongStart, uCStrongEnd, uLocalSmoothBlend;

// Hot interior blend and flow tint
uniform float uHotMaskStart, uHotMaskEnd, uHotBlendStrength;
uniform vec3  uHotA, uHotB;
uniform vec3  uFlowTintColor; uniform float uFlowTintGain, uFlowCenterSuppress;

// Veil and post
uniform vec3  uVeilColor; uniform float uVeilGainBase, uVeilGainNoise, uVeilMaskScale;
uniform float uBaseDesaturate, uVeilMix;
uniform float uGlowWidth, uGlowGain; uniform vec3 uGlowColor;
uniform float uVignetteK;

// -----------------------------------------------------------------------------
// Noise utilities
// - `hash11` / `hash21`: low‑cost, decorrelated hash functions.
// - `noise`: value noise (bilinear blend of grid‑hashed values).
// - `fbm`: fractal Brownian motion (sum of octaves of value noise), used for
//   subtle warping of flow and color to avoid symmetry and banding.
// -----------------------------------------------------------------------------
float hash11(float p){
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}

float hash21(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i + vec2(0,0));
  float b = hash21(i + vec2(1,0));
  float c = hash21(i + vec2(0,1));
  float d = hash21(i + vec2(1,1));
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}

float fbm(vec2 p){
  float s = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, -1.2, 1.2, 1.6);
  for(int i=0;i<5;i++){
    s += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return s;
}

// -----------------------------------------------------------------------------
// Color ramp for molten wax
// - Input t ∈ [0,1] maps the field to warm hues.
// - Thresholds (k1..k4) are tuned to keep the palette rich without clipping.
//   These are intentionally non‑linear to emphasize pleasing bands.
// -----------------------------------------------------------------------------
vec3 lavaRamp(float t){
  // t in [0,1] – deep purple -> crimson -> orange -> yellow
  float k1 = smoothstep(uRamp1Start, uRamp1End, t);
  float k2 = smoothstep(uRamp2Start, uRamp2End, t);
  float k3 = smoothstep(uRamp3Start, uRamp3End, t);
  float k4 = smoothstep(uRamp4Start, uRamp4End, t);
  vec3 c = mix(uRampC1, uRampC2, k1);
  c = mix(c, uRampC3, k2);
  c = mix(c, uRampC4, k3);
  c = mix(c, uRampC5, k4 * uRamp5Mix);
  return c;
}

// -----------------------------------------------------------------------------
// Metaball field: saturated Gaussian union
// - For each blob, we add a Gaussian kernel exp(-|A·(p-c)|^2 / sigma).
// - We rotate/stretch (anisotropy) per‑blob using a small time‑varying matrix
//   to break radial symmetry and create more organic silhouettes.
// - sigma ~ r^2 scales influence with blob radius.
// - We then apply a saturated union: v = 1 - exp(-sumK), which:
//     * flattens cores (prevents center “spikes”)
//     * yields smooth, associative blending akin to soft‑union in SDF literature
// - We also return the unsaturated sum (edge) which correlates with thickness.
// -----------------------------------------------------------------------------
float field(vec2 p, out float edge){
  float sumK = 0.0;
  for(int i=0;i<64;i++){
    if(i>=uCount) break;
    vec2 c = uCenters[i];
    float r = uRadii[i];
    // Per-blob anisotropy (break radial symmetry)
    vec2 d = p - c;
    float ang = noise(c * 3.173 + vec2(uTime * 0.15)) * 6.2831853;
    float cs = cos(ang), sn = sin(ang);
    mat2 R = mat2(cs, -sn, sn, cs);
    vec2 a = R * d;
    float stretch = mix(0.6, 1.4, noise(c * 4.7 + vec2(uTime * 0.12)));
    a *= vec2(1.0, stretch);
    float dist2 = dot(a,a);
    float sigma = r*r*1.6 + 1e-6;
    float k = exp(-dist2 / sigma);
    sumK += k;
  }
  // Saturated union: flat cores, smooth merges, bounded to [0,1)
  float v = 1.0 - exp(-sumK);
  edge = sumK;
  return v;
}

// ACES tone map (filmic)
// Compresses highlights smoothly while preserving mid‑tones and colorfulness.
vec3 aces(vec3 x){
  const float a=2.51; const float b=0.03; const float c=2.43; const float d=0.59; const float e=0.14;
  return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
}

void main(){
  // 1) Coordinate prep -------------------------------------------------------
  vec2 res = uResolution;
  // Centered square space so blob centers span full background
  vec2 uv = ((vUV * res) - 0.5 * res) / min(res.x, res.y);
  // Coarse warp to break symmetry and add nebula wobble
  vec2 uvw = uv + 0.04 * vec2(
    noise(uv * 1.35 + vec2(0.0, uTime * 0.035)),
    noise(uv * 1.35 + vec2(uTime * 0.028, 0.0))
  );
  // Transparent background: render only lit regions; let page show through.

  // 2) Field and isosurface --------------------------------------------------
  // Compute the saturated field and a soft band around the iso threshold.
  float edge; float f = field(uvw, edge);
  // Interior flow using FBM warp — small, slow advection for organic motion.
  vec2 flowUV = uvw * 0.8 + vec2(0.0, uTime * 0.006);
  float flow = fbm(flowUV + vec2(f*0.2));

  float band = smoothstep(uIso - uBand, uIso + uBand, f); // soft edge

  // 3) Surface normal from screen‑space derivatives -------------------------
  // WebGL2 allows dFdx/dFdy; we treat the gradient of the field as the normal
  // to the implicit surface (up to scale), with a slightly flattened Z to
  // reduce dome‑like speculars.
  float fx = dFdx(f); float fy = dFdy(f);
  vec3 N = normalize(vec3(-fx, -fy, uNormalZ)); // flatter normal → fewer dome highlights

  // 4) Lighting setup --------------------------------------------------------
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(vec3(0.0, 0.0, 1.0));

  // Wrap diffuse (half‑Lambert) avoids hard center lobes
  float diff = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);

  // Rim light accentuates silhouette
  float rim = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), uRimPower);

  // Broad, very soft specular to keep waxy, avoid "egg top"
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), uSpecPower) * uSpecIntensity;

  // 5) Base color from ramp — map field to molten palette -------------------
  float t = smoothstep(uIso - uBand, 0.98, f);

  // 6) Center handling: flatten, heat, veil, and local smoothing ------------
  // Detect deep cores via small gradient magnitude; flatten color there to
  // avoid visually harsh peaks, then blend in “hot” color with noisy pattern.
  float g = length(vec2(fx, fy));
  float centerMask = 1.0 - smoothstep(uCenterMaskStart, uCenterMaskEnd, g); // wider & stronger interior detection
  float tPlateau = mix(t, min(t, uPlateau), centerMask);
  vec3 base = lavaRamp(tPlateau);
  float hotMask = smoothstep(uHotMaskStart, uHotMaskEnd, tPlateau);
  float hotNoise = clamp(fbm(flowUV * 1.4 + vec2(uTime * 0.05, -uTime * 0.03)), 0.0, 1.0);
  vec3 hotBlend = mix(uHotA, uHotB, hotNoise);
  base = mix(base, hotBlend, hotMask * uHotBlendStrength);
  // Suppress interior flow strongly inside cores
  base += (uFlowTintGain * (1.0 - uFlowCenterSuppress * centerMask)) * (flow - 0.5) * uFlowTintColor;
  // Thin translucent veil inside cores to soften residual contrast
  float grain = noise(uvw * 1.25 + vec2(uTime * 0.02, -uTime * 0.015));
  vec3 veil = uVeilColor * (uVeilGainBase + uVeilGainNoise * grain) * (centerMask * uVeilMaskScale);
  base = mix(base, base * (1.0 - uBaseDesaturate * centerMask) + veil, uVeilMix * centerMask);
  // Local field smoothing only for deep cores (low gradient), modest taps
  float px2 = uLocalSmoothPx / min(res.x, res.y);
  float cStrong = smoothstep(uCStrongStart, uCStrongEnd, centerMask);
  if (cStrong > 0.0) {
    float eA; float fA = field(uvw + vec2( px2,  0.0), eA);
    float eB; float fB = field(uvw + vec2(-px2,  0.0), eB);
    float eC; float fC = field(uvw + vec2( 0.0,  px2), eC);
    float eD; float fD = field(uvw + vec2( 0.0, -px2), eD);
    float fAvg = (f + fA + fB + fC + fD) / 5.0;
    float tAvg = smoothstep(uIso - uBand, 0.98, fAvg);
    vec3 baseAvg = lavaRamp(min(tAvg, uPlateau));
    base = mix(base, baseAvg, uLocalSmoothBlend * cStrong);
  }
  // Subsurface scattering approximation
  float thickness = clamp((f - uIso) * 2.0, 0.0, 1.0); // 0 at edge → 1 deep
  float thinness = pow(1.0 - thickness, 1.4);         // strongest near edge
  float back = pow(clamp(dot(-L, N) * 0.5 + 0.5, 0.0, 1.0), 2.0);
  vec3 sssCol = vec3(1.0, 0.45, 0.20);
  vec3 sss = sssCol * thinness * (0.55 + 0.45*back);

  // 7) Core override: use noise‑based normals and ambient weighting in centers
  float centerG = length(vec2(fx, fy));
  float centerStrong = 1.0 - smoothstep(uCenterStrongStart, uCenterStrongEnd, centerG);
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

  // 8) Combine lights and finalize -----------------------------------------
  spec *= (1.0 - 1.00 * centerMask); // suppress any central spec completely
  sss  *= (1.0 - 0.35 * centerMask); // avoid over-bright core
  rim *= (1.0 - 0.60 * centerStrong);
  vec3 lit = base * (0.55 + 0.75*diff) + sss * 0.85 + spec*vec3(1.0,0.82,0.65) + rim*vec3(0.9,0.25,0.35)*0.28;
  lit = mix(lit, litCore, centerStrong);

  // Edge bloom
  float glow = smoothstep(uIso, uIso + uGlowWidth, f) * uGlowGain;

  // Composite metaballs onto transparency (premultiplied for canvas compositing)
  vec3 col = lit;
  // Vignette
  vec2 q = vUV - 0.5; float vig = 1.0 - dot(q,q) * uVignetteK; col *= clamp(vig, 0.0, 1.0);
  // Tone map only the lit contribution
  col = aces(col);
  vec3 premul = col * band + (glow * uGlowColor) * band;
  outColor = vec4(premul, band);
}
