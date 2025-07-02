// ─────────────────────────────────────────────────────────────
// src/App.tsx  |  valet
// Route-level code-splitting with React.lazy + Suspense
// ─────────────────────────────────────────────────────────────
import React, { Suspense, lazy }   from 'react';
import { Routes, Route }           from 'react-router-dom';
import { useInitialTheme, Surface, Stack, Typography } from '@archway/valet';

/*───────────────────────────────────────────────────────────*/
/* Helper – terse lazy() wrapper                            */
const page = <T extends { default: React.FC<any> }>(p: () => Promise<T>) =>
  lazy(() => p().then(m => ({ default: m.default })));

/*───────────────────────────────────────────────────────────*/
/* Lazy-loaded pages                                         */
const MainPage              = page(() => import('./pages/MainPage'));
const TypographyDemoPage    = page(() => import('./pages/TypographyDemoPage'));
const PresetDemoPage        = page(() => import('./pages/PresetDemoPage'));
const FormDemoPage          = page(() => import('./pages/FormDemoPage'));
const ParallaxDemo          = page(() => import('./pages/ParallaxDemo'));
const TestPage              = page(() => import('./pages/Test'));
const BoxDemo               = page(() => import('./pages/BoxDemo'));
const ButtonDemoPage        = page(() => import('./pages/ButtonDemoPage'));
const TextFieldDemoPage     = page(() => import('./pages/TextFormDemo'));
const IconDemoPage          = page(() => import('./pages/IconDemoPage'));
const IconButtonDemoPage    = page(() => import('./pages/IconButtonDemoPage'));
const PanelDemoPage         = page(() => import('./pages/PanelDemo'));
const CheckboxDemoPage      = page(() => import('./pages/CheckBoxDemo'));
const TooltipDemoPage       = page(() => import('./pages/TooltipDemo'));
const ModalDemoPage         = page(() => import('./pages/ModalDemo'));
const SwitchDemoPage        = page(() => import('./pages/SwitchDemo'));
const AccordionDemoPage     = page(() => import('./pages/AccordionDemo'));
const TabsDemoPage          = page(() => import('./pages/TabsDemo'));
const SliderDemoPage        = page(() => import('./pages/SliderDemo'));
const ProgressDemoPage      = page(() => import('./pages/ProgressDemo'));
const SelectDemoPage        = page(() => import('./pages/SelectDemo'));
const TablePlaygroundPage   = page(() => import('./pages/TableDemo'));
const ListDemoPage          = page(() => import('./pages/ListDemoPage'));
const DrawerDemoPage        = page(() => import('./pages/DrawerDemo'));
const AppBarDemoPage        = page(() => import('./pages/AppBarDemo'));
const GridDemoPage          = page(() => import('./pages/GridDemo'));
const PaginationDemoPage    = page(() => import('./pages/PaginationDemo'));
const SpeedDialDemoPage     = page(() => import('./pages/SpeedDialDemo'));
const StepperDemoPage       = page(() => import('./pages/StepperDemo'));
const RadioGroupDemoPage    = page(() => import('./pages/RadioGroupDemo'));
const VideoDemoPage         = page(() => import('./pages/VideoDemo'));
const SnackbarDemoPage      = page(() => import('./pages/SnackbarDemo'));

/*───────────────────────────────────────────────────────────*/
export function App() {
  /* One-time initial theme + Google-font preload */
  useInitialTheme(
    { fonts: { heading: 'Fira Sans', body: 'Ubuntu', mono: 'Ubuntu Mono' } },
    ['Fira Sans', 'Ubuntu', 'Ubuntu Mono', 'Poppins']
  );

  /* Simple fallback – swap for a branded spinner when ready */
  const Fallback = (
    <Surface>
      <Stack style={{ padding: '2rem', alignItems: 'center' }}>
        <Typography variant="subtitle">Loading…</Typography>
      </Stack>
    </Surface>
  );

  return (
    <Suspense fallback={Fallback}>
      <Routes>
        <Route path="/"                element={<MainPage />} />
        <Route path="/typography"      element={<TypographyDemoPage />} />
        <Route path="/presets"         element={<PresetDemoPage />} />
        <Route path="/form"            element={<FormDemoPage />} />
        <Route path="/parallax"        element={<ParallaxDemo />} />
        <Route path="/test"            element={<TestPage />} />
        <Route path="/box-demo"        element={<BoxDemo />} />
        <Route path="/button-demo"     element={<ButtonDemoPage />} />
        <Route path="/text-form-demo"  element={<TextFieldDemoPage />} />
        <Route path="/icon-demo"       element={<IconDemoPage />} />
        <Route path="/icon-button-demo"element={<IconButtonDemoPage />} />
        <Route path="/panel-demo"      element={<PanelDemoPage />} />
        <Route path="/checkbox-demo"   element={<CheckboxDemoPage />} />
        <Route path="/tooltip-demo"    element={<TooltipDemoPage />} />
        <Route path="/modal-demo"      element={<ModalDemoPage />} />
        <Route path="/switch-demo"     element={<SwitchDemoPage />} />
        <Route path="/accordion-demo"  element={<AccordionDemoPage />} />
        <Route path="/tabs-demo"       element={<TabsDemoPage />} />
        <Route path="/slider-demo"     element={<SliderDemoPage />} />
        <Route path="/progress-demo"   element={<ProgressDemoPage />} />
        <Route path="/select-demo"     element={<SelectDemoPage />} />
        <Route path="/table-demo"      element={<TablePlaygroundPage />} />
        <Route path="/list-demo"       element={<ListDemoPage />} />
        <Route path="/drawer-demo"     element={<DrawerDemoPage />} />
        <Route path="/appbar-demo"     element={<AppBarDemoPage />} />
        <Route path="/grid-demo"       element={<GridDemoPage />} />
        <Route path="/pagination-demo" element={<PaginationDemoPage />} />
        <Route path="/speeddial-demo"  element={<SpeedDialDemoPage />} />
        <Route path="/stepper-demo"    element={<StepperDemoPage />} />
        <Route path="/radio-demo"      element={<RadioGroupDemoPage />} />
        <Route path="/video-demo"      element={<VideoDemoPage />} />
        <Route path="/snackbar-demo"   element={<SnackbarDemoPage />} />
      </Routes>
    </Suspense>
  );
}
