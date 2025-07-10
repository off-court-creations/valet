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
} from '@archway/valet';
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
      <Stack
        spacing={1}
        preset="showcaseStack"
      >
        {/* Page header ----------------------------------------------------- */}
        <Typography variant="h2" bold>
          Progress Playground
        </Typography>
        <Typography variant="subtitle">
          Every variant, mode, and size – plus interactive controls
        </Typography>

        {/* 1. Circular indeterminate -------------------------------------- */}
        <Typography variant="h3">1. Circular – indeterminate</Typography>
        <Stack direction="row" spacing={1}>
          <Progress variant="circular" mode="indeterminate" />
          <Progress variant="circular" mode="indeterminate" size="lg" />
          <Progress
            variant="circular"
            mode="indeterminate"
            size="sm"
            color={theme.colors['success']}
          />
        </Stack>

        {/* 2. Circular determinate (controlled) --------------------------- */}
        <Typography variant="h3">2. Circular – determinate (controlled)</Typography>
        <Stack direction="row" spacing={1} style={{ alignItems: 'center' }}>
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

        {/* 5. Linear buffer ----------------------------------------------- */}
        <Typography variant="h3">5. Linear – buffer</Typography>
        <Progress mode="buffer" value={value} buffer={buffer} />

        {/* 6. Interactive controls ---------------------------------------- */}
        <Typography variant="h3">6. Play with value</Typography>
        <Stack spacing={1}>
          <Box style={{ maxWidth: 480 }}>
            <Slider value={value} onChange={setValue} />
          </Box>
          <Stack direction="row" spacing={1}>
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
