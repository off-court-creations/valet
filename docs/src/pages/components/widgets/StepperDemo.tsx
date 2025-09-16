// docs/src/pages/components/widgets/StepperDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – usage with navigation controls
import { useState } from 'react';
import { Stack, Button, Stepper, useTheme } from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import StepperMeta from '../../../../../src/components/widgets/Stepper.meta.json';

export default function StepperDemoPage() {
  const { toggleMode } = useTheme();
  const [active, setActive] = useState(0);
  const steps = ['First', 'Second', 'Third'];

  const usage = (
    <Stack>
      <Stepper
        steps={steps}
        active={active}
      />
      <Stack direction='row'>
        <Button onClick={() => setActive((a) => Math.max(0, a - 1))}>Back</Button>
        <Button onClick={() => setActive((a) => Math.min(steps.length - 1, a + 1))}>Next</Button>
      </Stack>
      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark
      </Button>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='Stepper'
      subtitle='Linear progress navigation with steps'
      slug='components/widgets/stepper'
      meta={StepperMeta}
      usage={usage}
    />
  );
}
