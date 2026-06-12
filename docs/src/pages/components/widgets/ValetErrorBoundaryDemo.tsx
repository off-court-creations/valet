// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/widgets/ValetErrorBoundaryDemo.tsx  | valet-docs
// ValetErrorBoundary docs using ComponentMetaPage (Usage, Reference)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Stack, Typography, Button, ValetErrorBoundary } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import ErrorBoundaryMeta from '../../../../../src/components/widgets/ValetErrorBoundary.meta.json';

function Bomb({ armed }: { armed: boolean }) {
  if (armed) {
    throw new Error('Demo explosion — thrown on purpose from <Bomb />.');
  }
  return <Typography>All good — flip the switch to throw inside the boundary.</Typography>;
}

export default function ErrorBoundaryDemoPage() {
  const [armed, setArmed] = useState(false);

  const usageContent = (
    <Stack>
      <Typography variant='h3'>Opt-in error containment</Typography>
      <Typography>
        valet components fail loudly by design — a component rendered outside its required
        context throws an enriched error naming the component and the fix. Wrap a subtree in
        <code> ValetErrorBoundary</code> when you want those failures contained to a region of
        the page instead of unmounting the whole app. The fallback renders with
        <code> role=&quot;alert&quot;</code> and a retry button wired to <code>reset()</code>.
      </Typography>
      <Button onClick={() => setArmed(true)}>Throw inside the boundary</Button>
      <ValetErrorBoundary
        fallback={({ error, reset }) => (
          <div role='alert'>
            <Typography>{error.message}</Typography>
            <Button
              onClick={() => {
                setArmed(false);
                reset();
              }}
            >
              Disarm and retry
            </Button>
          </div>
        )}
      >
        <Bomb armed={armed} />
      </ValetErrorBoundary>
      <Typography variant='subtitle'>
        The boundary uses no styled() or theme machinery internally, so it still renders when
        the failure is the theme/Surface context itself.
      </Typography>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='ValetErrorBoundary'
      subtitle='Opt-in boundary that contains valet&apos;s enriched component errors'
      name='ValetErrorBoundary'
      meta={ErrorBoundaryMeta}
      usage={usageContent}
    />
  );
}
