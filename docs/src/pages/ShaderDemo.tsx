// ─────────────────────────────────────────────────────────────
// src/pages/ShaderDemo.tsx  | valet
// Simple gl-react demo with image background
// ─────────────────────────────────────────────────────────────
import { Surface as GLCanvas, Node, Shaders, GLSL } from 'gl-react';
import { Surface, Stack, Typography } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import { useTheme } from '@archway/valet';

const shaders = Shaders.create({
  show: {
    // Render the texture and overlay a magenta circle using gl_FragCoord
    frag: GLSL`
    #ifdef GL_ES
    precision highp float;
    #endif
    varying vec2 uv;
    uniform sampler2D tex;
    uniform vec2 resolution;
    void main() {
      vec4 color = texture2D(tex, uv);
      vec2 frag = gl_FragCoord.xy;
      float dist = distance(frag, vec2(16.0, resolution.y - 16.0));
      if (dist < 8.0) {
        color = vec4(1.0, 0.0, 1.0, 1.0);
      }
      gl_FragColor = color;
    }
    `,
  },
});

export default function ShaderDemoPage() {
  const { theme } = useTheme();

  return (
    <Surface>
      <NavDrawer />
      <Stack style={{ padding: theme.spacing(1) }}>
        <Typography variant="h2" bold>
          gl-react Shader Demo
        </Typography>
        <GLCanvas
          style={{
            width: 512,
            height: 512,
            marginTop: theme.spacing(2),
            transform: 'perspective(800px) rotateX(25deg)',
            transformStyle: 'preserve-3d',
          }}
        >
          <Node
            shader={shaders['show'] as any}
            uniforms={{
              tex: 'https://placecats.com/louie/512/512',
              resolution: [512, 512],
            }}
          />
        </GLCanvas>
      </Stack>
    </Surface>
  );
}
