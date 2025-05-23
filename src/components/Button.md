# `<Button />`

valet’s **primary actionable element**. A flexible `<button>` wrapper that:

- Offers two visual styles via `variant`: **`"contained"`** (solid) and **`"outlined"`** (transparent with border).
- Comes in three **sizes** (`"sm"`, `"md"`, `"lg"`) that scale padding, height, and font-size.
- Can **stretch to the full container width** with `fullWidth`.
- Integrates with valet’s **style preset** system through the `preset` prop.
- Implements an **ink‑ripple press effect** and gentle scale on tap / click.
- Prevents text selection on mobile for a native‑app feel (`user‑select: none`).
- Accepts **all native `<button>` props** (e.g. `onClick`, `type`, `disabled`, `style`, etc.).

Use `Button` for any discrete action before reaching for more specialised controls like `IconButton` or `ToggleButton`.

---

## Usage

### Default (contained, md)

```tsx
import Button from "./Button";
import Typography from "./Typography";
import Surface from "./Surface";
import { useTheme } from "../system/themeStore";

const { theme } = useTheme();

<Surface fullscreen={false} style={{padding: theme.spacing.md}}>
  <Button>
    <Typography>
      Save changes
    </Typography>
  </Button>
</Surface>
```

### Outlined alternative

```tsx
import Button from "./Button";
import Typography from "./Typography";
import Surface from "./Surface";
import { useTheme } from "../system/themeStore";

const { theme } = useTheme();

<Surface fullscreen={false} style={{padding: theme.spacing.md}}>
  <Button variant="outlined">
    <Typography>
      Cancel
    </Typography>
  </Button>
</Surface>

```

### Small + disabled inside a `Stack`

```tsx
import Button from "./Button";
import Typography from "./Typography";
import Stack from "./Stack";
import Surface from "./Surface";
import { useTheme } from "../system/themeStore";

const { theme } = useTheme();

<Surface fullscreen={false} style={{padding: theme.spacing.md}}>
  <Stack spacing="sm">
    <Button size="sm" disabled>
      <Typography>
        Processing…
      </Typography>
    </Button>
    <Button size="sm">
      <Typography>
        Retry
      </Typography>
    </Button>
  </Stack>
</Surface>
```

### Full‑width primary action in a dialog footer

```tsx
import Button from "./Button";
import Surface from "./Surface";
import Typography from "./Typography";
import { useTheme } from "../system/themeStore";

const { theme } = useTheme();

<Surface fullscreen={false} style={{ padding: theme.spacing.md }}>
  <Button>
    <Typography>
      Continue
    </Typography>
  </Button>
</Surface>
```

### Themed background showcase

```tsx
import Surface from "./Surface";
import Button from "./Button";
import Typography from "./Typography";
import { useTheme } from "../system/themeStore";

const { theme } = useTheme();

<Surface fullscreen={false} style={{ backgroundColor: theme.colors.primary, padding: theme.spacing.md }}>
  <Button variant="outlined">
    <Typography>
      Outlined on primary background
    </Typography>
  </Button>
</Surface>
```

---

## Props

| Name        | Type                                     | Default   | Description                                                                                              |
|-------------|------------------------------------------|-----------|----------------------------------------------------------------------------------------------------------|
| `variant`   | `"contained"` - `"outlined"`           | `contained` | Visual style of the button. `"contained"` renders a solid fill; `"outlined"` renders a transparent background with a 1 px border. |
| `size`      | `"sm"` - `"md"` - `"lg"`            | `md`      | Overall control dimensions (padding, height, font‑size). |
| `fullWidth` | `boolean`                                | `false`   | When `true`, the button stretches to `width: 100%` and aligns itself inside flex layouts. |
| `preset`    | `string` or `string[]` (optional)        | —         | One or more preset names (defined via `definePreset()`), applied as CSS classes for custom theming. |
| `style`     | `React.CSSProperties`                    | —         | Inline styles forwarded to the underlying `<button>`. |
| *(rest)*    | `...React.ButtonHTMLAttributes<HTMLButtonElement>` | — | Any other native `<button>` props (e.g. `id`, `onPointerDown`, `form`) are forwarded. |

---

## Colour Logic & Ripple

- **Contained buttons** use `theme.colors.primary` as the background and `theme.colors.text` for text. On hover the background brightens by 25 % and the ripple colour is translucent white.
- **Outlined buttons** draw a 1 px border in the current text colour and adopt `theme.colors.primary` + `theme.colors.primaryText` on hover. The ripple colour is a subtle translucent black.
- The component emits `--valet-text-color` for descendant elements, enabling nested icons or text to inherit the proper colour automatically.

---

## Accessibility & Best Practices

- Always supply an explicit `type` (`"button"`, `"submit"`, or `"reset"`) to avoid accidental form submission.
- Use the `disabled` prop to indicate a non‑interactive state; it automatically removes hover / active styles and the ripple effect.
- When the button performs a **destructive action**, consider adding `aria-label` text like `"Delete account"` if the visible label is ambiguous.
- Combine with `Stack` for consistent spacing between groups of buttons.

---

> **Tip:** For icon‑only actions, create an `IconButton` wrapper using the same variant / size system for visual consistency.