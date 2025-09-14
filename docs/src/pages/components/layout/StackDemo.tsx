// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/layout/StackDemo.tsx  | valet-docs
// Showcase of Stack via meta-driven docs template
// ─────────────────────────────────────────────────────────────
import { Stack, Typography, Box, Button, useTheme } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import StackMeta from '../../../../../src/components/layout/Stack.meta.json';

export default function StackDemoPage() {
  const { theme, toggleMode } = useTheme();

  const usageContent = (
    <Stack>
      <Typography variant='h3'>Row layout</Typography>
      <Stack
        direction='row'
        gap={2}
      >
        <Box background={theme.colors['primary']}>A</Box>
        <Box background={theme.colors['secondary']}>B</Box>
        <Box background={theme.colors['tertiary']}>C</Box>
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
      subtitle='Vertical or horizontal layout with gap and wrap'
      slug='components/layout/stack'
      meta={StackMeta}
      usage={usageContent}
    />
  );
}
