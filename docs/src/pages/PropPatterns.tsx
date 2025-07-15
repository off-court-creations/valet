// ─────────────────────────────────────────────────────────────
// src/pages/PropPatterns.tsx  | valet
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
      <Stack preset="showcaseStack">
        <Typography variant="h2" bold>Property Patterns</Typography>
        <Typography>
          This is where a table of common property patterns go..
        </Typography>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}
