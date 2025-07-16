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
  const [selected, setSelected] = useState('2025-01-01');

  return (
    <Surface>
      <NavDrawer />
      <Stack preset="showcaseStack">
        <Typography variant="h2" bold>
          DateSelector Showcase
        </Typography>
        <Typography variant="subtitle">
          Compact calendar with month and year navigation
        </Typography>

        <DateSelector value={selected} onChange={setSelected} />
        <Typography variant="body">Current: {selected}</Typography>

        <Stack direction="row">
          <Button variant="outlined" onClick={toggleMode}>
            Toggle light / dark
          </Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
