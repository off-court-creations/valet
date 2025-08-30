// ─────────────────────────────────────────────────────────────
// src/pages/VideoDemoPage.tsx | valet-playground
// Simple showcase of the <Video /> component
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Video, useTheme, Panel } from '@archway/valet';
import NavDrawer from '../../../components/NavDrawer';

/*─────────────────────────────────────────────────────────────*/
/* Demo page                                                   */
export default function VideoDemoPage() {
  const { theme } = useTheme(); // for consistent spacing etc.

  return (
    <Surface>
      <NavDrawer />
      <Stack
        sx={{
          padding: theme.spacing(1),
          maxWidth: 1024,
          margin: '0 auto',
        }}
      >
        {/* Header --------------------------------------------------- */}
        <Typography
          variant='h2'
          bold
        >
          Video Demo
        </Typography>
        <Typography variant='subtitle'>
          Basic usage of the&nbsp;
          <code>&lt;Video /&gt;</code>&nbsp;component
        </Typography>

        {/* Video ---------------------------------------------------- */}
        <Video
          sources={[
            {
              src: 'https://z-public-occ.s3.us-east-2.amazonaws.com/video/webm/Big_Buck_Bunny_1080p.webm',
              type: 'video/webm',
            },
          ]}
          controls
          autoPlay // starts muted (default) for autoplay compliance
          muted
          loop
          width='100%'
          height='auto'
          objectFit='contain'
        />
      </Stack>
      {/* Best Practices ---------------------------------------------------- */}
      <Stack sx={{ padding: theme.spacing(1), maxWidth: 1024, margin: '0 auto' }}>
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Provide multiple sources. Include <code>webm</code> and <code>mp4</code> encodings
            when possible to maximize browser support.
          </Typography>
          <Typography>
            - Use a <code>poster</code> and reserve space. Set a poster image and explicit
            <code> width</code>/<code> height</code> (or container) to avoid layout shift.
          </Typography>
          <Typography>
            - Captions matter. Supply <code>tracks</code> for subtitles/captions and allow users to
            toggle them; the component supports keyboard toggling (C) for the first track.
          </Typography>
          <Typography>
            - Autoplay etiquette. Browsers require <code>muted</code> for autoplay; keep controls on
            for accessibility and allow users to pause.
          </Typography>
          <Typography>
            - Object fit by context. Use <code>contain</code> to show entire frame (letterbox) or
            <code> cover</code> for edge-to-edge hero media.
          </Typography>
          <Typography>
            - Performance. Use CDN delivery and sensible <code>preload</code> policy; avoid heavy
            background loops that compete with page interactivity.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}
