// src/pages/SpeedDialDemo.tsx
import {
  Surface,
  Stack,
  Typography,
  Button,
  SpeedDial,
  Icon,
  Tabs,
  useTheme,
} from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import CuratedExamples from '../../../components/CuratedExamples';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import SpeedDialMeta from '../../../../../src/components/widgets/SpeedDial.meta.json';

export default function SpeedDialDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Icon icon='mdi:content-copy' />,
      label: 'Copy',
      onClick: () => alert('Copy'),
    },
    {
      icon: <Icon icon='mdi:share-variant' />,
      label: 'Share',
      onClick: () => alert('Share'),
    },
    {
      icon: <Icon icon='mdi:delete' />,
      label: 'Delete',
      onClick: () => alert('Delete'),
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Speed Dial' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography variant='h3'>Example</Typography>
              <Typography variant='body'>Click the fab to reveal actions.</Typography>
              <SpeedDial
                icon={<Icon icon='mdi:plus' />}
                actions={actions}
              />
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
            <ReferenceSection slug='components/widgets/speeddial' />
          </Tabs.Panel>
        </Tabs>

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        <CuratedExamples examples={getExamples(SpeedDialMeta)} />
        <BestPractices items={getBestPractices(SpeedDialMeta)} />
      </Stack>
    </Surface>
  );
}
