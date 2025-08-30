// src/pages/StepperDemo.tsx
import { useState } from 'react';
import { Surface, Stack, Typography, Button, Stepper, useTheme, Tabs, Table } from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';

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
        <Typography
          variant='h2'
          bold
        >
          Stepper Showcase
        </Typography>
        <Typography variant='subtitle'>Simple progress indicator</Typography>

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
