// ─────────────────────────────────────────────────────────────────────────────
// src/pages/SliderDemo.tsx | valet-docs
// Comprehensive live demo showcasing every Slider feature & edge-case
// – Updated: section #5 now snaps to its custom tick marks
// – Removed: preset-styling showcase (simplifies demo focus)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Surface, Stack, Typography, Button, Slider, useTheme, Tabs, Table } from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Example-wide constants                                                     */
const PRESET_MARKS = [0, 25, 50, 75, 100]; // example #4 presets
const CUSTOM_TICKS = [0, 15, 30, 45, 60]; // example #5 ticks

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                   */
export default function SliderDemoPage() {
  const { toggleMode } = useTheme();

  /* Controlled slider state ------------------------------------------------ */
  const [ctlValue, setCtlValue] = useState(30);

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
      prop: <code>min</code>,
      type: <code>number</code>,
      default: <code>0</code>,
      description: 'Minimum value',
    },
    {
      prop: <code>max</code>,
      type: <code>number</code>,
      default: <code>100</code>,
      description: 'Maximum value',
    },
    {
      prop: <code>step</code>,
      type: <code>number</code>,
      default: <code>1</code>,
      description: 'Step increment',
    },
    {
      prop: <code>presets</code>,
      type: <code>number[]</code>,
      default: <code>[]</code>,
      description: 'Preset snap points',
    },
    {
      prop: <code>snap</code>,
      type: <code>&#39;none&#39; | &#39;step&#39; | &#39;presets&#39;</code>,
      default: <code>&#39;none&#39;</code>,
      description: 'Snap behaviour',
    },
    {
      prop: <code>precision</code>,
      type: <code>number</code>,
      default: <code>0</code>,
      description: 'Decimal places',
    },
    {
      prop: <code>showValue</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Display current value',
    },
    {
      prop: <code>showMinMax</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Display min and max labels',
    },
    {
      prop: <code>showTicks</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Show tick marks',
    },
    {
      prop: <code>ticks</code>,
      type: <code>number[]</code>,
      default: <code>-</code>,
      description: 'Custom tick positions',
    },
    {
      prop: <code>size</code>,
      type: (
        <code>
          &#39;xs&#39; | &#39;sm&#39; | &#39;md&#39; | &#39;lg&#39; | &#39;xl&#39; | number | string
        </code>
      ),
      default: <code>&#39;md&#39;</code>,
      description: 'Slider size',
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
        {/* Header */}
        <Typography
          variant='h2'
          bold
        >
          Slider Showcase
        </Typography>
        <Typography variant='subtitle'>A smörgåsbord of every prop, pattern, and trick</Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              {/* 1. Default uncontrolled ----------------------------------------- */}
              <Typography variant='h3'>1. Uncontrolled (defaults)</Typography>
              <Slider defaultValue={50} />

              {/* 2. Controlled ---------------------------------------------------- */}
              <Typography variant='h3'>2. Controlled</Typography>
              <Stack>
                <Slider
                  value={ctlValue}
                  onChange={setCtlValue}
                  showValue
                  showMinMax
                />
                <Typography>
                  Current value:&nbsp;
                  <code>{ctlValue}</code>
                </Typography>
              </Stack>

              {/* 3. Step snapping w/ ticks --------------------------------------- */}
              <Typography variant='h3'>3. Snap = &quot;step&quot; + ticks</Typography>
              <Slider
                defaultValue={40}
                min={0}
                max={100}
                step={10}
                snap='step'
                showValue
                showMinMax
                showTicks
              />

              {/* 4. Preset snapping ---------------------------------------------- */}
              <Typography variant='h3'>4. Snap = &quot;presets&quot;</Typography>
              <Slider
                defaultValue={75}
                min={0}
                max={100}
                presets={PRESET_MARKS}
                snap='presets'
                showValue
                showMinMax
                showTicks
              />

              {/* 5. Custom ticks *with* snapping ---------------------------------- */}
              <Typography variant='h3'>5. Custom ticks (snap = &quot;presets&quot;)</Typography>
              <Slider
                defaultValue={15}
                min={0}
                max={60}
                ticks={CUSTOM_TICKS}
                presets={CUSTOM_TICKS}
                snap='presets' // ← ensures handle snaps to tick marks
                showTicks
              />

              {/* 6. Sizes ------------------------------------------------------- */}
              <Typography variant='h3'>6. Sizes</Typography>
              <Stack>
                <Slider
                  defaultValue={20}
                  size='xs'
                  showMinMax
                />
                <Slider
                  defaultValue={20}
                  size='sm'
                  showMinMax
                />
                <Slider
                  defaultValue={20}
                  size='md'
                  showMinMax
                />
                <Slider
                  defaultValue={20}
                  size='lg'
                  showMinMax
                />
                <Slider
                  defaultValue={20}
                  size='xl'
                  showMinMax
                />
              </Stack>

              {/* 7. Custom sizes --------------------------------------------- */}
              <Typography variant='h3'>7. Custom sizes</Typography>
              <Stack>
                <Slider
                  defaultValue={40}
                  size='2rem'
                  showMinMax
                />
                <Slider
                  defaultValue={40}
                  size='24px'
                  showMinMax
                />
              </Stack>

              {/* 8. Disabled state -------------------------------------------- */}
              <Typography variant='h3'>8. Disabled</Typography>

              {/* Theme coupling */}
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
      </Stack>
    </Surface>
  );
}
