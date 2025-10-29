// ─────────────────────────────────────────────────────────────────────────────
// docs/src/pages/components/layout/ModalDemo.tsx | valet-docs
// Modal docs via the reusable ComponentMetaPage (Usage explainer + Reference + Best Practices)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Stack, Button, Typography, useTheme, Modal } from '@archway/valet';
import ModalMeta from '../../../../../src/components/layout/Modal.meta.json';
import ComponentMetaPage from '../../../components/ComponentMetaPage';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Presets – none (alert demo removed)                                        */

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function ModalDemoPage() {
  const { toggleMode } = useTheme();

  // state for the various demos
  const [dialogOpen, setDialogOpen] = useState(false);
  // removed alert + controlled demos per request
  const [noBackdropCloseOpen, setNoBackdropCloseOpen] = useState(false);
  const [labelOnlyOpen, setLabelOnlyOpen] = useState(false);
  const [viewportMarginOpen, setViewportMarginOpen] = useState(false);

  const usage = (
    <Stack>
      <Typography
        variant='h2'
        bold
      >
        Modal Showcase
      </Typography>
      <Typography variant='subtitle'>
        Explore dialog vs alert semantics, controlled state, size props, and more.
      </Typography>

      {/* 1. Simple dialog ------------------------------------------------ */}
      <Typography variant='h3'>1. Dialog modal</Typography>
      <Button
        variant='contained'
        onClick={() => setDialogOpen(true)}
      >
        Open dialog
      </Button>
      <Modal
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title='Example dialog'
        actions={
          <>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              variant='contained'
              onClick={() => setDialogOpen(false)}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Typography>
          This is a standard <code>role=&quot;dialog&quot;</code> modal.
        </Typography>
      </Modal>

      {/* 2. Backdrop / ESC disable -------------------------------------- */}
      <Typography variant='h3'>2. Disable backdrop / ESC</Typography>
      <Button onClick={() => setNoBackdropCloseOpen(true)}>Unclosable via backdrop / ESC</Button>
      <Modal
        open={noBackdropCloseOpen}
        onClose={() => setNoBackdropCloseOpen(false)}
        disableBackdropClick
        disableEscapeKeyDown
        title='Try clicking backdrop or pressing ESC'
        actions={<Button onClick={() => setNoBackdropCloseOpen(false)}>Close</Button>}
      >
        <Typography>Both backdrop click and ESC key are disabled for this modal.</Typography>
      </Modal>

      {/* 3. Theme coupling ---------------------------------------------- */}
      <Typography variant='h3'>3. Theme coupling</Typography>
      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark mode
      </Button>

      {/* 4. A11y without title ----------------------------------------- */}
      <Typography variant='h3'>4. Accessibility without title</Typography>
      <Button onClick={() => setLabelOnlyOpen(true)}>Open labelled modal</Button>
      <Modal
        open={labelOnlyOpen}
        onClose={() => setLabelOnlyOpen(false)}
        aria-label='Preferences'
        actions={<Button onClick={() => setLabelOnlyOpen(false)}>Close</Button>}
      >
        <Typography>
          This modal has no visual title. It uses <code>aria-label</code> for screen readers.
        </Typography>
      </Modal>

      {/* 5. Viewport margin + scrolling -------------------------------- */}
      <Typography variant='h3'>5. Viewport margin + scrolling</Typography>
      <Button onClick={() => setViewportMarginOpen(true)}>Open long content modal</Button>
      <Modal
        open={viewportMarginOpen}
        onClose={() => setViewportMarginOpen(false)}
        title='Long content'
        sx={{ '--valet-modal-viewport-margin': '1.5rem' }}
        fullWidth
        actions={<Button onClick={() => setViewportMarginOpen(false)}>Close</Button>}
      >
        <Stack
          pad={0}
          gap={1}
        >
          {Array.from({ length: 40 }).map((_, i) => (
            <Typography key={i}>Scrollable line {i + 1}</Typography>
          ))}
        </Stack>
      </Modal>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Modal'
      subtitle='Accessible overlay for dialogs and alerts with consistent sizing and actions.'
      slug='components/layout/modal'
      meta={ModalMeta}
      usage={usage}
    />
  );
}
