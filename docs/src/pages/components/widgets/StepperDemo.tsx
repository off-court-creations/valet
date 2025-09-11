// src/pages/StepperDemo.tsx
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Stepper,
  useTheme,
  Tabs,
  Table,
  Panel,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';

export default function StepperDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  const steps = ['First', 'Second', 'Third'];

  interface Row {
    prop: ReactNode;
    type: ReactNode;
    default: ReactNode;
    description: ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop: <code>steps</code>,
      type: <code>React.ReactNode[]</code>,
      default: <code>—</code>,
      description: 'Labels for each step',
    },
    {
      prop: <code>active</code>,
      type: <code>number</code>,
      default: <code>0</code>,
      description: 'Index of the active step',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>—</code>,
      description: 'Apply style presets',
    },
  ];

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
            <Typography variant='h3'>Prop reference</Typography>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>

        {/* Best Practices -------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Treat Stepper as presentation. It reflects progress; do not use it as the sole
            navigation control. Provide explicit Next/Back controls and validate each step.
          </Typography>
          <Typography>
            - Bind <code>active</code> to canonical state. Derive from router or form state rather
            than local UI assumptions. Clamp to <code>0…steps.length-1</code> when updating.
          </Typography>
          <Typography>
            - Keep labels short and stable. Prefer 1–2 words. For lengthy flows, consider numeric or
            icon labels and place detailed titles above the content.
          </Typography>
          <Typography>
            - Mind accessibility. Announce progress with text like
            <code> Step X of Y</code> near the Stepper so screen readers have context.
          </Typography>
          <Typography>
            - Use tokens/presets to style. Customize radius/stroke via CSS vars and presets rather
            than per-instance inline styles to keep density and branding coherent.
          </Typography>
          <Typography>
            - Keep step count reasonable. If there are many steps or non‑linear paths, a progress
            bar or checklist may be clearer.
          </Typography>
        </Panel>

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
