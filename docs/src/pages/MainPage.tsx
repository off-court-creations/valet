// src/pages/MainPage.tsx
import { useNavigate } from 'react-router-dom';
import { Surface, Button, Typography, Stack, useTheme, Box, Panel } from '@archway/valet';

export default function MainPage() {
  const navigate = useNavigate();
  const { theme, mode, toggleMode } = useTheme();

  return (
    <Surface>
      <Typography variant="h1" centered><b>zeroui</b> Demo</Typography>

      <Box style={{ margin: theme.spacing(1) }} centered> 
        <Stack>
          <Panel style={{ margin: theme.spacing(1), padding: theme.spacing(1) }} variant="alt">
            <Typography variant="h2" centered>Components</Typography>

            <Stack direction="row" spacing={1} style={{ marginTop: theme.spacing(1) }}>
              <Button
                size="md"
                onClick={() => navigate('/accordion-demo')}
              >
                Accordion
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/box-demo')}
              >
                Box
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/button-demo')}
              >
                Button
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/checkbox-demo')}
              >
                Checkbox
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/drawer-demo')}
              >
                Drawer
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/text-form-demo')}
              >
                FormControl + Textfield
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/grid-demo')}
              >
                Grid
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/icon-demo')}
              >
                Icon
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/icon-button-demo')}
              >
                Icon Button
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/list-demo')}
              >
                List
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/modal-demo')}
              >
                Modal
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/pagination-demo')}
              >
                Pagination
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/panel-demo')}
              >
                Panel
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/progress-demo')}
              >
                Progress
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/radio-demo')}
              >
                Radio Group
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/slider-demo')}
              >
                Slider
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/select-demo')}
              >
                Select
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/snackbar-demo')}
              >
                Snackbar
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/switch-demo')}
              >
                Switch
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/table-demo')}
              >
                Table
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/tabs-demo')}
              >
                Tabs
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/tooltip-demo')}
              >
                Tooltip
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/typography')}
              >
                Typography
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/video-demo')}
              >
                Video
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/appbar-demo')}
              >
                AppBar
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/speeddial-demo')}
              >
                Speed Dial
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/stepper-demo')}
              >
                Stepper
              </Button>
            </Stack>
          </Panel>

          <Panel style={{ margin: theme.spacing(1), padding: theme.spacing(1) }}>
            <Typography variant="h2">Demos</Typography>

            <Stack direction="row" spacing={1} style={{ marginTop: theme.spacing(1) }}>
              <Button
                size="md"
                onClick={() => navigate('/presets')}
              >
                Presets
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/form')}
              >
                Form
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/parallax')}
              >
                Parallax
              </Button>

              <Button
                size="md"
                onClick={() => navigate('/test')}
              >
                Radio Button
              </Button>
            </Stack>
          </Panel>

          <Box
            style={{ margin: theme.spacing(1) }}
          >
            <Button
              size="md"
              variant='outlined'
              onClick={toggleMode}
              style={{ margin: theme.spacing(1) }}
            >
              Switch to {mode === 'light' ? 'dark' : 'light'} mode
            </Button>
          </Box>
        </Stack>
      </Box>

    </Surface>
  );
}
