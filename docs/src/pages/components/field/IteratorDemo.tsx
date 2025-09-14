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
  const { theme, toggleMode } = useTheme();
  const [count, setCount] = useState(2);

  const usageContent = (
    <Stack>
      <Typography>
        The field will increment when scrolling up and decrement when scrolling down. Page scrolling
        is suppressed while hovering, including on Firefox.
      </Typography>

      <Typography variant='h3'>1. Uncontrolled</Typography>
      <Iterator defaultValue={3} />

      <Typography variant='h3'>2. Controlled</Typography>
      <Stack
        direction='row'
        sx={{ alignItems: 'center', gap: theme.spacing(1) }}
      >
        <Iterator
          value={count}
          onChange={setCount}
        />
        <Typography>Value: {count}</Typography>
      </Stack>

      <Typography variant='h3'>3. Min, max &amp; step</Typography>
      <Iterator
        min={0}
        max={10}
        step={2}
        defaultValue={4}
      />

      <Typography variant='h3'>4. Disabled</Typography>
      <Iterator
        defaultValue={5}
        disabled
      />

      <Typography variant='h3'>5. FormControl</Typography>
      <FormControl
        useStore={useFormStore}
        onSubmitValues={(vals) => alert(JSON.stringify(vals))}
      >
        <Stack
          direction='row'
          compact
        >
          <Iterator name='amount' />
          <Button type='submit'>Submit</Button>
        </Stack>
      </FormControl>

      <Typography variant='h3'>6. Theme toggle</Typography>
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
