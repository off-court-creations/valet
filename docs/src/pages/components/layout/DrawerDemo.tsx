// docs/src/pages/components/layout/DrawerDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – focuses on right/bottom/adaptive drawers; left drawer is demonstrated by the site nav
import { useState } from 'react';
import { Stack, Typography, Button, Drawer, useTheme, Panel } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import DrawerMeta from '../../../../../src/components/layout/Drawer.meta.json';

export default function DrawerDemoPage() {
  const { theme, toggleMode } = useTheme();
  const [rightOpen, setRightOpen] = useState(false);
  const [bottomOpen, setBottomOpen] = useState(false);

  const usage = (
    <Stack gap={1}>
      <Panel
        variant='outlined'
        fullWidth
      >
        <Typography>
          Note: This docs site uses a persistent left navigation drawer (the menu on the left).
          Treat that as the left‑drawer example. The demos below focus on right and bottom drawers.
        </Typography>
      </Panel>

      <Typography variant='h3'>Controlled right drawer</Typography>
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

      <Typography variant='h3'>Bottom drawer (no ESC/backdrop)</Typography>
      <Button onClick={() => setBottomOpen(true)}>Open stubborn drawer</Button>
      <Drawer
        anchor='bottom'
        open={bottomOpen}
        onClose={() => setBottomOpen(false)}
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
          <Button onClick={() => setBottomOpen(false)}>Close</Button>
        </Stack>
      </Drawer>

      <Typography variant='h3'>Adaptive drawer (right)</Typography>
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

      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark
      </Button>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Drawer'
      subtitle='Temporary, persistent, and adaptive side panels'
      slug='components/layout/drawer'
      meta={DrawerMeta}
      usage={usage}
    />
  );
}
