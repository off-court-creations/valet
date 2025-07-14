// src/pages/AppBarDemo.tsx
import { Surface, Stack, Typography, Button, AppBar, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function AppBarDemoPage() {
  const { toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <AppBar>
        <Typography variant="h6">Fixed AppBar</Typography>
      </AppBar>
      <Stack preset="showcaseStack">
        <Typography variant="h2" bold>AppBar Showcase</Typography>
        <Typography variant="subtitle">
          Fixed at the top, content scrolls behind
        </Typography>

        <Stack>
          <Typography variant="h1">placeholder</Typography>
          <Typography variant="h1">placeholder</Typography>
          <Typography variant="h1">placeholder</Typography>
          <Typography variant="h1">placeholder</Typography>
          <Typography variant="h1">placeholder</Typography>
          <Typography variant="h1">placeholder</Typography>
          <Typography variant="h1">placeholder</Typography>
          <Typography variant="h1">placeholder</Typography>
          <Typography variant="h1">placeholder</Typography>

          <Button variant="outlined" onClick={toggleMode}>
            Toggle light / dark
          </Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
