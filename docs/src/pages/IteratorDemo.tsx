// ─────────────────────────────────────────────────────────────
// src/pages/IteratorDemo.tsx | valet docs
// Showcase of Iterator component
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Tabs,
  Table,
  useTheme,
  Iterator,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function IteratorDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [count, setCount] = useState(5);

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
      description: 'Uncontrolled start value',
    },
    {
      prop: <code>onChange</code>,
      type: <code>(v: number) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Change handler',
    },
    {
      prop: <code>step</code>,
      type: <code>number</code>,
      default: <code>1</code>,
      description: 'Increment value',
    },
    {
      prop: <code>min</code>,
      type: <code>number</code>,
      default: <code>-Infinity</code>,
      description: 'Minimum allowed value',
    },
    {
      prop: <code>max</code>,
      type: <code>number</code>,
      default: <code>Infinity</code>,
      description: 'Maximum allowed value',
    },
    {
      prop: <code>size</code>,
      type: <code>number | string</code>,
      default: <code>'4rem'</code>,
      description: 'Input width',
    },
    {
      prop: <code>disabled</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Disable interaction',
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
          Iterator Showcase
        </Typography>
        <Typography variant="subtitle">
          Compact numeric input with plus/minus controls
        </Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Stack>
              <Typography variant="h3">1. Uncontrolled</Typography>
              <Iterator />

              <Typography variant="h3">2. Controlled</Typography>
              <Iterator value={count} onChange={setCount} />
              <Typography>Value: {count}</Typography>

              <Typography variant="h3">3. Disabled</Typography>
              <Iterator defaultValue={3} disabled />

              <Typography variant="h3">4. Theme toggle</Typography>
              <Button variant="outlined" onClick={toggleMode}>
                Toggle light / dark
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Typography variant="h3">Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>

        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
