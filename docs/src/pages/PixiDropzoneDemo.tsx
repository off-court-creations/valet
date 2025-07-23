// ─────────────────────────────────────────────────────────────
// src/pages/PixiDropzoneDemo.tsx | valet
// Demo of pixi.js with Dropzone
// ─────────────────────────────────────────────────────────────
import { useState, useRef, useEffect } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Dropzone,
  Button,
} from '@archway/valet';
import { Application, extend } from '@pixi/react';
import type { ApplicationRef } from '@pixi/react';
import { Sprite, Graphics, Assets, Texture } from 'pixi.js';
extend({ Sprite, Graphics });
import NavDrawer from '../components/NavDrawer';

export default function PixiDropzoneDemo() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [texture, setTexture] = useState<Texture | null>(null);
  const appRef = useRef<ApplicationRef>(null);

  const handleFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setImageUrl(url);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!imageUrl) return;
    let cancelled = false;
    Assets.load(imageUrl).then((tex) => {
      if (!cancelled) {
        setTexture(tex as Texture);
        setSize({ w: tex.width, h: tex.height });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const download = () => {
    const canvas = appRef.current?.getCanvas();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'pixi-image.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const drawSquare = (g: Graphics) => {
    if (!size) return;
    const sqSize = Math.min(size.w, size.h) / 4;
    g.clear();
    g.rect((size.w - sqSize) / 2, (size.h - sqSize) / 2, sqSize, sqSize);
    g.fill({ color: 0x00ff00 });
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          PixiJS Dropzone Example
        </Typography>
        <Typography variant="subtitle">
          Upload an image, add a green square, then download
        </Typography>
        <Dropzone
          accept={{ 'image/*': [] }}
          maxFiles={1}
          onFilesChange={handleFiles}
        />
        {imageUrl && size && (
          <>
            <Application
              ref={appRef}
              width={size.w}
              height={size.h}
              background={0xffffff}
            >
              {texture && (
                <pixiSprite texture={texture} width={size.w} height={size.h} />
              )}
              <pixiGraphics draw={drawSquare} />
            </Application>
            <Button onClick={download} style={{ marginTop: '1rem' }}>
              Download image
            </Button>
          </>
        )}
      </Stack>
    </Surface>
  );
}
