// src/pages/AppBarDemo.tsx
import { Surface, Stack, Typography, Button, AppBar, Box, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';

export default function AppBarDemoPage() {
  const { toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <Stack
        spacing="lg"
        preset="showcaseStack"
      >
        <Typography variant="h2" bold>
          AppBar Showcase
        </Typography>
        <Typography variant="subtitle">
          Basic usage and positioning
        </Typography>

        <AppBar>
          <Typography variant="h6">Fixed</Typography>
        </AppBar>

        <Stack spacing="lg">
          <Typography variant="h1">
            placeholder
          </Typography>
          <Typography variant="h1">
            placeholder
          </Typography>
          <Typography variant="h1">
            placeholder
          </Typography>
          <Typography variant="h1">
            placeholder
          </Typography>
          <Typography variant="h1">
            placeholder
          </Typography>
          <Typography variant="h1">
            placeholder
          </Typography>
          <Typography variant="h1">
            placeholder
          </Typography>
          <Typography variant="h1">
            placeholder
          </Typography>
          <Typography variant="h1">
            placeholder
          </Typography>

          <Button variant="outlined" onClick={toggleMode}>
            Toggle light / dark
          </Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
