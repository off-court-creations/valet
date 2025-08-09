// ─────────────────────────────────────────────────────────────
// src/pages/Overview.tsx  | valet
// Getting started overview page
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button, Panel } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import { useNavigate } from 'react-router-dom';

export default function OverviewPage() {
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2">Overview</Typography>
        <Typography>
          valet fuses an AI‑centric architecture with a lightweight React design
          system. It includes a zero‑dependency CSS‑in‑JS engine, a typed theme
          store, and more than two dozen accessible components.
        </Typography>
        <Panel fullWidth compact>
          <Typography>
            The system is designed for AI augmentation. Semantic metadata
            attached to each component enables agent-drivenUIs without
            sacrificing performance or accessibility.
          </Typography>
        </Panel>
        <Typography variant="h2">Core Concepts</Typography>
        <Typography>
          Theme values are managed via <b>useTheme</b> and initialized with{' '}
          <b>useInitialTheme</b>. Fonts load on demand through{' '}
          <code>useGoogleFonts</code>.
        </Typography>
        <Panel fullWidth compact>
          <Typography>
            An upcoming Semantic Interface Layer and Web Action Graph will allow
            AI proxies to introspect components and drive interactions.
          </Typography>
        </Panel>
        <Typography variant="h2">Best Practices</Typography>
        <Typography>
          valet fuses an AI‑centric architecture with a lightweight React design
          system. It includes a zero‑dependency CSS‑in‑JS engine, a typed theme
          store, and more than two dozen accessible components.
        </Typography>
        <Panel fullWidth compact>
          <Typography>
            The system is designed for AI augmentation. Semantic metadata
            attached to each component enables agent-drivenUIs without
            sacrificing performance or accessibility.
          </Typography>
        </Panel>

        <Button onClick={() => navigate(-1)}>← Back</Button>
      </Stack>
    </Surface>
  );
}
