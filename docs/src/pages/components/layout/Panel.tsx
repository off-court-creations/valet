// ─────────────────────────────────────────────────────────────────────────────
// src/pages/components/Panel.tsx | valet-docs
// Refactor: meta-driven docs with 5 tabs (Usage, Best Practices, Playground, Examples, Reference)
// ─────────────────────────────────────────────────────────────────────────────
import { Stack, Panel, Typography, useTheme, Select, Iterator, Switch } from '@archway/valet';
import { useState } from 'react';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import PanelMeta from '../../../../../src/components/layout/Panel.meta.json';

export default function PanelDemoPage() {
  const { theme } = useTheme();
  const [bgKey, setBgKey] = useState<'none' | 'primary' | 'secondary' | 'tertiary'>('none');
  const [pad, setPad] = useState<number>(1);
  const [centerContent, setCenterContent] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);
  const [alignX, setAlignX] = useState<'left' | 'right' | 'center'>('left');
  const [variant, setVariant] = useState<'main' | 'alt'>('main');
  const bgValue: string | undefined =
    bgKey === 'none'
      ? undefined
      : bgKey === 'primary'
        ? theme.colors['primary']
        : bgKey === 'secondary'
          ? theme.colors['secondary']
          : theme.colors['tertiary'];

  const usageContent = (
    <Stack>
      <Typography variant='h3'>Default Panel</Typography>
      <Panel preset='codePanel'>
        <Typography>(no props) — inherits theme backgroundAlt &amp; text</Typography>
      </Panel>

      <Typography variant='h3'>variant=&quot;alt&quot;</Typography>
      <Panel
        variant='alt'
        preset='codePanel'
      >
        <Typography>Transparent with outline by default</Typography>
      </Panel>

      <Typography variant='h3'>background override</Typography>
      <Panel
        background={theme.colors['primary']}
        preset='codePanel'
      >
        <Typography>{`background=${theme.colors['primary']}`}</Typography>
      </Panel>

      <Typography variant='h3'>fullWidth</Typography>
      <Panel
        fullWidth
        sx={{ marginBottom: theme.spacing(1) }}
      >
        <Typography>
          Stretch me edge-to-edge with <code>fullWidth</code>
        </Typography>
      </Panel>

      <Typography variant='h3'>Nested Panels</Typography>
      <Panel
        background={theme.colors['primary']}
        pad={1}
      >
        <Panel
          variant='alt'
          fullWidth
          pad={1}
        >
          <Typography>
            Parent sets <code style={{ color: 'var(--valet-text-color)' }}>--valet-text-color</code>{' '}
            for child
          </Typography>
        </Panel>
      </Panel>

      <Typography variant='h3'>Presets</Typography>
      <Stack>
        <Panel preset='fancyHolder'>
          <Typography>preset=&quot;fancyHolder&quot;</Typography>
        </Panel>

        <Panel preset='glassHolder'>
          <Typography>preset=&quot;glassHolder&quot;</Typography>
        </Panel>

        <Panel preset='gradientHolder'>
          <Typography>preset=&quot;gradientHolder&quot;</Typography>
        </Panel>

        <Panel preset={['glassHolder', 'fancyHolder']}>
          <Typography>
            Combination <code>preset=[&apos;glassHolder&apos;,&apos;fancyHolder&apos;]</code>
          </Typography>
        </Panel>
      </Stack>

      <Typography variant='h3'>centerContent</Typography>
      <Panel
        centerContent
        fullWidth
      >
        <Typography>
          Contents centered with <code>centerContent</code>
        </Typography>
      </Panel>
    </Stack>
  );

  const playgroundContent = (
    <Stack gap={1}>
      <Stack
        direction='row'
        wrap={false}
        gap={1}
      >
        <Stack gap={0.25}>
          <Typography variant='subtitle'>Background</Typography>
          <Select
            placeholder='background'
            value={bgKey}
            onChange={(v) => setBgKey(v as 'none' | 'primary' | 'secondary' | 'tertiary')}
            sx={{ width: 200 }}
          >
            <Select.Option value='none'>no background</Select.Option>
            <Select.Option value='primary'>primary</Select.Option>
            <Select.Option value='secondary'>secondary</Select.Option>
            <Select.Option value='tertiary'>tertiary</Select.Option>
          </Select>
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>Padding (units)</Typography>
          <Iterator
            width={180}
            min={0}
            max={8}
            step={0.5}
            value={pad}
            onChange={(n) => setPad(n)}
            aria-label='Padding units'
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>variant</Typography>
          <Select
            placeholder='variant'
            value={variant}
            onChange={(v) => setVariant(v as 'main' | 'alt')}
            sx={{ width: 140 }}
          >
            <Select.Option value='main'>main</Select.Option>
            <Select.Option value='alt'>alt</Select.Option>
          </Select>
        </Stack>
        <Stack
          direction='row'
          wrap={false}
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>center content</Typography>
          <Switch
            checked={centerContent}
            onChange={setCenterContent}
            aria-label='Toggle centerContent'
          />
        </Stack>
        <Stack
          direction='row'
          wrap={false}
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>fullWidth</Typography>
          <Switch
            checked={fullWidth}
            onChange={setFullWidth}
            aria-label='Toggle fullWidth'
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>alignX</Typography>
          <Select
            placeholder='alignX'
            value={alignX}
            onChange={(v) => setAlignX(v as 'left' | 'right' | 'center')}
            sx={{ width: 160 }}
            disabled={fullWidth}
          >
            <Select.Option value='left'>left</Select.Option>
            <Select.Option value='center'>center</Select.Option>
            <Select.Option value='right'>right</Select.Option>
          </Select>
        </Stack>
      </Stack>

      <Panel
        variant={variant}
        background={bgValue}
        pad={pad}
        centerContent={centerContent}
        fullWidth={fullWidth}
        alignX={alignX}
      >
        <Typography>Preview content — try toggling the controls above.</Typography>
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Panel'
      subtitle='Section/card container with optional outline and background '
      slug='components/layout/panel'
      meta={PanelMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
