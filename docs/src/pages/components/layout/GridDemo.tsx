// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/layout/GridDemo.tsx  | valet-docs
// Improved docs: best practices, playground, reference fix
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Grid,
  Box,
  Tabs,
  Table,
  useTheme,
  Panel,
  Iterator,
  Switch,
  Divider,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import NavDrawer from '../../../components/NavDrawer';
import type { ReactNode } from 'react';
import { useMemo, useState } from 'react';

export default function GridDemoPage() {
  const { theme } = useTheme();

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
      prop: <code>columns</code>,
      type: <code>number</code>,
      default: <code>2</code>,
      description: 'Number of equal‑width tracks (repeat(n, 1fr)).',
    },
    {
      prop: <code>gap</code>,
      type: <code>number | string</code>,
      default: <code>1</code>,
      description: 'Space between cells. Numbers map via theme.spacing(n); strings pass through.',
    },
    {
      prop: <code>pad</code>,
      type: <code>number | string</code>,
      default: <code>1</code>,
      description: 'Inner padding for the grid container. Same mapping as gap.',
    },
    {
      prop: <code>compact</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Zero out both pad and gap for a tight layout.',
    },
    {
      prop: <code>adaptive</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Switch to a single column when the surface is in portrait.',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets via definePreset/preset registry.',
    },
    {
      prop: <code>HTML div props</code>,
      type: <code>React.ComponentProps&lt;&apos;div&apos;&gt;</code>,
      default: <code>-</code>,
      description: (
        <>
          Standard attributes and events pass through (e.g., <code>id</code>, <code>role</code>,{' '}
          <code>aria-*</code>, <code>onClick</code>, <code>style</code>, <code>className</code>).
        </>
      ),
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Grid Showcase
        </Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Panel fullWidth>
                <Typography variant='h4'>Best Practices</Typography>
                <Typography>
                  - Use <code>Grid</code> for two‑dimensional layouts where items align in both
                  axes. Reach for <code>Stack</code> for linear flows.
                </Typography>
                <Typography>
                  - Keep tracks simple. Prefer <code>columns</code> with equal tracks; use{' '}
                  <code>{`style={{ gridColumn: 'span N' }}`}</code> on children to span.
                </Typography>
                <Typography>
                  - Share spacing with the system: gap and pad use the same spacing scale as other
                  layout primitives (<code>Stack</code>, <code>Tabs</code>).
                </Typography>
                <Typography>
                  - Toggle <code>adaptive</code> when you want predictable single‑column layout in
                  portrait across breakpoints. Avoid ad‑hoc media queries.
                </Typography>
              </Panel>

              <Divider />

              <Typography variant='h3'>Two columns</Typography>
              <Grid
                columns={2}
                gap={1}
              >
                <Box
                  fullWidth
                  style={{
                    background: theme.colors['primary'] as string,
                    color: theme.colors['primaryText'] as string,
                    padding: theme.spacing(1),
                  }}
                >
                  A
                </Box>
                <Box
                  fullWidth
                  style={{
                    background: theme.colors['secondary'] as string,
                    color: theme.colors['secondaryText'] as string,
                    padding: theme.spacing(1),
                  }}
                >
                  B
                </Box>
              </Grid>

              <Divider />

              <Typography variant='h3'>Four columns</Typography>
              <Grid
                columns={4}
                gap={1}
              >
                {Array.from({ length: 8 }, (_, i) => String(i + 1)).map((n) => (
                  <Box
                    fullWidth
                    key={n}
                    style={{
                      background: theme.colors['primary'] as string,
                      color: theme.colors['primaryText'] as string,
                      padding: theme.spacing(1),
                      textAlign: 'center',
                    }}
                  >
                    {n}
                  </Box>
                ))}
              </Grid>

              <Divider />

              <Typography variant='h3'>Adaptive grid</Typography>
              <Typography variant='subtitle'>
                Switches to one column in portrait orientation.
              </Typography>
              <Grid
                columns={4}
                gap={1}
                adaptive
              >
                {Array.from({ length: 8 }, (_, i) => String(i + 1)).map((n) => (
                  <Box
                    fullWidth
                    key={n}
                    style={{
                      background: theme.colors['secondary'] as string,
                      color: theme.colors['secondaryText'] as string,
                      padding: theme.spacing(1),
                      textAlign: 'center',
                    }}
                  >
                    {n}
                  </Box>
                ))}
              </Grid>

              <Divider />

              <Typography variant='h3'>Nested grids</Typography>
              <Grid
                columns={2}
                gap={1}
              >
                <Grid
                  columns={2}
                  gap={1}
                >
                  <Box
                    fullWidth
                    style={{ padding: theme.spacing(1), textAlign: 'center' }}
                  >
                    A1
                  </Box>
                  <Box
                    fullWidth
                    style={{ padding: theme.spacing(1), textAlign: 'center' }}
                  >
                    A2
                  </Box>
                  <Box
                    fullWidth
                    style={{ padding: theme.spacing(1), textAlign: 'center' }}
                  >
                    A3
                  </Box>
                  <Box
                    fullWidth
                    style={{ padding: theme.spacing(1), textAlign: 'center' }}
                  >
                    A4
                  </Box>
                </Grid>
                <Grid
                  columns={3}
                  gap={0.5}
                >
                  {['B1', 'B2', 'B3', 'B4', 'B5', 'B6'].map((n) => (
                    <Box
                      fullWidth
                      key={n}
                      style={{ padding: theme.spacing(1), textAlign: 'center' }}
                    >
                      {n}
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Playground' />
          <Tabs.Panel>
            <GridPlayground />
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Typography variant='h3'>Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}

function GridPlayground() {
  const { theme } = useTheme();
  const [columns, setColumns] = useState<number>(4);
  const [gap, setGap] = useState<number>(1);
  const [pad, setPad] = useState<number>(1);
  const [adaptive, setAdaptive] = useState<boolean>(false);

  const items = useMemo(() => Array.from({ length: 8 }, (_, i) => String(i + 1)), []);

  return (
    <Stack gap={1}>
      <Stack
        direction='row'
        wrap={false}
        gap={1}
        style={{ alignItems: 'center' }}
      >
        <Stack gap={0.25}>
          <Typography variant='subtitle'>columns</Typography>
          <Iterator
            width={160}
            min={1}
            max={8}
            step={1}
            value={columns}
            onChange={(n) => setColumns(Math.round(n))}
            aria-label='Columns'
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>gap (units)</Typography>
          <Iterator
            width={160}
            min={0}
            max={4}
            step={0.5}
            value={gap}
            onChange={setGap}
            aria-label='Gap units'
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>pad (units)</Typography>
          <Iterator
            width={160}
            min={0}
            max={4}
            step={0.5}
            value={pad}
            onChange={setPad}
            aria-label='Pad units'
          />
        </Stack>
        <Stack
          direction='row'
          wrap={false}
          gap={1}
          style={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>adaptive</Typography>
          <Switch
            checked={adaptive}
            onChange={setAdaptive}
            aria-label='Toggle adaptive'
          />
        </Stack>
      </Stack>
      <Grid
        columns={columns}
        gap={gap}
        pad={pad}
        adaptive={adaptive}
      >
        {items.map((n) => (
          <Box
            fullWidth
            key={n}
            style={{
              background: theme.colors['tertiary'] as string,
              color: theme.colors['tertiaryText'] as string,
              padding: theme.spacing(1),
              textAlign: 'center',
            }}
          >
            {n}
          </Box>
        ))}
      </Grid>
    </Stack>
  );
}
