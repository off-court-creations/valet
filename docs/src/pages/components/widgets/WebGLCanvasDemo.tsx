// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/WebGLCanvasDemo.tsx  | valet-docs
// Demo page for the WebGLCanvas component with a minimal animated program
// ─────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import { Stack, Panel, Typography, Slider, Switch, WebGLCanvas } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import WebGLCanvasMeta from '../../../../../src/components/widgets/WebGLCanvas.meta.json';

// A tiny program that just animates the clear color.
function createColorPulseProgram(gl: WebGL2RenderingContext): {
  resize: (w: number, h: number, dpr: number) => void;
  update: (dt: number, t: number) => void;
  render: () => void;
  dispose: () => void;
} {
  let r = 0.0;
  let g = 0.0;
  let b = 0.0;
  let width = gl.drawingBufferWidth;
  let height = gl.drawingBufferHeight;
  const update = (_dt: number, t: number) => {
    r = 0.5 + 0.5 * Math.sin(t * 0.8);
    g = 0.5 + 0.5 * Math.sin(t * 0.6 + 1.3);
    b = 0.5 + 0.5 * Math.sin(t * 0.7 + 2.1);
  };
  const render = () => {
    gl.viewport(0, 0, width, height);
    gl.clearColor(r, g, b, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };
  const resize = (w: number, h: number, dpr: number) => {
    width = w;
    height = h;
    void dpr;
  };
  const dispose = () => {
    // nothing to cleanup for this trivial demo
  };
  return { resize, update, render, dispose };
}

export default function WebGLCanvasDemoPage() {
  const [dprMax, setDprMax] = useState(2);
  const [timeScale, setTimeScale] = useState(1);
  const [asBg, setAsBg] = useState(false);

  const usage = (
    <Stack gap={1}>
      <Typography>
        <code>WebGLCanvas</code> hosts a WebGL2 context, resizes to its parent using DPR-aware
        pixels, and drives a small program via <code>update</code>/<code>render</code>. It’s ideal
        for animated backgrounds and compact GL demos.
      </Typography>
      <Panel
        pad={1}
        sx={{ height: 240, position: 'relative' }}
      >
        <WebGLCanvas
          create={(gl) => createColorPulseProgram(gl)}
          dprMax={dprMax}
          timeScale={timeScale}
        />
      </Panel>
    </Stack>
  );

  const playground = useMemo(
    () => (
      <Stack gap={1}>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>dprMax ({dprMax.toFixed(0)})</Typography>
          <Slider
            min={1}
            max={3}
            step={1}
            value={dprMax}
            onChange={(v) => setDprMax(v as number)}
            sx={{ width: 220 }}
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>timeScale ({timeScale.toFixed(2)})</Typography>
          <Slider
            min={0.2}
            max={2}
            step={0.1}
            value={timeScale}
            onChange={(v) => setTimeScale(v as number)}
            sx={{ width: 220 }}
          />
        </Stack>
        <Stack
          direction='row'
          gap={0.5}
        >
          <Switch
            checked={asBg}
            onChange={(checked) => setAsBg(checked)}
          />
          <Typography>asBackground</Typography>
        </Stack>
        <Panel
          pad={1}
          sx={{ height: 260, position: 'relative', overflow: 'hidden' }}
        >
          {/* Toggle between contained and background modes */}
          <WebGLCanvas
            asBackground={asBg}
            create={(gl) => createColorPulseProgram(gl)}
            dprMax={dprMax}
            timeScale={timeScale}
            clearColor={[0, 0, 0, 1]}
          />
          {!asBg && (
            <Typography
              variant='subtitle'
              sx={{ position: 'absolute', bottom: 8, right: 8 }}
            >
              Contained canvas
            </Typography>
          )}
          {asBg && (
            <Typography
              variant='subtitle'
              sx={{ position: 'absolute', bottom: 8, right: 8, color: '#fff' }}
            >
              Background mode
            </Typography>
          )}
        </Panel>
      </Stack>
    ),
    [asBg, dprMax, timeScale],
  );

  return (
    <ComponentMetaPage
      title='WebGLCanvas'
      subtitle='Reusable WebGL2 host with DPR-aware sizing and RAF'
      slug='components/widgets/webglcanvas'
      meta={WebGLCanvasMeta}
      usage={usage}
      playground={playground}
    />
  );
}
