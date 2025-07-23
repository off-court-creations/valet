// ─────────────────────────────────────────────────────────────
// src/pages/PixiDropzoneDemo.tsx | valet
// Dropzone to PixiJS example with download
// ─────────────────────────────────────────────────────────────
import { useCallback, useRef, useState } from 'react';
import { Surface, Stack, Typography, Dropzone, Button, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';
import { Application } from '@pixi/react';
import { Texture } from 'pixi.js';
import type { Graphics } from 'pixi.js';

export default function PixiDropzoneDemo() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const appRef = useRef<import('@pixi/react').ApplicationRef | null>(null);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [texture, setTexture] = useState<Texture | null>(null);

  const handleFiles = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setSize({ w: img.width, h: img.height });
      setImgSrc(url);
      setTexture(Texture.from(url));
    };
    img.src = url;
  }, []);

  const drawSquare = useCallback(
    (g: Graphics) => {
      if (!size) return;
      const s = 80;
      g.clear();
      g.beginFill(0x00ff00);
      g.drawRect((size.w - s) / 2, (size.h - s) / 2, s, s);
      g.endFill();
    },
    [size],
  );

  const handleDownload = () => {
    const app = appRef.current?.getApplication();
    if (app) {
      const canvas = app.renderer.extract.canvas(app.stage) as HTMLCanvasElement;
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = 'pixi-image.png';
      link.click();
    }
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack spacing={1} style={{ padding: theme.spacing(1) }}>
        <Typography variant="h2" bold>
          Pixi Dropzone Demo
        </Typography>
        <Typography variant="subtitle">
          Upload an image, add a green square, then download it
        </Typography>
        <Dropzone
          accept={{ 'image/*': [] }}
          maxFiles={1}
          multiple={false}
          onFilesChange={handleFiles}
        />
        {imgSrc && size && (
          <Application
            width={size.w}
            height={size.h}
            backgroundAlpha={0}
            ref={appRef}
          >
            {texture && (
              <pixiSprite
                texture={texture}
                x={0}
                y={0}
                width={size.w}
                height={size.h}
              />
            )}
            <pixiGraphics draw={drawSquare} />
          </Application>
        )}
        {imgSrc && (
          <Button onClick={handleDownload}>Download image</Button>
        )}
        <Button onClick={() => navigate(-1)} style={{ marginTop: theme.spacing(2) }}>
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
