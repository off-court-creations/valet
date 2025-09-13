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
} from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';

export default function DateSelectorDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [selected, setSelected] = useState('2025-01-01');
  const [limited, setLimited] = useState('2025-07-15');
  const [rangeDates, setRangeDates] = useState<[string, string]>(['2025-07-01', '2025-07-10']);

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Date Selector' />
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
            <ReferenceSection slug='components/fields/dateselector' />
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
