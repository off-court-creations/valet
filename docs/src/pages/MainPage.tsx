// ─────────────────────────────────────────────────────────────
// src/pages/MainPage.tsx  | valet
// Doc home with responsive drawer navigation
// ─────────────────────────────────────────────────────────────
import { Stack, Button, Typography, useTheme } from '@archway/valet';
import DocsLayout from './DocsLayout';

export default function MainPage() {
  const { theme, mode, toggleMode } = useTheme();

  return (
    <DocsLayout>
      <Stack spacing={1} style={{ padding: theme.spacing(1) }}>
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
    </DocsLayout>
  );
}
