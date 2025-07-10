// ─────────────────────────────────────────────────────────────
// src/pages/Overview.tsx  | valet
// Getting started overview page
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import { useNavigate } from 'react-router-dom';

export default function OverviewPage() {
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack preset="showcaseStack">
        <Typography variant="h2">Overview</Typography>
        <Typography>
          valet offers an opinionated collection of accessible UI components with
          built-in theming. It bridges next-generation AI proxies with the web.
          Valet helps you ship new features faster.
        </Typography>
        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}
