// ─────────────────────────────────────────────────────────────
// src/pages/Overview.tsx  | valet
// Getting started overview page
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';

export default function OverviewPage() {
  const navigate = useNavigate();
  const { mode, toggleMode } = useTheme();

  return (
    <Surface>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>Overview</Typography>
        <Typography>
          valet offers a focused collection of accessible UI components with
          built-in theming. It bridges next-generation AI proxies with the web.
        </Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Switch to {mode === 'light' ? 'dark' : 'light'} mode
        </Button>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}
