// ─────────────────────────────────────────────────────────────
// src/App.tsx  | valet-docs
// Route-level code-splitting with React.lazy + Suspense
// ─────────────────────────────────────────────────────────────
import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useInitialTheme, Surface, Stack, Typography } from '@archway/valet';
import { DemoFontLoader } from './components/DemoFontLoader';

/*───────────────────────────────────────────────────────────*/
/* Helper – terse lazy() wrapper                            */
const page = <T extends { default: React.ComponentType }>(p: () => Promise<T>) =>
  lazy(() => p().then((m) => ({ default: m.default })));

/*───────────────────────────────────────────────────────────*/
/* Lazy-loaded pages                                         */
const MainPage = page(() => import('./pages/concepts/MainPage'));
const TypographyDemoPage = page(() => import('./pages/components/primitives/TypographyDemoPage'));
const PresetDemoPage = page(() => import('./pages/examples/PresetDemoPage'));
const FormDemoPage = page(() => import('./pages/examples/FormDemoPage'));
const ParallaxDemo = page(() => import('./pages/components/widgets/ParallaxDemo'));
const TestPage = page(() => import('./pages/examples/Test'));
const BoxDemo = page(() => import('./pages/components/layout/BoxDemo'));
const ButtonDemoPage = page(() => import('./pages/components/field/ButtonDemoPage'));
const TextFieldDemoPage = page(() => import('./pages/components/field/TextFormDemo'));
const IconDemoPage = page(() => import('./pages/components/primitives/IconDemoPage'));
const IconButtonDemoPage = page(() => import('./pages/components/field/IconButtonDemoPage'));
const ImageDemoPage = page(() => import('./pages/components/primitives/ImageDemo'));
const DividerDemoPage = page(() => import('./pages/components/primitives/DividerDemo'));
const AvatarDemoPage = page(() => import('./pages/components/primitives/AvatarDemo'));
const LLMChatDemoPage = page(() => import('./pages/components/widgets/LLMChatDemo'));
const RichChatDemoPage = page(() => import('./pages/components/widgets/RichChatDemo'));
const LLMChatPage = page(() => import('./pages/components/widgets/LLMChat'));
const RichChatPage = page(() => import('./pages/components/widgets/RichChat'));
const PanelDemoPage = page(() => import('./pages/components/layout/Panel'));
const CheckboxDemoPage = page(() => import('./pages/components/field/CheckBoxDemo'));
const TooltipDemoPage = page(() => import('./pages/components/widgets/TooltipDemo'));
const IteratorDemoPage = page(() => import('./pages/components/field/IteratorDemo'));
const ModalDemoPage = page(() => import('./pages/components/layout/ModalDemo'));
const SwitchDemoPage = page(() => import('./pages/components/field/SwitchDemo'));
const AccordionDemoPage = page(() => import('./pages/components/layout/AccordionDemo'));
const AccordionConstrainedDemoPage = page(
  () => import('./pages/components/layout/AccordionConstrainedDemo'),
);
const TabsDemoPage = page(() => import('./pages/components/layout/TabsDemo'));
const SliderDemoPage = page(() => import('./pages/components/field/SliderDemo'));
const ProgressDemoPage = page(() => import('./pages/components/primitives/ProgressDemo'));
const SkeletonDemoPage = page(() => import('./pages/components/primitives/SkeletonDemo'));
const SelectDemoPage = page(() => import('./pages/components/field/SelectDemo'));
const TablePlaygroundPage = page(() => import('./pages/components/widgets/TableDemo'));
const ListDemoPage = page(() => import('./pages/components/layout/ListDemoPage'));
const DrawerDemoPage = page(() => import('./pages/components/layout/DrawerDemo'));
const AppBarDemoPage = page(() => import('./pages/components/layout/AppBarDemo'));
const GridDemoPage = page(() => import('./pages/components/layout/GridDemo'));
const StackDemoPage = page(() => import('./pages/components/layout/StackDemo'));
const PaginationDemoPage = page(() => import('./pages/components/widgets/PaginationDemo'));
const SpeedDialDemoPage = page(() => import('./pages/components/widgets/SpeedDialDemo'));
const RadioGroupDemoPage = page(() => import('./pages/components/field/RadioGroupDemo'));
const MetroSelectDemoPage = page(() => import('./pages/components/field/MetroSelectDemo'));
const VideoDemoPage = page(() => import('./pages/components/primitives/VideoDemo'));
const SnackbarDemoPage = page(() => import('./pages/components/widgets/SnackbarDemo'));
const TreeDemoPage = page(() => import('./pages/components/widgets/TreeDemo'));
const ChipDemoPage = page(() => import('./pages/components/widgets/ChipDemo'));
const DropzoneDemoPage = page(() => import('./pages/components/widgets/DropzoneDemo'));
const WebGLCanvasDemoPage = page(() => import('./pages/components/primitives/WebGLCanvasDemo'));
const DateSelectorDemoPage = page(() => import('./pages/components/field/DateSelectorDemo'));
const CodeBlockDemoPage = page(() => import('./pages/components/widgets/CodeBlockDemo'));
const MarkdownDemoPage = page(() => import('./pages/components/widgets/MarkdownDemo'));
const QuickstartPage = page(() => import('./pages/concepts/Quickstart'));
const MentalModelPage = page(() => import('./pages/concepts/MentalModel'));
const StyledEnginePage = page(() => import('./pages/concepts/StyledEngine'));
const ThemeEnginePage = page(() => import('./pages/concepts/ThemeEngine'));
const SurfaceExplainerPage = page(() => import('./pages/components/layout/Surface'));
const PropPatternsPage = page(() => import('./pages/concepts/PropPatterns'));
const ComplicatedDashboardPage = page(() => import('./pages/examples/ComplicatedDashboard'));
const ComponentQCLabPage = page(() => import('./pages/examples/ComponentQCLab'));
const SpacingContractPage = page(() => import('./pages/concepts/SpacingContract'));
const MCPGuidePage = page(() => import('./pages/concepts/MCP'));
const GlossaryPage = page(() => import('./pages/concepts/Glossary'));
const ComponentStatusPage = page(() => import('./pages/concepts/ComponentStatus'));

/*───────────────────────────────────────────────────────────*/
export function App() {
  /* One-time initial theme + Google-font preload */
  useInitialTheme(
    {
      fonts: {
        heading: 'Kumbh Sans',
        body: 'Inter',
        mono: 'JetBrains Mono',
        button: 'Kumbh Sans',
      },
    },
    ['Kumbh Sans', 'JetBrains Mono', 'Inter'],
  );

  /* Simple fallback – swap for a branded spinner when ready */
  const Fallback = (
    <Surface>
      <Stack sx={{ padding: '2rem', alignItems: 'center' }}>
        <Typography variant='subtitle'>Loading…</Typography>
      </Stack>
    </Surface>
  );

  return (
    <Suspense fallback={Fallback}>
      {/* Load demo fonts globally without affecting theme defaults */}
      <DemoFontLoader />
      <Routes>
        <Route
          path='/'
          element={<MainPage />}
        />
        <Route
          path='*'
          element={<MainPage />}
        />
        <Route
          path='/quickstart'
          element={<QuickstartPage />}
        />
        <Route
          path='/mcp'
          element={<MCPGuidePage />}
        />
        <Route
          path='/glossary'
          element={<GlossaryPage />}
        />
        <Route
          path='/component-status'
          element={<ComponentStatusPage />}
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
          path='/theme-engine'
          element={<ThemeEnginePage />}
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
          path='/divider-demo'
          element={<DividerDemoPage />}
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
          path='/chip-demo'
          element={<ChipDemoPage />}
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
          path='/webglcanvas-demo'
          element={<WebGLCanvasDemoPage />}
        />
        <Route
          path='/prop-patterns'
          element={<PropPatternsPage />}
        />
        <Route
          path='/dashboard-demo'
          element={<ComplicatedDashboardPage />}
        />
        <Route
          path='/qc-playground'
          element={<ComponentQCLabPage />}
        />
      </Routes>
    </Suspense>
  );
}
