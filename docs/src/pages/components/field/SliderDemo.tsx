// ─────────────────────────────────────────────────────────────────────────────
// docs/src/pages/components/field/SliderDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – comprehensive Slider usage + playground
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Typography,
  Button,
  Slider,
  Iterator,
  Switch,
  Select,
  useTheme,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import SliderMeta from '../../../../../src/components/fields/Slider.meta.json';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Example-wide constants                                                     */
const PRESET_MARKS = [0, 25, 50, 75, 100]; // example #4 presets
const CUSTOM_TICKS = [0, 15, 30, 45, 60]; // example #5 ticks

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                   */
export default function SliderDemoPage() {
  const { toggleMode } = useTheme();

  /* Controlled slider state ------------------------------------------------ */
  const [ctlValue, setCtlValue] = useState(30);

  const usageContent = (
    <Stack>
      {/* 1. Default uncontrolled */}
      <Typography variant='h3'>1. Uncontrolled (defaults)</Typography>
      <Slider defaultValue={50} />

      {/* 2. Controlled */}
      <Typography variant='h3'>2. Controlled</Typography>
      <Stack>
        <Slider
          value={ctlValue}
          onChange={setCtlValue}
          showValue
        />
        <Typography>
          Current value:&nbsp;<code>{ctlValue}</code>
        </Typography>
      </Stack>

      {/* 3. Snap = step + ticks */}
      <Typography variant='h3'>
        3. Snap = <code>step</code> + ticks
      </Typography>
      <Slider
        defaultValue={40}
        min={0}
        max={100}
        step={10}
        snap='step'
        showValue
        showTicks
      />

      {/* 4. Snap = presets */}
      <Typography variant='h3'>
        4. Snap = <code>presets</code>
      </Typography>
      <Slider
        defaultValue={75}
        min={0}
        max={100}
        presets={PRESET_MARKS}
        snap='presets'
        showValue
        showTicks
      />

      {/* 5. Custom ticks with snapping */}
      <Typography variant='h3'>
        5. Custom ticks (snap = <code>presets</code>)
      </Typography>
      <Slider
        defaultValue={15}
        min={0}
        max={60}
        ticks={CUSTOM_TICKS}
        presets={CUSTOM_TICKS}
        snap='presets'
        showTicks
      />

      {/* 6. Sizes */}
      <Typography variant='h3'>6. Sizes</Typography>
      <Stack sx={{ '--valet-stack-ov-y': 'visible' }}>
        <Slider
          defaultValue={20}
          size='xs'
        />
        <Slider
          defaultValue={20}
          size='sm'
        />
        <Slider
          defaultValue={20}
          size='md'
        />
        <Slider
          defaultValue={20}
          size='lg'
        />
        <Slider
          defaultValue={20}
          size='xl'
        />
      </Stack>

      {/* 7. Custom sizes */}
      <Typography variant='h3'>7. Custom sizes</Typography>
      <Stack
        gap={0.75}
        sx={{ '--valet-stack-ov-y': 'visible' }}
      >
        <Slider
          defaultValue={40}
          size='2rem'
        />
        <Slider
          defaultValue={40}
          size='24px'
        />
      </Stack>

      {/* 8. Theme coupling */}
      <Typography variant='h3'>8. Theme coupling</Typography>
      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark
      </Button>
    </Stack>
  );

  const [min, setMin] = useState(0);
  const [max, setMax] = useState(100);
  const [step, setStep] = useState(5);
  const [snap, setSnap] = useState<'none' | 'step' | 'presets'>('step');
  const [showTicks, setShowTicks] = useState(true);
  const [showValue, setShowValue] = useState(true);
  const [showMinMax, setShowMinMax] = useState(true);
  const [pv, setPv] = useState(50);

  const playgroundContent = (
    <Stack gap={1}>
      <Stack
        direction='row'
        wrap={false}
        gap={1}
      >
        <Stack gap={0.25}>
          <Typography variant='subtitle'>min</Typography>
          <Iterator
            width={140}
            min={-100}
            max={max - 1}
            step={1}
            value={min}
            onChange={(n) => setMin(n)}
            aria-label='min'
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>max</Typography>
          <Iterator
            width={140}
            min={min + 1}
            max={500}
            step={1}
            value={max}
            onChange={(n) => setMax(n)}
            aria-label='max'
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>step</Typography>
          <Iterator
            width={140}
            min={1}
            max={Math.max(1, Math.floor((max - min) / 2))}
            step={1}
            value={step}
            onChange={(n) => setStep(n)}
            aria-label='step'
          />
        </Stack>
        <Stack gap={0.25}>
          <Typography variant='subtitle'>snap</Typography>
          <Select
            placeholder='snap'
            value={snap}
            onChange={(v) => setSnap((v as 'step' | 'presets') || 'none')}
            sx={{ width: 160 }}
          >
            <Select.Option value='step'>step</Select.Option>
            <Select.Option value='presets'>presets</Select.Option>
            <Select.Option value='none'>none</Select.Option>
          </Select>
        </Stack>
      </Stack>

      <Stack
        direction='row'
        wrap={false}
        gap={2}
        sx={{ alignItems: 'center' }}
      >
        <Stack
          direction='row'
          gap={0.5}
          sx={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>showTicks</Typography>
          <Switch
            checked={showTicks}
            onChange={setShowTicks}
          />
        </Stack>
        <Stack
          direction='row'
          gap={0.5}
          sx={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>showValue</Typography>
          <Switch
            checked={showValue}
            onChange={setShowValue}
          />
        </Stack>
        <Stack
          direction='row'
          gap={0.5}
          sx={{ alignItems: 'center' }}
        >
          <Typography variant='subtitle'>showMinMax</Typography>
          <Switch
            checked={showMinMax}
            onChange={setShowMinMax}
          />
        </Stack>
      </Stack>

      <Slider
        value={pv}
        onChange={setPv}
        min={min}
        max={max}
        step={step}
        {...(snap === 'step' ? { snap: 'step' as const } : {})}
        {...(snap === 'presets' ? { snap: 'presets' as const, presets: PRESET_MARKS } : {})}
        {...(showTicks ? { showTicks: true } : {})}
        {...(showValue ? { showValue: true } : {})}
        {...(showMinMax ? { showMinMax: true } : {})}
      />
      <Typography>value: {pv}</Typography>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Slider'
      subtitle='Uncontrolled/controlled, snapping, ticks, sizes, and presets'
      slug='components/fields/slider'
      meta={SliderMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
