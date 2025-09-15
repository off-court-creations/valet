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
          bold
        >
          Free-form layout – no internal flex
        </Typography>
      </Snackbar>

      {/* 4. Theme coupling --------------------------------------------- */}
      <Typography variant='h3'>4. Theme coupling</Typography>
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
  const [pgMessage, setPgMessage] = useState('Saved!');

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
              onChange={setPgControlled}
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
              onChange={setPgOpen}
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
              onChange={(n) => setPgAutoHide(Math.max(0, Math.round(n)) || 0)}
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
              onChange={setPgNoStack}
              aria-label='noStack'
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
          onClick={() => setPgOpen(true)}
          sx={{ alignSelf: 'flex-start' }}
        >
          Trigger snackbar
        </Button>
        <Snackbar
          message={pgMessage}
          autoHideDuration={pgAutoHide}
          noStack={pgNoStack}
          onClose={() => setPgOpen(false)}
          {...(pgControlled ? { open: pgOpen } : {})}
        />
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
