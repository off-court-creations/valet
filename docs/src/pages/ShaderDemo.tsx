// ─────────────────────────────────────────────────────────────
// src/pages/ShaderDemo.tsx | valet docs
// Demo of gl-react with a simple textured plane
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
  picture: {
    frag: GLSL`
precision highp float;
varying vec2 uv;
uniform sampler2D tex;
void main() {
  gl_FragColor = texture2D(tex, uv);
}
    `,
  },
});

const Picture = () => (
  <Node shader={shaders.picture} uniforms={{ tex: 'https://placecats.com/louie/512/512' }} />
);

export default function ShaderDemo() {
  const { theme } = useTheme();
  return (
    <ValetSurface>
      <NavDrawer />
      <Stack style={{ padding: theme.spacing(1) }}>
        <Typography variant="h2" bold>
          Shader Demo
        </Typography>
        <Typography variant="subtitle">
          Textured plane rendered with gl-react
        </Typography>
        <div
          style={{
            position: 'relative',
            width: 512,
            height: 512,
            marginTop: theme.spacing(1),
            perspective: '800px',
          }}
        >
          <GLSurface
            width={512}
            height={512}
            style={{
              transform: 'rotateX(20deg) rotateY(-20deg)',
            }}
          >
            <Picture />
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
