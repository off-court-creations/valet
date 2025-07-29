// ─────────────────────────────────────────────────────────────────────────────
// src/pages/ProgressDemoPage.tsx | valet
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
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function ProgressDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate               = useNavigate();

  /* Controlled value / buffer ------------------------------------------- */
  const [value,  setValue]  = useState(40);
  const [buffer, setBuffer] = useState(60);

  interface Row {
    prop: ReactNode;
    type: ReactNode;
    default: ReactNode;
    description: ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop       : <code>variant</code>,
      type       : <code>'linear' | 'circular'</code>,
      default    : <code>'linear'</code>,
      description: 'Visual style',
    },
    {
      prop       : <code>mode</code>,
      type       : <code>'determinate' | 'indeterminate' | 'buffer'</code>,
      default    : <code>'determinate'</code>,
      description: 'Progress behaviour',
    },
    {
      prop       : <code>value</code>,
      type       : <code>number</code>,
      default    : <code>0</code>,
      description: 'Primary progress value',
    },
    {
      prop       : <code>buffer</code>,
      type       : <code>number</code>,
      default    : <code>0</code>,
      description: 'Buffer value (linear only)',
    },
    {
      prop       : <code>size</code>,
      type       : <code>ProgressSize | number | string</code>,
      default    : <code>'md'</code>,
      description: 'Size token or custom value',
    },
    {
      prop       : <code>showLabel</code>,
      type       : <code>boolean</code>,
      default    : <code>false</code>,
      description: 'Show numeric label',
    },
    {
      prop       : <code>color</code>,
      type       : <code>string</code>,
      default    : <code>-</code>,
      description: 'Override theme colour',
    },
    {
      prop       : <code>preset</code>,
      type       : <code>string | string[]</code>,
      default    : <code>-</code>,
      description: 'Apply style presets',
    },
  ];

  /* Auto-increment animation just for show ------------------------------ */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (value < 100) {
        setValue((v)  => Math.min(100, v + 1));
        setBuffer((b) => Math.min(100, b + 1.5));
      }
    }, 90);
    return () => clearTimeout(id);
  }, [value]);

  const reset = () => {
    setValue(0);
    setBuffer(25);
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        {/* Page header ----------------------------------------------------- */}
        <Typography variant="h2" bold>
          Progress Playground
        </Typography>
        <Typography variant="subtitle">
          Every variant, mode, and size – plus interactive controls
        </Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            {/* 1. Circular indeterminate -------------------------------------- */}
            <Typography variant="h3">1. Circular – indeterminate</Typography>
            <Stack direction="row">
              <Progress variant="circular" mode="indeterminate" size="xs" />
              <Progress variant="circular" mode="indeterminate" size="sm" />
              <Progress variant="circular" mode="indeterminate" />
              <Progress variant="circular" mode="indeterminate" size="lg" />
              <Progress variant="circular" mode="indeterminate" size="xl" />
            </Stack>

            {/* 2. Circular determinate (controlled) --------------------------- */}
            <Typography variant="h3">2. Circular – determinate (controlled)</Typography>
            <Stack direction="row" style={{ alignItems: 'center' }}>
              <Progress
                variant="circular"
                mode="determinate"
                value={value}
                showLabel
              />
              <Progress
                variant="circular"
                mode="determinate"
                value={value}
                size="lg"
                color={theme.colors['error']}
              />
              <IconButton icon="mdi:home" onClick={reset} aria-label="reset" />
            </Stack>

            {/* 3. Linear indeterminate ---------------------------------------- */}
            <Typography variant="h3">3. Linear – indeterminate</Typography>
            <Progress mode="indeterminate" />

            {/* 4. Linear determinate (controlled) ----------------------------- */}
            <Typography variant="h3">4. Linear – determinate (controlled)</Typography>
            <Progress value={value} />
            <Progress value={value} size={50} />

            {/* 5. Linear buffer ----------------------------------------------- */}
            <Typography variant="h3">5. Linear – buffer</Typography>
            <Progress mode="buffer" value={value} buffer={buffer} />

            {/* 6. Interactive controls ---------------------------------------- */}
            <Typography variant="h3">6. Play with value</Typography>
            <Stack>
              <Box style={{ maxWidth: 480 }}>
                <Slider value={value} onChange={setValue} />
              </Box>
              <Stack direction="row">
                <Button onClick={() => setValue((v) => Math.max(0, v - 10))}>
                  –10
                </Button>
                <Button onClick={() => setValue((v) => Math.min(100, v + 10))}>
                  +10
                </Button>
                <Button variant="outlined" onClick={reset}>
                  Reset
                </Button>
                <Button variant="outlined" onClick={toggleMode}>
                  Toggle light / dark
                </Button>
              </Stack>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Typography variant="h3">Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
