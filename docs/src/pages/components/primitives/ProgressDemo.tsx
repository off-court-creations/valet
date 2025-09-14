// ─────────────────────────────────────────────────────────────────────────────
// src/pages/ProgressDemoPage.tsx | valet-docs
// Interactive playground showcasing every <Progress/> capability – circular &
// linear, determinate / indeterminate / buffer modes, all sizes, colour /
// theme coupling, and live control via Slider, Button, & IconButton.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import {
  Surface,
  Stack,
  Box,
  Typography,
  Button,
  IconButton,
  Slider,
  Progress,
  useTheme,
  Tabs,
} from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import ProgressMeta from '../../../../../src/components/primitives/Progress.meta.json';
import PageHero from '../../../components/PageHero';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function ProgressDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  /* Controlled value / buffer ------------------------------------------- */
  const [value, setValue] = useState(40);
  const [buffer, setBuffer] = useState(60);

  /* Auto-increment animation just for show ------------------------------ */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (value < 100) {
        setValue((v) => Math.min(100, v + 1));
        setBuffer((b) => Math.min(100, b + 1.5));
      }
    }, 90);
    return () => clearTimeout(id);
  }, [value]);

  const reset = () => {
    setValue(0);
    setBuffer(25);
  };

  // MCP-driven reference tables used; manual data removed

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Progress' />
        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            {/* 1. Circular indeterminate ---------------------------------- */}
            <Typography variant='h3'>1. Circular – indeterminate</Typography>
            <Stack direction='row'>
              <Progress
                variant='circular'
                mode='indeterminate'
                size='xs'
              />
              <Progress
                variant='circular'
                mode='indeterminate'
                size='sm'
              />
              <Progress
                variant='circular'
                mode='indeterminate'
              />
              <Progress
                variant='circular'
                mode='indeterminate'
                size='lg'
              />
              <Progress
                variant='circular'
                mode='indeterminate'
                size='xl'
              />
            </Stack>

            {/* 2. Circular determinate (controlled) ----------------------- */}
            <Typography variant='h3'>2. Circular – determinate (controlled)</Typography>
            {/* Circular surrounding an IconButton using Progress children */}
            <Stack
              direction='row'
              sx={{ alignItems: 'center', gap: theme.spacing(1) }}
            >
              {/* Overlay IconButton centered above circular progress without using children prop */}
              <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                <Progress
                  variant='circular'
                  mode='determinate'
                  value={value}
                  color={theme.colors['secondary']}
                />
                <IconButton
                  icon='mdi:home'
                  onClick={reset}
                  aria-label='reset'
                  size={48}
                  sx={{ position: 'absolute', inset: 0, margin: 'auto' }}
                />
              </Box>
            </Stack>

            {/* Additional circular determinate styles */}
            <Stack
              direction='row'
              sx={{ alignItems: 'center', gap: theme.spacing(1) }}
            >
              <Progress
                variant='circular'
                mode='determinate'
                value={value}
                showLabel
              />
              <Progress
                variant='circular'
                mode='determinate'
                value={value}
                size='lg'
                color={theme.colors['error']}
              />
            </Stack>

            {/* 3. Linear indeterminate ------------------------------------ */}
            <Typography variant='h3'>3. Linear – indeterminate</Typography>
            <Progress mode='indeterminate' />

            {/* 4. Linear determinate (controlled) ------------------------- */}
            <Typography variant='h3'>4. Linear – determinate (controlled)</Typography>
            <Progress value={value} />
            <Progress
              value={value}
              size={50}
            />

            {/* 5. Linear buffer ------------------------------------------- */}
            <Typography variant='h3'>5. Linear – buffer</Typography>
            <Progress
              mode='buffer'
              value={value}
              buffer={buffer}
            />

            {/* 6. Interactive controls ------------------------------------ */}
            <Typography variant='h3'>6. Play with value</Typography>
            <Stack>
              <Box sx={{ maxWidth: 480 }}>
                <Slider
                  value={value}
                  onChange={setValue}
                />
              </Box>
              <Stack direction='row'>
                <Button onClick={() => setValue((v) => Math.max(0, v - 10))}>–10</Button>
                <Button onClick={() => setValue((v) => Math.min(100, v + 10))}>+10</Button>
                <Button
                  variant='outlined'
                  onClick={reset}
                >
                  Reset
                </Button>
                <Button
                  variant='outlined'
                  onClick={toggleMode}
                >
                  Toggle light / dark
                </Button>
              </Stack>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/primitives/progress' />
          </Tabs.Panel>
        </Tabs>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        <CuratedExamples examples={getExamples(ProgressMeta)} />
        <BestPractices items={getBestPractices(ProgressMeta)} />
      </Stack>
    </Surface>
  );
}
