// ─────────────────────────────────────────────────────────────────────────────
// src/pages/DateTimePickerDemo.tsx | valet
// Demonstrates DateTimePicker usage and embedding
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Panel,
  DateTimePicker,
  FormControl,
  createFormStore,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Local form store                                                            */
interface BookingValues {
  date: string;
  time: string;
}

const useBookingForm = createFormStore<BookingValues>({
  date: '',
  time: '',
});

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                   */
export default function DateTimePickerDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const [controlledDate, setControlledDate] = useState('');

  return (
    <Surface>
      <NavDrawer />
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>
          Date &amp; Time Picker
        </Typography>
        <Typography variant="subtitle">
          Collect dates, times, or both in a single component
        </Typography>

        {/* 1. Stand-alone examples --------------------------------------- */}
        <Typography variant="h3">1. Stand-alone</Typography>
        <Stack spacing={1} style={{ maxWidth: 320 }}>
          <DateTimePicker
            label="Controlled date"
            mode="date"
            value={controlledDate}
            onChange={setControlledDate}
          />
          <DateTimePicker label="Time only" mode="time" />
          <DateTimePicker label="Date + Time" mode="datetime" />
        </Stack>

        {/* 2. FormControl integration ------------------------------------ */}
        <Typography variant="h3">2. FormControl demo</Typography>
        <Panel variant="alt" style={{ padding: theme.spacing(1) }}>
          <FormControl
            useStore={useBookingForm}
            onSubmitValues={(vals) =>
              // eslint-disable-next-line no-alert -- demo only
              alert(JSON.stringify(vals, null, 2))
            }
            style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(1) }}
          >
            <DateTimePicker name="date" label="Date" mode="date" />
            <DateTimePicker name="time" label="Time" mode="time" />
            <Button type="submit" variant="contained">
              Submit
            </Button>
          </FormControl>
        </Panel>

        {/* Theme toggle + back nav --------------------------------------- */}
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={toggleMode}>
            Toggle light / dark
          </Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
