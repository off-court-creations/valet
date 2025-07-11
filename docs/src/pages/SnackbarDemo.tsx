// ─────────────────────────────────────────────────────────────────────────────
// src/pages/SnackbarDemoPage.tsx | valet
// Comprehensive live demo for <Snackbar/> – showcases uncontrolled / controlled
// usage, custom children, noStack layout, auto-hide tuning, & live theme toggle.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Snackbar,
  useSnackbar,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Helpers                                                                    */
const DismissBtn: React.FC = () => {
  const close = useSnackbar();
  if (!close) return null;
  return (
    <Button size="sm" variant="outlined" onClick={close}>
      Dismiss
    </Button>
  );
};

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                   */
export default function SnackbarDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate              = useNavigate();

  /* Demo state ----------------------------------------------------------- */
  const [autoOpen,    setAutoOpen]    = useState(false);
  const [ctrlOpen,    setCtrlOpen]    = useState(false);
  const [noStackOpen, setNoStackOpen] = useState(false);

  return (
    <Surface>
      <NavDrawer />
      <Stack preset="showcaseStack">
        {/* Header --------------------------------------------------------- */}
        <Typography variant="h2" bold>
          Snackbar Showcase
        </Typography>

        {/* 1. Uncontrolled auto-hide -------------------------------------- */}
        <Typography variant="h3">1. Uncontrolled (auto-hide)</Typography>
        <Button
          size="sm"
          onClick={() => setAutoOpen(true)}
          style={{ alignSelf: 'flex-start' }}
        >
          Trigger auto-hide snackbar
        </Button>
        {autoOpen && (
          <Snackbar
            message="Profile saved successfully!"
            onClose={() => setAutoOpen(false)}
          />
        )}

        {/* 2. Controlled snackbar ---------------------------------------- */}
        <Typography variant="h3">2. Controlled (manual dismiss)</Typography>
        <Button
          size="sm"
          variant="outlined"
          onClick={() => setCtrlOpen(true)}
          style={{ alignSelf: 'flex-start' }}
        >
          Trigger controlled snackbar
        </Button>
        <Snackbar
          open={ctrlOpen}
          onClose={() => setCtrlOpen(false)}
        >
          <Stack direction="row" wrap={false}>
            <Typography variant="body" autoSize>
              Draft saved – click to dismiss
            </Typography>
            <DismissBtn />
          </Stack>
        </Snackbar>

        {/* 3. noStack layout --------------------------------------------- */}
        <Typography variant="h3">3. Custom layout (noStack)</Typography>
        <Button
          size="sm"
          variant="outlined"
          onClick={() => setNoStackOpen(true)}
          style={{ alignSelf: 'flex-start' }}
        >
          Trigger noStack snackbar
        </Button>
        <Snackbar
          open={noStackOpen}
          noStack
          autoHideDuration={8000}
          onClose={() => setNoStackOpen(false)}
        >
          {/* Custom free-form children */}
          <Typography variant="body" autoSize bold>
            Free-form layout – no internal flex
          </Typography>
        </Snackbar>

        {/* 4. Theme coupling --------------------------------------------- */}
        <Typography variant="h3">4. Theme coupling</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark mode
        </Button>

        {/* Back nav -------------------------------------------------------- */}
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
