// ─────────────────────────────────────────────────────────────
// docs/src/shaders/tron-city/TronCityProgram.ts  | valet-docs
// "Tron City" — WIP toward a Tron: Legacy opening. A raymarched flyover that
// alternates between five biomes (city · grid arena · sea of simulation ·
// outlands · derez ruins), two light cycles leaving glowing wall-trails, a
// glowing horizon + atmosphere, a drifting camera, and a multi-pass BLOOM
// pipeline (scene → bright-pass → blur → composite). Bike paths are simulated
// on the CPU and uploaded as polyline uniforms.
// ─────────────────────────────────────────────────────────────
import type { WebGLProgramLike } from '@archway/valet';

const VERT = `#version 300 es
layout(location=0) in vec2 aPos;
out vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const SCENE_FRAG = `#version 300 es
precision highp float;
out vec4 frag;

uniform vec2  uResolution;
uniform float uTime;
uniform vec2 uPathA[12]; uniform int uLenA; uniform vec2 uHeadA;
uniform vec2 uPathB[12]; uniform int uLenB; uniform vec2 uHeadB;

const vec2  CELL   = vec2(4.0, 4.0);
const float WALL_H = 1.0;
const float WALL_T = 0.09;
const float ZONE   = 140.0;

float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float hash11(float n){ return fract(sin(n * 113.97) * 43758.5453); }

// 0 city · 1 grid arena · 2 sea · 3 outlands · 4 derez ruins
int zoneType(float z){
  float r = hash11(floor(z / ZONE));
  if (r < 0.40) return 0;
  if (r < 0.58) return 1;
  if (r < 0.73) return 2;
  if (r < 0.88) return 3;
  return 4;
}

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash21(i), b = hash21(i + vec2(1,0)), c = hash21(i + vec2(0,1)), d = hash21(i + vec2(1,1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int k = 0; k < 3; k++){ s += a * vnoise(p); p *= 2.03; a *= 0.5; } return s; }
float terrainH(vec2 xz){ return pow(fbm(xz * 0.05), 1.6) * 18.0; }
float seaH(vec2 xz){ return 0.10 * sin(xz.x * 0.5 + uTime * 0.7) * sin(xz.y * 0.42 - uTime * 0.6) + 0.04 * sin(xz.x * 1.3 - uTime); }
float surfaceH(vec3 p){ int zt = zoneType(p.z); if (zt == 2) return seaH(p.xz); if (zt == 3) return terrainH(p.xz); return 0.0; }
float towerH(vec2 id, int zt){ float h = 2.0 + hash21(id) * 10.0; if (zt == 4) h *= 0.4 + hash21(id + 5.0) * 0.45; return h; }

mat2 rot(float a){ float s = sin(a), c = cos(a); return mat2(c, -s, s, c); }
// Two snaking monorail beams (k = 0/1) over the sea & outlands, in DISJOINT
// x-lanes (no overlap), each leaving a trail BEHIND a shared moving head.
float beamHeadZ(){ return uTime * 5.0 + 26.0; }   // current spot (tracks the camera)
float beamX(float z, float k){ float center = mix(-6.0, 7.0, k); return center + sin(z * 0.06 + k * 2.5) * 3.0 + sin(z * 0.025 + k * 4.0) * 1.5; }
float beamY(float z, float k, int zt){ return ((zt == 3) ? terrainH(vec2(beamX(z, k), z)) : seaH(vec2(beamX(z, k), z))) + 4.0; }
float beamDist(vec3 p, float k, int zt){
  float hz = beamHeadZ();
  if (p.z > hz || p.z < hz - 60.0) return 1e9;     // only the trail behind the head
  return length(vec2(p.x - beamX(p.z, k), p.y - beamY(p.z, k, zt))) - 0.22;
}

float sdBox(vec3 p, vec3 b){ vec3 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0); }
float sdSeg2(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0); return length(pa - ba * h); }
float trailDist(vec2 pxz, float py, vec2 path[12], int len){
  float dxz = 1e9;
  for (int i = 0; i < 11; i++){ if (i >= len - 1) break; dxz = min(dxz, sdSeg2(pxz, path[i], path[i + 1])); }
  float dy = abs(py - WALL_H * 0.5) - WALL_H * 0.5;
  return max(dxz - WALL_T, dy);
}

float map(vec3 p){
  int zp = zoneType(p.z);                          // CSE: surfaceH's zone, reused below
  float d = p.y - ((zp == 2) ? seaH(p.xz) : (zp == 3) ? terrainH(p.xz) : 0.0);
  vec2 baseId = floor(p.xz / CELL);
  for (int j = -1; j <= 1; j++){
    int zt = zoneType((baseId.y + float(j) + 0.5) * CELL.y);   // row-invariant: hoisted out of i
    if (zt != 0 && zt != 4) continue;            // whole row: towers only in city & derez
    for (int i = -1; i <= 1; i++){
      vec2 id = baseId + vec2(float(i), float(j));
      if (hash21(id + 31.7) < 0.22) continue;
      vec2 c = (id + 0.5) * CELL;
      float h = towerH(id, zt);
      vec3 lp = p - vec3(c.x, h * 0.5, c.y);
      if (zt == 4) lp.xy = rot((hash21(id + 8.0) - 0.5) * 0.55) * lp.xy;   // derez: collapsing lean
      d = min(d, sdBox(lp, vec3(1.2, h * 0.5, 1.2)));
      if (zt == 4){
        // derez: fragment blocks torn loose, lifting off and dissolving upward
        for (int fI = 0; fI < 2; fI++){
          float fk = float(fI);
          float yl = mod(hash21(id + 3.3 + fk) * 12.0 + uTime * (0.5 + fk * 0.35), 15.0);
          vec3 fc = vec3(c.x + (hash21(id + 1.1 + fk) - 0.5) * 2.6, h + 0.5 + yl, c.y + (hash21(id + 2.2 + fk) - 0.5) * 2.6);
          d = min(d, sdBox(p - fc, vec3(0.32 + hash21(id + fk) * 0.22)));
        }
      }
    }
  }
  if (zp == 2 || zp == 3){                         // sea & outlands → monorail beams, not bikes
    d = min(d, beamDist(p, 0.0, zp));
    d = min(d, beamDist(p, 1.0, zp));
  } else {
    d = min(d, trailDist(p.xz, p.y, uPathA, uLenA));
    d = min(d, trailDist(p.xz, p.y, uPathB, uLenB));
  }
  return d;
}

vec3 skyCol(vec3 rd){ float h = exp(-abs(rd.y) * 5.0); return vec3(0.004, 0.010, 0.025) + vec3(0.04, 0.22, 0.50) * h; }

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  float time = uTime;

  vec3 ro = vec3(2.0 + sin(time * 0.12) * 0.8, 20.0 + sin(time * 0.18) * 1.6, time * 5.0);
  vec3 ta = ro + vec3(sin(time * 0.10) * 0.4, -5.0 + sin(time * 0.15) * 0.8, 9.0);
  vec3 fwd = normalize(ta - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(uv.x * right + uv.y * up + 1.4 * fwd);

  float t = 0.0;
  bool hit = false;
  for (int i = 0; i < 140; i++){
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < 0.002){ hit = true; break; }
    int sz = zoneType(p.z);                        // understep ONLY over the high-gradient terrain;
    t += d * ((sz == 3) ? 0.8 : (sz == 2) ? 0.99 : 1.0);   // 1.0 is exact for SDFs & flat ground
    if (t > 95.0) break;
  }

  vec3 col;
  if (hit){
    vec3 p = ro + rd * t;
    int zt = zoneType(p.z);
    float dG = p.y - ((zt == 2) ? seaH(p.xz) : (zt == 3) ? terrainH(p.xz) : 0.0);   // CSE: reuse zt
    bool beamZone = (zt == 2 || zt == 3);
    float dTA = beamZone ? 1e9 : trailDist(p.xz, p.y, uPathA, uLenA);
    float dTB = beamZone ? 1e9 : trailDist(p.xz, p.y, uPathB, uLenB);
    float dE0 = beamZone ? beamDist(p, 0.0, zt) : 1e9;
    float dE1 = beamZone ? beamDist(p, 1.0, zt) : 1e9;

    vec2 baseId = floor(p.xz / CELL);
    float dB = 1e9; vec2 hitId = baseId; vec3 hitQ = vec3(0.0), hitB = vec3(1.2); int hitZc = 0;
    for (int j = -1; j <= 1; j++){
      int zc = zoneType((baseId.y + float(j) + 0.5) * CELL.y);   // row-invariant: hoisted out of i
      if (zc != 0 && zc != 4) continue;
      for (int i = -1; i <= 1; i++){
        vec2 id = baseId + vec2(float(i), float(j));
        if (hash21(id + 31.7) < 0.22) continue;
        vec2 c = (id + 0.5) * CELL;
        float h = towerH(id, zc);
        vec3 lp = p - vec3(c.x, h * 0.5, c.y);
        if (zc == 4) lp.xy = rot((hash21(id + 8.0) - 0.5) * 0.55) * lp.xy;
        float bd = sdBox(lp, vec3(1.2, h * 0.5, 1.2));
        if (bd < dB){ dB = bd; hitId = id; hitQ = lp; hitB = vec3(1.2, h * 0.5, 1.2); hitZc = zc; }
        if (zc == 4){
          for (int fI = 0; fI < 2; fI++){
            float fk = float(fI);
            float yl = mod(hash21(id + 3.3 + fk) * 12.0 + uTime * (0.5 + fk * 0.35), 15.0);
            vec3 fc = vec3(c.x + (hash21(id + 1.1 + fk) - 0.5) * 2.6, h + 0.5 + yl, c.y + (hash21(id + 2.2 + fk) - 0.5) * 2.6);
            float fr = 0.32 + hash21(id + fk) * 0.22;
            float fd = sdBox(p - fc, vec3(fr));
            if (fd < dB){ dB = fd; hitId = id; hitQ = p - fc; hitB = vec3(fr); hitZc = zc; }
          }
        }
      }
    }

    float mn = min(min(min(dG, dB), min(dTA, dTB)), min(dE0, dE1));
    if (mn == dTA || mn == dTB){
      // ── light-cycle wall ──
      bool isA = (mn == dTA);
      vec3 cc = isA ? vec3(0.30, 0.85, 1.00) : vec3(1.00, 0.45, 0.10);
      vec2 head = isA ? uHeadA : uHeadB;
      float topGlow = smoothstep(0.22, 0.0, WALL_H - p.y);
      float headGlow = exp(-length(p.xz - head) * 0.45);
      col = cc * (1.5 + 1.8 * topGlow + 4.0 * headGlow);
    } else if (mn == dE0 || mn == dE1){
      // ── monorail: hot head at the current spot, fading trail behind it ──
      vec3 bcol = (mn == dE0) ? vec3(0.30, 0.85, 1.00) : vec3(1.00, 0.45, 0.10);
      float hz = beamHeadZ();
      float along = clamp((hz - p.z) / 60.0, 0.0, 1.0);   // 0 at head → 1 at tail
      float headSpot = smoothstep(3.0, 0.0, hz - p.z);    // the bright current spot
      col = bcol * mix(2.6, 0.6, along) + vec3(1.0) * headSpot * 2.5;
    } else if (mn == dB){
      // ── tower / fragment neon edges ──
      vec3 e = abs(hitQ) - hitB;
      float m1 = max(e.x, max(e.y, e.z));
      float m3 = min(e.x, min(e.y, e.z));
      float m2 = e.x + e.y + e.z - m1 - m3;
      float edge = smoothstep(0.11, 0.0, -m2);
      vec3 neon; float lit;
      if (hitZc == 4){                             // captured at the winning assignment (CSE)
        // derez ruins: steady mixed-colour neon (no flicker)
        neon = hash21(hitId + 2.1) > 0.5 ? vec3(1.0, 0.40, 0.08) : vec3(0.20, 0.70, 1.0);
        lit = 1.0;
      } else {
        neon = hash21(hitId + 7.3) > 0.80 ? vec3(1.0, 0.42, 0.07) : vec3(0.15, 0.62, 1.0);
        float s = 0.5 + 0.5 * sin(time * 0.5 - p.z * 0.07);
        float reveal = mix(-0.08, 0.78, smoothstep(0.40, 0.68, s));
        lit = smoothstep(reveal + 0.12, reveal - 0.12, hash21(hitId + 19.1));
      }
      col = vec3(0.014, 0.017, 0.026) + neon * edge * lit * 2.4;
    } else {
      // ── surface by biome ──
      if (zt == 1){
        // grid arena floor
        vec2 f = fract(p.xz / CELL);
        vec2 dl = min(f, 1.0 - f) * CELL;
        float line = smoothstep(0.06, 0.0, min(dl.x, dl.y));
        vec2 f2 = fract(p.xz / (CELL * 0.25));
        vec2 dl2 = min(f2, 1.0 - f2) * (CELL * 0.25);
        float fine = smoothstep(0.03, 0.0, min(dl2.x, dl2.y)) * 0.35;
        col = vec3(0.10, 0.55, 1.0) * max(line, fine) * 1.4 + vec3(0.004, 0.008, 0.018);
      } else if (zt == 2){
        // sea of simulation: luminous rippling data-grid (high-contrast lines)
        vec2 f = fract(p.xz / 2.0);
        vec2 dl = min(f, 1.0 - f) * 2.0;
        float grid = smoothstep(0.07, 0.0, min(dl.x, dl.y));
        float shimmer = 0.55 + 0.45 * sin(p.x * 0.7 + p.z * 0.55 + uTime * 1.6);
        col = vec3(0.06, 0.50, 1.0) * grid * shimmer * 2.2 + vec3(0.0, 0.002, 0.006);
      } else if (zt == 3){
        // outlands: glowing topographic contour lines over dark mountains
        float th = terrainH(p.xz);
        float ct = fract(th * 0.8);
        float contour = smoothstep(0.07, 0.0, min(ct, 1.0 - ct));
        float e2 = 0.18;
        vec3 n = normalize(vec3(terrainH(p.xz - vec2(e2, 0.0)) - terrainH(p.xz + vec2(e2, 0.0)), 2.0 * e2, terrainH(p.xz - vec2(0.0, e2)) - terrainH(p.xz + vec2(0.0, e2))));
        float slope = clamp(1.0 - n.y, 0.0, 1.0);
        col = vec3(0.10, 0.55, 1.0) * contour * (0.5 + slope * 1.8) * 2.0 + vec3(0.001, 0.003, 0.008);
      } else {
        col = vec3(0.012, 0.014, 0.022); // city / derez ground
      }
    }
    col = mix(skyCol(rd), col, exp(-t * 0.024));   // atmosphere
  } else {
    col = skyCol(rd);
  }

  frag = vec4(col, 1.0); // HDR — tonemapped later in the composite pass
}
`;

const BRIGHT_FRAG = `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uTex;
uniform float uThreshold;
void main(){
  vec3 c = texture(uTex, vUv).rgb;
  float b = max(max(c.r, c.g), c.b);
  float k = max(0.0, b - uThreshold);
  frag = vec4(c * (k / max(b, 1e-4)), 1.0);
}
`;

const BLUR_FRAG = `#version 300 es
precision mediump float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uTex;
uniform vec2 uDir;
void main(){
  vec3 s = texture(uTex, vUv).rgb * 0.227027;
  s += texture(uTex, vUv + uDir * 1.0).rgb * 0.316216;
  s += texture(uTex, vUv - uDir * 1.0).rgb * 0.316216;
  s += texture(uTex, vUv + uDir * 2.3).rgb * 0.070270;
  s += texture(uTex, vUv - uDir * 2.3).rgb * 0.070270;
  frag = vec4(s, 1.0);
}
`;

const COMP_FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uBloomStr;
void main(){
  vec3 c = texture(uScene, vUv).rgb;
  c += texture(uBloom, vUv).rgb * uBloomStr;
  c *= 1.2;
  c = c / (1.0 + c);
  c = pow(max(c, 0.0), vec3(0.85));
  frag = vec4(c, 1.0);
}
`;

export function createTronCityProgram(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
): WebGLProgramLike | null {
  const floatExt = gl.getExtension('EXT_color_buffer_float');
  const INTERNAL = floatExt ? gl.RGBA16F : gl.RGBA8;
  const TYPE = floatExt ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;

  const compile = (type: number, src: string): WebGLShader | null => {
    const sh = gl.createShader(type)!;
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('TronCity shader compile error', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  };
  const link = (fragSrc: string): WebGLProgram | null => {
    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
    if (!vs || !fs) return null;
    const pr = gl.createProgram()!;
    gl.attachShader(pr, vs);
    gl.attachShader(pr, fs);
    gl.linkProgram(pr);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(pr, gl.LINK_STATUS)) {
      console.error('TronCity program link error', gl.getProgramInfoLog(pr));
      return null;
    }
    return pr;
  };

  const sceneProg = link(SCENE_FRAG);
  const brightProg = link(BRIGHT_FRAG);
  const blurProg = link(BLUR_FRAG);
  const compProg = link(COMP_FRAG);
  if (!sceneProg || !brightProg || !blurProg || !compProg) return null;

  const vao = gl.createVertexArray()!;
  const vbo = gl.createBuffer()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
  gl.bindVertexArray(null);

  gl.useProgram(brightProg);
  gl.uniform1i(gl.getUniformLocation(brightProg, 'uTex'), 0);
  gl.useProgram(blurProg);
  gl.uniform1i(gl.getUniformLocation(blurProg, 'uTex'), 0);
  gl.useProgram(compProg);
  gl.uniform1i(gl.getUniformLocation(compProg, 'uScene'), 0);
  gl.uniform1i(gl.getUniformLocation(compProg, 'uBloom'), 1);

  const uResolution = gl.getUniformLocation(sceneProg, 'uResolution');
  const uTime = gl.getUniformLocation(sceneProg, 'uTime');
  const uPathA = gl.getUniformLocation(sceneProg, 'uPathA[0]');
  const uLenA = gl.getUniformLocation(sceneProg, 'uLenA');
  const uHeadA = gl.getUniformLocation(sceneProg, 'uHeadA');
  const uPathB = gl.getUniformLocation(sceneProg, 'uPathB[0]');
  const uLenB = gl.getUniformLocation(sceneProg, 'uLenB');
  const uHeadB = gl.getUniformLocation(sceneProg, 'uHeadB');
  const uThreshold = gl.getUniformLocation(brightProg, 'uThreshold');
  const uDir = gl.getUniformLocation(blurProg, 'uDir');
  const uBloomStr = gl.getUniformLocation(compProg, 'uBloomStr');

  type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer; w: number; h: number };
  const mkTarget = (tw: number, th: number): Target => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, INTERNAL, tw, th, 0, gl.RGBA, TYPE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    return { tex, fbo, w: tw, h: th };
  };
  const delTarget = (tgt: Target | null) => {
    if (!tgt) return;
    gl.deleteTexture(tgt.tex);
    gl.deleteFramebuffer(tgt.fbo);
  };
  let scene: Target | null = null;
  let bloomA: Target | null = null;
  let bloomB: Target | null = null;
  const setupTargets = (tw: number, th: number) => {
    delTarget(scene);
    delTarget(bloomA);
    delTarget(bloomB);
    const bw = Math.max(1, tw >> 1);
    const bh = Math.max(1, th >> 1);
    scene = mkTarget(tw, th);
    bloomA = mkTarget(bw, bh);
    bloomB = mkTarget(bw, bh);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  let w = Math.max(1, canvas.width);
  let h = Math.max(1, canvas.height);
  let time = 0;
  setupTargets(w, h);

  // ── light-cycle simulation (CPU) ──
  const CELL_JS = 4.0;
  const CAM_SPEED = 5.0;
  const NPTS = 12;
  type Bike = {
    ix: number;
    iz: number;
    dx: number;
    dz: number;
    prog: number;
    xmin: number;
    xmax: number;
    seed: number;
    corners: Array<[number, number]>;
    head: [number, number];
  };
  const mkBike = (ix: number, iz: number, xmin: number, xmax: number, seed: number): Bike => ({
    ix,
    iz,
    dx: 0,
    dz: 1,
    prog: 0,
    xmin,
    xmax,
    seed: seed >>> 0,
    corners: [[ix * CELL_JS, iz * CELL_JS]],
    head: [ix * CELL_JS, iz * CELL_JS],
  });
  const rndStep = (b: Bike): number => {
    b.seed = (Math.imul(b.seed, 1664525) + 1013904223) >>> 0;
    return b.seed / 4294967296;
  };
  const bikeA = mkBike(0, 6, -2, 0, 0x9e3779b1); // left lane (blue)
  const bikeB = mkBike(1, 5, 1, 3, 0x85ebca77); // right lane (orange)

  const advance = (b: Bike, dt: number, camZ: number) => {
    const headZ = b.iz * CELL_JS + b.dz * b.prog;
    let speed = 7.0 + 0.3 * (camZ + 26.0 - headZ);
    speed = Math.max(3.0, Math.min(18.0, speed));
    b.prog += speed * dt;
    let guard = 0;
    while (b.prog >= CELL_JS && guard++ < 8) {
      b.prog -= CELL_JS;
      b.ix += b.dx;
      b.iz += b.dz;
      b.corners.push([b.ix * CELL_JS, b.iz * CELL_JS]);
      while (b.corners.length > NPTS - 1) b.corners.shift();
      if (b.dz !== 0) {
        if (rndStep(b) < 0.45) {
          let dir = rndStep(b) < 0.5 ? 1 : -1;
          if (b.ix + dir < b.xmin) dir = 1;
          else if (b.ix + dir > b.xmax) dir = -1;
          if (b.ix + dir >= b.xmin && b.ix + dir <= b.xmax) {
            b.dx = dir;
            b.dz = 0;
          }
        }
      } else {
        b.dx = 0;
        b.dz = 1;
      }
    }
    b.head[0] = b.ix * CELL_JS + b.dx * b.prog;
    b.head[1] = b.iz * CELL_JS + b.dz * b.prog;
  };

  const pathA = new Float32Array(NPTS * 2);
  const pathB = new Float32Array(NPTS * 2);
  let lenA = 1;
  let lenB = 1;
  const fillPath = (b: Bike, arr: Float32Array): number => {
    let k = 0;
    for (const c of b.corners) {
      arr[k++] = c[0];
      arr[k++] = c[1];
    }
    arr[k++] = b.head[0];
    arr[k++] = b.head[1];
    const len = b.corners.length + 1;
    while (k < NPTS * 2) {
      arr[k++] = b.head[0];
      arr[k++] = b.head[1];
    }
    return len;
  };

  const draw = () => gl.drawArrays(gl.TRIANGLES, 0, 3);

  return {
    resize(width, height) {
      w = Math.max(1, width);
      h = Math.max(1, height);
      setupTargets(w, h);
    },
    update(dt) {
      time += dt;
      const camZ = time * CAM_SPEED;
      advance(bikeA, dt, camZ);
      advance(bikeB, dt, camZ);
      lenA = fillPath(bikeA, pathA);
      lenB = fillPath(bikeB, pathB);
    },
    render() {
      if (!scene || !bloomA || !bloomB) return;
      gl.bindVertexArray(vao);

      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo);
      gl.viewport(0, 0, scene.w, scene.h);
      gl.useProgram(sceneProg);
      gl.uniform2f(uResolution, w, h);
      gl.uniform1f(uTime, time);
      gl.uniform2fv(uPathA, pathA);
      gl.uniform1i(uLenA, lenA);
      gl.uniform2f(uHeadA, bikeA.head[0], bikeA.head[1]);
      gl.uniform2fv(uPathB, pathB);
      gl.uniform1i(uLenB, lenB);
      gl.uniform2f(uHeadB, bikeB.head[0], bikeB.head[1]);
      draw();

      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
      gl.viewport(0, 0, bloomA.w, bloomA.h);
      gl.useProgram(brightProg);
      gl.uniform1f(uThreshold, 0.65);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, scene.tex);
      draw();

      gl.useProgram(blurProg);
      const tx = 1.0 / bloomA.w;
      const ty = 1.0 / bloomA.h;
      for (let n = 0; n < 2; n++) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fbo);
        gl.viewport(0, 0, bloomB.w, bloomB.h);
        gl.uniform2f(uDir, tx, 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
        draw();
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
        gl.viewport(0, 0, bloomA.w, bloomA.h);
        gl.uniform2f(uDir, 0, ty);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
        draw();
      }

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(compProg);
      gl.uniform1f(uBloomStr, 1.1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, scene.tex);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
      draw();

      gl.bindVertexArray(null);
    },
    dispose() {
      delTarget(scene);
      delTarget(bloomA);
      delTarget(bloomB);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(sceneProg);
      gl.deleteProgram(brightProg);
      gl.deleteProgram(blurProg);
      gl.deleteProgram(compProg);
    },
  };
}
