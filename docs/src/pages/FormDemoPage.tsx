// src/pages/FormDemoPage.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Surface,
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  FormControl,
  createFormStore,
  definePreset,
  useTheme,
} from '@archway/valet';
import NavDrawer from '../components/NavDrawer';

/*───────────────────────────────────────────────────────────────*/
/* 1.  Create a typed store for this form                        */
interface ContactValues {
  name: string;
  email: string;
  message: string;
}
const useContactForm = createFormStore<ContactValues>({
  name: '',
  email: '',
  message: '',
});

/*───────────────────────────────────────────────────────────────*/
/* 2.  Optional style presets for a quick themed look            */
definePreset('cardForm', (t) => `
  background:${t.colors['primary']};
  border-radius:16px;
  padding:${t.spacing(1)};
`);

definePreset('underlineField', (t) => `
  input {
    border:none !important;
    border-bottom:2px solid ${t.colors['primary']}55 !important;
    border-radius:0 !important;
  }
`);

/*───────────────────────────────────────────────────────────────*/
/* 3.  Demo page component                                       */
export default function FormDemoPage() {
  const { theme } = useTheme();
  const navigate  = useNavigate();
  const [submitted, setSubmitted] = useState<ContactValues | null>(null);

  return (
    <Surface style={{ backgroundColor: theme.colors['background'] }}>
      <NavDrawer />
      <Box preset="cardForm">
        <Typography variant="h3" style={{ marginBottom: theme.spacing(1) }}>
          Contact Form Demo
        </Typography>

        <FormControl
          useStore={useContactForm}
          // <- custom callback passes (values, event)
          onSubmitValues={(values) => {
            console.log('FORM SUBMIT', values);
            setSubmitted(values);
          }}
        >
          <Stack>
            <TextField
              name="name"
              label="Name"
              autoFocus
              preset="underlineField"
            />

            <TextField
              name="email"
              label="Email"
              type="email"
              helperText="We'll never share your email."
              preset="underlineField"
            />

            <TextField
              name="message"
              label="Message"
              as="textarea"
              rows={4}
              helperText="Max 500 chars"
              preset="underlineField"
            />

            <Button type="submit" variant='contained' size="lg">
              Send
            </Button>
          </Stack>
        </FormControl>
      </Box>

      {/* Echo submitted payload */}
      {submitted && (
        <Box style={{ padding: theme.spacing(1) }}>
          <Typography variant="h4">Server Echo</Typography>
          <pre style={{ color: theme.colors['text'] }}>
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </Box>
      )}

      {/* Nav back */}
      <Stack direction="row" style={{ padding: theme.spacing(1) }}>
        <Button variant="contained" size="lg" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Stack>
    </Surface>
  );
}
