# `<FormControl />`

valet’s **typed form wrapper**.

`FormControl` wires a [Zustand](https://github.com/pmndrs/zustand) store created by `createFormStore()` to an HTML `<form>` element, exposing the store to any descendant via `useForm()` and firing a strongly‑typed `onSubmitValues` callback.

> `FormControl` itself is purposely *invisible*—layout and spacing are up to you.
> Pair it with `Stack`, `Box`, or your own containers to suit the design.

---

## Examples

### Basic login form

```jsx
import React from 'react';
import { FormControl }  from '../components/FormControl';
import { TextField }    from '../components/TextField';
import { Button }       from '../components/Button';
import { Box }       from '../components/Box';
import { createFormStore } from '../system/createFormStore';

// Create a typed store once, outside the component
const useLoginForm = createFormStore({ email: '', password: '' });

function LoginForm() {
  const handleSubmit = (values) => {
    console.log('✔︎ values', values);   // { email, password }
  };

  return (
    <Box style={{backgroundColor: "#666", padding: "24px"}}>
      <FormControl useStore={useLoginForm} onSubmitValues={handleSubmit}>
        <TextField name="email"    label="Email" />
        <TextField name="password" label="Password" type="password" />
        <br/>
        <Button type="submit">Sign in</Button>
      </FormControl>
    </Box>
  );
}

<LoginForm />;
```

---

## Props

| Name            | Type                                                                                               | Default | Description                                                                                                     |
|-----------------|-----------------------------------------------------------------------------------------------------|---------|-----------------------------------------------------------------------------------------------------------------|
| `useStore`      | `UseBoundStore<StoreApi<FormStore<T>>>`                                                             | —       | The **Zustand hook** returned by `createFormStore(initialValues)`. This drives all field state and helpers.     |
| `onSubmitValues`| `(values: T, event: React.FormEvent<HTMLFormElement>) => void`                                      | —       | Called *after* the native submit is intercepted—gives you strongly‑typed values.                                |
| `preset`        | `string` · `string[]`                                                                               | —       | One or more preset style classes returned by `definePreset()`.                                                  |
| *(rest)*        | All native `<form>` props <br/>(except `onSubmit`)                                                  | —       | Passed straight through to the underlying `<form>` element.                                                     |

---

> **Tip:** Inside any descendant component call `useForm<MyValues>()` to access _typed_ helpers like `values`, `setField()`, and `reset()`. No prop‑drilling required.

---

## Related

* **`TextField`** – consumes the store automatically when placed inside a `FormControl`.
* **`createFormStore`** – one‑liner utility that yields a typed Zustand store for your form.
* **`useForm`** – public hook to consume the nearest form store.
