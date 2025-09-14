# Components Docs Template Checklist

This checklist tracks which component docs use the reusable docs system (ComponentMetaPage with 5 tabs: Usage, Best Practices, Playground, Examples, Reference).

- New system = page imports and renders `ComponentMetaPage`.
- Legacy = bespoke page structure (may still use shared parts like ReferenceSection/CuratedExamples).

Summary
- Total component pages: 45
- Using new system: 5
- Remaining to migrate: 40

Legend: [x] uses new system, [ ] legacy

## Layout
- [x] components/layout/BoxDemo.tsx
- [x] components/layout/GridDemo.tsx
- [x] components/layout/Panel.tsx
- [x] components/layout/Surface.tsx
- [ ] components/layout/AccordionDemo.tsx
- [ ] components/layout/AccordionConstrainedDemo.tsx
- [ ] components/layout/AppBarDemo.tsx
- [ ] components/layout/DrawerDemo.tsx
- [ ] components/layout/ListDemoPage.tsx
- [x] components/layout/ModalDemo.tsx
- [ ] components/layout/StackDemo.tsx
- [x] components/layout/StackDemo.tsx
- [x] components/layout/TabsDemo.tsx

## Primitives
- [x] components/primitives/AvatarDemo.tsx
- [x] components/primitives/TypographyDemoPage.tsx
- [ ] components/primitives/DividerDemo.tsx
- [ ] components/primitives/IconDemoPage.tsx
- [ ] components/primitives/ImageDemo.tsx
- [ ] components/primitives/ProgressDemo.tsx
- [ ] components/primitives/SkeletonDemo.tsx
- [x] components/primitives/VideoDemo.tsx

## Fields
- [ ] components/field/ButtonDemoPage.tsx
- [ ] components/field/CheckBoxDemo.tsx
- [ ] components/field/DateSelectorDemo.tsx
- [x] components/field/DateSelectorDemo.tsx
- [ ] components/field/IconButtonDemoPage.tsx
- [x] components/field/IconButtonDemoPage.tsx
- [ ] components/field/IteratorDemo.tsx
- [x] components/field/IteratorDemo.tsx
- [ ] components/field/MetroSelectDemo.tsx
- [ ] components/field/RadioGroupDemo.tsx
- [ ] components/field/SelectDemo.tsx
- [ ] components/field/SliderDemo.tsx
- [ ] components/field/SwitchDemo.tsx
- [ ] components/field/TextFormDemo.tsx

## Widgets
- [x] components/widgets/ChipDemo.tsx
- [ ] components/widgets/CodeBlockDemo.tsx
- [ ] components/widgets/DropzoneDemo.tsx
- [ ] components/widgets/LLMChat.tsx
- [ ] components/widgets/LLMChatDemo.tsx
- [ ] components/widgets/MarkdownDemo.tsx
- [ ] components/widgets/PaginationDemo.tsx
- [ ] components/widgets/ParallaxDemo.tsx
- [ ] components/widgets/RichChat.tsx
- [ ] components/widgets/RichChatDemo.tsx
- [ ] components/widgets/SnackbarDemo.tsx
- [ ] components/widgets/SpeedDialDemo.tsx
- [ ] components/widgets/StepperDemo.tsx
- [ ] components/widgets/TableDemo.tsx
- [ ] components/widgets/TooltipDemo.tsx
- [ ] components/widgets/TreeDemo.tsx

Notes
- Many legacy pages already use shared building blocks like `ReferenceSection`, `BestPractices`, and `CuratedExamples`. Migration to `ComponentMetaPage` mainly removes bespoke Tabs/layout and wires sidecar meta + MCP references into the template.
- Keep `mcp-data/` fresh with `npm run mcp:build` after migrating pages so the Reference tab stays accurate.
