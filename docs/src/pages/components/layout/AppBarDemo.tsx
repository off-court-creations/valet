// docs/src/pages/components/layout/AppBarDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – usage + simple playground
import { Stack, Typography, Button, AppBar, Icon, useTheme, Select } from '@archway/valet';
import React from 'react';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import AppBarMeta from '../../../../../src/components/layout/AppBar.meta.json';

export default function AppBarDemoPage() {
  const { theme, toggleMode } = useTheme();
  const [page, setPage] = React.useState<'home' | 'billing' | 'account'>('home');
  const subtleTextColor = ((theme.colors as Record<string, string>)['textSubtle'] ??
    (theme.colors as Record<string, string>)['text']) as string;

  const navigation = [
    { id: 'home', label: 'Home', active: page === 'home', onClick: () => setPage('home') },
    {
      id: 'billing',
      label: 'Billing',
      active: page === 'billing',
      onClick: () => setPage('billing'),
    },
    {
      id: 'account',
      label: 'Account',
      active: page === 'account',
      onClick: () => setPage('account'),
    },
  ];
  const iconNavigation = [
    { id: 'home', icon: <Icon icon='mdi:home' />, ariaLabel: 'Home', active: true, iconOnly: true },
    { id: 'search', icon: <Icon icon='mdi:magnify' />, ariaLabel: 'Search', iconOnly: true },
    { id: 'profile', icon: <Icon icon='mdi:account' />, ariaLabel: 'Profile', iconOnly: true },
  ];

  const usage = (
    <Stack gap={1}>
      <AppBar
        fixed={false}
        portal={false}
        logo={<Icon icon='mdi:car' />}
        title={<Typography fontFamily='Cabin'>AppBar Slots</Typography>}
        right={
          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle
          </Button>
        }
        navigation={navigation}
        navigationLabel='Primary navigation'
      />
      <Typography>
        AppBar ships as a solid bar with optional semantic <code>intent</code> colors and
        <code>color</code> overrides. Pass <code>navigation</code> to render inline navigation
        buttons; alignment defaults to the available space (centered when both left and right slots
        are set).
      </Typography>
      <Stack direction='row'>
        <AppBar
          fixed={false}
          portal={false}
          intent='success'
          left={<Typography>filled success</Typography>}
        />
        <AppBar
          fixed={false}
          portal={false}
          intent='warning'
          left={<Typography>warning</Typography>}
        />
      </Stack>
      <AppBar
        fixed={false}
        portal={false}
        navigationAlign='left'
        navigationLabel='Secondary nav'
        navigation={navigation.map((item) => ({ ...item, active: item.id === page }))}
        right={
          <Stack direction='row'>
            <Button variant='outlined'>Filters</Button>
            <Button>Invite</Button>
          </Stack>
        }
      />
      <AppBar
        fixed={false}
        portal={false}
        navigation={iconNavigation}
        navigationLabel='Icon navigation'
        right={<Button size='sm'>Join</Button>}
      />
    </Stack>
  );

  const [intent, setIntent] = React.useState<
    'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  >('default');
  const [navAlign, setNavAlign] = React.useState<'auto' | 'left' | 'center' | 'right'>('auto');
  const playground = (
    <Stack gap={1}>
      <Stack
        direction='row'
        sx={{ alignItems: 'center', gap: theme.spacing(1) }}
      >
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
        <Typography variant='subtitle'>navigationAlign</Typography>
        <Select
          placeholder='navigation align'
          value={navAlign}
          onValueChange={(v) => setNavAlign((v as 'auto' | 'left' | 'center' | 'right') || 'auto')}
          sx={{ width: 180 }}
        >
          {(['auto', 'left', 'center', 'right'] as const).map((align) => (
            <Select.Option
              key={align}
              value={align}
            >
              {align}
            </Select.Option>
          ))}
        </Select>
      </Stack>
      <AppBar
        fixed={false}
        portal={false}
        {...(intent !== 'default' ? { intent } : {})}
        left={
          <Stack direction='row'>
            <Typography>Playground</Typography>
            <Typography
              variant='body'
              color={subtleTextColor}
              scale={0.9}
            >
              {page}
            </Typography>
          </Stack>
        }
        navigationAlign={navAlign}
        navigation={navigation}
        navigationLabel='Playground navigation'
        right={
          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle
          </Button>
        }
      />
      <AppBar
        fixed={false}
        portal={false}
        navigationAlign={navAlign}
        navigation={iconNavigation.map((item) => ({
          ...item,
          active: item.id === 'home' ? page === 'home' : Boolean(item.active),
          iconOnly: true,
        }))}
        navigationLabel='Playground icon navigation'
        right={<Button size='sm'>CTA</Button>}
      />
      <Typography>
        Color override: you can pass <code>color</code> to use a specific color (token or CSS). For
        example:
      </Typography>
      <AppBar
        fixed={false}
        portal={false}
        color={theme.colors['primary'] as string}
        left={<Typography>color=primary override</Typography>}
        navigation={navigation}
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
