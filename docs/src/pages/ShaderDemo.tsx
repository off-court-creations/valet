// ─────────────────────────────────────────────────────────────
// src/pages/ShaderDemo.tsx | valet
// Simple gl-react demo with a 3D plane
// ─────────────────────────────────────────────────────────────
import { Surface as ValetSurface, Stack, Typography, Button, useTheme } from '@archway/valet';
import NavDrawer from "../components/NavDrawer";
import { Surface as GLSurface, Node, Shaders, GLSL } from 'gl-react-dom';
import { useNavigate } from 'react-router-dom';

const shaders = Shaders.create({
  plane: {
    vert: GLSL`
precision highp float;
attribute vec2 _p;
varying vec2 vUv;
uniform float angle;
void main() {
  vUv = _p * 0.5 + 0.5;
  float c = cos(angle);
  float s = sin(angle);
  vec3 pos = vec3(_p, 0.0);
  pos = vec3(c * pos.x + s * pos.z, pos.y, -s * pos.x + c * pos.z);
  pos.z += 1.5;
  float perspective = 2.5 - pos.z;
  gl_Position = vec4(pos.xy / perspective, 0.0, 1.0);
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
  <Node shader={shaders.plane} uniforms={{ tex, angle: 0.5 }} />
);

export default function ShaderDemoPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <ValetSurface>
      <NavDrawer />
      <Stack style={{ padding: theme.spacing(1), maxWidth: 1024, margin: '0 auto' }}>
        <Typography variant="h2" bold>
          Shader Demo
        </Typography>
        <Typography variant="subtitle">
          3D plane rendered with gl-react
        </Typography>
        <div style={{ position: 'relative', width: 512, height: 512, margin: '1rem auto' }}>
          <GLSurface width={512} height={512} pixelRatio={1} style={{ width: '100%', height: '100%' }}>
            <Plane tex="https://placecats.com/louie/512/512" />
          </GLSurface>
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              width: 16,
              height: 16,
              background: 'magenta',
              borderRadius: '50%',
              pointerEvents: 'none',
            }}
          />
        </div>
        <Button size="lg" onClick={() => navigate(-1)} style={{ marginTop: theme.spacing(1) }}>
          ← Back
        </Button>
      </Stack>
    </ValetSurface>
  );
}
