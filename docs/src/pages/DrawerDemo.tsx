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

  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [stubbornOpen, setStubbornOpen] = useState(false);

  return (
    <Surface>
      <Stack
        spacing="lg"
        style={{ padding: theme.spacing['lg'], maxWidth: 980, margin: '0 auto' }}
      >
        <Typography variant="h2" bold>
          Drawer Showcase
        </Typography>
        <Typography variant="subtitle">
          Minimal slide-in navigation panel
        </Typography>

        {/* 1. Basic uncontrolled drawer */}
        <Typography variant="h3">1. Left drawer</Typography>
        <Button onClick={() => setLeftOpen(true)}>Open left drawer</Button>
        <Drawer open={leftOpen} onClose={() => setLeftOpen(false)}>
          <Stack spacing="md" style={{ padding: theme.spacing['md'] }}>
            <Typography variant="h4" bold>
              Left Drawer
            </Typography>
            <Typography>Click outside or press ESC to close.</Typography>
          </Stack>
        </Drawer>

        {/* 2. Controlled right drawer */}
        <Typography variant="h3">2. Controlled right drawer</Typography>
        <Stack direction="row" spacing="md">
          <Button onClick={() => setRightOpen(true)}>Open</Button>
          <Button onClick={() => setRightOpen(false)}>Close</Button>
        </Stack>
        <Drawer anchor="right" open={rightOpen} onClose={() => setRightOpen(false)}>
          <Stack spacing="md" style={{ padding: theme.spacing['md'] }}>
            <Typography variant="h4" bold>
              Controlled Drawer
            </Typography>
            <Typography>State managed by external buttons.</Typography>
          </Stack>
        </Drawer>

        {/* 3. Non-dismissable bottom drawer */}
        <Typography variant="h3">3. Disable backdrop & ESC</Typography>
        <Button onClick={() => setStubbornOpen(true)}>Open stubborn drawer</Button>
        <Drawer
          anchor="bottom"
          open={stubbornOpen}
          onClose={() => setStubbornOpen(false)}
          disableBackdropClick
          disableEscapeKeyDown
        >
          <Stack spacing="md" style={{ padding: theme.spacing['md'] }}>
            <Typography variant="h4" bold>
              Can't close via backdrop or ESC
            </Typography>
            <Button onClick={() => setStubbornOpen(false)}>Close</Button>
          </Stack>
        </Drawer>

        {/* Theme toggle + back nav */}
        <Stack direction="row" spacing="lg">
          <Button variant="outlined" onClick={toggleMode}>
            Toggle light / dark
          </Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
