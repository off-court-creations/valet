// ─────────────────────────────────────────────────────────────
// src/pages/TextFormDemo.tsx  | valet-docs
// TextField and FormControl showcase
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Panel,
  Typography,
  Button,
  TextField,
  FormControl,
  useTheme,
  createFormStore,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';

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
  const navigate = useNavigate();

  /* Stand-alone controlled example -------------------------------------- */
  const [username, setUsername] = useState('');

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        {/* Page header --------------------------------------------------- */}
        <Typography
          variant='h2'
          bold
        >
          TextField &amp; FormControl Showcase
        </Typography>
        <Typography variant='subtitle'>
          Stand-alone inputs, presets, and fully-typed forms
        </Typography>

        {/* 1. Basic stand-alone fields ---------------------------------- */}
        <Typography variant='h3'>1. Stand-alone TextField</Typography>
        <Stack>
          {/* uncontrolled */}
          <TextField
            name='basic'
            placeholder='Uncontrolled'
          />

          {/* controlled */}
          <TextField
            name='username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            label='Controlled username'
            // helperText={`Value: “${username || '—'}”`}
          />

          {/* error state */}
          <TextField
            name='invalid'
            label='With error'
            error
            helperText='Something went wrong'
            placeholder='…'
          />
        </Stack>

        {/* 2. TextFields inside a FormControl --------------------------- */}
        <Typography variant='h3'>2. FormControl demo</Typography>
        <Panel
          variant='alt'
          style={{ padding: theme.spacing(1) }}
        >
          <FormControl
            useStore={useContactForm}
            onSubmitValues={(vals) => alert(JSON.stringify(vals, null, 2))}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: theme.spacing(1),
            }}
          >
            <TextField
              name='name'
              label='Name'
              placeholder='Jane Doe'
            />
            <TextField
              name='email'
              label='Email'
              type='email'
              placeholder='jane@example.com'
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

        {/* 3. Theme toggle ---------------------------------------------- */}
        <Typography variant='h3'>3. Theme coupling</Typography>
        <Button
          variant='outlined'
          onClick={toggleMode}
        >
          Toggle light / dark mode
        </Button>

        {/* Back nav ------------------------------------------------------ */}
        <Button
          size='lg'
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
