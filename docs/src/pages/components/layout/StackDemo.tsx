// ─────────────────────────────────────────────────────────────
// src/pages/StackDemo.tsx | valet-docs
// Showcase of Stack layout primitive
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Box, Button, Tabs, useTheme } from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import StackMeta from '../../../../../src/components/layout/Stack.meta.json';
import type {} from 'react';

export default function StackDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

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
            <ReferenceSection slug='components/layout/stack' />
          </Tabs.Panel>
        </Tabs>

        <Button
          variant='outlined'
          onClick={toggleMode}
          sx={{ marginTop: theme.spacing(1) }}
        >
          Toggle light / dark
        </Button>

        <CuratedExamples examples={getExamples(StackMeta)} />
        <BestPractices items={getBestPractices(StackMeta)} />
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
