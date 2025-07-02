// ─────────────────────────────────────────────────────────────────────────────
// src/pages/CheckboxDemoPage.tsx
// Full-feature showcase for <Checkbox /> – uncontrolled, controlled,
// form-bound, sizes, disabled, and live theme coupling.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Checkbox,
  FormControl,
  createFormStore,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Local form store for demo                                                  */
const useSignupForm = createFormStore({
  terms: false,
  marketing: true,
});

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function CheckboxDemoPage() {
  const { theme, toggleMode } = useTheme();     // live theme switch
  const navigate              = useNavigate();

  /* Controlled example state --------------------------------------------- */
  const [newsletter, setNewsletter] = useState(false);

  /* Form submit handler --------------------------------------------------- */
  const handleSubmit = (values: { terms: boolean; marketing: boolean }) => {
    // eslint-disable-next-line no-alert – demo purposes only
    alert(JSON.stringify(values, null, 2));
  };

  return (
    <Surface /* Surface already defaults to theme background */>
      <Stack
        spacing="lg"
        preset="showcaseStack"
      >
        {/* Page header ----------------------------------------------------- */}
        <Typography variant="h2" bold>
          Checkbox Showcase
        </Typography>
        <Typography variant="subtitle">
          Every prop, every trick, all in one place
        </Typography>

        {/* 1. Uncontrolled -------------------------------------------------- */}
        <Typography variant="h3">1. Uncontrolled</Typography>
        <Stack spacing="md">
          <Checkbox name="uc1" label="Default unchecked" />
          <Checkbox
            name="uc2"
            defaultChecked
            label="Default checked (defaultChecked)"
          />
        </Stack>

        {/* 2. Controlled ---------------------------------------------------- */}
        <Typography variant="h3">2. Controlled</Typography>
        <Checkbox
          name="newsletter"
          checked={newsletter}
          onChange={(next) => setNewsletter(next)}
          label={`Receive newsletter – ${newsletter ? 'yes' : 'no'}`}
        />

        {/* 3. Sizes --------------------------------------------------------- */}
        <Typography variant="h3">3. Sizes</Typography>
        <Stack spacing="md">
          <Checkbox name="sm" size="sm" defaultChecked label="size='sm'" />
          <Checkbox name="md" size="md" defaultChecked label="size='md'" />
          <Checkbox name="lg" size="lg" defaultChecked label="size='lg'" />
        </Stack>

        {/* 4. Disabled ------------------------------------------------------ */}
        <Typography variant="h3">4. Disabled</Typography>
        <Stack spacing="md">
          <Checkbox
            name="d1"
            defaultChecked
            disabled
            label="disabled & checked"
          />
          <Checkbox name="d2" disabled label="disabled & unchecked" />
        </Stack>

        {/* 5. FormControl integration -------------------------------------- */}
        <Typography variant="h3">5. FormControl Binding</Typography>
        <FormControl
          useStore={useSignupForm}
          onSubmitValues={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing['md'] }}
        >
          <Checkbox
            name="terms"
            label="I agree to the Terms of Service"
          />
          <Checkbox
            name="marketing"
            defaultChecked
            label="Send me marketing emails"
          />
          <Button type="submit" variant="contained" size="lg">
            Submit
          </Button>
        </FormControl>

        {/* 6. Live theme validation ---------------------------------------- */}
        <Typography variant="h3">6. Theme coupling</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark mode
        </Button>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing['lg'] }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
