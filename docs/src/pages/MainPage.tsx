// src/pages/MainPage.tsx
import { useNavigate } from 'react-router-dom';
import { Surface, Button, Typography, Stack, useTheme, Box, Panel } from '@archway/valet';

export default function MainPage() {
  const navigate = useNavigate();
  const { theme, mode, toggleMode } = useTheme();

  return (
    <Surface>
      <Box style={{ margin: theme.spacing(2) }} centered>
        <Typography variant="h1"><b>zeroui</b> Demo</Typography>
      </Box>

      <Box style={{ margin: theme.spacing(2) }} centered>
        <Stack>
          <Panel style={{ margin: theme.spacing(2), padding: theme.spacing(2) }} variant="alt">
            <Box centered>
              <Typography variant="h2">Components</Typography>
            </Box>

            <Stack direction="row" spacing={3} style={{ marginTop: theme.spacing(3) }}>
              <Button
                size="lg"
                onClick={() => navigate('/accordion-demo')}
              >
                Accordion
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/box-demo')}
              >
                Box
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/button-demo')}
              >
                Button
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/checkbox-demo')}
              >
                Checkbox
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/drawer-demo')}
              >
                Drawer
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/text-form-demo')}
              >
                FormControl + Textfield
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/grid-demo')}
              >
                Grid
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/icon-demo')}
              >
                Icon
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/icon-button-demo')}
              >
                Icon Button
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/list-demo')}
              >
                List
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/modal-demo')}
              >
                Modal
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/pagination-demo')}
              >
                Pagination
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/panel-demo')}
              >
                Panel
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/progress-demo')}
              >
                Progress
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/radio-demo')}
              >
                Radio Group
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/slider-demo')}
              >
                Slider
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/select-demo')}
              >
                Select
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/snackbar-demo')}
              >
                Snackbar
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/switch-demo')}
              >
                Switch
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/table-demo')}
              >
                Table
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/tabs-demo')}
              >
                Tabs
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/tooltip-demo')}
              >
                Tooltip
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/typography')}
              >
                Typography
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/video-demo')}
              >
                Video
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/appbar-demo')}
              >
                AppBar
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/speeddial-demo')}
              >
                Speed Dial
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/stepper-demo')}
              >
                Stepper
              </Button>
            </Stack>
          </Panel>

          <Panel style={{ margin: theme.spacing(2), padding: theme.spacing(2) }}>
            <Typography variant="h2">Demos</Typography>

            <Stack direction="row" spacing={3} style={{ marginTop: theme.spacing(3) }}>
              <Button
                size="lg"
                onClick={() => navigate('/presets')}
              >
                Presets
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/form')}
              >
                Form
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/parallax')}
              >
                Parallax
              </Button>

              <Button
                size="lg"
                onClick={() => navigate('/test')}
              >
                Radio Button
              </Button>
            </Stack>
          </Panel>

          <Box
            style={{ margin: theme.spacing(2) }}
          >
            <Button
              size="lg"
              variant='outlined'
              onClick={toggleMode}
              style={{ margin: theme.spacing(2) }}
            >
              Switch to {mode === 'light' ? 'dark' : 'light'} mode
            </Button>
          </Box>
        </Stack>
      </Box>

    </Surface>
  );
}
