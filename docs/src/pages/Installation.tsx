// ─────────────────────────────────────────────────────────────
// src/pages/Installation.tsx  | valet
// Getting started installation page
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button, Panel, useSurface } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import DocsDrawer from '../components/DocsDrawer';

export default function InstallationPage() {
  const navigate = useNavigate();
  const { width, height } = useSurface();
  const landscape = width >= height;

  return (
    <Surface>
      <DocsDrawer />
      <Stack spacing={1} preset="showcaseStack" style={{ marginLeft: landscape ? '16rem' : undefined }}>
        <Typography variant="h2" bold>Installation</Typography>
        <Typography>Install via npm:</Typography>
        <Panel>
          <Typography><code>npm install @archway/valet</code></Typography>
        </Panel>
        <Typography>For now, valet works best with React 18</Typography>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}
