// ─────────────────────────────────────────────────────────────
// src/pages/SkeletonDemo.tsx | valet-docs
// Showcase of Skeleton component
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Skeleton,
  Avatar,
  Image,
  Button,
  Tabs,
  Table,
  Icon,
  useTheme,
  Panel,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';

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
      type: <code>&#39;text&#39; | &#39;rect&#39; | &#39;circle&#39;</code>,
      default: <code>—</code>,
      description: 'Override inferred placeholder shape',
    },
    {
      prop: <code>icon</code>,
      type: <code>ReactNode</code>,
      default: <code>—</code>,
      description: 'Optional icon shown while loading',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>—</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Skeleton' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='subtitle'>Adaptive placeholder with pulsing animation</Typography>

            <Button
              onClick={() => setLoading((l) => !l)}
              sx={{ alignSelf: 'flex-start', marginTop: theme.spacing(1) }}
            >
              {loading ? 'Show content' : 'Show skeleton'}
            </Button>

            <Stack compact>
              <Stack compact>
                <Typography variant='subtitle'>Text</Typography>
                <Skeleton loading={loading}>
                  <Typography variant='body'>Text loads in…</Typography>
                </Skeleton>
              </Stack>

              <Stack compact>
                <Typography variant='subtitle'>Avatar</Typography>
                <Skeleton loading={loading}>
                  <Avatar
                    email='support@gravatar.com'
                    size='l'
                  />
                </Skeleton>
              </Stack>

              <Stack compact>
                <Typography variant='subtitle'>Image</Typography>
                <Skeleton loading={loading}>
                  <Image
                    src='https://picsum.photos/400/300'
                    alt='Loading kitten'
                    width={160}
                    height={80}
                    rounded={4}
                  />
                </Skeleton>
              </Stack>

              <Stack compact>
                <Typography variant='subtitle'>Rect</Typography>
                <Skeleton variant='rect'>
                  <div
                    style={{
                      width: 160,
                      height: 80,
                      background: theme.colors['backgroundAlt'],
                    }}
                  />
                </Skeleton>
              </Stack>

              <Stack compact>
                <Typography variant='subtitle'>With icon</Typography>
                <Skeleton
                  loading={loading}
                  icon={<Icon icon='mdi:clock-outline' />}
                >
                  <Typography variant='body'>Loading with icon…</Typography>
                </Skeleton>
              </Stack>

              <Stack compact>
                <Typography variant='subtitle'>Image</Typography>
                <Skeleton>
                  <Image
                    src='https://picsum.photos/400/301'
                    alt='Random scenic'
                    width={160}
                    height={80}
                    rounded={4}
                  />
                </Skeleton>
              </Stack>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Typography variant='h3'>Prop reference</Typography>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        {/* Best Practices -------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Skeleton the right things. Use Skeleton when the shape/size of incoming content is
            known; avoid for unknown lists where layout may jump.
          </Typography>
          <Typography>
            - Match shapes. Let the component infer <code>variant</code> or override it to match the
            target (text, circle, rect) for believable placeholders.
          </Typography>
          <Typography>
            - Prefer quick hide. Hide skeletons as soon as content is ready; uncontrolled usage will
            auto-hide on <code>onLoad</code>/<code>onError</code> for common elements.
          </Typography>
          <Typography>
            - Keep motion subtle. The pulse is intentionally gentle; avoid stacking many animated
            placeholders in view.
          </Typography>
          <Typography>
            - Provide context. Use brief text nearby (e.g., &quot;Loading data…&quot;) when
            appropriate; don’t rely on shimmer alone to communicate state.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}
