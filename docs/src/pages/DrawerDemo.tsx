// src/pages/DrawerDemo.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Drawer,
  useTheme,
} from '@archway/valet';

export default function DrawerDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [stubbornOpen, setStubbornOpen] = useState(false);

  return (
    <Surface>
      <Stack
        spacing={1}
        style={{ padding: theme.spacing(1), maxWidth: 980, margin: '0 auto' }}
      >
        <Typography variant="h2" bold>
          Drawer Showcase
        </Typography>
        <Typography variant="subtitle">
          Minimal slide-in navigation panel
        </Typography>

        {/* 1. Persistent left drawer */}
        <Typography variant="h3">1. Persistent left drawer</Typography>
        <Drawer persistent>
          <Stack spacing={1} style={{ padding: theme.spacing(1) }}>
            <Typography variant="h4" bold>
              Persistent
            </Typography>
            <Typography>Always visible without backdrop.</Typography>
          </Stack>
        </Drawer>

        {/* 2. Overlay left drawer */}
        <Typography variant="h3">2. Overlay left drawer</Typography>
        <Button onClick={() => setOverlayOpen(true)}>Open left drawer</Button>
        <Drawer open={overlayOpen} onClose={() => setOverlayOpen(false)}>
          <Stack spacing={1} style={{ padding: theme.spacing(1) }}>
            <Typography variant="h4" bold>
              Overlay Drawer
            </Typography>
            <Typography>Click outside or press ESC to close.</Typography>
          </Stack>
        </Drawer>

        {/* 3. Controlled right drawer */}
        <Typography variant="h3">3. Controlled right drawer</Typography>
        <Stack direction="row" spacing={1}>
          <Button onClick={() => setRightOpen(true)}>Open</Button>
          <Button onClick={() => setRightOpen(false)}>Close</Button>
        </Stack>
        <Drawer anchor="right" open={rightOpen} onClose={() => setRightOpen(false)}>
          <Stack spacing={1} style={{ padding: theme.spacing(1) }}>
            <Typography variant="h4" bold>
              Controlled Drawer
            </Typography>
            <Typography>State managed by external buttons.</Typography>
          </Stack>
        </Drawer>

        {/* 4. Non-dismissable bottom drawer */}
        <Typography variant="h3">4. Disable backdrop & ESC</Typography>
        <Button onClick={() => setStubbornOpen(true)}>Open stubborn drawer</Button>
        <Drawer
          anchor="bottom"
          open={stubbornOpen}
          onClose={() => setStubbornOpen(false)}
          disableBackdropClick
          disableEscapeKeyDown
        >
          <Stack spacing={1} style={{ padding: theme.spacing(1) }}>
            <Typography variant="h4" bold>
              Can't close via backdrop or ESC
            </Typography>
            <Button onClick={() => setStubbornOpen(false)}>Close</Button>
          </Stack>
        </Drawer>

        {/* Theme toggle + back nav */}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={toggleMode}>
            Toggle light / dark
          </Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
