// ─────────────────────────────────────────────────────────────────────────────
// src/pages/AccordionConstrainedDemo.tsx | valet-docs
// Demo for <Accordion> with constrainHeight enabled
// ─────────────────────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Accordion, Button, Panel } from '@archway/valet';
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
