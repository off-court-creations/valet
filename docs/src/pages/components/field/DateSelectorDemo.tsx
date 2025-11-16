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
  const [selCommit, setSelCommit] = useState('2025-01-01');
  const [limited, setLimited] = useState('2025-07-15');
  const [rangeDates, setRangeDates] = useState<[string, string]>(['2025-07-01', '2025-07-10']);

  const usageContent = (
    <Stack>
      <Typography variant='subtitle'>Compact calendar with month and year navigation</Typography>

      <Typography variant='h3'>1. Basic</Typography>
      <DateSelector
        value={selected}
        onValueChange={(v) => setSelected(v as string)}
        onValueCommit={(v) => setSelCommit(v as string)}
      />
      <Typography>live: {selected}</Typography>
      <Typography>commit: {selCommit}</Typography>

      <Typography variant='h3'>2. Custom width</Typography>
      <Grid
        columns={3}
        adaptive
      >
        <DateSelector
          value={selected}
          onValueChange={(v) => setSelected(v as string)}
          onValueCommit={(v) => setSelCommit(v as string)}
        />
      </Grid>

      <Typography variant='h3'>3. Limited range</Typography>
      <DateSelector
        value={limited}
        onValueChange={(v) => setLimited(v as string)}
        onValueCommit={(v) => setLimited(v as string)}
        minDate='2025-06-01'
        maxDate='2025-09-15'
      />

      <Typography variant='h3'>4. Range mode</Typography>
      <DateSelector
        range
        value={rangeDates as [string, string]}
        onValueChange={(v) => setRangeDates(v as [string, string])}
        onValueCommit={(v) => setRangeDates(v as [string, string])}
      />

      <Typography variant='h3'>5. Density</Typography>
      <Stack
        direction='row'
        gap={1}
      >
        <Stack>
          <Typography variant='subtitle'>Compact</Typography>
          <DateSelector
            density='compact'
            value={selected}
            onValueChange={(v) => setSelected(v as string)}
          />
        </Stack>
        <Stack>
          <Typography variant='subtitle'>Standard</Typography>
          <DateSelector
            density='standard'
            value={selected}
            onValueChange={(v) => setSelected(v as string)}
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
