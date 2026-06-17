// ─────────────────────────────────────────────────────────────
// docs/src/shaders/tron-city/TronCityProgram.ts  | valet-docs
// "Tron City" — WIP toward a Tron: Legacy opening. A raymarched SDF city
// alternating with open "game grid" arenas, two light cycles leaving glowing
// wall-trails, a glowing horizon + atmosphere, a drifting camera, and a
// multi-pass BLOOM pipeline (scene → bright-pass → blur → composite).
// Bike paths are simulated on the CPU and uploaded as polyline uniforms.
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
const float ZONE   = 70.0;

float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float hash11(float n){ return fract(sin(n * 113.97) * 43758.5453); }
float zoneArena(float z){ return step(0.58, hash11(floor(z / ZONE))); }

float sdBox(vec3 p, vec3 b){ vec3 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0); }
float sdSeg2(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0); return length(pa - ba * h); }

float trailDist(vec2 pxz, float py, vec2 path[12], int len){
  float dxz = 1e9;
  for (int i = 0; i < 11; i++){ if (i >= len - 1) break; dxz = min(dxz, sdSeg2(pxz, path[i], path[i + 1])); }
  float dy = abs(py - WALL_H * 0.5) - WALL_H * 0.5;
  return max(dxz - WALL_T, dy);
}

float map(vec3 p){
  float d = p.y;
  vec2 baseId = floor(p.xz / CELL);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 id = baseId + vec2(float(i), float(j));
    if (zoneArena((id.y + 0.5) * CELL.y) > 0.5) continue;
    if (hash21(id + 31.7) < 0.22) continue;
    vec2 c = (id + 0.5) * CELL;
    float h = 2.0 + hash21(id) * 10.0;
    vec3 q = p - vec3(c.x, h * 0.5, c.y);
    d = min(d, sdBox(q, vec3(1.2, h * 0.5, 1.2)));
  }
  d = min(d, trailDist(p.xz, p.y, uPathA, uLenA));
  d = min(d, trailDist(p.xz, p.y, uPathB, uLenB));
  return d;
}

// Atmosphere: deep void with a glowing cyan horizon band.
vec3 skyCol(vec3 rd){
  float h = exp(-abs(rd.y) * 5.0);
  return vec3(0.004, 0.010, 0.025) + vec3(0.04, 0.22, 0.50) * h;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  float time = uTime;

  // camera: forward flyover with a gentle drift/bob/sway
  vec3 ro = vec3(2.0 + sin(time * 0.12) * 0.8, 20.0 + sin(time * 0.18) * 1.6, time * 5.0);
  vec3 ta = ro + vec3(sin(time * 0.10) * 0.4, -5.0 + sin(time * 0.15) * 0.8, 9.0);
  vec3 fwd = normalize(ta - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(uv.x * right + uv.y * up + 1.4 * fwd);

  float t = 0.0;
  bool hit = false;
  for (int i = 0; i < 110; i++){
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < 0.001){ hit = true; break; }
    t += d;
    if (t > 85.0) break;
  }

  vec3 col;
  if (hit){
    vec3 p = ro + rd * t;
    float dG = p.y;
    float dTA = trailDist(p.xz, p.y, uPathA, uLenA);
    float dTB = trailDist(p.xz, p.y, uPathB, uLenB);

    vec2 baseId = floor(p.xz / CELL);
    float dB = 1e9; vec2 hitId = baseId; float hitH = 0.0; vec3 hitQ = vec3(0.0);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
      vec2 id = baseId + vec2(float(i), float(j));
      if (zoneArena((id.y + 0.5) * CELL.y) > 0.5) continue;
      if (hash21(id + 31.7) < 0.22) continue;
      vec2 c = (id + 0.5) * CELL;
      float h = 2.0 + hash21(id) * 10.0;
      vec3 q = p - vec3(c.x, h * 0.5, c.y);
      float bd = sdBox(q, vec3(1.2, h * 0.5, 1.2));
      if (bd < dB){ dB = bd; hitId = id; hitH = h; hitQ = q; }
    }

    float mn = min(min(dG, dB), min(dTA, dTB));
    if (mn == dTA || mn == dTB){
      bool isA = (mn == dTA);
      vec3 cc = isA ? vec3(0.30, 0.85, 1.00) : vec3(1.00, 0.45, 0.10);
      vec2 head = isA ? uHeadA : uHeadB;
      float topGlow = smoothstep(0.22, 0.0, WALL_H - p.y);
      float headGlow = exp(-length(p.xz - head) * 0.45);
      col = cc * (1.5 + 1.8 * topGlow + 4.0 * headGlow);
    } else if (mn == dB){
      vec3 e = abs(hitQ) - vec3(1.2, hitH * 0.5, 1.2);
      float m1 = max(e.x, max(e.y, e.z));
      float m3 = min(e.x, min(e.y, e.z));
      float m2 = e.x + e.y + e.z - m1 - m3;
      float edge = smoothstep(0.11, 0.0, -m2);
      vec3 neon = hash21(hitId + 7.3) > 0.80 ? vec3(1.0, 0.42, 0.07) : vec3(0.15, 0.62, 1.0);
      float s = 0.5 + 0.5 * sin(time * 0.5 - p.z * 0.07);
      float wv = smoothstep(0.40, 0.68, s);
      float reveal = mix(-0.08, 0.78, wv);
      float lit = smoothstep(reveal + 0.12, reveal - 0.12, hash21(hitId + 19.1));
      col = vec3(0.014, 0.017, 0.026) + neon * edge * lit * 2.4;
    } else {
      if (zoneArena(p.z) > 0.5){
        vec2 f = fract(p.xz / CELL);
        vec2 dl = min(f, 1.0 - f) * CELL;
        float line = smoothstep(0.06, 0.0, min(dl.x, dl.y));
        vec2 f2 = fract(p.xz / (CELL * 0.25));
        vec2 dl2 = min(f2, 1.0 - f2) * (CELL * 0.25);
        float fine = smoothstep(0.03, 0.0, min(dl2.x, dl2.y)) * 0.35;
        col = vec3(0.10, 0.55, 1.0) * max(line, fine) * 1.4 + vec3(0.004, 0.008, 0.018);
      } else {
        col = vec3(0.012, 0.014, 0.022);
      }
    }
    // fade the scene into the atmosphere with distance
    col = mix(skyCol(rd), col, exp(-t * 0.024));
  } else {
    col = skyCol(rd);
  }

  frag = vec4(col, 1.0); // HDR — tonemapped later in the composite pass
}
`;

const BRIGHT_FRAG = `#version 300 es
precision highp float;
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
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform sampler2D uTex;
uniform vec2 uDir; // texel step along one axis
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
  c += texture(uBloom, vUv).rgb * uBloomStr;     // additive glow
  c *= 1.2;                                       // exposure
  c = c / (1.0 + c);                              // Reinhard tonemap
  c = pow(max(c, 0.0), vec3(0.85));               // gamma
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

  // sampler bindings (constant)
  gl.useProgram(brightProg); gl.uniform1i(gl.getUniformLocation(brightProg, 'uTex'), 0);
  gl.useProgram(blurProg); gl.uniform1i(gl.getUniformLocation(blurProg, 'uTex'), 0);
  gl.useProgram(compProg);
  gl.uniform1i(gl.getUniformLocation(compProg, 'uScene'), 0);
  gl.uniform1i(gl.getUniformLocation(compProg, 'uBloom'), 1);

  // scene uniform locations
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

  // render targets (recreated on resize)
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
  const delTarget = (t: Target | null) => {
    if (!t) return;
    gl.deleteTexture(t.tex);
    gl.deleteFramebuffer(t.fbo);
  };
  let scene: Target | null = null;
  let bloomA: Target | null = null;
  let bloomB: Target | null = null;
  const setupTargets = (tw: number, th: number) => {
    delTarget(scene); delTarget(bloomA); delTarget(bloomB);
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
    ix: number; iz: number; dx: number; dz: number; prog: number;
    xmin: number; xmax: number; seed: number;
    corners: Array<[number, number]>; head: [number, number];
  };
  const mkBike = (ix: number, iz: number, xmin: number, xmax: number, seed: number): Bike => ({
    ix, iz, dx: 0, dz: 1, prog: 0, xmin, xmax, seed: seed >>> 0,
    corners: [[ix * CELL_JS, iz * CELL_JS]], head: [ix * CELL_JS, iz * CELL_JS],
  });
  const rndStep = (b: Bike): number => {
    b.seed = (Math.imul(b.seed, 1664525) + 1013904223) >>> 0;
    return b.seed / 4294967296;
  };
  // disjoint lanes (Tron rule: blue & orange never overlap)
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
          if (b.ix + dir >= b.xmin && b.ix + dir <= b.xmax) { b.dx = dir; b.dz = 0; }
        }
      } else { b.dx = 0; b.dz = 1; }
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
    for (const c of b.corners) { arr[k++] = c[0]; arr[k++] = c[1]; }
    arr[k++] = b.head[0]; arr[k++] = b.head[1];
    const len = b.corners.length + 1;
    while (k < NPTS * 2) { arr[k++] = b.head[0]; arr[k++] = b.head[1]; }
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

      // 1 ▸ scene → sceneFBO (HDR)
      gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fbo);
      gl.viewport(0, 0, scene.w, scene.h);
      gl.useProgram(sceneProg);
      gl.uniform2f(uResolution, w, h);
      gl.uniform1f(uTime, time);
      gl.uniform2fv(uPathA, pathA); gl.uniform1i(uLenA, lenA); gl.uniform2f(uHeadA, bikeA.head[0], bikeA.head[1]);
      gl.uniform2fv(uPathB, pathB); gl.uniform1i(uLenB, lenB); gl.uniform2f(uHeadB, bikeB.head[0], bikeB.head[1]);
      draw();

      // 2 ▸ bright-pass scene → bloomA (half res)
      gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
      gl.viewport(0, 0, bloomA.w, bloomA.h);
      gl.useProgram(brightProg);
      gl.uniform1f(uThreshold, 0.65);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene.tex);
      draw();

      // 3 ▸ separable Gaussian blur, ping-pong A↔B (2 iterations)
      gl.useProgram(blurProg);
      const tx = 1.0 / bloomA.w;
      const ty = 1.0 / bloomA.h;
      for (let n = 0; n < 2; n++) {
        // horizontal A → B
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomB.fbo);
        gl.viewport(0, 0, bloomB.w, bloomB.h);
        gl.uniform2f(uDir, tx, 0);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
        draw();
        // vertical B → A
        gl.bindFramebuffer(gl.FRAMEBUFFER, bloomA.fbo);
        gl.viewport(0, 0, bloomA.w, bloomA.h);
        gl.uniform2f(uDir, 0, ty);
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, bloomB.tex);
        draw();
      }

      // 4 ▸ composite sceneTex + bloomA → canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(compProg);
      gl.uniform1f(uBloomStr, 1.1);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, scene.tex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, bloomA.tex);
      draw();

      gl.bindVertexArray(null);
    },
    dispose() {
      delTarget(scene); delTarget(bloomA); delTarget(bloomB);
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(sceneProg);
      gl.deleteProgram(brightProg);
      gl.deleteProgram(blurProg);
      gl.deleteProgram(compProg);
    },
  };
}
