// ─────────────────────────────────────────────────────────────
// src/pages/Installation.tsx  | valet
// Getting started installation page
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button } from '@archway/valet';
import { useNavigate } from 'react-router-dom';

export default function InstallationPage() {
  const navigate = useNavigate();

  return (
    <Surface>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>Installation</Typography>
        <Typography>Install via npm:</Typography>
        <Typography><code>npm install @archway/valet</code></Typography>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}
