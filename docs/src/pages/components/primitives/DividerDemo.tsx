// ─────────────────────────────────────────────────────────────
// docs/src/pages/DividerDemo.tsx  | valet-docs
// Divider component demo with Usage / Playground / Reference
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import {
  Surface,
  Stack,
  Typography,
  Tabs,
  Table,
  Box,
  Panel,
  Select,
  Iterator,
  Switch,
  TextField,
  Divider,
  useTheme,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';

type Orient = 'horizontal' | 'vertical';

interface Row {
  prop: React.ReactNode;
  type: React.ReactNode;
  default: React.ReactNode;
  description: React.ReactNode;
}

export default function DividerDemoPage() {
  const { theme } = useTheme();

  // Playground state
  const [orientation, setOrientation] = useState<Orient>('horizontal');
  const [thickness, setThickness] = useState<number>(2);
  const [pad, setPad] = useState<number>(1);
  const [length, setLength] = useState<string>('');
  const [customColor, setCustomColor] = useState<string>('');
  const [compact, setCompact] = useState(false);

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop: <code>orientation</code>,
      type: <code>&apos;horizontal&apos; | &apos;vertical&apos;</code>,
      default: <code>&apos;horizontal&apos;</code>,
      description: 'Direction of the line separator.',
    },
    {
      prop: <code>lineColor</code>,
      type: <code>string</code>,
      default: <code>var(--valet-text-color, theme.colors.text)</code>,
      description:
        'Explicit colour. By default, Divider uses the surface text colour via CSS var (falls back to theme.colors.text).',
    },
    {
      prop: <code>thickness</code>,
      type: <code>number | string</code>,
      default: <code>2</code>,
      description:
        'Line thickness. Numbers scale the base divider stroke (1 = base, 2 = double) via calc(var(--valet-divider-stroke) * n); strings pass through (e.g., "2px").',
    },
    {
      prop: <code>length</code>,
      type: <code>number | string</code>,
      default: <code>&apos;100%&apos;</code>,
      description:
        'Length along the main axis. Numbers → px; strings pass through (e.g., "50%", "12rem").',
    },
    {
      prop: <code>pad</code>,
      type: <code>number | string</code>,
      default: <code>0</code>,
      description:
        'Outer spacing envelope. Numbers map via theme.spacing(n); strings pass through. Obeys compact.',
    },
    {
      prop: <code>compact</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Zero out padding for compact density.',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>—</code>,
      description: 'Apply style presets.',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Divider' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
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
          </Tabs.Panel>

          <Tabs.Tab label='Playground' />
          <Tabs.Panel>
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
                      length.trim() === ''
                        ? undefined
                        : isNaN(Number(length))
                          ? length
                          : Number(length)
                    }
                    lineColor={customColor.trim() === '' ? undefined : customColor}
                  />
                  <Typography>Below / Right</Typography>
                </Stack>
              </Panel>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>
        {/* Best Practices ------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Use sparingly. Dividers communicate separation; prefer intrinsic spacing (Stack
            pad/gap) for rhythm and only add lines where hierarchy needs emphasis.
          </Typography>
          <Typography>
            - Share spacing tokens. Set <code>pad</code> and <code>thickness</code> via numeric
            tokens so density matches other components; avoid hard‑coded pixels.
          </Typography>
          <Typography>
            - Orientation follows layout. Use vertical dividers within horizontal stacks and vice
            versa; keep <code>length</code> proportional to nearby content.
          </Typography>
          <Typography>
            - Keep contrast subtle. Default line color derives from text; override sparingly to
            avoid heavy or distracting separators.
          </Typography>
          <Typography>
            - Don’t imply semantics. Dividers are visual; use headings and landmarks for document
            structure, not lines.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}
