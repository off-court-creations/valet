// ─────────────────────────────────────────────────────────────
// src/pages/VideoDemoPage.tsx | valet-playground
// Simple showcase of the <Video /> component
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Video,
  Tabs,
  Table,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import NavDrawer from '../components/NavDrawer';
  
  /*─────────────────────────────────────────────────────────────*/
  /* Demo page                                                   */
export default function VideoDemoPage() {
  const { theme } = useTheme(); // for consistent spacing etc.

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
      prop: <code>sources</code>,
      type: <code>VideoSource[]</code>,
      default: <code>-</code>,
      description: 'Video source files',
    },
    {
      prop: <code>poster</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Poster image URL',
    },
    {
      prop: <code>controls</code>,
      type: <code>boolean</code>,
      default: <code>true</code>,
      description: 'Display native controls',
    },
    {
      prop: <code>autoPlay</code>,
      type: <code>boolean</code>,
      default: <code>true</code>,
      description: 'Autoplay when ready',
    },
    {
      prop: <code>muted</code>,
      type: <code>boolean</code>,
      default: <code>true</code>,
      description: 'Mute audio',
    },
    {
      prop: <code>loop</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Loop playback',
    },
    {
      prop: <code>objectFit</code>,
      type: <code>'contain' | 'cover'</code>,
      default: <code>'contain'</code>,
      description: 'Video object-fit style',
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
      <NavDrawer />
      <Stack preset="showcaseStack">
        <Typography variant="h2" bold>Video Demo</Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Typography variant="subtitle">
              Basic usage of the&nbsp;
              <code>&lt;Video /&gt;</code>&nbsp;component
            </Typography>

            <Video
              sources={[
                {
                  src: 'https://z-public-occ.s3.us-east-2.amazonaws.com/video/webm/Big_Buck_Bunny_1080p.webm',
                  type: 'video/webm',
                },
              ]}
              controls
              autoPlay
              muted
              loop
              width="100%"
              height="auto"
              objectFit="contain"
            />
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
