// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/ProgressDemo.tsx  | valet-docs
// Progress docs using ComponentMetaPage (Usage, Playground, Examples, Reference)
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import {
  Stack,
  Box,
  Typography,
  Button,
  IconButton,
  Slider,
  Progress,
  useTheme,
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
import ProgressMeta from '../../../../../src/components/primitives/Progress.meta.json';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function ProgressDemoPage() {
  const { theme, toggleMode } = useTheme();

  /* Controlled value / buffer ------------------------------------------- */
  const [value, setValue] = useState(40);
  const [buffer, setBuffer] = useState(60);

  /* Auto-increment animation just for show ------------------------------ */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (value < 100) {
        setValue((v) => Math.min(100, v + 1));
        setBuffer((b) => Math.min(100, b + 1.5));
      }
    }, 90);
    return () => clearTimeout(id);
  }, [value]);

  const reset = () => {
    setValue(0);
    setBuffer(25);
  };

  const usageContent = (
    <Stack>
      {/* 1. Circular indeterminate ---------------------------------- */}
      <Typography variant='h3'>1. Circular – indeterminate</Typography>
      <Stack direction='row'>
        <Progress
          variant='circular'
          mode='indeterminate'
          size='xs'
        />
        <Progress
          variant='circular'
          mode='indeterminate'
          size='sm'
        />
        <Progress
          variant='circular'
          mode='indeterminate'
        />
        <Progress
          variant='circular'
          mode='indeterminate'
          size='lg'
        />
        <Progress
          variant='circular'
          mode='indeterminate'
          size='xl'
        />
      </Stack>

      {/* 2. Circular determinate (controlled) ----------------------- */}
      <Typography variant='h3'>2. Circular – determinate (controlled)</Typography>
      {/* Circular surrounding an IconButton using Progress children */}
      <Stack
        direction='row'
        sx={{ alignItems: 'center', gap: theme.spacing(1) }}
      >
        {/* Overlay IconButton centered above circular progress without using children prop */}
        <Box sx={{ position: 'relative', display: 'inline-flex' }}>
          <Progress
            variant='circular'
            mode='determinate'
            value={value}
            color={theme.colors['secondary']}
          />
          <IconButton
            icon='mdi:home'
            onClick={reset}
            aria-label='reset'
            size={48}
            sx={{ position: 'absolute', inset: 0, margin: 'auto' }}
          />
        </Box>
      </Stack>

      {/* Additional circular determinate styles */}
      <Stack
        direction='row'
        sx={{ alignItems: 'center', gap: theme.spacing(1) }}
      >
        <Progress
          variant='circular'
          mode='determinate'
          value={value}
          showLabel
        />
        <Progress
          variant='circular'
          mode='determinate'
          value={value}
          size='lg'
          color={theme.colors['error']}
        />
      </Stack>

      {/* 3. Linear indeterminate ------------------------------------ */}
      <Typography variant='h3'>3. Linear – indeterminate</Typography>
      <Progress mode='indeterminate' />

      {/* 4. Linear determinate (controlled) ------------------------- */}
      <Typography variant='h3'>4. Linear – determinate (controlled)</Typography>
      <Progress value={value} />
      <Progress
        value={value}
        size={50}
      />

      {/* 5. Linear buffer ------------------------------------------- */}
      <Typography variant='h3'>5. Linear – buffer</Typography>
      <Progress
        mode='buffer'
        value={value}
        buffer={buffer}
      />

      {/* 6. Interactive controls ------------------------------------ */}
      <Typography variant='h3'>6. Play with value</Typography>
      <Stack>
        <Box sx={{ maxWidth: 480 }}>
          <Slider
            value={value}
            onChange={setValue}
          />
        </Box>
        <Stack direction='row'>
          <Button onClick={() => setValue((v) => Math.max(0, v - 10))}>–10</Button>
          <Button onClick={() => setValue((v) => Math.min(100, v + 10))}>+10</Button>
          <Button
            variant='outlined'
            onClick={reset}
          >
            Reset
          </Button>
          <Button
            variant='outlined'
            onClick={toggleMode}
          >
            Toggle light / dark
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );

  const [pgVariant, setPgVariant] = useState<'linear' | 'circular'>('linear');
  const [pgMode, setPgMode] = useState<'determinate' | 'indeterminate' | 'buffer'>('determinate');
  const [pgValue, setPgValue] = useState<number>(40);
  const [pgBuffer, setPgBuffer] = useState<number>(60);
  const [pgSize, setPgSize] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md');
  const [pgColor, setPgColor] = useState<string>('');
  const [pgShowLabel, setPgShowLabel] = useState<boolean>(false);

  const playgroundContent = (
    <Stack gap={1}>
      <Panel fullWidth>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Select
            placeholder='variant'
            value={pgVariant}
            onChange={(v) => setPgVariant(v as typeof pgVariant)}
            sx={{ width: 180 }}
          >
            <Select.Option value='linear'>linear</Select.Option>
            <Select.Option value='circular'>circular</Select.Option>
          </Select>
          <Select
            placeholder='mode'
            value={pgMode}
            onChange={(v) => setPgMode(v as typeof pgMode)}
            sx={{ width: 200 }}
          >
            <Select.Option value='determinate'>determinate</Select.Option>
            <Select.Option value='indeterminate'>indeterminate</Select.Option>
            {pgVariant === 'linear' && <Select.Option value='buffer'>buffer</Select.Option>}
          </Select>
          <Select
            placeholder='size'
            value={pgSize}
            onChange={(v) => setPgSize(v as typeof pgSize)}
            sx={{ width: 160 }}
          >
            <Select.Option value='xs'>xs</Select.Option>
            <Select.Option value='sm'>sm</Select.Option>
            <Select.Option value='md'>md</Select.Option>
            <Select.Option value='lg'>lg</Select.Option>
            <Select.Option value='xl'>xl</Select.Option>
          </Select>
          <TextField
            name='color'
            label='color'
            placeholder='CSS color'
            value={pgColor}
            onChange={(e) => setPgColor((e.target as HTMLInputElement).value)}
            sx={{ width: 220 }}
          />
          {pgVariant === 'circular' && (
            <Stack
              direction='row'
              gap={1}
              sx={{ alignItems: 'center' }}
            >
              <Typography variant='subtitle'>showLabel</Typography>
              <Switch
                checked={pgShowLabel}
                onChange={setPgShowLabel}
                aria-label='showLabel'
              />
            </Stack>
          )}
        </Stack>
      </Panel>
      <Panel fullWidth>
        <Stack gap={1}>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>value</Typography>
            <Iterator
              width={160}
              min={0}
              max={100}
              step={1}
              value={pgValue}
              onChange={(n) => setPgValue(Math.round(n))}
            />
            {pgVariant === 'linear' && pgMode === 'buffer' && (
              <>
                <Typography variant='subtitle'>buffer</Typography>
                <Iterator
                  width={160}
                  min={0}
                  max={100}
                  step={1}
                  value={pgBuffer}
                  onChange={(n) => setPgBuffer(Math.round(n))}
                />
              </>
            )}
          </Stack>
          <Box sx={{ padding: theme.spacing(1) }}>
            <Progress
              variant={pgVariant}
              mode={pgMode}
              value={pgValue}
              buffer={pgBuffer}
              size={pgSize}
              color={pgColor || undefined}
              showLabel={pgShowLabel}
            />
          </Box>
        </Stack>
      </Panel>
      <CuratedExamples examples={getExamples(ProgressMeta)} />
      <BestPractices items={getBestPractices(ProgressMeta)} />
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Progress'
      subtitle='Circular and linear progress with determinate, indeterminate, and buffer modes.'
      slug='components/primitives/progress'
      meta={ProgressMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
