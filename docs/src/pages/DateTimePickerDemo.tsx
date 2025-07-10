// ─────────────────────────────────────────────────────────────────────────────
// src/pages/DateTimePickerDemo.tsx | valet
// Demo page for <DateTimePicker>
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

interface ScheduleForm {
  day: string;
  start: string;
  end: string;
}

const useScheduleForm = createFormStore<ScheduleForm>({
  day: '',
  start: '',
  end: '',
});

export default function DateTimePickerDemo() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const [time, setTime] = useState('');

  return (
    <Surface>
      <NavDrawer />
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>
          Date &amp; Time Picker
        </Typography>
        <Typography variant="subtitle">
          Uncontrolled, controlled, and inside a form
        </Typography>

        {/* Uncontrolled example */}
        <Typography variant="h3">1. Uncontrolled</Typography>
        <DateTimePicker name="unctl" mode="datetime" />

        {/* Controlled example */}
        <Typography variant="h3">2. Controlled</Typography>
        <Stack direction="row" spacing={1} style={{ alignItems: 'center' }}>
          <DateTimePicker
            name="ctl"
            mode="time"
            value={time}
            onChange={setTime}
          />
          <Typography>{time || '—'}</Typography>
        </Stack>

        {/* Embedded within another component */}
        <Typography variant="h3">3. FormControl inside Panel</Typography>
        <Panel variant="alt" style={{ padding: theme.spacing(1) }}>
          <FormControl
            useStore={useScheduleForm}
            onSubmitValues={(vals) => alert(JSON.stringify(vals, null, 2))}
          >
            <Stack spacing={1}>
              <DateTimePicker name="day" label="Day" mode="date" />
              <DateTimePicker name="start" label="Start" mode="time" />
              <DateTimePicker name="end" label="End" mode="time" />
              <Button type="submit">Schedule</Button>
            </Stack>
          </FormControl>
        </Panel>

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
