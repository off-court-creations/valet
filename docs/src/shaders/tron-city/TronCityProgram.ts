// ─────────────────────────────────────────────────────────────
// docs/src/shaders/tron-city/TronCityProgram.ts  | valet-docs
// "Tron City" — WIP toward a Tron: Legacy opening. Raymarched SDF city of
// box skyscrapers revealed by glowing orange/blue neon EDGES (density wave),
// with two LIGHT CYCLES riding the street grid, turning 90°, and leaving
// glowing light-wall trails (cyan + orange). Geometry in the shader; the bike
// paths are simulated on the CPU and uploaded as polyline uniforms each frame.
// ─────────────────────────────────────────────────────────────
import type { WebGLProgramLike } from '@archway/valet';

const VERT = `#version 300 es
layout(location=0) in vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

const FRAG = `#version 300 es
precision highp float;
out vec4 frag;

uniform vec2  uResolution;
uniform float uTime;

// Light-cycle trails: each is a polyline of intersection points + the head.
uniform vec2 uPathA[12]; uniform int uLenA; uniform vec2 uHeadA;
uniform vec2 uPathB[12]; uniform int uLenB; uniform vec2 uHeadB;

const vec2  CELL   = vec2(4.0, 4.0);
const float WALL_H = 1.0;   // light-wall height
const float WALL_T = 0.09;  // light-wall half-thickness

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// The flyover alternates in z between dense CITY stretches and open "game grid"
// ARENA stretches. zoneArena(z) → 1 in an arena stretch, 0 in a city stretch.
const float ZONE = 70.0;
float hash11(float n){ return fract(sin(n * 113.97) * 43758.5453); }
float zoneArena(float z){ return step(0.58, hash11(floor(z / ZONE))); } // ~42% arena

float sdBox(vec3 p, vec3 b){
  vec3 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

// Distance from a 2D point to a segment.
float sdSeg2(vec2 p, vec2 a, vec2 b){
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0.0, 1.0);
  return length(pa - ba * h);
}

// Tall thin wall along a bike's polyline path.
float trailDist(vec2 pxz, float py, vec2 path[12], int len){
  float dxz = 1e9;
  for (int i = 0; i < 11; i++){
    if (i >= len - 1) break;
    dxz = min(dxz, sdSeg2(pxz, path[i], path[i + 1]));
  }
  float dy = abs(py - WALL_H * 0.5) - WALL_H * 0.5;
  return max(dxz - WALL_T, dy);
}

// Scene SDF: ground + 3×3 skyscrapers + the two light-walls.
float map(vec3 p){
  float d = p.y;
  vec2 baseId = floor(p.xz / CELL);
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
    vec2 id = baseId + vec2(float(i), float(j));
    if (zoneArena((id.y + 0.5) * CELL.y) > 0.5) continue; // arena stretch — open grid, no towers
    if (hash21(id + 31.7) < 0.22) continue;   // ~22% empty plots — no tower here
    vec2 c = (id + 0.5) * CELL;
    float h = 2.0 + hash21(id) * 10.0;
    vec3 q = p - vec3(c.x, h * 0.5, c.y);
    d = min(d, sdBox(q, vec3(1.2, h * 0.5, 1.2)));
  }
  d = min(d, trailDist(p.xz, p.y, uPathA, uLenA));
  d = min(d, trailDist(p.xz, p.y, uPathB, uLenB));
  return d;
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  float time = uTime;

  // camera: steady forward flyover, tilted down over the rooftops
  vec3 ro = vec3(2.0, 20.0, time * 5.0);
  vec3 ta = ro + vec3(0.0, -5.0, 9.0);
  vec3 fwd = normalize(ta - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(uv.x * right + uv.y * up + 1.4 * fwd);

  // raymarch
  float t = 0.0;
  bool hit = false;
  for (int i = 0; i < 110; i++){
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < 0.001){ hit = true; break; }
    t += d;
    if (t > 85.0) break;
  }

  vec3 col = vec3(0.0); // black void
  if (hit){
    vec3 p = ro + rd * t;
    float dG = p.y;
    float dTA = trailDist(p.xz, p.y, uPathA, uLenA);
    float dTB = trailDist(p.xz, p.y, uPathB, uLenB);

    // nearest building (for edge glow + id)
    vec2 baseId = floor(p.xz / CELL);
    float dB = 1e9; vec2 hitId = baseId; float hitH = 0.0; vec3 hitQ = vec3(0.0);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
      vec2 id = baseId + vec2(float(i), float(j));
      if (zoneArena((id.y + 0.5) * CELL.y) > 0.5) continue; // arena stretch — no towers
      if (hash21(id + 31.7) < 0.22) continue;   // ~22% empty plots
      vec2 c = (id + 0.5) * CELL;
      float h = 2.0 + hash21(id) * 10.0;
      vec3 q = p - vec3(c.x, h * 0.5, c.y);
      float bd = sdBox(q, vec3(1.2, h * 0.5, 1.2));
      if (bd < dB){ dB = bd; hitId = id; hitH = h; hitQ = q; }
    }

    float mn = min(min(dG, dB), min(dTA, dTB));
    if (mn == dTA || mn == dTB){
      // ── light-cycle wall ──
      bool isA = (mn == dTA);
      vec3 cc = isA ? vec3(0.30, 0.85, 1.00) : vec3(1.00, 0.45, 0.10);
      vec2 head = isA ? uHeadA : uHeadB;
      float topGlow = smoothstep(0.22, 0.0, WALL_H - p.y);  // hot top edge of the wall
      float headGlow = exp(-length(p.xz - head) * 0.45);    // blaze near the bike
      col = cc * (1.5 + 1.8 * topGlow + 4.0 * headGlow);
    } else if (mn == dB){
      // ── building neon edges with the reveal wave ──
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
      // ground — a glowing game-grid in arena stretches, near-black in the city
      if (zoneArena(p.z) > 0.5){
        vec2 f = fract(p.xz / CELL);
        vec2 dl = min(f, 1.0 - f) * CELL;                 // world dist to nearest grid line
        float line = smoothstep(0.06, 0.0, min(dl.x, dl.y));
        vec2 f2 = fract(p.xz / (CELL * 0.25));            // finer sub-grid
        vec2 dl2 = min(f2, 1.0 - f2) * (CELL * 0.25);
        float fine = smoothstep(0.03, 0.0, min(dl2.x, dl2.y)) * 0.35;
        float g = max(line, fine);
        col = vec3(0.10, 0.55, 1.0) * g * 1.4 + vec3(0.004, 0.008, 0.018);
      } else {
        col = vec3(0.012, 0.014, 0.022);                  // city ground, near-black
      }
    }
    col *= exp(-t * 0.022); // distance fade into the void
  }

  frag = vec4(col, 1.0);
}
`;

export function createTronCityProgram(
  gl: WebGL2RenderingContext,
  canvas: HTMLCanvasElement,
): WebGLProgramLike | null {
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

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('TronCity program link error', gl.getProgramInfoLog(prog));
    return null;
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const vao = gl.createVertexArray()!;
  const vbo = gl.createBuffer()!;
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 8, 0);
  gl.bindVertexArray(null);

  const uResolution = gl.getUniformLocation(prog, 'uResolution');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uPathA = gl.getUniformLocation(prog, 'uPathA[0]');
  const uLenA = gl.getUniformLocation(prog, 'uLenA');
  const uHeadA = gl.getUniformLocation(prog, 'uHeadA');
  const uPathB = gl.getUniformLocation(prog, 'uPathB[0]');
  const uLenB = gl.getUniformLocation(prog, 'uLenB');
  const uHeadB = gl.getUniformLocation(prog, 'uHeadB');

  let w = canvas.width;
  let h = canvas.height;
  let time = 0;

  // ── light-cycle simulation (CPU) ──
  const CELL_JS = 4.0;
  const CAM_SPEED = 5.0;
  const NPTS = 12; // trail polyline capacity (corners + head)

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
  // Tron rule: blue and orange can NEVER share a cell / overlap. Enforced by
  // disjoint x-lanes with a one-block buffer (which the camera flies down):
  // blue rides world x ∈ [-8, 0], orange x ∈ [4, 12]. Both only move +z, so
  // their trails are monotone and can't cross — no derez.
  const bikeA = mkBike(0, 6, -2, 0, 0x9e3779b1); // left lane (blue)
  const bikeB = mkBike(1, 5, 1, 3, 0x85ebca77); // right lane (orange)

  const advance = (b: Bike, dt: number, camZ: number) => {
    const headZ = b.iz * CELL_JS + b.dz * b.prog;
    // feedback: hold the bike ~26 units ahead of the camera
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
        // going forward → occasionally jog onto a cross-street (90° turn)
        if (rndStep(b) < 0.45) {
          let dir = rndStep(b) < 0.5 ? 1 : -1;
          if (b.ix + dir < b.xmin) dir = 1;
          else if (b.ix + dir > b.xmax) dir = -1;
          if (b.ix + dir >= b.xmin && b.ix + dir <= b.xmax) { b.dx = dir; b.dz = 0; }
        }
      } else {
        b.dx = 0; b.dz = 1; // after one sideways block, resume forward
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
    for (const c of b.corners) { arr[k++] = c[0]; arr[k++] = c[1]; }
    arr[k++] = b.head[0]; arr[k++] = b.head[1];
    const len = b.corners.length + 1;
    while (k < NPTS * 2) { arr[k++] = b.head[0]; arr[k++] = b.head[1]; }
    return len;
  };

  return {
    resize(width, height) {
      w = width;
      h = height;
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
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.uniform2f(uResolution, w, h);
      gl.uniform1f(uTime, time);
      gl.uniform2fv(uPathA, pathA);
      gl.uniform1i(uLenA, lenA);
      gl.uniform2f(uHeadA, bikeA.head[0], bikeA.head[1]);
      gl.uniform2fv(uPathB, pathB);
      gl.uniform1i(uLenB, lenB);
      gl.uniform2f(uHeadB, bikeB.head[0], bikeB.head[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    },
    dispose() {
      gl.deleteBuffer(vbo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(prog);
    },
  };
}
