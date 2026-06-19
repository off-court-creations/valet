// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/layout/StackDemo.tsx  | valet-docs
// Showcase of Stack + the W1 improve (align/justify, gapX/gapY, divider,
// responsive props, grow) and the sugar set (HStack/VStack/Center/
// Cluster/Spacer) via the meta-driven docs template.
// ─────────────────────────────────────────────────────────────
import {
  Stack,
  HStack,
  VStack,
  Center,
  Cluster,
  Spacer,
  Typography,
  Box,
  Button,
  Chip,
  Divider,
  useTheme,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import StackMeta from '../../../../../src/components/layout/Stack.meta.json';

export default function StackDemoPage() {
  const { theme, toggleMode } = useTheme();
  const swatch = (label: string, bg: string | undefined) => (
    <Box
      background={bg}
      sx={{ padding: theme.spacing(1) }}
    >
      {label}
    </Box>
  );

  const usageContent = (
    <Stack gap={2}>
      <Typography variant='h3'>Row layout</Typography>
      <Stack
        direction='row'
        gap={2}
      >
        {swatch('A', theme.colors['primary'])}
        {swatch('B', theme.colors['secondary'])}
        {swatch('C', theme.colors['tertiary'])}
      </Stack>

      <Typography variant='h3'>Wrapping</Typography>
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

      {/* ── W1 improve ─────────────────────────────────────────── */}
      <Typography variant='h3'>align / justify tokens</Typography>
      <Stack
        direction='row'
        justify='between'
        align='center'
        sx={{ minHeight: 64, border: `1px solid ${theme.colors['primary']}` }}
      >
        {swatch('start', theme.colors['primary'])}
        {swatch('taller', theme.colors['secondary'])}
        {swatch('end', theme.colors['tertiary'])}
      </Stack>

      <Typography variant='h3'>HStack toolbar with a Spacer</Typography>
      <HStack
        gap={1}
        sx={{ border: `1px solid ${theme.colors['primary']}`, padding: theme.spacing(1) }}
      >
        <Button variant='outlined'>Back</Button>
        <Typography variant='h4'>Title</Typography>
        <Spacer />
        <Button>Save</Button>
      </HStack>

      <Typography variant='h3'>Cluster (wrapping chips)</Typography>
      <Cluster gap={1}>
        {['design', 'react', 'a11y', 'ssr', 'tokens', 'responsive', 'layout', 'css'].map((t) => (
          <Chip
            key={t}
            label={t}
          />
        ))}
      </Cluster>

      <Typography variant='h3'>divider between children</Typography>
      <HStack
        gap={1}
        divider={<Divider orientation='vertical' />}
      >
        <Typography>One</Typography>
        <Typography>Two</Typography>
        <Typography>Three</Typography>
      </HStack>

      <Typography variant='h3'>Center (both axes)</Typography>
      <Center sx={{ minHeight: 120, border: `1px solid ${theme.colors['secondary']}` }}>
        {swatch('centered', theme.colors['secondary'])}
      </Center>

      <Typography variant='h3'>grow — fill remaining space</Typography>
      <HStack
        gap={1}
        sx={{ border: `1px solid ${theme.colors['tertiary']}` }}
      >
        {swatch('fixed', theme.colors['primary'])}
        <Stack
          grow
          align='center'
        >
          {swatch('grow', theme.colors['tertiary'])}
        </Stack>
      </HStack>

      <Typography variant='h3'>Responsive direction</Typography>
      <Typography variant='subtitle'>
        Compiles to a CSS <code>@media</code> rule (no Surface) — resize the window: column on
        narrow, row from <code>md</code> up.
      </Typography>
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        gap={{ xs: 1, md: 2 }}
        align='center'
      >
        {swatch('one', theme.colors['primary'])}
        {swatch('two', theme.colors['secondary'])}
        {swatch('three', theme.colors['tertiary'])}
      </Stack>

      <Typography variant='h3'>VStack</Typography>
      <VStack gap={1}>
        {swatch('top', theme.colors['primary'])}
        {swatch('middle', theme.colors['secondary'])}
        {swatch('bottom', theme.colors['tertiary'])}
      </VStack>

      <Button
        variant='outlined'
        onClick={toggleMode}
        sx={{ alignSelf: 'flex-start' }}
      >
        Toggle light / dark
      </Button>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Stack'
      subtitle='One-dimensional layout — gap, align/justify, divider, responsive, and the HStack/VStack/Center/Cluster/Spacer sugar'
      slug='components/layout/stack'
      meta={StackMeta}
      usage={usageContent}
    />
  );
}
