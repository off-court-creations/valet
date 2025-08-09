// ─────────────────────────────────────────────────────────────────────────────
// src/pages/TooltipDemoPage.tsx | valet
// Live showcase of the Tooltip component: placements, arrow toggle, controlled
// visibility, enter/leave delays, presets, and theme coupling.
// ─────────────────────────────────────────────────────────────────────────────
import { useMemo, useState } from 'react';
import {
  Surface,
  Stack,
  Tooltip,
  Button,
  IconButton,
  Typography,
  useTheme,
  definePreset,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Style presets                                                              */
// Bright red tooltip for destructive actions
definePreset(
  'dangerTooltip',
  () => `
  background-color : #ff0000;
  color      : #ffffff;
`,
);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function TooltipDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const [controlledOpen, setControlledOpen] = useState(false);

  const placements = useMemo(
    () =>
      [
        { key: 'top', label: 'Top' },
        { key: 'right', label: 'Right' },
        { key: 'bottom', label: 'Bottom' },
        { key: 'left', label: 'Left' },
      ] as const,
    [],
  );

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        {/* Page header ----------------------------------------------------- */}
        <Typography
          variant='h2'
          bold
        >
          Tooltip Showcase
        </Typography>
        <Typography variant='subtitle'>
          Hover, focus, or tap the elements below to explore every capability
        </Typography>

        {/* 1. Basic usage -------------------------------------------------- */}
        <Typography variant='h3'>1. Default Tooltip</Typography>
        <Tooltip title='Hello, ZeroUI!'>
          <Button variant='contained'>Hover me</Button>
        </Tooltip>

        {/* 2. Placements ---------------------------------------------------- */}
        <Typography variant='h3'>2. Placements</Typography>
        <Stack
          direction='row'
          wrap
        >
          {placements.map(({ key, label }) => (
            <Tooltip
              key={key}
              placement={key as any}
              title={`placement="${key}"`}
            >
              <Button>{label}</Button>
            </Tooltip>
          ))}
        </Stack>

        {/* 3. Arrow toggle -------------------------------------------------- */}
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

        {/* 4. Controlled visibility ---------------------------------------- */}
        <Typography variant='h3'>4. Controlled visibility</Typography>
        <Stack direction='row'>
          <Tooltip
            open={controlledOpen}
            onClose={() => setControlledOpen(false)}
            onOpen={() => setControlledOpen(true)}
            title='I am controlled!'
          >
            <Button variant='outlined'>Target</Button>
          </Tooltip>
          <Button onClick={() => setControlledOpen((v) => !v)}>
            {controlledOpen ? 'Hide' : 'Show'} tooltip
          </Button>
        </Stack>

        {/* 5. Custom enter / leave delays ---------------------------------- */}
        <Typography variant='h3'>5. Custom enter / leave delays</Typography>
        <Tooltip
          title='500 ms open / 1 s close'
          enterDelay={500}
          leaveDelay={1000}
        >
          <Button>Slow tooltip</Button>
        </Tooltip>

        {/* 6. Preset styling ----------------------------------------------- */}
        <Typography variant='h3'>6. Preset styling</Typography>
        <Tooltip
          title='Looks dangerous'
          preset='dangerTooltip'
        >
          <Button variant='contained'>Danger button</Button>
        </Tooltip>

        {/* 7. Theme coupling ----------------------------------------------- */}
        <Typography variant='h3'>7. Theme coupling</Typography>
        <Button
          variant='outlined'
          onClick={toggleMode}
        >
          Toggle light / dark mode
        </Button>

        {/* Back nav --------------------------------------------------------- */}
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
