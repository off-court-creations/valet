// ─────────────────────────────────────────────────────────────
// docs/src/shaders/tron-city/TronCityProgram.ts  | valet-docs
// "Tron City" — WIP. STEP 1: a raymarched flyover of a procedural city of
// box skyscrapers. Geometry + camera only — plain grey shading on black.
// (Neon edges, bloom, and the grid horizon come in later steps.)
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

// --- hash: one stable pseudo-random per city cell ---
float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// --- exact box SDF ---
float sdBox(vec3 p, vec3 b){
  vec3 d = abs(p) - b;
  return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
}

const vec2 CELL = vec2(4.0, 4.0); // city block size (xz)

// Scene SDF: ground plane + a grid of skyscrapers. Each cell holds one tower
// whose height comes from the cell hash. We test the 3×3 neighbourhood so the
// march never overshoots a tower in an adjacent block.
float map(vec3 p){
  float d = p.y; // ground at y = 0
  vec2 baseId = floor(p.xz / CELL);
  for (int j = -1; j <= 1; j++){
    for (int i = -1; i <= 1; i++){
      vec2 id = baseId + vec2(float(i), float(j));
      vec2 center = (id + 0.5) * CELL;
      float h = 2.0 + hash21(id) * 10.0;          // tower height 2..12
      vec3 q = p - vec3(center.x, h * 0.5, center.y);
      d = min(d, sdBox(q, vec3(1.2, h * 0.5, 1.2))); // footprint 2.4 → 1.6 streets
    }
  }
  return d;
}

vec3 calcNormal(vec3 p){
  vec2 e = vec2(0.0015, 0.0);
  return normalize(vec3(
    map(p + e.xyy) - map(p - e.xyy),
    map(p + e.yxy) - map(p - e.yxy),
    map(p + e.yyx) - map(p - e.yyx)
  ));
}

void main(){
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
  float time = uTime;

  // --- camera: a steady forward flyover, tilted down over the rooftops ---
  vec3 ro = vec3(2.0, 20.0, time * 5.0);
  vec3 ta = ro + vec3(0.0, -5.0, 9.0);                 // look ahead + down (~29°)
  vec3 fwd = normalize(ta - ro);
  vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), fwd));
  vec3 up = cross(fwd, right);
  vec3 rd = normalize(uv.x * right + uv.y * up + 1.4 * fwd); // 1.4 ≈ fov

  // --- raymarch ---
  float t = 0.0;
  float tmax = 85.0;
  bool hit = false;
  for (int i = 0; i < 110; i++){
    vec3 p = ro + rd * t;
    float d = map(p);
    if (d < 0.001){ hit = true; break; }
    t += d;
    if (t > tmax) break;
  }

  vec3 col = vec3(0.0); // black void
  if (hit){
    vec3 p = ro + rd * t;
    if (p.y < 0.03){
      // ground — near-black for now (the glowing grid floor comes later)
      col = vec3(0.012, 0.014, 0.022);
    } else {
      // Identify the hit tower (nearest box in the 3×3) for its edges + id.
      vec2 baseId = floor(p.xz / CELL);
      float best = 1e9;
      vec2 hitId = baseId; float hitH = 0.0; vec3 hitQ = vec3(0.0);
      for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
        vec2 id = baseId + vec2(float(i), float(j));
        vec2 c = (id + 0.5) * CELL;
        float h = 2.0 + hash21(id) * 10.0;
        vec3 q = p - vec3(c.x, h * 0.5, c.y);
        float bd = abs(sdBox(q, vec3(1.2, h * 0.5, 1.2)));
        if (bd < best){ best = bd; hitId = id; hitH = h; hitQ = q; }
      }
      // Edge proximity: on the surface the LARGEST of (|q|-b) is ~0 (the face we
      // hit); the MIDDLE component reaches 0 exactly along an edge of that face.
      vec3 e = abs(hitQ) - vec3(1.2, hitH * 0.5, 1.2);
      float m1 = max(e.x, max(e.y, e.z));
      float m3 = min(e.x, min(e.y, e.z));
      float m2 = e.x + e.y + e.z - m1 - m3;       // middle value
      float edge = smoothstep(0.11, 0.0, -m2);    // thin glowing line along the edge

      // Tron palette split: mostly electric blue, the odd orange tower.
      vec3 neon = hash21(hitId + 7.3) > 0.80
        ? vec3(1.00, 0.42, 0.07)
        : vec3(0.15, 0.62, 1.00);

      // Reveal density: a wave sweeping forward through the city, gated by a
      // per-tower threshold. Biased to LINGER sparse (a bare scatter of edges)
      // and only briefly swell to ~current density — never denser.
      float s = 0.5 + 0.5 * sin(time * 0.5 - p.z * 0.07);
      // Flat-top/flat-bottom shaping: dwell sparse, then HOLD a broad dense swell
      // (a plateau, not a fleeting spike), then recede back to sparse.
      float w = smoothstep(0.40, 0.68, s);
      float reveal = mix(-0.08, 0.78, w);                 // trough ≈ empty · peak ≈ current
      float lit = smoothstep(reveal + 0.12, reveal - 0.12, hash21(hitId + 19.1));

      vec3 base = vec3(0.014, 0.017, 0.026);      // the "invisible" city, barely there
      col = base + neon * edge * lit * 2.4;       // bright neon edges (HDR core clips hot)
    }
    col *= exp(-t * 0.022);                       // distance fade into the void
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

  let w = canvas.width;
  let h = canvas.height;
  let time = 0;

  return {
    resize(width, height) {
      w = width;
      h = height;
    },
    update(dt) {
      time += dt;
    },
    render() {
      gl.useProgram(prog);
      gl.bindVertexArray(vao);
      gl.uniform2f(uResolution, w, h);
      gl.uniform1f(uTime, time);
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
