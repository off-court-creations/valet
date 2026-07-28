---
name: valet-directional-navigation
description: Build, adapt, or review @archway/valet menus for device-neutral directional input such as gamepads, TV remotes, rotary controls, kiosks, and accessibility switches. Use when wiring logical navigation intents to useDirectionalNavigation or createDirectionalNavigation, defining scope and portal behavior, or validating focus and activation. Do not use for generic keyboard-focus work or physical-device polling, mappings, thresholds, and repeat timing.
---

# Valet Directional Navigation

Keep the product boundary explicit: applications translate physical input into logical UI intents; valet owns scoped DOM-focus movement and activation.

## Ground the work

1. Call `valet__get_primer`.
2. Call `valet__check_version_parity`.
3. Inspect each valet control used by the menu with `valet__get_component` and, when useful, `valet__get_examples`.
4. Read the repository's local instructions and existing focus or overlay conventions before editing a valet checkout.

Do not infer a component prop or role from memory. Before returning valet JSX, call `valet__validate_jsx` and resolve every diagnostic.

## Preserve the ownership boundary

Keep all device-specific work in an external adapter:

- Polling controllers or platform APIs
- Mapping buttons, axes, remote key codes, wheels, and switches
- Dead zones, debounce, repeat timing, and long-press behavior
- Back, Escape, Menu, Home, gameplay actions, and platform policy

The adapter should call only logical UI operations:

```ts
const handled = navigation.move('up');
const activated = navigation.activate();
```

Use the boolean result to fall back to gameplay or application behavior. Do not add controller, remote, or rotary dependencies to valet.

## Choose the integration

Use the React hook inside components:

```tsx
const menuRef = useRef<HTMLDivElement>(null);
const navigation = useDirectionalNavigation({ scope: menuRef });

return (
  <Stack ref={menuRef}>
    <Button onClick={startGame}>Start game</Button>
    <IconButton aria-label='Settings' onClick={openSettings}>
      <Icon icon='mdi:cog' />
    </IconButton>
  </Stack>
);
```

Use `createDirectionalNavigation` for a non-React adapter or imperative integration, and call `dispose()` during teardown.

The scope must be an `HTMLElement`, a live `{ current }` ref, a getter, or `null`. Prefer refs or getters when the node may mount late or be replaced. There is no document-wide default; an absent, unmounted, or disconnected scope returns `false`.

## Design focus movement

- Keep real DOM focus as the source of truth. Do not add a parallel selection index.
- Use `next` and `previous` for deterministic tab-order traversal.
- Use `up`, `down`, `left`, and `right` for geometry-based traversal.
- Let an initial intent enter the scope according to the requested direction.
- Expect candidate discovery at intent time; removed, disabled, hidden, inert, `aria-disabled`, disconnected, non-rendered, and negative-tab-index targets are ineligible.
- Do not install arrow-key listeners. Existing keyboard and composite-widget behavior stays authoritative.
- Do not add observers or per-frame measurement for navigation. Geometry is read only when an intent arrives.

For nested navigators, add `data-valet-navigation-exclude='true'` to the nested scope root when the outer navigator must skip it. Give portalled dialogs, drawers, and menus their own navigator scoped to the portalled DOM root. The application decides which mounted navigator receives an intent.

## Activate conservatively

`activate()` calls native `.click()` only for the current eligible action inside the scope. Prefer native buttons, links, form controls, and correct interactive roles.

- Use `data-valet-navigation-activate='true'` only for a deliberately focusable custom action.
- Use `data-valet-navigation-activate='false'` to keep a target focusable but non-activatable.
- Never make an arbitrary container activatable merely because it has `tabIndex`.
- Preserve the focused control's authentic submit, reset, checkbox, radio, and link behavior.

Document that `.click()` creates an untrusted event, does not fabricate pointer coordinates, may not reproduce physical `:active` or ripple feedback, and can be rejected by security-gated browser APIs.

## Handle ownership and cleanup

- `clear()` removes this navigator's marker and blurs only the exact focus it still owns.
- `dispose()` removes listeners and ownership without blurring.
- Blur, teardown, and the next pointer or keyboard interaction remove the navigation-focus marker without erasing legitimate focus.
- Do not create a global active-navigator singleton or a new focus trap.

## Verify the result

Cover sequential and four-way movement, initial entry, ties, no-candidate results, scope isolation, dynamic removal or disabling, activation rejection, native Button and IconButton handlers, marker cleanup, pointer and keyboard coexistence, StrictMode teardown, and nested or multiple navigators.

When working in the valet repository, follow its named-test conventions and complete its required quality gates in order. Describe adapter snippets as illustrative external application code, never as valet dependencies.
