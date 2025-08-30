// ─────────────────────────────────────────────────────────────
// src/pages/StackDemo.tsx | valet-docs
// Showcase of Stack layout primitive
// ─────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Typography,
  Box,
  Button,
  Tabs,
  Table,
  Panel,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import type { ReactNode } from 'react';

export default function StackDemoPage() {
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
      prop: <code>direction</code>,
      type: <code>&#39;row&#39; | &#39;column&#39;</code>,
      default: <code>&#39;column&#39;</code>,
      description: 'Layout direction',
    },
    {
      prop: <code>gap</code>,
      type: <code>number | string</code>,
      default: <code>1</code>,
      description: 'Gap between children',
    },
    {
      prop: <code>wrap</code>,
      type: <code>boolean</code>,
      default: <code>false for column, true for row</code>,
      description: 'Allow children to wrap',
    },
    {
      prop: <code>compact</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Remove margin and padding',
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
        <Typography variant='h2'>Stack</Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='h3'>1. Row layout</Typography>
            <Stack
              direction='row'
              gap={2}
            >
              <Box background={theme.colors['primary']}>A</Box>
              <Box background={theme.colors['secondary']}>B</Box>
              <Box background={theme.colors['tertiary']}>C</Box>
            </Stack>

            <Typography variant='h3'>2. Wrapping</Typography>
            <Stack
              direction='row'
              gap={1}
              wrap
              sx={{ maxWidth: 200 }}
            >
              {['1', '2', '3', '4', '5', '6'].map((n) => (
                <Box
                  key={n}
                  background={theme.colors['primary']}
                  sx={{ padding: theme.spacing(0.5) }}
                >
                  {n}
                </Box>
              ))}
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
          variant='outlined'
          onClick={toggleMode}
          sx={{ marginTop: theme.spacing(1) }}
        >
          Toggle light / dark
        </Button>

        {/* Best Practices ---------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Use numeric <code>gap</code> with theme spacing. Prefer small integers (e.g.,
            <code> 1</code>, <code>2</code>) so density changes propagate via
            <code> theme.spacing</code>.
          </Typography>
          <Typography>
            - Let rows wrap by default. <code>direction=&apos;row&apos;</code> enables wrapping
            unless you set <code>wrap={false}</code>. This keeps content readable on narrow screens.
          </Typography>
          <Typography>
            - Pad the container, not children. Use the <code>pad</code> prop for outer breathing
            room and <code>gap</code> for inter-item rhythm; avoid ad‑hoc margins on each child.
          </Typography>
          <Typography>
            - Control scroll intentionally. Stacks hide horizontal overflow; when nesting inside
            constrained parents (e.g., <code>{'<Grid>'}</code>), tune
            <code> --valet-stack-ov-y</code> and <code>--valet-stack-max-h</code> to prevent nested
            scrollbars.
          </Typography>
          <Typography>
            - Use <code>preset</code> for common layouts. Capture repeated alignment and spacing in
            a preset to keep markup clean and consistent.
          </Typography>
        </Panel>
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
