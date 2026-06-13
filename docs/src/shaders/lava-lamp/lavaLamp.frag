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
uniform vec2 uRotRow0[64];
uniform vec2 uRotRow1[64];
uniform float uInvSigma[64];
uniform float uCutThreshold;

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
uniform float uGlowSigmaPx; // Gaussian sigma in screen pixels
uniform float uGlowAlpha;   // glow alpha at the isosurface (0..1)
uniform vec3  uGlowColor;
uniform float uGlowChromaticPx; // RGB halo offset in pixels (chromatic dispersion)

// “Lamp” emission: a soft point light from the bottom that makes wax feel
// volumetric without hard speculars.
uniform vec2  uLampPos;    // in centered square space (same as `uv`)
uniform vec3  uLampColor;  // HDR-ish (pre-tonemap)
uniform float uLampGain;
uniform float uLampRadius; // falloff radius in square space

// Thin “shell” highlight: gives the blobs a glassy interface like real wax.
uniform float uShellSigmaPx;      // shell width in pixels
uniform float uShellIntensity;    // diffuse-ish shell sheen gain
uniform float uShellSpecPower;    // clearcoat exponent
uniform float uShellSpecIntensity;// clearcoat gain
uniform vec3  uShellColor;        // cool tint
uniform float uShellIridescence;  // 0..1 – subtle spectral shift

// Secondary cool fill light (adds cinematic depth without harshness)
uniform vec3  uFillDir;
uniform vec3  uFillColor;
uniform float uFillGain;

// Post-grade
uniform float uSaturation;
uniform float uContrast;

// Volume shaping
uniform float uThicknessGain; // maps unsaturated sumK → thickness
uniform float uAbsorption;    // absorption strength (higher → darker cores)

// Post / compositing
uniform float uDither;    // small, 8-bit-like dither to reduce banding (0..1)
uniform float uAlphaMax;  // max body alpha (lets page gradient breathe)
uniform float uVignetteK;

// -----------------------------------------------------------------------------
// Noise utilities
// - `hash11` / `hash21`: low‑cost, decorrelated hash functions.
// - `noise`: value noise (bilinear blend of grid-hashed values).
// - `noiseGrad`: value noise with analytic gradient, used by fbmGrad to avoid
//   additional octave sampling when only local derivatives are needed.
// - `fbm`: fractal Brownian motion (sum of octaves of value noise), used for
//   subtle warping of flow and color to avoid symmetry and banding.
// - `fbmGrad`: fbm with gradient (w.r.t input UV) returned alongside the value.
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

void noiseGrad(vec2 p, out float value, out vec2 grad){
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash21(i + vec2(0,0));
  float b = hash21(i + vec2(1,0));
  float c = hash21(i + vec2(0,1));
  float d = hash21(i + vec2(1,1));
  vec2 u = f*f*(3.0-2.0*f);
  vec2 du = 6.0*f*(1.0 - f);
  float nx0 = mix(a, b, u.x);
  float nx1 = mix(c, d, u.x);
  float dnx0 = (b - a) * du.x;
  float dnx1 = (d - c) * du.x;
  value = mix(nx0, nx1, u.y);
  grad.x = dnx0 + (dnx1 - dnx0) * u.y;
  grad.y = (nx1 - nx0) * du.y;
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

void fbmGrad(vec2 p, out float value, out vec2 grad){
  float s = 0.0;
  vec2 g = vec2(0.0);
  float a = 0.5;
  mat2 m = mat2(1.6, -1.2, 1.2, 1.6);
  vec2 q = p;
  mat2 J = mat2(1.0, 0.0, 0.0, 1.0);
  for(int i=0;i<5;i++){
    float nVal; vec2 nGrad;
    noiseGrad(q, nVal, nGrad);
    s += a * nVal;
    g += a * (transpose(J) * nGrad);
    q = m * q;
    J = m * J;
    a *= 0.5;
  }
  value = s;
  grad = g;
}

// -----------------------------------------------------------------------------
// Color ramp for molten wax
// - Input t ∈ [0,1] maps the field to warm hues.
// - Thresholds (k1..k4) are tuned to keep the palette rich without clipping.
//   These are intentionally non-linear to emphasize pleasing bands.
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
float field(vec2 p, out float sumK){
  float sum = 0.0;
  for(int i=0;i<64;i++){
    if(i>=uCount) break;
    vec2 c = uCenters[i];
    vec2 d = p - c;
    vec2 row0 = uRotRow0[i];
    vec2 row1 = uRotRow1[i];
    vec2 a = vec2(dot(row0, d), dot(row1, d));
    float dist2 = dot(a,a);
    if (dist2 * uInvSigma[i] > uCutThreshold) continue;
    float k = exp(-dist2 * uInvSigma[i]);
    sum += k;
    if (sum > 8.0) break;
  }
  // Saturated union: flat cores, smooth merges, bounded to [0,1)
  float v = 1.0 - exp(-sum);
  sumK = sum;
  return v;
}

vec4 fieldOffsetSamples(vec2 p, float step){
  vec4 sums = vec4(0.0);
  for(int i=0;i<64;i++){
    if(i>=uCount) break;
    vec2 c = uCenters[i];
    vec2 d = p - c;
    vec2 row0 = uRotRow0[i];
    vec2 row1 = uRotRow1[i];
    vec2 base = vec2(dot(row0, d), dot(row1, d));
    float d2 = dot(base, base);
    if (d2 * uInvSigma[i] > uCutThreshold) continue;
    vec2 deltaX = vec2(row0.x, row1.x) * step;
    vec2 deltaY = vec2(row0.y, row1.y) * step;
    float invSigma = uInvSigma[i];
    vec2 axp = base + deltaX;
    vec2 axm = base - deltaX;
    vec2 ayp = base + deltaY;
    vec2 aym = base - deltaY;
    sums.x += exp(-dot(axp, axp) * invSigma);
    sums.y += exp(-dot(axm, axm) * invSigma);
    sums.z += exp(-dot(ayp, ayp) * invSigma);
    sums.w += exp(-dot(aym, aym) * invSigma);
    if (sums.x > 8.0 && sums.y > 8.0 && sums.z > 8.0 && sums.w > 8.0) break;
  }
  return vec4(
    1.0 - exp(-sums.x),
    1.0 - exp(-sums.y),
    1.0 - exp(-sums.z),
    1.0 - exp(-sums.w)
  );
}

// ACES tone map (filmic)
// Compresses highlights smoothly while preserving mid‑tones and colorfulness.
vec3 aces(vec3 x){
  const float a=2.51; const float b=0.03; const float c=2.43; const float d=0.59; const float e=0.14;
  return clamp((x*(a*x+b))/(x*(c*x+d)+e), 0.0, 1.0);
}

// Interleaved Gradient Noise (cheap, decorrelated per-pixel noise)
float ign(vec2 p){
  // https://www.shadertoy.com/view/WtBXRW (in spirit)
  return fract(52.9829189 * fract(0.06711056 * p.x + 0.00583715 * p.y));
}

void main(){
  // 1) Coordinate prep -------------------------------------------------------
  vec2 res = uResolution;
  // Centered square space so blob centers span full background
  float minRes = min(res.x, res.y);
  vec2 uv = ((vUV * res) - 0.5 * res) / minRes;

  // Coarse warp to break symmetry and add gentle glassy wobble
  vec2 warpP = uv * 1.35;
  vec2 uvw = uv + 0.035 * vec2(
    noise(warpP + vec2(0.0, uTime * 0.035)) - 0.5,
    noise(warpP + vec2(uTime * 0.028, 0.0)) - 0.5
  );

  // Add a tiny curl-like warp from a single octave gradient noise to avoid
  // grid alignment and make silhouettes feel less “perfect”.
  float wv; vec2 wg;
  noiseGrad(uv * 1.05 + vec2(uTime * 0.02, -uTime * 0.015), wv, wg);
  uvw += 0.020 * vec2(wg.y, -wg.x);

  // 2) Field and isosurface --------------------------------------------------
  // Compute the saturated field and a soft band around the iso threshold.
  float sumK;
  float f = field(uvw, sumK);

  // Anti-aliased coverage around the implicit surface; `uBand` sets the
  // aesthetic softness, `fwidth(f)` guarantees 1px stability.
  float df = f - uIso;
  float aa = max(fwidth(f), 1e-5);
  float w = uBand + 1.25 * aa;
  float band = smoothstep(-w, w, df);

  // Signed distance proxy in pixels (negative outside, positive inside)
  float sdPx = df / aa;
  float sdAbs = abs(sdPx);

  // Volumetric-ish thickness from the unsaturated energy sumK.
  // This is stable across resolutions and tracks how “deep” the wax is.
  float thick = 1.0 - exp(-sumK * uThicknessGain);

  // Interior flow using FBM with analytic gradient.
  // We reuse the same FBM value for multiple effects (tint, hot speckles, normals).
  vec2 flowUV = uvw * 0.85 + vec2(0.0, uTime * 0.010);
  float flow; vec2 flowGrad;
  fbmGrad(flowUV + vec2(f * 0.18), flow, flowGrad);

  // 3) Normals ---------------------------------------------------------------
  // Classic implicit-surface normal (stable at the isosurface).
  float fx = dFdx(f); float fy = dFdy(f);
  vec3 Nfield = normalize(vec3(-fx, -fy, uNormalZ));

  // Add depth without revealing per-blob circles: treat the unsaturated energy
  // sum (sumK) as a smooth "height" field and derive a gentle bulge normal.
  // Scale by `minRes` to make the look stable across DPIs.
  vec2 gk = vec2(dFdx(sumK), dFdy(sumK)) * minRes;
  vec3 Nbulge = normalize(vec3(-gk * 0.18, 1.0));
  float bulgeMix = smoothstep(0.35, 0.98, band);
  vec3 N = normalize(mix(Nfield, Nbulge, 0.65 * bulgeMix));

  // 4) Lighting setup --------------------------------------------------------
  vec3 L = normalize(uLightDir);
  vec3 V = normalize(vec3(0.0, 0.0, 1.0));
  float amb = 0.22 + 0.10 * (1.0 - vUV.y);

  // Wrap diffuse (half‑Lambert) avoids hard center lobes
  float diff = clamp(dot(N, L) * 0.5 + 0.5, 0.0, 1.0);

  // Rim light accentuates silhouette
  float NoV = clamp(dot(N, V), 0.0, 1.0);
  float fres = pow(1.0 - NoV, 5.0);
  float rim = pow(1.0 - NoV, uRimPower);

  // Secondary cool fill (subtle)
  vec3 Lf = normalize(uFillDir);
  float diffF = clamp(dot(N, Lf) * 0.5 + 0.5, 0.0, 1.0);

  // Broad, very soft specular to keep waxy, avoid "egg top"
  vec3 H = normalize(L + V);
  float spec = pow(max(dot(N, H), 0.0), uSpecPower) * uSpecIntensity;
  // Fresnel + thickness suppression: keeps highlights on silhouettes and away from cores.
  spec *= mix(0.08, 1.0, fres) * pow(1.0 - thick, 0.55);

  // 5) Base color from ramp — map field to molten palette -------------------
  float t = smoothstep(uIso - w, 0.98, f);

  // 6) Center handling: flatten, heat, veil, and local smoothing ------------
  // Detect deep cores via small gradient magnitude; flatten color there to
  // avoid visually harsh peaks, then blend in “hot” color with noisy pattern.
  float g = length(vec2(fx, fy));
  // Gate center detection by thickness to avoid DPI-dependent “over-flattening”.
  float centerMask =
    (1.0 - smoothstep(uCenterMaskStart, uCenterMaskEnd, g)) *
    smoothstep(0.25, 0.88, thick);
  float tPlateau = mix(t, min(t, uPlateau), centerMask);
  vec3 base = lavaRamp(tPlateau);
  float hotMask = smoothstep(uHotMaskStart, uHotMaskEnd, tPlateau);
  // A cheap extra octave for “hot” mottling (avoid another full FBM pass).
  float hotNoise = clamp(
    0.70 * flow + 0.30 * noise(flowUV * 2.25 + vec2(uTime * 0.08, -uTime * 0.06)),
    0.0,
    1.0
  );
  vec3 hotBlend = mix(uHotA, uHotB, hotNoise);
  base = mix(base, hotBlend, hotMask * uHotBlendStrength);

  // Ridged marbling (uses the already-sampled flow value)
  float ridge = 1.0 - abs(2.0 * flow - 1.0);
  float marble = ridge * ridge * (1.2 - 0.2 * ridge);
  base = mix(base, hotBlend, marble * thick * 0.22);

  // Suppress interior flow strongly inside cores
  base += (uFlowTintGain * (1.0 - uFlowCenterSuppress * centerMask)) * (flow - 0.5) * uFlowTintColor;
  // Thin translucent veil inside cores to soften residual contrast
  float grain = ign(gl_FragCoord.xy + vec2(uTime * 23.0, -uTime * 17.0));
  vec3 veil = uVeilColor * (uVeilGainBase + uVeilGainNoise * grain) * (centerMask * uVeilMaskScale);
  base = mix(base, base * (1.0 - uBaseDesaturate * centerMask) + veil, uVeilMix * centerMask);
  // Local field smoothing only for deep cores (low gradient), modest taps
  float px2 = uLocalSmoothPx / minRes;
  float cStrong = smoothstep(uCStrongStart, uCStrongEnd, centerMask);
  if (cStrong > 0.0) {
    vec4 fNeighbors = fieldOffsetSamples(uvw, px2);
    float fAvg = (f + fNeighbors.x + fNeighbors.y + fNeighbors.z + fNeighbors.w) / 5.0;
    float tAvg = smoothstep(uIso - uBand, 0.98, fAvg);
    vec3 baseAvg = lavaRamp(min(tAvg, uPlateau));
    base = mix(base, baseAvg, uLocalSmoothBlend * cStrong);
  }

  // Beer–Lambert-ish absorption: darken and warm deep cores.
  vec3 absorb = exp(-thick * uAbsorption * vec3(0.55, 0.9, 1.25));
  base *= absorb;

  // Subsurface scattering approximation
  float thinness = pow(1.0 - thick, 1.35);            // strongest near edge
  float back = pow(clamp(dot(-L, N) * 0.5 + 0.5, 0.0, 1.0), 2.0);
  vec3 sssCol = mix(base, vec3(1.0, 0.45, 0.20), 0.35);
  vec3 sss = sssCol * thinness * (0.50 + 0.50*back);

  // Lamp emission (soft, volumetric) ----------------------------------------
  vec2 lp = uLampPos;
  float lampD2 = dot(uvw - lp, uvw - lp);
  float lamp = exp(-lampD2 / max(uLampRadius * uLampRadius, 1e-4));
  // Add subtle caustic “swirl” from marbling and surface curvature
  float caustic = 0.65 + 0.55 * pow(marble, 2.2) * (0.35 + 0.65 * (1.0 - NoV));
  vec3 emission = uLampColor * (uLampGain * lamp) * (0.22 + 0.78 * thick) * caustic;

  // 7) Core override: use noise‑based normals and ambient weighting in centers
  float centerG = length(vec2(fx, fy));
  float centerStrong =
    (1.0 - smoothstep(uCenterStrongStart, uCenterStrongEnd, centerG)) *
    smoothstep(0.35, 0.92, thick);
  vec2 gradN = 0.35 * flowGrad;
  vec3 Ncore = normalize(vec3(-gradN.x, -gradN.y, 0.40));
  float diffCore = clamp(0.55 + 0.25 * dot(Ncore, L), 0.50, 0.80);
  float tCore = min(t, 0.82);
  vec3 coreCol = mix(base, lavaRamp(tCore), 0.85);
  vec3 litCore = coreCol * (0.60 + 0.22 * diffCore) + 0.55 * emission;

  // 8) Combine lights and finalize -----------------------------------------
  spec *= (1.0 - 1.00 * centerMask); // suppress any central spec completely
  sss  *= (1.0 - 0.35 * centerMask); // avoid over-bright core
  rim *= (1.0 - 0.60 * centerStrong);
  vec3 lit =
    base * (amb + 0.85*diff) +
    emission +
    sss * 0.85 +
    spec * vec3(1.0, 0.86, 0.70) +
    rim * vec3(0.95, 0.30, 0.38) * 0.30;

  // Cool fill (kept subtle; mostly seen on silhouettes and upper lobes)
  lit += uFillColor * (uFillGain * pow(diffF, 1.6)) * (0.25 + 0.75 * (1.0 - thick)) * (0.3 + 0.7 * rim);

  lit = mix(lit, litCore, centerStrong);

  // Edge bloom (extends beyond the surface, unlike the previous “inside-only” glow).
  float invSigma = 1.0 / max(uGlowSigmaPx * uGlowSigmaPx, 1e-4);
  float glow = exp(-0.5 * sdPx * sdPx * invSigma);

  // Shell sheen + clearcoat highlight (very thin, glassy)
  float invShell = 1.0 / max(uShellSigmaPx * uShellSigmaPx, 1e-4);
  float shell = exp(-0.5 * sdPx * sdPx * invShell);
  vec3 Nglass = normalize(vec3(N.xy * 1.25, 0.90));
  float specG = pow(max(dot(Nglass, H), 0.0), uShellSpecPower) * uShellSpecIntensity;
  float coatF = mix(0.04, 1.0, fres);
  float shellFres = pow(1.0 - NoV, 2.5);
  float shellMask = shell * (0.20 + 0.80 * shellFres) * pow(1.0 - thick, 0.35);
  float shellGain = shellMask * (uShellIntensity * shellFres + specG * coatF);
  float phase = 6.2831853 * (0.08 * sdPx + 0.55 * NoV + 0.35 * flow + uTime * 0.02);
  vec3 iri = 0.5 + 0.5 * sin(phase + vec3(0.0, 2.1, 4.2));
  vec3 shellTint = mix(uShellColor, iri, uShellIridescence);
  vec3 shellCol = mix(base, shellTint, 0.35);
  lit += shellCol * shellGain;

  // Composite metaballs onto transparency (premultiplied for canvas compositing)
  vec3 col = lit;
  // Vignette
  vec2 q = vUV - 0.5; float vig = 1.0 - dot(q,q) * uVignetteK; col *= clamp(vig, 0.0, 1.0);
  // Tone map only the lit contribution
  col = aces(col);

  // Simple filmic grade (post-tonemap)
  float lum = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(lum), col, uSaturation);
  col = (col - 0.5) * uContrast + 0.5;
  col = clamp(col, 0.0, 1.0);

  // Subtle dithering to reduce gradient banding on 8-bit displays/compositing.
  float d = (ign(gl_FragCoord.xy + vec2(uTime * 61.0, uTime * 37.0)) - 0.5) * (uDither / 255.0);
  col = clamp(col + d, 0.0, 1.0);

  // Premultiplied composition: body + bloom halo.
  float aBody = band * uAlphaMax;
  float aGlow = glow * uGlowAlpha;

  // Chromatic bloom halo (subtle RGB split in pixel space)
  float chroma = uGlowChromaticPx * (0.55 + 0.45 * rim);
  float glowR = exp(-0.5 * (sdPx - chroma) * (sdPx - chroma) * invSigma);
  float glowB = exp(-0.5 * (sdPx + chroma) * (sdPx + chroma) * invSigma);
  vec3 glowRGB = vec3(glowR, glow, glowB);

  vec3 bloomCol = (uGlowColor * (0.75 + 0.25 * col)) * glowRGB;
  vec3 premul = col * aBody + bloomCol * aGlow;
  float alpha = clamp(aBody + aGlow, 0.0, 1.0);
  premul = min(premul, vec3(alpha));
  outColor = vec4(premul, alpha);
}
