// src/pages/AppBarDemo.tsx
import { Surface, Stack, Typography, Button, AppBar, Icon, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';

export default function AppBarDemoPage() {
  const { toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <AppBar
        left={
          <>
            <Icon icon='mdi:car' />
            <Typography fontFamily='Cabin'>AppBar Slots</Typography>
          </>
        }
        right={
          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle
          </Button>
        }
      />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          AppBar Showcase
        </Typography>
        <Typography variant='subtitle'>Basic usage and positioning</Typography>
        <Typography variant='body'>Scroll to see content move under the AppBar.</Typography>

        <Stack>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>

          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle light / dark
          </Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
