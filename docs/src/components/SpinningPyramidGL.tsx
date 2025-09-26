// ─────────────────────────────────────────────────────────────
// src/components/SpinningPyramidGL.tsx  | valet-docs
// Minimal WebGL2 spinning pyramid background for the hero
// ─────────────────────────────────────────────────────────────
import React, { useEffect, useRef } from 'react';

type Props = {
  style?: React.CSSProperties;
  className?: string;
};

export default function SpinningPyramidGL({ style, className }: Props) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const gl = canvas.getContext('webgl2', { antialias: true });
    if (!gl) {
      // Graceful fallback: leave canvas hidden if WebGL2 unavailable
      return;
    }

    // Helpers – compile/link
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

    const vsSrc = `#version 300 es\n\
precision highp float;\n\
in vec3 aPosition;\n\
in vec3 aColor;\n\
uniform mat4 uProjection;\n\
uniform mat4 uModelView;\n\
out vec3 vColor;\n\
void main() {\n\
  vColor = aColor;\n\
  gl_Position = uProjection * uModelView * vec4(aPosition, 1.0);\n\
}`;

    const fsSrc = `#version 300 es\n\
precision highp float;\n\
in vec3 vColor;\n\
out vec4 outColor;\n\
void main() {\n\
  outColor = vec4(vColor, 1.0);\n\
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

    // Attributes/uniforms
    const aPosition = gl.getAttribLocation(prog, 'aPosition');
    const aColor = gl.getAttribLocation(prog, 'aColor');
    const uProjection = gl.getUniformLocation(prog, 'uProjection');
    const uModelView = gl.getUniformLocation(prog, 'uModelView');

    // Geometry – pyramid (4 sides + base), interleaved position + color
    // Coords define a square base at y = -0.6 and apex at y = 0.6
    const apex = [0, 0.6, 0];
    const blf = [-0.6, -0.6, 0.6]; // front left
    const brf = [0.6, -0.6, 0.6]; // front right
    const brb = [0.6, -0.6, -0.6]; // back right
    const blb = [-0.6, -0.6, -0.6]; // back left

    // Colors for faces
    const RED = [1, 0.2, 0.2];
    const GREEN = [0.2, 1, 0.4];
    const BLUE = [0.2, 0.6, 1];
    const YELLOW = [1, 0.9, 0.2];
    const GREY = [0.5, 0.55, 0.6];

    // Triangles: [pos(x,y,z), color(r,g,b)] * 3 per triangle
    const data: number[] = [
      // Sides
      ...apex,
      ...RED,
      ...blf,
      ...RED,
      ...brf,
      ...RED, // front
      ...apex,
      ...GREEN,
      ...brf,
      ...GREEN,
      ...brb,
      ...GREEN, // right
      ...apex,
      ...BLUE,
      ...brb,
      ...BLUE,
      ...blb,
      ...BLUE, // back
      ...apex,
      ...YELLOW,
      ...blb,
      ...YELLOW,
      ...blf,
      ...YELLOW, // left
      // Base (two triangles)
      ...blf,
      ...GREY,
      ...brf,
      ...GREY,
      ...brb,
      ...GREY,
      ...blf,
      ...GREY,
      ...brb,
      ...GREY,
      ...blb,
      ...GREY,
    ];

    const vbo = gl.createBuffer()!;
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    const stride = 6 * 4; // 6 floats per vertex, 4 bytes each
    gl.enableVertexAttribArray(aPosition);
    gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(aColor);
    gl.vertexAttribPointer(aColor, 3, gl.FLOAT, false, stride, 3 * 4);

    gl.bindVertexArray(null);

    // Mat4 utilities (column-major)
    const mat4 = {
      identity(): Float32Array {
        return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
      },
      multiply(a: Float32Array, b: Float32Array): Float32Array {
        // Column-major multiply (a * b) with column vectors
        const out = new Float32Array(16);
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 4; col++) {
            const a0 = a[0 * 4 + row] as number;
            const a1 = a[1 * 4 + row] as number;
            const a2 = a[2 * 4 + row] as number;
            const a3 = a[3 * 4 + row] as number;
            const b0 = b[col * 4 + 0] as number;
            const b1 = b[col * 4 + 1] as number;
            const b2 = b[col * 4 + 2] as number;
            const b3 = b[col * 4 + 3] as number;
            out[col * 4 + row] = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
          }
        }
        return out;
      },
      perspective(fovyRad: number, aspect: number, near: number, far: number): Float32Array {
        const f = 1.0 / Math.tan(fovyRad / 2);
        const nf = 1 / (near - far);
        // Column-major perspective matrix (glMatrix layout)
        return new Float32Array([
          f / aspect,
          0,
          0,
          0,
          0,
          f,
          0,
          0,
          0,
          0,
          (far + near) * nf,
          -1,
          0,
          0,
          2 * far * near * nf,
          0,
        ]);
      },
      translate(m: Float32Array, v: [number, number, number]): Float32Array {
        const [x, y, z] = v;
        const t = new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1]);
        return mat4.multiply(m, t);
      },
      rotateX(m: Float32Array, rad: number): Float32Array {
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const r = new Float32Array([1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0, 0, 0, 0, 1]);
        return mat4.multiply(m, r);
      },
      rotateY(m: Float32Array, rad: number): Float32Array {
        const c = Math.cos(rad);
        const s = Math.sin(rad);
        const r = new Float32Array([c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0, 0, 0, 0, 1]);
        return mat4.multiply(m, r);
      },
    };

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

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    let raf = 0;
    const t0 = performance.now();
    const render = () => {
      raf = requestAnimationFrame(render);
      const t = (performance.now() - t0) / 1000; // seconds

      gl.clearColor(0.02, 0.02, 0.04, 1.0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      gl.useProgram(prog);
      gl.bindVertexArray(vao);

      const aspect = canvas.width / canvas.height;
      const proj = mat4.perspective((60 * Math.PI) / 180, aspect, 0.1, 100);
      let mv = mat4.identity();
      mv = mat4.translate(mv, [0, -0.1, -3.2]);
      mv = mat4.rotateX(mv, -0.3); // slight tilt
      mv = mat4.rotateY(mv, t * 0.9); // spin

      gl.uniformMatrix4fv(uProjection, false, proj);
      gl.uniformMatrix4fv(uModelView, false, mv);

      const triCount = data.length / 6 / 3; // vertices per triangle = 3, 6 floats per vertex
      gl.drawArrays(gl.TRIANGLES, 0, triCount * 3);

      gl.bindVertexArray(null);
      gl.useProgram(null);
    };
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl!.deleteBuffer(vbo);
      gl!.deleteVertexArray(vao);
      gl!.deleteProgram(prog);
      gl!.deleteShader(vs!);
      gl!.deleteShader(fs!);
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
