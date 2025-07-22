// ─────────────────────────────────────────────────────────────
// src/pages/FormDemoPage.tsx  | valet
// Party planner form replicating RichChat questions
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Surface,
  Box,
  Stack,
  Typography,
  Button,
  TextField,
  Checkbox,
  DateSelector,
  Iterator,
  FormControl,
  createFormStore,
  definePreset,
  useTheme,
} from '@archway/valet';
import NavDrawer from '../components/NavDrawer';

/*───────────────────────────────────────────────────────────────*/
/* 1.  Create a typed store for this form                        */
interface PartyValues {
  scheduled: boolean;
  date: string;
  age: number;
  childName: string;
  kids: number;
}
const usePartyForm = createFormStore<PartyValues>({
  scheduled: false,
  date: '',
  age: 7,
  childName: '',
  kids: 15,
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
  const [submitted, setSubmitted] = useState<PartyValues | null>(null);

  return (
    <Surface style={{ backgroundColor: theme.colors['background'] }}>
      <NavDrawer />
      <Box preset="cardForm">
        <Typography variant="h3" style={{ marginBottom: theme.spacing(1) }}>
          Party Planner Form
        </Typography>

        <FormControl
          useStore={usePartyForm}
          // <- custom callback passes (values, event)
          onSubmitValues={(values) => {
            console.log('FORM SUBMIT', values);
            setSubmitted(values);
          }}
        >
          <Stack>
            <Checkbox
              name="scheduled"
              label="Do you have a party scheduled?"
            />

            <Stack>
              <Typography bold>When is the party?</Typography>
              <DateSelector name="date" />
            </Stack>

            <Stack direction="row" style={{ alignItems: 'center' }}>
              <Typography bold>How old is your child turning?</Typography>
              <Iterator name="age" min={1} max={12} />
            </Stack>

            <TextField
              name="childName"
              label="What is your child's name?"
              preset="underlineField"
            />

            <Stack direction="row" style={{ alignItems: 'center' }}>
              <Typography bold>How many kids are coming?</Typography>
              <Iterator name="kids" min={5} max={45} step={5} />
            </Stack>

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
