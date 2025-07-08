// src/pages/AvatarDemo.tsx
import { Surface, Stack, Typography, Avatar, Button, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';

export default function AvatarDemoPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <Stack spacing={1} preset="showcaseStack">
        <Typography variant="h2" bold>
          Avatar Showcase
        </Typography>
        <Typography variant="subtitle">
          Gravatar wrapper with custom photo support
        </Typography>

        <Typography variant="h3">1. Gravatar</Typography>
        <Avatar email="support@gravatar.com" size={64} />

        <Typography variant="h3">2. Custom src</Typography>
        <Avatar
          src="https://avatars.githubusercontent.com/u/9919?s=200&v=4"
          size={64}
          alt="GitHub"
        />

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
