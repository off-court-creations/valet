// ─────────────────────────────────────────────────────────────────────────────
// docs/src/pages/components/field/CheckBoxDemo.tsx  | valet-docs
// Migrated to ComponentMetaPage – uncontrolled, controlled, sizes, disabled, forms, theme toggle
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Stack,
  Typography,
  Button,
  Checkbox,
  FormControl,
  createFormStore,
  useTheme,
} from '@archway/valet';
import ComponentMetaPage from '../../../components/ComponentMetaPage';
import CheckboxMeta from '../../../../../src/components/fields/Checkbox.meta.json';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Local form store for demo                                                  */
const useSignupForm = createFormStore({
  terms: false,
  marketing: true,
});

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function CheckboxDemoPage() {
  const { theme, toggleMode } = useTheme(); // live theme switch
  /* Controlled example state --------------------------------------------- */
  const [newsletter, setNewsletter] = useState(false);

  /* Form submit handler --------------------------------------------------- */
  const handleSubmit = (values: { terms: boolean; marketing: boolean }) => {
    // demo purposes only
    alert(JSON.stringify(values, null, 2));
  };

  const usageContent = (
    <>
      <Typography variant='subtitle'>Every prop, every trick, all in one place</Typography>

      {/* 1. Uncontrolled */}
      <Typography variant='h3'>1. Uncontrolled</Typography>
      <Stack>
        <Checkbox
          name='uc1'
          label='Default unchecked'
        />
        <Checkbox
          name='uc2'
          defaultChecked
          label='Default checked (defaultChecked)'
        />
      </Stack>

      {/* 2. Controlled */}
      <Typography variant='h3'>2. Controlled</Typography>
      <Checkbox
        name='newsletter'
        checked={newsletter}
        onChange={(next) => setNewsletter(next)}
        label={`Receive newsletter – ${newsletter ? 'yes' : 'no'}`}
      />

      {/* 3. Sizes */}
      <Typography variant='h3'>3. Sizes</Typography>
      <Stack>
        <Checkbox
          name='xs'
          size='xs'
          defaultChecked
          label="size='xs'"
        />
        <Checkbox
          name='sm'
          size='sm'
          defaultChecked
          label="size='sm'"
        />
        <Checkbox
          name='md'
          size='md'
          defaultChecked
          label="size='md'"
        />
        <Checkbox
          name='lg'
          size='lg'
          defaultChecked
          label="size='lg'"
        />
        <Checkbox
          name='xl'
          size='xl'
          defaultChecked
          label="size='xl'"
        />
      </Stack>

      {/* 4. Custom sizes */}
      <Typography variant='h3'>4. Custom sizes</Typography>
      <Stack>
        <Checkbox
          name='c1'
          size='3rem'
          defaultChecked
          label="size='3rem'"
        />
        <Checkbox
          name='c2'
          size={28}
          defaultChecked
          label='size={28}'
        />
      </Stack>

      {/* 5. Disabled */}
      <Typography variant='h3'>5. Disabled</Typography>
      <Stack>
        <Checkbox
          name='d1'
          defaultChecked
          disabled
          label='disabled & checked'
        />
        <Checkbox
          name='d2'
          disabled
          label='disabled & unchecked'
        />
      </Stack>

      {/* 6. FormControl integration */}
      <Typography variant='h3'>6. FormControl Binding</Typography>
      <FormControl
        useStore={useSignupForm}
        onSubmitValues={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing(1),
        }}
      >
        <Checkbox
          name='terms'
          label='I agree to the Terms of Service'
        />
        <Checkbox
          name='marketing'
          defaultChecked
          label='Send me marketing emails'
        />
        <Button
          type='submit'
          variant='contained'
          size='lg'
        >
          Submit
        </Button>
      </FormControl>

      {/* 7. Theme coupling */}
      <Typography variant='h3'>7. Theme coupling</Typography>
      <Button
        variant='outlined'
        onClick={toggleMode}
      >
        Toggle light / dark mode
      </Button>
    </>
  );

  return (
    <ComponentMetaPage
      title='Checkbox'
      subtitle='Uncontrolled, controlled, sizes, disabled, forms'
      slug='components/fields/checkbox'
      meta={CheckboxMeta}
      usage={usageContent}
    />
  );
}
