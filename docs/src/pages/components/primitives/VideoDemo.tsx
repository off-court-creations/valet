// ─────────────────────────────────────────────────────────────
// src/pages/VideoDemoPage.tsx | valet-playground
// Simple showcase of the <Video /> component
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Video, useTheme, Tabs } from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import VideoMeta from '../../../../../src/components/primitives/Video.meta.json';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';

/*─────────────────────────────────────────────────────────────*/
/* Demo page                                                   */
export default function VideoDemoPage() {
  const { theme } = useTheme(); // for consistent spacing etc.

  return (
    <Surface>
      <NavDrawer />
      <Stack sx={{ padding: theme.spacing(1), maxWidth: 1024, margin: '0 auto' }}>
        <PageHero title='Video' />
        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
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
          </Tabs.Panel>
          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/primitives/video' />
          </Tabs.Panel>
        </Tabs>
      </Stack>
      {/* Best Practices ---------------------------------------------------- */}
      <Stack sx={{ padding: theme.spacing(1), maxWidth: 1024, margin: '0 auto' }}>
        <CuratedExamples examples={getExamples(VideoMeta)} />
        <BestPractices items={getBestPractices(VideoMeta)} />
      </Stack>
    </Surface>
  );
}
