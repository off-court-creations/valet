// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/primitives/ProgressDemo.tsx  | valet-docs
// Progress docs using ComponentMetaPage (Usage, Playground, Examples, Reference)
// ─────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import {
  Stack,
  Typography,
  IconButton,
  ProgressBar,
  ProgressRing,
  useTheme,
  Panel,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import ProgressMeta from '../../../../../src/components/primitives/Progress.meta.json';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function ProgressDemoPage() {
  const { theme } = useTheme();

  /* Controlled value / buffer ------------------------------------------- */
  const [value, setValue] = useState(40);
  const [buffer, setBuffer] = useState(60);

  /* Auto-increment animation just for show ------------------------------ */
  useEffect(() => {
    const id = window.setTimeout(() => {
      if (value < 100) {
        setValue((v) => Math.min(100, v + 1));
        setBuffer((b) => Math.min(100, b + 1.5));
      }
    }, 90);
    return () => clearTimeout(id);
  }, [value]);

  const reset = () => {
    setValue(0);
    setBuffer(25);
  };

  const usageContent = (
    <Stack gap={1}>
      {/* 1. Circular indeterminate ---------------------------------- */}
      <Panel
        fullWidth
        pad={1}
      >
        <Stack gap={1}>
          <Typography variant='h3'>1. Circular – indeterminate</Typography>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center', flexWrap: 'wrap' }}
          >
            <ProgressRing size='1rem' />
            <ProgressRing size='1.5rem' />
            <ProgressRing />
            <ProgressRing size='3rem' />
            <ProgressRing size='3.75rem' />
          </Stack>
        </Stack>
      </Panel>

      {/* 2. Circular determinate (controlled) ----------------------- */}
      <Panel
        fullWidth
        pad={1}
      >
        <Stack gap={1}>
          <Typography variant='h3'>2. Circular – determinate (controlled)</Typography>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            {/* Ring auto-sizes around its child IconButton */}
            <ProgressRing
              value={value}
              color={theme.colors['error']}
            >
              <IconButton
                icon='mdi:home'
                onClick={reset}
                aria-label='reset'
                size={48}
              />
            </ProgressRing>
          </Stack>
          <Stack
            direction='row'
            gap={1}
            sx={{ alignItems: 'center' }}
          >
            <ProgressRing
              value={value}
              label
            />
            <ProgressRing
              value={value}
              size='3rem'
              color={theme.colors['error']}
            />
          </Stack>
        </Stack>
      </Panel>

      {/* 3–5. Linear variants --------------------------------------- */}
      <Panel
        fullWidth
        pad={1}
      >
        <Stack gap={1}>
          <Typography variant='h3'>3. Linear – indeterminate</Typography>
          <ProgressBar />
          <Typography variant='h3'>4. Linear – determinate (controlled)</Typography>
          <Stack gap={1}>
            <ProgressBar value={value} />
            <ProgressBar
              value={value}
              height={8}
            />
          </Stack>
          <Typography variant='h3'>5. Linear – buffer</Typography>
          <ProgressBar
            value={value}
            buffer={buffer}
          />
        </Stack>
      </Panel>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Progress'
      subtitle='Circular and linear progress with determinate, indeterminate, and buffer modes.'
      slug='components/primitives/progress'
      meta={ProgressMeta}
      usage={usageContent}
    />
  );
}
