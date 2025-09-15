// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/TooltipDemo.tsx  | valet-docs
// Tooltip docs using ComponentMetaPage (Usage, Playground, Examples, Reference)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Tooltip,
  Button,
  IconButton,
  Typography,
  Panel,
  Select,
  Switch,
  Iterator,
  TextField,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import CuratedExamples from '../../../components/CuratedExamples';
import BestPractices from '../../../components/BestPractices';
import { getBestPractices, getExamples } from '../../../utils/sidecar';
import TooltipMeta from '../../../../../src/components/widgets/Tooltip.meta.json';

type Placement = 'top' | 'bottom' | 'left' | 'right';

export default function TooltipDemoPage() {
  // Usage examples
  const [ctrlOpen, setCtrlOpen] = useState(false);

  const usageContent = (
    <Stack>
      <Typography variant='h3'>1. Default</Typography>
      <Tooltip title='Hello, valet!'>
        <Button variant='contained'>Hover me</Button>
      </Tooltip>

      <Typography variant='h3'>2. Controlled visibility</Typography>
      <Stack direction='row'>
        <Tooltip
          open={ctrlOpen}
          onOpen={() => setCtrlOpen(true)}
          onClose={() => setCtrlOpen(false)}
          title='Controlled'
        >
          <Button variant='outlined'>Target</Button>
        </Tooltip>
        <Button onClick={() => setCtrlOpen((v) => !v)}>{ctrlOpen ? 'Hide' : 'Show'} tooltip</Button>
      </Stack>

      <Typography variant='h3'>3. Arrow toggle</Typography>
      <Stack direction='row'>
        <Tooltip title='Default arrow (true)'>
          <IconButton icon='mdi:home' />
        </Tooltip>
        <Tooltip
          arrow={false}
          title='arrow={false}'
        >
          <IconButton icon='mdi:home' />
        </Tooltip>
      </Stack>
    </Stack>
  );

  // Playground
  const [pgTitle, setPgTitle] = useState<string>('Tooltip text');
  const [pgPlacement, setPgPlacement] = useState<Placement>('top');
  const [pgArrow, setPgArrow] = useState<boolean>(true);
  const [pgControlled, setPgControlled] = useState<boolean>(false);
  const [pgOpen, setPgOpen] = useState<boolean>(false);
  const [pgEnterDelay, setPgEnterDelay] = useState<number>(100);
  const [pgLeaveDelay, setPgLeaveDelay] = useState<number>(100);
  const [pgDisableHover, setPgDisableHover] = useState<boolean>(false);
  const [pgDisableFocus, setPgDisableFocus] = useState<boolean>(false);
  const [pgDisableTouch, setPgDisableTouch] = useState<boolean>(false);

  const playgroundContent = (
    <Stack gap={1}>
      <Panel fullWidth>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <TextField
            name='title'
            label='title'
            value={pgTitle}
            onChange={(e) => setPgTitle((e.target as HTMLInputElement).value)}
            sx={{ width: 260 }}
          />
          <Select
            placeholder='placement'
            value={pgPlacement}
            onChange={(v) => setPgPlacement(v as Placement)}
            sx={{ width: 180 }}
          >
            <Select.Option value='top'>top</Select.Option>
            <Select.Option value='bottom'>bottom</Select.Option>
            <Select.Option value='left'>left</Select.Option>
            <Select.Option value='right'>right</Select.Option>
          </Select>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>arrow</Typography>
            <Switch
              checked={pgArrow}
              onChange={setPgArrow}
              aria-label='arrow'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>controlled</Typography>
            <Switch
              checked={pgControlled}
              onChange={setPgControlled}
              aria-label='controlled'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>open</Typography>
            <Switch
              checked={pgOpen}
              onChange={setPgOpen}
              aria-label='open'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>enterDelay</Typography>
            <Iterator
              width={140}
              min={0}
              max={1000}
              step={50}
              value={pgEnterDelay}
              onChange={(n) => setPgEnterDelay(Math.round(n))}
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>leaveDelay</Typography>
            <Iterator
              width={140}
              min={0}
              max={1000}
              step={50}
              value={pgLeaveDelay}
              onChange={(n) => setPgLeaveDelay(Math.round(n))}
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>disableHover</Typography>
            <Switch
              checked={pgDisableHover}
              onChange={setPgDisableHover}
              aria-label='disableHover'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>disableFocus</Typography>
            <Switch
              checked={pgDisableFocus}
              onChange={setPgDisableFocus}
              aria-label='disableFocus'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>disableTouch</Typography>
            <Switch
              checked={pgDisableTouch}
              onChange={setPgDisableTouch}
              aria-label='disableTouch'
            />
          </Stack>
        </Stack>
      </Panel>
      <Panel fullWidth>
        <Tooltip
          title={pgTitle}
          placement={pgPlacement}
          arrow={pgArrow}
          enterDelay={pgEnterDelay}
          leaveDelay={pgLeaveDelay}
          disableHoverListener={pgDisableHover}
          disableFocusListener={pgDisableFocus}
          disableTouchListener={pgDisableTouch}
          {...(pgControlled ? { open: pgOpen } : {})}
        >
          <Button>Playground target</Button>
        </Tooltip>
      </Panel>
      <CuratedExamples examples={getExamples(TooltipMeta)} />
      <BestPractices items={getBestPractices(TooltipMeta)} />
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Tooltip'
      subtitle='Accessible, portal-based tooltip with hover, focus, and touch interactions.'
      slug='components/widgets/tooltip'
      meta={TooltipMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
