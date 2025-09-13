// ─────────────────────────────────────────────────────────────
// src/pages/DropzoneDemo.tsx | valet-docs
// Showcase of Dropzone widget
// ─────────────────────────────────────────────────────────────
import { Surface, Stack, Typography, Button, Dropzone, Tabs, useTheme } from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import DropzoneMeta from '../../../../../src/components/widgets/Dropzone.meta.json';

export default function DropzoneDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Dropzone' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography variant='h3'>1. Default</Typography>
              <Dropzone />

              <Typography variant='h3'>2. Image only</Typography>
              <Dropzone accept={{ 'image/*': [] }} />

              <Typography variant='h3'>3. Limit to two files</Typography>
              <Dropzone maxFiles={2} />

              <Typography variant='h3'>4. File list</Typography>
              <Dropzone
                showPreviews={false}
                showFileList
              />

              <Typography variant='h3'>5. No previews</Typography>
              <Dropzone showPreviews={false} />

              <Typography variant='h3'>6. Full width</Typography>
              <Dropzone fullWidth />

              <Typography variant='h3'>7. Theme toggle</Typography>
              <Button
                variant='outlined'
                onClick={toggleMode}
              >
                Toggle light / dark
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/widgets/dropzone' />
          </Tabs.Panel>
        </Tabs>

        <Button
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(2) }}
        >
          ← Back
        </Button>

        <CuratedExamples examples={getExamples(DropzoneMeta)} />
        <BestPractices items={getBestPractices(DropzoneMeta)} />
      </Stack>
    </Surface>
  );
}
