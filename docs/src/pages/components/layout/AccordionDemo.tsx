// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/layout/AccordionDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – uncontrolled/controlled, single/multi, disabled
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Typography,
  Button,
  Accordion,
  useTheme,
  Select,
  Switch,
  Panel,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import AccordionMeta from '../../../../../src/components/layout/Accordion.meta.json';

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse porta, nunc at egestas mattis, mauris risus iaculis mi, at cursus metus justo quis quam.';

export default function AccordionDemoPage() {
  const { theme, toggleMode } = useTheme();
  const [openSingle, setOpenSingle] = useState<number[]>([0]);
  const [openMulti, setOpenMulti] = useState<number[]>([0, 2]);

  const usage = (
    <Stack>
      <Typography variant='h3'>1. Uncontrolled (single)</Typography>
      <Accordion>
        <Accordion.Item header='Item 1'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
        <Accordion.Item header='Item 2'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
        <Accordion.Item header='Item 3'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
      </Accordion>

      <Typography variant='h3'>2. Controlled (single)</Typography>
      <Button
        size='sm'
        variant='outlined'
        onClick={() => setOpenSingle((prev) => (prev[0] === 1 ? [] : [1]))}
        sx={{ alignSelf: 'flex-start' }}
      >
        Toggle second programmatically
      </Button>
      <Accordion
        open={openSingle}
        onOpenChange={setOpenSingle}
      >
        <Accordion.Item header='First'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
        <Accordion.Item header='Second'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
        <Accordion.Item header='Third'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
      </Accordion>

      <Typography variant='h3'>3. Controlled (multiple)</Typography>
      <Accordion
        multiple
        open={openMulti}
        onOpenChange={setOpenMulti}
      >
        <Accordion.Item header='Alpha'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
        <Accordion.Item header='Bravo'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
        <Accordion.Item header='Charlie'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
      </Accordion>

      <Typography variant='h3'>4. Disabled</Typography>
      <Accordion>
        <Accordion.Item header='Enabled'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
        <Accordion.Item
          header='Disabled'
          disabled
        >
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
        <Accordion.Item header='Another enabled'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
      </Accordion>

      <Typography variant='h3'>5. Custom heading level (h4)</Typography>
      <Accordion headingLevel={4}>
        <Accordion.Item header='Header rendered as h4'>
          <Typography>{LOREM}</Typography>
        </Accordion.Item>
      </Accordion>

      <Button
        variant='outlined'
        onClick={toggleMode}
        sx={{ alignSelf: 'flex-start' }}
      >
        Toggle light / dark
      </Button>
    </Stack>
  );

  const [multiple, setMultiple] = useState(false);
  const [heading, setHeading] = useState<1 | 2 | 3 | 4 | 5 | 6>(3);
  const [constrain, setConstrain] = useState(true);
  const playground = (
    <Stack gap={1}>
      <Panel
        variant='alt'
        fullWidth
      >
        <Stack
          direction='row'
          sx={{ alignItems: 'center', gap: theme.spacing(1), flexWrap: 'wrap' }}
        >
          <Stack
            direction='row'
            sx={{ alignItems: 'center', gap: 6 }}
          >
            <Switch
              name='multiple'
              checked={multiple}
              onChange={setMultiple}
            />
            <Typography>multiple</Typography>
          </Stack>
          <Stack
            direction='row'
            sx={{ alignItems: 'center', gap: 6 }}
          >
            <Switch
              name='constrainHeight'
              checked={constrain}
              onChange={setConstrain}
            />
            <Typography>constrainHeight</Typography>
          </Stack>
          <Stack
            direction='row'
            sx={{ alignItems: 'center', gap: 6 }}
          >
            <Typography variant='subtitle'>headingLevel</Typography>
            <Select
              value={String(heading)}
              onChange={(v) => setHeading(Number(v) as 1 | 2 | 3 | 4 | 5 | 6)}
              sx={{ width: 160 }}
            >
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <Select.Option
                  key={n}
                  value={String(n)}
                >
                  h{n}
                </Select.Option>
              ))}
            </Select>
          </Stack>
        </Stack>
      </Panel>

      <Panel fullWidth>
        <Accordion
          {...(multiple ? { multiple: true } : {})}
          {...(constrain ? { constrainHeight: true } : {})}
          headingLevel={heading}
        >
          {Array.from({ length: 6 }, (_, i) => (
            <Accordion.Item
              key={i}
              header={`Item ${i + 1}`}
            >
              <Typography>{LOREM}</Typography>
            </Accordion.Item>
          ))}
        </Accordion>
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Accordion'
      subtitle='Uncontrolled/controlled, single/multiple, heading levels, constrained height'
      slug='components/layout/accordion'
      meta={AccordionMeta}
      usage={usage}
      playground={playground}
    />
  );
}
