// src/pages/StepperDemo.tsx
import { useState } from 'react';
import { Surface, Stack, Typography, Button, Stepper, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

export default function StepperDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  const steps = ['First', 'Second', 'Third'];

  return (
    <Surface>
      <NavDrawer />
      <Stack
        preset="showcaseStack"
      >
        <Typography variant="h2" bold>Stepper Showcase</Typography>
        <Typography variant="subtitle">Simple progress indicator</Typography>

        <Stepper steps={steps} active={active} />
        <Stack direction="row">
          <Button onClick={() => setActive((a) => Math.max(0, a - 1))}>Back</Button>
          <Button onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))}>Next</Button>
        </Stack>

        <Stack direction="row">
          <Button variant="outlined" onClick={toggleMode}>Toggle light / dark</Button>
          <Button onClick={() => navigate(-1)}>← Back</Button>
        </Stack>
      </Stack>
    </Surface>
  );
}
