// ─────────────────────────────────────────────────────────────
// src/pages/ImageDemo.tsx | valet
// Showcase of Image component
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Image, Button, useTheme } from '@archway/valet';
import NavDrawer from '../components/NavDrawer';
import { useNavigate } from 'react-router-dom';

export default function ImageDemoPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          Image Showcase
        </Typography>
        <Typography variant="subtitle">
          Responsive sizing, lazy loading and object-fit
        </Typography>

        <Typography variant="h3">1. Basic usage</Typography>
        <Image
          src="https://placecats.com/800/400"
          alt="Kitten"
          width="100%"
          height="auto"
          rounded={8}
        />

        <Typography variant="h3">2. Lazy loaded</Typography>
        <Image
          src="https://placecats.com/600/400"
          alt="Lazy kitten"
          width="100%"
          height="300px"
          lazy
          placeholder="https://placehold.co/10x10"
        />

        <Typography variant="h3">3. Contain fit</Typography>
        <Image
          src="https://placecats.com/400/500"
          alt="Contained kitten"
          width="100%"
          height="300px"
          objectFit="contain"
          style={{ background: '#0003' }}
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
