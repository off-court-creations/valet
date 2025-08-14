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
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';

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
  const navigate = useNavigate();

  /* Controlled example state --------------------------------------------- */
  const [newsletter, setNewsletter] = useState(false);

  interface Row {
    prop: ReactNode;
    type: ReactNode;
    default: ReactNode;
    description: ReactNode;
  }

  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    {
      prop: <code>name</code>,
      type: <code>string</code>,
      default: <code>-</code>,
      description: 'Unique field name',
    },
    {
      prop: <code>label</code>,
      type: <code>ReactNode</code>,
      default: <code>-</code>,
      description: 'Label text or element',
    },
    {
      prop: <code>checked</code>,
      type: <code>boolean</code>,
      default: <code>-</code>,
      description: 'Controlled checked state',
    },
    {
      prop: <code>defaultChecked</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Uncontrolled initial state',
    },
    {
      prop: <code>size</code>,
      type: (
        <code>
          &apos;xs&apos; | &apos;sm&apos; | &apos;md&apos; | &apos;lg&apos; | &apos;xl&apos; |
          number | string
        </code>
      ),
      default: <code>&apos;md&apos;</code>,
      description: 'Checkbox dimensions',
    },
    {
      prop: <code>disabled</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Disable interaction',
    },
    {
      prop: <code>onChange</code>,
      type: <code>(checked: boolean, e: ChangeEvent&lt;HTMLInputElement&gt;) =&gt; void</code>,
      default: <code>-</code>,
      description: 'Change callback',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>-</code>,
      description: 'Apply style presets',
    },
  ];

  /* Form submit handler --------------------------------------------------- */
  const handleSubmit = (values: { terms: boolean; marketing: boolean }) => {
    /* eslint-disable-next-line no-alert */
    // demo purposes only
    alert(JSON.stringify(values, null, 2));
  };

  return (
    <Surface /* Surface already defaults to theme background */>
      <NavDrawer />
      <Stack>
        {/* Page header ----------------------------------------------------- */}
        <Typography
          variant='h2'
          bold
        >
          Checkbox Showcase
        </Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Typography variant='subtitle'>Every prop, every trick, all in one place</Typography>

            {/* 1. Uncontrolled -------------------------------------------------- */}
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

            {/* 2. Controlled ---------------------------------------------------- */}
            <Typography variant='h3'>2. Controlled</Typography>
            <Checkbox
              name='newsletter'
              checked={newsletter}
              onChange={(next) => setNewsletter(next)}
              label={`Receive newsletter – ${newsletter ? 'yes' : 'no'}`}
            />

            {/* 3. Sizes --------------------------------------------------------- */}
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

            {/* 4. Custom sizes ------------------------------------------------- */}
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

            {/* 5. Disabled ------------------------------------------------------ */}
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

            {/* 6. FormControl integration -------------------------------------- */}
            <Typography variant='h3'>6. FormControl Binding</Typography>
            <FormControl
              useStore={useSignupForm}
              onSubmitValues={handleSubmit}
              style={{
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

            {/* 7. Theme coupling ----------------------------------------------- */}
            <Typography variant='h3'>7. Theme coupling</Typography>
            <Button
              variant='outlined'
              onClick={toggleMode}
            >
              Toggle light / dark mode
            </Button>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <Typography variant='h3'>Prop reference</Typography>
            <Table
              data={data}
              columns={columns}
              constrainHeight={false}
            />
          </Tabs.Panel>
        </Tabs>

        {/* Back nav -------------------------------------------------------- */}
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
