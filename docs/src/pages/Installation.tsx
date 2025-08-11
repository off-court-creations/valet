// ─────────────────────────────────────────────────────────────
// src/pages/Installation.tsx  | valet
// Getting started installation page
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button, Panel } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import { useNavigate } from 'react-router-dom';

export default function InstallationPage() {
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Installation
        </Typography>
        <Typography>Install via npm:</Typography>
        <Panel>
          <Typography>
            <code>npm install @archway/valet</code>
          </Typography>
        </Panel>
        <Typography>valet works best with React 19.x</Typography>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}
