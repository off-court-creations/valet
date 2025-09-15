// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/field/MetroSelectDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – segmented control with icons, single/multiple
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Stack, Typography, Button, MetroSelect, Select, useTheme } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import MetroSelectMeta from '../../../../../src/components/fields/MetroSelect.meta.json';

export default function MetroSelectDemoPage() {
  const { toggleMode } = useTheme();

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

  const usage = (
    <Stack>
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

      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark
      </Button>
    </Stack>
  );

  const [gap, setGap] = useState<number | string>(4);
  const playground = (
    <Stack gap={1}>
      <Typography variant='subtitle'>gap</Typography>
      <Select
        placeholder='gap'
        value={gap}
        onChange={(v) => setGap(v as number | string)}
        sx={{ width: 200 }}
      >
        <Select.Option value={2}>2</Select.Option>
        <Select.Option value={4}>4</Select.Option>
        <Select.Option value={8}>8</Select.Option>
        <Select.Option value={'1rem'}>1rem</Select.Option>
      </Select>
      <MetroSelect gap={gap}>
        {basic.map((o) => (
          <MetroSelect.Option
            key={o.value}
            {...o}
          />
        ))}
      </MetroSelect>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Metro Select'
      subtitle='Segmented options with icons; single or multiple'
      slug='components/fields/metroselect'
      meta={MetroSelectMeta}
      usage={usage}
      playground={playground}
    />
  );
}
