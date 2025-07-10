// ─────────────────────────────────────────────────────────────
// src/pages/Installation.tsx  | valet
// Getting started installation page
// ─────────────────────────────────────────────────────────────
import { Stack, Typography, Button, Panel } from '@archway/valet';
import DocsLayout from './DocsLayout';
import { useNavigate } from 'react-router-dom';

export default function InstallationPage() {
  const navigate = useNavigate();

  return (
    <DocsLayout>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>Installation</Typography>
        <Typography>Install via npm:</Typography>
        <Panel>
          <Typography><code>npm install @archway/valet</code></Typography>
        </Panel>
        <Typography>For now, valet works best with React 18</Typography>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </DocsLayout>
  );
}
