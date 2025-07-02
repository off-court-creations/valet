// ─────────────────────────────────────────────────────────────────────────────
// src/pages/IconButtonDemoPage.tsx
// A comprehensive live demo of ZeroUI <IconButton />
// ─────────────────────────────────────────────────────────────────────────────
import {
  Surface,
  Stack,
  Box,
  Typography,
  Button,
  IconButton,
  Icon,
  useTheme,
  definePreset,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Style preset showcasing IconButton inside a card                            */
definePreset('actionCard', t => `
    background   : ${t.colors['backgroundAlt']};
    padding      : ${t.spacing(3)};
    border-radius: 16px;
    box-shadow   : 0 4px 12px ${t.colors['text']}22;
    display      : flex;
    align-items  : center;
    gap          : ${t.spacing(2)};
  `);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Example custom SVGs                                                         */
const HeartSvg = (
  <svg viewBox="0 0 24 24" stroke="none">
    <path
      d="M12 21s-6.4-4.35-9.32-7.27C.9 11.94.5 8.77 2.53 6.5 4.08 4.69 6.89 4.21 9 5.44c2.11-1.23 4.92-.75 6.47 1.06 2.03 2.27 1.63 5.44-.15 7.23C18.4 16.65 12 21 12 21Z"
      fill="currentColor"
    />
  </svg>
);

/*─────────────────────────────────────────────────────────────────────────────*/
export default function IconButtonDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  return (
    <Surface>
      <Stack
        spacing={3}
        preset="showcaseStack"
      >
        {/* Page header ----------------------------------------------------- */}
        <Typography variant="h2" bold>
          IconButton Showcase
        </Typography>
        <Typography variant="subtitle">
          Circular icon-only buttons with contained &amp; outlined styles
        </Typography>

        {/* 1. Contained sizes --------------------------------------------- */}
        <Typography variant="h3">1. Contained sizes</Typography>
        <Stack direction="row" spacing={2}>
          <IconButton icon="mdi:play" size="sm" aria-label="Play small" />
          <IconButton icon="mdi:play" size="md" aria-label="Play medium" />
          <IconButton icon="mdi:play" size="lg" aria-label="Play large" />
        </Stack>

        {/* 2. Outlined sizes ---------------------------------------------- */}
        <Typography variant="h3">2. Outlined sizes</Typography>
        <Stack direction="row" spacing={2}>
          <IconButton
            variant="outlined"
            icon="mdi:pause"
            size="sm"
            aria-label="Pause small"
          />
          <IconButton
            variant="outlined"
            icon="mdi:pause"
            size="md"
            aria-label="Pause medium"
          />
          <IconButton
            variant="outlined"
            icon="mdi:pause"
            size="lg"
            aria-label="Pause large"
          />
        </Stack>

        {/* 3. Colour override --------------------------------------------- */}
        <Typography variant="h3">3. Icon colour override</Typography>
        <Stack direction="row" spacing={2}>
          <IconButton
            icon="mdi:heart"
            iconColor="#ff5e5e"
            aria-label="Favorite"
          />
          <IconButton
            variant="outlined"
            icon="mdi:pencil"
            iconColor={theme.colors['secondary']}
            aria-label="Edit"
          />
        </Stack>

        {/* 4. Custom SVG --------------------------------------------------- */}
        <Typography variant="h3">4. Custom SVG graphics</Typography>
        <Stack direction="row" spacing={2}>
          <IconButton svg={HeartSvg} aria-label="Heart" />
        </Stack>

        {/* 5. Disabled & active states ------------------------------------ */}
        <Typography variant="h3">5. Disabled state</Typography>
        <IconButton
          icon="mdi:delete"
          size="md"
          disabled
          aria-label="Delete disabled"
        />

        {/* 6. Preset usage ------------------------------------------------- */}
        <Typography variant="h3">6. Preset integration</Typography>
        <Box preset="actionCard">
          <IconButton
            icon="mdi:credit-card"
            size="md"
            aria-label="Pay now"
          />
          <Typography>Pay now</Typography>
        </Box>

        {/* 7. Theme coupling ---------------------------------------------- */}
        <Typography variant="h3">7. Theme demonstration</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark mode&nbsp;
          <Icon icon="mdi:theme-light-dark" size="1.2rem" />
        </Button>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(3) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
