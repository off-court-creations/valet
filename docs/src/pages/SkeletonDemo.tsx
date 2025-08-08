// ─────────────────────────────────────────────────────────────
// src/pages/SkeletonDemo.tsx | valet
// Showcase of Skeleton component
// ─────────────────────────────────────────────────────────────
import { 
  Surface,
  Stack,
  Typography,
  Skeleton,
  Avatar,
  Button,
  Tabs,
  Table,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function SkeletonDemoPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

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
      prop: <code>loading</code>,
      type: <code>boolean</code>,
      default: <code>true</code>,
      description: 'Show placeholder while true',
    },
    {
      prop: <code>variant</code>,
      type: <code>'text' | 'rect' | 'circle'</code>,
      default: <code>-</code>,
      description: 'Override inferred placeholder shape',
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
      <Stack>
        <Typography variant="h2">Skeleton</Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Typography variant="subtitle">
              Adaptive placeholder with pulsing animation
            </Typography>

            <Button
              onClick={() => setLoading((l) => !l)}
              style={{ alignSelf: 'flex-start', marginTop: theme.spacing(1) }}
            >
              {loading ? 'Show content' : 'Show skeleton'}
            </Button>

            <Stack spacing={1} style={{ marginTop: theme.spacing(1) }}>
              <Skeleton loading={loading}>
                <Typography variant="body">Text loads in…</Typography>
              </Skeleton>

              <Skeleton loading={loading}>
                <Avatar email="support@gravatar.com" size="l" />
              </Skeleton>

              <Skeleton loading={loading} variant="rect">
                <div style={{ width: 160, height: 80, background: theme.colors['backgroundAlt'] }} />
              </Skeleton>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Typography variant="h3">Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>

        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
