// ─────────────────────────────────────────────────────────────────────────────
// src/pages/BoxDemoPage.tsx
// A comprehensive live demo of every Box capability in ZeroUI
// ─────────────────────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,          // for tidy vertical layout
  Box,
  Typography,
  Button,
  useTheme,
  definePreset,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Style presets                                                              */
// Fancy card-like container
definePreset('fancyBox', (t) => `
    background   : ${t.colors['primary']};
    color        : ${t.colors['primaryText']};
    border-radius: 20px;
    box-shadow   : 0 6px 16px ${t.colors['text']}22;
    padding      : ${t.spacing(3)};
    margin       : ${t.spacing(3)};
  `);

// Frosted-glass effect (needs backdrop-filter support)
definePreset('glassBox', (t) => `
    background      : ${t.colors['background']}CC;
    backdrop-filter : blur(6px) saturate(180%);
    border          : 1px solid ${t.colors['text']}22;
    padding         : ${t.spacing(3)};
    border-radius   : 12px;
  `);

// Loud gradient banner
definePreset('gradientBox', () => `
    background: linear-gradient(135deg,#ff6b6b 0%,#f7b267 50%,#4bd0d2 100%);
    color     : #ffffff;
    padding   : 32px;
    border-radius: 8px;
    text-align: center;
  `);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function BoxDemoPage() {
  const { theme, toggleMode } = useTheme();   // live theme switch
  const navigate = useNavigate();

  return (
    <Surface /* Surface already defaults to theme background */>
      <Stack
        spacing={3}
        preset="showcaseStack"
      >
        {/* Page header ----------------------------------------------------- */}
        <Typography variant="h2" bold>
          Box Showcase
        </Typography>
        <Typography variant="subtitle">
          Every prop, every trick, all in one place
        </Typography>

        {/* 1. Vanilla Box -------------------------------------------------- */}
        <Typography variant="h3">1. Default Box</Typography>
        <Box>
          <Typography>(no props) — inherits parent background, uses theme text colour</Typography>
        </Box>

        {/* 2. Background prop with auto-text detection --------------------- */}
        <Typography variant="h3">2. background&nbsp;prop</Typography>
        <Stack spacing={2}>
          <Box background={theme.colors['primary']}>
            <Typography variant="h4">{`background={theme.colors.primary}`}</Typography>
          </Box>
          <Box background={theme.colors['secondary']}>
            <Typography variant="h4">{`background={theme.colors.secondary}`}</Typography>
          </Box>
          <Box background={theme.colors['tertiary']}>
            <Typography variant="h4">{`background={theme.colors.tertiary}`}</Typography>
          </Box>
        </Stack>

        {/* 3. Explicit textColor override ---------------------------------- */}
        <Typography variant="h3">3. textColor&nbsp;override</Typography>
        <Box
          background={"#333333"}
          textColor={theme.colors['tertiary']}
          style={{ padding: theme.spacing(2) }}
        >
          <Typography>
            Greetings Programs!
            <br />
            {`textColor=${theme.colors['primary']}`}
          </Typography>
        </Box>

        {/* 4. Inline style overrides --------------------------------------- */}
        <Typography variant="h3">4. Inline style</Typography>
        <Box
          background={theme.colors['tertiary']}
          style={{
            border: `2px dashed ${theme.colors['text']}`,
            padding: theme.spacing(3),
            borderRadius: 12,
          }}
        >
          <Typography>Dashed border, custom radius, padding via <code>style</code></Typography>
        </Box>

        {/* 5. Nested Boxes & CSS custom props ------------------------------ */}
        <Typography variant="h3">5. Nested Boxes</Typography>
        <Box background={theme.colors['primary']} style={{ padding: theme.spacing(2) }}>
          <Box background={theme.colors['secondary']} style={{ padding: theme.spacing(1) }}>
            <Typography>
              Child automatically receives&nbsp;
              <code style={{ color: 'var(--zero-text-color)' }}>--zero-text-color</code>
            </Typography>
          </Box>
        </Box>

        {/* 6. Presets ------------------------------------------------------- */}
        <Typography variant="h3">6. Presets</Typography>
        <Stack spacing={2}>
          <Box preset="fancyBox">
            <Typography>preset="fancyBox"</Typography>
          </Box>

          <Box preset="glassBox">
            <Typography>preset="glassBox"</Typography>
          </Box>

          <Box preset="gradientBox">
            <Typography>preset="gradientBox"</Typography>
          </Box>

          <Box preset={['glassBox', 'fancyBox']}>
            <Typography>
              Combination&nbsp;
              <code>preset=['glassBox','fancyBox']</code>
            </Typography>
          </Box>
        </Stack>

        {/* 7. Live theme validation ---------------------------------------- */}
        <Typography variant="h3">7. Theme coupling</Typography>
        <Button variant="outlined" onClick={toggleMode}>Toggle light / dark mode</Button>

        {/* Back nav -------------------------------------------------------- */}
        <Button size="lg" onClick={() => navigate(-1)} style={{ marginTop: theme.spacing(3) }}>
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
