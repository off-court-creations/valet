// src/pages/MainPage.tsx
import { useNavigate } from 'react-router-dom';
import { Surface, Button, Typography, Stack, useTheme, Box, Panel } from '@archway/valet';

export default function MainPage() {
  const navigate = useNavigate();
  const { mode, toggleMode } = useTheme();

  return (
    <Surface>
      <Typography variant="h1" centered><b>zeroui</b> Docs</Typography>

      <Box centered compact>
        <Stack compact spacing={2}>
          <Panel variant="alt">
            <Typography variant="h2" centered>Components</Typography>

            <Stack direction="row">
              <Button
                onClick={() => navigate('/accordion-demo')}
              >
                Accordion
              </Button>

              <Button
                onClick={() => navigate('/box-demo')}
              >
                Box
              </Button>

              <Button
                onClick={() => navigate('/button-demo')}
              >
                Button
              </Button>

              <Button
                onClick={() => navigate('/checkbox-demo')}
              >
                Checkbox
              </Button>

              <Button
                onClick={() => navigate('/drawer-demo')}
              >
                Drawer
              </Button>

              <Button
                onClick={() => navigate('/text-form-demo')}
              >
                FormControl + Textfield
              </Button>

              <Button
                onClick={() => navigate('/grid-demo')}
              >
                Grid
              </Button>

              <Button
                onClick={() => navigate('/icon-demo')}
              >
                Icon
              </Button>

              <Button
                onClick={() => navigate('/icon-button-demo')}
              >
                Icon Button
              </Button>

              <Button
                onClick={() => navigate('/avatar-demo')}
              >
                Avatar
              </Button>

              <Button
                onClick={() => navigate('/list-demo')}
              >
                List
              </Button>

              <Button
                onClick={() => navigate('/modal-demo')}
              >
                Modal
              </Button>

              <Button
                onClick={() => navigate('/pagination-demo')}
              >
                Pagination
              </Button>

              <Button
                onClick={() => navigate('/panel-demo')}
              >
                Panel
              </Button>

              <Button
                onClick={() => navigate('/progress-demo')}
              >
                Progress
              </Button>

              <Button
                onClick={() => navigate('/radio-demo')}
              >
                Radio Group
              </Button>

              <Button
                onClick={() => navigate('/slider-demo')}
              >
                Slider
              </Button>

              <Button
                onClick={() => navigate('/select-demo')}
              >
                Select
              </Button>

              <Button
                onClick={() => navigate('/snackbar-demo')}
              >
                Snackbar
              </Button>

              <Button
                onClick={() => navigate('/switch-demo')}
              >
                Switch
              </Button>

              <Button
                onClick={() => navigate('/table-demo')}
              >
                Table
              </Button>

              <Button
                onClick={() => navigate('/tabs-demo')}
              >
                Tabs
              </Button>

              <Button
                onClick={() => navigate('/tooltip-demo')}
              >
                Tooltip
              </Button>

              <Button
                onClick={() => navigate('/typography')}
              >
                Typography
              </Button>

              <Button
                onClick={() => navigate('/video-demo')}
              >
                Video
              </Button>

              <Button
                onClick={() => navigate('/appbar-demo')}
              >
                AppBar
              </Button>

              <Button
                onClick={() => navigate('/speeddial-demo')}
              >
                Speed Dial
              </Button>

              <Button
                onClick={() => navigate('/stepper-demo')}
              >
                Stepper
              </Button>
            </Stack>
          </Panel>

          <Panel>
            <Typography centered variant="h2">Demos</Typography>

            <Stack direction="row">
              <Button
                onClick={() => navigate('/presets')}
              >
                Presets
              </Button>

              <Button
                onClick={() => navigate('/form')}
              >
                Form
              </Button>

              <Button
                onClick={() => navigate('/parallax')}
              >
                Parallax
              </Button>

              <Button
                onClick={() => navigate('/test')}
              >
                Radio Button
              </Button>
            </Stack>
          </Panel>

          <Box>
            <Button
              size="lg"
              variant='outlined'
              onClick={toggleMode}
            >
              Switch to {mode === 'light' ? 'dark' : 'light'} mode
            </Button>
          </Box>
        </Stack>
      </Box>
    </Surface>
  );
}
