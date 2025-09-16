// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/DividerDemo.tsx  | valet-docs
// Divider docs via ComponentMetaPage: Usage, Playground, Reference
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import DividerMeta from '../../../../../src/components/primitives/Divider.meta.json';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import {
  Stack,
  Typography,
  Box,
  Panel,
  Select,
  Iterator,
  Switch,
  TextField,
  Divider,
  useTheme,
} from '@archway/valet';

type Orient = 'horizontal' | 'vertical';

// no local prop rows; MCP provides reference tables

export default function DividerDemoPage() {
  const { theme } = useTheme();

  // Playground state
  const [orientation, setOrientation] = useState<Orient>('horizontal');
  const [thickness, setThickness] = useState<number>(2);
  const [pad, setPad] = useState<number>(1);
  const [length, setLength] = useState<string>('');
  const [customColor, setCustomColor] = useState<string>('');
  const [compact, setCompact] = useState(false);

  const usageContent = (
    <Stack gap={1}>
      <Typography variant='h3'>1. Default</Typography>
      <Panel variant='alt'>
        <Stack gap={1}>
          <Typography>Content above</Typography>
          <Divider />
          <Typography>Content below</Typography>
        </Stack>
      </Panel>

      <Typography variant='h3'>2. Vertical</Typography>
      <Panel variant='alt'>
        <Stack
          direction='row'
          gap={1}
          wrap={false}
        >
          <Typography>Left</Typography>
          <Divider orientation='vertical' />
          <Typography>Right</Typography>
        </Stack>
      </Panel>

      <Typography variant='h3'>3. Thickness and Color</Typography>
      <Panel
        variant='alt'
        fullWidth
      >
        <Stack gap={1}>
          <Divider thickness={2} />
          <Divider
            thickness={3}
            lineColor={theme.colors['primary']}
          />
          <Divider
            thickness={'4px'}
            lineColor={theme.colors['secondary']}
          />
        </Stack>
      </Panel>

      <Typography variant='h3'>4. Spacing (pad)</Typography>
      <Panel variant='alt'>
        <Stack gap={0}>
          <Typography>Above</Typography>
          <Divider pad={2} />
          <Typography>Below</Typography>
        </Stack>
      </Panel>

      <Typography variant='h3'>5. Fixed length</Typography>
      <Panel variant='alt'>
        <Stack gap={1}>
          <Divider length='10rem' />
          <Box sx={{ width: '12rem' }}>
            <Typography>
              Wrapped box with <code>length=10rem</code>
            </Typography>
          </Box>
        </Stack>
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
          <Typography variant='subtitle'>orientation</Typography>
          <Select
            value={orientation}
            onChange={(v) => setOrientation(v as Orient)}
            sx={{ width: 180 }}
          >
            <Select.Option value='horizontal'>horizontal</Select.Option>
            <Select.Option value='vertical'>vertical</Select.Option>
          </Select>
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>thickness (units)</Typography>
          <Iterator
            width={160}
            min={0}
            max={6}
            step={0.5}
            value={thickness}
            onChange={(n) => setThickness(n)}
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>pad (units)</Typography>
          <Iterator
            width={160}
            min={0}
            max={6}
            step={0.5}
            value={pad}
            onChange={(n) => setPad(n)}
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>length</Typography>
          <TextField
            name='length'
            placeholder='e.g., 50%, 12rem, 200'
            value={length}
            onChange={(e) => setLength(e.target.value)}
            sx={{ width: 220 }}
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>lineColor</Typography>
          <TextField
            name='lineColor'
            placeholder='css color'
            value={customColor}
            onChange={(e) => setCustomColor(e.target.value)}
            sx={{ width: 180 }}
          />
        </Stack>
        <Stack
          direction='row'
          wrap={false}
          gap={1}
          sx={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>compact</Typography>
          <Switch
            checked={compact}
            onChange={setCompact}
            aria-label='Toggle compact'
          />
        </Stack>
      </Stack>

      <Panel variant='alt'>
        <Stack
          direction={orientation === 'horizontal' ? 'column' : 'row'}
          gap={1}
        >
          <Typography>Above / Left</Typography>
          <Divider
            orientation={orientation}
            thickness={thickness}
            pad={pad}
            compact={compact}
            length={
              length.trim() === '' ? undefined : isNaN(Number(length)) ? length : Number(length)
            }
            lineColor={customColor.trim() === '' ? undefined : customColor}
          />
          <Typography>Below / Right</Typography>
        </Stack>
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Divider'
      subtitle='Theme-aware line separator with predictable spacing ergonomics.'
      slug='components/primitives/divider'
      meta={DividerMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
