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
          <Typography autoSize scale={1.25}>
            autoSize + scale (resize viewport)
          </Typography>
          <Typography variant="body" autoSize>
            autoSize
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

        {/* 6. Prop reference ---------------------------------------------- */}
        <Typography variant="h3">6. Prop reference</Typography>
        <Panel style={{ padding: theme.spacing(1), overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th align="left">Prop</th>
                <th align="left">Type</th>
                <th align="left">Default</th>
                <th align="left">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>variant</code></td>
                <td><code>'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'body' | 'subtitle' | 'button'</code></td>
                <td><code>'body'</code></td>
                <td>Typography style preset</td>
              </tr>
              <tr>
                <td><code>bold</code></td>
                <td><code>boolean</code></td>
                <td><code>false</code></td>
                <td>Use font-weight&nbsp;700</td>
              </tr>
              <tr>
                <td><code>italic</code></td>
                <td><code>boolean</code></td>
                <td><code>false</code></td>
                <td>Use italic font style</td>
              </tr>
              <tr>
                <td><code>centered</code></td>
                <td><code>boolean</code></td>
                <td><code>false</code></td>
                <td>Center-align text and element within flex/grid parents</td>
              </tr>
              <tr>
                <td><code>fontFamily</code></td>
                <td><code>string</code></td>
                <td>-</td>
                <td>Override theme font family</td>
              </tr>
              <tr>
                <td><code>fontSize</code></td>
                <td><code>string</code></td>
                <td>-</td>
                <td>Explicit CSS font-size</td>
              </tr>
              <tr>
                <td><code>scale</code></td>
                <td><code>number</code></td>
                <td>-</td>
                <td>Multiply the final size (autoSize aware)</td>
              </tr>
              <tr>
                <td><code>autoSize</code></td>
                <td><code>boolean</code></td>
                <td><code>false</code></td>
                <td>Resize to the current breakpoint</td>
              </tr>
              <tr>
                <td><code>color</code></td>
                <td><code>string</code></td>
                <td>-</td>
                <td>Override text colour</td>
              </tr>
              <tr>
                <td><code>preset</code></td>
                <td><code>string | string[]</code></td>
                <td>-</td>
                <td>Apply style presets</td>
              </tr>
            </tbody>
          </table>
        </Panel>

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
