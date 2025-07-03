// src/pages/TypographyDemoPage.tsx
import { useNavigate } from 'react-router-dom';
import {
  Surface,
  Stack,
  Typography,
  Panel,
  Button,
  useTheme,
} from '@archway/valet';

export default function TypographyDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <Stack spacing={1} preset="showcaseStack">
        {/* Page header ----------------------------------------------------- */}
        <Typography variant="h2" bold>
          Typography Showcase
        </Typography>
        <Typography variant="subtitle">
          Variants, font tweaks and theme coupling
        </Typography>

        {/* 1. Variants ------------------------------------------------------ */}
        <Typography variant="h3">1. Variants</Typography>
        <Panel style={{ padding: theme.spacing(1) }}>
          <Typography variant="h1">variant="h1"</Typography>
          <Typography variant="h2">variant="h2"</Typography>
          <Typography variant="h3">variant="h3"</Typography>
          <Typography variant="h4">variant="h4"</Typography>
          <Typography variant="h5">variant="h5"</Typography>
          <Typography variant="h6">variant="h6"</Typography>
          <Typography variant="subtitle">variant="subtitle"</Typography>
          <Typography variant="body">variant="body"</Typography>
          <Typography variant="button">variant="button"</Typography>
        </Panel>

        {/* 2. Styling props ------------------------------------------------- */}
        <Typography variant="h3">2. Styling props</Typography>
        <Panel style={{ padding: theme.spacing(1) }}>
          <Typography variant="body" bold>
            bold
          </Typography>
          <Typography variant="body" italic>
            italic
          </Typography>
          <Typography variant="body" bold italic>
            bold italic
          </Typography>
          <Typography variant="body" centered>
            centered text
          </Typography>
        </Panel>

        {/* 3. Font & size overrides ---------------------------------------- */}
        <Typography variant="h3">3. Font &amp; size overrides</Typography>
        <Panel style={{ padding: theme.spacing(1) }}>
          <Typography fontFamily="Poppins">fontFamily="Poppins"</Typography>
          <Typography fontSize="1.5rem">fontSize="1.5rem"</Typography>
          <Typography scale={1.25}>scale=1.25</Typography>
          <Typography variant="body" autoSize>
            autoSize (resize viewport)
          </Typography>
        </Panel>

        {/* 4. Colour override & adaptation --------------------------------- */}
        <Typography variant="h3">4. Colour override &amp; adaptation</Typography>
        <Panel style={{ padding: theme.spacing(1) }}>
          <Typography color="#e91e63">color="#e91e63"</Typography>
          <Panel background={theme.colors['primary']} style={{ padding: theme.spacing(1) }}>
            <Typography variant="h6">Inside Panel inherits text colour</Typography>
          </Panel>
          <Button style={{ marginTop: theme.spacing(1) }}>
            <Typography variant="button" bold>
              Typography inside Button
            </Typography>
          </Button>
        </Panel>

        {/* 5. Theme coupling ----------------------------------------------- */}
        <Typography variant="h3">5. Theme coupling</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark mode
        </Button>

        {/* Back nav --------------------------------------------------------- */}
        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
