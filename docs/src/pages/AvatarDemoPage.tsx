// ─────────────────────────────────────────────────────────────
// src/pages/AvatarDemoPage.tsx | valet
// showcase of the Avatar component
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button, Avatar, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';

export default function AvatarDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>
          Avatar Showcase
        </Typography>
        <Typography variant="subtitle">
          Gravatar fallback with custom images
        </Typography>

        <Typography variant="h3">1. Gravatar by email</Typography>
        <Avatar email="user@example.com" size={64} alt="gravatar" />

        <Typography variant="h3">2. Custom image</Typography>
        <Avatar src="https://placekitten.com/96/96" size={96} alt="kitten" />

        <Typography variant="h3">3. Theme coupling</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark mode
        </Button>

        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
