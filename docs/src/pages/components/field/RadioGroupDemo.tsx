// ─────────────────────────────────────────────────────────────────────────────
// docs/src/pages/RadioGroupDemo.tsx | valet-docs
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
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import NavDrawer from '../../../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Style Presets                                                              */
/*  Chip-style radios (pill background, hover/selected colour swap)           */
definePreset(
  'chipRadio',
  (t) => `
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
`,
);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Local form store for demo                                                  */
const useSurveyForm = createFormStore({
  color: 'red',
  pet: 'cat',
});

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function RadioGroupDemoPage() {
  const { theme, toggleMode } = useTheme(); // live theme switch

  /* Controlled example state --------------------------------------------- */
  const [shipping, setShipping] = useState<'standard' | 'express'>('standard');

  /* Form submit handler --------------------------------------------------- */
  const handleSubmit = (values: { color: string; pet: string }) => {
    // eslint-disable-next-line no-alert
    alert(JSON.stringify(values, null, 2));
  };

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
      prop: <code>value</code>,
      type: <code>string</code>,
      default: <code>—</code>,
      description: 'Controlled value',
    },
    {
      prop: <code>defaultValue</code>,
      type: <code>string</code>,
      default: <code>—</code>,
      description: 'Uncontrolled initial value',
    },
    {
      prop: <code>name</code>,
      type: <code>string</code>,
      default: <code>—</code>,
      description: 'Field name for forms',
    },
    {
      prop: <code>row</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Horizontal layout',
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
      description: 'Radio size token or custom CSS measurement',
    },
    {
      prop: <code>spacing</code>,
      type: <code>number | string</code>,
      default: <code>—</code>,
      description: 'Gap between options',
    },
    {
      prop: <code>onChange</code>,
      type: <code>(val: string) =&gt; void</code>,
      default: <code>—</code>,
      description: 'Change handler',
    },
    {
      prop: <code>preset</code>,
      type: <code>string | string[]</code>,
      default: <code>—</code>,
      description: 'Apply style presets',
    },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        {/* Page header ----------------------------------------------------- */}
        <Typography
          variant='h2'
          bold
        >
          Radio Group Showcase
        </Typography>
        <Typography variant='subtitle'>Every prop, every trick, all in one place</Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            {/* 1. Uncontrolled -------------------------------------------------- */}
            <Typography variant='h3'>1. Uncontrolled</Typography>
            <RadioGroup defaultValue='apple'>
              <Radio
                value='apple'
                label='Apple'
              />
              <Radio
                value='banana'
                label='Banana'
              />
              <Radio
                value='peach'
                label='Peach'
              />
            </RadioGroup>

            {/* 2. Controlled ---------------------------------------------------- */}
            <Typography variant='h3'>2. Controlled</Typography>
            <RadioGroup
              value={shipping}
              onChange={(val) => setShipping(val as 'standard' | 'express')}
              row
            >
              <Radio
                value='standard'
                label='Standard (3-5 days)'
              />
              <Radio
                value='express'
                label='Express (24 hr)'
              />
            </RadioGroup>
            <Typography>
              Current selection:&nbsp;
              <b>{shipping === 'standard' ? 'Standard' : 'Express'}</b>
            </Typography>

            {/* 3. Sizes --------------------------------------------------------- */}
            <Typography variant='h3'>3. Sizes</Typography>
            <Stack direction='row'>
              <RadioGroup
                defaultValue='xs'
                size='xs'
              >
                <Radio
                  value='xs'
                  label="size='xs'"
                />
                <Radio
                  value='xs2'
                  label="size='xs'"
                />
                <Radio
                  value='xs3'
                  label="size='xs'"
                />
              </RadioGroup>
              <RadioGroup
                defaultValue='sm'
                size='sm'
              >
                <Radio
                  value='sm'
                  label="size='sm'"
                />
                <Radio
                  value='sm2'
                  label="size='sm'"
                />
                <Radio
                  value='sm3'
                  label="size='sm'"
                />
              </RadioGroup>
              <RadioGroup
                defaultValue='md'
                size='md'
              >
                <Radio
                  value='md'
                  label="size='md'"
                />
                <Radio
                  value='md2'
                  label="size='md'"
                />
                <Radio
                  value='md3'
                  label="size='md'"
                />
              </RadioGroup>
              <RadioGroup
                defaultValue='lg'
                size='lg'
              >
                <Radio
                  value='lg'
                  label="size='lg'"
                />
                <Radio
                  value='lg2'
                  label="size='lg'"
                />
                <Radio
                  value='lg3'
                  label="size='lg'"
                />
              </RadioGroup>
              <RadioGroup
                defaultValue='xl'
                size='xl'
              >
                <Radio
                  value='xl'
                  label="size='xl'"
                />
                <Radio
                  value='xl2'
                  label="size='xl'"
                />
                <Radio
                  value='xl3'
                  label="size='xl'"
                />
              </RadioGroup>
            </Stack>

            <Typography variant='h4'>Custom sizes</Typography>
            <Stack direction='row'>
              <RadioGroup
                defaultValue='c1'
                size='3rem'
              >
                <Radio
                  value='c1'
                  label="size='3rem'"
                />
                <Radio
                  value='c2'
                  label="size='3rem'"
                />
              </RadioGroup>
              <RadioGroup
                defaultValue='c3'
                size={28}
              >
                <Radio
                  value='c3'
                  label='size={28}'
                />
                <Radio
                  value='c4'
                  label='size={28}'
                />
              </RadioGroup>
            </Stack>

            {/* 4. Disabled ------------------------------------------------------ */}
            <Typography variant='h3'>4. Disabled</Typography>
            <RadioGroup
              defaultValue='option1'
              row
            >
              <Radio
                value='option1'
                label='Enabled'
              />
              <Radio
                value='option2'
                label='Disabled'
                disabled
              />
              <Radio
                value='option3'
                label='Also disabled'
                disabled
              />
            </RadioGroup>

            {/* 5. Row vs Column ------------------------------------------------- */}
            <Typography variant='h3'>5. Row orientation</Typography>
            <RadioGroup
              defaultValue='visa'
              row
            >
              <Radio
                value='visa'
                label='Visa'
              />
              <Radio
                value='amex'
                label='AMEX'
              />
              <Radio
                value='paypal'
                label='PayPal'
              />
            </RadioGroup>

            {/* 6. Presets (chip style) ----------------------------------------- */}
            <Typography variant='h3'>6. Presets</Typography>
            <RadioGroup
              defaultValue='dog'
              row
            >
              <Radio
                value='dog'
                preset='chipRadio'
                label='Dog'
              />
              <Radio
                value='cat'
                preset='chipRadio'
                label='Cat'
              />
              <Radio
                value='bird'
                preset='chipRadio'
                label='Bird'
              />
            </RadioGroup>

            {/* 7. FormControl binding ------------------------------------------ */}
            <Typography variant='h3'>7. FormControl Binding</Typography>
            <FormControl
              useStore={useSurveyForm}
              onSubmitValues={handleSubmit}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing(1),
              }}
            >
              <Typography bold>Favourite colour?</Typography>
              <RadioGroup
                name='color'
                row
              >
                <Radio
                  value='red'
                  preset='chipRadio'
                  label='Red'
                />
                <Radio
                  value='green'
                  preset='chipRadio'
                  label='Green'
                />
                <Radio
                  value='blue'
                  preset='chipRadio'
                  label='Blue'
                />
              </RadioGroup>

              <Typography bold>Spirit animal?</Typography>
              <RadioGroup name='pet'>
                <Radio
                  value='cat'
                  label='Cat'
                />
                <Radio
                  value='dog'
                  label='Dog'
                />
                <Radio
                  value='fox'
                  label='Fox'
                />
              </RadioGroup>

              <Button
                type='submit'
                variant='contained'
                size='lg'
              >
                Submit
              </Button>
            </FormControl>

            {/* 8. Theme coupling */}
            <Typography variant='h3'>8. Theme coupling</Typography>
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
      </Stack>
    </Surface>
  );
}
