// ─────────────────────────────────────────────────────────────
// src/pages/ImageDemo.tsx | valet-docs
// Showcase of Image component
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Image, Button, useTheme, Panel } from '@archway/valet';
import NavDrawer from '../../../components/NavDrawer';
import { useNavigate } from 'react-router-dom';

export default function ImageDemoPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography
          variant='h2'
          bold
        >
          Image Showcase
        </Typography>
        <Typography variant='subtitle'>Responsive sizing, lazy loading and object-fit</Typography>

        <Typography variant='h3'>1. Basic usage</Typography>
        <Image
          src='https://picsum.photos/400/300'
          alt='Kitten'
          width='100%'
          height='auto'
          rounded={8}
        />

        <Typography variant='h3'>2. Lazy loaded</Typography>
        <Image
          src='https://picsum.photos/400/300'
          alt='Lazy kitten'
          width='100%'
          height='300px'
          lazy
          placeholder='https://placehold.co/10x10'
        />

        <Typography variant='h3'>3. Contain fit</Typography>
        <Image
          src='https://picsum.photos/400/300'
          alt='Contained kitten'
          width='100%'
          height='300px'
          objectFit='contain'
          sx={{ background: '#0003' }}
        />

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        {/* Best Practices -------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Write meaningful <code>alt</code> text. Describe the content/purpose; use
            <code> alt=&quot;&quot;</code> for purely decorative images to avoid noise for screen
            readers.
          </Typography>
          <Typography>
            - Reserve layout space. Provide <code>width</code> and <code>height</code> (or a styled
            container) to prevent cumulative layout shift when images load.
          </Typography>
          <Typography>
            - Lazy‑load offscreen media. Enable <code>lazy</code> with a tiny{' '}
            <code>placeholder</code>
            for non‑critical images; avoid lazy‑loading above‑the‑fold hero images.
          </Typography>
          <Typography>
            - Choose the right <code>objectFit</code>. Use <code>cover</code> for fills and
            <code> contain</code> for letterboxed media; provide a background colour for pleasant
            letterboxing.
          </Typography>
          <Typography>
            - Prevent drag ghosts. The component disables dragging by default; only enable dragging
            when there is a genuine use‑case.
          </Typography>
          <Typography>
            - Optimize assets. Serve appropriately sized and compressed images; avoid shipping
            multi‑MB originals for small containers.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}
