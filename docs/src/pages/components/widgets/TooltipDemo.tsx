// ─────────────────────────────────────────────────────────────────────────────
// src/pages/TooltipDemoPage.tsx | valet-docs
// Live showcase of the Tooltip component: placements, arrow toggle, controlled
// visibility, enter/leave delays, presets, and theme coupling.
// ─────────────────────────────────────────────────────────────────────────────
import type React from 'react';
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
  Panel,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';

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

  // Use the Tooltip component's own prop type to avoid `any`
  type TooltipPlacement = NonNullable<React.ComponentProps<typeof Tooltip>['placement']>;

  const placements = useMemo<ReadonlyArray<{ key: TooltipPlacement; label: string }>>(
    () => [
      { key: 'top' as TooltipPlacement, label: 'Top' },
      { key: 'right' as TooltipPlacement, label: 'Right' },
      { key: 'bottom' as TooltipPlacement, label: 'Bottom' },
      { key: 'left' as TooltipPlacement, label: 'Left' },
    ],
    [],
  );

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Tooltip' />

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
              placement={key}
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
          title='500 ms open / 1 s close'
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

        {/* Best Practices ------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Use tooltips for supplemental hints, not essential instructions. The UI should remain
            usable without hovering.
          </Typography>
          <Typography>
            - Ensure the trigger is focusable and labelled. For icon‑only controls, provide
            <code>aria-label</code> on the target.
          </Typography>
          <Typography>
            - Keep content concise; avoid interactive controls inside tooltips. Prefer short phrases
            over sentences.
          </Typography>
          <Typography>
            - Prefer <code>placement=&apos;top&apos;</code> when space allows; adjust placement to
            avoid clipping and viewport edges.
          </Typography>
          <Typography>
            - Use sensible delays. Avoid long <code>enterDelay</code> / <code>leaveDelay</code> that
            make tooltips feel sluggish or sticky, especially on touch devices.
          </Typography>
        </Panel>

        {/* Back nav --------------------------------------------------------- */}
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
