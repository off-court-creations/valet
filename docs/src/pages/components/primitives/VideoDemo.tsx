// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/VideoDemo.tsx  | valet-docs
// Meta-driven docs page (Usage + automatic Best Practices/Examples/Reference)
// ─────────────────────────────────────────────────────────────
import { Stack, Video, useTheme } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import VideoMeta from '../../../../../src/components/primitives/Video.meta.json';

/*─────────────────────────────────────────────────────────────*/
/* Demo page                                                   */
export default function VideoDemoPage() {
  const { theme } = useTheme();

  const usageContent = (
    <Stack sx={{ padding: theme.spacing(1), maxWidth: 1024, margin: '0 auto' }}>
      <Video
        sources={[
          // Public, lightweight (≈1 MB / 10 s) Big Buck Bunny (CC-BY, Blender) —
          // browser picks the first it supports; mp4 covers webm-less fallbacks.
          {
            src: 'https://test-videos.co.uk/vids/bigbuckbunny/webm/vp9/360/Big_Buck_Bunny_360_10s_1MB.webm',
            type: 'video/webm',
          },
          {
            src: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
            type: 'video/mp4',
          },
        ]}
        controls
        autoPlay
        muted
        loop
        width='100%'
        height='auto'
        objectFit='contain'
      />
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Video'
      subtitle='Flexible video player with tracks and poster support'
      slug='components/primitives/video'
      meta={VideoMeta}
      usage={usageContent}
    />
  );
}
