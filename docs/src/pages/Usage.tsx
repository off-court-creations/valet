// ─────────────────────────────────────────────────────────────
// src/pages/Usage.tsx  | valet
// Getting started usage page
// ─────────────────────────────────────────────────────────────
import { Stack, Typography, Button } from '@archway/valet';
import DocsLayout from './DocsLayout';
import { useNavigate } from 'react-router-dom';

export default function UsagePage() {
  const navigate = useNavigate();

  return (
    <DocsLayout>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>Usage</Typography>
        <Typography>
          Import components as needed and wrap each route in a <code>{'<Surface>'}</code>.
        </Typography>
        <Typography>
          Example: <code>{'<Button>Click me</Button>'}</code>
        </Typography>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </DocsLayout>
  );
}
