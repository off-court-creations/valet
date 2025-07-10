// src/pages/SpeedDialDemo.tsx
import { Surface, Stack, Typography, Button, SpeedDial, Icon, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function SpeedDialDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const actions = [
    { icon: <Icon icon="mdi:content-copy" />, label: 'Copy', onClick: () => alert('Copy') },
    { icon: <Icon icon="mdi:share-variant" />, label: 'Share', onClick: () => alert('Share') },
    { icon: <Icon icon="mdi:delete" />, label: 'Delete', onClick: () => alert('Delete') },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack
        spacing={1}
        preset="showcaseStack"
      >
        <Typography variant="h2" bold>SpeedDial Showcase</Typography>
        <Typography variant="subtitle">Floating action button</Typography>

        <Typography variant="h3">Example</Typography>
        <Typography variant="body">Click the fab to reveal actions.</Typography>
        <SpeedDial icon={<Icon icon="mdi:plus" />} actions={actions} />

        <Stack direction="row" spacing={1}>
          <Button variant="outlined" onClick={toggleMode}>Toggle light / dark</Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
