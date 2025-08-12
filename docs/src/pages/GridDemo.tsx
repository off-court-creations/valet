// ─────────────────────────────────────────────────────────────
// src/pages/GridDemo.tsx | valet-docs
// Showcase of Grid layout primitive
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Grid, Box, Tabs, Table, useTheme } from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import type { ReactNode } from 'react';

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
      description: 'Number of equal-width columns',
    },
    {
      prop: <code>gap</code>,
      type: <code>number | string</code>,
      default: <code>2</code>,
      description: 'Spacing between cells (numbers use theme.spacing)',
    },
    {
      prop: <code>adaptive</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Portrait orientation uses a single column',
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
        <Typography
          variant='h2'
          bold
        >
          Grid Showcase
        </Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='subtitle'>Responsive column layout</Typography>

            <Typography variant='h3'>1. Two columns</Typography>
            <Grid
              columns={2}
              gap={2}
            >
              <Box
                style={{
                  background: theme.colors['primary'] as string,
                  color: theme.colors['primaryText'] as string,
                  padding: theme.spacing(1),
                }}
              >
                A
              </Box>
              <Box
                style={{
                  background: theme.colors['secondary'] as string,
                  color: theme.colors['secondaryText'] as string,
                  padding: theme.spacing(1),
                }}
              >
                B
              </Box>
            </Grid>

            <Typography variant='h3'>2. Four columns</Typography>
            <Grid
              columns={4}
              gap={1}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8'].map((n) => (
                <Box
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

            <Typography variant='h3'>3. Eight columns</Typography>
            <Grid
              columns={8}
              gap={1}
            >
              {['1', '2', '3', '4', '5', '6', '7', '8'].map((n) => (
                <Box
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

            <Typography variant='h3'>4. Adaptive grid</Typography>
            <Grid
              columns={4}
              gap={1}
              adaptive
            >
              {['1', '2', '3', '4', '5', '6', '7', '8'].map((n) => (
                <Box
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
      </Stack>
    </Surface>
  );
}
