// ─────────────────────────────────────────────────────────────
// src/pages/ShaderDemo.tsx | valet
// gl-react shader demo
// ─────────────────────────────────────────────────────────────
import React from 'react';
import {
  Surface as ValetSurface,
  Stack,
  Typography,
  useTheme,
} from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import { Shaders, Node, GLSL } from 'gl-react';
import { Surface as GLSurface } from 'gl-react-dom';

const shaders = Shaders.create({
  plane: {
    vert: GLSL`
    precision highp float;
    attribute vec2 position;
    varying vec2 vUv;
    void main() {
      vUv = position * 0.5 + 0.5;
      float angle = 0.7;
      float c = cos(angle);
      float s = sin(angle);
      vec3 pos = vec3(position.x, position.y, 0.0);
      pos = vec3(c * pos.x, pos.y, s * pos.x);
      float z = 2.0 - pos.z;
      gl_Position = vec4(pos.x / z, pos.y / z, 0.0, 1.0);
    }
    `,
    frag: GLSL`
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D tex;
    void main() {
      gl_FragColor = texture2D(tex, vUv);
    }
    `,
  },
});

const Plane = ({ tex }: { tex: string }) => (
  <Node shader={shaders.plane} uniforms={{ tex }} />
);

export default function ShaderDemoPage() {
  const { theme } = useTheme();

  return (
    <ValetSurface>
      <NavDrawer />
      <Stack style={{ padding: theme.spacing(1) }}>
        <Typography variant="h2" bold>
          Shader Demo
        </Typography>
        <Typography variant="subtitle">
          gl-react example with a textured plane
        </Typography>
        <div style={{ position: 'relative', width: 512, height: 512 }}>
          <GLSurface width={512} height={512}>
            <Plane tex="https://placecats.com/louie/512/512" />
          </GLSurface>
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'magenta',
              pointerEvents: 'none',
            }}
          />
        </div>
      </Stack>
    </ValetSurface>
  );
}
