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
  useTheme,
  Iterator,
  Switch,
  Divider,
} from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import GridMeta from '../../../../../src/components/layout/Grid.meta.json';
import type {} from 'react';
import { useMemo, useState } from 'react';

export default function GridDemoPage() {
  const { theme } = useTheme();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Grid' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography variant='h3'>Two columns</Typography>
              <Grid
                columns={2}
                gap={1}
              >
                <Box
                  fullWidth
                  sx={{
                    background: theme.colors['primary'] as string,
                    color: theme.colors['primaryText'] as string,
                    padding: theme.spacing(1),
                  }}
                >
                  A
                </Box>
                <Box
                  fullWidth
                  sx={{
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
                    sx={{
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
                    sx={{
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
                    sx={{ padding: theme.spacing(1), textAlign: 'center' }}
                  >
                    A1
                  </Box>
                  <Box
                    fullWidth
                    sx={{ padding: theme.spacing(1), textAlign: 'center' }}
                  >
                    A2
                  </Box>
                  <Box
                    fullWidth
                    sx={{ padding: theme.spacing(1), textAlign: 'center' }}
                  >
                    A3
                  </Box>
                  <Box
                    fullWidth
                    sx={{ padding: theme.spacing(1), textAlign: 'center' }}
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
                      sx={{ padding: theme.spacing(1), textAlign: 'center' }}
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
            <ReferenceSection slug='components/layout/grid' />
          </Tabs.Panel>
        </Tabs>

        <CuratedExamples examples={getExamples(GridMeta)} />
        <BestPractices items={getBestPractices(GridMeta)} />
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
        sx={{ alignItems: 'center' }}
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
          sx={{ alignItems: 'center' }}
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
            sx={{
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
