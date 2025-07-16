// src/pages/DateSelectorDemo.tsx
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  DateSelector,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function DateSelectorDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [ctl, setCtl] = useState('2025-01-01');

  return (
    <Surface>
      <NavDrawer />
      <Stack preset="showcaseStack">
        <Typography variant="h2" bold>
          DateSelector Showcase
        </Typography>
        <Typography variant="subtitle">
          Compact calendar with month navigation
        </Typography>

        <Typography variant="h3">1. Uncontrolled</Typography>
        <DateSelector />

        <Typography variant="h3">2. Controlled</Typography>
        <Stack>
          <DateSelector value={ctl} onChange={setCtl} />
          <Typography>
            Current value: <code>{ctl}</code>
          </Typography>
        </Stack>

        <Typography variant="h3">3. Theme toggle</Typography>
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
