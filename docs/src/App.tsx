// ─────────────────────────────────────────────────────────────
// src/App.tsx  | valet-docs
// Route-level code-splitting with React.lazy + Suspense
// ─────────────────────────────────────────────────────────────
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useInitialTheme, Surface, Stack, Typography } from '@archway/valet';
import brandonUrl from './assets/fonts/BrandonGrotesque.otf';

/*───────────────────────────────────────────────────────────*/
/* Helper – terse lazy() wrapper                            */
const page = <T extends { default: React.ComponentType }>(p: () => Promise<T>) =>
  lazy(() => p().then((m) => ({ default: m.default })));

/*───────────────────────────────────────────────────────────*/
/* Lazy-loaded pages                                         */
const MainPage = page(() => import('./pages/MainPage'));
const TypographyDemoPage = page(() => import('./pages/TypographyDemoPage'));
const PresetDemoPage = page(() => import('./pages/PresetDemoPage'));
const FormDemoPage = page(() => import('./pages/FormDemoPage'));
const ParallaxDemo = page(() => import('./pages/ParallaxDemo'));
const TestPage = page(() => import('./pages/Test'));
const BoxDemo = page(() => import('./pages/BoxDemo'));
const ButtonDemoPage = page(() => import('./pages/ButtonDemoPage'));
const TextFieldDemoPage = page(() => import('./pages/TextFormDemo'));
const IconDemoPage = page(() => import('./pages/IconDemoPage'));
const IconButtonDemoPage = page(() => import('./pages/IconButtonDemoPage'));
const ImageDemoPage = page(() => import('./pages/ImageDemo'));
const AvatarDemoPage = page(() => import('./pages/AvatarDemo'));
const LLMChatDemoPage = page(() => import('./pages/LLMChatDemo'));
const RichChatDemoPage = page(() => import('./pages/RichChatDemo'));
const LLMChatPage = page(() => import('./pages/components/LLMChat'));
const RichChatPage = page(() => import('./pages/components/RichChat'));
const PanelDemoPage = page(() => import('./pages/components/Panel'));
const CheckboxDemoPage = page(() => import('./pages/CheckBoxDemo'));
const TooltipDemoPage = page(() => import('./pages/TooltipDemo'));
const IteratorDemoPage = page(() => import('./pages/IteratorDemo'));
const ModalDemoPage = page(() => import('./pages/ModalDemo'));
const SwitchDemoPage = page(() => import('./pages/SwitchDemo'));
const AccordionDemoPage = page(() => import('./pages/AccordionDemo'));
const AccordionConstrainedDemoPage = page(() => import('./pages/AccordionConstrainedDemo'));
const TabsDemoPage = page(() => import('./pages/TabsDemo'));
const SliderDemoPage = page(() => import('./pages/SliderDemo'));
const ProgressDemoPage = page(() => import('./pages/ProgressDemo'));
const SkeletonDemoPage = page(() => import('./pages/SkeletonDemo'));
const SelectDemoPage = page(() => import('./pages/SelectDemo'));
const TablePlaygroundPage = page(() => import('./pages/TableDemo'));
const ListDemoPage = page(() => import('./pages/ListDemoPage'));
const DrawerDemoPage = page(() => import('./pages/DrawerDemo'));
const AppBarDemoPage = page(() => import('./pages/AppBarDemo'));
const GridDemoPage = page(() => import('./pages/GridDemo'));
const StackDemoPage = page(() => import('./pages/StackDemo'));
const PaginationDemoPage = page(() => import('./pages/PaginationDemo'));
const SpeedDialDemoPage = page(() => import('./pages/SpeedDialDemo'));
const StepperDemoPage = page(() => import('./pages/StepperDemo'));
const RadioGroupDemoPage = page(() => import('./pages/RadioGroupDemo'));
const MetroSelectDemoPage = page(() => import('./pages/MetroSelectDemo'));
const VideoDemoPage = page(() => import('./pages/VideoDemo'));
const SnackbarDemoPage = page(() => import('./pages/SnackbarDemo'));
const TreeDemoPage = page(() => import('./pages/TreeDemo'));
const DropzoneDemoPage = page(() => import('./pages/DropzoneDemo'));
const DateSelectorDemoPage = page(() => import('./pages/DateSelectorDemo'));
const CodeBlockDemoPage = page(() => import('./pages/CodeBlockDemo'));
const MarkdownDemoPage = page(() => import('./pages/MarkdownDemo'));
const OverviewPage = page(() => import('./pages/Overview'));
const QuickstartPage = page(() => import('./pages/Quickstart'));
const MentalModelPage = page(() => import('./pages/MentalModel'));
const StyledEnginePage = page(() => import('./pages/StyledEngine'));
const ThemePage = page(() => import('./pages/Theme'));
const ComponentsPrimerPage = page(() => import('./pages/ComponentsPrimer'));
const SurfaceExplainerPage = page(() => import('./pages/SurfaceExplainer'));
const PropPatternsPage = page(() => import('./pages/PropPatterns'));
const ComplicatedDashboardPage = page(() => import('./pages/ComplicatedDashboard'));
const SpacingContractPage = page(() => import('./pages/SpacingContract'));

/*───────────────────────────────────────────────────────────*/
export function App() {
  /* One-time initial theme + Google-font preload */
  useInitialTheme(
    {
      fonts: {
        heading: { name: 'Brandon', src: brandonUrl },
        body: 'Cabin',
        mono: 'Ubuntu Mono',
        button: 'Ubuntu',
      },
    },
    [{ name: 'Brandon', src: brandonUrl }, 'Ubuntu', 'Ubuntu Mono', 'Cabin'],
  );

  /* Simple fallback – swap for a branded spinner when ready */
  const Fallback = (
    <Surface>
      <Stack style={{ padding: '2rem', alignItems: 'center' }}>
        <Typography variant='subtitle'>Loading…</Typography>
      </Stack>
    </Surface>
  );

  return (
    <Suspense fallback={Fallback}>
      <Routes>
        <Route
          path='/'
          element={<MainPage />}
        />
        <Route
          path='/overview'
          element={<OverviewPage />}
        />
        <Route
          path='/quickstart'
          element={<QuickstartPage />}
        />

        <Route
          path='/mental-model'
          element={<MentalModelPage />}
        />
        <Route
          path='/styled'
          element={<StyledEnginePage />}
        />
        <Route
          path='/theme'
          element={<ThemePage />}
        />
        <Route
          path='/components-primer'
          element={<ComponentsPrimerPage />}
        />
        <Route
          path='/surface'
          element={<SurfaceExplainerPage />}
        />
        <Route
          path='/spacing'
          element={<SpacingContractPage />}
        />
        <Route
          path='/typography'
          element={<TypographyDemoPage />}
        />
        <Route
          path='/presets'
          element={<PresetDemoPage />}
        />
        <Route
          path='/form'
          element={<FormDemoPage />}
        />
        <Route
          path='/parallax'
          element={<ParallaxDemo />}
        />
        <Route
          path='/test'
          element={<TestPage />}
        />
        <Route
          path='/box-demo'
          element={<BoxDemo />}
        />
        <Route
          path='/button-demo'
          element={<ButtonDemoPage />}
        />
        <Route
          path='/text-form-demo'
          element={<TextFieldDemoPage />}
        />
        <Route
          path='/icon-demo'
          element={<IconDemoPage />}
        />
        <Route
          path='/image-demo'
          element={<ImageDemoPage />}
        />
        <Route
          path='/icon-button-demo'
          element={<IconButtonDemoPage />}
        />
        <Route
          path='/avatar-demo'
          element={<AvatarDemoPage />}
        />
        <Route
          path='/panel-demo'
          element={<PanelDemoPage />}
        />
        <Route
          path='/checkbox-demo'
          element={<CheckboxDemoPage />}
        />
        <Route
          path='/tooltip-demo'
          element={<TooltipDemoPage />}
        />
        <Route
          path='/modal-demo'
          element={<ModalDemoPage />}
        />
        <Route
          path='/switch-demo'
          element={<SwitchDemoPage />}
        />
        <Route
          path='/accordion-demo'
          element={<AccordionDemoPage />}
        />
        <Route
          path='/accordion-constrained'
          element={<AccordionConstrainedDemoPage />}
        />
        <Route
          path='/tabs-demo'
          element={<TabsDemoPage />}
        />
        <Route
          path='/slider-demo'
          element={<SliderDemoPage />}
        />
        <Route
          path='/progress-demo'
          element={<ProgressDemoPage />}
        />
        <Route
          path='/skeleton-demo'
          element={<SkeletonDemoPage />}
        />
        <Route
          path='/select-demo'
          element={<SelectDemoPage />}
        />
        <Route
          path='/table-demo'
          element={<TablePlaygroundPage />}
        />
        <Route
          path='/list-demo'
          element={<ListDemoPage />}
        />
        <Route
          path='/drawer-demo'
          element={<DrawerDemoPage />}
        />
        <Route
          path='/appbar-demo'
          element={<AppBarDemoPage />}
        />
        <Route
          path='/grid-demo'
          element={<GridDemoPage />}
        />
        <Route
          path='/stack-demo'
          element={<StackDemoPage />}
        />
        <Route
          path='/pagination-demo'
          element={<PaginationDemoPage />}
        />
        <Route
          path='/speeddial-demo'
          element={<SpeedDialDemoPage />}
        />
        <Route
          path='/stepper-demo'
          element={<StepperDemoPage />}
        />
        <Route
          path='/metroselect-demo'
          element={<MetroSelectDemoPage />}
        />
        <Route
          path='/radio-demo'
          element={<RadioGroupDemoPage />}
        />
        <Route
          path='/video-demo'
          element={<VideoDemoPage />}
        />
        <Route
          path='/dropzone-demo'
          element={<DropzoneDemoPage />}
        />
        <Route
          path='/chat-demo'
          element={<LLMChatDemoPage />}
        />
        <Route
          path='/rich-chat-demo'
          element={<RichChatDemoPage />}
        />
        <Route
          path='/llmchat'
          element={<LLMChatPage />}
        />
        <Route
          path='/richchat'
          element={<RichChatPage />}
        />
        <Route
          path='/snackbar-demo'
          element={<SnackbarDemoPage />}
        />
        <Route
          path='/tree-demo'
          element={<TreeDemoPage />}
        />
        <Route
          path='/iterator-demo'
          element={<IteratorDemoPage />}
        />
        <Route
          path='/dateselector-demo'
          element={<DateSelectorDemoPage />}
        />
        <Route
          path='/codeblock-demo'
          element={<CodeBlockDemoPage />}
        />
        <Route
          path='/markdown-demo'
          element={<MarkdownDemoPage />}
        />
        <Route
          path='/prop-patterns'
          element={<PropPatternsPage />}
        />
        <Route
          path='/dashboard-demo'
          element={<ComplicatedDashboardPage />}
        />
      </Routes>
    </Suspense>
  );
}
