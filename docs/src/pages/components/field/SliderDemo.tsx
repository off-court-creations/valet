// ─────────────────────────────────────────────────────────────────────────────
// src/pages/SliderDemo.tsx | valet-docs
// Comprehensive live demo showcasing every Slider feature & edge-case
// – Updated: section #5 now snaps to its custom tick marks
// – Removed: preset-styling showcase (simplifies demo focus)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { Surface, Stack, Typography, Button, Slider, useTheme, Tabs } from '@archway/valet';
import ReferenceSection from '../../../components/ReferenceSection';
import NavDrawer from '../../../components/NavDrawer';
import PageHero from '../../../components/PageHero';
import BestPractices from '../../../components/BestPractices';
import { getBestPractices } from '../../../utils/sidecar';
import SliderMeta from '../../../../../src/components/fields/Slider.meta.json';

/*─────────────────────────────────────────────────────────────────────────────*/
/* Example-wide constants                                                     */
const PRESET_MARKS = [0, 25, 50, 75, 100]; // example #4 presets
const CUSTOM_TICKS = [0, 15, 30, 45, 60]; // example #5 ticks

/*─────────────────────────────────────────────────────────────────────────────*/
/* Demo page                                                                   */
export default function SliderDemoPage() {
  const { toggleMode } = useTheme();

  /* Controlled slider state ------------------------------------------------ */
  const [ctlValue, setCtlValue] = useState(30);

  return (
    <Surface>
      <NavDrawer />
      <Stack>
        <PageHero title='Slider' />

        <Tabs>
          <Tabs.Tab label='Usage' />
          <Tabs.Panel>
            <Stack>
              {/* 1. Default uncontrolled ----------------------------------------- */}
              <Typography variant='h3'>1. Uncontrolled (defaults)</Typography>
              <Slider defaultValue={50} />

              {/* 2. Controlled ---------------------------------------------------- */}
              <Typography variant='h3'>2. Controlled</Typography>
              <Stack>
                <Slider
                  value={ctlValue}
                  onChange={setCtlValue}
                  showValue
                  showMinMax
                />
                <Typography>
                  Current value:&nbsp;
                  <code>{ctlValue}</code>
                </Typography>
              </Stack>

              {/* 3. Step snapping w/ ticks --------------------------------------- */}
              <Typography variant='h3'>3. Snap = &quot;step&quot; + ticks</Typography>
              <Slider
                defaultValue={40}
                min={0}
                max={100}
                step={10}
                snap='step'
                showValue
                showMinMax
                showTicks
              />

              {/* 4. Preset snapping ---------------------------------------------- */}
              <Typography variant='h3'>4. Snap = &quot;presets&quot;</Typography>
              <Slider
                defaultValue={75}
                min={0}
                max={100}
                presets={PRESET_MARKS}
                snap='presets'
                showValue
                showMinMax
                showTicks
              />

              {/* 5. Custom ticks *with* snapping ---------------------------------- */}
              <Typography variant='h3'>5. Custom ticks (snap = &quot;presets&quot;)</Typography>
              <Slider
                defaultValue={15}
                min={0}
                max={60}
                ticks={CUSTOM_TICKS}
                presets={CUSTOM_TICKS}
                snap='presets' // ← ensures handle snaps to tick marks
                showTicks
              />

              {/* 6. Sizes ------------------------------------------------------- */}
              <Typography variant='h3'>6. Sizes</Typography>
              <Stack>
                <Slider
                  defaultValue={20}
                  size='xs'
                  showMinMax
                />
                <Slider
                  defaultValue={20}
                  size='sm'
                  showMinMax
                />
                <Slider
                  defaultValue={20}
                  size='md'
                  showMinMax
                />
                <Slider
                  defaultValue={20}
                  size='lg'
                  showMinMax
                />
                <Slider
                  defaultValue={20}
                  size='xl'
                  showMinMax
                />
              </Stack>

              {/* 7. Custom sizes --------------------------------------------- */}
              <Typography variant='h3'>7. Custom sizes</Typography>
              <Stack>
                <Slider
                  defaultValue={40}
                  size='2rem'
                  showMinMax
                />
                <Slider
                  defaultValue={40}
                  size='24px'
                  showMinMax
                />
              </Stack>

              {/* 8. Disabled state -------------------------------------------- */}
              <Typography variant='h3'>8. Disabled</Typography>

              {/* Theme coupling */}
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
            <ReferenceSection slug='components/fields/slider' />
          </Tabs.Panel>
        </Tabs>

        <BestPractices items={getBestPractices(SliderMeta)} />
      </Stack>
    </Surface>
  );
}
