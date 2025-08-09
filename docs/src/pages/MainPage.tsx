// ─────────────────────────────────────────────────────────────
// src/pages/MainPage.tsx  | valet
// Doc home with adaptive drawer navigation
// ─────────────────────────────────────────────────────────────

import { Surface, Stack, Button, Typography, useTheme } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';

export default function MainPage() {
  const { mode, toggleMode } = useTheme();

  function Content() {
    return (
      <Stack>
        <Typography
          variant='h1'
          bold
        >
          valet
        </Typography>
        <Typography variant='subtitle'>
          A lightweight React component kit bridging AI and the web.
        </Typography>
        <Button
          variant='outlined'
          onClick={toggleMode}
        >
          Switch to {mode === 'light' ? 'dark' : 'light'} mode
        </Button>
      </Stack>
    );
  }

  return (
    <Surface>
      <NavDrawer />
      <Content />
    </Surface>
  );
}
