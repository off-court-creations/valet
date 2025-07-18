// src/pages/PresetDemoPage.tsx
import { useNavigate } from 'react-router-dom';
import {
  definePreset,
  Surface,
  Box,
  Stack,
  Typography,
  Button,
  useTheme,
} from '@archway/valet';

/*───────────────────────────────────────────────────────────────*/
/* 1.  Register demo-only presets (once per page load)           */
definePreset('frostedSurface', t => `
  background: ${t.colors['background']}CC;
  backdrop-filter: blur(10px);
`);

definePreset('cardBox', t => `
  background: ${t.colors['background']};
  border-radius: 20px;
  box-shadow: 0 6px 16px ${t.colors['text']}22;
  padding: ${t.spacing(1)};
  margin: ${t.spacing(1)};
`);

definePreset('accentText', t => `
  color: ${t.colors['secondary']};
`);

definePreset('ghostButton', t => `
  border: 2px dashed ${t.colors['secondary']};
  background: transparent;
  color: ${t.colors['secondary']};
`);

definePreset('pillStack', t => `
  background: ${t.colors['tertiary']}33;
  border-radius: 9999px;
  padding: ${t.spacing(1)};
`);

/*───────────────────────────────────────────────────────────────*/
/* 2.  Demo page component                                       */
export default function PresetDemoPage() {
  const { theme } = useTheme();
  const navigate   = useNavigate();

  return (
    <Surface preset="frostedSurface">
      {/* Card-style Box */}
      <Box preset="cardBox">
        {/* Accent headline */}
        <Typography variant="h2" preset="accentText">
          Preset Showcase
        </Typography>

        <Typography variant="body" style={{ marginBottom: theme.spacing(1) }}>
          Every component below uses a different <code>preset</code>.
        </Typography>

        {/* “Pill” Stack containing ghost buttons */}
        <Stack direction="row" preset="pillStack">
          <Button preset="ghostButton" size="md" style={{ marginLeft: theme.spacing(1) }}>
            Ghost 1
          </Button>
          <Button preset="ghostButton" size="md">
            Ghost 2
          </Button>
        </Stack>
      </Box>

      {/* Default-styled Box for contrast */}
      <Box style={{ padding: theme.spacing(1) }}>
        <Typography>Default Box (no preset)</Typography>
      </Box>

      {/* Navigation */}
      <Stack direction="row" style={{ padding: theme.spacing(1) }}>
        <Button variant="contained" size="lg" preset="ghostButton" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Stack>
    </Surface>
  );
}
