// ─────────────────────────────────────────────────────────────
// src/pages/ImageDemo.tsx | valet-docs
// Showcase of Image component
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Image, Button, useTheme, Tabs } from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import ImageMeta from '../../../../../src/components/primitives/Image.meta.json';
import { useNavigate } from 'react-router-dom';

export default function ImageDemoPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Image' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
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
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/primitives/image' />
          </Tabs.Panel>
        </Tabs>

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        <CuratedExamples examples={getExamples(ImageMeta)} />
        <BestPractices items={getBestPractices(ImageMeta)} />
      </Stack>
    </Surface>
  );
}
