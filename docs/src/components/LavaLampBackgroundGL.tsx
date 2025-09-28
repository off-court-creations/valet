// ─────────────────────────────────────────────────────────────
// src/components/LavaLampBackgroundGL.tsx  | valet-docs
// Hero background – WebGL2 full‑screen lava lamp metaballs
// Splits generic WebGL canvas orchestration from lava-lamp program logic.
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { WebGLCanvas } from '@archway/valet';
import { createLavaLampProgram } from '../shaders/lava-lamp/LavaLampProgram';
import { LavaLampParams } from '../shaders/lava-lamp/lavaLampParams';

type Props = {
  style?: React.CSSProperties;
  className?: string;
};

export default function LavaLampBackgroundGL({ style, className }: Props) {
  return (
    <WebGLCanvas
      asBackground
      className={className}
      sx={{ ...style, position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      contextAttributes={{ antialias: false, alpha: true, preserveDrawingBuffer: false }}
      dprMax={LavaLampParams.runtime.dprMax}
      timeScale={LavaLampParams.runtime.timeScale}
      clearColor={[0, 0, 0, 0]}
      create={(gl: WebGL2RenderingContext, canvas: HTMLCanvasElement) =>
        createLavaLampProgram(gl, canvas)
      }
    />
  );
}
