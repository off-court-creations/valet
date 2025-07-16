// src/pages/IteratorDemo.tsx
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Iterator,
  Tabs,
  Table,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import NavDrawer from '../components/NavDrawer';

export default function IteratorDemoPage() {
  const { theme, toggleMode } = useTheme();
  const [count, setCount] = useState(3);

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
      prop: <code>value</code>,
      type: <code>number</code>,
      default: <code>-</code>,
      description: 'Controlled value',
    },
    {
      prop: <code>defaultValue</code>,
      type: <code>number</code>,
      default: <code>0</code>,
      description: 'Uncontrolled initial value',
    },
    {
      prop: <code>onChange</code>,
      type: <code>(n: number) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Change handler',
    },
    {
      prop: <code>step</code>,
      type: <code>number</code>,
      default: <code>1</code>,
      description: 'Increment amount',
    },
    {
      prop: <code>min</code>,
      type: <code>number</code>,
      default: <code>-</code>,
      description: 'Minimum value',
    },
    {
      prop: <code>max</code>,
      type: <code>number</code>,
      default: <code>-</code>,
      description: 'Maximum value',
    },
    {
      prop: <code>width</code>,
      type: <code>number | string</code>,
      default: <code>'4rem'</code>,
      description: 'Input width',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack preset="showcaseStack">
        <Typography variant="h2" bold>
          Iterator
        </Typography>
        <Typography variant="subtitle">
          Compact numeric input with plus/minus controls
        </Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Typography variant="h3">1. Uncontrolled</Typography>
            <Iterator defaultValue={2} />

            <Typography variant="h3">2. Controlled</Typography>
            <Stack direction="row" style={{ alignItems: 'center' }}>
              <Iterator value={count} onChange={setCount} />
              <Typography variant="body" style={{ marginLeft: theme.spacing(1) }}>
                Count: {count}
              </Typography>
            </Stack>

            <Typography variant="h3">3. Custom width &amp; step</Typography>
            <Iterator defaultValue={10} width="5rem" step={5} />

            <Typography variant="h3">4. Theme toggle</Typography>
            <Button variant="outlined" onClick={toggleMode}>
              Toggle light / dark
            </Button>
          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Typography variant="h3">Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}
