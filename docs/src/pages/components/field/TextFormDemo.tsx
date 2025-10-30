// ─────────────────────────────────────────────────────────────
// docs/src/pages/components/field/TextFormDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – TextField and FormControl showcase
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Panel,
  Typography,
  Button,
  TextField,
  FormControl,
  useTheme,
  createFormStore,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import TextFieldMeta from '../../../../../src/components/fields/TextField.meta.json';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Local form store for the demo                                              */
interface ContactValues {
  name: string;
  email: string;
  message: string;
  [key: string]: unknown;
}

const useContactForm = createFormStore<ContactValues>({
  name: '',
  email: '',
  message: '',
});

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function TextFieldDemoPage() {
  const { theme, toggleMode } = useTheme();

  /* Stand-alone controlled example -------------------------------------- */
  const [username, setUsername] = useState('');
  const [age, setAge] = useState<number | ''>('');

  const usageContent = (
    <Stack gap={1}>
      <Typography variant='subtitle'>
        Stand-alone inputs, types, helpers, and fully-typed forms
      </Typography>

      {/* 1. Uncontrolled vs controlled */}
      <Typography variant='h3'>1. Uncontrolled vs controlled</Typography>
      <Stack>
        <TextField
          name='basic'
          placeholder='Uncontrolled'
          label='Uncontrolled input'
        />
        <TextField
          name='username'
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          label='Controlled username'
          helperText={`Value: “${username || '—'}”`}
          autoComplete='username'
        />
      </Stack>

      {/* 2. Common types */}
      <Typography variant='h3'>2. Common types</Typography>
      <Stack>
        <TextField
          name='email-demo'
          type='email'
          label='Email'
          placeholder='jane@example.com'
          autoComplete='email'
        />
        <TextField
          name='pwd'
          type='password'
          label='Password'
          autoComplete='new-password'
        />
        <TextField
          name='age'
          type='number'
          label='Age'
          min={0}
          max={120}
          step={1}
          value={age}
          onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))}
          helperText='Number input with min/max/step'
          sx={{ maxWidth: 200 }}
        />
      </Stack>

      {/* 3. Full width, sizing, disabled, error */}
      <Typography variant='h3'>3. Layout and states</Typography>
      <Stack direction='row'>
        <TextField
          name='full'
          fullWidth
          label='Full width'
          placeholder='Stretches to parent'
        />
        <TextField
          name='fixed'
          label='Fixed width'
          placeholder='width via sx'
          sx={{ width: 260 }}
        />
      </Stack>
      <Stack direction='row'>
        <TextField
          name='disabled'
          label='Disabled'
          disabled
          placeholder='—'
        />
        <TextField
          name='with-error'
          label='With error'
          error
          helperText='Something went wrong'
          placeholder='…'
        />
      </Stack>

      {/* 4. Multiline */}
      <Typography variant='h3'>4. Multiline (textarea)</Typography>
      <TextField
        name='message-demo'
        label='Message'
        as='textarea'
        rows={4}
        placeholder='Your message…'
      />

      {/* 5. FormControl integration */}
      <Typography variant='h3'>5. FormControl demo</Typography>
      <Typography variant='subtitle'>
        Note: FormControl prevents native form submission. Handle submit in onSubmitValues, and use
        new FormData(event.currentTarget) if you need files or non‑valet inputs.
      </Typography>
      <Panel
        variant='alt'
        sx={{ padding: theme.spacing(1) }}
      >
        <FormControl
          useStore={useContactForm}
          onSubmitValues={(vals) => alert(JSON.stringify(vals, null, 2))}
          sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(1) }}
        >
          <TextField
            name='name'
            label='Name'
            placeholder='Jane Doe'
            autoComplete='name'
          />
          <TextField
            name='email'
            label='Email'
            type='email'
            placeholder='jane@example.com'
            autoComplete='email'
          />
          <TextField
            name='message'
            label='Message'
            as='textarea'
            rows={4}
            placeholder='Your message…'
          />
          <Button
            type='submit'
            variant='contained'
          >
            Submit
          </Button>
        </FormControl>
      </Panel>

      {/* 6. Theme toggle */}
      <Typography variant='h3'>6. Theme coupling</Typography>
      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark mode
      </Button>
    </Stack>
  );

  return (
    <ComponentMetaPage
      title='TextField'
      subtitle='Stand-alone inputs, types, helper text, and forms'
      slug='components/fields/textfield'
      meta={TextFieldMeta}
      usage={usageContent}
    />
  );
}
