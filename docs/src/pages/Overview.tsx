// ─────────────────────────────────────────────────────────────
// src/pages/Overview.tsx  | valet
// Getting started overview page
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button, useSurface } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import DocsDrawer from '../components/DocsDrawer';

export default function OverviewPage() {
  const navigate = useNavigate();
  const { width, height } = useSurface();
  const landscape = width >= height;

  return (
    <Surface>
      <DocsDrawer />
      <Stack
        preset="showcaseStack"
        style={{ marginLeft: landscape ? '16rem' : undefined }}
      >
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
