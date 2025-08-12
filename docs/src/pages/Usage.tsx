// ─────────────────────────────────────────────────────────────
// src/pages/Usage.tsx  | valet-docs
// Getting started usage page
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import { useNavigate } from 'react-router-dom';

export default function UsagePage() {
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Usage
        </Typography>
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
