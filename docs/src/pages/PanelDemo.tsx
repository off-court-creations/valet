// ─────────────────────────────────────────────────────────────────────────────
// src/pages/PanelDemoPage.tsx
// A comprehensive live demo of every Panel capability in ZeroUI
// ─────────────────────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,          // tidy vertical layout
  Panel,
  Typography,
  Button,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */

export default function PanelDemoPage() {
  const { theme, toggleMode } = useTheme();      // live theme switch
  const navigate = useNavigate();

  return (
    <Surface /* Surface already defaults to theme background */>
      <NavDrawer />
      <Stack
        spacing={1}
        preset="showcaseStack"
      >
        {/* Page header ----------------------------------------------------- */}
        <Typography variant="h2" bold>
          Panel Showcase
        </Typography>
        <Typography variant="subtitle">
          All props & tricks, neatly demonstrated
        </Typography>

        {/* 1. Default Panel ------------------------------------------------- */}
        <Typography variant="h3">1. Default Panel (variant=&quot;main&quot;)</Typography>
        <Panel style={{ padding: theme.spacing(1) }}>
          <Typography>(no props) — inherits theme backgroundAlt &amp; text</Typography>
        </Panel>

        {/* 2. alt variant --------------------------------------------------- */}
        <Typography variant="h3">2. variant=&quot;alt&quot;</Typography>
        <Panel variant="alt" style={{ padding: theme.spacing(1) }}>
          <Typography>Transparent with outline by default</Typography>
        </Panel>

        {/* 3. background override ------------------------------------------ */}
        <Typography variant="h3">3. background&nbsp;prop</Typography>
        <Stack spacing={1}>
          <Panel
            background={theme.colors['primary']}
            style={{ padding: theme.spacing(1) }}
          >
            <Typography>{`background=${theme.colors['primary']}`}</Typography>
          </Panel>
        </Stack>

        {/* 4. fullWidth prop ----------------------------------------------- */}
        <Typography variant="h3">4. fullWidth&nbsp;prop</Typography>
        <Panel
          fullWidth
          style={{
            padding: theme.spacing(1),
            textAlign: 'center',
          }}
        >
          <Typography>Stretch me edge-to-edge with <code>fullWidth</code></Typography>
        </Panel>

        {/* 5. Inline style overrides --------------------------------------- */}
        <Typography variant="h3">5. Inline style</Typography>
        <Panel
          style={{
            padding      : theme.spacing(1),
            borderRadius : 12,
            border       : `2px dashed ${theme.colors['text']}`,
          }}
        >
          <Typography>Custom dashed border &amp; radius via <code>style</code></Typography>
        </Panel>

        {/* 6. Nested Panels & colour inheritance --------------------------- */}
        <Typography variant="h3">6. Nested Panels</Typography>
        <Panel background={theme.colors['primary']} style={{ padding: theme.spacing(1) }}>
          <Panel variant="alt" fullWidth style={{ padding: theme.spacing(1) }}>
            <Typography>
              Parent sets&nbsp;
              <code style={{ color: 'var(--zero-text-color)' }}>--zero-text-color</code>
              &nbsp;for child
            </Typography>
          </Panel>
        </Panel>

        {/* 7. Preset demos -------------------------------------------------- */}
        <Typography variant="h3">7. Presets</Typography>
        <Stack spacing={1}>
          <Panel preset="fancyHolder">
            <Typography>preset=&quot;fancyHolder&quot;</Typography>
          </Panel>

          <Panel preset="glassHolder">
            <Typography>preset=&quot;glassHolder&quot;</Typography>
          </Panel>

          <Panel preset="gradientHolder">
            <Typography>preset=&quot;gradientHolder&quot;</Typography>
          </Panel>

          <Panel preset={['glassHolder', 'fancyHolder']}>
            <Typography>
              Combination&nbsp;
              <code>preset={['glassHolder','fancyHolder']}</code>
            </Typography>
          </Panel>
        </Stack>

        {/* 9. Live theme validation ---------------------------------------- */}
        <Typography variant="h3">9. Theme coupling</Typography>
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
