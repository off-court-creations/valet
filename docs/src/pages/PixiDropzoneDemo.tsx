// ─────────────────────────────────────────────────────────────
// src/pages/PixiDropzoneDemo.tsx | valet docs
// PixiJS integration example with Dropzone
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Dropzone, Button, useTheme } from '@archway/valet';
import { Application, extend } from '@pixi/react';
import type { ApplicationRef } from "@pixi/react";
import { Container, Sprite, Graphics, Texture } from 'pixi.js';
import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import NavDrawer from '../components/NavDrawer';

extend({ Container, Sprite, Graphics });

export default function PixiDropzoneDemo() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const appRef = useRef<ApplicationRef | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const handleFilesChange = (files: File[]) => {
    const f = files[0];
    if (f) {
      const url = URL.createObjectURL(f);
      setFileUrl(url);
    }
  };

  useEffect(() => {
    if (!fileUrl) return;
    const img = new Image();
    img.onload = () => setSize({ w: img.width, h: img.height });
    img.src = fileUrl;
  }, [fileUrl]);

  const download = useCallback(() => {
    const app = appRef.current?.getApplication?.();
    if (!app) return;
    const canvas = app.view as HTMLCanvasElement;
    const link = document.createElement('a');
    link.download = 'pixi-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }, []);

  const drawSquare = useCallback(
    (g: Graphics) => {
      if (!size) return;
      const side = Math.min(size.w, size.h) / 4;
      g.clear();
      g.rect((size.w - side) / 2, (size.h - side) / 2, side, side);
      g.fill({ color: 0x00ff00 });
    },
    [size]
  );

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          Pixi Dropzone
        </Typography>
        <Typography variant="subtitle">
          Upload an image and add a green square
        </Typography>
        <Dropzone
          accept={{ 'image/*': [] }}
          maxFiles={1}
          onFilesChange={handleFilesChange}
        />
        {fileUrl && size && (
          <>
            <Application
              ref={appRef as any}
              width={size.w}
              height={size.h}
              backgroundAlpha={0}
            >
              <pixiSprite texture={Texture.from(fileUrl)} x={0} y={0} width={size.w} height={size.h} />
              <pixiGraphics draw={drawSquare} />
            </Application>
            <Button onClick={download} style={{ marginTop: theme.spacing(1) }}>
              Download
            </Button>
          </>
        )}
        <Button onClick={() => navigate(-1)} style={{ marginTop: theme.spacing(2) }}>
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
