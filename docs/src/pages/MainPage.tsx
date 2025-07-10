// ─────────────────────────────────────────────────────────────
// src/pages/MainPage.tsx  | valet
// Doc home with responsive drawer navigation
// ─────────────────────────────────────────────────────────────
import { useNavigate } from 'react-router-dom';
import {
  Surface,
  Stack,
  Button,
  Typography,
  useTheme,
  useSurface,
} from '@archway/valet';
import { DocsDrawer } from './DocsLayout';

export default function MainPage() {
  const navigate = useNavigate();
  const { theme, mode, toggleMode } = useTheme();

  function Content() {
    const { width, height } = useSurface();
    const landscape = width >= height;

    return (
      <Stack
        spacing={1}
        style={{
          padding: theme.spacing(1),
          marginLeft: landscape ? '16rem' : 0,
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
    );
  }

  return (
    <Surface>
      <DocsDrawer />
      <Content />
    </Surface>
  );
}
