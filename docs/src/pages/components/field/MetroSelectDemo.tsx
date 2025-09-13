// ─────────────────────────────────────────────────────────────
// src/pages/MetroSelectDemo.tsx | valet-docs
// Showcase of MetroSelect component
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Surface, Stack, Typography, Button, MetroSelect, Tabs, useTheme } from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';

export default function MetroSelectDemoPage() {
  const { toggleMode } = useTheme();
  const navigate = useNavigate();

  // Sample option lists -------------------------------------------------
  const basic = [
    { icon: 'mdi:home', label: 'Home', value: 'home' },
    { icon: 'mdi:briefcase', label: 'Work', value: 'work', disabled: true },
    { icon: 'mdi:airplane', label: 'Travel', value: 'travel' },
  ];

  const [transport, setTransport] = useState('car');
  const controlled = [
    { icon: 'mdi:car', label: 'Car', value: 'car' },
    { icon: 'mdi:bike', label: 'Bike', value: 'bike' },
    { icon: 'mdi:train', label: 'Train', value: 'train' },
  ];

  const many = [
    { icon: 'mdi:home', value: 'home', label: 'Home' },
    { icon: 'mdi:briefcase', value: 'work', label: 'Work' },
    { icon: 'mdi:airplane', value: 'travel', label: 'Travel' },
    { icon: 'mdi:school', value: 'school', label: 'School' },
    { icon: 'mdi:cog', value: 'settings', label: 'Settings' },
    { icon: 'mdi:information', value: 'info', label: 'Info' },
    { icon: 'mdi:music', value: 'music', label: 'Music' },
    { icon: 'mdi:film', value: 'film', label: 'Film' },
    { icon: 'mdi:email', value: 'email', label: 'Email' },
    { icon: 'mdi:message', value: 'chat', label: 'Chat' },
    { icon: 'mdi:camera', value: 'camera', label: 'Camera' },
    { icon: 'mdi:gamepad-variant', value: 'games', label: 'Games' },
    { icon: 'mdi:phone', value: 'phone', label: 'Phone' },
    { icon: 'mdi:wifi', value: 'wifi', label: 'WiFi' },
    { icon: 'mdi:bluetooth', value: 'bt', label: 'Bluetooth' },
    { icon: 'mdi:power', value: 'power', label: 'Power' },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Metro Select' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='h3'>1. Uncontrolled</Typography>
            <MetroSelect
              defaultValue='home'
              gap={4}
            >
              {basic.map((o) => (
                <MetroSelect.Option
                  key={o.value}
                  {...o}
                />
              ))}
            </MetroSelect>

            <Typography variant='h3'>2. Controlled value</Typography>
            <MetroSelect
              value={transport}
              onChange={(v) => setTransport(v as string)}
              gap={4}
            >
              {controlled.map((o) => (
                <MetroSelect.Option
                  key={o.value}
                  {...o}
                />
              ))}
            </MetroSelect>
            <Typography>
              Current: <b>{transport}</b>
            </Typography>

            <Typography variant='h3'>3. Many options</Typography>
            <MetroSelect gap={4}>
              {many.map((o) => (
                <MetroSelect.Option
                  key={o.value}
                  {...o}
                />
              ))}
            </MetroSelect>

            <Typography variant='h3'>4. Multi-select</Typography>
            <Typography variant='subtitle'>Start with two non-adjacent items selected</Typography>
            <MetroSelect
              multiple
              defaultValue={['home', 'travel']}
              gap={4}
            >
              {basic.map((o) => (
                <MetroSelect.Option
                  key={o.value}
                  {...o}
                />
              ))}
            </MetroSelect>
            <Stack direction='row'>
              <Button
                variant='outlined'
                onClick={toggleMode}
              >
                Toggle light / dark
              </Button>
              <Button onClick={() => navigate(-1)}>← Back</Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/fields/metroselect' />
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Surface>
  );
}
