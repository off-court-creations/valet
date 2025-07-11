// ─────────────────────────────────────────────────────────────
// src/pages/MainPage.tsx  | valet
// Doc home with responsive drawer navigation
// ─────────────────────────────────────────────────────────────

import {
  Surface,
  Stack,
  Button,
  Typography,
  useTheme,
} from '@archway/valet';
import NavDrawer from '../components/NavDrawer';

export default function MainPage() {
  const { theme, mode, toggleMode } = useTheme();

  function Content() {
    return (
      <Stack
        spacing={1}
        style={{
          padding: theme.spacing(1),
          maxWidth: 980,
        }}
      >
        <Typography variant="h1" bold>
          valet
        </Typography>
        <Typography variant="subtitle">
          A lightweight React component kit bridging AI and the web.
        </Typography>
        <Button variant="outlined" onClick={toggleMode}>
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
