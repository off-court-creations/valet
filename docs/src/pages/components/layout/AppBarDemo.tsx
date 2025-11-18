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
        fixed={false}
        portal={false}
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
        AppBar supports <code>variant</code> (<code>filled|outlined|plain</code>) and semantic
        <code>intent</code> colors, with optional <code>color</code> override for custom themes.
      </Typography>
      <Stack direction='row'>
        <AppBar
          fixed={false}
          portal={false}
          intent='primary'
          left={<Typography>primary</Typography>}
        />
        <AppBar
          fixed={false}
          portal={false}
          variant='outlined'
          intent='secondary'
          left={<Typography>outlined secondary</Typography>}
        />
        <AppBar
          fixed={false}
          portal={false}
          variant='plain'
          intent='info'
          left={<Typography>plain info</Typography>}
        />
      </Stack>
    </Stack>
  );

  const [variant, setVariant] = React.useState<'filled' | 'outlined' | 'plain'>('filled');
  const [intent, setIntent] = React.useState<
    'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  >('default');
  const playground = (
    <Stack gap={1}>
      <Stack
        direction='row'
        sx={{ alignItems: 'center', gap: theme.spacing(1) }}
      >
        <Typography variant='subtitle'>variant</Typography>
        <Select
          placeholder='variant'
          value={variant}
          onValueChange={(v) => setVariant((v as 'filled' | 'outlined' | 'plain') || 'filled')}
          sx={{ width: 160 }}
        >
          <Select.Option value='filled'>filled</Select.Option>
          <Select.Option value='outlined'>outlined</Select.Option>
          <Select.Option value='plain'>plain</Select.Option>
        </Select>
        <Typography variant='subtitle'>intent</Typography>
        <Select
          placeholder='intent'
          value={intent}
          onValueChange={(v) =>
            setIntent(
              (v as
                | 'default'
                | 'primary'
                | 'secondary'
                | 'success'
                | 'warning'
                | 'error'
                | 'info') || 'default',
            )
          }
          sx={{ width: 200 }}
        >
          {(
            ['default', 'primary', 'secondary', 'success', 'warning', 'error', 'info'] as const
          ).map((c) => (
            <Select.Option
              key={c}
              value={c}
            >
              {c}
            </Select.Option>
          ))}
        </Select>
      </Stack>
      <AppBar
        fixed={false}
        portal={false}
        variant={variant}
        {...(intent !== 'default' ? { intent } : {})}
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
      <Typography>
        Color override: you can pass <code>color</code> to use a specific color (token or CSS). For
        example:
      </Typography>
      <AppBar
        fixed={false}
        portal={false}
        variant='outlined'
        color={theme.colors['primary'] as string}
        left={<Typography>outlined + color=primary</Typography>}
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
