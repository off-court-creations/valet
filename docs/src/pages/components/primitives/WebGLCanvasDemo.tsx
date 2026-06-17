// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/WebGLCanvasDemo.tsx  | valet-docs
// Demo page for the WebGLCanvas component — the "Hyperspace" fractal scene.
// ─────────────────────────────────────────────────────────────
import { useMemo, useRef } from 'react';
import { Stack, Panel, Typography, Slider, Switch, WebGLCanvas } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import WebGLCanvasMeta from '../../../../../src/components/primitives/WebGLCanvas.meta.json';
import { createTronCityProgram } from '../../../shaders/tron-city/TronCityProgram';

export default function WebGLCanvasDemoPage() {
  const pausedRef = useRef(false);
  const timeScaleRef = useRef(1);

  // Playground wrapper: routes the demo's pause/speed controls through the
  // program's update step. (Refs are stable, so memoizing is optional now that
  // WebGLCanvas ref-latches `create` — but it keeps the wrapper identity steady.)
  const playgroundCreate = useMemo(
    () => (gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) => {
      const program = createTronCityProgram(gl, canvas);
      if (!program) return null;
      return {
        resize: program.resize,
        update(dt: number, t: number) {
          if (pausedRef.current) return;
          program.update(dt * timeScaleRef.current, t * timeScaleRef.current);
        },
        render: program.render,
        dispose: program.dispose,
      };
    },
    [],
  );

  const usage = (
    <Stack gap={1}>
      <Typography variant='h3'>Tron City (WIP) — raymarched skyscraper flyover</Typography>
      <Typography variant='subtitle'>
        Step 1: geometry + camera. A procedural city of box skyscrapers (each block's height from a
        cell hash) raymarched as the camera glides forward over the rooftops. Plain grey shapes on
        black for now — neon edges, bloom, and the grid horizon come next.
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

  const playground = (
    <Panel fullWidth>
      <Stack sx={{ gap: '0.75rem' }}>
        <Stack
          direction='row'
          sx={{ alignItems: 'center', gap: 8 }}
        >
          <Typography variant='subtitle'>Pause</Typography>
          <Switch onValueChange={(v) => (pausedRef.current = !!v)} />
        </Stack>
        <Stack>
          <Typography variant='subtitle'>Speed</Typography>
          <Slider
            min={0.1}
            max={3}
            step={0.1}
            defaultValue={1}
            onValueChange={(v) => (timeScaleRef.current = Array.isArray(v) ? v[0] : v)}
          />
        </Stack>
        <div style={{ position: 'relative', height: 'min(52vh, 520px)' }}>
          <WebGLCanvas
            create={playgroundCreate}
            asBackground
            dprMax={1}
            timeScale={1}
            clearColor={[0, 0, 0, 0]}
            sx={{ borderRadius: '0.5rem', overflow: 'hidden' }}
          />
        </div>
      </Stack>
    </Panel>
  );

  return (
    <ComponentMetaPage
      title='WebGLCanvas'
      subtitle='A lightweight WebGL2 canvas host for animated backgrounds and scenes.'
      slug='components/primitives/webglcanvas'
      meta={WebGLCanvasMeta}
      usage={usage}
      playground={playground}
    />
  );
}
