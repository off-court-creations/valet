// src/pages/AppBarDemo.tsx
import { Surface, Stack, Typography, Button, AppBar, Icon, useTheme, Tabs } from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import BestPractices from '../../../components/BestPractices';
import { getBestPractices } from '../../../utils/sidecar';
import AppBarMeta from '../../../../../src/components/layout/AppBar.meta.json';
import PageHero from '../../../components/PageHero';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';

export default function AppBarDemoPage() {
  const { toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <NavDrawer />
      <AppBar
        left={
          <>
            <Icon icon='mdi:car' />
            <Typography fontFamily='Cabin'>AppBar Slots</Typography>
          </>
        }
        right={
          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle
          </Button>
        }
      />
      <Stack>
        <PageHero title='AppBar' />

        <Stack>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>
          <Typography variant='h1'>placeholder</Typography>

          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle light / dark
          </Button>

          {/* Reference --------------------------------------------------- */}
          <Tabs>
            <Tabs.Tab label='Reference' />
            <Tabs.Panel>
              <ReferenceSection slug='components/layout/appbar' />
            </Tabs.Panel>
          </Tabs>

          {/* Best Practices ---------------------------------------------- */}
          <BestPractices items={getBestPractices(AppBarMeta)} />
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
