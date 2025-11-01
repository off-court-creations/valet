#version 300 es
// ─────────────────────────────────────────────────────────────
// src/shaders/lava-lamp/lavaLamp.vert  | valet-docs
// Vertex shader (WebGL2 / GLSL ES 3.00)
//
// High level
// - Renders a single full‑screen triangle (positions provided by JS).
// - Passes a normalized screen coordinate vUV in [0,1]^2 to the fragment shader.
//
// Technical notes
// - Using a full‑screen triangle avoids diagonal interpolation seams and is
//   a common trick to cover the viewport with only three vertices.
// - `aPos` is a clip‑space position in the range [-1, +1].
// - We map `aPos` to vUV with an affine transform: uv = 0.5 * aPos + 0.5.
// - Layout location 0 must match the vertex attrib setup in JS.
//
// IMPORTANT: The `#version` directive must be the very first line of the file.
// ─────────────────────────────────────────────────────────────
precision highp float;

layout (location = 0) in vec2 aPos;
out vec2 vUV;

void main() {
  vUV = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
