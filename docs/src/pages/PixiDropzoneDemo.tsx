// ─────────────────────────────────────────────────────────────
// src/pages/PixiDropzoneDemo.tsx | valet docs
// Dropzone upload with PixiJS overlay example
// ─────────────────────────────────────────────────────────────
import { useState, useRef } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Dropzone,
  Button,
  useTheme,
} from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import { Stage, Sprite, Graphics } from '@pixi/react';
import * as PIXI from 'pixi.js';
import { useNavigate } from 'react-router-dom';

export default function PixiDropzoneDemo() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [size, setSize] = useState({ width: 512, height: 512 });
  const appRef = useRef<PIXI.Application | null>(null);

  const handleFiles = (files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const img = new Image();
      img.onload = () => {
        setSize({ width: img.width, height: img.height });
      };
      img.src = url;
      setImage(url);
    };
    reader.readAsDataURL(file);
  };

  const drawSquare = (g: PIXI.Graphics) => {
    g.clear();
    g.beginFill(0x00ff00);
    const side = Math.min(size.width, size.height) / 4;
    g.drawRect((size.width - side) / 2, (size.height - side) / 2, side, side);
    g.endFill();
  };

  const handleDownload = () => {
    if (!appRef.current) return;
    const canvas = appRef.current.renderer.extract.canvas();
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'image.png';
    a.click();
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          Pixi Dropzone
        </Typography>
        <Typography variant="subtitle">
          Upload a photo, add a green square, then download
        </Typography>

        <Dropzone
          accept={{ 'image/*': [] }}
          maxFiles={1}
          multiple={false}
          onFilesChange={handleFiles}
        />

        {image && (
          <Stage
            width={size.width}
            height={size.height}
            options={{ backgroundAlpha: 0 }}
            ref={appRef}
          >
            <Sprite image={image} width={size.width} height={size.height} />
            <Graphics draw={drawSquare} />
          </Stage>
        )}

        {image && (
          <Button onClick={handleDownload}>Download</Button>
        )}

        <Button onClick={() => navigate(-1)} style={{ marginTop: theme.spacing(1) }}>
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}

