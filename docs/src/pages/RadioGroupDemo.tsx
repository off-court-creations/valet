// ─────────────────────────────────────────────────────────────────────────────
// src/pages/RadioGroupDemoPage.tsx
// Full-feature playground showcase for <RadioGroup /> + <Radio />
// – Uncontrolled, controlled, sizes, disabled, row vs column, presets,
//   FormControl binding, keyboard navigation, and live theme validation.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  RadioGroup,
  Radio,
  FormControl,
  createFormStore,
  definePreset,
  useTheme,
} from '@archway/valet';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Style Presets                                                              */
/*  Chip-style radios (pill background, hover/selected colour swap)           */
definePreset('chipRadio', (t) => `
  padding         : ${t.spacing(1)} ${t.spacing(1)};
  border-radius   : 9999px;
  background      : ${t.colors['backgroundAlt']};
  transition      : background 0.2s ease, color 0.2s ease, filter 0.2s ease;
  &:hover:not([disabled]) {
    background    : ${t.colors['primary']};
    color         : ${t.colors['primaryText']};
  }
  &[data-checked="true"] {
    background    : ${t.colors['primary']};
    color         : ${t.colors['primaryText']};
    filter        : brightness(1.15);
  }
`);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Local form store for demo                                                  */
const useSurveyForm = createFormStore({
  color  : 'red',
  pet    : 'cat',
});

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function RadioGroupDemoPage() {
  const { theme, toggleMode } = useTheme();       // live theme switch
  const navigate              = useNavigate();

  /* Controlled example state --------------------------------------------- */
  const [shipping, setShipping] = useState<'standard' | 'express'>('standard');

  /* Form submit handler --------------------------------------------------- */
  const handleSubmit = (values: { color: string; pet: string }) => {
    // eslint-disable-next-line no-alert – demo purposes only
    alert(JSON.stringify(values, null, 2));
  };

  return (
    <Surface>
      <NavDrawer />
      <Stack
        preset="showcaseStack"
      >
        {/* Page header ----------------------------------------------------- */}
        <Typography variant="h2" bold>
          Radio Group Showcase
        </Typography>
        <Typography variant="subtitle">
          Every prop, every trick, all in one place
        </Typography>

        {/* 1. Uncontrolled -------------------------------------------------- */}
        <Typography variant="h3">1. Uncontrolled</Typography>
        <RadioGroup defaultValue="apple">
          <Radio value="apple"  label="Apple" />
          <Radio value="banana" label="Banana" />
          <Radio value="peach"  label="Peach" />
        </RadioGroup>

        {/* 2. Controlled ---------------------------------------------------- */}
        <Typography variant="h3">2. Controlled</Typography>
        <RadioGroup
          value={shipping}
          onChange={(val) => setShipping(val as 'standard' | 'express')}
          row
        >
          <Radio value="standard" label="Standard (3-5 days)" />
          <Radio value="express"  label="Express (24 hr)" />
        </RadioGroup>
        <Typography>
          Current selection:&nbsp;
          <b>{shipping === 'standard' ? 'Standard' : 'Express'}</b>
        </Typography>

        {/* 3. Sizes --------------------------------------------------------- */}
        <Typography variant="h3">3. Sizes</Typography>
        <Stack direction="row">
          <RadioGroup defaultValue="sm" size="sm">
            <Radio value="sm" label="size='sm'" />
            <Radio value="sm2" label="size='sm'" />
            <Radio value="sm3" label="size='sm'" />
          </RadioGroup>
          <RadioGroup defaultValue="md" size="md">
            <Radio value="md" label="size='md'" />
            <Radio value="md2" label="size='md'" />
            <Radio value="md3" label="size='md'" />
          </RadioGroup>
          <RadioGroup defaultValue="lg" size="lg">
            <Radio value="lg" label="size='lg'" />
            <Radio value="lg2" label="size='lg'" />
            <Radio value="lg3" label="size='lg'" />
          </RadioGroup>
        </Stack>

        {/* 4. Disabled ------------------------------------------------------ */}
        <Typography variant="h3">4. Disabled</Typography>
        <RadioGroup defaultValue="option1" row>
          <Radio value="option1" label="Enabled" />
          <Radio value="option2" label="Disabled" disabled />
          <Radio value="option3" label="Also disabled" disabled />
        </RadioGroup>

        {/* 5. Row vs Column ------------------------------------------------- */}
        <Typography variant="h3">5. Row orientation</Typography>
        <RadioGroup defaultValue="visa" row>
          <Radio value="visa"   label="Visa" />
          <Radio value="amex"   label="AMEX" />
          <Radio value="paypal" label="PayPal" />
        </RadioGroup>

        {/* 6. Presets (chip style) ----------------------------------------- */}
        <Typography variant="h3">6. Presets</Typography>
        <RadioGroup defaultValue="dog" row>
          <Radio value="dog"  preset="chipRadio" label="Dog"  />
          <Radio value="cat"  preset="chipRadio" label="Cat"  />
          <Radio value="bird" preset="chipRadio" label="Bird" />
        </RadioGroup>

        {/* 7. FormControl binding ------------------------------------------ */}
        <Typography variant="h3">7. FormControl Binding</Typography>
        <FormControl
          useStore={useSurveyForm}
          onSubmitValues={handleSubmit}
          style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing(1) }}
        >
          <Typography bold>Favourite colour?</Typography>
          <RadioGroup name="color" row>
            <Radio value="red"    preset="chipRadio" label="Red" />
            <Radio value="green"  preset="chipRadio" label="Green" />
            <Radio value="blue"   preset="chipRadio" label="Blue" />
          </RadioGroup>

          <Typography bold>Spirit animal?</Typography>
          <RadioGroup name="pet">
            <Radio value="cat"  label="Cat" />
            <Radio value="dog"  label="Dog" />
            <Radio value="fox"  label="Fox" />
          </RadioGroup>

          <Button type="submit" variant="contained" size="lg">
            Submit
          </Button>
        </FormControl>

        {/* 8. Live theme validation ---------------------------------------- */}
        <Typography variant="h3">8. Theme coupling</Typography>
        <Button variant="outlined" onClick={toggleMode}>
          Toggle light / dark mode
        </Button>

        {/* Back nav -------------------------------------------------------- */}
        <Button
          size="lg"
          onClick={() => navigate(-1)}
          style={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
