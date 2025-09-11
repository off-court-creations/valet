// ─────────────────────────────────────────────────────────────────────────────
// src/pages/ProgressDemoPage.tsx | valet-docs
// Interactive playground showcasing every <Progress/> capability – circular &
// linear, determinate / indeterminate / buffer modes, all sizes, colour /
// theme coupling, and live control via Slider, Button, & IconButton.
// ─────────────────────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import {
  Surface,
  Stack,
  Box,
  Typography,
  Button,
  IconButton,
  Slider,
  Progress,
  useTheme,
  Panel,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function ProgressDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

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

  interface Row {
    prop: React.ReactNode;
    type: React.ReactNode;
    default: React.ReactNode;
    description: React.ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop: <code>variant</code>,
      type: <code>'linear' | 'circular'</code>,
      default: <code>'linear'</code>,
      description: 'Visual style of the progress indicator',
    },
    {
      prop: <code>mode</code>,
      type: <code>'determinate' | 'indeterminate' | 'buffer'</code>,
      default: <code>'determinate'</code>,
      description: 'Behavior; buffer applies to linear only',
    },
    {
      prop: <code>value</code>,
      type: <code>number</code>,
      default: <code>0</code>,
      description: '0–100 value for determinate/buffer foreground',
    },
    {
      prop: <code>buffer</code>,
      type: <code>number</code>,
      default: <code>0</code>,
      description: '0–100 secondary value (linear-buffer only)',
    },
    {
      prop: <code>size</code>,
      type: <code>'xs' | 'sm' | 'md' | 'lg' | 'xl' | number | string</code>,
      default: <code>'md'</code>,
      description: 'Token size or custom CSS size',
    },
    {
      prop: <code>showLabel</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Show numeric % inside circular center',
    },
    {
      prop: <code>color</code>,
      type: <code>string</code>,
      default: <code>theme.colors.primary</code>,
      description: 'Override bar/stroke color',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>—</code>,
      description: 'Apply style presets (define via definePreset())',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Progress' />
        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            {/* 1. Circular indeterminate ---------------------------------- */}
            <Typography variant='h3'>1. Circular – indeterminate</Typography>
            <Stack direction='row'>
              <Progress variant='circular' mode='indeterminate' size='xs' />
              <Progress variant='circular' mode='indeterminate' size='sm' />
              <Progress variant='circular' mode='indeterminate' />
              <Progress variant='circular' mode='indeterminate' size='lg' />
              <Progress variant='circular' mode='indeterminate' size='xl' />
            </Stack>

            {/* 2. Circular determinate (controlled) ----------------------- */}
            <Typography variant='h3'>2. Circular – determinate (controlled)</Typography>
            <Stack direction='row' sx={{ alignItems: 'center' }}>
              <Progress variant='circular' mode='determinate' value={value} showLabel />
              <Progress
                variant='circular'
                mode='determinate'
                value={value}
                size='lg'
                color={theme.colors['error']}
              />
              <IconButton icon='mdi:home' onClick={reset} aria-label='reset' />
            </Stack>

            {/* 3. Linear indeterminate ------------------------------------ */}
            <Typography variant='h3'>3. Linear – indeterminate</Typography>
            <Progress mode='indeterminate' />

            {/* 4. Linear determinate (controlled) ------------------------- */}
            <Typography variant='h3'>4. Linear – determinate (controlled)</Typography>
            <Progress value={value} />
            <Progress value={value} size={50} />

            {/* 5. Linear buffer ------------------------------------------- */}
            <Typography variant='h3'>5. Linear – buffer</Typography>
            <Progress mode='buffer' value={value} buffer={buffer} />

            {/* 6. Interactive controls ------------------------------------ */}
            <Typography variant='h3'>6. Play with value</Typography>
            <Stack>
              <Box sx={{ maxWidth: 480 }}>
                <Slider value={value} onChange={setValue} />
              </Box>
              <Stack direction='row'>
                <Button onClick={() => setValue((v) => Math.max(0, v - 10))}>–10</Button>
                <Button onClick={() => setValue((v) => Math.min(100, v + 10))}>+10</Button>
                <Button variant='outlined' onClick={reset}>Reset</Button>
                <Button variant='outlined' onClick={toggleMode}>Toggle light / dark</Button>
              </Stack>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>

        {/* Best Practices -------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Choose the right mode. Use <code>determinate</code> when you know progress,{' '}
            <code>indeterminate</code> for unknown durations, and <code>buffer</code> when
            prefetching or streaming.
          </Typography>
          <Typography>
            - Provide context. Pair progress with nearby text (e.g., &quot;Uploading…&quot; or
            &quot;Step 2 of 3&quot;). For circular, consider <code>showLabel</code> when exact
            values add clarity.
          </Typography>
          <Typography>
            - Don’t spin forever. If indeterminate lasts more than a few seconds, provide a fallback
            (cancel, retry) or switch to determinate as soon as you can estimate progress.
          </Typography>
          <Typography>
            - Respect accessibility. The component sets <code>role=&quot;progressbar&quot;</code>{' '}
            and ARIA values; you can associate additional text via <code>aria-label</code> or
            <code> aria-describedby</code> on the wrapper.
          </Typography>
          <Typography>
            - Colour & size with tokens. Use theme colours to convey status (e.g.,
            <code> error</code> for failures) and size via tokens/numbers to fit the context.
          </Typography>
          <Typography>
            - Don’t block the page. Keep progress close to the affected region and allow unrelated
            interactions when possible.
          </Typography>
        </Panel>
      </Stack>
    </Surface>
  );
}
