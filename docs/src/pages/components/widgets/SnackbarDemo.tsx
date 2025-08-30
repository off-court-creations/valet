// ─────────────────────────────────────────────────────────────────────────────
// src/pages/SnackbarDemoPage.tsx | valet-docs
// Comprehensive live demo for <Snackbar/>
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
  Tabs,
  Table,
  Panel,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';

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
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  /* Demo state ----------------------------------------------------------- */
  const [autoOpen, setAutoOpen] = useState(false);
  const [ctrlOpen, setCtrlOpen] = useState(false);
  const [noStackOpen, setNoStackOpen] = useState(false);

  interface Row {
    prop: ReactNode;
    type: ReactNode;
    default: ReactNode;
    description: ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop: <code>open</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Controlled visibility flag',
    },
    {
      prop: <code>onClose</code>,
      type: <code>{'() => void'}</code>,
      default: <code>—</code>,
      description: 'Called when fully hidden',
    },
    {
      prop: <code>autoHideDuration</code>,
      type: <code>number | null</code>,
      default: <code>4000</code>,
      description: 'Dismiss after N ms',
    },
    {
      prop: <code>message</code>,
      type: <code>React.ReactNode</code>,
      default: <code>—</code>,
      description: 'Convenience message',
    },
    {
      prop: <code>noStack</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Disable flex layout',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>—</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        {/* Header --------------------------------------------------------- */}
        <Typography
          variant='h2'
          bold
        >
          Snackbar Showcase
        </Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
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
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Typography variant='h3'>Prop reference</Typography>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>

        {/* Best Practices -------------------------------------------------- */}
        <Panel fullWidth>
          <Typography variant='h4'>Best Practices</Typography>
          <Typography>
            - Keep messages short and specific. Snackbars confirm actions or provide brief status;
            avoid long instructions or multi‑step interactions.
          </Typography>
          <Typography>
            - Provide a single, clear action. If an action is present, use a short verb (e.g.,
            &apos;Undo&apos;). Avoid multiple competing actions.
          </Typography>
          <Typography>
            - Respect motion and timing. Use <code>autoHideDuration</code> for transient messages
            (3–6s typical); longer durations should be deliberate.
          </Typography>
          <Typography>
            - Don’t stack excessively. Keep concurrent snackbars minimal; if necessary, queue them
            and ensure important ones aren’t missed.
          </Typography>
          <Typography>
            - Keep focus behavior intact. Snackbars are non‑modal; they should not steal focus. If a
            button is provided, ensure it is reachable via keyboard.
          </Typography>
          <Typography>
            - Style via tokens/presets. Use theme colors for status (e.g.,
            <code> primary</code>/<code> error</code>) and consolidate variants with
            <code> preset</code>.
          </Typography>
        </Panel>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
