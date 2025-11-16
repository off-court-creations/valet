// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/layout/GridDemo.tsx  | valet-docs
// Grid docs using ComponentMetaPage (Usage, Best Practices, Playground, Examples, Reference)
// ─────────────────────────────────────────────────────────────
import {
  Stack,
  Typography,
  Grid,
  Box,
  useTheme,
  Iterator,
  Switch,
  Divider,
  Panel,
} from '@archway/valet';
import { useMemo, useState } from 'react';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import GridMeta from '../../../../../src/components/layout/Grid.meta.json';

export default function GridDemoPage() {
  const { theme } = useTheme();

  const usageContent = (
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
          centerContent
        >
          <Typography>A</Typography>
        </Box>
        <Box
          fullWidth
          sx={{
            background: theme.colors['secondary'] as string,
            color: theme.colors['secondaryText'] as string,
            padding: theme.spacing(1),
          }}
          centerContent
        >
          <Typography>B</Typography>
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
            }}
            centerContent
          >
            <Typography>{n}</Typography>
          </Box>
        ))}
      </Grid>

      <Divider />

      <Typography variant='h3'>Adaptive grid</Typography>
      <Typography variant='subtitle'>Switches to one column in portrait orientation.</Typography>
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
            }}
            centerContent
          >
            <Typography>{n}</Typography>
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
            sx={{ padding: theme.spacing(1) }}
            centerContent
          >
            <Typography>A1</Typography>
          </Box>
          <Box
            fullWidth
            sx={{ padding: theme.spacing(1) }}
            centerContent
          >
            <Typography>A2</Typography>
          </Box>
          <Box
            fullWidth
            sx={{ padding: theme.spacing(1) }}
            centerContent
          >
            <Typography>A3</Typography>
          </Box>
          <Box
            fullWidth
            sx={{ padding: theme.spacing(1) }}
            centerContent
          >
            <Typography>A4</Typography>
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
              sx={{ padding: theme.spacing(1) }}
              centerContent
            >
              <Typography>{n}</Typography>
            </Box>
          ))}
        </Grid>
      </Grid>
    </Stack>
  );

  const playgroundContent = <GridPlayground />;

  return (
    <ComponentMetaPage
      title='Grid'
      subtitle='Flexible two‑dimensional layout for dashboards, galleries, and cards.'
      slug='components/layout/grid'
      meta={GridMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
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
            onValueChange={(n) => setColumns(Math.round(n))}
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
            onValueChange={(n) => setGap(n)}
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
            onValueChange={(n) => setPad(n)}
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
            onValueChange={(v) => setAdaptive(!!v)}
            aria-label='Toggle adaptive'
          />
        </Stack>
      </Stack>
      <Panel fullWidth>
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
              }}
              centerContent
            >
              <Typography>{n}</Typography>
            </Box>
          ))}
        </Grid>
      </Panel>
    </Stack>
  );
}
