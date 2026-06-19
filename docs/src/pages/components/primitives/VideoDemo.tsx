// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/VideoDemo.tsx  | valet-docs
// Meta-driven docs page (Usage + automatic Best Practices/Examples/Reference)
// ─────────────────────────────────────────────────────────────
import { Stack, Typography, Video } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import VideoMeta from '../../../../../src/components/primitives/Video.meta.json';

// Public, lightweight (~1 MB / 10 s) Big Buck Bunny (CC-BY, Blender). The browser
// picks the first source it supports; mp4 covers webm-less fallbacks.
const BBB = [
  {
    src: 'https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/360/Big_Buck_Bunny_360_10s_1MB.webm',
    type: 'video/webm' as const,
  },
  {
    src: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
    type: 'video/mp4' as const,
  },
];
const POSTER = 'https://picsum.photos/id/1039/1024/576';

/*─────────────────────────────────────────────────────────────*/
/* Demo page                                                   */
export default function VideoDemoPage() {
  const usageContent = (
    <Stack sx={{ maxWidth: 880, margin: '0 auto' }}>
      <Typography variant='subtitle'>
        A theme-aware <code>&lt;video&gt;</code> with multiple <code>sources</code>, poster, caption
        tracks, lazy loading, and object-fit. Keyboard: <strong>Space/Enter</strong> toggles play,{' '}
        <strong>c</strong> toggles captions.
      </Typography>

      <Typography variant='h3'>1. Poster + controls</Typography>
      <Typography variant='subtitle'>
        The <code>poster</code> shows before playback. Native <code>controls</code>; autoplay off so
        the poster stays visible until the viewer presses play.
      </Typography>
      <Video
        sources={BBB}
        poster={POSTER}
        controls
        autoPlay={false}
        width='100%'
      />

      <Typography variant='h3'>2. Autoplay background loop</Typography>
      <Typography variant='subtitle'>
        <code>autoPlay</code> + <code>muted</code> + <code>loop</code> with no controls — a
        decorative background clip. Muted is required for autoplay to be allowed.
      </Typography>
      <Video
        sources={BBB}
        autoPlay
        muted
        loop
        controls={false}
        width='100%'
      />

      <Typography variant='h3'>3. Captions (tracks)</Typography>
      <Typography variant='subtitle'>
        A WebVTT captions <code>track</code> (same-origin). Toggle with the CC control or the{' '}
        <strong>c</strong> key.
      </Typography>
      <Video
        sources={BBB}
        controls
        autoPlay={false}
        tracks={[
          {
            src: '/sample-captions.vtt',
            kind: 'captions',
            srclang: 'en',
            label: 'English',
            default: true,
          },
        ]}
        width='100%'
      />

      <Typography variant='h3'>4. object-fit: cover vs contain</Typography>
      <Typography variant='subtitle'>
        In a fixed box, <code>cover</code> fills and crops; <code>contain</code> letterboxes the
        whole frame.
      </Typography>
      <Stack
        direction='row'
        gap={1}
        wrap
      >
        <Stack
          gap={0.5}
          sx={{ alignItems: 'center' }}
        >
          <Video
            sources={BBB}
            controls
            autoPlay={false}
            width={360}
            height={240}
            objectFit='cover'
          />
          <Typography variant='body'>cover</Typography>
        </Stack>
        <Stack
          gap={0.5}
          sx={{ alignItems: 'center' }}
        >
          <Video
            sources={BBB}
            controls
            autoPlay={false}
            width={360}
            height={240}
            objectFit='contain'
          />
          <Typography variant='body'>contain</Typography>
        </Stack>
      </Stack>

      <Typography variant='h3'>5. Lazy loading</Typography>
      <Typography variant='subtitle'>
        With <code>lazy</code>, the sources attach only once the player scrolls into view
        (IntersectionObserver) — keep it below the fold to see it defer.
      </Typography>
      <Video
        sources={BBB}
        controls
        autoPlay={false}
        lazy
        width='100%'
      />
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Video'
      subtitle='Theme-aware video player with multiple sources, poster, caption tracks, lazy loading, and keyboard controls.'
      slug='components/primitives/video'
      meta={VideoMeta}
      usage={usageContent}
    />
  );
}
