// ─────────────────────────────────────────────────────────────
// src/pages/VideoDemoPage.tsx | valet-playground
// Simple showcase of the <Video /> component
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Video, useTheme } from '@archway/valet';
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
    </Surface>
  );
}
