// ─────────────────────────────────────────────────────────────────────────────
// src/pages/SwitchDemo.tsx | valet-docs
// Comprehensive live demo for <Switch /> – showcases uncontrolled,
// controlled, form-bound, sizes, disabled, and live theme coupling.
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import type { JSX } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Switch,
  FormControl,
  createFormStore,
  useTheme,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import NavDrawer from '../../../components/NavDrawer';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Local form store for demo                                                  */
const usePrefsForm = createFormStore({
  darkMode: true,
  newsletter: false,
});

/*─────────────────────────────────────────────────────────────────────────────*/
/* Helper row – explicit `control` prop (JSX only, no ReactNode)              */
interface RowProps {
  label: string;
  control: JSX.Element | null;
}

const Row = ({ label, control }: RowProps) => (
  <Stack
    direction='row'
    sx={{ maxWidth: 360 }}
  >
    {control}
    <Typography sx={{ flex: 1 }}>{label}</Typography>
  </Stack>
);

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                  */
export default function SwitchDemoPage() {
  const { theme, toggleMode } = useTheme(); // live theme switch

  /* Controlled example state --------------------------------------------- */
  const [wifi, setWifi] = useState(false);

  /* Form submit handler --------------------------------------------------- */
  const handleSubmit = (values: { darkMode: boolean; newsletter: boolean }) =>
    // eslint-disable-next-line no-alert -- demo only
    alert(JSON.stringify(values, null, 2));

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
      prop: <code>checked</code>,
      type: <code>boolean</code>,
      default: <code>—</code>,
      description: 'Controlled state',
    },
    {
      prop: <code>defaultChecked</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Uncontrolled initial state',
    },
    {
      prop: <code>onChange</code>,
      type: <code>(checked: boolean) =&gt; void</code>,
      default: <code>—</code>,
      description: 'State change handler',
    },
    {
      prop: <code>name</code>,
      type: <code>string</code>,
      default: <code>—</code>,
      description: 'Form field name',
    },
    {
      prop: <code>size</code>,
      type: <code>&apos;sm&apos; | &apos;md&apos; | &apos;lg&apos;</code>,
      default: <code>&apos;md&apos;</code>,
      description: 'Switch size',
    },
    {
      prop: <code>disabled</code>,
      type: <code>boolean</code>,
      default: <code>false</code>,
      description: 'Disable interaction',
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
          Switch Showcase
        </Typography>
        <Typography variant='subtitle'>Every prop, every trick, all in one place</Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            {/* 1. Uncontrolled -------------------------------------------------- */}
            <Typography variant='h3'>1. Uncontrolled</Typography>
            <Stack>
              <Row
                label='Default unchecked'
                control={<Switch name='uc1' />}
              />
              <Row
                label='Default checked (defaultChecked)'
                control={
                  <Switch
                    name='uc2'
                    defaultChecked
                  />
                }
              />
            </Stack>

            {/* 2. Controlled ---------------------------------------------------- */}
            <Typography variant='h3'>2. Controlled</Typography>
            <Row
              label={`Wi-Fi – ${wifi ? 'on' : 'off'}`}
              control={
                <Switch
                  name='wifi'
                  checked={wifi}
                  onChange={setWifi}
                />
              }
            />

            {/* 3. Sizes --------------------------------------------------------- */}
            <Typography variant='h3'>3. Sizes</Typography>
            <Stack>
              <Row
                label="size='sm'"
                control={
                  <Switch
                    name='sm'
                    size='sm'
                    defaultChecked
                  />
                }
              />
              <Row
                label="size='md'"
                control={
                  <Switch
                    name='md'
                    size='md'
                    defaultChecked
                  />
                }
              />
              <Row
                label="size='lg'"
                control={
                  <Switch
                    name='lg'
                    size='lg'
                    defaultChecked
                  />
                }
              />
            </Stack>

            {/* 4. Disabled ------------------------------------------------------ */}
            <Typography variant='h3'>4. Disabled</Typography>
            <Stack>
              <Row
                label='disabled & checked'
                control={
                  <Switch
                    name='d1'
                    defaultChecked
                    disabled
                  />
                }
              />
              <Row
                label='disabled & unchecked'
                control={
                  <Switch
                    name='d2'
                    disabled
                  />
                }
              />
            </Stack>

            {/* 5. FormControl integration -------------------------------------- */}
            <Typography variant='h3'>5. FormControl Binding</Typography>
            <FormControl
              useStore={usePrefsForm}
              onSubmitValues={handleSubmit}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: theme.spacing(1),
              }}
            >
              <Row
                label='Dark mode'
                control={<Switch name='darkMode' />}
              />
              <Row
                label='Join newsletter'
                control={<Switch name='newsletter' />}
              />
              <Button
                type='submit'
                variant='contained'
                size='lg'
              >
                Save preferences
              </Button>
            </FormControl>

            {/* 6. Live theme validation ---------------------------------------- */}
            <Typography variant='h3'>6. Theme coupling</Typography>
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
