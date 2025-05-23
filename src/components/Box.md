# `<Box />`

valet’s **base layout primitive**. A thin wrapper around a `<div>` that:

- Enforces `box-sizing: border-box` and `display: block`.
- Accepts **all** native `<div>` props (e.g. `id`, `onClick`, `style`, etc.).
- Supports ad-hoc inline styles via the `style` prop.
- Integrates with valet’s **style preset** system via the `preset` prop.
- Provides optional themable overrides for `background` and `textColor`, emitting CSS variables `--valet-bg` and `--valet-text-color` for descendant components.

Use `Box` as a neutral container before reaching for more opinionated layout components like `Stack` or viewport containers like `Surface`.

---

## Usage

### Basic Container

```tsx
<Box>
  Hello from inside Box
</Box>
```

### Inline Styles

```tsx
<Box style={{ background: '#efefef', padding: 16, borderRadius: 8 }}>
  Gray background
</Box>
```

### Inline Styles from Theme

```tsx
import { useTheme } from '../system/themeStore';
import Typography from "./Typography";
import Surface from "./Surface";

console.log("theme")

const { theme } = useTheme();


<Surface fullscreen={false}>
  <Box style={{ background: theme.colors.backgroundAlt, padding: theme.spacing.md, margin: theme.spacing.md }}>
    <Typography>
      There's inline styles here!
    </Typography>
  </Box>
</Surface>

```

### Themed Background with Automatic Text Color

```tsx
import { useTheme } from '../system/themeStore';
import Typography from "./Typography";
import Surface from "./Surface";

const { theme } = useTheme();

<Surface fullscreen={false}>
  <Box background={theme.colors.primary} style={{padding: theme.spacing.md}}>
    <Typography>
      When you use Typography, theme-based changes to the background of Boxes and other elements automatically recolors text.
    </Typography>
  </Box>
</Surface>
  
```

### Explicit Text Color Override

```tsx
import Typography from "./Typography";
import { useTheme } from '../system/themeStore';
import Surface from "./Surface";

const { theme } = useTheme();

<Surface fullscreen={false}>
  <Box background="#222222" textColor="#00ff00" style={{padding: theme.spacing.md}}>
      <Typography>
        Here a custom background and text color set at the Box level, which Typography listens to.
      </Typography>
  </Box>
</Surface>
```

---

## Props

| Name         | Type                          | Default | Description                                                                                           |
|--------------|-------------------------------|---------|-------------------------------------------------------------------------------------------------------|
| `preset`     | `string` or `string[]`       | —       | One or more preset names (defined via `definePreset()`), applied as CSS classes.                     |
| `background` | `string`                      | —       | Explicit CSS `background` value. Sets `--valet-bg` for descendant components.                         |
| `textColor`  | `string`                      | —       | Explicit text color. Sets `--valet-text-color` for descendant components.                             |
| `style`      | `React.CSSProperties`         | —       | Inline styles forwarded to the `<div>`.                                                              |
| *(rest)*     | `...React.ComponentProps<'div'>` | —    | All other native `<div>` props (e.g. `id`, `onClick`, `className`, etc.) are forwarded.               |

---

## Theming CSS Variables

When you use `background` or `textColor`, `Box` emits CSS variables:

- `--valet-bg` → value of `background`
- `--valet-text-color` → value of `textColor`

These can be consumed by nested components (e.g. `Typography`) to inherit context-aware colors.

---

## Accessibility & Best Practices

- Label containers with accessible attributes as needed (e.g. `aria-label`, `role`) when using as interactive wrapper.
- Prefer `preset` for consistent theming instead of ad-hoc inline styles.
- Combine with `Stack` or `Surface` for layout and spacing helpers.

---

> **Tip:** Use `Box` to scope context-aware styling. It works seamlessly with the valet theming engine.