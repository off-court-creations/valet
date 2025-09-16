// src/index.ts | valet

// ─── Primitives ─────────────────────────────────────────────
export * from './components/primitives/Avatar';
export * from './components/primitives/Icon';
export * from './components/primitives/Typography';
export * from './components/layout/Modal';
export * from './components/primitives/Progress';
export * from './components/primitives/Video';
export * from './components/primitives/Image';
export * from './components/primitives/Skeleton';
export * from './components/primitives/Divider';

// ─── Layout Primitives ──────────────────────────────────────
export * from './components/layout/Grid';
export * from './components/layout/Stack';
export * from './components/layout/Surface';
export * from './components/layout/Box';
export * from './components/layout/Panel';

// ─── Fields ─────────────────────────────────────────────────
export * from './components/fields/Button';
export * from './components/fields/Checkbox';
export * from './components/fields/FormControl';
export * from './components/fields/IconButton';
export * from './components/fields/RadioGroup';
export { default as Select } from './components/fields/Select';
export type { SelectProps, OptionProps as SelectOptionProps } from './components/fields/Select';
export { default as MetroSelect } from './components/fields/MetroSelect';
export type { MetroSelectProps, MetroOptionProps } from './components/fields/MetroSelect';
export * from './components/fields/Slider';
export * from './components/fields/Switch';
export * from './components/fields/TextField';
export * from './components/fields/Iterator';

// ─── Widgets ─────────────────────────────────────────────────
export * from './components/layout/Accordion';
export * from './components/layout/AppBar';

// Avoid DTS name collisions by using explicit, aliased re-exports for chat widgets
export { default as LLMChat } from './components/widgets/LLMChat';
export type {
  ChatProps as LLMChatProps,
  ChatMessage as LLMChatMessage,
} from './components/widgets/LLMChat';

export { default as RichChat } from './components/widgets/RichChat';
export type { RichChatProps, RichMessage } from './components/widgets/RichChat';

export * from './components/layout/Drawer';
export * from './components/fields/DateSelector';
export * from './components/layout/List';
export * from './components/widgets/LoadingBackdrop';
export * from './components/widgets/Pagination';
export * from './components/widgets/Parallax';
export * from './components/widgets/Snackbar';
export * from './components/widgets/SpeedDial';
export * from './components/widgets/Stepper';
export * from './components/widgets/Table';
export * from './components/widgets/Dropzone';
export * from './components/layout/Tabs';
export * from './components/widgets/Tooltip';
export * from './components/widgets/Tree';
export * from './components/widgets/Markdown';
export * from './components/widgets/CodeBlock';
export * from './components/widgets/Chip';
export { default as KeyModal } from './components/KeyModal';

// ─── AI Helpers ─────────────────────────────────────────────
export * from './system/aiKeyStore';

// ─── Core ────────────────────────────────────────────────────
export * from './css/createStyled';
export * from './css/stylePresets';
export * from './system/createFormStore';
export * from './system/themeStore';
export * from './system/fontStore';
export * from './system/createInitialTheme';
export * from './hooks/useGoogleFonts';
export type { Font, CustomFont } from './helpers/fontLoader';
export type { Variant as TypographyVariant, WeightAlias } from './types/typography';
export { inheritSurfaceFontVars } from './system/inheritSurfaceFontVars';
