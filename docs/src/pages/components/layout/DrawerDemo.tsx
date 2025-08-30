// src/pages/DrawerDemo.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface, Stack, Typography, Button, Drawer, Panel, useTheme } from '@archway/valet';

export default function DrawerDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);
  const [stubbornOpen, setStubbornOpen] = useState(false);

  return (
    <Surface>
      <Drawer
        persistent
        anchor='left'
        size='16rem'
      >
        <Stack sx={{ padding: theme.spacing(1) }}>
          <Typography
            variant='h4'
            bold
          >
            Persistent Drawer
          </Typography>
          <Typography>Always visible on the left.</Typography>
        </Stack>
      </Drawer>
      <Stack sx={{ padding: theme.spacing(1), maxWidth: 980, margin: '0 auto' }}>
        <Typography
          variant='h2'
          bold
        >
          Drawer Showcase
        </Typography>
        <Typography variant='subtitle'>Minimal slide-in navigation panel</Typography>

        {/* 1. Basic uncontrolled drawer */}
        <Typography variant='h3'>1. Overlay left drawer</Typography>
        <Button onClick={() => setOverlayOpen(true)}>Open left drawer</Button>
        <Drawer
          open={overlayOpen}
          onClose={() => setOverlayOpen(false)}
        >
          <Stack sx={{ padding: theme.spacing(1) }}>
            <Typography
              variant='h4'
              bold
            >
              Left Drawer
            </Typography>
            <Typography>Click outside or press ESC to close.</Typography>
          </Stack>
        </Drawer>

        {/* 2. Controlled right drawer */}
        <Typography variant='h3'>2. Controlled right drawer</Typography>
        <Stack direction='row'>
          <Button onClick={() => setRightOpen(true)}>Open</Button>
          <Button onClick={() => setRightOpen(false)}>Close</Button>
        </Stack>
        <Drawer
          anchor='right'
          open={rightOpen}
          onClose={() => setRightOpen(false)}
        >
          <Stack sx={{ padding: theme.spacing(1) }}>
            <Typography
              variant='h4'
              bold
            >
              Controlled Drawer
            </Typography>
            <Typography>State managed by external buttons.</Typography>
          </Stack>
        </Drawer>

        {/* 3. Non-dismissable bottom drawer */}
        <Typography variant='h3'>3. Disable backdrop & ESC</Typography>
        <Button onClick={() => setStubbornOpen(true)}>Open stubborn drawer</Button>
        <Drawer
          anchor='bottom'
          open={stubbornOpen}
          onClose={() => setStubbornOpen(false)}
          disableBackdropClick
          disableEscapeKeyDown
        >
          <Stack sx={{ padding: theme.spacing(1) }}>
            <Typography
              variant='h4'
              bold
            >
              Can&apos;t close via backdrop or ESC
            </Typography>
            <Button onClick={() => setStubbornOpen(false)}>Close</Button>
          </Stack>
        </Drawer>

        {/* 4. Adaptive drawer */}
        <Typography variant='h3'>4. Adaptive drawer</Typography>
        <Drawer
          adaptive
          anchor='right'
          size='16rem'
        >
          <Stack sx={{ padding: theme.spacing(1) }}>
            <Typography
              variant='h4'
              bold
            >
              Adaptive Drawer
            </Typography>
            <Typography>Persistent in landscape, icon in portrait.</Typography>
          </Stack>
        </Drawer>

        {/* Theme toggle + back nav */}
        <Stack direction='row'>
          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle light / dark
          </Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>

        {/* Best Practices ---------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Choose the right mode. Use <code>persistent</code> for primary navigation; use overlay
            drawers for transient tasks. Prefer <code>adaptive</code> so navigation docks in
            landscape and becomes a toggle in portrait.
          </Typography>
          <Typography>
            - Respect close affordances. Provide <code>onClose</code> for controlled drawers and
            keep backdrop/ESC enabled unless there is a strong reason to disable them.
          </Typography>
          <Typography>
            - Size with tokens. Set <code>size</code> in <code>rem</code> or via spacing so density
            changes keep proportions; avoid content-driven widths that cause reflow thrash.
          </Typography>
          <Typography>
            - Don’t manually offset for the AppBar. The drawer reads the current surface offset and
            adjusts itself (and persistent margins) automatically.
          </Typography>
          <Typography>
            - Keep content focused and scrollable. Put navigation and short lists inside; for long
            collections consider windowing/virtualization and offload heavy work from the drawer.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}
