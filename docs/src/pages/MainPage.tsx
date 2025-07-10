// ─────────────────────────────────────────────────────────────
// src/pages/MainPage.tsx  | valet
// Doc home with responsive drawer navigation
// ─────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import {
  Surface,
  Drawer,
  Stack,
  Button,
  Typography,
  useTheme,
} from '@archway/valet';

export default function MainPage() {
  const navigate = useNavigate();
  const { theme, mode, toggleMode } = useTheme();

  const components: [string, string][] = [
    ['Accordion', '/accordion-demo'],
    ['Avatar', '/avatar-demo'],
    ['Box', '/box-demo'],
    ['Button', '/button-demo'],
    ['Checkbox', '/checkbox-demo'],
    ['Chat', '/chat-demo'],
    ['Drawer', '/drawer-demo'],
    ['FormControl + Textfield', '/text-form-demo'],
    ['Grid', '/grid-demo'],
    ['Icon', '/icon-demo'],
    ['Icon Button', '/icon-button-demo'],
    ['List', '/list-demo'],
    ['Modal', '/modal-demo'],
    ['Pagination', '/pagination-demo'],
    ['Panel', '/panel-demo'],
    ['Progress', '/progress-demo'],
    ['Radio Group', '/radio-demo'],
    ['Slider', '/slider-demo'],
    ['Select', '/select-demo'],
    ['Snackbar', '/snackbar-demo'],
    ['Switch', '/switch-demo'],
    ['Table', '/table-demo'],
    ['Tabs', '/tabs-demo'],
    ['Tooltip', '/tooltip-demo'],
    ['Typography', '/typography'],
    ['Video', '/video-demo'],
    ['AppBar', '/appbar-demo'],
    ['Speed Dial', '/speeddial-demo'],
    ['Stepper', '/stepper-demo'],
    ['Tree', '/tree-demo'],
  ];

  const demos: [string, string][] = [
    ['Presets', '/presets'],
    ['Form', '/form'],
    ['Parallax', '/parallax'],
    ['Radio Button', '/test'],
  ];

  return (
    <Surface>
      <Drawer responsive anchor="left" size="16rem" persistent>
        <Stack spacing={1} style={{ padding: theme.spacing(1) }}>
          <Typography variant="h3" bold>Getting Started</Typography>
          <Button onClick={() => navigate('/overview')}>Overview</Button>
          <Button onClick={() => navigate('/installation')}>Installation</Button>
          <Button onClick={() => navigate('/usage')}>Usage</Button>

          <Typography variant="h3" bold style={{ marginTop: theme.spacing(1) }}>
            Components
          </Typography>
          {components.map(([label, path]) => (
            <Button key={path} onClick={() => navigate(path)}>
              {label}
            </Button>
          ))}

          <Typography variant="h3" bold style={{ marginTop: theme.spacing(1) }}>
            Demos
          </Typography>
          {demos.map(([label, path]) => (
            <Button key={path} onClick={() => navigate(path)}>
              {label}
            </Button>
          ))}
        </Stack>
      </Drawer>

      <Stack
        spacing={1}
        style={{
          padding: theme.spacing(1),
          marginLeft: '16rem',
          maxWidth: 980,
        }}
      >
        <Typography variant="h1" bold>
          valet
        </Typography>
        <Typography variant="subtitle">
          A lightweight React component kit bridging AI and the web.
        </Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Switch to {mode === 'light' ? 'dark' : 'light'} mode
        </Button>
      </Stack>
    </Surface>
  );
}
