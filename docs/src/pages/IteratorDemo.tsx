// ─────────────────────────────────────────────────────────────
// src/pages/IteratorDemo.tsx | valet
// Showcase of Iterator component
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Iterator,
  FormControl,
  createFormStore,
  useTheme,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*───────────────────────────────────────────────────────────*/
interface FormVals {
  amount: number;
}
const useFormStore = createFormStore<FormVals>({ amount: 1 });

export default function IteratorDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [count, setCount] = useState(2);

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
      type: <code>(value: number) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Change handler',
    },
    {
      prop: <code>name</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Form field name',
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
      prop: <code>step</code>,
      type: <code>number</code>,
      default: <code>1</code>,
      description: 'Increment step',
    },
    {
      prop: <code>width</code>,
      type: <code>number | string</code>,
      default: <code>'3.5rem'</code>,
      description: 'Field width',
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
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Iterator Playground
        </Typography>
        <Typography variant='subtitle'>
          Compact numeric stepper with plus/minus controls. Scroll while hovering to change the
          value without moving the page.
        </Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography>
                The field will increment when scrolling up and decrement when scrolling down. Page
                scrolling is suppressed while hovering, including on Firefox.
              </Typography>
              <Typography variant='h3'>1. Uncontrolled</Typography>
              <Iterator defaultValue={3} />

              <Typography variant='h3'>2. Controlled</Typography>
              <Stack
                direction='row'
                style={{ alignItems: 'center' }}
              >
                <Iterator
                  value={count}
                  onChange={setCount}
                />
                <Typography>Value: {count}</Typography>
              </Stack>

              <Typography variant='h3'>3. Min, max &amp; step</Typography>
              <Iterator
                min={0}
                max={10}
                step={2}
                defaultValue={4}
              />

              <Typography variant='h3'>4. Disabled</Typography>
              <Iterator
                defaultValue={5}
                disabled
              />

              <Typography variant='h3'>5. FormControl</Typography>
              <FormControl
                useStore={useFormStore}
                onSubmitValues={(vals) => alert(JSON.stringify(vals))}
              >
                <Stack
                  direction='row'
                  compact
                >
                  <Iterator name='amount' />
                  <Button type='submit'>Submit</Button>
                </Stack>
              </FormControl>

              <Typography variant='h3'>6. Theme toggle</Typography>
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
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
