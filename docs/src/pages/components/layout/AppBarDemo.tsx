// docs/src/pages/components/layout/AppBarDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – usage + simple playground
import { Stack, Typography, Button, AppBar, Icon, useTheme, Select } from '@archway/valet';
import React from 'react';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import AppBarMeta from '../../../../../src/components/layout/AppBar.meta.json';

export default function AppBarDemoPage() {
  const { theme, toggleMode } = useTheme();

  const usage = (
    <Stack gap={1}>
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
      <Typography>
        The AppBar renders left and right slots. Keep content concise; reserve primary actions for
        the right slot and navigation/branding for the left.
      </Typography>
    </Stack>
  );

  const [color, setColor] = React.useState<'default' | 'primary' | 'secondary' | 'tertiary'>(
    'default',
  );
  const playground = (
    <Stack gap={1}>
      <Stack
        direction='row'
        sx={{ alignItems: 'center', gap: theme.spacing(1) }}
      >
        <Typography variant='subtitle'>color</Typography>
        <Select
          placeholder='color'
          value={color}
          onChange={(v) =>
            setColor((v as 'default' | 'primary' | 'secondary' | 'tertiary') || 'default')
          }
          sx={{ width: 180 }}
        >
          <Select.Option value='default'>default</Select.Option>
          <Select.Option value='primary'>primary</Select.Option>
          <Select.Option value='secondary'>secondary</Select.Option>
          <Select.Option value='tertiary'>tertiary</Select.Option>
        </Select>
      </Stack>
      <AppBar
        {...(color !== 'default'
          ? { color: theme.colors[color], textColor: theme.colors[`${color}Text`] }
          : {})}
        left={<Typography>Playground</Typography>}
        right={
          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle
          </Button>
        }
      />
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='AppBar'
      subtitle='Global navigation and actions via left/right slots'
      slug='components/layout/appbar'
      meta={AppBarMeta}
      usage={usage}
      playground={playground}
    />
  );
}
