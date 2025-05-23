# `<TextField />`

valet’s styled **text input** component.

`TextField` works inside a `FormControl` but also falls back to uncontrolled mode when used on its own.

* Renders an `<input>` (single‑line) or a `<textarea>` (multiline)  
* Integrates with the nearest `FormControl` store via `name`  
* Supports floating `label`, helper or error text, and presets

---

## Examples

### Inside a form

```jsx
import { FormControl }  from '../components/FormControl';
import { TextField }    from '../components/TextField';
import { Button }       from '../components/Button';
import { createFormStore } from '../system/createFormStore';
import { Box } from '../components/Box';

const useContact = createFormStore({ email: '', message: '' });

function ContactForm() {
  const send = (values) => console.log(values);
  return (
    <Box style={{padding: "12px", backgroundColor: "#666"}}>
      <FormControl useStore={useContact} onSubmitValues={send}>
        <TextField name="email"   label="Email"   />
        <TextField name="message" label="Message" as="textarea" rows={4} />
        <Button type="submit">Send</Button>
      </FormControl>
    </Box>
  );
}

<ContactForm />;
```

### Stand‑alone input

```jsx
import { TextField } from '../components/TextField';
import { Box } from '../components/Box';

<Box style={{padding: "12px", backgroundColor: "#666"}}>
  <TextField name="search" label="Search" />;
</Box>
```

### Error state

```jsx
import { Box } from '../components/Box';

<Box style={{padding: "12px", backgroundColor: "#666"}}>
  <TextField
    name="email"
    label="Email"
    error
    helperText="Invalid address"
  />
</Box>
```

---

## Props

| Name        | Type                                             | Default   | Description                                                      |
|-------------|--------------------------------------------------|-----------|------------------------------------------------------------------|
| `name`*     | `string`                                         | —         | Field key inside the parent form store (or uncontrolled name).   |
| `as`        | `'input'` · `'textarea'`                         | `'input'` | Choose single‑line or multiline element.                         |
| `rows`      | `number`                                         | —         | Convenience prop for `<textarea>` height.                        |
| `label`     | `string`                                         | —         | Optional floating label text.                                    |
| `helperText`| `string`                                         | —         | Helper or error copy below the field.                            |
| `error`     | `boolean`                                        | `false`   | Toggles error colors for border and helper text.                 |
| `preset`    | `string` · `string[]`                            | —         | Style preset(s) from `definePreset()`.                           |
| *(rest)*    | All native `<input>` / `<textarea>` props        | —         | Passed straight through to the rendered element.                 |

\* **required**

---

> **Tip:** Combine `error` with validation logic inside `FormControl` to surface inline feedback automatically.

---

## Related

* **`FormControl`** – typed provider that connects fields to a Zustand store.
* **`createFormStore`** – helper to create the form store used by `FormControl`.
