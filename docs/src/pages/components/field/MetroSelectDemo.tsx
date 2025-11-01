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

  // Playground controls: mode (single/multiple), tile size, and controlled value
  const [mode, setMode] = useState<'single' | 'multiple'>('single');
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [sel, setSel] = useState<string | string[]>('home');

  // Parent-level size now controls tile geometry uniformly

  // When switching modes, coerce selection shape sensibly
  const setModeSafe = (m: 'single' | 'multiple') => {
    setMode(m);
    setSel((cur) =>
      m === 'multiple'
        ? Array.isArray(cur)
          ? cur
          : [cur]
        : Array.isArray(cur)
          ? (cur[0] ?? 'home')
          : cur,
    );
  };

  const playground = (
    <Stack gap={1}>
      <Typography variant='subtitle'>mode</Typography>
      <Select
        placeholder='mode'
        value={mode}
        onChange={(v) => setModeSafe(v as 'single' | 'multiple')}
        sx={{ width: 200 }}
      >
        <Select.Option value='single'>single</Select.Option>
        <Select.Option value='multiple'>multiple</Select.Option>
      </Select>

      <Typography variant='subtitle'>tile size</Typography>
      <Select
        placeholder='size'
        value={size}
        onChange={(v) => setSize(v as 'sm' | 'md' | 'lg')}
        sx={{ width: 200 }}
      >
        <Select.Option value='sm'>small</Select.Option>
        <Select.Option value='md'>medium</Select.Option>
        <Select.Option value='lg'>large</Select.Option>
      </Select>

      <MetroSelect
        value={sel}
        onChange={(v) => setSel(v as string | string[])}
        multiple={mode === 'multiple'}
        size={size}
      >
        {basic.map((o) => (
          <MetroSelect.Option
            key={o.value}
            {...o}
          />
        ))}
      </MetroSelect>
      <Typography>
        Selected: <b>{Array.isArray(sel) ? sel.join(', ') : sel}</b>
      </Typography>
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
