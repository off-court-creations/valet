// ─────────────────────────────────────────────────────────────────────────────
// src/pages/ModalDemoPage.tsx | valet
// Interactive playground demonstrating every capability of the Modal component
// (dialog vs alert, controlled / uncontrolled, backdrop & ESC toggles, maxW,
// fullWidth, preset styling, theme coupling).
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Button,
  Typography,
  Icon,
  useTheme,
  definePreset,
  Modal,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Presets                                                                    */
// A bold red alert preset
definePreset('alertDanger', (t) => `
  background : ${t.colors['error']};
  color      : #fff;
`);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function ModalDemoPage() {
  const navigate = useNavigate();
  const { theme, toggleMode } = useTheme();

  // state for the various demos
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [controlledOpen, setControlledOpen] = useState(false);
  const [noBackdropCloseOpen, setNoBackdropCloseOpen] = useState(false);

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <Typography variant="h2" bold>
          Modal Showcase
        </Typography>
        <Typography variant="subtitle">
          Explore dialog vs alert semantics, controlled state, size props, and more.
        </Typography>

        {/* 1. Simple dialog ------------------------------------------------ */}
        <Typography variant="h3">1. Dialog modal</Typography>
        <Button variant="contained" onClick={() => setDialogOpen(true)}>
          Open dialog
        </Button>
        <Modal
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          title="Example dialog"
          actions={
            <>
              <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button variant="contained" onClick={() => setDialogOpen(false)}>
                Confirm
              </Button>
            </>
          }
        >
          <Typography>
            This is a standard <code>role="dialog"</code> modal.
          </Typography>
        </Modal>

        {/* 2. Alert modal -------------------------------------------------- */}
        <Typography variant="h3">2. Alert modal</Typography>
        <Button color="error" variant="contained" onClick={() => setAlertOpen(true)}>
          Delete item…
        </Button>
        <Modal
          variant="alert"
          open={alertOpen}
          onClose={() => setAlertOpen(false)}
          title={<><Icon style={{ marginRight: 8 }} /> Confirm delete</>}
          preset="alertDanger"
          actions={
            <>
              <Button variant="outlined" onClick={() => setAlertOpen(false)}>
                Cancel
              </Button>
              <Button variant="contained" color="error" onClick={() => setAlertOpen(false)}>
                Delete
              </Button>
            </>
          }
        >
          <Typography>
            This action is <strong>permanent</strong>. Are you sure you want to continue?
          </Typography>
        </Modal>

        {/* 3. Controlled modal -------------------------------------------- */}
        <Typography variant="h3">3. Controlled modal</Typography>
        <Stack direction="row">
          <Button onClick={() => setControlledOpen(true)}>Open</Button>
          <Button onClick={() => setControlledOpen(false)}>Close</Button>
        </Stack>
        <Modal
          open={controlledOpen}
          onClose={() => setControlledOpen(false)}
          title="Externally controlled"
          actions={<Button onClick={() => setControlledOpen(false)}>Okay</Button>}
        >
          <Typography>Visibility is managed by external buttons.</Typography>
        </Modal>

        {/* 4. Backdrop / ESC disable -------------------------------------- */}
        <Typography variant="h3">4. Disable backdrop / ESC</Typography>
        <Button onClick={() => setNoBackdropCloseOpen(true)}>
          Unclosable via backdrop / ESC
        </Button>
        <Modal
          open={noBackdropCloseOpen}
          onClose={() => setNoBackdropCloseOpen(false)}
          disableBackdropClick
          disableEscapeKeyDown
          title="Try clicking backdrop or pressing ESC"
          actions={<Button onClick={() => setNoBackdropCloseOpen(false)}>Close</Button>}
        >
          <Typography>
            Both backdrop click and ESC key are disabled for this modal.
          </Typography>
        </Modal>

        {/* 5. Size props --------------------------------------------------- */}
        <Typography variant="h3">5. maxWidth & fullWidth</Typography>
        <Stack direction="row">
          <Button onClick={() => setDialogOpen(true)}>maxWidth (default)</Button>
          <Button onClick={() => setControlledOpen(true)}>fullWidth</Button>
        </Stack>
        {/* reuse existing modals for brevity */}

        {/* 6. Theme coupling ---------------------------------------------- */}
        <Typography variant="h3">6. Theme coupling</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark mode
        </Button>

        {/* Back nav -------------------------------------------------------- */}
        <Button size="lg" onClick={() => navigate(-1)} style={{ marginTop: theme.spacing(1) }}>
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
