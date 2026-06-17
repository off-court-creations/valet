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

const useConfigForm = createFormStore({ name: '', email: '' });

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function TextFieldDemoPage() {
  const { theme, toggleMode } = useTheme();

  /* Stand-alone controlled example -------------------------------------- */
  const [username, setUsername] = useState('');
  const [usernameCommit, setUsernameCommit] = useState('');
  const [age, setAge] = useState<number | ''>('');
  const [formDisabled, setFormDisabled] = useState(false);

  const usageContent = (
    <Stack gap={1}>
      <Typography variant='subtitle'>
        Stand-alone inputs, types, helpers, and fully-typed forms
      </Typography>

      {/* 1. Uncontrolled vs controlled */}
      <Typography variant='h3'>1. Uncontrolled vs controlled (commit on blur/Enter)</Typography>
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
          onValueCommit={(v) => setUsernameCommit(v)}
          label='Controlled username'
          helperText={`live: “${username || '—'}” | commit: “${usernameCommit || '—'}”`}
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

      {/* 3. Width model + sizes + states */}
      <Typography variant='h3'>3. Width, sizes, and states</Typography>
      <Typography variant='subtitle'>
        Fills its container by default; constrain with the <code>width</code> prop, or
        <code> fullWidth</code> to grow in a row.
      </Typography>
      <Stack
        direction='row'
        align='end'
      >
        <TextField
          name='full'
          fullWidth
          label='fullWidth (grows)'
          placeholder='Stretches to fill the row'
        />
        <TextField
          name='fixed'
          label="width='12ch'"
          width='12ch'
          placeholder='fixed'
        />
      </Stack>

      <Typography variant='subtitle'>Size scale (md aligns with Button height)</Typography>
      {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
        <TextField
          key={s}
          name={`size-${s}`}
          size={s}
          label={`size='${s}'`}
          defaultValue='Sample'
        />
      ))}

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
          helperText='We never share it.'
          errorText='Enter a valid value.'
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
        variant='outlined'
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
            variant='filled'
          >
            Submit
          </Button>
        </FormControl>
      </Panel>

      {/* 5b. Form-wide disabled + errors (FormConfigCtx) */}
      <Typography variant='h3'>5b. Form-wide disabled &amp; errors</Typography>
      <Typography variant='subtitle'>
        A <code>FormControl</code> can disable every field at once and surface name-keyed
        <code> errors</code> (each field&apos;s own props still win). The errored field shows a
        <code> role=&quot;alert&quot;</code> message and is focused after submit.
      </Typography>
      <Button
        variant='outlined'
        onClick={() => setFormDisabled((d) => !d)}
      >
        {formDisabled ? 'Enable form' : 'Disable form'}
      </Button>
      <Panel
        variant='outlined'
        sx={{ padding: theme.spacing(1) }}
      >
        <FormControl
          useStore={useConfigForm}
          disabled={formDisabled}
          errors={{ email: 'That email is already taken.' }}
          sx={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(1) }}
        >
          <TextField
            name='name'
            label='Name'
          />
          <TextField
            name='email'
            label='Email'
            type='email'
          />
          <Button type='submit'>Save</Button>
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
