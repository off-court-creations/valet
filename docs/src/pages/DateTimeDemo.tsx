// ─────────────────────────────────────────────────────────────────────────────
// src/pages/DateTimeDemo.tsx | valet
// Showcase for DateTimePicker component
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Panel,
  FormControl,
  TextField,
  DateTimePicker,
  createFormStore,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

interface Booking {
  when: string;
  note: string;
}

const useBookingForm = createFormStore<Booking>({
  when: '',
  note: '',
});

export default function DateTimeDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const [ctl, setCtl] = useState('2025-01-01T12:00');
  const [submitted, setSubmitted] = useState<Booking | null>(null);

  return (
    <Surface>
      <NavDrawer />
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>
          DateTimePicker Showcase
        </Typography>
        <Typography variant="subtitle">
          Uncontrolled, controlled and FormControl examples
        </Typography>

        <Typography variant="h3">1. Uncontrolled</Typography>
        <DateTimePicker />

        <Typography variant="h3">2. Controlled</Typography>
        <Stack spacing={1}>
          <DateTimePicker value={ctl} onChange={setCtl} />
          <Typography>
            Current value: <code>{ctl}</code>
          </Typography>
        </Stack>

        <Typography variant="h3">3. Date only</Typography>
        <DateTimePicker showTime={false} />

        <Typography variant="h3">4. Time only</Typography>
        <DateTimePicker showDate={false} />

        <Typography variant="h3">5. With seconds</Typography>
        <DateTimePicker showSeconds />

        <Typography variant="h3">6. FormControl</Typography>
        <Panel variant="alt" style={{ padding: theme.spacing(1) }}>
          <FormControl
            useStore={useBookingForm}
            onSubmitValues={(vals) => setSubmitted(vals)}
            style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(1) }}
          >
            <DateTimePicker name="when" label="When" />
            <TextField name="note" placeholder="Note" />
            <Button type="submit">Submit</Button>
          </FormControl>
        </Panel>
        {submitted && (
          <Typography>
            Submitted:&nbsp;<code>{JSON.stringify(submitted)}</code>
          </Typography>
        )}

        <Typography variant="h3">7. Theme toggle</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark
        </Button>

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
