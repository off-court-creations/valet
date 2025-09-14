// src/pages/StepperDemo.tsx
import { useState } from 'react';
import { Surface, Stack, Button, Stepper, useTheme, Tabs } from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import StepperMeta from '../../../../../src/components/widgets/Stepper.meta.json';
import PageHero from '../../../components/PageHero';

export default function StepperDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  const steps = ['First', 'Second', 'Third'];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Stepper' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Stepper
                steps={steps}
                active={active}
              />
              <Stack direction='row'>
                <Button onClick={() => setActive((a) => Math.max(0, a - 1))}>Back</Button>
                <Button onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))}>
                  Next
                </Button>
              </Stack>
              <Button
                variant='outlined'
                onClick={toggleMode}
              >
                Toggle light / dark
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/widgets/stepper' />
          </Tabs.Panel>
        </Tabs>

        <CuratedExamples examples={getExamples(StepperMeta)} />
        <BestPractices items={getBestPractices(StepperMeta)} />

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
