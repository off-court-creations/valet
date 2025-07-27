// src/pages/MetroSelectDemo.tsx
import { Surface, Stack, Typography, Button, MetroSelect, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function MetroSelectDemoPage() {
  const { toggleMode } = useTheme();
  const navigate = useNavigate();

  const options = [
    { icon: 'mdi:home', label: 'Home', value: 'home' },
    { icon: 'mdi:briefcase', label: 'Work', value: 'work' },
    { icon: 'mdi:airplane', label: 'Travel', value: 'travel' },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>MetroSelect Showcase</Typography>
        <Typography variant="subtitle">Grid style single choice</Typography>

        <MetroSelect gap={4}>
          {options.map((o) => (
            <MetroSelect.Option key={o.value} icon={o.icon} value={o.value} label={o.label} />
          ))}
        </MetroSelect>

        <Stack direction="row">
          <Button variant="outlined" onClick={toggleMode}>Toggle light / dark</Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
