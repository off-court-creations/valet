// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/layout/GridDemo.tsx  | valet-docs
// Grid docs (W2 rewrite): responsive columns, minColWidth auto-fit/fill,
// GridItem placement, equalize — via ComponentMetaPage.
// ─────────────────────────────────────────────────────────────
import {
  Stack,
  Typography,
  Grid,
  GridItem,
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

  const cell = (label: string, bg = 'primary', fg = 'primaryText') => (
    <Box
      fullWidth
      key={label}
      sx={{
        background: theme.colors[bg] as string,
        color: theme.colors[fg] as string,
        padding: theme.spacing(1),
      }}
      centerContent
    >
      <Typography>{label}</Typography>
    </Box>
  );

  const usageContent = (
    <Stack>
      <Typography variant='h3'>Equal columns</Typography>
      <Grid
        columns={4}
        gap={1}
      >
        {Array.from({ length: 8 }, (_, i) => cell(String(i + 1)))}
      </Grid>

      <Divider />

      <Typography variant='h3'>Responsive columns</Typography>
      <Typography variant='subtitle'>
        <code>columns={'{{ xs: 1, sm: 2, lg: 4 }}'}</code> — compiles to CSS
        <code> @media</code> (no Surface). Resize the window.
      </Typography>
      <Grid
        columns={{ xs: 1, sm: 2, lg: 4 }}
        gap={1}
      >
        {Array.from({ length: 8 }, (_, i) => cell(String(i + 1), 'secondary', 'secondaryText'))}
      </Grid>

      <Divider />

      <Typography variant='h3'>Auto-fit card grid — minColWidth</Typography>
      <Typography variant='subtitle'>
        <code>minColWidth={'{180}'}</code> — as many ≥180px columns as fit, zero breakpoints.
      </Typography>
      <Grid
        minColWidth={180}
        gap={1}
      >
        {Array.from({ length: 7 }, (_, i) => cell(`card ${i + 1}`, 'tertiary', 'tertiaryText'))}
      </Grid>

      <Divider />

      <Typography variant='h3'>Per-item placement — GridItem</Typography>
      <Typography variant='subtitle'>
        <code>span</code> is responsive too: stacked on narrow, 8/4 split from <code>md</code> up.
      </Typography>
      <Grid
        columns={12}
        gap={1}
      >
        <GridItem span={{ xs: 12, md: 8 }}>{cell('main · span 8')}</GridItem>
        <GridItem span={{ xs: 12, md: 4 }}>
          {cell('aside · span 4', 'secondary', 'secondaryText')}
        </GridItem>
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
          {['A1', 'A2', 'A3', 'A4'].map((n) => cell(n))}
        </Grid>
        <Grid
          columns={3}
          gap={0.5}
        >
          {['B1', 'B2', 'B3', 'B4', 'B5', 'B6'].map((n) => cell(n, 'secondary', 'secondaryText'))}
        </Grid>
      </Grid>
    </Stack>
  );

  const playgroundContent = <GridPlayground />;

  return (
    <ComponentMetaPage
      title='Grid'
      subtitle='Two-dimensional CSS-grid layout — responsive columns, minColWidth auto-fit, and GridItem placement.'
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
  const [minColWidth, setMinColWidth] = useState<number>(0); // 0 = off (use columns)
  const [autoFit, setAutoFit] = useState<boolean>(false); // false = fill (default)
  const [equalize, setEqualize] = useState<boolean>(true);

  const items = useMemo(() => Array.from({ length: 8 }, (_, i) => String(i + 1)), []);
  const auto = minColWidth > 0;

  return (
    <Stack gap={1}>
      <Stack
        direction='row'
        wrap
        gap={1}
        sx={{ alignItems: 'center' }}
      >
        <Stack gap={0.25}>
          <Typography variant='subtitle'>columns (when auto-fit off)</Typography>
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
          <Typography variant='subtitle'>minColWidth px (0 = off)</Typography>
          <Iterator
            width={160}
            min={0}
            max={320}
            step={20}
            value={minColWidth}
            onValueChange={(n) => setMinColWidth(Math.round(n))}
            aria-label='Min column width'
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
          <Typography variant='subtitle'>auto-fit</Typography>
          <Switch
            checked={autoFit}
            onValueChange={(v) => setAutoFit(!!v)}
            aria-label='Toggle auto-fit (vs fill)'
          />
        </Stack>
        <Stack
          direction='row'
          wrap={false}
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>equalize</Typography>
          <Switch
            checked={equalize}
            onValueChange={(v) => setEqualize(!!v)}
            aria-label='Toggle equalize'
          />
        </Stack>
      </Stack>
      <Panel fullWidth>
        <Grid
          columns={columns}
          gap={gap}
          pad={pad}
          equalize={equalize}
          {...(auto ? { minColWidth, autoFlow: autoFit ? 'fit' : 'fill' } : {})}
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
