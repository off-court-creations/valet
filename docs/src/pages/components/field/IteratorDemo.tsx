// ─────────────────────────────────────────────────────────────
// src/pages/IteratorDemo.tsx | valet-docs
// Showcase of Iterator component
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
} from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import { useNavigate } from 'react-router-dom';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';

/*───────────────────────────────────────────────────────────*/
interface FormVals extends Record<string, unknown> {
  amount: number;
}
const useFormStore = createFormStore<FormVals>({ amount: 1 });

export default function IteratorDemoPage() {
  const { theme, toggleMode } = useTheme();
  const navigate = useNavigate();
  const [count, setCount] = useState(2);

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Iterator' />
        <Typography variant='subtitle'>
          Compact numeric stepper with plus/minus controls. Scroll while hovering to change the
          value without moving the page.
        </Typography>

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              <Typography>
                The field will increment when scrolling up and decrement when scrolling down. Page
                scrolling is suppressed while hovering, including on Firefox.
              </Typography>
              <Typography variant='h3'>1. Uncontrolled</Typography>
              <Iterator defaultValue={3} />

              <Typography variant='h3'>2. Controlled</Typography>
              <Stack
                direction='row'
                sx={{ alignItems: 'center' }}
              >
                <Iterator
                  value={count}
                  onChange={setCount}
                />
                <Typography>Value: {count}</Typography>
              </Stack>

              <Typography variant='h3'>3. Min, max &amp; step</Typography>
              <Iterator
                min={0}
                max={10}
                step={2}
                defaultValue={4}
              />

              <Typography variant='h3'>4. Disabled</Typography>
              <Iterator
                defaultValue={5}
                disabled
              />

              <Typography variant='h3'>5. FormControl</Typography>
              <FormControl
                useStore={useFormStore}
                onSubmitValues={(vals) => alert(JSON.stringify(vals))}
              >
                <Stack
                  direction='row'
                  compact
                >
                  <Iterator name='amount' />
                  <Button type='submit'>Submit</Button>
                </Stack>
              </FormControl>

              <Typography variant='h3'>6. Theme toggle</Typography>
              <Button
                variant='outlined'
                onClick={toggleMode}
              >
                Toggle light / dark
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Tab label='Reference' />
          <Tabs.Panel>
            <ReferenceSection slug='components/fields/iterator' />
          </Tabs.Panel>
        </Tabs>

        <Button
          size='lg'
          onClick={() => navigate(-1)}
          sx={{ marginTop: theme.spacing(1) }}
        >
          ← Back
        </Button>
      </Stack>
    </Surface>
  );
}
