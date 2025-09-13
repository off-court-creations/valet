// ─────────────────────────────────────────────────────────────
// src/pages/TooltipDemoPage.tsx | valet-docs
// Simplified Tooltip demo with reference section
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Surface, Stack, Tooltip, Button, IconButton, Typography, useTheme, Tabs } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import TooltipMeta from '../../../../../src/components/widgets/Tooltip.meta.json';
import PageHero from '../../../components/PageHero';
import ReferenceSection from '../../../components/ReferenceSection';

export default function TooltipDemoPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Tooltip' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='h3'>1. Default</Typography>
            <Tooltip title='Hello, valet!'>
              <Button variant='contained'>Hover me</Button>
            </Tooltip>

            <Typography variant='h3'>2. Controlled visibility</Typography>
            <Stack direction='row'>
              <Tooltip
                open={open}
                onOpen={() => setOpen(true)}
                onClose={() => setOpen(false)}
                title='Controlled'
              >
                <Button variant='outlined'>Target</Button>
              </Tooltip>
              <Button onClick={() => setOpen((v) => !v)}>{open ? 'Hide' : 'Show'} tooltip</Button>
            </Stack>

            <Typography variant='h3'>3. Arrow toggle</Typography>
            <Stack direction='row'>
              <Tooltip title='Default arrow (true)'>
                <IconButton icon='mdi:home' />
              </Tooltip>
              <Tooltip
                arrow={false}
                title='arrow={false}'
              >
                <IconButton icon='mdi:home' />
              </Tooltip>
            </Stack>

            <Button
              size='lg'
              onClick={() => navigate(-1)}
              sx={{ marginTop: theme.spacing(1) }}
            >
              ← Back
            </Button>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/widgets/tooltip' />
          </Tabs.Panel>
        </Tabs>

        <CuratedExamples examples={getExamples(TooltipMeta)} />
        <BestPractices items={getBestPractices(TooltipMeta)} />
      </Stack>
    </Surface>
  );
}
