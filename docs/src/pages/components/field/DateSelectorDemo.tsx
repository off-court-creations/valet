// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/field/DateSelectorDemo.tsx  | valet-docs
// Ported to meta-driven docs template (Usage/Reference via MCP)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Stack, Typography, Button, DateSelector, useTheme, Grid } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import DateSelectorMeta from '../../../../../src/components/fields/DateSelector.meta.json';

export default function DateSelectorDemoPage() {
  const { toggleMode } = useTheme();
  const [selected, setSelected] = useState('2025-01-01');
  const [limited, setLimited] = useState('2025-07-15');
  const [rangeDates, setRangeDates] = useState<[string, string]>(['2025-07-01', '2025-07-10']);

  const usageContent = (
    <Stack>
      <Typography variant='subtitle'>Compact calendar with month and year navigation</Typography>

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
      <Stack
        direction='row'
        gap={1}
      >
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
      </Stack>

      <Stack direction='row'>
        <Button
          variant='outlined'
          onClick={toggleMode}
        >
          Toggle light / dark
        </Button>
      </Stack>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Date Selector'
      subtitle='Compact, accessible date (and range) picker'
      slug='components/fields/dateselector'
      meta={DateSelectorMeta}
      usage={usageContent}
    />
  );
}
