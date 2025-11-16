// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/WebGLCanvasDemo.tsx  | valet-docs
// Demo page for the WebGLCanvas component with a minimal animated program
// ─────────────────────────────────────────────────────────────
import { useMemo, useRef } from 'react';
import { Stack, Panel, Typography, Slider, Switch, WebGLCanvas } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import WebGLCanvasMeta from '../../../../../src/components/primitives/WebGLCanvas.meta.json';
import { createLavaLampProgram } from '../../../shaders/lava-lamp/LavaLampProgram';
import { LavaLampParams } from '../../../shaders/lava-lamp/lavaLampParams';

export default function WebGLCanvasDemoPage() {
  const pausedRef = useRef(false);
  const timeScaleRef = useRef(1);
  const create = useMemo(
    () => (gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) => {
      const program = createLavaLampProgram(gl, canvas);
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
      <Typography variant='h3'>WebGLCanvas Lava Lamp</Typography>
      <Panel fullWidth>
        <div style={{ position: 'relative', height: 220 }}>
          <WebGLCanvas
            // Use the exact parameters from the hero background
            create={(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) =>
              createLavaLampProgram(gl, canvas)
            }
            asBackground
            dprMax={LavaLampParams.runtime.dprMax}
            timeScale={LavaLampParams.runtime.timeScale}
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
        <div style={{ position: 'relative', height: 220 }}>
          <WebGLCanvas
            create={create}
            asBackground
            dprMax={LavaLampParams.runtime.dprMax}
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
