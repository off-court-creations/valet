# Components Docs Template Checklist

This checklist tracks which component docs use the reusable docs system (ComponentMetaPage with 5 tabs: Usage, Best Practices, Playground, Examples, Reference).

- New system = page imports and renders `ComponentMetaPage`.
- Legacy = bespoke page structure (may still use shared parts like ReferenceSection/CuratedExamples).

Summary
- Total component pages: 47
 - Using new system: 42
 - Remaining to migrate: 5

Legend: [x] uses new system, [ ] legacy

## Layout
- [x] components/layout/BoxDemo.tsx
- [x] components/layout/GridDemo.tsx
- [x] components/layout/Panel.tsx
- [x] components/layout/Surface.tsx
 - [x] components/layout/AccordionDemo.tsx
 - [x] components/layout/AccordionConstrainedDemo.tsx
 - [x] components/layout/AppBarDemo.tsx
- [ ] components/layout/DrawerDemo.tsx
- [ ] components/layout/ListDemoPage.tsx
 - [x] components/layout/ListDemoPage.tsx
- [x] components/layout/ModalDemo.tsx
- [x] components/layout/StackDemo.tsx
- [x] components/layout/TabsDemo.tsx

## Primitives
- [x] components/primitives/AvatarDemo.tsx
- [x] components/primitives/TypographyDemoPage.tsx
- [x] components/primitives/DividerDemo.tsx
- [x] components/primitives/IconDemoPage.tsx
- [x] components/primitives/ImageDemo.tsx
 - [x] components/primitives/ProgressDemo.tsx
- [x] components/primitives/VideoDemo.tsx

## Fields
- [x] components/field/ButtonDemoPage.tsx
- [ ] components/field/CheckBoxDemo.tsx
- [x] components/field/DateSelectorDemo.tsx
- [x] components/field/IconButtonDemoPage.tsx
- [x] components/field/IteratorDemo.tsx
- [ ] components/field/MetroSelectDemo.tsx
 - [x] components/field/MetroSelectDemo.tsx
- [x] components/field/RadioGroupDemo.tsx
- [x] components/field/SelectDemo.tsx
- [x] components/field/SliderDemo.tsx
- [ ] components/field/SwitchDemo.tsx
- [x] components/field/SwitchDemo.tsx
- [x] components/field/TextFormDemo.tsx

## Widgets
- [x] components/widgets/ChipDemo.tsx
 - [x] components/widgets/CodeBlockDemo.tsx
 - [x] components/widgets/DropzoneDemo.tsx
- [ ] components/widgets/LLMChat.tsx
- [ ] components/widgets/LLMChatDemo.tsx
- [x] components/widgets/MarkdownDemo.tsx
 - [x] components/widgets/PaginationDemo.tsx
- [ ] components/widgets/ParallaxDemo.tsx
- [ ] components/widgets/RichChat.tsx
 - [x] components/widgets/RichChat.tsx
- [ ] components/widgets/RichChatDemo.tsx
 - [x] components/widgets/SnackbarDemo.tsx
- [ ] components/widgets/SpeedDialDemo.tsx
 - [x] components/widgets/SpeedDialDemo.tsx
 - [x] components/widgets/StepperDemo.tsx
 - [x] components/widgets/TableDemo.tsx
 - [x] components/widgets/TooltipDemo.tsx
 - [x] components/widgets/TreeDemo.tsx

Notes
- Many legacy pages already use shared building blocks like `ReferenceSection`, `BestPractices`, and `CuratedExamples`. Migration to `ComponentMetaPage` mainly removes bespoke Tabs/layout and wires sidecar meta + MCP references into the template.
- Keep `mcp-data/` fresh with `npm run mcp:build` after migrating pages so the Reference tab stays accurate.

Do last
- components/layout/DrawerDemo.tsx
