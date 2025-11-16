// docs/src/pages/components/widgets/SpeedDialDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – usage and direction playground
import { Stack, Typography, Button, SpeedDial, Icon, Select, useTheme } from '@archway/valet';
import { useState } from 'react';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import SpeedDialMeta from '../../../../../src/components/widgets/SpeedDial.meta.json';

export default function SpeedDialDemoPage() {
  const { toggleMode } = useTheme();
  const [direction, setDirection] = useState<'up' | 'down' | 'left' | 'right'>('up');

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

  const usage = (
    <Stack>
      <Typography variant='h3'>Example</Typography>
      <Typography variant='body'>Click the FAB to reveal actions.</Typography>
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
  );

  const playground = (
    <Stack gap={1}>
      <Stack gap={0.25}>
        <Typography variant='subtitle'>direction</Typography>
        <Select
          placeholder='direction'
          value={direction}
          onValueChange={(v) => setDirection(v as 'up' | 'down' | 'left' | 'right')}
          sx={{ width: 160 }}
        >
          <Select.Option value='up'>up</Select.Option>
          <Select.Option value='down'>down</Select.Option>
          <Select.Option value='left'>left</Select.Option>
          <Select.Option value='right'>right</Select.Option>
        </Select>
      </Stack>
      <SpeedDial
        icon={<Icon icon='mdi:plus' />}
        actions={actions}
        direction={direction}
      />
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Speed Dial'
      subtitle='Expandable FAB for quick actions'
      slug='components/widgets/speeddial'
      meta={SpeedDialMeta}
      usage={usage}
      playground={playground}
    />
  );
}
