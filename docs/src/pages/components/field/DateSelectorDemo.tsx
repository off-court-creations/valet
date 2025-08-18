// ─────────────────────────────────────────────────────────────
// src/pages/DateSelectorDemo.tsx | valet-docs
// Showcase of DateSelector component
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  DateSelector,
  useTheme,
  Grid,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';

export default function DateSelectorDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('2025-01-01');
  const [limited, setLimited] = useState('2025-07-15');
  const [rangeDates, setRangeDates] = useState<[string, string]>(['2025-07-01', '2025-07-10']);

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
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Controlled ISO date value (YYYY-MM-DD)',
    },
    {
      prop: <code>defaultValue</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Initial uncontrolled value',
    },
    {
      prop: <code>onChange</code>,
      type: <code>(value: string) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Fires when selection changes',
    },
    {
      prop: <code>name</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'FormControl field name',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets',
    },
    {
      prop: <code>minDate</code>,
      type: <code>string</code>,
      default: <code>&#39;120y ago&#39;</code>,
      description: 'Earliest selectable date',
    },
    {
      prop: <code>maxDate</code>,
      type: <code>string</code>,
      default: <code>&#39;120y ahead&#39;</code>,
      description: 'Latest selectable date',
    },
    {
      prop: <code>range</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Enable dual start/end selection',
    },
    {
      prop: <code>endValue</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Controlled end date when range is true',
    },
    {
      prop: <code>defaultEndValue</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Uncontrolled end date default',
    },
    {
      prop: <code>onRangeChange</code>,
      type: <code>(start: string, end: string) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Fires when range selection changes',
    },
    {
      prop: <code>compactMode</code>,
      type: <code>&apos;auto&apos; | &apos;on&apos; | &apos;off&apos;</code>,
      default: <code>&apos;auto&apos;</code>,
      description: 'Control compact behavior: auto-detect, force on, or disable entirely',
    },
    {
      prop: <code>compactThresholdIn</code>,
      type: <code>number</code>,
      default: <code>340</code>,
      description: 'Width below which compact turns on (only when compactMode=auto)',
    },
    {
      prop: <code>compactThresholdOut</code>,
      type: <code>number</code>,
      default: <code>380</code>,
      description: 'Width above which compact turns off (only when compactMode=auto)',
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
          DateSelector Showcase
        </Typography>
        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='subtitle'>
              Compact calendar with month and year navigation
            </Typography>

            <Typography variant='h3'>1. Basic</Typography>
            <DateSelector
              value={selected}
              onChange={setSelected}
            />

            <Typography variant='h3'>2. Custom width</Typography>
            <Grid
              columns={3}
              adaptive
            >
              <DateSelector
                value={selected}
                onChange={setSelected}
              />
            </Grid>

            <Typography variant='h3'>3. Limited range</Typography>
            <DateSelector
              value={limited}
              onChange={setLimited}
              minDate='2025-06-01'
              maxDate='2025-09-15'
            />

            <Typography variant='h3'>4. Range mode</Typography>
            <DateSelector
              range
              value={rangeDates[0]}
              endValue={rangeDates[1]}
              onRangeChange={(s, e) => setRangeDates([s, e])}
            />

            <Typography variant='h3'>5. Compact controls</Typography>
            <Stack direction='row'>
              <Stack>
                <Typography variant='subtitle'>Force compact</Typography>
                <DateSelector
                  compactMode='on'
                  value={selected}
                  onChange={setSelected}
                />
              </Stack>
              <Stack>
                <Typography variant='subtitle'>Force non-compact</Typography>
                <DateSelector
                  compactMode='off'
                  value={selected}
                  onChange={setSelected}
                />
              </Stack>
              <Stack>
                <Typography variant='subtitle'>Custom thresholds</Typography>
                <div style={{ maxWidth: 320 }}>
                  <DateSelector
                    compactMode='auto'
                    compactThresholdIn={300}
                    compactThresholdOut={340}
                    value={selected}
                    onChange={setSelected}
                  />
                </div>
              </Stack>
            </Stack>

            <Stack direction='row'>
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
