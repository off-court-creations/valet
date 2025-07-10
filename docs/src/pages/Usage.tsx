// ─────────────────────────────────────────────────────────────
// src/pages/Usage.tsx  | valet
// Getting started usage page
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button, useSurface } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import DocsDrawer from '../components/DocsDrawer';

export default function UsagePage() {
  const navigate = useNavigate();
  const { width, height } = useSurface();
  const landscape = width >= height;

  return (
    <Surface>
      <DocsDrawer />
      <Stack spacing={1} preset="showcaseStack" style={{ marginLeft: landscape ? '16rem' : undefined }}>
        <Typography variant="h2" bold>Usage</Typography>
        <Typography>
          Import components as needed and wrap each route in a <code>{'<Surface>'}</code>.
        </Typography>
        <Typography>
          Example: <code>{'<Button>Click me</Button>'}</code>
        </Typography>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}
