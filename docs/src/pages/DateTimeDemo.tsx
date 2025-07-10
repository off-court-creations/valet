// ─────────────────────────────────────────────────────────────
// src/pages/DateTimeDemo.tsx | valet
// Demonstrates DateTimePicker component
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Panel,
  Chat,
  FormControl,
  createFormStore,
  DateTimePicker,
  type ChatMessage,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function DateTimeDemoPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [controlled, setControlled] = useState('');

  type FormVals = { when: string };
  const useForm = createFormStore<FormVals>({ when: '' });
  const [submitted, setSubmitted] = useState<FormVals | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const handleSend = (m: ChatMessage) => {
    setMessages((prev) => [...prev, m]);
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>DateTimePicker</Typography>
        <Typography variant="subtitle">
          Date, time or both – integrates with FormControl
        </Typography>

        <Typography variant="h3">1. Uncontrolled (date &amp; time)</Typography>
        <DateTimePicker />

        <Typography variant="h3">2. Date only</Typography>
        <DateTimePicker showTime={false} />

        <Typography variant="h3">3. Time only</Typography>
        <DateTimePicker showDate={false} />

        <Typography variant="h3">4. Controlled value</Typography>
        <Stack direction="row" spacing={1}>
          <DateTimePicker value={controlled} onChange={setControlled} />
          <Typography>{controlled || '–'}</Typography>
        </Stack>

        <Typography variant="h3">5. FormControl</Typography>
        <Panel variant="alt" style={{ padding: theme.spacing(1) }}>
          <FormControl
            useStore={useForm}
            onSubmitValues={(vals) => setSubmitted(vals)}
            style={{ display: 'flex', gap: theme.spacing(1) }}
          >
            <DateTimePicker name="when" />
            <Button type="submit">Submit</Button>
          </FormControl>
          {submitted && (
            <pre style={{ marginTop: theme.spacing(1) }}>
              {JSON.stringify(submitted, null, 2)}
            </pre>
          )}
        </Panel>

        <Typography variant="h3">6. Embedded in Chat</Typography>
        <Panel variant="alt" style={{ padding: theme.spacing(1) }}>
          <Chat messages={messages} onSend={handleSend} />
          <DateTimePicker />
        </Panel>

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
