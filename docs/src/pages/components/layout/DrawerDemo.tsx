// src/pages/DrawerDemo.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Surface, Stack, Typography, Button, Drawer, useTheme } from '@archway/valet';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import DrawerMeta from '../../../../../src/components/layout/Drawer.meta.json';

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
        <PageHero title='Drawer' />

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

        <CuratedExamples examples={getExamples(DrawerMeta)} />
        <BestPractices items={getBestPractices(DrawerMeta)} />
      </Stack>
    </Surface>
  );
}
