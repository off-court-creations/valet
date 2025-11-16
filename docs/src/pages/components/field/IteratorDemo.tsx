// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/field/IteratorDemo.tsx  | valet-docs
// Ported to meta-driven docs template (Usage/Reference via MCP)
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Typography,
  Button,
  Iterator,
  FormControl,
  createFormStore,
  useTheme,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import IteratorMeta from '../../../../../src/components/fields/Iterator.meta.json';

/*───────────────────────────────────────────────────────────*/
interface FormVals extends Record<string, unknown> {
  amount: number;
}
const useFormStore = createFormStore<FormVals>({ amount: 1 });

export default function IteratorDemoPage() {
  const { toggleMode } = useTheme();
  const [count, setCount] = useState(2);
  const [countCommit, setCountCommit] = useState(2);
  const [commitOnChange, setCommitOnChange] = useState(false);

  const usageContent = (
    <Stack>
      <Typography>
        By default, the field steps with the mouse wheel only when focused. Set
        <code> wheelBehavior=&#39;hover&#39; </code>
        to step while hovering (page scrolling is suppressed while hovered, including on Firefox).
      </Typography>

      <Typography variant='h3'>1. Uncontrolled</Typography>
      <Iterator defaultValue={3} />

      <Typography variant='h3'>2. Controlled (live vs commit)</Typography>
      <Stack
        direction='row'
        gap={1}
        pad={0}
      >
        <Iterator
          value={count}
          onValueChange={(v) => (commitOnChange ? setCount(v) : setCount(v))}
          onValueCommit={(v) => setCountCommit(v)}
          commitOnChange={commitOnChange}
        />
        <Typography>live: {count}</Typography>
        <Typography>commit: {countCommit}</Typography>
      </Stack>
      <Stack
        direction='row'
        gap={0.5}
        sx={{ alignItems: 'center' }}
      >
        <Typography variant='subtitle'>commitOnChange</Typography>
        <Iterator
          value={commitOnChange ? 1 : 0}
          min={0}
          max={1}
          step={1}
          onValueCommit={(v) => setCommitOnChange(v === 1)}
        />
      </Stack>

      <Typography variant='h3'>3. Min, max &amp; step</Typography>
      <Iterator
        min={0}
        max={10}
        step={2}
        defaultValue={4}
      />

      <Typography variant='h3'>4. Wheel behavior</Typography>
      <Iterator
        defaultValue={2}
        wheelBehavior='hover'
      />

      <Typography variant='h3'>5. Disabled</Typography>
      <Iterator
        defaultValue={5}
        disabled
      />

      <Typography variant='h3'>6. FormControl</Typography>
      <Typography variant='subtitle'>
        Note: FormControl prevents native submission. Use onSubmitValues; merge new
        FormData(event.currentTarget) if you need files or non‑valet inputs.
      </Typography>
      <FormControl
        useStore={useFormStore}
        onSubmitValues={(vals) => alert(JSON.stringify(vals))}
      >
        <Stack
          direction='row'
          gap={1}
          pad={0}
        >
          <Iterator name='amount' />
          <Button type='submit'>Submit</Button>
        </Stack>
      </FormControl>

      <Typography variant='h3'>7. Theme toggle</Typography>
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
      title='Iterator'
      subtitle='Compact numeric stepper with scroll and buttons'
      slug='components/fields/iterator'
      meta={IteratorMeta}
      usage={usageContent}
    />
  );
}
