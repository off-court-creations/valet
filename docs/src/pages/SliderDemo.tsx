// ─────────────────────────────────────────────────────────────────────────────
// src/pages/SliderDemoPage.tsx | valet
// Comprehensive live demo showcasing every Slider feature & edge-case
// – Updated: section #5 now snaps to its custom tick marks
// – Removed: preset-styling showcase (simplifies demo focus)
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useMemo } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Slider,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Example-wide constants                                                     */
const PRESET_MARKS = [0, 25, 50, 75, 100];           // example #4 presets
const CUSTOM_TICKS = [0, 15, 30, 45, 60];            // example #5 ticks

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                   */
export default function SliderDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate               = useNavigate();

  /* Controlled slider state ------------------------------------------------ */
  const [ctlValue, setCtlValue] = useState(30);

  return (
    <Surface>
      <NavDrawer />
      <Stack
        preset="showcaseStack"
      >
        {/* Header */}
        <Typography variant="h2" bold>
          Slider Showcase
        </Typography>
        <Typography variant="subtitle">
          A smörgåsbord of every prop, pattern, and trick
        </Typography>

        {/* 1. Default uncontrolled ----------------------------------------- */}
        <Typography variant="h3">1. Uncontrolled (defaults)</Typography>
        <Slider defaultValue={50} />

        {/* 2. Controlled ---------------------------------------------------- */}
        <Typography variant="h3">2. Controlled</Typography>
        <Stack>
          <Slider
            value={ctlValue}
            onChange={setCtlValue}
            showValue
            showMinMax
          />
          <Typography>
            Current value:&nbsp;
            <code>{ctlValue}</code>
          </Typography>
        </Stack>

        {/* 3. Step snapping w/ ticks --------------------------------------- */}
        <Typography variant="h3">3. Snap = "step" + ticks</Typography>
        <Slider
          defaultValue={40}
          min={0}
          max={100}
          step={10}
          snap="step"
          showValue
          showMinMax
          showTicks
        />

        {/* 4. Preset snapping ---------------------------------------------- */}
        <Typography variant="h3">4. Snap = "presets"</Typography>
        <Slider
          defaultValue={75}
          min={0}
          max={100}
          presets={PRESET_MARKS}
          snap="presets"
          showValue
          showMinMax
          showTicks
        />

        {/* 5. Custom ticks *with* snapping ---------------------------------- */}
        <Typography variant="h3">5. Custom ticks (snap = "presets")</Typography>
        <Slider
          defaultValue={15}
          min={0}
          max={60}
          ticks={CUSTOM_TICKS}
          presets={CUSTOM_TICKS}
          snap="presets"          // ← ensures handle snaps to tick marks
          showTicks
        />

        {/* 6. Small size variant ------------------------------------------- */}
        <Typography variant="h3">6. sm size variant</Typography>
        <Slider
          defaultValue={25}
          size="sm"
          showValue
          showMinMax
        />

        {/* 7. Disabled state ----------------------------------------------- */}
        <Typography variant="h3">7. Disabled</Typography>
        <Slider
          value={50}
          disabled
          showMinMax
        />

        {/* Theme toggle + back nav ----------------------------------------- */}
        <Stack direction="row">
          <Button variant="outlined" onClick={toggleMode}>
            Toggle light / dark
          </Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
