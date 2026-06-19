// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/WebGLCanvasDemo.tsx  | valet-docs
// Demo page for the WebGLCanvas component — generic explainer + a live scene.
// ─────────────────────────────────────────────────────────────
import { Stack, Panel, Typography, WebGLCanvas } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import WebGLCanvasMeta from '../../../../../src/components/primitives/WebGLCanvas.meta.json';
import { createTronCityProgram } from '../../../shaders/tron-city/TronCityProgram';

export default function WebGLCanvasDemoPage() {
  const usage = (
    <Stack gap={1}>
      <Typography variant='h3'>WebGL2 canvas host</Typography>
      <Typography variant='subtitle'>
        WebGLCanvas is a lightweight host for a WebGL2 scene. It creates the context, keeps the
        drawing buffer sized to its parent (device-pixel-ratio aware, clamped by dprMax), and drives
        a program through a requestAnimationFrame loop — advancing it each frame, pausing on context
        loss, and disposing cleanly on unmount. You supply a create callback that builds your
        program (compile shaders, set up buffers) and returns an object with resize, update, render,
        and dispose methods. The scene below is one such program, rendered as a full-bleed
        background.
      </Typography>
      <Panel fullWidth>
        <div
          style={{
            position: 'relative',
            width: 'min(1024px, 100%)',
            aspectRatio: '1 / 1',
            margin: '0 auto',
          }}
        >
          <WebGLCanvas
            // Inline `create` is safe — WebGLCanvas ref-latches it (called once).
            create={(gl, canvas) => createTronCityProgram(gl, canvas)}
            asBackground
            dprMax={1}
            timeScale={1}
            clearColor={[0, 0, 0, 0]}
            sx={{ borderRadius: '0.5rem', overflow: 'hidden' }}
          />
        </div>
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='WebGLCanvas'
      subtitle='A lightweight WebGL2 canvas host for animated backgrounds and scenes.'
      slug='components/primitives/webglcanvas'
      meta={WebGLCanvasMeta}
      usage={usage}
    />
  );
}
