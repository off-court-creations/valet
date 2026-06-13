// ─────────────────────────────────────────────────────────────
// dx/type-tests/button-polymorphic.test-d.ts  | valet
// compile-time probe: polymorphic Button/IconButton are sound.
// Behavior props are component-owned; element attributes flow
// from PropsOf<E>, so `as='a'` means anchor attributes and
// anchor-typed handlers — dual-direction (positive + negative).
//
// Run against the BUILT package (the orchestrator's post-build gate):
//   npx tsc -p dx/type-tests/tsconfig.json
// Run against src/ directly (pre-build verification):
//   npx tsc -p dx/type-tests/tsconfig.src.json
// Exit 0 + no output = the polymorphic contract holds.
// ─────────────────────────────────────────────────────────────
import { Button, IconButton } from '@archway/valet';
import type { ButtonProps, IconButtonProps } from '@archway/valet';

/* ─── Button: default element keeps the full button surface ──── */
Button({
  variant: 'outlined',
  intent: 'primary',
  size: 'lg',
  fullWidth: true,
  preset: 'probe',
  sx: { margin: '1rem', '--valet-accent': '#abc' },
  style: { marginTop: 4 },
  type: 'submit',
  disabled: true,
  onClick: (e) => {
    const el: HTMLButtonElement = e.currentTarget;
    void el;
  },
  children: 'Save',
});

/* ─── Button as anchor: anchor attributes flow from PropsOf<'a'> ─ */
Button({
  as: 'a',
  href: 'https://example.com',
  target: '_blank',
  rel: 'noreferrer',
  variant: 'plain',
  intent: 'secondary',
  onClick: (e) => {
    const el: HTMLAnchorElement = e.currentTarget;
    void el;
  },
  children: 'Open',
});

/* ─── Button negative probes (the pre-fix unsound combinations) ─ */
Button({
  as: 'a',
  href: '#',
  // @ts-expect-error anchors have no `disabled` attribute
  disabled: true,
});
Button({
  as: 'a',
  href: '#',
  // @ts-expect-error the runtime strips `type` on anchors — refuse submit semantics
  type: 'submit',
});
Button({
  as: 'a',
  href: '#',
  onClick: (e) => {
    // @ts-expect-error currentTarget is the anchor, not a button
    const el: HTMLButtonElement = e.currentTarget;
    void el;
  },
});
Button({
  onClick: (e) => {
    // @ts-expect-error a plain Button is not an anchor
    const el: HTMLAnchorElement = e.currentTarget;
    void el;
  },
});

/* ─── ButtonProps resolves per element type ──────────────────── */
const anchorButtonProps: ButtonProps<'a'> = { as: 'a', href: '#', variant: 'outlined' };
const buttonHref: ButtonProps<'a'>['href'] = 'https://example.com';
declare const defaultButtonProps: ButtonProps;
const defaultType: 'submit' | 'reset' | 'button' | undefined = defaultButtonProps.type;

/* ─── IconButton: same contract, icon-specific own props ─────── */
IconButton({
  icon: 'mdi:home',
  variant: 'outlined',
  intent: 'primary',
  size: 'sm',
  'aria-label': 'Home',
  type: 'button',
  disabled: true,
  onClick: (e) => {
    const el: HTMLButtonElement = e.currentTarget;
    void el;
  },
});
IconButton({
  as: 'a',
  href: 'https://example.com',
  svg: 'M0 0h24v24H0z',
  'aria-label': 'Open',
  onClick: (e) => {
    const el: HTMLAnchorElement = e.currentTarget;
    void el;
  },
});

/* ─── IconButton negative probes ─────────────────────────────── */
IconButton({
  as: 'a',
  href: '#',
  'aria-label': 'Nope',
  // @ts-expect-error anchors have no `disabled` attribute
  disabled: true,
});
IconButton({
  as: 'a',
  href: '#',
  'aria-label': 'Nope',
  // @ts-expect-error the runtime strips `type` on anchors — refuse submit semantics
  type: 'submit',
});
IconButton({
  as: 'a',
  href: '#',
  'aria-label': 'Nope',
  onClick: (e) => {
    // @ts-expect-error currentTarget is the anchor, not a button
    const el: HTMLButtonElement = e.currentTarget;
    void el;
  },
});

/* ─── IconButtonProps stays importable as the resolved alias ─── */
const anchorIconButtonProps: IconButtonProps<'a'> = { as: 'a', href: '#', icon: 'mdi:home' };
declare const defaultIconButtonProps: IconButtonProps;
const iconButtonDisabled: boolean | undefined = defaultIconButtonProps.disabled;

/* keep every binding observed so noUnusedLocals-style review stays quiet */
void anchorButtonProps;
void buttonHref;
void defaultType;
void anchorIconButtonProps;
void iconButtonDisabled;
