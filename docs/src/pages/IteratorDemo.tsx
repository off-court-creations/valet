// ─────────────────────────────────────────────────────────────
// src/pages/IteratorDemo.tsx | valet
// Demo page for <Iterator /> widget
// ─────────────────────────────────────────────────────────────
import { useState } from 'react';
import {
  Surface,
  Stack,
  Typography,
  Button,
  Iterator,
  FormControl,
  createFormStore,
  useTheme,
  Tabs,
  Table,
} from '@archway/valet';
import type { TableColumn } from '@archway/valet';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../components/NavDrawer';

/*───────────────────────────────────────────────────────────*/
/* Form demo store                                            */
const useForm = createFormStore({ qty: 2 });

export default function IteratorDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();

  const [value, setValue] = useState(1);

  interface Row { prop: ReactNode; type: ReactNode; default: ReactNode; description: ReactNode; }
  const columns: TableColumn<Row>[] = [
    { header: 'Prop', accessor: 'prop' },
    { header: 'Type', accessor: 'type' },
    { header: 'Default', accessor: 'default' },
    { header: 'Description', accessor: 'description' },
  ];

  const data: Row[] = [
    { prop: <code>value</code>, type: <code>number</code>, default: <code>-</code>, description: 'Controlled value' },
    { prop: <code>defaultValue</code>, type: <code>number</code>, default: <code>0</code>, description: 'Uncontrolled initial value' },
    { prop: <code>step</code>, type: <code>number</code>, default: <code>1</code>, description: 'Increment amount' },
    { prop: <code>width</code>, type: <code>number | string</code>, default: <code>'3.5rem'</code>, description: 'Input width' },
    { prop: <code>name</code>, type: <code>string</code>, default: <code>-</code>, description: 'Form field name' },
    { prop: <code>onChange</code>, type: <code>(n: number) =&gt; void</code>, default: <code>-</code>, description: 'Change handler' },
    { prop: <code>preset</code>, type: <code>string | string[]</code>, default: <code>-</code>, description: 'Apply style presets' },
  ];

  return (
    <Surface>
      <NavDrawer />
      <Stack preset="showcaseStack">
        <Typography variant="h2" bold>
          Iterator Widget
        </Typography>
        <Typography variant="subtitle">
          Compact numeric input with quick ± controls
        </Typography>

        <Tabs>
          <Tabs.Tab label="Usage" />
          <Tabs.Panel>
            <Typography variant="h3">1. Uncontrolled</Typography>
            <Iterator defaultValue={3} />

            <Typography variant="h3">2. Controlled</Typography>
            <Stack direction="row" style={{ alignItems: 'center' }}>
              <Iterator value={value} onChange={setValue} />
              <Typography>&nbsp;Value: {value}</Typography>
            </Stack>

            <Typography variant="h3">3. Custom width</Typography>
            <Iterator defaultValue={5} width="5rem" />

            <Typography variant="h3">4. FormControl</Typography>
            <FormControl useStore={useForm} onSubmitValues={(v) => alert(JSON.stringify(v))}>
              <Iterator name="qty" width="4rem" />
              <Button type="submit">Submit</Button>
            </FormControl>

            <Typography variant="h3">5. Theme toggle</Typography>
            <Button variant="outlined" onClick={toggleMode}>
              Toggle light / dark
            </Button>
          </Tabs.Panel>

          <Tabs.Tab label="Reference" />
          <Tabs.Panel>
            <Typography variant="h3">Prop reference</Typography>
            <Table data={data} columns={columns} constrainHeight={false} />
          </Tabs.Panel>
        </Tabs>

        <Button size="lg" onClick={() => navigate(-1)} style={{ marginTop: theme.spacing(1) }}>
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
