# `<Stack />`

valet’s one‑dimensional **flexbox helper**.  
`Stack` arranges direct children in a row or column and applies a consistent `gap`, eliminating ad‑hoc margins.

* Row or column layout via `direction`
* Gap size can reference the theme’s spacing tokens or any CSS length
* Supports style presets through `preset`

---

## Examples

### Vertical stack (default)

```jsx
import { Stack }      from '../components/Stack';
import { Button } from '../components/Button';
import { Box } from "../components/Box";

<Box style={{padding: "12px", backgroundColor: "#666"}}>
  <Stack spacing="md">
    <Button variant="main">Accept</Button>
    <Button variant="alt">Decline</Button>
  </Stack>
</Box>
```

### Horizontal stack with custom gap

```jsx
import { Stack }  from '../components/Stack';
import { Button } from '../components/Button';
import { Box } from "../components/Box";

<Box style={{padding: "12px", backgroundColor: "#666"}}>
  <Stack direction="row" spacing="24px">
    <Button variant="main">Accept</Button>
    <Button variant="alt">Decline</Button>
  </Stack>
</Box>
```

---

## Props

| Name       | Type                                   | Default   | Description                                                                      |
|------------|----------------------------------------|-----------|----------------------------------------------------------------------------------|
| `direction`| `'row'` · `'column'`                   | `'column'`| Layout axis.                                                                     |
| `spacing`  | `keyof Theme['spacing']` · `string`    | `'0'`     | Gap between items – design token or any CSS length.                              |
| `preset`   | `string` · `string[]`                  | —         | Style preset(s) from `definePreset()`.                                           |
| *(rest)*   | All native `<div>` props               | —         | Forwarded to the underlying flex container.                                      |

---

> **Tip:** Need a quick button group? Use `direction="row"` with `spacing="sm"` and let `Stack` handle alignment and gap.
