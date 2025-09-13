// ─────────────────────────────────────────────────────────────────────────────
// src/pages/AccordionConstrainedDemo.tsx | valet-docs
// Demo for <Accordion> with constrainHeight enabled
// ─────────────────────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Accordion, Button, Panel, Tabs } from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import PageHero from '../../../components/PageHero';
import { useNavigate } from 'react-router-dom';

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse porta, nunc at egestas mattis, mauris risus iaculis mi, at cursus metus justo quis quam.';

export default function AccordionConstrainedDemo() {
  const navigate = useNavigate();

  return (
    <Surface>
      <Stack>
        <PageHero title='Accordion (Constrained)' />
        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Panel fullWidth>
              <Accordion constrainHeight>
                {Array.from({ length: 8 }, (_, i) => (
                  <Accordion.Item
                    key={i}
                    header={`Item ${i + 1}`}
                  >
                    <Typography>{LOREM}</Typography>
                  </Accordion.Item>
                ))}
              </Accordion>
            </Panel>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/layout/accordion' />
          </Tabs.Panel>
        </Tabs>
        <Button
          size='lg'
          onClick={() => navigate('/')}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
