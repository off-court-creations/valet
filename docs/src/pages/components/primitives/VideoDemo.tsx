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
          {
            src: 'https://z-public-occ.s3.us-east-2.amazonaws.com/video/webm/Big_Buck_Bunny_1080p.webm',
            type: 'video/webm',
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
