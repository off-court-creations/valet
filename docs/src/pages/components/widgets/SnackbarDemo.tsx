// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/SnackbarDemo.tsx  | valet-docs
// Snackbar docs using ComponentMetaPage (Usage, Playground, Examples, Reference)
// ─────────────────────────────────────────────────────────────
import React, { useState } from 'react';
import {
  Stack,
  Typography,
  Button,
  Snackbar,
  useSnackbar,
  useTheme,
  Panel,
  Iterator,
  Switch,
  TextField,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import SnackbarMeta from '../../../../../src/components/widgets/Snackbar.meta.json';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Helpers                                                                    */
const DismissBtn: React.FC = () => {
  const close = useSnackbar();
  if (!close) return null;
  return (
    <Button
      size='sm'
      variant='outlined'
      onClick={close}
    >
      Dismiss
    </Button>
  );
};

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                   */
export default function SnackbarDemoPage() {
  const { toggleMode } = useTheme();

  /* Demo state ----------------------------------------------------------- */
  const [autoOpen, setAutoOpen] = useState(false);
  const [ctrlOpen, setCtrlOpen] = useState(false);
  const [noStackOpen, setNoStackOpen] = useState(false);
  const [filledOpen, setFilledOpen] = useState(false);

  const usageContent = (
    <Stack>
      {/* 1. Uncontrolled auto-hide -------------------------------------- */}
      <Typography variant='h3'>1. Uncontrolled (auto-hide)</Typography>
      <Button
        size='sm'
        onClick={() => setAutoOpen(true)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Trigger auto-hide snackbar
      </Button>
      {autoOpen && (
        <Snackbar
          message='Profile saved successfully!'
          onClose={() => setAutoOpen(false)}
        />
      )}

      {/* 2. Controlled snackbar ---------------------------------------- */}
      <Typography variant='h3'>2. Controlled (manual dismiss)</Typography>
      <Button
        size='sm'
        variant='outlined'
        onClick={() => setCtrlOpen(true)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Trigger controlled snackbar
      </Button>
      <Snackbar
        open={ctrlOpen}
        onClose={() => setCtrlOpen(false)}
      >
        <Stack
          direction='row'
          wrap={false}
        >
          <Typography
            variant='body'
            autoSize
          >
            Draft saved – click to dismiss
          </Typography>
          <DismissBtn />
        </Stack>
      </Snackbar>

      {/* 3. noStack layout --------------------------------------------- */}
      <Typography variant='h3'>3. Custom layout (noStack)</Typography>
      <Button
        size='sm'
        variant='outlined'
        onClick={() => setNoStackOpen(true)}
        sx={{ alignSelf: 'flex-start' }}
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
        <Typography
          variant='body'
          autoSize
          weight='bold'
        >
          Free-form layout – no internal flex
        </Typography>
      </Snackbar>

      {/* 4. Filled variant --------------------------------------------- */}
      <Typography variant='h3'>4. Filled variant</Typography>
      <Typography variant='subtitle'>
        <code>variant=&quot;outline&quot;</code> (default) is a quiet card with a primary keyline;{' '}
        <code>variant=&quot;filled&quot;</code> is a solid primary surface for more emphasis.
      </Typography>
      <Button
        size='sm'
        onClick={() => setFilledOpen(true)}
        sx={{ alignSelf: 'flex-start' }}
      >
        Trigger filled snackbar
      </Button>
      {filledOpen && (
        <Snackbar
          variant='filled'
          message='Changes published.'
          onClose={() => setFilledOpen(false)}
        />
      )}

      {/* 5. Theme coupling --------------------------------------------- */}
      <Typography variant='h3'>5. Theme coupling</Typography>
      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark mode
      </Button>
    </Stack>
  );

  // Playground -------------------------------------------------------------
  const [pgControlled, setPgControlled] = useState(false);
  const [pgOpen, setPgOpen] = useState(false);
  const [pgAutoHide, setPgAutoHide] = useState<number | null>(4000);
  const [pgNoStack, setPgNoStack] = useState(false);
  const [pgFilled, setPgFilled] = useState(false);
  const [pgMessage, setPgMessage] = useState('Saved!');
  /* Uncontrolled re-trigger: an uncontrolled Snackbar shows on mount and
     self-dismisses, so each trigger remounts a fresh one via this key. */
  const [pgNonce, setPgNonce] = useState(0);
  const triggerPg = () => (pgControlled ? setPgOpen(true) : setPgNonce((n) => n + 1));

  const playgroundContent = (
    <Stack gap={1}>
      <Panel fullWidth>
        <Stack
          direction='row'
          gap={1}
          sx={{ alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>controlled</Typography>
            <Switch
              checked={pgControlled}
              onValueChange={(v) => setPgControlled(!!v)}
              aria-label='controlled'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>open</Typography>
            <Switch
              checked={pgOpen}
              onValueChange={(v) => setPgOpen(!!v)}
              aria-label='open'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>autoHideDuration</Typography>
            <Iterator
              width={160}
              min={0}
              max={10000}
              step={500}
              value={pgAutoHide ?? 0}
              onValueChange={(n) => setPgAutoHide(Math.max(0, Math.round(n)) || 0)}
              aria-label='autoHideDuration'
            />
            <Button
              size='sm'
              variant='outlined'
              onClick={() => setPgAutoHide(null)}
            >
              Disable auto-hide
            </Button>
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>noStack</Typography>
            <Switch
              checked={pgNoStack}
              onValueChange={(v) => setPgNoStack(!!v)}
              aria-label='noStack'
            />
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <Typography variant='subtitle'>filled</Typography>
            <Switch
              checked={pgFilled}
              onValueChange={(v) => setPgFilled(!!v)}
              aria-label='filled'
            />
          </Stack>
          <TextField
            name='message'
            label='message'
            value={pgMessage}
            onChange={(e) => setPgMessage((e.target as HTMLInputElement).value)}
            sx={{ width: 240 }}
          />
        </Stack>
      </Panel>
      <Panel fullWidth>
        <Button
          size='sm'
          onClick={triggerPg}
          sx={{ alignSelf: 'flex-start' }}
        >
          Trigger snackbar
        </Button>
        {pgControlled ? (
          <Snackbar
            open={pgOpen}
            message={pgMessage}
            variant={pgFilled ? 'filled' : 'outline'}
            autoHideDuration={pgAutoHide}
            noStack={pgNoStack}
            onClose={() => setPgOpen(false)}
          />
        ) : pgNonce > 0 ? (
          <Snackbar
            key={pgNonce}
            message={pgMessage}
            variant={pgFilled ? 'filled' : 'outline'}
            autoHideDuration={pgAutoHide}
            noStack={pgNoStack}
          />
        ) : null}
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Snackbar'
      subtitle='Theme-aware snackbar with controlled and auto-hide modes, and dismiss context.'
      slug='components/widgets/snackbar'
      meta={SnackbarMeta}
      usage={usageContent}
      playground={playgroundContent}
    />
  );
}
