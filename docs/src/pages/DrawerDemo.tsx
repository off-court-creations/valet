// ─────────────────────────────────────────────────────────────
// src/pages/DrawerDemo.tsx | valet
// Usage showcase and prop reference for <Drawer/>
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Drawer,
  useTheme,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';

export default function DrawerDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const [leftOpen, setLeftOpen] = useState(false);
  const [stubbornOpen, setStubbornOpen] = useState(false);

  interface Row {
    prop: ReactNode;
    type: ReactNode;
    default: ReactNode;
    description: ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop: <code>open</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Controlled visibility',
    },
    {
      prop: <code>defaultOpen</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Uncontrolled initial state',
    },
    {
      prop: <code>anchor</code>,
      type: <code>'left' | 'right' | 'top' | 'bottom'</code>,
      default: <code>'left'</code>,
      description: 'Drawer side',
    },
    {
      prop: <code>onClose</code>,
      type: <code>() =&gt; void</code>,
      default: <code>-</code>,
      description: 'Called when user requests close',
    },
    {
      prop: <code>size</code>,
      type: <code>number | string</code>,
      default: <code>'16rem'</code>,
      description: 'Width or height of drawer',
    },
    {
      prop: <code>disableBackdropClick</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Ignore backdrop clicks',
    },
    {
      prop: <code>disableEscapeKeyDown</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Ignore ESC key',
    },
    {
      prop: <code>backdrop</code>,
      type: <code>boolean</code>,
      default: <code>true</code>,
      description: 'Render translucent backdrop',
    },
    {
      prop: <code>persistent</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Render in place instead of portaling',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>
          Drawer Showcase
        </Typography>
        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Typography variant="subtitle">
              Minimal slide-in navigation panel
            </Typography>

            {/* 1. Left drawer */}
            <Typography variant="h3">1. Left drawer</Typography>
            <Button onClick={() => setLeftOpen(true)}>Open left drawer</Button>
            <Drawer open={leftOpen} onClose={() => setLeftOpen(false)}>
              <Stack spacing={1} style={{ padding: theme.spacing(1) }}>
                <Typography variant="h4" bold>
                  Left Drawer
                </Typography>
                <Typography>Click outside or press ESC to close.</Typography>
              </Stack>
            </Drawer>

            {/* 2. Non-dismissable bottom drawer */}
            <Typography variant="h3">2. Disable backdrop & ESC</Typography>
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

            <Button
              variant="outlined"
              size="sm"
              onClick={() => navigate('/drawer-persistent')}
            >
              Persistent drawer demo
            </Button>

            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={toggleMode}>
                Toggle light / dark
              </Button>
              <Button onClick={() => navigate(-1)}>← Back</Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Typography variant="h3">Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}
