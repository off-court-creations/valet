// ─────────────────────────────────────────────────────────────
// src/pages/DropzoneDemo.tsx | valet
// Showcase of Dropzone widget
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Button,
  Dropzone,
  Tabs,
  Table,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function DropzoneDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

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
      prop: <code>accept</code>,
      type: <code>DropzoneOptions['accept']</code>,
      default: <code>-</code>,
      description: 'Allowed file types',
    },
    {
      prop: <code>showPreviews</code>,
      type: <code>boolean</code>,
      default: <code>true</code>,
      description: 'Show preview thumbnails',
    },
    {
      prop: <code>onFilesChange</code>,
      type: <code>(files: File[]) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Called when accepted files change',
    },
    {
      prop: <code>maxFiles</code>,
      type: <code>number</code>,
      default: <code>-</code>,
      description: 'Maximum file count',
    },
    {
      prop: <code>multiple</code>,
      type: <code>boolean</code>,
      default: <code>true</code>,
      description: 'Allow multiple file selection',
    },
    {
      prop: <code>onDrop</code>,
      type: <code>DropzoneOptions['onDrop']</code>,
      default: <code>-</code>,
      description: 'Low-level drop callback',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Style preset(s)',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          Dropzone
        </Typography>
        <Typography variant="subtitle">
          Drag-and-drop uploads with optional previews
        </Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Stack>
              <Typography variant="h3">1. Default</Typography>
              <Dropzone />

              <Typography variant="h3">2. Image only</Typography>
              <Dropzone accept={{ 'image/*': [] }} />

              <Typography variant="h3">3. Limit to two files</Typography>
              <Dropzone maxFiles={2} />

              <Typography variant="h3">4. No previews</Typography>
              <Dropzone showPreviews={false} />

              <Typography variant="h3">5. Theme toggle</Typography>
              <Button variant="outlined" onClick={toggleMode}>
                Toggle light / dark
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Typography variant="h3">Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>

        <Button onClick={() => navigate(-1)} style={{ marginTop: theme.spacing(2) }}>
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}

