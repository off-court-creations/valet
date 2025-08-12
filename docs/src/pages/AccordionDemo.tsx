// ─────────────────────────────────────────────────────────────────────────────
// src/pages/AccordionDemoPage.tsx | valet-docs
// Comprehensive live demo for <Accordion/> – showcases single & multi-expand,
// controlled vs. uncontrolled, disabled items, heading levels, presets,
// and live theme coupling.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Surface, Stack, Typography, Button, Accordion, useTheme } from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Helpers                                                                    */
const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse porta, nunc at egestas mattis, mauris risus iaculis mi, at cursus metus justo quis quam.';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function AccordionDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  /* Controlled single-expand state -------------------------------------- */
  const [openSingle, setOpenSingle] = useState<number[]>([0]);

  /* Controlled multi-expand state --------------------------------------- */
  const [openMulti, setOpenMulti] = useState<number[]>([0, 2]);

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        {/* Header --------------------------------------------------------- */}
        <Typography
          variant='h2'
          bold
        >
          Accordion Showcase
        </Typography>
        <Typography>Smooth animations and unified chevron icons</Typography>
        <Button
          variant='outlined'
          size='sm'
          onClick={() => navigate('/accordion-constrained')}
        >
          Constrained height demo
        </Button>

        {/* 1. Uncontrolled disclosure list (single item) ------------------ */}
        <Typography variant='h3'>1. Uncontrolled (single-expand)</Typography>
        <Accordion>
          <Accordion.Item header='Item 1'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
          <Accordion.Item header='Item 2'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
          <Accordion.Item header='Item 3'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
        </Accordion>

        {/* 2. Controlled single-expand ------------------------------------ */}
        <Typography variant='h3'>2. Controlled (single-expand)</Typography>
        <Button
          size='sm'
          variant='outlined'
          onClick={() => setOpenSingle((prev) => (prev[0] === 1 ? [] : [1]))}
          style={{ alignSelf: 'flex-start' }}
        >
          Toggle second item programmatically
        </Button>
        <Accordion
          open={openSingle}
          onOpenChange={setOpenSingle}
        >
          <Accordion.Item header='First'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
          <Accordion.Item header='Second'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
          <Accordion.Item header='Third'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
        </Accordion>

        {/* 3. Controlled multi-expand ------------------------------------- */}
        <Typography variant='h3'>3. Controlled (multi-expand)</Typography>
        <Accordion
          multiple
          open={openMulti}
          onOpenChange={setOpenMulti}
        >
          <Accordion.Item header='Alpha'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
          <Accordion.Item header='Bravo'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
          <Accordion.Item header='Charlie'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
        </Accordion>

        {/* 4. Disabled items & preset styling ----------------------------- */}
        <Typography variant='h3'>4. Disabled & preset</Typography>
        <Accordion>
          <Accordion.Item header='Enabled'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
          <Accordion.Item
            header='Disabled'
            disabled
          >
            {/* Will never open */}
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
          <Accordion.Item header='Another enabled'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
        </Accordion>

        {/* 5. Custom heading level ---------------------------------------- */}
        <Typography variant='h3'>5. Custom heading level (h4)</Typography>
        <Accordion headingLevel={4}>
          <Accordion.Item header='Header rendered as h4'>
            <Typography>{LOREM}</Typography>
          </Accordion.Item>
        </Accordion>

        {/* 6. Live theme coupling ----------------------------------------- */}
        <Typography variant='h3'>6. Theme coupling</Typography>
        <Button
          variant='outlined'
          onClick={toggleMode}
        >
          Toggle light / dark mode
        </Button>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size='lg'
          onClick={() => navigate('/')}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
