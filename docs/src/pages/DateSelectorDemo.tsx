// src/pages/DateSelectorDemo.tsx
import { useState } from 'react';
import { Surface, Stack, Typography, Button, DateSelector, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function DateSelectorDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [date, setDate] = useState('');

  return (
    <Surface>
      <NavDrawer />
      <Stack preset="showcaseStack">
        <Typography variant="h2" bold>DateSelector Showcase</Typography>
        <Typography variant="subtitle">Compact calendar picker</Typography>

        <DateSelector value={date} onChange={setDate} />
        <Typography variant="body">Selected: {date || 'none'}</Typography>

        <Stack direction="row">
          <Button variant="outlined" onClick={toggleMode}>Toggle light / dark</Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
